import { type MenuId } from "@/lib/comicPrompt";
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai";
import type { SectionAnalysis, SectionImportance } from "@/lib/sections";

function normalizeText(input: string) {
  return input.replace(/\r/g, "\n").replace(/\r\n/g, "\n").replace(/\t/g, " ").replace(/[ ]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function heuristicChunking(text: string): Array<{ title: string; chunk: string; importance: SectionImportance }> {
  const t = normalizeText(text);
  if (!t) return [];

  // 키워드 기반 분기: Problem/원인/해결/결과 같은 패턴이 있으면 그 단위를 우선 잡습니다.
  const keywordRegex = /(Problem|문제|원인|Cause|해결|Solution|결과|Result|과정|절차|절차\/과정|대응|기대)/i;
  const lines = t.split("\n").map((l) => l.trim()).filter(Boolean);

  if (lines.length < 3) {
    const title = t.slice(0, 24) + (t.length > 24 ? "..." : "");
    return [{ title: title || "핵심", chunk: t, importance: "high" }];
  }

  // 빈 줄 기준 paragraph chunking
  const paras = t.split(/\n{2,}/).map((p) => p.trim()).filter((p) => p.length > 0);
  const chunks = paras.length >= 2 ? paras : lines.join("\n");

  if (typeof chunks === "string") {
    const title = chunks.slice(0, 24) + (chunks.length > 24 ? "..." : "");
    return [{ title: title || "핵심", chunk: chunks, importance: keywordRegex.test(t) ? "high" : "medium" }];
  }

  // paras가 배열인 경우: 최대 4개까지 뽑되, 너무 짧으면 병합
  const out: Array<{ title: string; chunk: string; importance: SectionImportance }> = [];
  for (let i = 0; i < chunks.length && out.length < 4; i++) {
    const c = chunks[i];
    const title = c.split(/[.!?]\s|\n/)[0].slice(0, 24).trim();
    const importance: SectionImportance = c.length > 240 ? "high" : c.length > 120 ? "medium" : "low";
    out.push({ title: title || `섹션 ${i + 1}`, chunk: c, importance });
  }
  return out;
}

function fallbackAnalyze(text: string): SectionAnalysis[] {
  const chunks = heuristicChunking(text);
  if (!chunks.length) {
    return [
      {
        id: "s1",
        title: "핵심",
        summary: text.slice(0, 90),
        importance: "high",
        visualizable: text.trim().length > 20,
        chunkText: text,
        expectedSets: 1,
      },
    ];
  }

  const mapped = chunks.map((c, idx) => ({
    id: `s${idx + 1}`,
    title: c.title,
    summary: c.chunk.slice(0, 100) + (c.chunk.length > 100 ? "..." : ""),
    importance: c.importance,
    visualizable: c.chunk.length > 20,
    chunkText: c.chunk,
    expectedSets: 1,
  }));

  // 섹션이 하나뿐인데 visualizable이 전부 false로 떨어지면, 최소 1개는 생성 가능하게 둡니다.
  if (!mapped.some((s) => s.visualizable) && mapped.length) {
    mapped[0] = { ...mapped[0], visualizable: true };
  }

  return mapped;
}

function safeJsonParse<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first >= 0 && last > first) {
      return JSON.parse(raw.slice(first, last + 1)) as T;
    }
    throw new Error("JSON 파싱에 실패했습니다.");
  }
}

export async function analyzeSections(inputText: string, menu: MenuId): Promise<SectionAnalysis[]> {
  const normalized = normalizeText(inputText);
  if (!normalized) return [];

  if (!isOpenAIConfigured()) {
    return fallbackAnalyze(normalized);
  }

  const client = getOpenAIClient();

  // 섹션 분석은 LLM이, 실제로는 “한 섹션당 한 4패널 세트”가 되도록 chunkText를 직접 반환하게 합니다.
  const resp: any = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "너는 문서를 시각화하기 위한 편집자다. 결과는 반드시 JSON만 반환한다.",
      },
      {
        role: "user",
        content: `아래 입력을 논리적인 섹션/토픽으로 나눠줘. 각 섹션은 “한 개의 4패널 만화 세트”로 시각화 가능한 단위여야 한다.

반드시 아래 규칙을 지켜서 JSON만 출력해줘:
- sections 배열의 각 항목에는 title, summary, importance, visualizable, chunkText, expectedSets(항상 1)를 포함해줘
- chunkText는 원문에서 해당 섹션에 해당하는 내용을 그대로 담아줘(너무 짧으면 안 됨)
- sections는 너무 많지 않게 1~6개로 제한
- visualizable은 실제로 이미지화 가능하면 true, 너무 짧거나 추상적이면 false

JSON 형식:
{
  "sections": [
    {
      "title": "...",
      "summary": "...",
      "importance": "high|medium|low",
      "visualizable": true,
      "chunkText": "...",
      "expectedSets": 1
    }
  ]
}

메뉴(프롬프트 스타일): ${menu}

입력 텍스트:
\"\"\"
${normalized}
\"\"\"
`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const raw = resp?.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== "string") {
    return fallbackAnalyze(normalized);
  }

  const parsed = safeJsonParse<{ sections: any[] }>(raw);
  const arr = Array.isArray(parsed?.sections) ? parsed.sections : [];

  if (!arr.length) return fallbackAnalyze(normalized);

  const mapped: SectionAnalysis[] = arr
    .slice(0, 6)
    .map((s, idx) => {
      const importanceRaw = String(s?.importance ?? "medium") as SectionImportance;
      const importance: SectionImportance =
        importanceRaw === "high" || importanceRaw === "low" || importanceRaw === "medium" ? importanceRaw : "medium";
      const chunkText = String(s?.chunkText ?? "").trim();
      return {
        id: `s${idx + 1}`,
        title: String(s?.title ?? `섹션 ${idx + 1}`).trim(),
        summary: String(s?.summary ?? chunkText.slice(0, 100)).trim(),
        importance,
        visualizable: Boolean(s?.visualizable),
        chunkText: chunkText,
        expectedSets: 1,
      };
    })
    .filter((s) => s.chunkText.length > 10);

  if (!mapped.length) return fallbackAnalyze(normalized);
  return mapped;
}

