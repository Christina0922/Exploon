"use client";

import { useMemo, useState } from "react";
import MenuTabs from "@/components/MenuTabs";
import LoadingSpinner from "@/components/LoadingSpinner";
import ComicPanels, { type ComicPanelWithImage } from "@/components/ComicPanels";
import type { MenuId } from "@/lib/comicPrompt";
import type { SectionAnalysis, SectionResult } from "@/lib/sections";

function normalizeErrorMessage(err: unknown) {
  if (!err) return "오류가 발생했어요. 다시 시도해 주세요.";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || "오류가 발생했어요. 다시 시도해 주세요.";
  return "오류가 발생했어요. 다시 시도해 주세요.";
}

async function loadImage(url: string) {
  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    // 서버 프록시를 사용하면 CORS 이슈가 줄어듭니다.
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지를 불러오지 못했습니다."));
    img.src = url;
  });
}

export default function Home() {
  const sampleEducation = useMemo(
    () =>
      "지구의 평균 기온이 계속 오르는 이유를 알고 싶어. 온실가스가 무엇인지, 왜 문제가 되는지, 그리고 우리가 할 수 있는 해결 방법을 쉽게 설명해 줘.",
    [],
  );

  const samplePolicy = useMemo(
    () =>
      "청년 창업 지원 사업은 신청 자격이 중요하다. 만 나이 요건과 사업 기간이 있으며, 동일 사업 중복 제한도 있다. 제출 서류는 신청서, 사업계획서, 증빙자료이고, 서류는 기한 내 온라인으로 제출해야 한다. 심사는 서류와 면담으로 진행되고, 선정된 뒤에는 정해진 절차대로 지원금을 집행한다.",
    [],
  );

  const sampleBusiness = useMemo(
    () =>
      "새로운 카페 사업을 시작하려고 한다. 목표는 동네에서 빠르게 자리 잡는 것이다. 먼저 고객이 원하는 메뉴와 가격을 조사하고, 운영 시간과 인력 계획을 세운다. 다음으로 소셜 채널로 홍보하고, 시범 운영으로 반응을 확인한다. 예상 결과로는 초기 매출 안정화와 재방문율 상승이 목표다.",
    [],
  );

  const [menu, setMenu] = useState<MenuId>("education");
  const [text, setText] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);

  const [analysisSections, setAnalysisSections] = useState<SectionAnalysis[] | null>(null);
  const [selectedSectionIds, setSelectedSectionIds] = useState<string[]>([]);
  const [resultsBySection, setResultsBySection] = useState<Record<string, SectionResult>>({});
  const [expandedSectionIds, setExpandedSectionIds] = useState<string[]>([]);

  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyzeSectionsAndSelectAll(nextText?: string, menuOverride?: MenuId) {
    const bodyText = (nextText ?? text).trim();

    if (!bodyText && !file && !image) return;

    const useMenu = menuOverride ?? menu;

    setAnalyzing(true);
    setError(null);
    setAnalysisSections(null);
    setSelectedSectionIds([]);
    setResultsBySection({});
    setExpandedSectionIds([]);

    try {
      const fd = new FormData();
      fd.append("menu", useMenu);
      fd.append("text", bodyText);
      if (file) fd.append("file", file);
      if (image) fd.append("image", image);

      const res = await fetch("/api/analyze-sections", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `분석 요청 실패: ${res.status}`);
      }

      const data = (await res.json()) as { sections: SectionAnalysis[] };
      setAnalysisSections(data.sections);

      const selectable = data.sections.filter((s) => s.visualizable).map((s) => s.id);
      const defaultSelected = selectable.length ? selectable : data.sections.map((s) => s.id);
      setSelectedSectionIds(defaultSelected);
      setExpandedSectionIds(defaultSelected);
    } catch (e) {
      setError(normalizeErrorMessage(e));
    } finally {
      setAnalyzing(false);
    }
  }

  async function generateSelectedSections(idsToGenerate?: string[]) {
    if (!analysisSections) return;

    const ids = idsToGenerate && idsToGenerate.length ? idsToGenerate : selectedSectionIds;
    if (!ids.length) {
      setError("선택된 섹션이 없습니다.");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const selected = analysisSections.filter((s) => ids.includes(s.id) && s.visualizable);
      if (!selected.length) {
        setError("선택된 섹션이 시각화 가능하지 않아요.");
        return;
      }

      const fd = new FormData();
      fd.append("menu", menu);
      fd.append(
        "sections",
        JSON.stringify(
          selected.map((s) => ({
            id: s.id,
            title: s.title,
            summary: s.summary,
            chunkText: s.chunkText,
            previousEvidencePlanHint: resultsBySection[s.id]
              ? JSON.stringify(
                  (resultsBySection[s.id].panels || []).map((p: ComicPanelWithImage) => ({
                    learningPoint: p.learningPoint,
                    scene: p.scene,
                    requiredObjects: p.requiredObjects,
                    requiredEvidenceElements: p.requiredEvidenceElements,
                    environment: p.environment,
                    visibleCauseEffect: p.visibleCauseEffect,
                    visibleDataElements: p.visibleDataElements,
                  })),
                )
              : "",
          })),
        ),
      );

      const res = await fetch("/api/generate", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `생성 요청 실패: ${res.status}`);
      }

      const data = (await res.json()) as { sections: SectionResult[] };
      setResultsBySection((prev) => {
        const next = { ...prev };
        for (const sec of data.sections) next[sec.id] = sec;
        return next;
      });
    } catch (e) {
      setError(normalizeErrorMessage(e));
    } finally {
      setGenerating(false);
    }
  }

  const canAnalyze =
    !analyzing && !generating && (text.trim().length > 0 || file !== null || image !== null);
  const canGenerate =
    !analyzing &&
    !generating &&
    analysisSections?.some((s) => s.visualizable && selectedSectionIds.includes(s.id));

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <header className="mb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Exploon</h1>
              <p className="mt-1 text-sm text-zinc-600">복잡한 텍스트를 간단한 시각 이야기로 바꿔요</p>
            </div>
          </div>
        </header>

        <nav className="mb-5">
          <MenuTabs menu={menu} onChange={setMenu} />
        </nav>

        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-zinc-800">입력</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="여기에 텍스트를 붙여 넣으세요..."
                className="min-h-[160px] w-full resize-y rounded-xl border border-zinc-200 bg-white p-3 text-sm outline-none focus:border-zinc-400"
              />
              <div className="mt-2 text-xs text-zinc-500">
                팁: PDF/TXT를 업로드하거나, 스크린샷 이미지를 올릴 수도 있어요.
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-800">파일 업로드 (PDF/TXT)</label>
                <input
                  type="file"
                  accept=".pdf,.txt,application/pdf,text/plain"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setFile(f);
                    if (f) setImage(null);
                  }}
                  className="w-full text-sm"
                />
                {file ? (
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="truncate text-xs text-zinc-600">{file.name}</div>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                    >
                      제거
                    </button>
                  </div>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-zinc-800">이미지 업로드 (스크린샷)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0] ?? null;
                    setImage(f);
                    if (f) setFile(null);
                  }}
                  className="w-full text-sm"
                />
                {image ? (
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="truncate text-xs text-zinc-600">{image.name}</div>
                    <button
                      type="button"
                      onClick={() => setImage(null)}
                      className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                    >
                      제거
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMenu("education");
                    setText(sampleEducation);
                    setFile(null);
                    setImage(null);
                    void analyzeSectionsAndSelectAll(sampleEducation, "education");
                  }}
                  disabled={analyzing || generating}
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
                >
                  교육 샘플
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenu("government");
                    setText(samplePolicy);
                    setFile(null);
                    setImage(null);
                    void analyzeSectionsAndSelectAll(samplePolicy, "government");
                  }}
                  disabled={analyzing || generating}
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
                >
                  정책 샘플
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenu("business");
                    setText(sampleBusiness);
                    setFile(null);
                    setImage(null);
                    void analyzeSectionsAndSelectAll(sampleBusiness, "business");
                  }}
                  disabled={analyzing || generating}
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
                >
                  사업 샘플
                </button>

                <button
                  type="button"
                  onClick={() => void analyzeSectionsAndSelectAll()}
                  disabled={!canAnalyze}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-60"
                >
                  섹션 분석하기
                </button>
              </div>

              <div className="text-xs text-zinc-500">
                메뉴는 프롬프트 스타일만 바꿔요. 로직은 섹션 기반으로 동작합니다.
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          {analyzing ? (
            <LoadingSpinner message="섹션을 나누는 중... 입력을 이해 가능한 단위로 분해해요" />
          ) : error ? (
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
              <div className="text-sm font-semibold text-zinc-900">죄송해요. 문제가 생겼습니다.</div>
              <div className="mt-2 text-sm text-zinc-700 whitespace-pre-wrap">{error}</div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => void analyzeSectionsAndSelectAll()}
                  disabled={!canAnalyze}
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
                >
                  다시 분석
                </button>
                <button
                  type="button"
                  onClick={() => void generateSelectedSections()}
                  disabled={!canGenerate}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-60"
                >
                  다시 생성
                </button>
              </div>
            </div>
          ) : analysisSections ? (
            <div className="space-y-6">
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-zinc-900">1) 섹션 선택</div>
                    <div className="mt-1 text-sm text-zinc-600">
                      선택한 섹션마다 `4칸 만화 세트`가 생성돼요.
                    </div>
                    <div className="mt-2 text-xs text-zinc-500">
                      예상 생성 시간: 약 {Math.max(1, selectedSectionIds.length * 8)}초(섹션당 이미지 4장)
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const ids = analysisSections.filter((s) => s.visualizable).map((s) => s.id);
                        setSelectedSectionIds(ids);
                        setExpandedSectionIds(ids);
                      }}
                      disabled={generating}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-60"
                    >
                      전체 선택
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedSectionIds([])}
                      disabled={generating}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-60"
                    >
                      선택 해제
                    </button>
                    <button
                      type="button"
                      onClick={() => void generateSelectedSections()}
                      disabled={!canGenerate}
                      className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
                    >
                      {generating ? "생성 중..." : `선택한 섹션 생성 (${selectedSectionIds.length}세트)`}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {analysisSections.map((sec) => {
                    const checked = selectedSectionIds.includes(sec.id);
                    const disabled = !sec.visualizable;
                    return (
                      <label
                        key={sec.id}
                        className={[
                          "flex cursor-pointer gap-3 rounded-xl border p-3 transition",
                          checked ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white hover:bg-zinc-50",
                          disabled ? "opacity-60 cursor-not-allowed" : "",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={disabled || generating}
                          onChange={(e) => {
                            const isOn = e.target.checked;
                            setSelectedSectionIds((prev) => {
                              const set = new Set(prev);
                              if (isOn) set.add(sec.id);
                              else set.delete(sec.id);
                              return Array.from(set);
                            });
                          }}
                          className="mt-1 h-4 w-4"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-zinc-900">{sec.title}</div>
                          <div className="mt-1 text-xs text-zinc-600 line-clamp-3">
                            {sec.summary}
                          </div>
                          <div className="mt-2 text-[11px] text-zinc-500">
                            중요도: {sec.importance} {sec.visualizable ? "" : "(시각화 약함)"}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {Object.keys(resultsBySection).length ? (
                <div className="space-y-5">
                  <div className="text-sm font-semibold text-zinc-900">2) 생성 결과</div>
                  {analysisSections.map((sec) => {
                    const r = resultsBySection[sec.id];
                    if (!r) return null;
                    const expanded = expandedSectionIds.includes(sec.id);
                    return (
                      <div key={sec.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-zinc-900">{sec.title}</div>
                            <div className="mt-1 text-sm text-zinc-600">{sec.summary}</div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedSectionIds((prev) => {
                                  const set = new Set(prev);
                                  if (set.has(sec.id)) set.delete(sec.id);
                                  else set.add(sec.id);
                                  return Array.from(set);
                                });
                              }}
                              disabled={generating}
                              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm hover:bg-zinc-50 disabled:opacity-60"
                            >
                              {expanded ? "접기" : "펼치기"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void generateSelectedSections([sec.id])}
                              disabled={generating}
                              className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60"
                            >
                              이 섹션만 재생성
                            </button>
                          </div>
                        </div>
                        {expanded ? (
                          <div className="mt-4">
                            <ComicPanels panels={r.panels} />
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600 shadow-sm">
                  섹션을 선택한 뒤 `생성`을 눌러주세요.
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-6 text-sm text-zinc-600 shadow-sm">
              텍스트를 붙여 넣고 먼저 `섹션 분석`을 눌러주세요. 그 다음에 섹션을 선택해서 4칸 만화를 만들어요.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

