"use client";

import { StepCard } from "./StepCard";

interface StepBackgroundProps {
  data: {
    background: string;
    personalityTrait1: string;
    personalityTrait2: string;
    ideal: string;
    bond: string;
    flaw: string;
  };
  onChange: (data: Partial<StepBackgroundProps["data"]>) => void;
}

export function StepBackground({ data, onChange }: StepBackgroundProps) {
  return (
    <StepCard title="Background">
      <div className="space-y-4">
        <Field label="Background Name">
          <input
            type="text"
            value={data.background}
            onChange={(e) => onChange({ background: e.target.value })}
            onBlur={() => {}}
            className="input"
            placeholder="e.g. Folk Hero, Noble, Criminal"
          />
        </Field>
        <Field label="Personality Trait 1">
          <textarea
            value={data.personalityTrait1}
            onChange={(e) => onChange({ personalityTrait1: e.target.value })}
            onBlur={() => {}}
            className="textarea.input min-h-[60px]"
            placeholder="A personality trait that defines your character"
          />
        </Field>
        <Field label="Personality Trait 2">
          <textarea
            value={data.personalityTrait2}
            onChange={(e) => onChange({ personalityTrait2: e.target.value })}
            onBlur={() => {}}
            className="textarea.input min-h-[60px]"
            placeholder="Another personality trait"
          />
        </Field>
        <Field label="Ideal">
          <textarea
            value={data.ideal}
            onChange={(e) => onChange({ ideal: e.target.value })}
            onBlur={() => {}}
            className="textarea.input min-h-[60px]"
            placeholder="A principle or belief your character holds dear"
          />
        </Field>
        <Field label="Bond">
          <textarea
            value={data.bond}
            onChange={(e) => onChange({ bond: e.target.value })}
            onBlur={() => {}}
            className="textarea.input min-h-[60px]"
            placeholder="A connection or promise that drives your character"
          />
        </Field>
        <Field label="Flaw">
          <textarea
            value={data.flaw}
            onChange={(e) => onChange({ flaw: e.target.value })}
            onBlur={() => {}}
            className="textarea.input min-h-[60px]"
            placeholder="A weakness or vice your character struggles with"
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
