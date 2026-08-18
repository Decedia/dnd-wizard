"use client";

import { useState } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { skills as srdSkills } from "@/data/srd";
import { getModifier, getProficiencyBonus, type Character } from "@/lib/storage";

interface SkillsSectionProps {
  character: Character & { passivePerception: number };
  onChange: (patch: Partial<Character & { passivePerception: number }>) => void;
}

export function SkillsSection({ character, onChange }: SkillsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const profBonus = getProficiencyBonus(character.level);
  const [tooltip, setTooltip] = useState<{ name: string; description: string } | null>(null);

  return (
    <SectionCard id="skills" title="Skills" icon={<SkillsIcon className="h-5 w-5" />}>
      <div className="space-y-2">
        {srdSkills.map(({ name, ability, description }) => {
          const score = character[ability as keyof Character] as number;
          const mod = getModifier(score);
          const isProficient = character.skills[name] ?? false;
          const total = mod + (isProficient ? profBonus : 0);

          return (
            <div
              key={name}
              className="flex items-center justify-between rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-2"
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isProficient}
                  onChange={(e) => onChange({ skills: { ...character.skills, [name]: e.target.checked } })}
                  onBlur={onFieldBlur}
                  className="h-4 w-4 rounded border-parchment/30 bg-charcoal text-gold focus:ring-gold/50"
                />
                <span className="text-sm text-parchment/80">{name}</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-parchment/70">
                  {total >= 0 ? `+${total}` : total}
                </span>
                <button
                  type="button"
                  onClick={() => setTooltip({ name, description })}
                  className="text-parchment/40 hover:text-parchment"
                  aria-label={`Info about ${name}`}
                >
                  <InfoIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex justify-end">
        <Field label="Passive Wisdom (Perception)">
          <input
            type="number"
            value={character.passivePerception}
            onChange={(e) => onChange({ passivePerception: Math.max(0, parseInt(e.target.value || "0", 10)) })}
            onBlur={onFieldBlur}
            className="input max-w-[120px]"
          />
        </Field>
      </div>

      {tooltip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80" onClick={() => setTooltip(null)}>
          <div className="max-w-sm rounded-xl border border-parchment/20 bg-charcoal-light p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-semibold text-gold">{tooltip.name}</h3>
              <button onClick={() => setTooltip(null)} className="text-parchment/40 hover:text-parchment">
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm text-parchment/70">{tooltip.description}</p>
          </div>
        </div>
      )}
    </SectionCard>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function SkillsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
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
