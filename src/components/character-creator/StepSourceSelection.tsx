"use client";

import { useState, useEffect } from "react";
import { SOURCE_OPTIONS } from "@/components/SourceBadge";
import { BookCard } from "@/components/BookCard";
import { BookPatterns, BookEmojis, type BookId } from "@/components/book-svgs";
import { BookExplainer } from "@/components/BookExplainer";
import { useSRD } from "@/contexts/SRDContext";
import { useLanguage } from "@/contexts/LanguageContext";

const BOOK_SPECS: Record<
  BookId,
  {
    name: string;
    tags: string[];
    color: string;
    stripColor: string;
    patternSvg: React.ReactNode;
  }
> = {
  PHB: {
    name: "Player's Handbook",
    tags: ["Core rules", "Always on"],
    color: "#8B0000",
    stripColor: "#cc0000",
    patternSvg: BookPatterns.PHB,
  },
  XGE: {
    name: "Xanathar's Guide to Everything",
    tags: ["Subclasses", "Feats", "Spells"],
    color: "#1c2f9e",
    stripColor: "#3f51b5",
    patternSvg: BookPatterns.XGE,
  },
  TCE: {
    name: "Tasha's Cauldron of Everything",
    tags: ["Optional rules", "Subclasses"],
    color: "#4a148c",
    stripColor: "#9c27b0",
    patternSvg: BookPatterns.TCE,
  },
  MTF: {
    name: "Mordenkainen's Tome of Foes",
    tags: ["Races", "Lore"],
    color: "#7f1111",
    stripColor: "#d32f2f",
    patternSvg: BookPatterns.MTF,
  },
  VGTM: {
    name: "Volo's Guide to Monsters",
    tags: ["Races", "Monsters"],
    color: "#1b5e20",
    stripColor: "#4caf50",
    patternSvg: BookPatterns.VGTM,
  },
  MPMM: {
    name: "Mordenkainen Presents: Monsters of the Multiverse",
    tags: ["Races", "Monsters", "Lore"],
    color: "#4a148c",
    stripColor: "#9c27b0",
    patternSvg: BookPatterns.MPMM,
  },
  SCAG: {
    name: "Sword Coast Adventurer's Guide",
    tags: ["Subclasses", "Setting"],
    color: "#0d47a1",
    stripColor: "#2196f3",
    patternSvg: BookPatterns.SCAG,
  },
  EGW: {
    name: "Explorer's Guide to Wildemount",
    tags: ["Races", "Setting"],
    color: "#2d4a22",
    stripColor: "#66bb6a",
    patternSvg: BookPatterns.EGW,
  },
  FTD: {
    name: "Fizban's Treasury of Dragons",
    tags: ["Dragons", "Races"],
    color: "#8a3a00",
    stripColor: "#ff7043",
    patternSvg: BookPatterns.FTD,
  },
  VRGR: {
    name: "Van Richten's Guide to Ravenloft",
    tags: ["Races", "Horror"],
    color: "#311b92",
    stripColor: "#673ab7",
    patternSvg: BookPatterns.VRGR,
  },
};

const ALL_BOOK_IDS = SOURCE_OPTIONS.map((s) => s.id);

type ContentMode = "phb_only" | "all" | "custom";

