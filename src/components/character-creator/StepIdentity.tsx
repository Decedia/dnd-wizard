"use client";

import { useCallback } from "react";
import { StepCard } from "./StepCard";
import { ALIGNMENTS, getProficiencyBonus } from "@/lib/storage";
import { useLevelUp } from "@/hooks/useLevelUp";
import { LevelUpModal } from "@/components/level-up/LevelUpModal";
import type { LevelUpResult } from "@/lib/level-up";
import { languageNames } from "@/data/srd";

interface StepIdentityProps {
  data: {
    name: string;
    playerName: string;
    race: string;
    class: string;
    level: number;
    background: string;
    alignment: string;
    experiencePoints: number;
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
    features: { id: string; name: string; description: string }[];
    spellSlots: Record<number, number>;
    languages: string[];
  };
  onChange: (patch: Partial<StepIdentityProps["data"]>) => void;
}

export function StepIdentity({ data, onChange }: StepIdentityProps) {
  const handleLevelChange = useCallback(
    (newLevel: number, result: LevelUpResult | null) => {
      if (!result) {
        onChange({ level: newLevel });
        return;
      }
      const patch: Partial<StepIdentityProps["data"]> = { level: newLevel };
      if (result.addedFeatures.length > 0) {
        patch.features = [
          ...data.features,
          ...result.addedFeatures.map((f) => ({
            id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            name: f.name,
            description: f.description,
          })),
        ];
      }
      if (result.abilityScoreChanges && result.abilityScoreChanges.length > 0) {
        const updates: any = { ...data };
        for (const change of result.abilityScoreChanges) {
          updates[change.ability] = (data[change.ability as keyof typeof data] as number || 0) + change.delta;
        }
        Object.assign(patch, updates);
      }
      if (result.spellSlots) {
        patch.spellSlots = { ...data.spellSlots, ...result.spellSlots };
      }
      onChange(patch);
    },
    [data, onChange]
  );

  const { pendingLevelUp, handleLevelChange: handleLevelChangeHook, confirmLevelUp, cancelLevelUp } = useLevelUp({
    currentLevel: data.level,
    className: data.class,
    onLevelChange: handleLevelChange,
  });

  const toggleLanguage = (lang: string) => {
    const current = data.languages || [];
    const next = current.includes(lang)
      ? current.filter((l) => l !== lang)
      : [...current, lang];
    onChange({ languages: next });
  };

  return (
    <StepCard title="Identity">
      <div className="space-y-4">
        <Field label="Character Name" required>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            onBlur={() => {}}
            className="input"
            placeholder="Enter your character's name"
          />
        </Field>
        <Field label="Player Name (optional)">
          <input
            type="text"
            value={data.playerName}
            onChange={(e) => onChange({ playerName: e.target.value })}
            onBlur={() => {}}
            className="input"
            placeholder="Your name"
          />
        </Field>
        <Field label="Level">
          <input
            type="number"
            min={1}
            max={10}
            value={data.level}
            onChange={(e) => handleLevelChangeHook(Math.max(1, parseInt(e.target.value || "1", 10)))}
            onBlur={() => {}}
            className="input"
          />
        </Field>
        <Field label="Proficiency Bonus">
          <input
            type="number"
            value={getProficiencyBonus(data.level)}
            readOnly
            className="input bg-charcoal/60"
          />
        </Field>
        <Field label="Experience Points">
          <input
            type="number"
            min={0}
            value={data.experiencePoints}
            onChange={(e) => onChange({ experiencePoints: Math.max(0, parseInt(e.target.value || "0", 10)) })}
            onBlur={() => {}}
            className="input"
          />
        </Field>
        <Field label="Race">
          <select
            value={data.race}
            onChange={(e) => onChange({ race: e.target.value })}
            onBlur={() => {}}
            className="input"
          >
            <option value="">Select race</option>
            {["Human", "Elf", "Dwarf", "Halfling"].map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="Class">
          <select
            value={data.class}
            onChange={(e) => onChange({ class: e.target.value })}
            onBlur={() => {}}
            className="input"
          >
            <option value="">Select class</option>
            {["Fighter", "Wizard", "Rogue"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Alignment">
          <select
            value={data.alignment}
            onChange={(e) => onChange({ alignment: e.target.value })}
            onBlur={() => {}}
            className="input"
          >
            <option value="">Select alignment</option>
            {ALIGNMENTS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </Field>
        <Field label="Languages">
          <div className="grid grid-cols-2 gap-2">
            {languageNames.map((lang) => (
              <label key={lang} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.languages.includes(lang)}
                  onChange={() => toggleLanguage(lang)}
                  onBlur={() => {}}
                  className="h-4 w-4 rounded border-parchment/30 bg-charcoal text-gold focus:ring-gold/50"
                />
                <span className="text-sm text-parchment/80">{lang}</span>
              </label>
            ))}
          </div>
        </Field>
        <Field label="Background">
          <input
            type="text"
            value={data.background}
            onChange={(e) => onChange({ background: e.target.value })}
            onBlur={() => {}}
            className="input"
            placeholder="e.g. Folk Hero"
          />
        </Field>
      </div>

      <LevelUpModal
        key={pendingLevelUp?.newLevel}
        open={!!pendingLevelUp}
        levelUpResult={pendingLevelUp?.result ?? null}
        currentAbilityScores={{
          str: data.str,
          dex: data.dex,
          con: data.con,
          int: data.int,
          wis: data.wis,
          cha: data.cha,
        }}
        onConfirm={confirmLevelUp}
        onCancel={cancelLevelUp}
      />
    </StepCard>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider">
        {label}
        {required && <span className="text-burgundy-light ml-1">*</span>}
      </span>
      {children}
    </label>
  );
}
