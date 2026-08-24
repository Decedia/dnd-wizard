"use client";

import { StepCard } from "./StepCard";
import { backgrounds } from "@/data/srd";
import type { Character } from "@/lib/storage";

interface StepIdentityProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepIdentity({ data, onChange }: StepIdentityProps) {
  return (
    <StepCard title="Identity" hint="Enter your character's name, choose a background, and set their alignment. This is who your character is in the world.">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
            Character Name *
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="input w-full"
            placeholder="Enter character name"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
            Background
          </label>
          <select
            value={data.background}
            onChange={(e) => onChange({ background: e.target.value })}
            className="input w-full"
          >
            <option value="">Select background</option>
            {backgrounds.map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
            Alignment
          </label>
          <select
            value={data.alignment}
            onChange={(e) => onChange({ alignment: e.target.value })}
            className="input w-full"
          >
            <option value="">Select alignment</option>
            <option value="Lawful Good">Lawful Good</option>
            <option value="Neutral Good">Neutral Good</option>
            <option value="Chaotic Good">Chaotic Good</option>
            <option value="Lawful Neutral">Lawful Neutral</option>
            <option value="True Neutral">True Neutral</option>
            <option value="Chaotic Neutral">Chaotic Neutral</option>
            <option value="Lawful Evil">Lawful Evil</option>
            <option value="Neutral Evil">Neutral Evil</option>
          </select>
        </div>
      </div>
    </StepCard>
  );
}
