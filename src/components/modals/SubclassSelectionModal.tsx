"use client";

import { isRecommended } from "@/lib/recommendations";
import { optionLine } from "@/lib/option-line";
import { subclassIcon } from "@/components/option-icons";
import { SubclassInfo } from "@/components/SubclassInfo";
import { useLanguage } from "@/contexts/LanguageContext";
import { OptionPicker } from "./OptionPicker";

interface SubclassSelectionModalProps {
  options: { name: string; description: string; hasDetails: boolean }[];
  selected: string;
  characterClass: string;
  onSelect: (name: string) => void;
  onClose: () => void;
  character?: unknown;
  characterSources?: string[];
}

/** Pick a subclass: a card per subclass with its own icon, one line, and its features under Info. */
export function SubclassSelectionModal({ options, selected, characterClass, onSelect, onClose }: SubclassSelectionModalProps) {
  const { t, language } = useLanguage();
  return (
    <OptionPicker
      isOpen
      onClose={onClose}
      title={t("creator.chooseSubclass", "Choose a subclass")}
      options={options.map((opt) => ({
        name: opt.name,
        line: optionLine("Subclass", opt, language),
        infoNode: <SubclassInfo characterClass={characterClass} subclass={opt.name} description={opt.description} />,
        Icon: subclassIcon(opt.name),
        recommended: isRecommended("subclass", opt.name, characterClass),
      }))}
      selected={selected ? [selected] : []}
      onPick={([name]) => onSelect(name)}
    />
  );
}
