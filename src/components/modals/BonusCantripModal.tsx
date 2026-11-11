"use client";

import { getStaticSpells } from "@/lib/srd-client";
import { useLanguage } from "@/contexts/LanguageContext";
import { isSpellTakenElsewhere } from "@/lib/taken-spells";
import { OptionPicker, spellOption } from "./OptionPicker";

interface BonusCantripModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCantrip: string;
  onCantripChange: (cantrip: string) => void;
  /** Spells the character already has; those can't be picked again. */
  takenSpells?: Set<string>;
}

/** Circle of the Land: one extra druid cantrip. */
export function BonusCantripModal({ isOpen, onClose, selectedCantrip, onCantripChange, takenSpells }: BonusCantripModalProps) {
  const { t, language } = useLanguage();
  if (!isOpen) return null;
  const cantrips = getStaticSpells(undefined, undefined, language).filter((s) => s.level === 0 && s.classes?.includes("Druid"));
  return (
    <OptionPicker
      isOpen={isOpen}
      onClose={onClose}
      title={t("bonusCantrip.choose", "Choose Bonus Cantrip")}
      hint={t("bonusCantrip.hint", "One extra druid cantrip. It doesn't count against your cantrips known.")}
      options={cantrips.map((sp) => {
        const known = !!takenSpells && isSpellTakenElsewhere(takenSpells, sp.name, [selectedCantrip]);
        return { ...spellOption(sp, t), disabled: known, reason: known ? t("picker.known", "You already know this spell.") : undefined };
      })}
      selected={selectedCantrip ? [selectedCantrip] : []}
      onPick={([name]) => onCantripChange(name)}
    />
  );
}
