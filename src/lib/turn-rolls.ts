import { d20Group, damageGroup, partsFor, spellDamageGroups, type RollGroup } from "@/lib/dice-roll";
import type { TurnOption } from "@/lib/turn";

/** Words for the group labels, in the player's language. */
export interface RollLabels {
  toHit: string;
  damage: string;
  heal: string;
}

/**
 * What a turn option rolls in the dice tray: to hit, damage, a spell's
 * attack and damage, healing, or a feature's dice. Each bonus keeps its source.
 */
export function optionRollGroups(o: TurnOption, name: string, labels: RollLabels): RollGroup[] {
  const out: (RollGroup | null)[] = [];
  if (o.spellAttack !== undefined) out.push(d20Group(labels.toHit, o.spellAttack, o.spellAttackParts));
  else if (o.toHit !== undefined) out.push(d20Group(labels.toHit, o.toHit, o.toHitParts));
  if (o.damageRoll) out.push(damageGroup(`${labels.damage}${o.damageRoll.type ? ` ${o.damageRoll.type}` : ""}`, o.damageRoll.dice, o.damageRoll.parts));
  if (o.spellDamage) out.push(...spellDamageGroups(o.spellDamage, labels.damage, name));
  if (o.heal?.dice && !o.heal.maxDice) out.push(damageGroup(labels.heal, o.heal.dice, partsFor(o.heal.bonus, o.heal.parts)));
  if (o.featureDice) out.push(damageGroup(name, o.featureDice));
  return out.filter((g): g is RollGroup => !!g);
}
