import { PDFParse } from "pdf-parse";

function normalizeText(input: string) {
  return input.replace(/\r/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function extractTextFromUploadedFile(file: File): Promise<string> {
  const name = file.name || "document";
  const buffer = Buffer.from(await file.arrayBuffer());

  const lower = name.toLowerCase();
  const isPdf = file.type === "application/pdf" || lower.endsWith(".pdf");

  if (isPdf) {
    const parser = new PDFParse({ data: buffer });
    try {
      const textResult = await withTimeout(
        parser.getText(),
        12000,
        "PDF 텍스트 추출 시간이 초과되었습니다. 용량이 더 작은 PDF나 텍스트 입력을 사용해 주세요.",
      );
      const record = textResult as { text?: string };
      const text = String(record.text ?? "");
      if (!text.trim()) {
        throw new Error("PDF에서 추출된 텍스트가 없습니다. 스캔본 PDF일 수 있습니다.");
      }
      return normalizeText(text);
    } finally {
      // 메모리/리소스 누수 방지
      await parser.destroy().catch(() => {});
    }
  }

  // 기본: 텍스트 파일로 처리
  const text = buffer.toString("utf8");
  return normalizeText(text);
}

export function getImageOCRStub(fileName?: string) {
  const name = fileName ? `(${fileName})` : "";
  return normalizeText(
    `업로드된 이미지를 읽기 위한 OCR은 MVP에서 아직 지원되지 않습니다 ${name}. ` +
      `따라서 이미지에서 텍스트를 추출할 수는 없고, 사용자가 전달하고 싶은 핵심 내용을 일반 설명으로 잡아서 만화로 만들어야 합니다. ` +
      `가능하면 textarea에 내용을 함께 붙여 주세요.`
  );
}

