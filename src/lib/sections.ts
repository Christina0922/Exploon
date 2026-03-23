import type { ComicPanelWithImage } from "@/components/ComicPanels";

export type SectionImportance = "high" | "medium" | "low";

export type SectionAnalysis = {
  id: string;
  title: string;
  summary: string;
  importance: SectionImportance;
  visualizable: boolean;
  chunkText: string;
  expectedSets: number;
};

export type SectionResult = {
  id: string;
  title: string;
  summary: string;
  panels: ComicPanelWithImage[];
};

