"use client";

import { useState } from "react";
import { StepCard } from "./StepCard";
import { ALIGNMENTS } from "@/lib/storage";
import { languageNames, backgrounds } from "@/data/srd";

interface StepIdentityProps {
  data: {
    name: string;
    playerName: string;
    background: string;
    alignment: string;
    languages: string[];
  };
  onChange: (patch: Partial<StepIdentityProps["data"]>) => void;
}

export function StepIdentity({ data, onChange }: StepIdentityProps) {
  const [customLang, setCustomLang] = useState("");

  const toggleLanguage = (lang: string) => {
    const current = data.languages || [];
    const next = current.includes(lang)
      ? current.filter((l) => l !== lang)
      : [...current, lang];
    onChange({ languages: next });
  };

  const addCustomLanguage = () => {
    const trimmed = customLang.trim();
    if (!trimmed) return;
    const current = data.languages || [];
    if (!current.includes(trimmed)) {
      onChange({ languages: [...current, trimmed] });
    }
    setCustomLang("");
  };

  return (
    <StepCard title="Identity" hint="Enter your character's name and basic details. This is who your character is in the world.">
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
        <Field label="Languages">
          <div className="grid grid-cols-2 gap-2">
            {languageNames.map((lang) => (
              <label key={lang} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.languages.includes(lang)}
                  onChange={() => toggleLanguage(lang)}
                  onBlur={() => {}}
                  className="h-4 w-4 rounded border-parchment/30 bg-charcoal text-gold focus:ring-gold/50"
                />
                <span className="text-sm text-parchment/80">{lang}</span>
              </label>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={customLang}
              onChange={(e) => setCustomLang(e.target.value)}
              onBlur={() => {}}
              className="input flex-1"
              placeholder="Custom language..."
            />
            <button
              type="button"
              onClick={addCustomLanguage}
              className="rounded-lg border border-parchment/20 bg-charcoal/40 px-3 py-2 text-xs font-medium text-parchment transition-colors hover:border-gold/40"
            >
              Add
            </button>
          </div>
        </Field>
        <Field label="Background">
          <select
            value={data.background}
            onChange={(e) => onChange({ background: e.target.value })}
            onBlur={() => {}}
            className="input"
          >
            <option value="">Select background</option>
            {backgrounds.map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
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
