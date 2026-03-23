import type { ComicPanel } from "@/lib/comicPrompt";
import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai";
import { svgDataUriForPanel } from "@/lib/fallbackComic";

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(label)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

type ImageSize = "auto" | "256x256" | "512x512" | "1024x1024" | "1024x1536" | "1536x1024" | "1024x1792" | "1792x1024";

function toImageSize(size?: string): ImageSize {
  const value = size ?? "512x512";
  const allow: Record<ImageSize, true> = {
    auto: true,
    "256x256": true,
    "512x512": true,
    "1024x1024": true,
    "1024x1536": true,
    "1536x1024": true,
    "1024x1792": true,
    "1792x1024": true,
  };
  return value in allow ? (value as ImageSize) : "512x512";
}

type GeneratedImageItem = {
  url?: string;
  b64_json?: string;
};

type GeneratedImagesResponse = {
  data?: GeneratedImageItem[];
};

export async function generatePanelImages(panels: ComicPanel[], opts?: { timeoutMs?: number; size?: string }) {
  if (!isOpenAIConfigured()) {
    // API 키가 없으면 “텍스트 없는” 더미 SVG 4장을 반환합니다.
    return panels.map((_, i) => svgDataUriForPanel(i));
  }

  const client = getOpenAIClient();

  const prompts = panels.map((p) => p.imagePrompt ?? "");
  if (prompts.some((p) => !p.trim())) {
    // 프롬프트가 비어 있으면 거의 의미 없는 이미지가 나옵니다.
    throw new Error("imagePrompt이 비어 있습니다. 패널 생성 품질 게이트를 통과했는지 확인해 주세요.");
  }

  const timeoutMs = opts?.timeoutMs ?? 7000; // section 1개 기준 총 처리 10초 목표
  const size = toImageSize(opts?.size);

  const tasks = prompts.map(async (prompt, idx) => {
    const res = (await client.images.generate({
      model: "gpt-image-1",
      prompt,
      size,
    })) as GeneratedImagesResponse;

    const item = res?.data?.[0];
    const url = item?.url;
    const b64 = item?.b64_json;

    if (url) return url as string;
    if (b64) return `data:image/png;base64,${b64}` as string;
    throw new Error(`이미지 생성 결과 해석 실패: panel ${idx + 1}`);
  });

  // 4장을 병렬로 만들고, 시간 제한 안에 완료 못하면 throw해서 폴백으로 대체합니다.
  return await withTimeout(Promise.all(tasks), timeoutMs, "IMAGE_GEN_TIMEOUT");
}

