"use client";

import { StepCard } from "./StepCard";
import { ALIGNMENTS } from "@/lib/storage";

interface StepIdentityProps {
  data: {
    name: string;
    playerName: string;
    alignment: string;
  };
  onChange: (data: Partial<StepIdentityProps["data"]>) => void;
}

export function StepIdentity({ data, onChange }: StepIdentityProps) {
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
