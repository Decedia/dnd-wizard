"use client";

import { getStaticSpells } from "@/lib/srd-client";
import { useLanguage } from "@/contexts/LanguageContext";
import { OptionPicker, spellOption } from "./OptionPicker";

interface SecretSpellsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  hint: string;
  count: number;
  /** Highest spell level the character can cast; cantrips are always allowed. */
  maxLevel: number;
  /** Only spells on these class lists; empty means any class. */
  classes: string[];
  /** Saved as "Name:level". */
  selections: string[];
  onConfirm: (values: string[]) => void;
  /** Lower-case names the character already has. */
  takenSpells: Set<string>;
  characterSources?: string[];
  ruleset?: string;
}

/**
 * Spells taken from other class lists: Magical Secrets (any class) and the
 * Lore Bard's Additional Magical Secrets / Magical Discoveries.
 */
export function SecretSpellsModal({ isOpen, onClose, title, hint, count, maxLevel, classes, selections, onConfirm, takenSpells, characterSources = [], ruleset }: SecretSpellsModalProps) {
  const { t, language } = useLanguage();
  if (!isOpen) return null;
  const mine = new Set(selections.map((s) => s.split(":")[0].toLowerCase()));
  const spells = getStaticSpells(characterSources, ruleset, language)
    .filter((s) => s.level <= maxLevel && (classes.length === 0 || (s.classes || []).some((c) => classes.includes(c))))
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));
  const options = spells.map((s) => ({
    ...spellOption(s, t, `${s.name}:${s.level}`),
    disabled: takenSpells.has(s.name.toLowerCase()) && !mine.has(s.name.toLowerCase()),
  }));
  return <OptionPicker isOpen={isOpen} onClose={onClose} title={title} hint={hint} options={options} count={count} selected={selections} onPick={onConfirm} />;
}
