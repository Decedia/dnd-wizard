"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import type { Character } from "@/lib/storage";
import { getSneakAttackDice } from "@/lib/storage";

interface AttacksAndSpellcastingSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function AttacksAndSpellcastingSection({ character, onChange }: AttacksAndSpellcastingSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const sneakAttack = getSneakAttackDice(character);

  return (
    <SectionCard id="attacks" title="Attacks & Spellcasting" icon={<AttacksIcon className="h-5 w-5" />}>
      {character.class === "Rogue" && sneakAttack && (
        <div className="mb-3 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2">
          <span className="text-xs font-medium text-gold">Sneak Attack: {sneakAttack}</span>
        </div>
      )}
      {character.attacks.length === 0 ? (
        <p className="text-xs text-parchment/50">Equip weapons in Inventory to auto-populate attacks.</p>
      ) : (
        <div className="space-y-2">
          {character.attacks.map((attack) => (
            <div key={attack.id} className="flex flex-col gap-2 rounded-lg border border-parchment/10 bg-charcoal/40 px-3 py-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={attack.name}
                  readOnly
                  className="input flex-1 bg-charcoal/60"
                />
                <input
                  type="number"
                  value={attack.attackBonus}
                  readOnly
                  className="input w-20 text-center bg-charcoal/60"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={attack.damageType}
                  readOnly
                  className="input flex-1 bg-charcoal/60"
                />
                {attack.sneakAttack && (
                  <span className="text-xs font-medium text-gold bg-gold/10 px-2 py-1 rounded">
                    +{attack.sneakAttack} sneak
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-parchment/50 mt-3">Attacks are automatically generated from equipped weapons.</p>
    </SectionCard>
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
