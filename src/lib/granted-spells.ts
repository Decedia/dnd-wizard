import { RACE_SPELLS } from "@/data/race-spells";
import { getOptionalClassFeatures } from "@/data/optional-class-features";
import { getCircleSpells, getDomainSpells, getOathSpells, getStaticRaceDetails, getStaticSpells, getStaticSubclasses, getSubclassSpellGrants } from "./srd-client";
import { normalizeDescription } from "./level-up";
import type { Character } from "./storage";

type SpellOwner = Pick<Character, "class" | "subclass" | "level" | "race" | "raceChoices" | "sources" | "ruleset" | "circleTerrain" | "optionalClassFeatures">;

const upTo = (table: Record<string | number, string[]> | undefined, level: number) =>
  Object.entries(table || {}).flatMap(([lvl, names]) => (Number(lvl) <= level ? names : []));

/**
 * Every spell the character has for free at their level: domain, oath and
 * other subclass spells, Circle of the Land terrain spells, racial spells and
 * Tasha's Primal Awareness. These are always prepared and don't count against
 * spells known.
 */
export function getGrantedSpellNames(character: SpellOwner): string[] {
  const level = character.level || 1;
  const names: string[] = [];
  if (character.subclass && character.class) {
    const index = getStaticSubclasses(character.class, [], character.ruleset).find(
      (s) => s.name.toLowerCase() === character.subclass!.toLowerCase()
    )?.index;
    if (index) {
      if (character.class === "Cleric") names.push(...getDomainSpells(index, level));
      if (character.class === "Paladin") names.push(...getOathSpells(index, level));
      names.push(...getSubclassSpellGrants(index, level));
    }
  }
  if (character.class === "Druid" && character.circleTerrain) names.push(...getCircleSpells(character.circleTerrain, level));
  names.push(...upTo(RACE_SPELLS[character.race], level));
  // A cantrip the race lets the player pick (High Elf).
  for (const choice of getStaticRaceDetails(character.race, character.sources)?.choices || []) {
    if (!choice.spellList) continue;
    const picked = choice.options?.find((o) => o.id === character.raceChoices?.[choice.id]);
    if (picked) names.push(picked.name);
  }
  for (const f of getOptionalClassFeatures(character)) names.push(...upTo(f.spells, level));
  const seen = new Set<string>();
  return names.filter((n) => !seen.has(n.toLowerCase()) && !!seen.add(n.toLowerCase()));
}

/** Adds the named spells the character doesn't have yet. Cantrips go in both lists. */
export function grantSpells(character: Character, names: string[]): Character {
  if (names.length === 0) return character;
  const spells = [...(character.spells || [])];
  const cantrips = [...(character.cantrips || [])];
  const has = (list: { name?: string }[], name: string) => list.some((s) => s.name?.toLowerCase() === name.toLowerCase());
  const owned = getStaticSpells(character.sources, character.ruleset);
  let all: ReturnType<typeof getStaticSpells> | null = null;
  for (const name of names) {
    // A racial spell can come from a book the table didn't pick; look it up anyway.
    const spell =
      owned.find((s) => s.name?.toLowerCase() === name.toLowerCase()) ||
      (all ??= getStaticSpells([], character.ruleset)).find((s) => s.name?.toLowerCase() === name.toLowerCase());
    if (!spell) continue;
    const level = spell.level ?? 0;
    if (!has(spells, spell.name)) {
      spells.push({
        id: `spell-${spell.name}-${level}`.replace(/\s+/g, "-"),
        name: spell.name,
        level,
        source: "srd",
        srdSpellName: spell.name,
        description: normalizeDescription(spell.description),
      } as Character["spells"][number]);
    }
    if (level === 0 && !has(cantrips, spell.name)) cantrips.push({ id: `cantrip-${spell.name}`.replace(/\s+/g, "-"), name: spell.name });
  }
  return { ...character, spells, cantrips };
}

export function isGrantedSpell(character: SpellOwner, name: string | undefined): boolean {
  if (!name) return false;
  return getGrantedSpellNames(character).some((n) => n.toLowerCase() === name.toLowerCase());
}
