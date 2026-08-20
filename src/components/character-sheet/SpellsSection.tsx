"use client";

import { useState } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { spells as srdSpells } from "@/data/srd";
import type { Character } from "@/lib/storage";

interface SpellsSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SpellsSection({ character, onChange, collapsed = false, onToggleCollapse }: SpellsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const [tooltip, setTooltip] = useState<{ name: string; description: string } | null>(null);

  const updateItem = (id: string, patch: Partial<Character["spells"][number]>) => {
    onChange({
      spells: character.spells.map((s) =>
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
      damageDice: "",
      damageType: "",
      description: "",
    };
    onChange({
      spells: [...character.spells, newSpell],
    });
  };

  const removeItem = (id: string) => {
    onChange({
      spells: character.spells.filter((s) => s.id !== id),
    });
  };

  const handleSrdSelect = (spellId: string, srdName: string) => {
    const srdSpell = srdSpells.find((s) => s.name === srdName);
    if (!srdSpell) return;
    const updated = {
      ...character.spells.find((s) => s.id === spellId)!,
      name: srdSpell.name,
      level: srdSpell.level,
      source: "srd" as const,
      srdSpellName: srdSpell.name,
    };
    onChange({
      spells: character.spells.map((s) => (s.id === spellId ? updated : s)),
    });
  };

  return (
    <SectionCard id="spells" title="Spells" icon={<SpellsIcon className="h-5 w-5" />}>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="text-xs text-parchment/50 hover:text-parchment"
        >
          {collapsed ? "Show Spells" : "Hide Spells"}
        </button>
      </div>

      {!collapsed && (
        <>
          <div className="mt-3 space-y-2">
            {character.spells.map((spell) => {
              const description = spell.srdSpellName ? srdSpells.find((s) => s.name === spell.srdSpellName)?.description : undefined;
              const isCustom = spell.source === "custom";
              const dropdownValue = isCustom ? "Custom Spell" : (spell.srdSpellName || "");
              return (
                <div key={spell.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-2">
                  <select
                    value={dropdownValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "Custom Spell") {
                        updateItem(spell.id, { source: "custom", srdSpellName: undefined, name: spell.name || "" });
                      } else if (val) {
                        handleSrdSelect(spell.id, val);
                      } else {
                        updateItem(spell.id, { source: "srd", srdSpellName: undefined, name: "" });
                      }
                    }}
                    onBlur={onFieldBlur}
                    className="input flex-1 min-w-[120px]"
                  >
                    <option value="">Select spell...</option>
                    {srdSpells.map((s) => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                    <option value="Custom Spell">Custom Spell</option>
                  </select>
                  {isCustom && (
                    <>
                      <input
                        type="text"
                        value={spell.name}
                        onChange={(e) => updateItem(spell.id, { name: e.target.value })}
                        onBlur={onFieldBlur}
                        className="input flex-1 min-w-[120px]"
                        placeholder="Enter custom spell name"
                      />
                      <input
                        type="text"
                        value={spell.description || ""}
                        onChange={(e) => updateItem(spell.id, { description: e.target.value })}
                        onBlur={onFieldBlur}
                        className="input flex-1 min-w-[120px]"
                        placeholder="Spell description / effect"
                      />
                    </>
                  )}
                  <input
                    type="number"
                    value={spell.level}
                    onChange={(e) => updateItem(spell.id, { level: parseInt(e.target.value || "0", 10) })}
                    onBlur={onFieldBlur}
                    className="input w-14 text-center"
                    placeholder="Lvl"
                  />
                  {isCustom && (
                    <>
                      <input
                        type="text"
                        value={spell.damageDice || ""}
                        onChange={(e) => updateItem(spell.id, { damageDice: e.target.value })}
                        onBlur={onFieldBlur}
                        className="input w-20 text-center"
                        placeholder="Dice (e.g. 2d6)"
                      />
                      <input
                        type="text"
                        value={spell.damageType || ""}
                        onChange={(e) => updateItem(spell.id, { damageType: e.target.value })}
                        onBlur={onFieldBlur}
                        className="input w-20 text-center"
                        placeholder="Type"
                      />
                    </>
                  )}
                  {description && !isCustom && (
                    <button
                      type="button"
                      onClick={() => setTooltip({ name: spell.name, description })}
                      className="text-parchment/40 hover:text-parchment shrink-0"
                      aria-label={`Info about ${spell.name}`}
                    >
                      <InfoIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(spell.id)}
                    className="text-parchment/40 hover:text-parchment shrink-0"
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
            className="mt-3 rounded-lg border border-dashed border-parchment/20 px-4 py-2 text-sm font-medium text-parchment/60 transition-colors hover:border-burgundy/40 hover:text-parchment"
          >
            + Add Spell
          </button>
        </>
      )}

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

function SpellsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}
