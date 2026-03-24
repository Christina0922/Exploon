"use client";

import { CircleHelp, Mail } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[#E5E7EB]/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#1E3A8A] text-white shadow-sm">
            <span className="text-sm font-bold">E</span>
          </div>
          <div className="text-lg font-semibold tracking-tight text-[#111827]">Exploon</div>
        </div>
        <nav className="flex items-center gap-2 text-sm text-[#4B5563]">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 transition hover:bg-[#EEF2FF] hover:text-[#1E3A8A]"
          >
            <CircleHelp size={14} />
            사용법
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 transition hover:bg-[#EEF2FF] hover:text-[#1E3A8A]"
          >
            <Mail size={14} />
            문의
          </button>
        </nav>
      </div>
    </header>
  );
}
