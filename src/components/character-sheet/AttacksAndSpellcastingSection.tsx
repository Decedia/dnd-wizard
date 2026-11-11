"use client";

import { getWeaponAttackDetails as weaponAttackDetails, isRaging } from "@/lib/weapon-attacks";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import type { Character } from "@/lib/storage";
import { getSneakAttackDice, getModifier, getProficiencyBonus } from "@/lib/storage";
import { useDerivedStats } from "@/lib/useCharacterStats";
import { SwordIcon as Sword } from "@/components/icons";
import { DamageBadge } from "./DamageBadge";
import { ConditionBadges } from "./ConditionBadge";
import { useLanguage } from "@/contexts/LanguageContext";
import { ItemIcon } from "@/components/ItemIcon";
import { rowText } from "@/lib/inventory";
import { Overridable } from "./Overridable";
import { useDice } from "@/contexts/DiceContext";
import { d20Group, damageGroup, type RollGroup } from "@/lib/dice-roll";
import { rollGroups } from "@/components/dice/roll-flow";


interface AttacksAndSpellcastingSectionProps {
  character: Character;
  onChange: (patch: Partial<Character>) => void;
  editMode?: boolean;
}

export function AttacksAndSpellcastingSection({ character, onChange, editMode = true }: AttacksAndSpellcastingSectionProps) {
  const { onFieldBlur } = useCharacterSheet();
  const { t, language } = useLanguage();
  const dice = useDice();
  const sneakAttack = getSneakAttackDice(character);
  const classAttacks = character.attacks.filter((a) => a.source === "class");
  const weaponAttacks = character.attacks.filter((a) => a.source === "weapon");
  const profBonus = getProficiencyBonus(character.level);
  const derived = useDerivedStats(character);
  const rageDamage = derived.rageDamage || 0;
  const isBarbarian = character.class === "Barbarian";
  const isPaladin = character.class === "Paladin";

  const getWeaponAttackDetails = (attack: Character["attacks"][number]) => weaponAttackDetails(character, attack, rageDamage || undefined);

  return (
    <SectionCard id="attacks" title={t("section.attacks")} icon={<Sword className="h-5 w-5" />}>
      {character.class === "Rogue" && sneakAttack && (
        <div className="mb-4 surface bg-paper-muted px-4 py-3">
          <span className="text-sm font-bold text-ink">Sneak Attack: {sneakAttack}</span>
        </div>
      )}
      {isBarbarian && rageDamage > 0 && (
        <div className="mb-4 surface bg-paper-muted px-4 py-3">
          <span className="text-sm font-bold text-ink">{t("attacks.rageDamage", { n: rageDamage }, "Rage Damage: +{n}")}</span>
          {!isRaging(character) && <span className="mt-0.5 block text-xs text-[var(--color-text-muted)]">{t("attacks.rageOnlyWhileRaging", "Added to Strength weapon damage only while raging.")}</span>}
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
                <DamageBadge type={attack.damageType} size="sm" />
                {attack.sneakAttack && (
                    <span className="text-xs font-bold text-ink bg-paper-muted px-2.5 py-1.5 surface">+{attack.sneakAttack} sneak</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {weaponAttacks.length === 0 && classAttacks.length === 0 ? (
         <p className="text-sm text-[var(--color-text-secondary)] font-medium">{t("attacks.equipWeapons")}</p>
      ) : (
        <div className="space-y-3">
          {weaponAttacks.map((attack) => {
            const details = getWeaponAttackDetails(attack);
            return (
              <div key={attack.id} className="list-row">
                <div className="flex items-center gap-3">
                  {details && <ItemIcon icon={details.weapon.icon} item={details.weapon.itemId ?? details.weapon.name} className="h-8 w-8 shrink-0" />}
                  <span className="text-base font-bold text-[var(--color-text-primary)] flex-1">{details ? rowText(details.weapon, language).name : attack.name}</span>
                  {details && (
                    <span className="text-sm font-bold text-ink bg-paper px-3 py-1.5 surface">
                      <Overridable id={`attack:${details.weapon.id}`} label={t("override.toHit", { name: rowText(details.weapon, language).name }, "{name} to hit")} signed editMode={editMode} roll={details.attackBonus} rollParts={details.attackParts}>
                        +{details.attackBonus}
                      </Overridable>{" "}
                      to hit ({details.abilityKey.toUpperCase()})
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  {details && (
                    <>
                      <div className="flex items-center gap-2 flex-wrap">
                        <DamageBadge type={details.damageType} size="sm" />
                        {details.damageDice && (
                          <span className="text-[10px] font-bold text-[var(--color-text-primary)] bg-[var(--color-bg)] px-1.5 py-0.5 rounded border border-[var(--color-border)]">
                            {details.damageDice}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-[var(--color-info-600)] bg-[var(--color-info-50)] px-1.5 py-0.5 rounded">
                          +{details.damageBonus}
                        </span>
                      </div>
                      <span className="text-sm text-[var(--color-text-secondary)] font-medium">({details.abilityKey.toUpperCase()} modifier)</span>
                      {dice && !editMode && details.damageDice && (() => {
                        const name = rowText(details.weapon, language).name;
                        const damage = damageGroup(t("dice.damage", "Damage"), details.damageDice, details.damageParts);
                        const groups = [d20Group(t("dice.toHit", "To hit"), details.attackBonus, details.attackParts), damage].filter((g): g is RollGroup => !!g);
                        return (
                          <div className="flex gap-2 pt-1">
                            <button type="button" onClick={() => rollGroups(dice, { hit: t("swing.result.hit", "Hit"), crit: t("swing.result.crit", "Crit"), miss: t("swing.result.miss", "Miss"), me: t("dice.healMe", "Heal me"), other: t("dice.healOther", "Someone else"), heal: t("dice.heal", "Healing") }, name, groups)} className="btn btn-primary !px-3 !py-1.5 text-xs">
                              {t("dice.rollAttack", "Roll attack")}
                            </button>
                            {damage && (
                              <button type="button" onClick={() => rollGroups(dice, { hit: t("swing.result.hit", "Hit"), crit: t("swing.result.crit", "Crit"), miss: t("swing.result.miss", "Miss"), me: t("dice.healMe", "Heal me"), other: t("dice.healOther", "Someone else"), heal: t("dice.heal", "Healing") }, name, [damage])} className="btn btn-secondary !px-3 !py-1.5 text-xs">
                                {t("dice.rollDamage", "Roll damage")}
                              </button>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  )}
                    {!details && attack.damageType && (
                    <DamageBadge type={attack.damageType} size="sm" />
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
        <p className="text-xs text-[var(--color-text-muted)] font-medium mt-4">{t("attacks.autoGenerated")}</p>
    </SectionCard>
  );
}
