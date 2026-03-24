import { NextResponse } from "next/server";
import { extractTextFromUploadedFile, getImageOCRStub } from "@/lib/extractText";
import { generateDocumentSummary, type AnalysisMode } from "@/lib/generateDocumentSummary";

export const runtime = "nodejs";

function isMode(value: string): value is AnalysisMode {
  return value === "summary" || value === "structure" || value === "rewrite" || value === "exam";
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const modeRaw = String(formData.get("mode") ?? "summary");
    const mode: AnalysisMode = isMode(modeRaw) ? modeRaw : "summary";

    const textRaw = String(formData.get("text") ?? "");
    const file = formData.get("file");
    const image = formData.get("image");

    const hasText = textRaw.trim().length > 0;
    const hasFile = file instanceof File;
    const hasImage = image instanceof File;

    let inputText = hasText ? textRaw : "";
    if (!inputText && hasFile) inputText = await extractTextFromUploadedFile(file as File);
    if (!inputText && hasImage) inputText = getImageOCRStub((image as File).name);

    if (!inputText.trim()) {
      return NextResponse.json({ error: "입력 텍스트(또는 PDF/TXT 파일)가 필요합니다." }, { status: 400 });
    }

    const result = await generateDocumentSummary(inputText, mode);
    return NextResponse.json({ result });
  } catch (e) {
    const message = e instanceof Error ? e.message : "서버 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
