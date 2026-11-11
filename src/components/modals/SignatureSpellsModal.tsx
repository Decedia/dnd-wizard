"use client";

import { getStaticSpells, getWizardSpellsByLevel } from "@/lib/srd-client";
import { useLanguage } from "@/contexts/LanguageContext";
import { OptionPicker, spellOption } from "./OptionPicker";

interface SignatureSpellsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selections: string[];
  onSelectionsChange: (selections: string[]) => void;
  onConfirm: (value: string) => void;
  characterSources?: string[];
}

/** Wizard capstone: two spells of 3rd level picked from the wizard list. */
export function SignatureSpellsModal({ isOpen, onClose, selections, onConfirm, characterSources = [] }: SignatureSpellsModalProps) {
  const { t, language } = useLanguage();
  if (!isOpen) return null;
  const levelOf = new Map<string, number>();
  for (const level of [3]) for (const name of getWizardSpellsByLevel(level, characterSources)) levelOf.set(name, level);
  const data = new Map(getStaticSpells(characterSources, undefined, language).map((s) => [s.name, s]));
  return (
    <OptionPicker
      isOpen={isOpen}
      onClose={onClose}
      title={t("spell.signatureSpells", "Signature Spells")}
      hint={t("spell.signatureSpellsHint", "Choose two 3rd-level spells. They are always prepared, and you can cast each once per short rest without a spell slot.")}
      options={[...levelOf].map(([name, level]) => spellOption(data.get(name) || { name, level }, t))}
      count={2}
      selected={selections}
      onPick={(values) => onConfirm(values.join(", "))}
    />
  );
}
