"use client";

import { Image as ImageIcon, RefreshCw, Sparkles } from "lucide-react";

export default function ImagePreviewSection({
  imagePreviewUrl,
  isGeneratingPreview,
  imagePreviewError,
  onRegenerate,
}: {
  imagePreviewUrl: string | null;
  isGeneratingPreview: boolean;
  imagePreviewError: string | null;
  onRegenerate: () => void;
}) {
  return (
    <section className="mt-8 rounded-2xl border border-[#DCE6FF] bg-gradient-to-b from-[#F8FBFF] to-[#F1F6FF] p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#0F172A]">이미지 카드 미리보기</h3>
          <p className="mt-1 text-xs text-[#5B6B86]">저장하거나 보고서용으로 활용할 수 있습니다.</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-[#DBE4FF] bg-[#EEF4FF] p-6 sm:p-6">
        {isGeneratingPreview ? (
          <div className="grid min-h-[340px] place-items-center rounded-2xl border border-dashed border-[#C6D3F7] bg-white/70 text-center">
            <div>
              <div className="mx-auto h-10 w-40 rounded-lg shimmer" />
              <div className="mt-4 text-sm font-semibold text-[#0F172A]">이미지 미리보기 생성 중...</div>
            </div>
          </div>
        ) : imagePreviewUrl ? (
          <div className="flex justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreviewUrl}
              alt="생성된 이미지 카드 미리보기"
              className="block w-full max-w-[860px] rounded-[20px] shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
            />
          </div>
        ) : imagePreviewError ? (
          <div className="grid min-h-[340px] place-items-center rounded-2xl border border-dashed border-[#FCA5A5] bg-white/70 text-center">
            <div>
              <div className="text-sm font-semibold text-[#991B1B]">이미지 미리보기를 생성하지 못했습니다</div>
              <button
                type="button"
                onClick={onRegenerate}
                className="mt-3 inline-flex items-center gap-1 rounded-lg border border-[#FCA5A5] bg-white px-3 py-1.5 text-xs font-semibold text-[#B91C1C]"
              >
                <RefreshCw size={12} />
                다시 생성
              </button>
            </div>
          </div>
        ) : (
          <div className="grid min-h-[340px] place-items-center rounded-2xl border border-dashed border-[#C6D3F7] bg-white/70 text-center">
            <div>
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]">
                <ImageIcon size={20} />
              </div>
              <div className="mt-4 text-sm font-semibold text-[#0F172A]">이미지 카드가 아직 생성되지 않았습니다</div>
              <div className="mt-1 text-xs leading-6 text-[#64748B]">
                분석이 완료되면 이미지와 핵심 요약이 결합된 카드가 여기에 표시됩니다.
              </div>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[#5B6B86]">
                <Sparkles size={12} />
                분석 완료 후 자동 미리보기
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
