import { getModifier, type Character } from "@/lib/storage";

/**
 * Class features that add an ability modifier to a spell's damage. The app shows the
 * spell's dice as rules text; these bonuses come on top and are easy to forget.
 */

type Ability = "str" | "dex" | "con" | "int" | "wis" | "cha";

export interface SpellForBonus {
  name: string;
  level: number;
  school?: string;
  classes?: string[];
  damageType?: string;
  description?: string | string[];
}

export interface SpellDamageBonus {
  /** The feature that grants it, as the player sees it on the sheet. */
  source: string;
  ability: Ability;
  value: number;
  /** "roll": once per casting, on one damage roll. "beam": on every beam (Agonizing Blast).
   *  "heal" and "maxDice": healing bonuses (Disciple of Life, Supreme Healing), see healing.ts. */
  per: "roll" | "beam" | "heal" | "maxDice";
}

const DAMAGE_TYPES = ["acid", "cold", "fire", "force", "lightning", "necrotic", "poison", "psychic", "radiant", "thunder"];

const textOf = (spell: SpellForBonus) => (Array.isArray(spell.description) ? spell.description.join(" ") : spell.description || "");

/** True when the spell rolls dice for damage (some spell data has no damage field, so read the text too). */
export function dealsDamage(spell: SpellForBonus): boolean {
  if (spell.damageType) return true;
  return /\b\d+d\d+\b[^.]*?\bdamage\b/i.test(textOf(spell));
}

/** Damage types the spell can deal, from its data and its text. */
export function damageTypesOf(spell: SpellForBonus): string[] {
  const text = textOf(spell).toLowerCase();
  const types = new Set<string>();
  if (spell.damageType) types.add(spell.damageType.toLowerCase());
  for (const type of DAMAGE_TYPES) if (new RegExp(`\\b${type}\\b`).test(text)) types.add(type);
  return [...types];
}

/** Every feature name and pick the character has (features, invocations, subclass choices). */
function ownedNames(character: Character): string[] {
  return [
    ...(character.features || []).map((f) => f.name || ""),
    ...Object.values(character.featureSelections || {}).flat(),
  ];
}

const has = (names: string[], name: string) => names.some((n) => n === name || n.startsWith(`${name} (`) || n.endsWith(`: ${name}`));

/** The damage type of a Draconic Bloodline sorcerer's dragon ancestor ("Dragon Ancestor: Red - Fire Damage"). */
export function dragonAncestorType(character: Character): string | null {
  for (const pick of Object.values(character.featureSelections || {}).flat()) {
    const match = /^Dragon Ancestor: .* - (\w+) Damage$/.exec(pick);
    if (match) return match[1].toLowerCase();
  }
  return null;
}

const onClassList = (spell: SpellForBonus, className: string) => (spell.classes || []).includes(className);

/** Bonuses a character adds to this spell's damage. Empty for spells that deal no damage. */
export function spellDamageBonuses(character: Character, spell: SpellForBonus): SpellDamageBonus[] {
  if (!dealsDamage(spell)) return [];
  const names = ownedNames(character);
  const out: SpellDamageBonus[] = [];
  const add = (source: string, ability: Ability, per: SpellDamageBonus["per"] = "roll") =>
    out.push({ source, ability, value: getModifier(character[ability] ?? 10), per });

  // Wizard, School of Evocation, level 10: a wizard evocation spell adds INT to one damage roll.
  if (has(names, "Empowered Evocation") && spell.school === "Evocation" && onClassList(spell, "Wizard")) add("Empowered Evocation", "int");
  // Warlock invocation: CHA on every Eldritch Blast beam.
  if (has(names, "Agonizing Blast") && spell.name === "Eldritch Blast") add("Agonizing Blast", "cha", "beam");
  // Cleric domains, level 8: WIS on cleric cantrip damage.
  if (has(names, "Potent Spellcasting") && spell.level === 0 && onClassList(spell, "Cleric")) add("Potent Spellcasting", "wis");
  // Sorcerer, Draconic Bloodline, level 6: CHA on one roll of a spell of the ancestor's damage type.
  const ancestor = character.class === "Sorcerer" && has(names, "Elemental Affinity") ? dragonAncestorType(character) : null;
  if (ancestor && damageTypesOf(spell).includes(ancestor)) add("Elemental Affinity", "cha");
  // Warlock, The Celestial, level 6: CHA on one radiant or fire damage roll.
  // (Aasimar also has a racial "Radiant Soul" that does something else, so check the class.)
  if (character.class === "Warlock" && has(names, "Radiant Soul") && damageTypesOf(spell).some((t) => t === "radiant" || t === "fire")) add("Radiant Soul", "cha");

  return out.filter((b) => b.value !== 0);
}
