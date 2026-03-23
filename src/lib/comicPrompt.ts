export type MenuId = "education" | "business" | "government";

export function getMenuStyle(menu: MenuId) {
  switch (menu) {
    case "education":
      return "교육용으로, 학생이 바로 이해할 수 있게 쉬운 말과 예시 중심으로 설명해줘.";
    case "business":
      return "사업 관점으로, 의사결정자가 빠르게 요지를 잡을 수 있게 핵심만 간단히 정리해줘.";
    case "government":
      return "정부 문서 관점으로, 일반 시민이 이해할 수 있게 규정/절차를 단계별로 풀어줘.";
  }
}

export function buildPanelsPrompt(inputText: string, menu: MenuId, meaningNotes?: string) {
  const style = getMenuStyle(menu);

  // 모델이 JSON만 반환하도록 강하게 지시합니다.
  return `아래 입력 "섹션(토픽)" 텍스트를 바탕으로, 한 토픽만을 설명하는 "간단한 4칸 만화"로 바꿔줘.
${style}

의미 보존 규칙(중요):
- 이 섹션에서 핵심 주장/조건/예외를 잃지 마
- 복잡한 내용을 줄이되, 중요한 조건/제약은 빼지 마

의미 보존 메모(이 메모는 반드시 반영):
${meaningNotes ? meaningNotes : "(없음: 일반 의미 보존 규칙만 적용)"}

요구사항:
- 결과는 반드시 아래 JSON 형식만 출력 (추가 텍스트 금지)
- 용어는 짧고 쉬운 말로 작성 (전문 용어/기술 용어/학술 표현 금지)
- 스타일은 "clean explainer visual" 우선: 귀여움/장식보다 정보 전달과 인지 가능성을 우선
- 각 패널 caption은 HTML에 표시될 텍스트(캡션)이고, 1~2줄(짧게)로 작성
- caption은 범용/장식 문구 금지. 반드시 원인-결과-변화를 설명하는 사실 문장으로 작성
- caption은 각 패널에서 최소 1개의 "배우게 되는 정보"(예: 수치/조건/인과관계/전후 비교 결과)를 포함해야 함
- 이미지를 만들기 전에 반드시 각 패널의 visual evidence plan을 먼저 설계해라.
- 각 패널 scene은 이미지 생성용 장면 설명이고, 반드시 아래 5개 요소를 포함해 작성:
  1) 누가(ROLE)
  2) 무엇을(OBJECT/문서/시스템)
  3) 무엇을 하는지(ACTION)
  4) 감정/논리 상태(STATE)
  5) 눈에 보이는 결과(RESULT)
- scene은 추상적 아이콘/상징(예: 기호, 부유하는 도형)처럼 보이지 않게, 구체적인 상황으로 작성
- scene도 패널마다 완전히 다른 순간처럼 보이도록 구도/배경/행동을 달리 작성
- 각 패널 image_prompt는 이미지 생성용 장면(scene)+행동 프롬프트이며, 반드시 아래 구조를 포함해 작성:
  "a [specific person/subject] doing [specific action] with [specific object/environment], showing [clear situation], with [emotion or logical state], clear storytelling, visible action, not abstract, simple flat comic style, clean background, no long text (allow numbers/units and short labels)"
- image_prompt는 패널마다 완전히 다른 순간처럼 보이도록 강제:
  - 서로 다른 행동/구도/배경/상황
  - 같은 동작/같은 배경/색만 바꾸는 방식 금지
  - 가능하면 카메라 앵글도 다르게(예: 가까이/옆에서/위에서)
- 이미지에는 장문의 글/문장 금지. 대신 숫자/단위(예: 35°C, 20%)와 짧은 라벨(CO2, solar panel) 같은 "정보 요소"는 보이게 해줘.
- image_prompt에서 추상/의미 없는 요소를 금지:
  - floating lightbulb, star, gear 같은 공중 아이콘 금지
  - 기호/상징만 떠있는 장면 금지
  - 단순 도형/장식만 있는 씬 금지
  - 의미 없는 배경만 있는 장면 금지
- 각 패널 scene/장면 설명도 반드시 구체적인 상황(사람/물건/환경/문서/시스템)과 눈에 보이는 행동 변화를 포함해야 함
- 각 패널 image_prompt에는 반드시 아래 교육 정보 요소 중 2개 이상을 포함해줘:
  1) 숫자/단위(온도/%, 수치)
  2) 라벨이 있는 실제 물체(예: 공장 굴뚝에서 나오는 연기, CO2 배출)
  3) 눈에 보이는 물리 변화(예: 온도 상승, 열의 축적, 설치 후 개선)
  4) before vs after 또는 비교 장면
  5) 화살표/흐름(원인 -> 결과의 방향)
- business 토픽이면 business evidence를 반드시 넣어:
  - comparison table / price list / map / customer flow / schedule / test operation scene / sales chart / feedback note 중 최소 2개

JSON 형식:
{
  "panels": [
    {
      "title":"...",
      "caption":"...",
      "learning_goal":"...",
      "scene_type":"...",
      "scene":"...",
      "required_objects":["..."],
      "evidence_elements":["..."],
      "location":"...",
      "actors":["..."],
      "visible_change":"...",
      "visible_data_elements":["..."],
      "image_prompt":"..."
    },
    {
      "title":"...",
      "caption":"...",
      "learning_goal":"...",
      "scene_type":"...",
      "scene":"...",
      "required_objects":["..."],
      "evidence_elements":["..."],
      "location":"...",
      "actors":["..."],
      "visible_change":"...",
      "visible_data_elements":["..."],
      "image_prompt":"..."
    },
    {
      "title":"...",
      "caption":"...",
      "learning_goal":"...",
      "scene_type":"...",
      "scene":"...",
      "required_objects":["..."],
      "evidence_elements":["..."],
      "location":"...",
      "actors":["..."],
      "visible_change":"...",
      "visible_data_elements":["..."],
      "image_prompt":"..."
    },
    {
      "title":"...",
      "caption":"...",
      "learning_goal":"...",
      "scene_type":"...",
      "scene":"...",
      "required_objects":["..."],
      "evidence_elements":["..."],
      "location":"...",
      "actors":["..."],
      "visible_change":"...",
      "visible_data_elements":["..."],
      "image_prompt":"..."
    }
  ]
}

4칸 기본 흐름(섹션 타입에 맞춰 조정 가능):
1) Problem: 시작 상황/혼란/어려움
2) Cause / Process: 이유 또는 핵심 과정(간단히)
3) Solution: 올바른 해석/행동/단계
4) Result: 해결 후 결과/이득

강제:
- panels[0]은 반드시 Problem 장면이어야 해 (혼란/어려움이 눈에 보이게)
- panels[1]은 반드시 Cause/Process 장면이어야 해 (왜 그런지의 실제 원인/과정이 눈에 보이게)
- panels[2]은 반드시 Solution 장면이어야 해 (무엇을 어떻게 바꾸는 행동이 눈에 보이게)
- panels[3]은 반드시 Result 장면이어야 해 (좋아진 변화/결과가 눈에 보이게)

섹션 텍스트:
\"\"\"
${inputText}
\"\"\"
`;
}

export type ComicPanel = {
  title: string;
  caption: string;
  learningPoint: string;
  sceneType?: string;
  scene: string;
  requiredObjects: string[];
  requiredEvidenceElements: string[];
  environment: string;
  peopleRoles: string[];
  visibleCauseEffect: string;
  visibleDataElements: string[];
  imagePrompt: string;
};

export type ComicPanelsJSON = { panels: ComicPanel[] };

