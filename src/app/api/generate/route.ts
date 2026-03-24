import { NextResponse } from "next/server";
import { generateComicPanels } from "@/lib/generateComicPanels";
import { generatePanelImages } from "@/lib/generatePanelImages";
import { svgDataUriForPanel } from "@/lib/fallbackComic";
import type { MenuId } from "@/lib/comicPrompt";

export const runtime = "nodejs";

function isMenuId(value: string): value is MenuId {
  return value === "education" || value === "business" || value === "government";
}

type SelectedSection = {
  id: string;
  title: string;
  summary: string;
  chunkText: string;
  previousEvidencePlanHint?: string;
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const menuRaw = String(formData.get("menu") ?? "education");
    const menu: MenuId = isMenuId(menuRaw) ? menuRaw : "education";
    const includeImages = String(formData.get("includeImages") ?? "true") !== "false";

    const sectionsRaw = formData.get("sections");
    if (!sectionsRaw || typeof sectionsRaw !== "string") {
      return NextResponse.json(
        { error: "섹션 분석 결과(선택된 섹션)가 필요해요. 먼저 '섹션 분석'을 진행해 주세요." },
        { status: 400 },
      );
    }

    let selectedSections: SelectedSection[];
    try {
      selectedSections = JSON.parse(sectionsRaw) as SelectedSection[];
    } catch {
      return NextResponse.json({ error: "sections 파싱에 실패했습니다." }, { status: 400 });
    }

    if (!Array.isArray(selectedSections) || selectedSections.length === 0) {
      return NextResponse.json({ error: "선택된 섹션이 없습니다." }, { status: 400 });
    }

    // 섹션별로 독립 생성(= 한 섹션 = 한 4패널 세트)
    const results = [];
    for (const sec of selectedSections) {
      const panels = await generateComicPanels(sec.chunkText, menu, {
        previousEvidencePlanHint: sec.previousEvidencePlanHint,
      });

      let imageUrls: string[] = [];
      if (includeImages) {
        try {
          imageUrls = await generatePanelImages(panels, { timeoutMs: 7000 });
        } catch {
          // 이미지가 실패해도 캡션/장면 데이터는 보존하고, 화면은 폴백 SVG로 유지합니다.
          imageUrls = panels.map((_, i) => svgDataUriForPanel(i));
        }
      } else {
        imageUrls = panels.map(() => "");
      }

      const finalPanels = panels.map((p, i) => ({
        title: p.title,
        caption: p.caption,
        learningPoint: p.learningPoint,
        sceneType: p.sceneType ?? "",
        scene: p.scene,
        requiredObjects: p.requiredObjects,
        requiredEvidenceElements: p.requiredEvidenceElements,
        environment: p.environment,
        peopleRoles: p.peopleRoles,
        visibleCauseEffect: p.visibleCauseEffect,
        visibleDataElements: p.visibleDataElements,
        imagePrompt: p.imagePrompt,
        imageUrl: imageUrls[i],
      }));

      results.push({
        id: sec.id,
        title: sec.title,
        summary: sec.summary,
        panels: finalPanels,
      });
    }

    return NextResponse.json({ sections: results });
  } catch (e) {
    const message = e instanceof Error ? e.message : "서버에서 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

