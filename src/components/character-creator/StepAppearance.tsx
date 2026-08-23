"use client";

import { StepCard } from "./StepCard";
import type { Character } from "@/lib/storage";

interface StepAppearanceProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepAppearance({ data, onChange }: StepAppearanceProps) {
  const updateAppearance = (field: string, value: string) => {
    onChange({
      appearance: {
        ...data.appearance,
        [field]: value,
      },
    });
  };

  return (
    <StepCard
      title="Appearance & Details"
      hint="Add the finishing touches to your character - appearance, personality, and any other details that bring them to life."
    >
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
            Height
          </label>
          <input
            type="text"
            value={data.appearance?.height || ""}
            onChange={(e) => updateAppearance("height", e.target.value)}
            className="input w-full"
            placeholder="e.g., 6'2&quot;"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
            Weight
          </label>
          <input
            type="text"
            value={data.appearance?.weight || ""}
            onChange={(e) => updateAppearance("weight", e.target.value)}
            className="input w-full"
            placeholder="e.g., 180 lbs"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
            Eyes
          </label>
          <input
            type="text"
            value={data.appearance?.eyes || ""}
            onChange={(e) => updateAppearance("eyes", e.target.value)}
            className="input w-full"
            placeholder="e.g., Blue"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
            Hair
          </label>
          <input
            type="text"
            value={data.appearance?.hair || ""}
            onChange={(e) => updateAppearance("hair", e.target.value)}
            className="input w-full"
            placeholder="e.g., Brown, curly"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
            Skin
          </label>
          <input
            type="text"
            value={data.appearance?.skin || ""}
            onChange={(e) => updateAppearance("skin", e.target.value)}
            className="input w-full"
            placeholder="e.g., Fair, tanned"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
            Personality Traits
          </label>
          <textarea
            value={data.appearance?.personality || ""}
            onChange={(e) => updateAppearance("personality", e.target.value)}
            className="input w-full"
            rows={3}
            placeholder="Describe your character's personality..."
          />
        </div>
        <div>
          <label className="text-xs font-medium text-text-muted uppercase tracking-wider block mb-2">
            Backstory
          </label>
          <textarea
            value={data.appearance?.backstory || ""}
            onChange={(e) => updateAppearance("backstory", e.target.value)}
            className="input w-full"
            rows={4}
            placeholder="Write your character's backstory..."
          />
        </div>
      </div>
    </StepCard>
  );
}
