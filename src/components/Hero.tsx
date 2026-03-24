"use client";

import { BadgeCheck, FileText, GraduationCap, Landmark, Sparkles } from "lucide-react";

export default function Hero({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative mx-auto mt-14 w-full max-w-[880px] px-4 text-center sm:mt-20 sm:px-6">
      <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-[#C7D2FE] bg-[#EEF2FF]/80 px-4 py-1.5 text-xs font-semibold text-[#3730A3] shadow-sm">
        <Sparkles size={14} />
        AI 문서 분석 워크스페이스
      </div>
      <h1 className="text-4xl font-semibold leading-[1.15] tracking-[-0.03em] text-[#0F172A] sm:text-5xl">
        긴 문서를 10초 만에
        <br className="hidden sm:block" /> 핵심만 정리합니다
      </h1>
      <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-7 text-[#334155] sm:text-lg">
        사업계획서, 정책 문서, 시험 자료까지 빠르게 이해하고 바로 업무에 활용하세요.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-8 inline-flex h-12 items-center rounded-xl bg-[#1E3A8A] px-7 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(30,58,138,0.35)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#1E40AF] active:translate-y-0"
      >
        문서 넣고 분석하기
      </button>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-[#475569]">
        <span className="inline-flex items-center gap-1 rounded-full border border-[#CBD5E1] bg-white/80 px-3 py-1.5">
          <BadgeCheck size={13} className="text-[#1E3A8A]" /> PDF 업로드 지원
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#CBD5E1] bg-white/80 px-3 py-1.5">
          <Landmark size={13} className="text-[#1E3A8A]" /> 정책 문서
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#CBD5E1] bg-white/80 px-3 py-1.5">
          <FileText size={13} className="text-[#1E3A8A]" /> 사업계획서
        </span>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#CBD5E1] bg-white/80 px-3 py-1.5">
          <GraduationCap size={13} className="text-[#1E3A8A]" /> 시험 자료
        </span>
      </div>
    </section>
  );
}
