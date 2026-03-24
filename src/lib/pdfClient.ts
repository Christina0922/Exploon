"use client";

import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

type PdfTextResult = {
  text: string;
  pageCount: number;
};

let workerConfigured = false;

function configureWorker() {
  if (workerConfigured) return;
  // CDN 의존을 제거하고 public에 둔 로컬 worker를 사용합니다.
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  workerConfigured = true;
}

export async function extractTextFromPdf(
  file: File,
  onProgress?: (current: number, total: number) => void,
): Promise<PdfTextResult> {
  configureWorker();
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    onProgress?.(pageNum, pdf.numPages);
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => {
        if ("str" in item && typeof item.str === "string") return item.str;
        return "";
      })
      .join(" ")
      .replace(/\s{2,}/g, " ")
      .trim();

    fullText += `\n\n[페이지 ${pageNum}]\n${pageText}`;
  }

  return {
    text: fullText.trim(),
    pageCount: pdf.numPages,
  };
}