export function StepSourceSelection({ data, onChange }: { data: { sources: string[]; ruleset?: "2014" | "2024" }; onChange: (patch: { sources: string[]; ruleset?: "2014" | "2024" }) => void }) {
  const { t } = useLanguage();
  const selectedSources = data.sources || ["PHB"];
  const ruleset = data.ruleset || "2014";
  const { setRuleset: setSrdRuleset } = useSRD();

  const [contentMode, setContentMode] = useState<ContentMode>("phb_only");
  const [showBookExplainer, setShowBookExplainer] = useState(false);

  useEffect(() => {
    setSrdRuleset(ruleset);
  }, [ruleset, setSrdRuleset]);

  useEffect(() => {
    if (contentMode === "phb_only") {
      onChange({ sources: ["PHB"], ruleset });
    } else if (contentMode === "all") {
      onChange({ sources: ALL_BOOK_IDS, ruleset });
    }
  }, [contentMode, ruleset, onChange]);

  const toggleSource = (sourceId: string) => {
    if (sourceId === "PHB") return;
    const current = selectedSources;
    if (current.includes(sourceId)) {
      onChange({ sources: current.filter((s) => s !== sourceId), ruleset });
    } else {
      onChange({ sources: [...current, sourceId], ruleset });
    }
  };

  const setRuleset = (next: "2014" | "2024") => {
    onChange({ sources: selectedSources, ruleset: next });
    setSrdRuleset(next);
  };

  const totalBooks = SOURCE_OPTIONS.length;
  const selectedCount = selectedSources.length;

  const handleContentModeChange = (mode: ContentMode) => {
    setContentMode(mode);
  };

  return (
    <div className="space-y-3">
      <div>
        <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">
          {t("wizard.stepOf", "Step {step} of {total}").replace("{step}", "1").replace("{total}", totalBooks > 0 ? "8" : "6")}
        </div>
         <h2 className="text-xl font-bold text-[var(--color-text-primary)]">{t("creator.chooseRulebooks")}</h2>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1 inline-flex items-center gap-1.5 flex-wrap">
          <span>{t("creator.selectRulebooks")}</span>
          <button
            type="button"
            onClick={() => setShowBookExplainer(true)}
            className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-2 hover:border-[var(--color-text-primary)] active:bg-[var(--color-bg)] transition-all shrink-0"
            aria-label="Info: Rulebooks"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
          </button>
        </p>
      </div>

      <div className="flex bg-slate-200 dark:bg-slate-900 p-1 rounded-xl mb-6">
        {(["2014", "2024"] as const).map((rs) => (
          <button
            key={rs}
            type="button"
            onClick={() => setRuleset(rs)}
            className={`flex-1 font-semibold py-2 text-sm rounded-lg transition-all ${
              ruleset === rs
                ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white"
                : "text-slate-500 dark:text-slate-400 font-medium hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
             {rs === "2014" ? t("ruleset.2014", "2014 Rules") : t("ruleset.2024", "2024 Rules")}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => handleContentModeChange("phb_only")}
          className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
            contentMode === "phb_only"
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              contentMode === "phb_only"
                ? "border-indigo-500 bg-indigo-500"
                : "border-slate-300 dark:border-slate-600"
            }`}>
              {contentMode === "phb_only" && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {t("creator.contentMode.phbOnly", "PHB Only (Recommended)")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {t("creator.contentMode.phbOnlyDesc", "Perfect for beginners. Contains the core races, classes, and rules that are easiest to learn.")}
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleContentModeChange("all")}
          className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
            contentMode === "all"
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              contentMode === "all"
                ? "border-indigo-500 bg-indigo-500"
                : "border-slate-300 dark:border-slate-600"
            }`}>
              {contentMode === "all" && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {t("creator.contentMode.all", "Use All Expansions")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {t("creator.contentMode.allDesc", "Unlocks every character option from expansions like Xanathar, Tasha, and Monsters of the Multiverse.")}
              </p>
            </div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => handleContentModeChange("custom")}
          className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
            contentMode === "custom"
              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              contentMode === "custom"
                ? "border-indigo-500 bg-indigo-500"
                : "border-slate-300 dark:border-slate-600"
            }`}>
              {contentMode === "custom" && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {t("creator.contentMode.custom", "Manual Selection")}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {t("creator.contentMode.customDesc", "Choose exactly which expansion books to enable.")}
              </p>
            </div>
          </div>
        </button>
      </div>

      {contentMode === "custom" && (
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">{t("creator.booksSelected", "Books selected")}</h3>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{selectedCount} / {totalBooks}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 items-stretch pb-24">
            {SOURCE_OPTIONS.map((source) => {
              const isSelected = selectedSources.includes(source.id);
              const isPHB = source.id === "PHB";
              const spec = BOOK_SPECS[source.id as BookId];
              const icon = BookEmojis[source.id as BookId] || "📜";

              if (!spec) return null;

              return (
                <BookCard
                  key={source.id}
                  id={source.id}
                  abbr={source.id}
                  name={spec.name}
                  tags={spec.tags}
                  selected={isSelected}
                  locked={isPHB}
                  onToggle={() => toggleSource(source.id)}
                  color={spec.color}
                  stripColor={spec.stripColor}
                  icon={icon}
                  patternSvg={spec.patternSvg}
                />
              );
            })}
          </div>
        </div>
      )}

      <BookExplainer isOpen={showBookExplainer} onClose={() => setShowBookExplainer(false)} />
    </div>
  );
}
