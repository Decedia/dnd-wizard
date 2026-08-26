"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import type { Character } from "@/lib/storage";
import { getSneakAttackDice, getModifier, getProficiencyBonus } from "@/lib/storage";
import { Sword } from "phosphor-react";

interface AttacksAndSpellcastingSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
  editMode?: boolean;
}

export function AttacksAndSpellcastingSection({ character, onChange, editMode = true }: AttacksAndSpellcastingSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const sneakAttack = getSneakAttackDice(character);
  const classAttacks = character.attacks.filter((a) => a.source === "class");
  const weaponAttacks = character.attacks.filter((a) => a.source === "weapon");
  const profBonus = getProficiencyBonus(character.level);

  const getWeaponAttackDetails = (attack: Character["attacks"][number]) => {
    const weapon = character.inventory.find((i) => i.id === attack.id);
    if (!weapon || weapon.itemType !== "weapon") return null;
    const isFinesseOrRanged = weapon.category === "ranged" || weapon.name === "Dagger" || weapon.name === "Rapier" || weapon.name === "Shortsword";
    let abilityKey: "str" | "dex";
    if (isFinesseOrRanged) {
      const strMod = getModifier(character.str);
      const dexMod = getModifier(character.dex);
      abilityKey = dexMod >= strMod ? "dex" : "str";
    } else {
      abilityKey = weapon.category === "ranged" ? "dex" : "str";
    }
    const abilityMod = getModifier(character[abilityKey] as number);
    const attackBonus = abilityMod + profBonus;
    const damageBonus = abilityMod;
    const damageDice = weapon.damageDice || "";
    const damageTypeName = weapon.damageType || "";
    const strMod = getModifier(character.str);
    const dexMod = getModifier(character.dex);
    return {
      attackBonus,
      damageDice,
      damageBonus,
      damageType: damageTypeName,
      abilityKey,
      abilityMod,
      isFinesseOrRanged,
      strMod,
      dexMod,
    };
  };

  return (
    <SectionCard id="attacks" title="ATTACKS" icon={<Sword weight="regular" className="h-5 w-5" />}>
      {character.class === "Rogue" && sneakAttack && (
        <div className="mb-4 surface bg-paper-muted px-4 py-3">
          <span className="text-sm font-bold text-ink">Sneak Attack: {sneakAttack}</span>
        </div>
      )}
      {classAttacks.length > 0 && (
        <div className="mb-4 space-y-3">
          {classAttacks.map((attack) => (
            <div key={attack.id} className="card bg-paper-muted px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="text-base font-bold text-ink flex-1">{attack.name}</span>
                <span className="badge text-ink bg-paper-muted">class-granted</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-ink">{attack.damageType}</span>
                {attack.sneakAttack && (
                    <span className="text-xs font-bold text-ink bg-paper-muted px-2.5 py-1.5 surface">+{attack.sneakAttack} sneak</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {weaponAttacks.length === 0 && classAttacks.length === 0 ? (
        <p className="text-sm text-[var(--color-text-secondary)] font-medium">Equip weapons in Inventory to auto-populate attacks.</p>
      ) : (
        <div className="space-y-3">
          {weaponAttacks.map((attack) => {
            const details = getWeaponAttackDetails(attack);
            return (
              <div key={attack.id} className="list-row">
                <div className="flex items-center gap-3">
                  <span className="text-base font-bold text-[var(--color-text-primary)] flex-1">{attack.name}</span>
                  {details && (
                    <span className="text-sm font-bold text-ink bg-paper px-3 py-1.5 surface">
                      +{details.attackBonus} to hit ({details.abilityKey.toUpperCase()})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  {details && (
                    <>
                      <span className="text-sm text-[var(--color-text-primary)]">
                        {details.damageDice || "—"}
                        {details.damageBonus ? ` +${details.damageBonus}` : ""}
                      </span>
                      <span className="text-sm text-[var(--color-text-secondary)] font-medium">({details.abilityKey.toUpperCase()} modifier)</span>
                      <span className="text-sm text-[var(--color-text-secondary)] font-medium">{details.damageType}</span>
                    </>
                  )}
                    {!details && attack.damageType && (
                    <span className="text-sm text-[var(--color-text-primary)] font-bold">{attack.damageType}</span>
                  )}
                  {attack.sneakAttack && (
                    <span className="text-xs font-bold text-ink bg-paper px-2.5 py-1.5 surface">
                      +{attack.sneakAttack} sneak
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <p className="text-xs text-paper-muted font-medium mt-4">Attacks are automatically generated from equipped weapons and class features.</p>
    </SectionCard>
  );
}
