"use client";

export default function ResultCardTextBlock({
  coreSummary,
  points,
  conclusion,
}: {
  coreSummary: string;
  points: string[];
  conclusion: string;
}) {
  return (
    <div className="mt-6 space-y-5">
      <div>
        <h4 className="text-2xl font-semibold tracking-tight text-[#111827]">문서 핵심 요약</h4>
        <p className="mt-3 line-clamp-5 text-base leading-8 text-[#1F2937]">{coreSummary}</p>
      </div>

      <div>
        <div className="text-sm font-semibold text-[#1E3A8A]">주요 포인트</div>
        <ul className="mt-2 space-y-2">
          {points.slice(0, 4).map((point, idx) => (
            <li key={`${point}-${idx}`} className="flex items-start gap-2.5 text-sm leading-7 text-[#374151]">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#1E3A8A]" />
              <span className="line-clamp-3">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] px-4 py-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-[#1D4ED8]">한 줄 결론</div>
        <p className="mt-1 text-sm font-semibold text-[#1E3A8A]">{conclusion}</p>
      </div>
    </div>
  );
}
