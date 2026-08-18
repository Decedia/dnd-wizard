"use client";

import { useCallback } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { raceNames, classNames } from "@/data/srd";
import { ALIGNMENTS } from "@/lib/storage";
import { useLevelUp } from "@/hooks/useLevelUp";
import { LevelUpModal } from "@/components/level-up/LevelUpModal";
import type { LevelUpResult } from "@/lib/level-up";

interface IdentitySectionProps {
  character: {
    name: string;
    playerName: string;
    race: string;
    class: string;
    level: number;
    background: string;
    alignment: string;
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
    features: { id: string; name: string; description: string }[];
    spellSlots: Record<number, number>;
  };
  onChange: (patch: Partial<IdentitySectionProps["character"]>) => void;
}

export function IdentitySection({ character, onChange }: IdentitySectionProps) {
  const { onFieldBlur } = useCharacterSheet();

  const handleLevelChange = useCallback(
    (newLevel: number, result: LevelUpResult | null) => {
      if (!result) {
        onChange({ level: newLevel });
        return;
      }
      const patch: Partial<IdentitySectionProps["character"]> = { level: newLevel };
      if (result.addedFeatures.length > 0) {
        patch.features = [
          ...character.features,
          ...result.addedFeatures.map((f) => ({
            id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            name: f.name,
            description: f.description,
          })),
        ];
      }
      if (result.abilityScoreChanges && result.abilityScoreChanges.length > 0) {
        const updates: any = { ...character };
        for (const change of result.abilityScoreChanges) {
          updates[change.ability] = (character[change.ability as keyof typeof character] as number || 0) + change.delta;
        }
        Object.assign(patch, updates);
      }
      if (result.spellSlots) {
        patch.spellSlots = { ...character.spellSlots, ...result.spellSlots };
      }
      onChange(patch);
    },
    [character, onChange]
  );

  const { pendingLevelUp, handleLevelChange: handleLevelChangeHook, confirmLevelUp, cancelLevelUp } = useLevelUp({
    currentLevel: character.level,
    className: character.class,
    onLevelChange: handleLevelChange,
  });

  return (
    <SectionCard id="identity" title="Identity" icon={<UserIcon className="h-5 w-5" />}>
      <div className="grid grid-cols-1 gap-4">
        <Field label="Character Name">
          <input
            type="text"
            value={character.name}
            onChange={(e) => onChange({ name: e.target.value })}
            onBlur={onFieldBlur}
            className="input"
            placeholder="Enter character name"
          />
        </Field>
        <Field label="Player Name (optional)">
          <input
            type="text"
            value={character.playerName}
            onChange={(e) => onChange({ playerName: e.target.value })}
            onBlur={() => {}}
            className="input"
            placeholder="Your name"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Race">
            <select
              value={character.race}
              onChange={(e) => onChange({ race: e.target.value })}
              onBlur={() => {}}
              className="input"
            >
              <option value="">Select race</option>
              {raceNames.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </Field>
          <Field label="Class">
            <select
              value={character.class}
              onChange={(e) => onChange({ class: e.target.value })}
              onBlur={() => {}}
              className="input"
            >
              <option value="">Select class</option>
              {classNames.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Level">
          <input
            type="number"
            min={1}
            max={20}
            value={character.level}
            onChange={(e) => handleLevelChangeHook(Math.max(1, parseInt(e.target.value || "1", 10)))}
            onBlur={() => {}}
            className="input"
          />
        </Field>
        <Field label="Background">
          <input
            type="text"
            value={character.background}
            onChange={(e) => onChange({ background: e.target.value })}
            onBlur={() => {}}
            className="input"
            placeholder="e.g. Folk Hero"
          />
        </Field>
        <Field label="Alignment">
          <select
            value={character.alignment}
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
      </div>

      <LevelUpModal
        key={pendingLevelUp?.newLevel}
        open={!!pendingLevelUp}
        levelUpResult={pendingLevelUp?.result ?? null}
        currentAbilityScores={{
          str: character.str,
          dex: character.dex,
          con: character.con,
          int: character.int,
          wis: character.wis,
          cha: character.cha,
        }}
        onConfirm={confirmLevelUp}
        onCancel={cancelLevelUp}
      />
    </SectionCard>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider">{label}</span>
      {children}
    </label>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
