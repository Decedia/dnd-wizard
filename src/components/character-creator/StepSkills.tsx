"use client";

import { useState } from "react";
import { StepCard } from "./StepCard";
import { SKILLS } from "@/lib/storage";

interface StepSkillsProps {
  data: { skills: Record<string, boolean> };
  onChange: (data: Partial<StepSkillsProps["data"]>) => void;
}

const SKILL_DESCRIPTIONS: Record<string, string> = {
  Acrobatics: "Used for keeping your balance in difficult situations, performing aerial stunts, or avoiding falling damage.",
  "Animal Handling": "Used for calming animals, riding mounts, or reading animal behavior.",
  Arcana: "Used for recalling lore about spells, magic items, and the planes of existence.",
  Athletics: "Used for climbing, jumping, swimming, and physical feats of strength.",
  Deception: "Used for lying, misleading, or disguising your true intentions.",
  History: "Used for recalling lore about historical events, people, and places.",
  Insight: "Used for reading body language, detecting lies, and understanding emotions.",
  Intimidation: "Used for threatening others, hostage situations, or bullying.",
  Investigation: "Used for searching for clues, examining objects, or finding hidden things.",
  Medicine: "Used for stabilizing dying creatures, diagnosing illnesses, or treating wounds.",
  Nature: "Used for recalling lore about terrain, plants, animals, and weather.",
  Perception: "Used for spotting hidden creatures, noticing details, or detecting ambushes.",
  Performance: "Used for entertaining crowds, acting, music, dance, or storytelling.",
  Persuasion: "Used for negotiating, convincing others, or altering attitudes.",
  Religion: "Used for recalling lore about deities, holy symbols, and religious traditions.",
  "Sleight of Hand": "Used for picking pockets, performing magic tricks, or planting items.",
  Stealth: "Used for hiding, moving silently, or avoiding detection.",
  Survival: "Used for tracking creatures, navigating wilderness, or foraging for food.",
};

export function StepSkills({ data, onChange }: StepSkillsProps) {
  const [tooltip, setTooltip] = useState<{ name: string; description: string } | null>(null);

  const toggleSkill = (name: string) => {
    onChange({
      skills: { ...data.skills, [name]: !data.skills[name] },
    });
  };

  return (
    <StepCard title="Skills">
      <div className="space-y-2">
        {SKILLS.map(({ name }) => (
          <div
            key={name}
            className="flex items-center justify-between rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-2"
          >
            <label className="flex items-center gap-3 cursor-pointer flex-1">
              <input
                type="checkbox"
                checked={data.skills[name] || false}
                onChange={() => toggleSkill(name)}
                onBlur={() => {}}
                className="h-4 w-4 rounded border-parchment/30 bg-charcoal text-gold focus:ring-gold/50"
              />
              <span className="text-sm text-parchment/80">{name}</span>
            </label>
            <button
              type="button"
              onClick={() => setTooltip({ name, description: SKILL_DESCRIPTIONS[name] })}
              className="text-parchment/40 hover:text-parchment"
              aria-label={`Info about ${name}`}
            >
              <InfoIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
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
    </StepCard>
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
