import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai";

export type AnalysisMode = "summary" | "structure" | "rewrite" | "exam";
export type DocumentType = "policy" | "business_plan" | "study_material" | "news" | "meeting_report" | "general";

export type DetailSection = {
  title: string;
  content: string;
};

export type DocumentSummaryResult = {
  documentType: DocumentType;
  coreSummary: string;
  keyPoints: string[];
  detailSections: DetailSection[];
  conclusion: string;
};

function normalizeText(input: string): string {
  return input.replace(/\r/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

function safeJsonParse<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first >= 0 && last > first) return JSON.parse(raw.slice(first, last + 1)) as T;
    throw new Error("요약 JSON 파싱에 실패했습니다.");
  }
}

function fallbackSummary(text: string): DocumentSummaryResult {
  const normalized = normalizeText(text);
  const lines = normalized.split("\n").map((v) => v.trim()).filter(Boolean);
  const head = lines.slice(0, 6).join(" ");
  const points = lines.slice(0, 5).map((v) => v.slice(0, 110));
  return {
    documentType: "general",
    coreSummary: head.slice(0, 280) || "문서 핵심 정보를 추출하지 못했습니다. 입력 내용을 확인해 주세요.",
    keyPoints: points.length ? points : [normalized.slice(0, 120)],
    detailSections: [
      { title: "핵심 내용", content: normalized.slice(0, 450) },
      { title: "보완 필요", content: "정확한 구조 요약을 위해 문장 단락이 포함된 원문 텍스트를 입력해 주세요." },
    ],
    conclusion: "이 문서는 핵심 정보 추출이 가능하지만, 구조적 요약을 위해 더 명확한 원문이 필요합니다.",
  };
}

function validate(result: DocumentSummaryResult): boolean {
  if (!result.coreSummary || result.coreSummary.length < 30) return false;
  if (!Array.isArray(result.keyPoints) || result.keyPoints.length < 4) return false;
  if (!Array.isArray(result.detailSections) || result.detailSections.length < 2) return false;
  if (!result.conclusion || result.conclusion.length < 15) return false;
  if (/(쉽게 이해|한 단계씩|왜냐하면|우리|아주 쉽게)/.test(result.coreSummary + result.conclusion)) return false;
  return true;
}

export async function generateDocumentSummary(inputText: string, mode: AnalysisMode): Promise<DocumentSummaryResult> {
  const text = normalizeText(inputText);
  if (!text) return fallbackSummary(inputText);
  if (!isOpenAIConfigured()) return fallbackSummary(text);

  const client = getOpenAIClient();
  const prompt = `당신은 성인 실무자를 위한 문서 분석가다.
목표: 원문 기반으로 구조화된 브리핑 결과를 만든다.

절대 금지 문체:
- 우리가 어려워하는 주제는
- 아주 쉽게 이해해볼게요
- 한 단계씩 볼게요
- 쉽게 말하면
- 왜냐하면

문체 규칙:
- 보고서/브리핑 문체
- 단정한 문장, 구어체/감탄/코치 말투 금지
- 원문의 숫자, 기관명, 정책명, 목표치를 보존
- 문서에 없는 내용 상상 금지

문서 유형(documentType) 분류:
- policy (정책/정부 발표)
- business_plan (사업계획서/제안서)
- study_material (학습/시험 자료)
- news (기사/보도자료)
- meeting_report (회의/보고 문서)
- general (기타)

모드: ${mode}
모드별 지침:
- summary: 핵심 사실/결론 우선
- structure: 주장 흐름, 근거, 결론의 논리 구조 우선
- rewrite: 쉬운 표현 사용 가능하나 성인 업무 문체 유지
- exam: 암기 포인트, 키워드, 숫자, 기관명 강조

정책/기사형(policy/news) 문서는 가능하면 아래를 우선 추출:
- 정책 목표
- 추진 배경
- 핵심 지원 내용
- 이해관계자/현장 의견
- 후속 계획 또는 기대 효과

출력 JSON 형식(추가 텍스트 금지):
{
  "documentType":"policy|business_plan|study_material|news|meeting_report|general",
  "coreSummary":"2~4문장, 문서 핵심 압축",
  "keyPoints":["실제 문서 기반 bullet 4~6개"],
  "detailSections":[
    {"title":"소제목","content":"문단"},
    {"title":"소제목","content":"문단"}
  ],
  "conclusion":"이 문서는 결국 무엇을 말하는가 한 줄"
}

원문:
"""
${text}
"""`;

  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: "결과는 JSON만 반환한다." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const raw = resp.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== "string") return fallbackSummary(text);

  const parsed = safeJsonParse<DocumentSummaryResult>(raw);
  const normalized: DocumentSummaryResult = {
    documentType: parsed.documentType ?? "general",
    coreSummary: String(parsed.coreSummary ?? "").trim(),
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.map((v) => String(v).trim()).filter(Boolean) : [],
    detailSections: Array.isArray(parsed.detailSections)
      ? parsed.detailSections
          .map((s) => ({ title: String(s?.title ?? "").trim(), content: String(s?.content ?? "").trim() }))
          .filter((s) => s.title && s.content)
      : [],
    conclusion: String(parsed.conclusion ?? "").trim(),
  };

  if (!validate(normalized)) return fallbackSummary(text);
  return normalized;
}
