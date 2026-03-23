import type { ComicPanel } from "@/lib/comicPrompt";

export type ComicPanelWithImage = ComicPanel & { imageUrl: string };

function clampCaption(text: string) {
  // MVP: 간단히 1~2줄 정도를 기대하고, 화면에서는 `line-clamp-2`로 제어합니다.
  return text.trim();
}

export default function ComicPanels({ panels }: { panels: ComicPanelWithImage[] }) {
  return (
    <div className="flex flex-col gap-4">
      {panels.map((p, idx) => (
        <div key={idx} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="rounded-lg bg-zinc-50 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.imageUrl}
              alt={p.title}
              className="h-auto w-full rounded-md"
              loading="lazy"
            />
          </div>
          <div className="mt-3">
            <div className="text-sm font-semibold text-zinc-900">{p.title}</div>
            <div
              className="mt-1 text-[14px] leading-5 text-zinc-700 overflow-hidden [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical]"
            >
              {clampCaption(p.caption)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

