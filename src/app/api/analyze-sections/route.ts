import { NextResponse } from "next/server";
import { extractTextFromUploadedFile, getImageOCRStub } from "@/lib/extractText";
import { analyzeSections } from "@/lib/analyzeSections";
import type { MenuId } from "@/lib/comicPrompt";

export const runtime = "nodejs";

function isMenuId(value: string): value is MenuId {
  return value === "education" || value === "business" || value === "government";
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const menuRaw = String(formData.get("menu") ?? "education");
    const menu: MenuId = isMenuId(menuRaw) ? menuRaw : "education";

    const textRaw = String(formData.get("text") ?? "");
    const file = formData.get("file");
    const image = formData.get("image");

    const hasText = textRaw.trim().length > 0;
    const hasFile = file instanceof File;
    const hasImage = image instanceof File;

    let inputText = hasText ? textRaw : "";

    if (!inputText && hasFile) {
      inputText = await extractTextFromUploadedFile(file as File);
    }

    if (!inputText && hasImage) {
      inputText = getImageOCRStub((image as File).name);
    }

    if (!inputText || inputText.trim().length === 0) {
      return NextResponse.json({ error: "입력 텍스트(또는 PDF/TXT 파일)가 필요해요." }, { status: 400 });
    }

    const sections = await analyzeSections(inputText, menu);

    if (!sections.length) {
      return NextResponse.json({ error: "섹션을 분석하지 못했어요. 다른 문장/단락으로 다시 시도해 주세요." }, { status: 500 });
    }

    return NextResponse.json({ sections });
  } catch (e) {
    const message = e instanceof Error ? e.message : "서버에서 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

