import { PDFParse } from "pdf-parse";

function normalizeText(input: string) {
  return input.replace(/\r/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export async function extractTextFromUploadedFile(file: File): Promise<string> {
  const name = file.name || "document";
  const buffer = Buffer.from(await file.arrayBuffer());

  const lower = name.toLowerCase();
  const isPdf = file.type === "application/pdf" || lower.endsWith(".pdf");

  if (isPdf) {
    const parser = new PDFParse({ data: buffer });
    try {
      const textResult = await parser.getText();
      const text = String((textResult as any)?.text ?? "");
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

