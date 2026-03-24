"use client";

import { useRef, useState } from "react";
import { CloudUpload, FileText, Lock, Sparkles } from "lucide-react";

type InputPanelProps = {
  text: string;
  setText: (v: string) => void;
  file: File | null;
  image: File | null;
  onSelectFile: (f: File | null) => void;
  onSelectImage: (f: File | null) => void;
  inputMode: "text" | "pdf" | "image";
  isExtractingPdf: boolean;
  pdfExtractError: string | null;
  extractedTextLength: number;
  extractionProgressText: string;
};

export default function InputPanel({
  text,
  setText,
  file,
  image,
  onSelectFile,
  onSelectImage,
  inputMode,
  isExtractingPdf,
  pdfExtractError,
  extractedTextLength,
  extractionProgressText,
}: InputPanelProps) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <section className="surface-card rounded-2xl p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-[#0F172A]">
            <FileText size={16} className="text-[#1E3A8A]" />
            문서 입력
          </h2>
          <p className="mt-1 text-xs leading-5 text-[#64748B]">
            분석할 내용을 입력하거나 파일을 업로드하세요. 장문 문서도 자동으로 핵심 섹션을 분리합니다.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-semibold text-[#1E3A8A]">
          <Sparkles size={12} /> Smart Parse
        </span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="분석할 문서를 붙여넣거나 업로드하세요"
        className="mt-4 min-h-[240px] w-full resize-y rounded-2xl border border-[#CBD5E1] bg-gradient-to-b from-white to-[#F8FAFC] p-4 text-sm leading-6 text-[#0F172A] outline-none ring-0 transition placeholder:text-[#94A3B8] focus:border-[#6366F1] focus:shadow-[0_0_0_4px_rgba(99,102,241,0.12)]"
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const dropped = e.dataTransfer.files?.[0] ?? null;
          if (!dropped) return;
          if (dropped.type.startsWith("image/")) {
            onSelectImage(dropped);
          } else {
            onSelectFile(dropped);
          }
        }}
        className={[
          "mt-4 rounded-2xl border-2 border-dashed p-4 text-sm transition",
          dragOver
            ? "border-[#1E3A8A] bg-[#EFF6FF] shadow-[0_0_0_4px_rgba(30,58,138,0.12)]"
            : "border-[#CBD5E1] bg-[#F8FAFC]",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-[#1F2937]">
              <CloudUpload size={16} className="text-[#1E3A8A]" />
              PDF / TXT / 이미지 업로드
            </div>
            <div className="mt-1 text-xs text-[#64748B]">파일을 드래그하거나 버튼으로 업로드하세요.</div>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="rounded-xl border border-[#C7D2FE] bg-white px-3 py-2 text-xs font-semibold text-[#1E3A8A] transition hover:-translate-y-0.5 hover:border-[#6366F1] hover:shadow-sm active:translate-y-0"
          >
            파일 선택
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,application/pdf,text/plain,image/*"
          onChange={(e) => {
            const selected = e.target.files?.[0] ?? null;
            if (!selected) return;
            if (selected.type.startsWith("image/")) {
              onSelectImage(selected);
            } else {
              onSelectFile(selected);
            }
          }}
          className="hidden"
        />

        {file || image ? (
          <div className="mt-3 rounded-lg border border-[#BFDBFE] bg-white px-3 py-2 text-xs text-[#334155]">
            업로드됨: <span className="font-semibold">{file?.name ?? image?.name}</span>
          </div>
        ) : null}

        {isExtractingPdf ? (
          <div className="mt-2 text-xs font-medium text-[#1E3A8A]">PDF 텍스트 추출 중... {extractionProgressText}</div>
        ) : null}
        {!isExtractingPdf && inputMode === "pdf" && extractedTextLength > 0 ? (
          <div className="mt-2 text-xs font-medium text-[#0F766E]">PDF 텍스트 추출 완료 ({extractedTextLength.toLocaleString()}자)</div>
        ) : null}
        {pdfExtractError ? <div className="mt-2 text-xs font-medium text-[#B91C1C]">{pdfExtractError}</div> : null}
      </div>

      <div className="mt-3 inline-flex items-center gap-1 text-xs text-[#64748B]">
        <Lock size={12} />
        업로드된 문서는 저장되지 않으며 분석 후 즉시 폐기됩니다.
      </div>
    </section>
  );
}
