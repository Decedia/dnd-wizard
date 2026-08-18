"use client";

import { useCallback } from "react";
import { StepCard } from "./StepCard";
import { ALIGNMENTS } from "@/lib/storage";
import { useLevelUp } from "@/hooks/useLevelUp";
import { LevelUpModal } from "@/components/level-up/LevelUpModal";
import type { LevelUpResult } from "@/lib/level-up";

interface StepIdentityProps {
  data: {
    name: string;
    playerName: string;
    alignment: string;
    level: number;
    class: string;
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
    features: { id: string; name: string; description: string }[];
    spellSlots: Record<number, number>;
  };
  onChange: (data: Partial<StepIdentityProps["data"]>) => void;
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
      </div>

      <LevelUpModal
        key={pendingLevelUp?.newLevel}
        open={!!pendingLevelUp}
        levelUpResult={pendingLevelUp?.result ?? null}
        currentAbilityScores={{
          str: (data as any).str || 10,
          dex: (data as any).dex || 10,
          con: (data as any).con || 10,
          int: (data as any).int || 10,
          wis: (data as any).wis || 10,
          cha: (data as any).cha || 10,
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
