"use client";

import { useState, useMemo } from "react";
import { CheckIcon as Check, CaretRightIcon as ChevronRight } from "@/components/icons";
import { FeatSelectionModal } from "@/components/modals/FeatSelectionModal";
import { getStaticFeats } from "@/lib/srd-client";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SRDFeat } from "@/lib/srd-client";

const ABILITY_OPTIONS = [
  { id: "str", label: "STR" },
  { id: "dex", label: "DEX" },
  { id: "con", label: "CON" },
  { id: "int", label: "INT" },
  { id: "wis", label: "WIS" },
  { id: "cha", label: "CHA" },
];

export interface HumanVariantConfigPayload {
  enabled: boolean;
  abilities: string[];
  skill: string | undefined;
  feat: string | undefined;
}

interface HumanVariantConfigProps {
  initialEnabled?: boolean;
  initialAbilities?: string[];
  initialSkill?: string;
  initialFeat?: string;
  onChange: (payload: HumanVariantConfigPayload) => void;
}

export function HumanVariantConfig({
  initialEnabled = false,
  initialAbilities = [],
  initialSkill,
  initialFeat,
  onChange,
}: HumanVariantConfigProps) {
  const { t } = useLanguage();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [abilities, setAbilities] = useState<string[]>(initialAbilities);
  const [skill, setSkill] = useState<string | undefined>(initialSkill);
  const [feat, setFeat] = useState<string | undefined>(initialFeat);
  const [featModalOpen, setFeatModalOpen] = useState(false);
  const feats = useMemo(() => getStaticFeats([], undefined, "en"), []);

  const toggleAbility = (abilityId: string) => {
    setAbilities((prev) => {
      let next: string[];
      if (prev.includes(abilityId)) {
        next = prev.filter((a) => a !== abilityId);
      } else if (prev.length < 2) {
        next = [...prev, abilityId];
      } else {
        next = [prev[1], abilityId];
      }
      onChange({ enabled, abilities: next, skill, feat });
      return next;
    });
  };

  const selectSkill = (skillName: string) => {
    const next = skill === skillName ? undefined : skillName;
    setSkill(next);
    onChange({ enabled, abilities, skill: next, feat });
  };

  const selectFeat = (featName: string) => {
    const next = feat === featName ? undefined : featName;
    setFeat(next);
    onChange({ enabled, abilities, skill, feat: next });
  };

  const toggleEnabled = () => {
    const nextEnabled = !enabled;
    setEnabled(nextEnabled);
    if (!nextEnabled) {
      setAbilities([]);
      setSkill(undefined);
      setFeat(undefined);
    }
    onChange({ enabled: nextEnabled, abilities: nextEnabled ? abilities : [], skill: nextEnabled ? skill : undefined, feat: nextEnabled ? feat : undefined });
  };

  if (!enabled) {
    return (
      <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={toggleEnabled}
            className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent-indigo-600)] focus:ring-[var(--color-accent-indigo-500)]"
          />
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            Enable Variant Human
          </span>
        </label>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          When enabled, you gain +1 to two abilities, one skill proficiency, and one feat.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={toggleEnabled}
            className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent-indigo-600)] focus:ring-[var(--color-accent-indigo-500)]"
          />
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            Enable Variant Human
          </span>
        </label>
        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
          When enabled, you gain +1 to two abilities, one skill proficiency, and one feat.
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
            +1 to Two Abilities
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {ABILITY_OPTIONS.map((ability) => {
              const isSelected = abilities.includes(ability.id);
              return (
                <button
                  key={ability.id}
                  type="button"
                  onClick={() => toggleAbility(ability.id)}
                  className={`p-2 text-center rounded-lg border text-xs font-bold uppercase transition-all ${
                    isSelected
                      ? "border-[var(--color-accent-indigo-500)] bg-[var(--color-accent-indigo-50)] text-[var(--color-accent-indigo-700)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                  }`}
                >
                  {ability.label}
                </button>
              );
            })}
          </div>
          <div className="text-[10px] text-[var(--color-text-muted)] mt-1.5">
            {abilities.length === 0
              ? "Select 2 abilities"
              : abilities.length === 1
              ? "1 ability selected"
              : "2 abilities selected"}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
            Skill Proficiency
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              "Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception",
              "History", "Insight", "Intimidation", "Investigation", "Medicine",
              "Nature", "Perception", "Performance", "Persuasion", "Religion",
              "Sleight of Hand", "Stealth", "Survival",
            ].map((skillName) => {
              const isSelected = skill === skillName;
              return (
                <button
                  key={skillName}
                  type="button"
                  onClick={() => selectSkill(skillName)}
                  className={`p-1.5 text-left rounded-lg border text-xs font-semibold transition-all ${
                    isSelected
                      ? "border-[var(--color-accent-indigo-500)] bg-[var(--color-accent-indigo-50)] text-[var(--color-accent-indigo-700)]"
                      : "border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                  }`}
                >
                  {skillName}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
          <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
            Feat
          </div>
          {feat && (
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">{feat}</span>
              <button
                type="button"
                onClick={() => selectFeat(undefined as any)}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
              >
                Change
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setFeatModalOpen(true)}
            className="btn btn-secondary w-full text-sm"
          >
            {feat ? "Change Feat" : "Choose Feat"}
          </button>
        </div>
      </div>

      {featModalOpen && (
        <FeatSelectionModal
          selectedFeat={feat}
          sources={[]}
          onSelect={(selected: SRDFeat) => {
            selectFeat(selected.name);
            setFeatModalOpen(false);
          }}
          onClose={() => setFeatModalOpen(false)}
        />
      )}
    </div>
  );
}
