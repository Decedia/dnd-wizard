"use client";

import { StepCard } from "./StepCard";
import type { Character } from "@/lib/storage";

interface StepFinalTouchesProps {
  data: Pick<Character, "appearance">;
  onChange: (data: Partial<StepFinalTouchesProps["data"]>) => void;
}

export function StepFinalTouches({ data, onChange }: StepFinalTouchesProps) {
  const updateField = (field: keyof Character["appearance"], value: string) => {
    onChange({
      appearance: { ...data.appearance, [field]: value },
    });
  };

  return (
    <StepCard title="Final Touches">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Age">
          <input
            type="text"
            value={data.appearance.age}
            onChange={(e) => updateField("age", e.target.value)}
            onBlur={() => {}}
            className="input"
            placeholder="e.g. 27"
          />
        </Field>
        <Field label="Height">
          <input
            type="text"
            value={data.appearance.height}
            onChange={(e) => updateField("height", e.target.value)}
            onBlur={() => {}}
            className="input"
            placeholder="e.g. 6'2&quot;"
          />
        </Field>
        <Field label="Weight">
          <input
            type="text"
            value={data.appearance.weight}
            onChange={(e) => updateField("weight", e.target.value)}
            onBlur={() => {}}
            className="input"
            placeholder="e.g. 180 lbs"
          />
        </Field>
        <Field label="Eyes">
          <input
            type="text"
            value={data.appearance.eyes}
            onChange={(e) => updateField("eyes", e.target.value)}
            onBlur={() => {}}
            className="input"
            placeholder="e.g. Blue"
          />
        </Field>
        <Field label="Skin">
          <input
            type="text"
            value={data.appearance.skin}
            onChange={(e) => updateField("skin", e.target.value)}
            onBlur={() => {}}
            className="input"
            placeholder="e.g. Fair"
          />
        </Field>
        <Field label="Hair">
          <input
            type="text"
            value={data.appearance.hair}
            onChange={(e) => updateField("hair", e.target.value)}
            onBlur={() => {}}
            className="input"
            placeholder="e.g. Brown"
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Backstory">
          <textarea
            value={data.appearance.backstory}
            onChange={(e) => updateField("backstory", e.target.value)}
            onBlur={() => {}}
            className="input min-h-[120px]"
            placeholder="Where did your character come from? What drives them?"
          />
        </Field>
      </div>
    </StepCard>
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
