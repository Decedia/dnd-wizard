"use client";

import type { ReactNode } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDice } from "@/contexts/DiceContext";
import { d20Group } from "@/lib/dice-roll";

/** The dot on a number set by hand. */
export function OverrideDot({ id }: { id: string }) {
  const { overridden } = useCharacterSheet();
  const { t } = useLanguage();
  if (!overridden?.[id]) return null;
  return <span role="img" aria-label={t("override.dot", "Set by hand")} title={t("override.dot", "Set by hand")} className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-ink)] align-middle" />;
}

/**
 * Wraps a number on the sheet. In edit mode a tap opens the "set by hand"
 * sheet; a number set by hand carries a dot in both modes. With `roll` (a d20
 * bonus), a tap outside edit mode throws d20 + that bonus in the dice tray.
 */
export function Overridable({ id, label, signed, editMode, roll, children, className = "" }: { id: string; label: string; signed?: boolean; editMode?: boolean; roll?: number; children: ReactNode; className?: string }) {
  const { editOverride } = useCharacterSheet();
  const { t } = useLanguage();
  const dice = useDice();
  if (!editMode && dice && roll !== undefined) {
    return (
      <button
        type="button"
        onClick={() => dice.roll(label, [d20Group(label, roll)])}
        aria-label={t("dice.rollName", { name: label }, "Roll {name}")}
        className={`relative inline-flex items-center gap-1 rounded-md px-1 -mx-1 hover:bg-[var(--color-bg)] active:scale-95 transition-transform ${className}`}
      >
        {children}
        <OverrideDot id={id} />
      </button>
    );
  }
  if (!editMode || !editOverride) {
    return (
      <span className={`relative inline-flex items-center gap-1 ${className}`}>
        {children}
        <OverrideDot id={id} />
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => editOverride({ key: id, label, signed })}
      aria-label={t("override.editLabel", { name: label }, "Set {name} by hand")}
      className={`relative inline-flex items-center gap-1 rounded-md underline decoration-dotted decoration-1 underline-offset-4 ${className}`}
    >
      {children}
      <OverrideDot id={id} />
    </button>
  );
}
