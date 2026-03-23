import { buildPanelsPrompt, type ComicPanel, type ComicPanelsJSON, type MenuId } from "@/lib/comicPrompt";
import { buildFallbackPanels } from "@/lib/fallbackComic";
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai";
import { getMeaningPreservationNotes } from "@/lib/preserveMeaning";

type RawPanel = {
  title?: string;
  caption?: string;
  learningPoint?: string;
  learning_point?: string;
  learning_goal?: string;
  sceneType?: string;
  scene_type?: string;
  scene?: string;
  requiredObjects?: string[];
  required_objects?: string[];
  requiredEvidenceElements?: string[];
  required_evidence_elements?: string[];
  evidence_elements?: string[];
  environment?: string;
  location?: string;
  peopleRoles?: string[];
  people_roles?: string[];
  actors?: string[];
  visibleCauseEffect?: string;
  visible_cause_effect?: string;
  visible_change?: string;
  visibleDataElements?: string[];
  visible_data_elements?: string[];
  imagePrompt?: string;
  image_prompt?: string;
};

type GenerateComicPanelsOptions = {
  previousEvidencePlanHint?: string;
};

type ChatCompletionResponseLike = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

function readText(panel: RawPanel, ...keys: Array<keyof RawPanel>): string {
  for (const key of keys) {
    const value = panel[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

function readList(panel: RawPanel, ...keys: Array<keyof RawPanel>): string[] {
  for (const key of keys) {
    const value = panel[key];
    if (isStringArray(value)) return value;
  }
  return [];
}

function normalizePanel(panel: RawPanel): ComicPanel {
  return {
    title: String(readText(panel, "title")).trim(),
    caption: String(readText(panel, "caption")).trim(),
    learningPoint: String(readText(panel, "learningPoint", "learning_point", "learning_goal")).trim(),
    sceneType: String(readText(panel, "sceneType", "scene_type")).trim(),
    scene: String(readText(panel, "scene")).trim(),
    requiredObjects: readList(panel, "requiredObjects", "required_objects"),
    requiredEvidenceElements: readList(panel, "requiredEvidenceElements", "required_evidence_elements", "evidence_elements"),
    environment: String(readText(panel, "environment", "location")).trim(),
    peopleRoles: readList(panel, "peopleRoles", "people_roles", "actors"),
    visibleCauseEffect: String(readText(panel, "visibleCauseEffect", "visible_cause_effect", "visible_change")).trim(),
    visibleDataElements: readList(panel, "visibleDataElements", "visible_data_elements"),
    imagePrompt: String(readText(panel, "imagePrompt", "image_prompt")).trim(),
  };
}

function getMessageContent(response: unknown): string {
  if (typeof response !== "object" || response === null) return "";
  const parsed = response as ChatCompletionResponseLike;
  const content = parsed.choices?.[0]?.message?.content;
  return typeof content === "string" ? content : "";
}

function getTopicKeywords(inputText: string): string[] {
  const stop = new Set(["그리고", "하지만", "또는", "입니다", "있는", "하는", "해야", "the", "and", "with", "that", "this", "from", "into"]);
  const tokens = inputText
    .toLowerCase()
    .split(/[^a-z0-9가-힣]+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !stop.has(t));
  const counts = new Map<string, number>();
  for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k]) => k);
}

function hasBusinessEvidence(text: string): boolean {
  return /price|가격|menu|메뉴|map|지도|customer|고객|flow|동선|schedule|일정|pilot|시범|test operation|테스트 운영|sales|매출|chart|그래프|feedback|피드백|competitor|경쟁/.test(
    text,
  );
}

function isValidCaption(caption: string): boolean {
  if (caption.length > 90) return false;
  if (/(이해해볼게요|쉽게|간단히|그냥|따라|정리해볼게요|알아볼게요|보여줄게요)/i.test(caption)) return false;
  return /(때문에|유발|원인|결과|영향|변화|증가|감소|열|온도|기온|배출)/i.test(caption);
}

function isValidImagePrompt(prompt: string): boolean {
  if (!/(\\d+\\s*%|\\d+\\s?(°C|℃|C)|\\d+(\\.\\d+)?\\s?(percent|percentage)|\\b\\d+\\b)/i.test(prompt)) return false;
  if (!/(a\\s+|사람|학생|직원|사용자|공장|정부|사내|기관|환자|고객|사람들)/i.test(prompt)) return false;
  if (/(lightbulb|star|gear|abstract|icon|symbol|diagra?m)/i.test(prompt)) return false;
  return true;
}

