"use client";

import type { ReactNode } from "react";
import { BookOpenCheck, Boxes, BrainCircuit, ChevronRight, Target } from "lucide-react";

export type AnalysisOptionId = "summary" | "structure" | "rewrite" | "exam";

export const ANALYSIS_OPTIONS: Array<{
  id: AnalysisOptionId;
  title: string;
  description: string;
}> = [
  { id: "summary", title: "핵심 요약", description: "3줄로 핵심만 정리" },
  { id: "structure", title: "구조 분석", description: "목차와 논리 구조 정리" },
  { id: "rewrite", title: "쉽게 풀어쓰기", description: "이해하기 쉽게 재구성" },
  { id: "exam", title: "시험 대비 정리", description: "암기용 핵심 정리" },
];

export default function OptionPanel({
  selected,
  onSelect,
  onAnalyze,
  disabled,
  loading,
}: {
  selected: AnalysisOptionId;
  onSelect: (id: AnalysisOptionId) => void;
  onAnalyze: () => void;
  disabled: boolean;
  loading: boolean;
}) {
  const ICONS: Record<AnalysisOptionId, ReactNode> = {
    summary: <Target size={16} />,
    structure: <Boxes size={16} />,
    rewrite: <BrainCircuit size={16} />,
    exam: <BookOpenCheck size={16} />,
  };

  return (
    <section className="surface-card rounded-2xl p-5 sm:p-6">
      <h2 className="text-sm font-semibold text-[#0F172A]">분석 방식 선택</h2>
      <p className="mt-1 text-xs leading-5 text-[#64748B]">문서 목적에 맞는 분석 포맷을 선택하세요.</p>
      <div className="mt-4 grid gap-2.5">
        {ANALYSIS_OPTIONS.map((opt) => {
          const active = selected === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              className={[
                "group rounded-xl border p-3.5 text-left transition duration-200 hover:-translate-y-0.5",
                active
                  ? "border-[#6366F1] bg-gradient-to-r from-[#EEF2FF] to-[#F5F3FF] shadow-[0_8px_20px_rgba(99,102,241,0.18)]"
                  : "border-[#D1D5DB] bg-white/95 hover:border-[#94A3B8] hover:shadow-sm",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span
                    className={[
                      "mt-0.5 grid h-7 w-7 place-items-center rounded-lg",
                      active ? "bg-[#1E3A8A] text-white" : "bg-[#EEF2FF] text-[#1E3A8A]",
                    ].join(" ")}
                  >
                    {ICONS[opt.id]}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-[#0F172A]">{opt.title}</div>
                    <div className="mt-1 text-xs text-[#475569]">{opt.description}</div>
                  </div>
                </div>
                <ChevronRight
                  size={15}
                  className={[
                    "mt-1 transition",
                    active ? "text-[#4F46E5]" : "text-[#94A3B8] group-hover:text-[#64748B]",
                  ].join(" ")}
                />
              </div>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        disabled={disabled}
        onClick={onAnalyze}
        className="mt-5 h-12 w-full rounded-xl bg-[#1E3A8A] text-sm font-semibold text-white shadow-[0_10px_22px_rgba(30,58,138,0.35)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#1E40AF] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
      >
        {loading ? "분석 중..." : "분석 시작"}
      </button>
    </section>
  );
}
