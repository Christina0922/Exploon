import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai";
import type { MenuId } from "@/lib/comicPrompt";

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

export async function getMeaningPreservationNotes(sectionText: string, menu: MenuId): Promise<string> {
  if (!isOpenAIConfigured()) return "";

  const client = getOpenAIClient();

  const resp: any = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "너는 의미 보존을 꼼꼼히 점검하는 편집자다. JSON만 반환한다.",
      },
      {
        role: "user",
        content: `다음 섹션 텍스트를 시각화할 때 중요한 의미가 누락되지 않도록, 반드시 반영해야 할 핵심 주장/조건/제약/예외를 정리해줘.
결과는 아래 JSON만 출력해줘.
JSON 형식:
{
  "coreClaim": "...",
  "requiredConditions": ["..."],
  "nonNegotiableDetails": ["..."],
  "oversimplificationRisks": ["..."],
  "mustNotOmit": ["..."]
}

섹션 타입 스타일(메뉴): ${menu}

섹션 텍스트:
\"\"\"
${sectionText}
\"\"\"
`,
      },
    ],
    response_format: { type: "json_object" },
  });

  const raw = resp?.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== "string") return "";

  const parsed = safeJsonParse<any>(raw);
  const coreClaim = String(parsed?.coreClaim ?? "").trim();
  const requiredConditions: string[] = Array.isArray(parsed?.requiredConditions) ? parsed.requiredConditions : [];
  const nonNegotiableDetails: string[] = Array.isArray(parsed?.nonNegotiableDetails) ? parsed.nonNegotiableDetails : [];
  const oversimplificationRisks: string[] = Array.isArray(parsed?.oversimplificationRisks)
    ? parsed.oversimplificationRisks
    : [];
  const mustNotOmit: string[] = Array.isArray(parsed?.mustNotOmit) ? parsed.mustNotOmit : [];

  // 패널 프롬프트에 그대로 삽입될 수 있게 “메모” 형태 문자열로 구성합니다.
  const lines: string[] = [];
  if (coreClaim) lines.push(`핵심 주장: ${coreClaim}`);
  if (requiredConditions.length) lines.push(`필수 조건: ${requiredConditions.join(", ")}`);
  if (nonNegotiableDetails.length) lines.push(`넌-지어블 디테일: ${nonNegotiableDetails.join(", ")}`);
  if (oversimplificationRisks.length) lines.push(`과단순화 위험: ${oversimplificationRisks.join(", ")}`);
  if (mustNotOmit.length) lines.push(`꼭 빼면 안 됨: ${mustNotOmit.join(", ")}`);

  return lines.join("\n");
}

