"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { averageHealing, healSelfPatch, rollHealing, type Healing } from "@/lib/healing";
import type { Character } from "@/lib/storage";

/** After a healing spell or feature: how much it heals, and who gets it. */
export function HealSheet({ name, heal, character, onChange, onClose }: { name: string; heal: Healing; character: Character; onChange: (patch: Partial<Character>) => void; onClose: () => void }) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState(() => averageHealing(heal));
  const [rolls, setRolls] = useState<number[] | null>(null);
  const formula = [heal.dice ? (heal.maxDice ? t("heal.maxDice", { dice: heal.dice }, "{dice} at max") : heal.dice) : "", heal.bonus ? (heal.dice ? `+ ${heal.bonus}` : String(heal.bonus)) : ""].filter(Boolean).join(" ");
  const max = character.effectiveMaxHp || character.maxHp || 0;

  const healMe = () => { onChange(healSelfPatch(character, amount)); onClose(); };
  const healOther = () => { if (heal.selfWhenOther) onChange(healSelfPatch(character, heal.selfWhenOther)); onClose(); };

  return (
    <BottomSheet isOpen onClose={onClose} title={name} className="!mb-4">
      <div className="space-y-3 px-4 py-4">
        <p className="text-xs text-[var(--color-text-secondary)]">{t("heal.hint", { formula }, "Heals {formula}. Use the usual amount or roll.")}</p>
        {heal.notes.map((n) => (
          <p key={n.source} className="text-xs font-semibold text-[var(--color-text-primary)]">{t("heal.note", { n: n.value, source: n.source }, "+{n} from {source}")}</p>
        ))}
        <div className="flex items-center gap-3">
          <button type="button" aria-label="-1" onClick={() => setAmount((a) => Math.max(0, a - 1))} className="btn btn-secondary h-9 w-11 !px-0">−</button>
          <span className="min-w-[3ch] text-center text-2xl font-bold text-[var(--color-text-primary)]">{amount}</span>
          <button type="button" aria-label="+1" onClick={() => setAmount((a) => a + 1)} className="btn btn-secondary h-9 w-11 !px-0">+</button>
          {heal.dice && !heal.maxDice && (
            <button type="button" onClick={() => { const r = rollHealing(heal); setRolls(r.rolls); setAmount(r.total); }} className="btn btn-secondary h-9">{t("heal.roll", "Roll")}</button>
          )}
        </div>
        {rolls && <p className="text-[11px] text-[var(--color-text-muted)]">{t("heal.rolled", { rolls: rolls.join(", ") }, "Rolled {rolls}")}</p>}
        <button type="button" onClick={healMe} className="btn btn-primary w-full">
          {t("heal.me", { amount, hp: character.currentHp || 0, max }, "Heal me {amount} (HP {hp} / {max})")}
        </button>
        {!heal.selfOnly && (
          <button type="button" onClick={healOther} className="btn btn-secondary w-full">
            {heal.selfWhenOther ? t("heal.otherBlessed", { n: heal.selfWhenOther }, "Someone else (you also get {n} back, Blessed Healer)") : t("heal.other", "Someone else (they add it to their own sheet)")}
          </button>
        )}
      </div>
    </BottomSheet>
  );
}
