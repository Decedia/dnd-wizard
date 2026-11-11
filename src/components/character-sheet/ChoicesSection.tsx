"use client";

import { useRouter } from "next/navigation";
import { GiScrollUnfurled } from "react-icons/gi";
import { SectionCard } from "./SectionCard";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Character } from "@/lib/storage";
import { choicesOf, hasPicks, isUnknownAsi, type LevelPicks } from "@/lib/level-choices";

const spellName = (entry: string) => entry.replace(/:\d+$/, "");

/** One line per kind of pick at a level, in plain words. */
export function pickLines(picks: LevelPicks, t: (key: string, params?: Record<string, string | number> | string, fallback?: string) => string): string[] {
  const lines: string[] = [];
  const asi = picks.asi;
  if (asi) {
    if (isUnknownAsi(asi)) lines.push(t("choices.asiUnknown", "Ability increase (not recorded)"));
    else if (asi.mode === "feat" && asi.feat) lines.push(t("choices.feat", { name: asi.feat }, "Feat: {name}"));
    else if (asi.mode === "single" && asi.single) lines.push(`+2 ${asi.single.toUpperCase()}`);
    else if (asi.mode === "double" && asi.d1 && asi.d2) lines.push(`+1 ${asi.d1.toUpperCase()}, +1 ${asi.d2.toUpperCase()}`);
  }
  for (const [name, value] of [...Object.entries(picks.classFeatures || {}), ...Object.entries(picks.subclassFeatures || {})]) {
    if (value) lines.push(`${name}: ${value}`);
  }
  if (picks.expertise?.length) lines.push(t("choices.expertise", { list: picks.expertise.join(", ") }, "Expertise: {list}"));
  const spells = [...(picks.spells || []), ...(picks.magicalSecrets || []), ...(picks.subclassSpells || [])].map(spellName);
  if (spells.length) lines.push(t("choices.spells", { list: spells.join(", ") }, "Spells: {list}"));
  if (picks.replacedSpell) lines.push(t("choices.swapped", { name: picks.replacedSpell.name }, "Swapped out: {name}"));
  if (picks.invocations?.length) lines.push(t("choices.invocations", { list: picks.invocations.join(", ") }, "Invocations: {list}"));
  if (picks.replacedInvocation) lines.push(t("choices.swapped", { name: picks.replacedInvocation }, "Swapped out: {name}"));
  return lines;
}

/** Edit mode: every level's picks, each one changeable without touching the rest. */
export function ChoicesSection({ character }: { character: Character }) {
  const router = useRouter();
  const { t } = useLanguage();
  const all = choicesOf(character);
  const levels = Object.keys(all).map(Number).filter((lvl) => hasPicks(all[lvl])).sort((a, b) => a - b);

  return (
    <SectionCard id="choices" title={t("choices.title", "Choices")} icon={<GiScrollUnfurled className="h-5 w-5" />}>
      <p className="mb-3 text-xs text-[var(--color-text-muted)]">
        {t("choices.hint", "What you picked at each level. Change one and the rest of the sheet follows. HP and other levels stay as they are.")}
      </p>
      {levels.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)]">{t("choices.none", "No picks to change yet.")}</p>
      ) : (
        <div className="divide-y divide-[var(--color-border)] rounded-[var(--radius-md)] border border-[var(--color-border)]">
          {levels.map((lvl) => (
            <div key={lvl} className="flex items-start gap-3 px-3 py-2.5">
              <div className="w-14 shrink-0 pt-0.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                {t("choices.level", { level: lvl }, "Level {level}")}
              </div>
              <ul className="min-w-0 flex-1 space-y-0.5 text-sm text-[var(--color-text-primary)]">
                {pickLines(all[lvl], t).map((line, i) => (
                  <li key={i} className="break-words">{line}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => router.push(`/character/choices?id=${character.id}&level=${lvl}`)}
                className="btn btn-secondary shrink-0 px-3 py-1 text-xs"
              >
                {t("choices.change", "Change")}
              </button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
