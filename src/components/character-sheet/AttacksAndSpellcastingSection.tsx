"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import type { Character } from "@/lib/storage";
import { getSneakAttackDice, getModifier, getProficiencyBonus } from "@/lib/storage";

interface AttacksAndSpellcastingSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function AttacksAndSpellcastingSection({ character, onChange }: AttacksAndSpellcastingSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const sneakAttack = getSneakAttackDice(character);
  const classAttacks = character.attacks.filter((a) => a.source === "class");
  const weaponAttacks = character.attacks.filter((a) => a.source === "weapon");
  const profBonus = getProficiencyBonus(character.level);

  const getWeaponAttackDetails = (attack: Character["attacks"][number]) => {
    const weapon = character.inventory.find((i) => i.id === attack.id);
    if (!weapon || weapon.itemType !== "weapon") return null;
    const abilityKey = weapon.category === "ranged" ? "dex" : "str";
    const abilityMod = getModifier(character[abilityKey as keyof Character] as number);
    const attackBonus = abilityMod + profBonus;
    const damageBonus = abilityMod;
    const damageDice = weapon.damageDice || "";
    const damageTypeName = weapon.damageType || "";
    const damageText = [damageDice, damageBonus >= 0 ? `+${damageBonus}` : `${damageBonus}`, damageTypeName].filter(Boolean).join(" ");
    return {
      attackBonus,
      damageText,
      abilityKey,
      abilityMod,
    };
  };

  return (
    <SectionCard id="attacks" title="Attacks & Spellcasting" icon={<AttacksIcon className="h-5 w-5" />}>
      {character.class === "Rogue" && sneakAttack && (
        <div className="mb-4 rounded-lg border border-gold/30 bg-gold/10 px-4 py-3">
          <span className="text-sm font-semibold text-gold">Sneak Attack: {sneakAttack}</span>
        </div>
      )}
      {classAttacks.length > 0 && (
        <div className="mb-4 space-y-3">
          {classAttacks.map((attack) => (
            <div key={attack.id} className="flex flex-col gap-3 rounded-lg border border-gold/30 bg-gold/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="text-base font-semibold text-gold/90 flex-1">{attack.name}</span>
                <span className="text-[10px] font-bold text-gold bg-gold/20 px-2 py-1 rounded uppercase tracking-wider">class-granted</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-parchment/70">{attack.damageType}</span>
                {attack.sneakAttack && (
                  <span className="text-xs font-bold text-gold bg-gold/20 px-2.5 py-1.5 rounded">+{attack.sneakAttack} sneak</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {weaponAttacks.length === 0 && classAttacks.length === 0 ? (
        <p className="text-sm text-parchment/50">Equip weapons in Inventory to auto-populate attacks.</p>
      ) : (
        weaponAttacks.length > 0 && (
          <div className="space-y-3">
            {weaponAttacks.map((attack) => {
              const details = getWeaponAttackDetails(attack);
              return (
              <div key={attack.id} className="flex flex-col gap-3 rounded-lg border border-parchment/15 bg-charcoal/40 px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="text-base font-semibold text-parchment/90 flex-1">{attack.name}</span>
                  {details && (
                    <span className="text-sm font-bold text-gold bg-gold/15 border border-gold/30 px-3 py-1.5 rounded-lg shadow-sm">
                      +{details.attackBonus} to hit
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {details && (
                    <span className="text-sm text-parchment/80 font-medium">{details.damageText}</span>
                  )}
                  {!details && attack.damageType && (
                    <span className="text-sm text-parchment/80 font-medium">{attack.damageType}</span>
                  )}
                  {attack.sneakAttack && (
                    <span className="text-xs font-bold text-burgundy bg-burgundy/15 border border-burgundy/25 px-2.5 py-1.5 rounded-lg">
                      +{attack.sneakAttack} sneak
                    </span>
                  )}
                </div>
                {attack.description && (
                  <p className="text-xs text-parchment/50 mt-1">{attack.description}</p>
                )}
              </div>
              );
            })}
          </div>
        )
      )}
      <p className="text-xs text-parchment/50 mt-4">Attacks are automatically generated from equipped weapons and class features.</p>
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
