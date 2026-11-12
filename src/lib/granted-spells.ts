import { RACE_SPELLS } from "@/data/race-spells";
import { getOptionalClassFeatures } from "@/data/optional-class-features";
import { activeRaceChoices, getCircleSpells, getDomainSpells, getOathSpells, getStaticRaceDetails, getStaticSpells, getStaticSubclasses, getSubclassSpellGrants } from "./srd-client";
import { normalizeDescription } from "./level-up";
import type { Character } from "./storage";
import { FEAT_FIXED_GRANTS, decodeFeatOptions } from "./feat-grants";
import { getFeatOptionGroups } from "@/data/feat-options";
import { speciesSpells2024 } from "./origin-2024";

type SpellOwner = Pick<Character, "class" | "subclass" | "level" | "race" | "raceChoices" | "featureSelections" | "sources" | "ruleset" | "circleTerrain" | "optionalClassFeatures">;

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
    const subclass = getStaticSubclasses(character.class, [], character.ruleset).find(
      (s) => s.name.toLowerCase() === character.subclass!.toLowerCase()
    );
    const index = subclass?.index;
    // Spells picked through a subclass feature (Arcane Initiate, Divine Magic).
    for (const f of (subclass?.features || []) as any[]) {
      const grants = f.choiceGrants as { mode: string; spells?: Record<string, string> } | undefined;
      if (grants?.mode !== "spell" || (f.level ?? 0) > level) continue;
      const picked = (character.featureSelections?.[`subclass-feature-${f.level}-${f.name}`] || []).flatMap((v) => String(v).split(", ").filter(Boolean));
      names.push(...(grants.spells ? picked.map((p) => grants.spells![p]).filter(Boolean) : picked));
    }
    if (index) {
      if (character.class === "Cleric") names.push(...getDomainSpells(index, level));
      if (character.class === "Paladin") names.push(...getOathSpells(index, level));
      names.push(...getSubclassSpellGrants(index, level));
    }
  }
  if (character.class === "Druid" && character.circleTerrain) names.push(...getCircleSpells(character.circleTerrain, level));
  // RACE_SPELLS is 2014 races; a 2024 species' spells come with its lineage.
  if (character.ruleset === "2024") names.push(...speciesSpells2024(character));
  else names.push(...upTo(RACE_SPELLS[character.race], level));
  // A cantrip the race lets the player pick (High Elf).
  for (const choice of activeRaceChoices(getStaticRaceDetails(character.race, character.sources, character.ruleset)?.choices, character.raceChoices)) {
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
        granted: true,
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

/**
 * Keeps the free spells in step with where they come from: adds what the
 * character now gets, and removes spells marked as given whose source is gone
 * (a lower level, another subclass, race or terrain). A spell the player has
 * that a source now gives is marked, so it goes too if that source is lost.
 */
export function syncGrantedSpells(character: Character): Character {
  const grantedNames = getGrantedSpellNames(character);
  const names = new Set(grantedNames.map((n) => n.toLowerCase()));
  const isLost = (s: Character["spells"][number]) => !!s.granted && !names.has(s.name.toLowerCase());
  const spells = (character.spells || [])
    .filter((s) => !isLost(s))
    .map((s) => (!s.granted && names.has(s.name.toLowerCase()) ? { ...s, granted: true } : s));
  if (spells.length === (character.spells || []).length && spells.every((s, i) => s === character.spells[i])) {
    return grantSpells(character, grantedNames);
  }
  const removed = (character.spells || []).filter(isLost);
  const removedIds = new Set(removed.map((s) => s.id));
  const keptNames = new Set(spells.map((s) => s.name.toLowerCase()));
  const goneNames = new Set(removed.map((s) => s.name.toLowerCase()).filter((n) => !keptNames.has(n)));
  return grantSpells(
    {
      ...character,
      spells,
      cantrips: (character.cantrips || []).filter((c) => !goneNames.has((c.name || "").toLowerCase())),
      preparedSpells: (character.preparedSpells || []).filter((id) => !removedIds.has(id)),
    },
    grantedNames
  );
}

export interface FreeCast {
  name: string;
  /** The rest that gives the cast back. */
  rest: "long" | "short";
}

/** Race and feat spells cast at will, so they have no free cast to track. */
const AT_WILL: Record<string, string[]> = {
  "Yuan-ti Pureblood": ["Animal Friendship"],
  "Drow High Magic": ["Detect Magic"],
  "Svirfneblin Magic": ["Nondetection"],
};
/** Spells whose free cast comes back on a short rest too. */
const SHORT_REST: Record<string, string[]> = {
  Firbolg: ["Detect Magic", "Disguise Self"],
  "Fey Teleportation": ["Misty Step"],
};
/** Feats whose spell picks are not cast free (Ritual Caster casts rituals). */
const NO_FREE_CAST = new Set(["Ritual Caster"]);

/** Feats the character took, with their saved picks. */
function takenFeats(character: Pick<Character, "featureSelections" | "features">): Map<string, Record<string, string>> {
  const selections = character.featureSelections || {};
  const taken = new Map<string, Record<string, string>>();
  for (const [key, values] of Object.entries(selections)) {
    if (!/^asi-feat-\d+$/.test(key) && !/^(variant-human-feat|origin-feat-(background|species))$/.test(key)) continue;
    const name = values?.[0];
    if (name) taken.set(name, { ...taken.get(name), ...decodeFeatOptions(selections[`${key}-options`]) });
  }
  for (const f of character.features || []) {
    if (f.name && FEAT_FIXED_GRANTS[f.name] && !taken.has(f.name)) taken.set(f.name, {});
  }
  return taken;
}

/**
 * Leveled spells a race trait or a feat lets the character cast once without
 * a spell slot, until the next long rest (a short rest for a few). Cantrips
 * and at-will spells are left out.
 */
export function getFreeCastSpells(character: SpellOwner & Pick<Character, "features">): FreeCast[] {
  const level = character.level || 1;
  const out: FreeCast[] = [];
  const add = (name: string, source: string) => {
    if (AT_WILL[source]?.includes(name)) return;
    if (out.some((c) => c.name.toLowerCase() === name.toLowerCase())) return;
    out.push({ name, rest: SHORT_REST[source]?.includes(name) ? "short" : "long" });
  };
  const raceSpells = character.ruleset === "2024" ? speciesSpells2024(character) : upTo(RACE_SPELLS[character.race], level);
  for (const name of raceSpells) add(name, character.race);
  for (const [feat, options] of takenFeats(character)) {
    if (NO_FREE_CAST.has(feat)) continue;
    if (character.ruleset !== "2024") for (const name of FEAT_FIXED_GRANTS[feat]?.spells || []) add(name, feat);
    for (const group of getFeatOptionGroups(feat, character.ruleset)) {
      if (group.type === "spell" && options[group.id]) add(options[group.id], feat);
    }
  }
  const all = getStaticSpells([], character.ruleset);
  return out.filter((c) => (all.find((s) => s.name.toLowerCase() === c.name.toLowerCase())?.level ?? 0) > 0);
}
