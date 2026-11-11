"use client";

import { useMemo } from "react";
import { getStaticSpells } from "@/lib/srd-client";
import { isSpellTakenElsewhere } from "@/lib/taken-spells";
import { optionLine } from "@/lib/option-line";
import { optionIcon } from "@/components/option-icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { OptionPicker, spellOption, type PickerOption } from "./OptionPicker";

interface FeatureSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  name: string;
  description?: string;
  options: { name: string; description: string; icon?: string; disabled?: boolean; unavailableReason?: string }[];
  count?: number;
  isSubclass: boolean;
  onSelect: (value: string) => void;
  onSpecialOption?: (optName: string) => void;
  characterSources?: string[];
  selectedValues?: string[];
  /** Spells the character already has (getTakenSpellNames). An option naming one is shown as known and can't be picked. */
  takenSpells?: Set<string>;
}

/** Picker for a class or subclass feature's options (fighting style, invocations, totem, terrain...). */
export function FeatureSelectionModal({
  isOpen,
  onClose,
  name,
  description,
  options,
  count = 1,
  onSelect,
  onSpecialOption,
  characterSources,
  selectedValues = [],
  takenSpells,
}: FeatureSelectionModalProps) {
  const { t, language } = useLanguage();
  const spells = useMemo(() => new Map(getStaticSpells(characterSources, undefined, language).map((s) => [s.name.toLowerCase(), s])), [characterSources, language]);

  // Mounted only while open, so each opening starts from the saved picks.
  if (!isOpen) return null;

  const title =
    name === "__replace_invocation__" ? t("spell.replaceInvocationTitle", "Replace an invocation")
    : name === "__replace_spell__" ? t("spell.replaceKnownSpell", "Replace Known Spell")
    : name;

  const pickerOptions: PickerOption[] = options.map((opt) => {
    const known = !!takenSpells && isSpellTakenElsewhere(takenSpells, opt.name, selectedValues);
    const disabled = !!opt.disabled || known;
    const reason = opt.unavailableReason || (known ? t("picker.known", "You already know this spell.") : undefined);
    // Replacing a known spell: the value is the spell's id, the text is "Name (Level n)".
    const spell = name === "__replace_spell__" ? spells.get(opt.description.replace(/ \(Level \d+\)$/, "").toLowerCase()) : spells.get(opt.name.toLowerCase());
    if (spell) return { ...spellOption(spell, t, opt.name), disabled, reason };
    return {
      name: opt.name,
      // "Hunter's Prey: Colossus Slayer" shows as "Colossus Slayer" under the Hunter's Prey title.
      label: opt.name.startsWith(`${name}: `) ? opt.name.slice(name.length + 2) : undefined,
      line: name === "__replace_invocation__" ? opt.description : optionLine(name, opt, language),
      info: opt.description,
      Icon: optionIcon(name, opt.name),
      disabled,
      reason,
    };
  });

  return (
    <OptionPicker
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      // A short hint only; the feature's full rules text stays behind its own Info button on the step.
      hint={description && description.length <= 160 ? description : undefined}
      options={pickerOptions}
      count={count}
      selected={selectedValues}
      onPick={(values) => {
        if (values[0] === "Humanoid (2 races)") return onSpecialOption?.(values[0]);
        onSelect(values.join(", "));
      }}
    />
  );
}
