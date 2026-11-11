"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { RichInline } from "@/components/RichText";
import type { SpellDamageBonus } from "@/lib/spell-damage-bonus";
import type { DamagePart } from "@/lib/spell-dice";

/** "Damage: 8d6+4 fire · 2d4 acid on later turns", the spell's dice with bonuses added. */
export function SpellDamageLine({ parts }: { parts?: DamagePart[] | null }) {
  const { t } = useLanguage();
  if (!parts?.length) return null;
  const typeText = (type: string) => {
    if (type === "choice") return t("spell.dmg.choice");
    if (type === "random") return t("spell.dmg.random");
    const types = type.split("|").filter(Boolean);
    return types.length > 1 ? t("spell.dmg.or", { a: types.slice(0, -1).join(", "), b: types[types.length - 1] }) : types[0] || "";
  };
  const partText = (part: DamagePart) => {
    const dice = part.count > 1 ? `${part.count} × ${part.dice}` : part.dice;
    const text = [dice, typeText(part.type)].filter(Boolean).join(" ");
    return part.when ? t(`spell.dmg.when.${part.when}`, { dmg: text }) : text;
  };
  const now = parts.filter((p) => !p.when).map(partText).join(" + ");
  const rest = parts.filter((p) => p.when).map(partText);
  return (
    <span className="mt-1 block text-xs font-semibold text-[var(--color-text-primary)]">
      <RichInline text={t("spell.dmg.line", { text: [now, ...rest].filter(Boolean).join(" · ") })} />
    </span>
  );
}

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
