"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import { Clock3, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import InputPanel from "@/components/InputPanel";
import OptionPanel, { type AnalysisOptionId } from "@/components/OptionPanel";
import ResultPanel from "@/components/ResultPanel";
import type { ResultVisualCardData } from "@/components/ResultVisualCard";
import { useImageExport } from "@/hooks/useImageExport";
import { useGeneratedImagePreview } from "@/hooks/useGeneratedImagePreview";
import type { AnalysisMode, DocumentSummaryResult } from "@/lib/generateDocumentSummary";
import { extractTextFromPdf } from "@/lib/pdfClient";

function normalizeErrorMessage(err: unknown) {
  if (!err) return "오류가 발생했어요. 다시 시도해 주세요.";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || "오류가 발생했어요. 다시 시도해 주세요.";
  return "오류가 발생했어요. 다시 시도해 주세요.";
}

export default function Home() {
  const mainRef = useRef<HTMLDivElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const { isExporting, exportError, exportAsPng } = useImageExport();
  const sampleBusiness = useMemo(() => {
    return "정부는 2030년 제약바이오 기술이전 30조원 달성을 목표로 복지부·중기부 협업 지원안을 발표했다. 지원체계는 R&D, 임상, 사업화, 글로벌 진출까지 전주기를 포함하며 4UP 전략과 이어달리기형 지원을 핵심 프레임으로 제시했다. 오픈이노베이션과 해외 거점 연계도 병행한다. 업계는 부처 간 협업 부족, 상장 유지 부담, 평가 기준 불일치 문제를 제기했고 정부는 후속 조정안을 마련하겠다고 밝혔다.";
  }, []);

  const [selectedOption, setSelectedOption] = useState<AnalysisOptionId>("summary");
  const [inputMode, setInputMode] = useState<"text" | "pdf" | "image">("text");
  const [text, setText] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [pdfExtractError, setPdfExtractError] = useState<string | null>(null);
  const [extractionProgress, setExtractionProgress] = useState("");
  const [ocrText] = useState("");

  const [result, setResult] = useState<DocumentSummaryResult | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingMs, setProcessingMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runAnalyzeAndGenerate(nextText?: string) {
    const manualText = (nextText ?? text).trim();
    const analysisSourceText = extractedText.trim() || manualText || ocrText.trim() || "";
    console.log("Analysis source length:", analysisSourceText.length);
    if (!analysisSourceText && !image) {
      setError("분석할 텍스트가 없습니다. PDF 추출 완료를 확인하거나 텍스트를 입력해 주세요.");
      return;
    }
    const mode: AnalysisMode = selectedOption;
    const started = Date.now();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fd = new FormData();
      fd.append("mode", mode);
      if (analysisSourceText) fd.append("text", analysisSourceText);
      if (selectedFile && !analysisSourceText) fd.append("file", selectedFile);
      if (image) fd.append("image", image);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch("/api/summarize", {
        method: "POST",
        body: fd,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `요약 요청 실패: ${res.status}`);
      }
      const data = (await res.json()) as { result: DocumentSummaryResult };
      setResult(data.result ?? null);
      setProcessingMs(Date.now() - started);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") {
        setError("분석 요청 시간이 초과되었습니다. PDF 용량을 줄이거나 텍스트를 직접 붙여 넣어 다시 시도해 주세요.");
      } else {
        setError(normalizeErrorMessage(e));
      }
    } finally {
      setLoading(false);
    }
  }

  const hasSourceText = extractedText.trim().length > 0 || text.trim().length > 0 || ocrText.trim().length > 0;
  const needsPdfText = inputMode === "pdf" && selectedFile !== null && extractedText.trim().length === 0;
  const canAnalyze = !loading && !isExtractingPdf && !needsPdfText && (hasSourceText || image !== null);
  const visualCardData: ResultVisualCardData | null = result
    ? {
        documentType: result.documentType,
        coreSummary: result.coreSummary,
        points: result.keyPoints,
        conclusion: result.conclusion,
        createdAt: new Date().toLocaleString("ko-KR"),
        coverImageUrl: uploadedImageUrl ?? undefined,
      }
    : null;
  const previewKey = visualCardData
    ? [
        visualCardData.documentType,
        visualCardData.coreSummary,
        visualCardData.points.join("|"),
        visualCardData.conclusion,
        visualCardData.coverImageUrl ?? "",
      ].join("::")
    : "";
  const { imagePreviewUrl, isGeneratingPreview, imagePreviewError, regenerateImagePreview } = useGeneratedImagePreview(
    exportRef,
    previewKey,
    Boolean(visualCardData),
  );

  useEffect(() => {
    if (!image) {
      setUploadedImageUrl(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setUploadedImageUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [image]);

  const trustTimeLabel = processingMs ? `약 ${Math.max(1, Math.round(processingMs / 1000))}초` : "약 5초";

  return (
    <div className="min-h-screen">
      <Header />
      <Hero
        onStart={() => {
          mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />

      <main ref={mainRef} className="mx-auto mt-12 w-full max-w-6xl px-4 pb-14 sm:px-6">
        <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
          <div className="space-y-4">
            <InputPanel
              text={text}
              setText={setText}
              file={selectedFile}
              image={image}
              onSelectFile={(f) => {
                setSelectedFile(f);
                setImage(null);
                setInputMode(f ? "pdf" : "text");
                setPdfExtractError(null);
                setExtractedText("");
                setExtractionProgress("");
                if (!f) return;
                const lower = f.name.toLowerCase();
                const isPdf = f.type === "application/pdf" || lower.endsWith(".pdf");
                console.log("PDF selected:", f.name, f.type);
                if (!isPdf) {
                  setPdfExtractError("PDF 파일만 업로드할 수 있습니다.");
                  return;
                }
                if (f.size > 20 * 1024 * 1024) {
                  setPdfExtractError("PDF 파일 크기는 20MB 이하만 지원합니다.");
                  return;
                }
                setIsExtractingPdf(true);
                void extractTextFromPdf(f, (current, total) => {
                  setExtractionProgress(`${current}/${total}페이지`);
                })
                  .then(({ text: extracted, pageCount }) => {
                    const normalized = extracted.trim();
                    console.log("Extracted text length:", normalized.length);
                    if (!normalized || normalized.length < 60) {
                      setPdfExtractError(
                        "이 PDF에서는 읽을 수 있는 텍스트를 찾지 못했습니다. 스캔본 PDF일 수 있어 OCR 처리가 필요할 수 있습니다.",
                      );
                      setExtractedText("");
                      return;
                    }
                    setPdfExtractError(null);
                    setExtractedText(normalized);
                    const preview = normalized.length > 2000 ? `${normalized.slice(0, 2000)}\n\n...(중략)` : normalized;
                    setText(preview);
                    setExtractionProgress(`${pageCount}페이지 완료`);
                  })
                  .catch((err: unknown) => {
                    setExtractedText("");
                    setPdfExtractError(
                      err instanceof Error
                        ? `PDF 텍스트 추출에 실패했습니다. ${err.message}`
                        : "PDF 텍스트 추출에 실패했습니다.",
                    );
                  })
                  .finally(() => {
                    setIsExtractingPdf(false);
                  });
              }}
              onSelectImage={(f) => {
                setImage(f);
                setSelectedFile(null);
                setInputMode(f ? "image" : "text");
                setPdfExtractError(null);
                setExtractedText("");
                setExtractionProgress("");
              }}
              inputMode={inputMode}
              isExtractingPdf={isExtractingPdf}
              pdfExtractError={pdfExtractError}
              extractedTextLength={extractedText.length}
              extractionProgressText={extractionProgress}
            />
            <div className="surface-card rounded-2xl px-4 py-3 text-xs text-[#475569]">
              <div className="flex flex-wrap items-center gap-4">
                <div className="inline-flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-[#1E3A8A]" />
                  업로드된 문서는 저장되지 않습니다
                </div>
                <div className="inline-flex items-center gap-1.5">
                  <Clock3 size={13} className="text-[#1E3A8A]" />
                  예상 처리 시간: {trustTimeLabel}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setText(sampleBusiness);
                setSelectedFile(null);
                setImage(null);
                setInputMode("text");
                setExtractedText("");
                setPdfExtractError(null);
                setExtractionProgress("");
              }}
              className="inline-flex w-fit items-center rounded-xl border border-[#D1D5DB] bg-white px-3.5 py-2 text-xs font-semibold text-[#334155] shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#94A3B8] hover:bg-[#F8FAFC] active:translate-y-0"
            >
              예시 문서 불러오기
            </button>
          </div>

          <OptionPanel
            selected={selectedOption}
            onSelect={setSelectedOption}
            onAnalyze={() => void runAnalyzeAndGenerate()}
            disabled={!canAnalyze}
            loading={loading || isExtractingPdf}
          />
        </div>

        <div className="mt-5">
          <ResultPanel
            loading={loading}
            data={
              result
                ? {
                    documentType: result.documentType,
                    coreSummary: result.coreSummary,
                    points: result.keyPoints,
                    detailSections: result.detailSections,
                    conclusion: result.conclusion,
                  }
                : null
            }
            visualCardData={visualCardData}
            imagePreviewUrl={imagePreviewUrl}
            isGeneratingPreview={isGeneratingPreview}
            imagePreviewError={imagePreviewError}
            onRegeneratePreview={() => {
              void regenerateImagePreview();
            }}
            exportRef={exportRef}
            onCopy={() => {
              if (!result) return;
              void navigator.clipboard.writeText(
                [
                  `[문서 유형] ${result.documentType}`,
                  "",
                  `[핵심 요약]`,
                  result.coreSummary,
                  "",
                  `[주요 포인트]`,
                  ...result.keyPoints.map((p) => `- ${p}`),
                  "",
                  `[상세 설명]`,
                  ...result.detailSections.map((s) => `${s.title}\n${s.content}`),
                  "",
                  `[한 줄 결론]`,
                  result.conclusion,
                ].join("\n"),
              );
            }}
            onPdfDownload={() => {
              if (!result) return;
              const doc = new jsPDF({ unit: "pt", format: "a4" });
              const title = "Exploon 분석 결과";
              const body = [
                `문서 유형: ${result.documentType}`,
                "",
                `핵심 요약: ${result.coreSummary}`,
                "",
                "주요 포인트:",
                ...result.keyPoints.map((p) => `- ${p}`),
                "",
                "상세 설명:",
                ...result.detailSections.map((s) => `${s.title}: ${s.content}`),
                "",
                `한 줄 결론: ${result.conclusion}`,
              ].join("\n");
              doc.setFontSize(14);
              doc.text(title, 40, 48);
              doc.setFontSize(10);
              const lines = doc.splitTextToSize(body, 515);
              doc.text(lines, 40, 72);
              doc.save("exploon-analysis.pdf");
            }}
            onImageSave={() => {
              if (!result) return;
              if (imagePreviewUrl) {
                const link = document.createElement("a");
                link.download = "exploon-summary.png";
                link.href = imagePreviewUrl;
                link.click();
                return;
              }
              void exportAsPng(exportRef.current, "exploon-summary.png", 2);
            }}
            isImageSaving={isExporting}
            onPrint={() => {
              if (!result) return;
              window.print();
            }}
          />
        </div>

        {result ? (
          <div className="surface-card mt-4 rounded-xl p-4 text-xs font-medium text-[#64748B]">
            문서 유형: {result.documentType} · 분석 모드: {selectedOption} · 처리 시간: {trustTimeLabel}
          </div>
        ) : null}

        {exportError ? (
          <div className="mt-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
            {exportError}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#991B1B]">
            {error}
          </div>
        ) : null}
      </main>
    </div>
  );
}

