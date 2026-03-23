"use client";

import type { MenuId } from "@/lib/comicPrompt";

const MENU: Array<{ id: MenuId; label: string; hint: string }> = [
  { id: "education", label: "교육", hint: "쉽게 단계별로" },
  { id: "business", label: "사업 계획", hint: "요점 중심" },
  { id: "government", label: "정부 문서", hint: "절차/규정 중심" },
];

export default function MenuTabs({
  menu,
  onChange,
}: {
  menu: MenuId;
  onChange: (menu: MenuId) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {MENU.map((m) => {
        const active = m.id === menu;
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => onChange(m.id)}
            className={[
              "shrink-0 rounded-full border px-4 py-2 text-sm transition",
              active
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50",
            ].join(" ")}
          >
            <div className="font-semibold">{m.label}</div>
            <div className="text-[11px] opacity-80">{m.hint}</div>
          </button>
        );
      })}
    </div>
  );
}

