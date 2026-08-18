"use client";

import { useState } from "react";
import { StepCard } from "./StepCard";
import { skills } from "@/data/srd";

interface StepSkillsProps {
  data: { skills: Record<string, boolean> };
  onChange: (data: Partial<StepSkillsProps["data"]>) => void;
}

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
        {skills.map(({ name, description }) => (
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
              onClick={() => setTooltip({ name, description })}
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
