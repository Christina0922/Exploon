import { buildPanelsPrompt, type ComicPanel, type ComicPanelsJSON, type MenuId } from "@/lib/comicPrompt";
import { getOpenAIClient } from "@/lib/openai";
import { isOpenAIConfigured } from "@/lib/openai";
import { buildFallbackPanels } from "@/lib/fallbackComic";
import { getMeaningPreservationNotes } from "@/lib/preserveMeaning";

function safeJsonParse<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    // 모델이 앞/뒤에 설명을 붙이는 경우를 대비합니다.
    const first = raw.indexOf("{");
    const last = raw.lastIndexOf("}");
    if (first >= 0 && last > first) {
      const slice = raw.slice(first, last + 1);
      return JSON.parse(slice) as T;
    }
    throw new Error("JSON 파싱에 실패했습니다.");
  }
}

function getTopicKeywords(inputText: string): string[] {
  const stop = new Set([
    "그리고",
    "하지만",
    "또는",
    "입니다",
    "있는",
    "하는",
    "해야",
    "the",
    "and",
    "with",
    "that",
    "this",
    "from",
    "into",
  ]);
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

type GenerateComicPanelsOptions = {
  previousEvidencePlanHint?: string;
};

export async function generateComicPanels(
  inputText: string,
  menu: MenuId,
  options?: GenerateComicPanelsOptions,
): Promise<ComicPanel[]> {
  if (!isOpenAIConfigured()) {
    return buildFallbackPanels(inputText, menu);
  }

  const client = getOpenAIClient();
  const topicKeywords = getTopicKeywords(inputText);

  const meaningNotes = await getMeaningPreservationNotes(inputText, menu);

  let prompt = buildPanelsPrompt(inputText, menu, meaningNotes);
  if (options?.previousEvidencePlanHint) {
    prompt += `\n\n재생성 지시(중요):\n` +
      `아래는 이전 evidence plan 요약이다. 이번에는 같은 evidence 조합/장면 구성을 반복하지 말고,\n` +
      `먼저 새로운 evidence plan을 다시 설계한 뒤 그 계획으로 image_prompt를 작성해라.\n` +
      `이전 evidence plan:\n${options.previousEvidencePlanHint}\n`;
  }

  const resp: any = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content:
          "너는 쉬운 설명을 만드는 만화 작가다. 결과는 반드시 JSON만 반환한다.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const raw = resp?.choices?.[0]?.message?.content;
  if (!raw || typeof raw !== "string") {
    throw new Error("패널 생성 결과를 받지 못했습니다.");
  }

  const parsed = safeJsonParse<ComicPanelsJSON>(raw);
  const panels = parsed?.panels;

  function validatePanels(p: any): p is ComicPanel[] {
    if (!Array.isArray(p) || p.length !== 4) return false;
    const normalized = p.map((x) => ({
      title: String(x?.title ?? "").trim(),
      caption: String(x?.caption ?? "").trim(),
      learningPoint: String(
        (x as any)?.learningPoint ?? (x as any)?.learning_point ?? (x as any)?.learning_goal ?? "",
      ).trim(),
      sceneType: String((x as any)?.sceneType ?? (x as any)?.scene_type ?? "").trim(),
      scene: String(x?.scene ?? "").trim(),
      requiredObjects: Array.isArray((x as any)?.requiredObjects)
        ? (x as any).requiredObjects
        : Array.isArray((x as any)?.required_objects)
          ? (x as any).required_objects
          : [],
      requiredEvidenceElements: Array.isArray((x as any)?.requiredEvidenceElements)
        ? (x as any).requiredEvidenceElements
        : Array.isArray((x as any)?.evidence_elements)
          ? (x as any).evidence_elements
        : Array.isArray((x as any)?.required_evidence_elements)
          ? (x as any).required_evidence_elements
          : [],
      environment: String((x as any)?.environment ?? (x as any)?.location ?? "").trim(),
      peopleRoles: Array.isArray((x as any)?.peopleRoles)
        ? (x as any).peopleRoles
        : Array.isArray((x as any)?.actors)
          ? (x as any).actors
        : Array.isArray((x as any)?.people_roles)
          ? (x as any).people_roles
          : [],
      visibleCauseEffect: String(
        (x as any)?.visibleCauseEffect ?? (x as any)?.visible_cause_effect ?? (x as any)?.visible_change ?? "",
      ).trim(),
      visibleDataElements: Array.isArray((x as any)?.visibleDataElements)
        ? (x as any).visibleDataElements
        : Array.isArray((x as any)?.visible_data_elements)
          ? (x as any).visible_data_elements
          : [],
      imagePrompt: String((x as any)?.imagePrompt ?? (x as any)?.image_prompt ?? "").trim(),
    }));

    if (
      normalized.some(
        (x) =>
          !x.title ||
          !x.caption ||
          !x.learningPoint ||
          !x.scene ||
          !x.environment ||
          !x.visibleCauseEffect ||
          !x.imagePrompt,
      )
    ) {
      return false;
    }

    for (const x of normalized) {
      // 캡션이 너무 길면 품질 게이트에서 제외
      if (x.caption.length > 90) return false;
      // 캡션은 장식/범용 문구 대신 원인-결과 같은 정보 단서가 있어야 합니다.
      if (/(이해해볼게요|쉽게|간단히|그냥|따라|정리해볼게요|알아볼게요|보여줄게요)/i.test(x.caption)) return false;
      if (!/(때문에|유발|원인|결과|영향|변화|증가|감소|열|온도|기온|배출)/i.test(x.caption)) return false;
      // scene에 최소한의 구조가 있는지 체크
      if (!/(누가|무엇|행동|상태|결과)/.test(x.scene)) return false;
      // evidence plan이 실제로 채워져야 함
      if ((x.requiredObjects ?? []).length === 0) return false;
      if ((x.requiredEvidenceElements ?? []).length === 0) return false;
      if ((x.peopleRoles ?? []).length === 0) return false;
      if ((x.visibleDataElements ?? []).length === 0) return false;
      // image_prompt는 최소한 숫자/퍼센트/온도 같은 정보 요소를 포함해야 함
      if (!/(\\d+\\s*%|\\d+\\s?(°C|℃|C)|\\d+(\\.\\d+)?\\s?(percent|percentage)|\\b\\d+\\b)/i.test(x.imagePrompt)) {
        return false;
      }
      // image_prompt에 누가/무엇을 하는 장면이 들어가야 함
      if (!/(a\s+|사람|학생|직원|사용자|공장|정부|사내|기관|환자|고객|사람들)/i.test(x.imagePrompt)) return false;
      // 금지(추상/의미 없는) 요소
      if (/(lightbulb|star|gear|abstract|icon|symbol|diagra?m)/i.test(x.imagePrompt)) return false;

      // business 메뉴는 business evidence가 반드시 포함되어야 함
      if (menu === "business") {
        const pool = [
          ...x.requiredObjects,
          ...x.requiredEvidenceElements,
          ...x.visibleDataElements,
          x.imagePrompt,
          x.scene,
          x.caption,
          x.learningPoint,
        ].join(" ").toLowerCase();
        const hasBusinessEvidence =
          /price|가격|menu|메뉴|map|지도|customer|고객|flow|동선|schedule|일정|pilot|시범|test operation|테스트 운영|sales|매출|chart|그래프|feedback|피드백|competitor|경쟁/.test(
            pool,
          );
        if (!hasBusinessEvidence) return false;
      }
    }

    // 이미지 프롬프트가 서로 너무 비슷하면 거부(문자열 유사도 대신 간단한 안전장치)
    const sig = normalized.map((x) => x.imagePrompt.replace(/\s+/g, " ").slice(0, 140));
    const unique = new Set(sig);
    if (unique.size < 4) return false;

    return true;
  }

  function validateSinglePanel(x: any): boolean {
    const title = String(x?.title ?? "").trim();
    const caption = String(x?.caption ?? "").trim();
    const learningPoint = String(
      (x as any)?.learningPoint ?? (x as any)?.learning_point ?? (x as any)?.learning_goal ?? "",
    ).trim();
    const sceneType = String((x as any)?.sceneType ?? (x as any)?.scene_type ?? "").trim();
    const scene = String(x?.scene ?? "").trim();
    const requiredObjects = Array.isArray((x as any)?.requiredObjects)
      ? (x as any).requiredObjects
      : Array.isArray((x as any)?.required_objects)
        ? (x as any).required_objects
        : [];
    const requiredEvidenceElements = Array.isArray((x as any)?.requiredEvidenceElements)
      ? (x as any).requiredEvidenceElements
      : Array.isArray((x as any)?.evidence_elements)
        ? (x as any).evidence_elements
      : Array.isArray((x as any)?.required_evidence_elements)
        ? (x as any).required_evidence_elements
        : [];
    const environment = String((x as any)?.environment ?? (x as any)?.location ?? "").trim();
    const peopleRoles = Array.isArray((x as any)?.peopleRoles)
      ? (x as any).peopleRoles
      : Array.isArray((x as any)?.actors)
        ? (x as any).actors
      : Array.isArray((x as any)?.people_roles)
        ? (x as any).people_roles
        : [];
    const visibleCauseEffect = String(
      (x as any)?.visibleCauseEffect ?? (x as any)?.visible_cause_effect ?? (x as any)?.visible_change ?? "",
    ).trim();
    const visibleDataElements = Array.isArray((x as any)?.visibleDataElements)
      ? (x as any).visibleDataElements
      : Array.isArray((x as any)?.visible_data_elements)
        ? (x as any).visible_data_elements
        : [];
    const imagePrompt = String(x?.imagePrompt ?? x?.image_prompt ?? "").trim();
    if (
      !title ||
      !caption ||
      !learningPoint ||
      !sceneType ||
      !scene ||
      !environment ||
      !visibleCauseEffect ||
      !imagePrompt
    ) {
      return false;
    }
    if (!requiredObjects.length || !requiredEvidenceElements.length || !peopleRoles.length || !visibleDataElements.length) {
      return false;
    }
    if (caption.length > 90) return false;
    if (/(이해해볼게요|쉽게|간단히|그냥|따라|정리해볼게요|알아볼게요|보여줄게요)/i.test(caption))
      return false;
    if (!/(때문에|유발|원인|결과|영향|변화|증가|감소|열|온도|기온|배출)/i.test(caption)) return false;
    if (!/(누가|무엇|행동|상태|결과)/.test(scene)) return false;
    if (!/(\\d+\\s*%|\\d+\\s?(°C|℃|C)|\\d+(\\.\\d+)?\\s?(percent|percentage)|\\b\\d+\\b)/i.test(imagePrompt)) return false;
    if (!/(a\s+|사람|학생|직원|사용자|공장|정부|사내|기관|환자|고객|사람들)/i.test(imagePrompt)) return false;
    if (/(lightbulb|star|gear|abstract|icon|symbol|diagra?m)/i.test(imagePrompt)) return false;
    const topicPool = [title, caption, scene, learningPoint, imagePrompt, ...requiredObjects, ...requiredEvidenceElements]
      .join(" ")
      .toLowerCase();
    if (topicKeywords.length > 0 && !topicKeywords.some((k) => topicPool.includes(k))) return false;
    if (menu === "business") {
      const pool = [
        ...requiredObjects,
        ...requiredEvidenceElements,
        ...visibleDataElements,
        imagePrompt,
        scene,
        caption,
        learningPoint,
      ].join(" ").toLowerCase();
      const hasBusinessEvidence =
        /price|가격|menu|메뉴|map|지도|customer|고객|flow|동선|schedule|일정|pilot|시범|test operation|테스트 운영|sales|매출|chart|그래프|feedback|피드백|competitor|경쟁/.test(
          pool,
        );
      if (!hasBusinessEvidence) return false;
    }
    return true;
  }

  if (!validatePanels(panels)) {
    const badIdxs = (panels as any[]).map((p, i) => (validateSinglePanel(p) ? -1 : i)).filter((v) => v >= 0);
    if (!badIdxs.length) {
      // set-level만 애매하게 실패한 경우
      return panels.map((p) => ({
        title: String(p?.title ?? "").trim(),
        caption: String((p as any)?.caption ?? "").trim(),
        learningPoint: String(
          (p as any)?.learningPoint ?? (p as any)?.learning_point ?? (p as any)?.learning_goal ?? "",
        ).trim(),
        sceneType: String((p as any)?.sceneType ?? (p as any)?.scene_type ?? "").trim(),
        scene: String((p as any)?.scene ?? "").trim(),
        requiredObjects: Array.isArray((p as any)?.requiredObjects)
          ? (p as any).requiredObjects
          : Array.isArray((p as any)?.required_objects)
            ? (p as any).required_objects
            : [],
        requiredEvidenceElements: Array.isArray((p as any)?.requiredEvidenceElements)
          ? (p as any).requiredEvidenceElements
          : Array.isArray((p as any)?.evidence_elements)
            ? (p as any).evidence_elements
          : Array.isArray((p as any)?.required_evidence_elements)
            ? (p as any).required_evidence_elements
            : [],
        environment: String((p as any)?.environment ?? (p as any)?.location ?? "").trim(),
        peopleRoles: Array.isArray((p as any)?.peopleRoles)
          ? (p as any).peopleRoles
          : Array.isArray((p as any)?.actors)
            ? (p as any).actors
          : Array.isArray((p as any)?.people_roles)
            ? (p as any).people_roles
            : [],
        visibleCauseEffect: String(
          (p as any)?.visibleCauseEffect ?? (p as any)?.visible_cause_effect ?? (p as any)?.visible_change ?? "",
        ).trim(),
        visibleDataElements: Array.isArray((p as any)?.visibleDataElements)
          ? (p as any).visibleDataElements
          : Array.isArray((p as any)?.visible_data_elements)
            ? (p as any).visible_data_elements
            : [],
        imagePrompt: String((p as any)?.imagePrompt ?? (p as any)?.image_prompt ?? "").trim(),
      }));
    }

    const retryPrompt =
      prompt +
      "\n추가 지시:\n" +
      `- panels 배열에서 아래 인덱스들(${badIdxs.join(", ")})만 교육 정보/장면/프롬프트가 부족하면 다시 생성하고, 나머지는 그대로 유지해줘.\n` +
      "- 각 bad panel은 반드시: (1) 숫자/단위 포함 (2) 원인-결과-변화가 보이게 (3) 추상 아이콘 금지 (4) caption은 사실/인과 포함.\n" +
      `- 현재 panels(참고)를 그대로 두고 bad 인덱스만 수정해서, 최종 JSON은 panels 4개를 그대로 반환해줘.\n` +
      `현재 panels:\n${JSON.stringify({ panels }, null, 2)}`;

    const retryResp: any = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content:
            "너는 정보 밀도를 지키는 시각 설명 편집자다. 결과는 반드시 JSON만 반환한다.",
        },
        { role: "user", content: retryPrompt },
      ],
      response_format: { type: "json_object" },
    });

    const retryRaw = retryResp?.choices?.[0]?.message?.content;
    if (!retryRaw || typeof retryRaw !== "string") {
      throw new Error("패널 재시도 결과를 받지 못했습니다.");
    }

    const retryParsed = safeJsonParse<ComicPanelsJSON>(retryRaw);
    const retryPanels = retryParsed?.panels;
    if (!validatePanels(retryPanels)) {
      // 최후: 폴백
      return buildFallbackPanels(inputText, menu);
    }

    return retryPanels.map((p) => ({
      title: String(p?.title ?? "").trim(),
      caption: String((p as any)?.caption ?? "").trim(),
      learningPoint: String(
        (p as any)?.learningPoint ?? (p as any)?.learning_point ?? (p as any)?.learning_goal ?? "",
      ).trim(),
      sceneType: String((p as any)?.sceneType ?? (p as any)?.scene_type ?? "").trim(),
      scene: String((p as any)?.scene ?? "").trim(),
      requiredObjects: Array.isArray((p as any)?.requiredObjects)
        ? (p as any).requiredObjects
        : Array.isArray((p as any)?.required_objects)
          ? (p as any).required_objects
          : [],
      requiredEvidenceElements: Array.isArray((p as any)?.requiredEvidenceElements)
        ? (p as any).requiredEvidenceElements
        : Array.isArray((p as any)?.evidence_elements)
          ? (p as any).evidence_elements
        : Array.isArray((p as any)?.required_evidence_elements)
          ? (p as any).required_evidence_elements
          : [],
      environment: String((p as any)?.environment ?? (p as any)?.location ?? "").trim(),
      peopleRoles: Array.isArray((p as any)?.peopleRoles)
        ? (p as any).peopleRoles
        : Array.isArray((p as any)?.actors)
          ? (p as any).actors
        : Array.isArray((p as any)?.people_roles)
          ? (p as any).people_roles
          : [],
      visibleCauseEffect: String(
        (p as any)?.visibleCauseEffect ?? (p as any)?.visible_cause_effect ?? (p as any)?.visible_change ?? "",
      ).trim(),
      visibleDataElements: Array.isArray((p as any)?.visibleDataElements)
        ? (p as any).visibleDataElements
        : Array.isArray((p as any)?.visible_data_elements)
          ? (p as any).visible_data_elements
          : [],
      imagePrompt: String((p as any)?.imagePrompt ?? (p as any)?.image_prompt ?? "").trim(),
    }));
  }

  // set-level validate 통과
  return panels.map((p) => ({
    title: String(p?.title ?? "").trim(),
    caption: String((p as any)?.caption ?? "").trim(),
    learningPoint: String(
      (p as any)?.learningPoint ?? (p as any)?.learning_point ?? (p as any)?.learning_goal ?? "",
    ).trim(),
    scene: String((p as any)?.scene ?? "").trim(),
    requiredObjects: Array.isArray((p as any)?.requiredObjects)
      ? (p as any).requiredObjects
      : Array.isArray((p as any)?.required_objects)
        ? (p as any).required_objects
        : [],
    requiredEvidenceElements: Array.isArray((p as any)?.requiredEvidenceElements)
      ? (p as any).requiredEvidenceElements
      : Array.isArray((p as any)?.required_evidence_elements)
        ? (p as any).required_evidence_elements
        : [],
    environment: String((p as any)?.environment ?? "").trim(),
    peopleRoles: Array.isArray((p as any)?.peopleRoles)
      ? (p as any).peopleRoles
      : Array.isArray((p as any)?.people_roles)
        ? (p as any).people_roles
        : [],
    visibleCauseEffect: String((p as any)?.visibleCauseEffect ?? (p as any)?.visible_cause_effect ?? "").trim(),
    visibleDataElements: Array.isArray((p as any)?.visibleDataElements)
      ? (p as any).visibleDataElements
      : Array.isArray((p as any)?.visible_data_elements)
        ? (p as any).visible_data_elements
        : [],
    imagePrompt: String((p as any)?.imagePrompt ?? (p as any)?.image_prompt ?? "").trim(),
  }));
}

