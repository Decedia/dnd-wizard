"use client";

import { getStaticSpells, getWizardSpellsByLevel } from "@/lib/srd-client";
import { useLanguage } from "@/contexts/LanguageContext";
import { OptionPicker, spellOption } from "./OptionPicker";

interface SpellMasteryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selections: string[];
  onSelectionsChange: (selections: string[]) => void;
  onConfirm: (value: string) => void;
  characterSources?: string[];
}

/** Wizard capstone: two spells (one 1st-level, one 2nd-level) picked from the wizard list. */
export function SpellMasteryModal({ isOpen, onClose, selections, onConfirm, characterSources = [] }: SpellMasteryModalProps) {
  const { t, language } = useLanguage();
  if (!isOpen) return null;
  const levelOf = new Map<string, number>();
  for (const level of [1, 2]) for (const name of getWizardSpellsByLevel(level, characterSources)) levelOf.set(name, level);
  const data = new Map(getStaticSpells(characterSources, undefined, language).map((s) => [s.name, s]));
  return (
    <OptionPicker
      isOpen={isOpen}
      onClose={onClose}
      title={t("spell.spellMastery", "Spell Mastery")}
      hint={t("spell.spellMasteryHint", "Choose one 1st-level and one 2nd-level spell to cast at will without spell slots.")}
      options={[...levelOf].map(([name, level]) => spellOption(data.get(name) || { name, level }, t))}
      count={2}
      selected={selections}
      groupOf={(name) => String(levelOf.get(name) ?? 0)}
      onPick={(values) => onConfirm(values.join(", "))}
    />
  );
}
