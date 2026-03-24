"use client";

import { Copy, Download, FileImage, Printer, Sparkles } from "lucide-react";
import ImagePreviewSection from "@/components/ImagePreviewSection";
import ResultVisualCard, { type ResultVisualCardData } from "@/components/ResultVisualCard";

type ResultData = {
  documentType: string;
  coreSummary: string;
  points: string[];
  detailSections: Array<{ title: string; content: string }>;
  conclusion: string;
};

export default function ResultPanel({
  loading,
  data,
  visualCardData,
  imagePreviewUrl,
  isGeneratingPreview,
  imagePreviewError,
  onRegeneratePreview,
  exportRef,
  onCopy,
  onPdfDownload,
  onImageSave,
  isImageSaving,
  onPrint,
}: {
  loading: boolean;
  data: ResultData | null;
  visualCardData: ResultVisualCardData | null;
  imagePreviewUrl: string | null;
  isGeneratingPreview: boolean;
  imagePreviewError: string | null;
  onRegeneratePreview: () => void;
  exportRef: React.RefObject<HTMLDivElement | null>;
  onCopy: () => void;
  onPdfDownload: () => void;
  onImageSave: () => void;
  isImageSaving: boolean;
  onPrint: () => void;
}) {
  return (
    <section className="surface-card relative rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
          <Sparkles size={15} className="text-[#4F46E5]" />
          분석 결과
        </h2>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            disabled={!data}
            onClick={onCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] bg-white px-2.5 py-1.5 text-xs font-medium text-[#0F172A] transition hover:border-[#6366F1] hover:bg-[#EEF2FF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Copy size={13} />
            복사하기
          </button>
          <button
            type="button"
            disabled={!data}
            onClick={onPdfDownload}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] bg-white px-2.5 py-1.5 text-xs font-medium text-[#0F172A] transition hover:border-[#6366F1] hover:bg-[#EEF2FF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={13} />
            PDF 다운로드
          </button>
          <button
            type="button"
            disabled={isImageSaving || !data}
            onClick={onImageSave}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#C7D2FE] bg-[#EEF2FF] px-2.5 py-1.5 text-xs font-semibold text-[#3730A3] transition hover:bg-[#E0E7FF] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileImage size={13} />
            {isImageSaving ? "이미지 생성 중..." : "이미지로 저장"}
          </button>
          <button
            type="button"
            disabled={!data}
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D1D5DB] bg-white px-2.5 py-1.5 text-xs font-medium text-[#0F172A] transition hover:border-[#6366F1] hover:bg-[#EEF2FF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer size={13} />
            인쇄
          </button>
        </div>
      </div>

      {loading ? (
        <div className="mt-4 space-y-3">
          <div className="shimmer h-5 w-1/2 rounded-lg" />
          <div className="shimmer h-3.5 w-full rounded" />
          <div className="shimmer h-3.5 w-5/6 rounded" />
          <div className="shimmer h-24 w-full rounded-xl" />
        </div>
      ) : data ? (
        <div className="mt-5 space-y-6 animate-fade-in">
          <div className="inline-flex rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-semibold text-[#1E3A8A]">
            문서 유형: {data.documentType}
          </div>
          <div className="rounded-xl border border-[#E2E8F0] bg-gradient-to-b from-white to-[#F8FAFC] p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">핵심 요약</div>
            <p className="mt-2 text-[17px] font-semibold leading-8 text-[#0F172A]">{data.coreSummary}</p>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">주요 포인트</div>
            <ul className="mt-2 space-y-2 text-sm leading-6 text-[#1E293B]">
              {data.points.map((point, idx) => (
                <li key={`${point}-${idx}`} className="flex items-start gap-2 rounded-lg bg-white/70 px-3 py-2 ring-1 ring-[#E2E8F0]">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">상세 설명</div>
            <div className="mt-2 space-y-3">
              {data.detailSections.map((section, idx) => (
                <div key={`${section.title}-${idx}`} className="rounded-xl bg-white/70 px-4 py-3 ring-1 ring-[#E2E8F0]">
                  <div className="text-sm font-semibold text-[#0F172A]">{section.title}</div>
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-[#334155]">{section.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-[#1D4ED8]">한 줄 결론</div>
            <p className="mt-1 text-sm font-semibold text-[#1E3A8A]">{data.conclusion}</p>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-[#CBD5E1] bg-gradient-to-b from-white to-[#F8FAFC] p-8 text-center">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
            <Sparkles size={18} />
          </div>
          <div className="mt-4 text-sm font-semibold text-[#0F172A]">분석 결과가 여기에 표시됩니다</div>
          <div className="mt-1 text-xs leading-6 text-[#64748B]">
            문서를 입력하고 분석 시작을 누르면 요약, 주요 포인트, 상세 설명이 보고서 형태로 정리됩니다.
          </div>
        </div>
      )}

      <ImagePreviewSection
        imagePreviewUrl={imagePreviewUrl}
        isGeneratingPreview={isGeneratingPreview}
        imagePreviewError={imagePreviewError}
        onRegenerate={onRegeneratePreview}
      />

      <div style={{ position: "absolute", left: "-9999px", top: 0, pointerEvents: "none" }} aria-hidden="true">
        {visualCardData ? <ResultVisualCard data={visualCardData} cardRef={exportRef} compact /> : null}
      </div>
    </section>
  );
}
