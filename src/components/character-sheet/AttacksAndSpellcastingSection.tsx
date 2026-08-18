"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import type { Character } from "@/lib/storage";

interface AttacksAndSpellcastingSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function AttacksAndSpellcastingSection({ character, onChange }: AttacksAndSpellcastingSectionProps) {
  const { onFieldBlur } = useCharacterSheet();

  const updateItem = (id: string, patch: Partial<Character["attacks"][number]>) => {
    onChange({
      attacks: character.attacks.map((a) =>
        a.id === id ? { ...a, ...patch } : a
      ),
    });
  };

  const addItem = () => {
    onChange({
      attacks: [
        ...character.attacks,
        { id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, name: "", attackBonus: 0, damageType: "" },
      ],
    });
  };

  const removeItem = (id: string) => {
    onChange({
      attacks: character.attacks.filter((a) => a.id !== id),
    });
  };

  return (
    <SectionCard id="attacks" title="Attacks & Spellcasting" icon={<AttacksIcon className="h-5 w-5" />}>
      <div className="space-y-2">
        {character.attacks.map((attack) => (
          <div key={attack.id} className="flex flex-col gap-2 rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={attack.name}
                onChange={(e) => updateItem(attack.id, { name: e.target.value })}
                onBlur={onFieldBlur}
                className="input flex-1"
                placeholder="Attack / spell name"
              />
              <input
                type="number"
                value={attack.attackBonus}
                onChange={(e) => updateItem(attack.id, { attackBonus: parseInt(e.target.value || "0", 10) })}
                onBlur={onFieldBlur}
                className="input w-20 text-center"
                placeholder="+0"
              />
              <button
                type="button"
                onClick={() => removeItem(attack.id)}
                className="text-parchment/40 hover:text-parchment"
                aria-label="Remove attack"
              >
                <XIcon className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              value={attack.damageType}
              onChange={(e) => updateItem(attack.id, { damageType: e.target.value })}
              onBlur={onFieldBlur}
              className="input"
              placeholder="Damage / type (e.g. 1d8 slashing)"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addItem}
        className="mt-3 rounded-lg border border-dashed border-parchment/20 px-4 py-2 text-sm font-medium text-parchment/60 transition-colors hover:border-gold/40 hover:text-parchment"
      >
        + Add Attack
      </button>
    </SectionCard>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function AttacksIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      <path d="M13 19l6-6" />
      <path d="M16 16l4 4" />
      <path d="M19 21l2-2" />
    </svg>
  );
}
