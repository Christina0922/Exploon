"use client";

import { useEffect, useState } from "react";
import { toPng } from "html-to-image";

export function useGeneratedImagePreview(
  nodeRef: React.RefObject<HTMLElement | null>,
  sourceKey: string,
  enabled: boolean,
) {
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [imagePreviewError, setImagePreviewError] = useState<string | null>(null);

  const generate = async () => {
    if (!enabled) {
      setImagePreviewUrl(null);
      setImagePreviewError(null);
      return;
    }
    const node = nodeRef.current;
    if (!node) return;

    setIsGeneratingPreview(true);
    setImagePreviewError(null);
    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      setImagePreviewUrl(dataUrl);
    } catch {
      setImagePreviewError("이미지 미리보기를 생성하지 못했습니다.");
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!enabled) {
        setImagePreviewUrl(null);
        setImagePreviewError(null);
        return;
      }
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (cancelled) return;
      await generate();
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [sourceKey, enabled]);

  return {
    imagePreviewUrl,
    isGeneratingPreview,
    imagePreviewError,
    regenerateImagePreview: generate,
  };
}
