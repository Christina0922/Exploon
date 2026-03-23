import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const urlObj = new URL(req.url);
    const url = urlObj.searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "url 파라미터가 필요합니다." }, { status: 400 });
    }

    // 데이터 URL은 프록시하지 않고 그대로 사용합니다(캔버스 로딩에서 별도 처리).
    if (url.startsWith("data:image")) {
      return NextResponse.json({ error: "data:image는 프록시 대상이 아닙니다." }, { status: 400 });
    }

    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return NextResponse.json({ error: "http/https만 허용합니다." }, { status: 400 });
    }

    const res = await fetch(parsed.toString());
    if (!res.ok) {
      return NextResponse.json({ error: "이미지를 가져오지 못했습니다." }, { status: 502 });
    }

    const arrayBuffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "image/png";

    return new Response(arrayBuffer, {
      headers: {
        "content-type": contentType,
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "이미지 프록시 실패" }, { status: 500 });
  }
}

