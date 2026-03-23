import type { ComicPanel } from "@/lib/comicPrompt";

export function buildFallbackPanels(inputText: string, menu: "education" | "business" | "government"): ComicPanel[] {
  const text = inputText.trim().replace(/\s+/g, " ");
  const snippet = text.slice(0, 90);

  const keyIdea = snippet.length > 0 ? snippet + (text.length > 90 ? "..." : "") : "핵심 내용";

  switch (menu) {
    case "business":
      return [
        {
          title: "핵심 이슈",
          caption: `현재 해결해야 할 문제는 바로 '${keyIdea}'예요.`,
          learningPoint: "현재 문제 정의와 관측 가능한 현상",
          scene: "",
          requiredObjects: ["문서", "가격표", "비교표"],
          requiredEvidenceElements: ["비교표", "수치"],
          environment: "사무실 데스크",
          peopleRoles: ["사업자"],
          visibleCauseEffect: "요건 비교 실패가 의사결정 지연으로 이어짐",
          visibleDataElements: ["가격", "비용 비율"],
          imagePrompt: "a person looking at papers, confused, deciding what to do, no text",
        },
        {
          title: "왜 생길까",
          caption: "원인은 여러 단계에서 쌓여요. 무엇이 막히는지 먼저 정리해요.",
          learningPoint: "병목 지점 파악",
          scene: "",
          requiredObjects: ["프로세스 보드", "일정표"],
          requiredEvidenceElements: ["흐름", "단계별 비교"],
          environment: "회의 공간",
          peopleRoles: ["팀원"],
          visibleCauseEffect: "단계 누락이 지연을 유발",
          visibleDataElements: ["기간", "대기 시간"],
          imagePrompt: "a person pointing at connected steps on a workflow board, showing bottleneck, no text",
        },
        {
          title: "해결 방법",
          caption: "가장 영향 큰 행동부터 정해요. 작은 실험으로 빠르게 확인해요.",
          learningPoint: "우선순위 기반 실행",
          scene: "",
          requiredObjects: ["체크리스트", "실험 일정표"],
          requiredEvidenceElements: ["전/후 비교", "테스트 운영"],
          environment: "파일럿 운영 현장",
          peopleRoles: ["운영 담당자"],
          visibleCauseEffect: "파일럿 실행이 리스크를 낮춤",
          visibleDataElements: ["테스트 지표", "성공률"],
          imagePrompt: "a team member taking action with a simple plan, installing a solution step, no text",
        },
        {
          title: "기대 결과",
          caption: "더 나은 결정과 실행이 이어져 성과가 좋아질 거예요.",
          learningPoint: "개선 효과 확인",
          scene: "",
          requiredObjects: ["매출 차트", "피드백 노트"],
          requiredEvidenceElements: ["그래프", "고객 반응"],
          environment: "성과 리뷰 보드 앞",
          peopleRoles: ["사업자", "고객"],
          visibleCauseEffect: "개선 실행이 성과 상승으로 연결",
          visibleDataElements: ["매출", "재방문율"],
          imagePrompt: "a person smiling in a clean office after a successful outcome, no text",
        },
      ];
    case "government":
      return [
        {
          title: "현재 상황",
          caption: `문서가 말하는 핵심은 '${keyIdea}'예요.`,
          learningPoint: "규정의 핵심 쟁점 파악",
          scene: "",
          requiredObjects: ["정부 안내문", "신청 문서"],
          requiredEvidenceElements: ["조건", "요건"],
          environment: "민원 안내 데스크",
          peopleRoles: ["시민"],
          visibleCauseEffect: "요건 이해 부족이 혼란 유발",
          visibleDataElements: ["연령 조건", "기간"],
          imagePrompt: "a citizen reading a government guideline sheet, confused, no text",
        },
        {
          title: "절차/과정",
          caption: "필요한 조건을 확인하고, 정해진 단계대로 진행해요.",
          learningPoint: "절차 순서 이해",
          scene: "",
          requiredObjects: ["체크리스트", "일정표"],
          requiredEvidenceElements: ["단계 흐름", "비교"],
          environment: "신청 준비 공간",
          peopleRoles: ["신청자"],
          visibleCauseEffect: "조건 확인이 반려를 줄임",
          visibleDataElements: ["마감일", "제출 단계"],
          imagePrompt: "a citizen checking requirements and following steps at a desk, no text",
        },
        {
          title: "대응 방법",
          caption: "요건에 맞게 자료를 준비하고, 요구되는 절차를 따라요.",
          learningPoint: "적합한 증빙 준비",
          scene: "",
          requiredObjects: ["증빙 서류", "온라인 제출 시스템"],
          requiredEvidenceElements: ["제출 내역", "완료 상태"],
          environment: "온라인 제출 화면",
          peopleRoles: ["신청자"],
          visibleCauseEffect: "요건 충족이 승인 가능성 증가",
          visibleDataElements: ["제출 건수", "완료율"],
          imagePrompt: "a person preparing documents and submitting them online at a kiosk, no text",
        },
        {
          title: "결과",
          caption: "규정에 맞게 진행되면 다음 단계로 넘어갈 수 있어요.",
          learningPoint: "절차 준수의 결과",
          scene: "",
          requiredObjects: ["승인 알림", "다음 단계 안내"],
          requiredEvidenceElements: ["결과 비교", "상태 변화"],
          environment: "처리 결과 확인 화면",
          peopleRoles: ["신청자"],
          visibleCauseEffect: "정확한 제출이 승인으로 연결",
          visibleDataElements: ["처리 상태", "완료 시간"],
          imagePrompt: "a person receiving a confirmation notice and smiling, no text",
        },
      ];
    case "education":
    default:
      return [
        {
          title: "문제",
          caption: `우리가 어려워하는 주제는 '${keyIdea}'예요.`,
          learningPoint: "문제 상황 인지",
          scene: "",
          requiredObjects: ["교재", "온도계"],
          requiredEvidenceElements: ["수치", "문제 관측"],
          environment: "교실/학습 공간",
          peopleRoles: ["학생"],
          visibleCauseEffect: "정보 과밀이 이해 저하로 연결",
          visibleDataElements: ["온도 수치", "변화량"],
          imagePrompt: "a student confused while reading a dense paragraph, wiping sweat, no text",
        },
        {
          title: "원리/과정",
          caption: "왜 그런지 아주 쉽게 한 단계씩 이해해볼게요.",
          learningPoint: "원리의 단계적 이해",
          scene: "",
          requiredObjects: ["과정 도식", "측정값 비교"],
          requiredEvidenceElements: ["화살표 흐름", "전후 비교"],
          environment: "설명 보드 앞",
          peopleRoles: ["교사", "학생"],
          visibleCauseEffect: "원인 이해가 혼란 감소로 연결",
          visibleDataElements: ["단계 번호", "지표"],
          imagePrompt: "a student listening as a teacher walks through steps in a notebook, no text",
        },
        {
          title: "해결 방법",
          caption: "핵심 행동을 2~3번만 따라 해보면 돼요.",
          learningPoint: "실행 가능한 해결 절차",
          scene: "",
          requiredObjects: ["체크리스트", "실행 도구"],
          requiredEvidenceElements: ["실행 단계", "변화 관측"],
          environment: "학습 실습 공간",
          peopleRoles: ["학생"],
          visibleCauseEffect: "행동 실행이 이해도 상승으로 연결",
          visibleDataElements: ["정답률", "완료 횟수"],
          imagePrompt: "a student following a short checklist and taking action with a pen, no text",
        },
        {
          title: "결과",
          caption: "이해가 빠르게 정리되고, 다음 단계가 쉬워져요.",
          learningPoint: "결과 확인",
          scene: "",
          requiredObjects: ["결과 요약표", "전/후 비교"],
          requiredEvidenceElements: ["개선 그래프", "비교 표식"],
          environment: "결과 리뷰 공간",
          peopleRoles: ["학생"],
          visibleCauseEffect: "개선 행동이 성과 향상으로 연결",
          visibleDataElements: ["향상 수치", "오류 감소율"],
          imagePrompt: "a student smiling and closing the notebook after understanding, no text",
        },
      ];
  }
}

