"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import type { Character } from "@/lib/storage";

interface SpellsSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function SpellsSection({ character, onChange, collapsed = false, onToggleCollapse }: SpellsSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const updateItem = (id: string, patch: Partial<Character["spells"][number]>) => {
    onChange({
      spells: character.spells.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    });
  };

  const addItem = () => {
    onChange({
      spells: [
        ...character.spells,
        { id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, name: "", level: 0 },
      ],
    });
  };

  const removeItem = (id: string) => {
    onChange({
      spells: character.spells.filter((s) => s.id !== id),
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
            {character.spells.map((spell) => (
              <div key={spell.id} className="flex items-center gap-2 rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-2">
                <input
                  type="text"
                  value={spell.name}
                  onChange={(e) => updateItem(spell.id, { name: e.target.value })}
                  onBlur={onFieldBlur}
                  className="input flex-1"
                  placeholder="Spell name"
                />
                <input
                  type="number"
                  min={0}
                  max={9}
                  value={spell.level}
                  onChange={(e) => updateItem(spell.id, { level: Math.max(0, Math.min(9, parseInt(e.target.value || "0", 10))) })}
                  onBlur={onFieldBlur}
                  className="input w-16 text-center"
                />
                <button
                  type="button"
                  onClick={() => removeItem(spell.id)}
                  className="text-parchment/40 hover:text-parchment"
                  aria-label="Remove spell"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addItem}
            className="mt-3 rounded-lg border border-dashed border-parchment/20 px-4 py-2 text-sm font-medium text-parchment/60 transition-colors hover:border-gold/40 hover:text-parchment"
          >
            + Add Spell
          </button>
        </>
      )}
    </SectionCard>
  );
}

function SpellsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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
