"use client";

import { useState } from "react";
import { StepCard } from "./StepCard";
import type { Character } from "@/lib/storage";
import { spells as srdSpells } from "@/data/srd";
import { getClassData } from "@/data/srd";

interface StepSpellsProps {
  data: Character;
  onChange: (data: Partial<Character>) => void;
}

export function StepSpells({ data, onChange }: StepSpellsProps) {
  const [tooltip, setTooltip] = useState<{ name: string; description: string } | null>(null);

  const updateItem = (id: string, patch: Partial<Character["spells"][number]>) => {
    onChange({
      spells: data.spells.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    });
  };

  const addItem = (srdSpellName?: string) => {
    const srdSpell = srdSpellName ? srdSpells.find((s) => s.name === srdSpellName) : undefined;
    const newSpell: Character["spells"][number] = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      name: srdSpell?.name ?? "",
      level: srdSpell?.level ?? 0,
      source: srdSpell ? "srd" : "custom",
      srdSpellName: srdSpell?.name,
    };
    onChange({
      spells: [...data.spells, newSpell],
    });
  };

  const removeItem = (id: string) => {
    onChange({
      spells: data.spells.filter((s) => s.id !== id),
    });
  };

  const handleSrdSelect = (spellId: string, srdName: string) => {
    const srdSpell = srdSpells.find((s) => s.name === srdName);
    if (!srdSpell) return;
    const updated = {
      ...data.spells.find((s) => s.id === spellId)!,
      name: srdSpell.name,
      level: srdSpell.level,
      source: "srd" as const,
      srdSpellName: srdSpell.name,
    };
    onChange({
      spells: data.spells.map((s) => (s.id === spellId ? updated : s)),
    });
  };

  const classData = data.class ? getClassData(data.class) : null;

  return (
    <StepCard title="Spells">
      <p className="text-xs text-parchment/50 mb-3">
        Skip if your class does not cast spells.
      </p>
      {classData?.spellcastingAbility && (
        <div className="mb-3">
          <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider">Spellcasting Ability</span>
          <input
            type="text"
            value={classData.spellcastingAbility}
            readOnly
            className="input bg-charcoal/60 mt-1"
          />
        </div>
      )}
      <div className="space-y-2">
        {data.spells.map((spell) => {
          const srdData = spell.srdSpellName ? srdSpells.find((s) => s.name === spell.srdSpellName) : undefined;
          const description = srdData?.description;
          return (
            <div key={spell.id} className="flex items-center gap-2 rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-2">
              <select
                value={spell.srdSpellName || (spell.source === "custom" ? "Custom Spell" : "")}
                onChange={(e) => {
                  if (e.target.value === "Custom Spell") {
                    updateItem(spell.id, { source: "custom", srdSpellName: undefined });
                  } else if (e.target.value) {
                    handleSrdSelect(spell.id, e.target.value);
                  }
                }}
                onBlur={() => {}}
                className="input flex-1"
              >
                <option value="">Select spell...</option>
                {srdSpells.map((s) => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
                <option value="Custom Spell">Custom Spell</option>
              </select>
              {spell.source === "custom" ? (
                <input
                  type="number"
                  min={0}
                  max={9}
                  value={spell.level}
                  onChange={(e) => updateItem(spell.id, { level: Math.max(0, Math.min(9, parseInt(e.target.value || "0", 10))) })}
                  onBlur={() => {}}
                  className="input w-16 text-center"
                />
              ) : (
                <input
                  type="number"
                  value={spell.level}
                  readOnly
                  className="input w-16 text-center bg-charcoal/60"
                />
              )}
              {description && (
                <button
                  type="button"
                  onClick={() => setTooltip({ name: spell.name, description })}
                  className="text-parchment/40 hover:text-gold"
                  aria-label={`Info about ${spell.name}`}
                >
                  <InfoIcon className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => removeItem(spell.id)}
                className="text-parchment/40 hover:text-parchment"
                aria-label="Remove spell"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        onClick={() => addItem()}
        className="mt-3 rounded-lg border border-dashed border-parchment/20 px-4 py-2 text-sm font-medium text-parchment/60 transition-colors hover:border-gold/40 hover:text-parchment"
      >
        + Add Spell
      </button>

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
