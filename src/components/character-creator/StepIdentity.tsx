"use client";

import { useState } from "react";
import { StepCard } from "./StepCard";
import { ALIGNMENTS, getProficiencyBonus } from "@/lib/storage";
import { LevelUpFlow } from "@/components/level-up/LevelUpFlow";
import { type LevelUpChanges } from "@/lib/level-up";
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
    skills: Record<string, boolean>;
    expertise: string[];
  };
  onChange: (patch: Partial<StepIdentityProps["data"]>) => void;
}

export function StepIdentity({ data, onChange }: StepIdentityProps) {
  const [levelUpOpen, setLevelUpOpen] = useState(false);
  const [levelUpOldLevel, setLevelUpOldLevel] = useState(data.level);
  const [levelUpNewLevel, setLevelUpNewLevel] = useState(data.level);

  const handleLevelUpComplete = (changes: LevelUpChanges) => {
    const patch: Partial<StepIdentityProps["data"]> = { level: changes.level };
    if (changes.features.length > 0) {
      patch.features = [
        ...data.features,
        ...changes.features.map((f) => ({
          id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          name: f.name,
          description: f.description,
        })),
      ];
    }
    if (changes.subclass) {
      const classData = require("@/data/srd").getClassData(data.class);
      const subclassData = classData?.subclasses?.find((s: any) => s.name === changes.subclass);
      if (subclassData?.features) {
        patch.features = [
          ...(patch.features || data.features),
          ...subclassData.features.map((f: any) => ({
            id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            name: f.name,
            description: f.description,
          })),
        ];
      }
    }
    if (changes.abilityScoreChanges.length > 0) {
      const updates: any = { ...data };
      for (const change of changes.abilityScoreChanges) {
        updates[change.ability] = (data[change.ability as keyof typeof data] as number || 0) + change.delta;
      }
      Object.assign(patch, updates);
    }
    if (changes.expertise.length > 0) {
      patch.expertise = [...(data.expertise || []), ...changes.expertise];
    }
    if (changes.spellSlots) {
      patch.spellSlots = { ...data.spellSlots, ...changes.spellSlots };
    }
    onChange(patch);
    setLevelUpOpen(false);
  };

  const handleLevelUpCancel = () => {
    onChange({ level: levelUpOldLevel });
    setLevelUpOpen(false);
  };

  const handleLevelChange = (newLevel: number) => {
    if (newLevel > data.level) {
      setLevelUpOldLevel(data.level);
      setLevelUpNewLevel(newLevel);
      setLevelUpOpen(true);
    } else if (newLevel < data.level) {
      onChange({ level: newLevel });
    }
  };

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
        <Field label={`Level: ${data.level}`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleLevelChange(Math.max(1, data.level - 1))}
              disabled={data.level <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-parchment/20 text-parchment/70 transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-30"
            >
              -
            </button>
            <input
              type="range"
              min={1}
              max={10}
              value={data.level}
              disabled
              className="flex-1 accent-gold disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => handleLevelChange(Math.min(10, data.level + 1))}
              disabled={data.level >= 10}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-parchment/20 text-parchment/70 transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-30"
            >
              +
            </button>
            <span className="text-sm font-semibold text-gold w-6 text-center">{data.level}</span>
          </div>
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

      <LevelUpFlow
        open={levelUpOpen}
        oldLevel={levelUpOldLevel}
        newLevel={levelUpNewLevel}
        className={data.class}
        currentAbilityScores={{
          str: data.str,
          dex: data.dex,
          con: data.con,
          int: data.int,
          wis: data.wis,
          cha: data.cha,
        }}
        currentExpertise={data.expertise || []}
        currentSkills={data.skills || {}}
        onComplete={handleLevelUpComplete}
        onCancel={handleLevelUpCancel}
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
