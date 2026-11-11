"use client";

import { MagicWandIcon as MagicWand, BookIcon as Book } from "@/components/icons";
import { useLevelCard } from "./level-card-state";

/** How many cantrips and spells the level adds (on the spells screen, or the level screen when there is none). */
export function StepSpellCounts() {
  const { info, spells, allSpellSelections, show, classSpells, spellsPart, t, setShowSpellModal, setSpellModalMode, lvl } = useLevelCard();
  return (
    <>
      {show(spellsPart) && classSpells && info.cantripsKnown !== undefined && (() => {
        const lvlSpells = (allSpellSelections || {})[lvl] || [];
        const selectedCantrips = lvlSpells.filter((s: string) => s.endsWith(":0")).length;
        const higherCantrips = Object.entries(allSpellSelections || {})
          .filter(([l]) => Number(l) > lvl)
          .flatMap(([, s]: [string, string[]]) => s)
          .filter((s: string) => s.endsWith(":0"))
          .map((s: string) => s.split(":")[0]);
        const needCantrips = info.cantripSelectionCount > 0 && selectedCantrips < info.cantripSelectionCount;
        const cantripColor = info.cantripSelectionCount > 0 && selectedCantrips < info.cantripSelectionCount ? "text-red-500" : "text-[var(--color-text-primary)]";
        return (
          <div className={`flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)] ${needCantrips ? "border border-red-400 bg-red-50/30" : ""}`}>
            <MagicWand className={`h-4 w-4 ${needCantrips ? "text-red-400" : "text-[var(--color-text-muted)]"}`} />
            <div className="flex-1">
              <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("spell.cantripsKnown", "Cantrips Known")}</div>
              <div className={`text-xs ${cantripColor}`}>
                {info.cantripsKnown}
                {info.cantripSelectionCount > 0 && (
                  <span className="ml-1">({selectedCantrips}/{info.cantripSelectionCount} selected)</span>
                )}
              </div>
              {higherCantrips.length > 0 && (
               <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                 {t("sheet.fromHigherLevel", "From higher")}: {higherCantrips.join(", ")}
               </div>
              )}
            </div>
            {info.cantripSelectionCount > 0 && (
              <button
                type="button"
                onClick={() => { setSpellModalMode("cantrips"); setShowSpellModal(true); }}
                className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded border transition-colors ${needCantrips ? "border-red-300 text-red-600 hover:bg-red-50" : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-active)]"}`}
               >
                 {t("common.select", "Select")}
               </button>
            )}
          </div>
        );
      })()}

      {show(spellsPart) && classSpells && info.spellsKnown !== undefined && (() => {
        const lvlSpells = (allSpellSelections || {})[lvl] || [];
        const selectedSpells = lvlSpells.filter((s: string) => !s.endsWith(":0")).length;
        const higherSpells = Object.entries(allSpellSelections || {})
          .filter(([l]) => Number(l) > lvl)
          .flatMap(([, s]: [string, string[]]) => s)
          .filter((s: string) => !s.endsWith(":0"))
          .map((s: string) => s.split(":")[0]);
        const needSpells = info.spellSelectionCount > 0 && selectedSpells < info.spellSelectionCount;
        const spellColor = info.spellSelectionCount > 0 && selectedSpells < info.spellSelectionCount ? "text-red-500" : "text-[var(--color-text-primary)]";
        return (
          <div className={`flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)] ${needSpells ? "border border-red-400 bg-red-50/30" : ""}`}>
            <Book className={`h-4 w-4 ${needSpells ? "text-red-400" : "text-[var(--color-text-muted)]"}`} />
            <div className="flex-1">
              <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("spell.spellsKnown", "Spells Known")}</div>
              <div className={`text-xs ${spellColor}`}>
                {info.spellsKnown}
                {info.spellSelectionCount > 0 && (
                  <span className="ml-1">({selectedSpells}/{info.spellSelectionCount} selected)</span>
                )}
                {info.spellsKnownChanged && info.prevSpellsKnown !== undefined && !info.spellSelectionCount && (
                  <span className="ml-1 text-green-600">(+{info.spellsKnown - info.prevSpellsKnown})</span>
                )}
              </div>
              {higherSpells.length > 0 && (
                <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                  From higher: {higherSpells.join(", ")}
                </div>
              )}
            </div>
            {info.spellSelectionCount > 0 && (
              <button
                type="button"
                onClick={() => { setSpellModalMode("spells"); setShowSpellModal(true); }}
                className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded border transition-colors ${needSpells ? "border-red-300 text-red-600 hover:bg-red-50" : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-active)]"}`}
               >
                 {t("common.select", "Select")}
               </button>
            )}
          </div>
        );
      })()}

      {show(spellsPart) && classSpells && info.spellbookTotal !== undefined && (() => {
        const lvlSpells = (allSpellSelections || {})[lvl] || [];
        const selectedSpells = lvlSpells.filter((s: string) => !s.endsWith(":0")).length;
        const higherSpells = Object.entries(allSpellSelections || {})
          .filter(([l]) => Number(l) > lvl)
          .flatMap(([, s]: [string, string[]]) => s)
          .filter((s: string) => !s.endsWith(":0"))
          .map((s: string) => s.split(":")[0]);
        const needSpells = info.spellSelectionCount > 0 && selectedSpells < info.spellSelectionCount;
        return (
          <div className={`flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)] ${needSpells ? "border border-red-400 bg-red-50/30" : ""}`}>
            <Book className={`h-4 w-4 ${needSpells ? "text-red-400" : "text-[var(--color-text-muted)]"}`} />
            <div className="flex-1">
              <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("spell.spellbook", "Spellbook")}</div>
              <div className={`text-xs ${needSpells ? "text-red-500" : "text-[var(--color-text-primary)]"}`}>
                {info.spellbookTotal} spells
                {info.spellSelectionCount > 0 && (
                  <span className="ml-1">({selectedSpells}/{info.spellSelectionCount} to add)</span>
                )}
              </div>
              {higherSpells.length > 0 && (
                <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                  From higher: {higherSpells.join(", ")}
                </div>
              )}
            </div>
            {info.spellSelectionCount > 0 && (
              <button
                type="button"
                onClick={() => { setSpellModalMode("spells"); setShowSpellModal(true); }}
                className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded border transition-colors ${needSpells ? "border-red-300 text-red-600 hover:bg-red-50" : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-active)]"}`}
               >
                 {t("common.select", "Select")}
               </button>
            )}
          </div>
        );
      })()}

      {show(spellsPart) && classSpells && info.maxPrepared !== undefined && (() => {
        const lvlSpells = (allSpellSelections || {})[lvl] || [];
        const selectedSpells = lvlSpells.filter((s: string) => !s.endsWith(":0")).length;
        const higherSpells = Object.entries(allSpellSelections || {})
          .filter(([l]) => Number(l) > lvl)
          .flatMap(([, s]: [string, string[]]) => s)
          .filter((s: string) => !s.endsWith(":0"))
          .map((s: string) => s.split(":")[0]);
        const needPrepare = info.spellSelectionCount > 0 && selectedSpells < info.spellSelectionCount;
        return (
          <div className={`flex items-center gap-3 p-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)] ${needPrepare ? "border border-red-400 bg-red-50/30" : ""}`}>
            <Book className={`h-4 w-4 ${needPrepare ? "text-red-400" : "text-[var(--color-text-muted)]"}`} />
            <div className="flex-1">
              <div className="text-[10px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">{t("spell.prepareSpells", "Prepare Spells")}</div>
              <div className={`text-xs ${needPrepare ? "text-red-500" : "text-[var(--color-text-primary)]"}`}>
                {info.maxPrepared} spells preparable
                {info.spellSelectionCount > 0 && (
                  <span className="ml-1">({selectedSpells}/{info.spellSelectionCount} selected)</span>
                )}
              </div>
              {higherSpells.length > 0 && (
                <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
                  From higher: {higherSpells.join(", ")}
                </div>
              )}
            </div>
            {info.spellSelectionCount > 0 && (
              <button
                type="button"
                onClick={() => { setSpellModalMode("spells"); setShowSpellModal(true); }}
                className={`shrink-0 px-2.5 py-1 text-[10px] font-bold rounded border transition-colors ${needPrepare ? "border-red-300 text-red-600 hover:bg-red-50" : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-active)]"}`}
               >
                 {t("common.select", "Select")}
               </button>
            )}
          </div>
        );
      })()}

    </>
  );
}
