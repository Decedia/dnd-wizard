"use client";

import { SparklesIcon as Sparkle, MagicWandIcon as MagicWand, BookIcon as Book, CaretDownIcon as CaretDown } from "@/components/icons";
import { useLevelCard } from "./level-card-state";

/** Extra spell picks: Magical Secrets, subclass spells, swapping a spell, bonus cantrips. */
export function StepSpells() {
  const { info, spells, magicalSecretsSpells, subclassSpellSelections, replacedSpell, onReplacedSpellChange, bonusCantrip, character, show, t, setShowSpellModal, setShowBonusCantripModal, setShowFeaturePopup } = useLevelCard();
  return (
    <>
      {show("spells") && info.magicalSecretsCount > 0 && (
        <div className="p-3 rounded-lg border border-purple-300 bg-purple-50/30">
           <div className="flex items-center gap-2 mb-1">
             <Sparkle className="h-3.5 w-3.5 text-purple-600" />
             <span className="text-sm font-bold text-[var(--color-text-primary)]">{t("spell.magicalSecrets", "Magical Secrets")}</span>
           </div>
           <p className="text-[10px] text-[var(--color-text-muted)] mb-2">{t("spell.magicalSecretsHint", "Choose {count} spells from any class", { count: info.magicalSecretsCount })}</p>
          <button
            type="button"
            onClick={() => setShowSpellModal(true)}
            className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
          >
             <span>
               {magicalSecretsSpells.length > 0
                 ? t("common.selectedCount", "{selected} of {total} selected", { selected: magicalSecretsSpells.length, total: info.magicalSecretsCount })
                 : t("levelUp.selectSpellsFromAnyClass", "Select {count} spells from any class...", { count: info.magicalSecretsCount })}
             </span>
            <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
          </button>
          {magicalSecretsSpells.length > 0 && (
            <div className="mt-2 space-y-1">
              {magicalSecretsSpells.map((s) => {
                const [name, level] = s.split(":");
                return (
                  <div key={s} className="text-xs text-[var(--color-text-primary)] flex items-center gap-2">
                    <span className="font-semibold">{name}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">Level {level}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {show("spells") && info.subclassSpellSelectionCount > 0 && (
        <div className="p-3 rounded-lg border border-indigo-300 bg-indigo-50/30">
           <div className="flex items-center gap-2 mb-1">
             <Sparkle className="h-3.5 w-3.5 text-indigo-600" />
             <span className="text-sm font-bold text-[var(--color-text-primary)]">{t("spell.additionalMagicalSecrets", "Additional Magical Secrets")}</span>
           </div>
           <p className="text-[10px] text-[var(--color-text-muted)] mb-2">{t("spell.additionalMagicalSecretsHint", "Choose {count} spells from any class (Lore feature)", { count: info.subclassSpellSelectionCount })}</p>
          <button
            type="button"
            onClick={() => setShowSpellModal(true)}
            className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
          >
             <span>
               {subclassSpellSelections.length > 0
                 ? t("common.selectedCount", "{selected} of {total} selected", { selected: subclassSpellSelections.length, total: info.subclassSpellSelectionCount })
                 : t("levelUp.selectSpellsFromAnyClass", "Select {count} spells from any class...", { count: info.subclassSpellSelectionCount })}
             </span>
            <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
          </button>
          {subclassSpellSelections.length > 0 && (
            <div className="mt-2 space-y-1">
              {subclassSpellSelections.map((s) => {
                const [name, level] = s.split(":");
                return (
                  <div key={s} className="text-xs text-[var(--color-text-primary)] flex items-center gap-2">
                    <span className="font-semibold">{name}</span>
                    <span className="text-[10px] text-[var(--color-text-muted)]">Level {level}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {show("spells") && info.canReplaceSpell && (
        <div className="p-3 rounded-lg border border-orange-300 bg-orange-50/30">
           <div className="flex items-center gap-2 mb-1">
             <Book className="h-3.5 w-3.5 text-orange-600" />
             <span className="text-sm font-bold text-[var(--color-text-primary)]">{t("spell.replaceKnownSpell", "Replace Known Spell")}</span>
           </div>
           <p className="text-[10px] text-[var(--color-text-muted)] mb-2">{t("spell.replaceKnownSpellHint", "Optionally replace one known spell with another from the {class} spell list", { class: character.class })}</p>
          <button
            type="button"
            onClick={() =>
              setShowFeaturePopup({
                name: "__replace_spell__",
                description: `Optionally replace one known spell with another from the ${character.class} spell list`,
                options: (character.spells || [])
                  .filter((s) => s.level > 0)
                  .map((s) => ({ name: s.id, description: `${s.name} (Level ${s.level})` })),
                isSubclass: false,
                count: 1,
              })
            }
            className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
          >
             <span>{replacedSpell ? (character.spells || []).find((s) => s.id === replacedSpell)?.name || t("common.noReplacement", "No replacement") : t("common.noReplacement", "No replacement")}</span>
            <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
          </button>
          {replacedSpell && (
            <button
              type="button"
              onClick={() => onReplacedSpellChange("")}
              className="mt-1 text-[10px] text-[var(--color-error-600)] hover:underline"
            >
              {t("common.clearReplacement", "Clear replacement")}
            </button>
          )}
        </div>
      )}

      {show("spells") && info.bonusCantripSelection && (
        <div className="p-3 rounded-lg border border-teal-300 bg-teal-50/30">
           <div className="flex items-center gap-2 mb-1">
             <MagicWand className="h-3.5 w-3.5 text-teal-600" />
             <span className="text-sm font-bold text-[var(--color-text-primary)]">{t("spell.bonusCantrip", "Bonus Cantrip")}</span>
           </div>
           <p className="text-[10px] text-[var(--color-text-muted)] mb-2">{t("spell.bonusCantripHint", "Choose one additional druid cantrip (does not count against cantrip limit)")}</p>
          <button
            type="button"
            onClick={() => setShowBonusCantripModal(true)}
            className="w-full py-2 px-3 text-xs font-semibold rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] transition-all text-left flex items-center justify-between"
          >
             <span>{bonusCantrip || t("spell.selectCantrip", "Select cantrip...")}</span>
            <CaretDown className="h-3 w-3 text-[var(--color-text-muted)]" />
          </button>
        </div>
      )}

    </>
  );
}