function validateSinglePanel(panel: ComicPanel, topicKeywords: string[], menu: MenuId): boolean {
  if (
    !panel.title ||
    !panel.caption ||
    !panel.learningPoint ||
    !panel.sceneType ||
    !panel.scene ||
    !panel.environment ||
    !panel.visibleCauseEffect ||
    !panel.imagePrompt
  ) {
    return false;
  }

  if (!panel.requiredObjects.length || !panel.requiredEvidenceElements.length || !panel.peopleRoles.length || !panel.visibleDataElements.length) {
    return false;
  }

  if (!isValidCaption(panel.caption)) return false;
  if (!/(누가|무엇|행동|상태|결과)/.test(panel.scene)) return false;
  if (!isValidImagePrompt(panel.imagePrompt)) return false;

  const topicPool = [
    panel.title,
    panel.caption,
    panel.scene,
    panel.learningPoint,
    panel.imagePrompt,
    ...panel.requiredObjects,
    ...panel.requiredEvidenceElements,
  ]
    .join(" ")
    .toLowerCase();
  if (topicKeywords.length > 0 && !topicKeywords.some((k) => topicPool.includes(k))) return false;

  if (menu === "business") {
    const businessPool = [
      ...panel.requiredObjects,
      ...panel.requiredEvidenceElements,
      ...panel.visibleDataElements,
      panel.imagePrompt,
      panel.scene,
      panel.caption,
      panel.learningPoint,
    ]
      .join(" ")
      .toLowerCase();
    if (!hasBusinessEvidence(businessPool)) return false;
  }

  return true;
}

function validatePanels(panels: ComicPanel[], topicKeywords: string[], menu: MenuId): boolean {
  if (!Array.isArray(panels) || panels.length !== 4) return false;
  if (!panels.every((panel) => validateSinglePanel(panel, topicKeywords, menu))) return false;

  const signatures = panels.map((panel) => panel.imagePrompt.replace(/\s+/g, " ").slice(0, 140));
  return new Set(signatures).size === 4;
}

export async function generateComicPanels(
  inputText: string,
  menu: MenuId,
  options?: GenerateComicPanelsOptions,
): Promise<ComicPanel[]> {
  if (!isOpenAIConfigured()) return buildFallbackPanels(inputText, menu);

  const client = getOpenAIClient();
  const topicKeywords = getTopicKeywords(inputText);
  const meaningNotes = await getMeaningPreservationNotes(inputText, menu);

  let prompt = buildPanelsPrompt(inputText, menu, meaningNotes);
  if (options?.previousEvidencePlanHint) {
    prompt +=
      `\n\n재생성 지시(중요):\n` +
      `아래는 이전 evidence plan 요약이다. 이번에는 같은 evidence 조합/장면 구성을 반복하지 말고,\n` +
      `먼저 새로운 evidence plan을 다시 설계한 뒤 그 계획으로 image_prompt를 작성해라.\n` +
      `이전 evidence plan:\n${options.previousEvidencePlanHint}\n`;
  }

  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: "너는 쉬운 설명을 만드는 만화 작가다. 결과는 반드시 JSON만 반환한다.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const raw = getMessageContent(resp);
  if (!raw) throw new Error("패널 생성 결과를 받지 못했습니다.");

  const parsed = safeJsonParse<ComicPanelsJSON>(raw);
  const sourcePanels = parsed?.panels;
  const panels: RawPanel[] = Array.isArray(sourcePanels) ? sourcePanels : [];
  const normalized = panels.map((panel) => normalizePanel(panel));

  if (!validatePanels(normalized, topicKeywords, menu)) {
    const badIdxs = normalized.map((panel, idx) => (validateSinglePanel(panel, topicKeywords, menu) ? -1 : idx)).filter((v) => v >= 0);
    if (!badIdxs.length) return normalized;

    const retryPrompt =
      prompt +
      "\n추가 지시:\n" +
      `- panels 배열에서 아래 인덱스들(${badIdxs.join(", ")})만 교육 정보/장면/프롬프트가 부족하면 다시 생성하고, 나머지는 그대로 유지해줘.\n` +
      "- 각 bad panel은 반드시: (1) 숫자/단위 포함 (2) 원인-결과-변화가 보이게 (3) 추상 아이콘 금지 (4) caption은 사실/인과 포함.\n" +
      "- 현재 panels(참고)를 그대로 두고 bad 인덱스만 수정해서, 최종 JSON은 panels 4개를 그대로 반환해줘.\n" +
      `현재 panels:\n${JSON.stringify({ panels: normalized }, null, 2)}`;

    const retryResp = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content: "너는 정보 밀도를 지키는 시각 설명 편집자다. 결과는 반드시 JSON만 반환한다.",
        },
        { role: "user", content: retryPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const retryRaw = getMessageContent(retryResp);
    if (!retryRaw) throw new Error("패널 재시도 결과를 받지 못했습니다.");

    const retryParsed = safeJsonParse<ComicPanelsJSON>(retryRaw);
    const retrySourcePanels = retryParsed?.panels;
    const retryPanels: RawPanel[] = Array.isArray(retrySourcePanels) ? retrySourcePanels : [];
    const retryNormalized = retryPanels.map((panel) => normalizePanel(panel));
    if (!validatePanels(retryNormalized, topicKeywords, menu)) return buildFallbackPanels(inputText, menu);
    return retryNormalized;
  }

  return normalized;
}

