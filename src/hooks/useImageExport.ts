"use client";

import { useState } from "react";
import { toPng } from "html-to-image";

export function useImageExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportAsPng = async (node: HTMLElement | null, filename = "exploon-summary.png", pixelRatio = 2) => {
    if (!node) return;
    setIsExporting(true);
    setExportError(null);
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch {
      setExportError("이미지 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsExporting(false);
    }
  };

  return { isExporting, exportError, exportAsPng };
}