export function svgDataUriForPanel(index: number): string {
  // 텍스트 없이도 의미를 전달할 수 있게, 패널 타입(Problem/Process/Solution/Result)별 아이콘을 다르게 그립니다.
  const stroke = "#1f2937";
  const configs = [
    // 1) Problem
    { soft: "#93c5fd", accent: "#60a5fa", face: "sad", concept: "question" },
    // 2) Cause / Process
    { soft: "#fde68a", accent: "#fbbf24", face: "process", concept: "gear" },
    // 3) Solution
    { soft: "#6ee7b7", accent: "#34d399", face: "idea", concept: "bulb" },
    // 4) Result
    { soft: "#c4b5fd", accent: "#a78bfa", face: "win", concept: "star" },
  ] as const;

  const cfg = configs[index % configs.length];

  const faceMouth =
    cfg.face === "sad"
      ? `<path d="M360 440 C 405 475 455 475 500 440" fill="none" stroke="${stroke}" stroke-width="12" stroke-linecap="round"/>`
      : cfg.face === "process"
        ? `<path d="M360 435 C 405 455 455 455 500 435" fill="none" stroke="${stroke}" stroke-width="12" stroke-linecap="round" opacity="0.8"/>`
        : cfg.face === "idea"
          ? `<path d="M360 440 C 405 500 455 500 500 440" fill="none" stroke="${stroke}" stroke-width="12" stroke-linecap="round"/>`
          : `<path d="M360 450 C 405 500 455 500 500 450" fill="none" stroke="${stroke}" stroke-width="12" stroke-linecap="round"/>`;

  const conceptIcon = (() => {
    switch (cfg.concept) {
      case "question":
        return `
          <circle cx="795" cy="330" r="80" fill="#ffffff" stroke="${stroke}" stroke-width="10"/>
          <path d="M775 310 C 790 285 825 285 835 310 C 843 330 825 345 810 352" fill="none" stroke="${stroke}" stroke-width="12" stroke-linecap="round"/>
          <circle cx="812" cy="382" r="10" fill="${stroke}"/>
        `;
      case "gear":
        return `
          <circle cx="795" cy="340" r="86" fill="#ffffff" stroke="${stroke}" stroke-width="10"/>
          <g stroke="${stroke}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none">
            <path d="M795 280 L815 295 L835 275 L850 300 L845 325 L870 330 L870 360 L845 365 L850 390 L835 415 L815 395 L795 410 L775 395 L755 415 L740 390 L745 365 L720 360 L720 330 L745 325 L740 300 L755 275 L775 295 Z"/>
            <circle cx="795" cy="350" r="28" fill="${cfg.accent}" stroke="${stroke}" stroke-width="10"/>
          </g>
        `;
      case "bulb":
        return `
          <path d="M795 250
            C 735 250 705 310 705 355
            C 705 405 740 415 740 445
            L 850 445
            C 850 415 885 405 885 355
            C 885 310 855 250 795 250 Z"
            fill="#ffffff" stroke="${stroke}" stroke-width="10" />
          <path d="M760 465 H830" stroke="${stroke}" stroke-width="14" stroke-linecap="round"/>
          <path d="M760 495 H830" stroke="${stroke}" stroke-width="10" stroke-linecap="round" opacity="0.9"/>
          <circle cx="795" cy="355" r="18" fill="${cfg.accent}" stroke="${stroke}" stroke-width="8"/>
          <path d="M760 330 C 780 310 810 310 830 330" fill="none" stroke="${stroke}" stroke-width="10" stroke-linecap="round"/>
        `;
      case "star":
      default:
        return `
          <path d="M795 250 L815 300 L870 310 L830 350 L840 405 L795 380 L750 405 L760 350 L720 310 L775 300 Z"
            fill="#ffffff" stroke="${stroke}" stroke-width="10" stroke-linejoin="round"/>
          <path d="M795 295 C 820 320 820 340 795 365 C 770 340 770 320 795 295 Z"
            fill="${cfg.accent}" stroke="${stroke}" stroke-width="8" stroke-linejoin="round" />
          <path d="M740 470 C 780 455 810 455 850 470" fill="none" stroke="${stroke}" stroke-width="12" stroke-linecap="round" opacity="0.8"/>
        `;
    }
  })();

  const backgroundMarkup = (() => {
    switch (cfg.concept) {
      case "question":
        return `
          <!-- heat problem background -->
          <circle cx="740" cy="170" r="95" fill="#ffffff" stroke="${stroke}" stroke-width="8" opacity="0.9"/>
          <g stroke="${stroke}" stroke-width="8" stroke-linecap="round" opacity="0.25">
            <path d="M740 75 L740 30"/>
            <path d="M740 315 L740 270"/>
            <path d="M645 170 L600 170"/>
            <path d="M835 170 L880 170"/>
            <path d="M675 105 L645 75"/>
            <path d="M805 235 L835 265"/>
            <path d="M675 235 L645 265"/>
            <path d="M805 105 L835 75"/>
          </g>
          <!-- sweat drops -->
          <path d="M430 410 C 420 430 440 440 430 460 C 420 440 440 430 430 410 Z" fill="#ffffff" stroke="${stroke}" stroke-width="6"/>
          <path d="M395 410 C 385 430 405 440 395 460 C 385 440 405 430 395 410 Z" fill="#ffffff" stroke="${stroke}" stroke-width="6" opacity="0.9"/>
        `;
      case "gear":
        return `
          <!-- cause background: factories + smoke -->
          <rect x="640" y="610" width="260" height="80" rx="18" fill="#ffffff" stroke="${stroke}" stroke-width="8" opacity="0.55"/>
          <rect x="680" y="520" width="110" height="160" rx="14" fill="#ffffff" stroke="${stroke}" stroke-width="8" opacity="0.55"/>
          <rect x="820" y="500" width="70" height="180" rx="14" fill="#ffffff" stroke="${stroke}" stroke-width="8" opacity="0.55"/>
          <g fill="#ffffff" opacity="0.55" stroke="${stroke}" stroke-width="8">
            <path d="M690 400 C 670 360 700 330 740 350 C 770 305 840 325 830 380 C 885 400 865 460 820 460 C 805 500 740 495 725 455 C 690 470 665 430 690 400 Z"/>
            <path d="M780 330 C 760 295 785 270 820 285 C 845 255 900 270 895 315 C 930 330 920 370 885 380 C 880 410 830 410 820 385 C 795 395 765 365 780 330 Z" opacity="0.85"/>
          </g>
          <!-- heat shimmer lines -->
          <g opacity="0.22" stroke="${stroke}" stroke-width="8" stroke-linecap="round">
            <path d="M250 330 C 280 310 310 310 340 330"/>
            <path d="M270 360 C 295 345 320 345 345 360"/>
            <path d="M260 390 C 290 375 315 375 350 390"/>
          </g>
        `;
      case "bulb":
        return `
          <!-- solution background: trees + solar -->
          <path d="M640 760 C 650 700 690 660 730 630 C 760 605 790 585 830 580
                   C 795 630 790 690 805 740 L640 760 Z" fill="#ffffff" stroke="${stroke}" stroke-width="8" opacity="0.55"/>
          <g fill="#ffffff" stroke="${stroke}" stroke-width="8" opacity="0.8">
            <circle cx="730" cy="560" r="70"/>
            <circle cx="810" cy="600" r="60"/>
            <circle cx="680" cy="610" r="55"/>
          </g>
          <!-- solar panel -->
          <rect x="520" y="520" width="220" height="150" rx="26" fill="#ffffff" stroke="${stroke}" stroke-width="8" opacity="0.55"/>
          <g stroke="${stroke}" stroke-width="10" opacity="0.18">
            <path d="M540 550 H720"/>
            <path d="M560 585 H760"/>
            <path d="M580 620 H740"/>
          </g>
        `;
      case "star":
      default:
        return `
          <!-- result background: green city -->
          <path d="M140 760 C 250 680 380 650 480 660 C 600 670 690 720 840 760 L140 760 Z" fill="#ffffff" stroke="${stroke}" stroke-width="8" opacity="0.55"/>
          <g opacity="0.35" stroke="${stroke}" stroke-width="10" stroke-linecap="round">
            <path d="M220 740 C 250 700 290 700 320 740"/>
            <path d="M360 740 C 390 705 430 705 460 740"/>
            <path d="M520 740 C 545 710 585 710 610 740"/>
          </g>
          <circle cx="220" cy="210" r="55" fill="#ffffff" stroke="${stroke}" stroke-width="8" opacity="0.85"/>
          <g stroke="${stroke}" stroke-width="8" stroke-linecap="round" opacity="0.22">
            <path d="M220 155 L220 110"/>
            <path d="M220 260 L220 305"/>
            <path d="M165 210 L120 210"/>
            <path d="M275 210 L320 210"/>
          </g>
        `;
    }
  })();

  const docMarkup = (() => {
    switch (cfg.concept) {
      case "question":
        return `
          <!-- document (dense) -->
          <rect x="170" y="560" width="270" height="200" rx="18" fill="#ffffff" stroke="${stroke}" stroke-width="8"/>
          <g stroke="${stroke}" stroke-width="6" opacity="0.35" stroke-linecap="round">
            <path d="M205 600 H400"/>
            <path d="M205 630 H390"/>
            <path d="M205 660 H410"/>
            <path d="M205 690 H380"/>
            <path d="M205 720 H410"/>
            <path d="M205 750 H385"/>
          </g>
          <path d="M420 595 l18 0" stroke="${stroke}" stroke-width="10" stroke-linecap="round"/>
          <path d="M428 620 l0 -18" stroke="${stroke}" stroke-width="10" stroke-linecap="round"/>
        `;
      case "gear":
        return `
          <!-- document + process nodes -->
          <rect x="170" y="560" width="270" height="200" rx="18" fill="#ffffff" stroke="${stroke}" stroke-width="8"/>
          <g stroke="${stroke}" stroke-width="6" opacity="0.35" stroke-linecap="round">
            <path d="M205 600 H400"/>
            <path d="M205 630 H390"/>
            <path d="M205 660 H410"/>
          </g>
          <g>
            <circle cx="240" cy="650" r="16" fill="#ffffff" stroke="${stroke}" stroke-width="8"/>
            <circle cx="320" cy="650" r="16" fill="#ffffff" stroke="${stroke}" stroke-width="8"/>
            <circle cx="400" cy="650" r="16" fill="#ffffff" stroke="${stroke}" stroke-width="8"/>
            <path d="M255 650 H304" stroke="${stroke}" stroke-width="10" stroke-linecap="round"/>
            <path d="M336 650 H385" stroke="${stroke}" stroke-width="10" stroke-linecap="round"/>
          </g>
        `;
      case "bulb":
        return `
          <!-- document + solution check -->
          <rect x="170" y="560" width="270" height="200" rx="18" fill="#ffffff" stroke="${stroke}" stroke-width="8"/>
          <g stroke="${stroke}" stroke-width="6" opacity="0.35" stroke-linecap="round">
            <path d="M205 600 H400"/>
            <path d="M205 630 H390"/>
            <path d="M205 660 H410"/>
          </g>
          <path d="M430 650 L455 675 L505 615" fill="none" stroke="${stroke}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
        `;
      case "star":
      default:
        return `
          <!-- simplified document + result -->
          <rect x="170" y="560" width="270" height="200" rx="18" fill="#ffffff" stroke="${stroke}" stroke-width="8"/>
          <g stroke="${stroke}" stroke-width="6" opacity="0.25" stroke-linecap="round">
            <path d="M205 610 H410"/>
            <path d="M205 640 H395"/>
            <path d="M205 670 H420"/>
          </g>
          <path d="M470 600 L490 645 L535 655 L495 685 L505 735 L470 705 L435 735 L445 685 L405 655 L450 645 Z"
            fill="${cfg.accent}" stroke="${stroke}" stroke-width="8" stroke-linejoin="round" opacity="0.95"/>
        `;
    }
  })();

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <rect x="0" y="0" width="1024" height="1024" fill="#ffffff"/>
  <rect x="64" y="64" width="896" height="896" rx="64" fill="${cfg.soft}" stroke="${stroke}" stroke-width="10"/>
  ${backgroundMarkup}

  <!-- character -->
  <circle cx="405" cy="370" r="105" fill="#ffffff" stroke="${stroke}" stroke-width="10"/>
  <circle cx="365" cy="350" r="16" fill="#ffffff" stroke="${stroke}" stroke-width="8"/>
  <circle cx="445" cy="350" r="16" fill="#ffffff" stroke="${stroke}" stroke-width="8"/>
  ${faceMouth}

  <!-- body + explaining gesture -->
  <path d="M305 760 C 330 600 430 535 505 560 C 610 595 690 665 710 790 L 310 790 Z"
    fill="${cfg.accent}" stroke="${stroke}" stroke-width="10" stroke-linejoin="round"/>
  <path d="M520 540 C 620 470 705 480 770 530" fill="none" stroke="${stroke}" stroke-width="14" stroke-linecap="round"/>
  <path d="M560 610 C 630 600 690 630 735 690" fill="none" stroke="${stroke}" stroke-width="12" stroke-linecap="round"/>

  <!-- concept icon -->
  ${conceptIcon}

  <!-- document / visible object -->
  ${docMarkup}

  <!-- frame lines (dynamic-ish, but still minimal) -->
  <path d="M140 520 C 220 450 300 470 380 540" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
  <path d="M150 610 C 250 560 320 590 410 660" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round" opacity="0.6"/>
</svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

