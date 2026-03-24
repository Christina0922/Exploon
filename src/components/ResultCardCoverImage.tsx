"use client";

import { BookOpenText, BriefcaseBusiness, Building2, FileText, Newspaper } from "lucide-react";

function CoverFallback({ documentType }: { documentType: string }) {
  const config: Record<string, { title: string; subtitle: string; icon: React.ReactNode; bg: string }> = {
    policy: {
      title: "정책 추진 개요",
      subtitle: "목표 · 지원체계 · 기대효과",
      icon: <Building2 size={26} />,
      bg: "from-[#E0F2FE] via-[#EFF6FF] to-[#EEF2FF]",
    },
    business_plan: {
      title: "사업 구조 요약",
      subtitle: "시장 · 고객 · 실행전략",
      icon: <BriefcaseBusiness size={26} />,
      bg: "from-[#E0E7FF] via-[#EEF2FF] to-[#F5F3FF]",
    },
    study_material: {
      title: "학습 핵심 구조",
      subtitle: "개념 · 단계 · 암기 포인트",
      icon: <BookOpenText size={26} />,
      bg: "from-[#ECFEFF] via-[#E0F2FE] to-[#EEF2FF]",
    },
    news: {
      title: "기사 핵심 쟁점",
      subtitle: "사실관계 · 영향 · 전망",
      icon: <Newspaper size={26} />,
      bg: "from-[#DBEAFE] via-[#E0E7FF] to-[#EEF2FF]",
    },
    meeting_report: {
      title: "회의/보고 핵심",
      subtitle: "결정사항 · 일정 · 액션",
      icon: <FileText size={26} />,
      bg: "from-[#E2E8F0] via-[#E0E7FF] to-[#EEF2FF]",
    },
    general: {
      title: "문서 핵심 인사이트",
      subtitle: "핵심 내용 시각 요약",
      icon: <FileText size={26} />,
      bg: "from-[#E2E8F0] via-[#EFF6FF] to-[#EEF2FF]",
    },
  };
  const current = config[documentType] ?? config.general;

  return (
    <div
      className={[
        "relative h-[260px] w-full overflow-hidden rounded-[18px] bg-gradient-to-br p-6",
        current.bg,
      ].join(" ")}
    >
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/40 blur-xl" />
      <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-[#60A5FA]/20 blur-xl" />
      <div className="relative z-10 inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-1.5 text-sm font-semibold text-[#1E3A8A]">
        {current.icon}
        <span>{current.title}</span>
      </div>
      <div className="relative z-10 mt-4 text-sm text-[#334155]">{current.subtitle}</div>
      <div className="relative z-10 mt-5 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-white/70 px-2 py-2 text-xs font-semibold text-[#1E3A8A]">핵심 목표</div>
        <div className="rounded-lg bg-white/70 px-2 py-2 text-xs font-semibold text-[#1E3A8A]">추진 방식</div>
        <div className="rounded-lg bg-white/70 px-2 py-2 text-xs font-semibold text-[#1E3A8A]">결과 지표</div>
      </div>
    </div>
  );
}

export default function ResultCardCoverImage({
  documentType,
  coverImageUrl,
}: {
  documentType: string;
  coverImageUrl?: string;
}) {
  if (coverImageUrl) {
    return (
      <div className="h-[260px] w-full overflow-hidden rounded-[18px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverImageUrl} alt="대표 이미지" className="h-full w-full object-cover" />
      </div>
    );
  }
  return <CoverFallback documentType={documentType} />;
}
