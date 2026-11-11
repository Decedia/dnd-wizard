"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import type { SpellDamageBonus } from "@/lib/spell-damage-bonus";

/** "+3 to one damage roll · Empowered Evocation", one line per bonus. */
export function SpellDamageBonusLines({ bonuses }: { bonuses?: SpellDamageBonus[] }) {
  const { t } = useLanguage();
  if (!bonuses?.length) return null;
  return (
    <span className="mt-1 flex flex-col gap-0.5">
      {bonuses.map((b) => (
        <span key={b.source} className="text-xs font-semibold text-[var(--color-text-primary)]">
          {t(`spell.bonus.${b.per}`, { n: b.dice ? `+${b.dice}` : b.value > 0 ? `+${b.value}` : String(b.value), source: b.source })}
        </span>
      ))}
    </span>
  );
}
