/**
 * Character origin under the 2024 rules (SRD 5.2): the background gives the
 * ability increases (+2/+1 or +1/+1/+1 among its three abilities) and an
 * Origin feat, the species gives traits only, and gear comes in set packages
 * or gold. Picks are kept in featureSelections under the keys below.
 */
import { activeRaceChoices, getStaticBackgrounds2024, getStaticRace, lineageChoiceOf, type SRDBackground2024 } from "./srd-client";
import { getFeatOptionGroups } from "@/data/feat-options";
import { BACKGROUND_GEAR_2024, CLASS_GEAR_2024, type GearPackage } from "@/data/starting-gear-2024";
import { addRows, backgroundGearRows, expandToRows } from "./inventory";
import { applyFeatGrants, decodeFeatOptions, encodeFeatOptions } from "./feat-grants";
import type { Character } from "./storage";
import { getBackgroundData } from "@/data/backgrounds";

export const ORIGIN_FEAT_KEY = { background: "origin-feat-background", species: "origin-feat-species" } as const;
export type OriginFeatSource = keyof typeof ORIGIN_FEAT_KEY;
const GEAR_KEY = { class: "gear-2024-class", background: "gear-2024-background" } as const;
export type GearKind = keyof typeof GEAR_KEY;
/** The Soldier's gaming set (the one tool a 2024 background lets the player pick). */
export const BACKGROUND_TOOL_KEY = "background-tool-2024";

export function is2024(character: Pick<Character, "ruleset"> | null | undefined): boolean {
  return character?.ruleset === "2024";
}

export function getBackground2024(name: string | undefined, locale = "en"): SRDBackground2024 | undefined {
  return name ? getStaticBackgrounds2024(locale).find((b) => b.name === name) : undefined;
}

/** The skills a character's background gives, from the rule set's own background list. */
export function backgroundSkillsOf(character: Pick<Character, "ruleset" | "background">): string[] {
  if (is2024(character)) return getBackground2024(character.background)?.skills || [];
  return getBackgroundData(character.background)?.skillProficiencies || [];
}

/** Languages a background lets the player pick: 2014 only (2024 languages come with the species). */
export function backgroundLanguageCount(character: Pick<Character, "ruleset" | "background">): number {
  return is2024(character) ? 0 : getBackgroundData(character.background)?.languages || 0;
}

/** "Magic Initiate (Cleric)" is Magic Initiate with the Cleric list already chosen. */
export function parseOriginFeat(text: string): { name: string; fixed: Record<string, string> } {
  const m = text.match(/^(.*?)\s*\((\w+)\)$/);
  if (m && m[1] === "Magic Initiate") return { name: m[1], fixed: { spell_class: m[2].toLowerCase() } };
  return { name: text, fixed: {} };
}

export interface OriginFeat {
  source: OriginFeatSource;
  key: string;
  /** Empty while the player still has to choose the feat (Human Versatile). */
  name: string;
  options: Record<string, string>;
  /** Picks the background made already (Magic Initiate's spell list). */
  fixed: Record<string, string>;
}

/** The Origin feats the character gets: the background's, and a Human's Versatile pick. */
export function originFeats(character: Pick<Character, "ruleset" | "background" | "race" | "featureSelections">): OriginFeat[] {
  if (!is2024(character)) return [];
  const out: OriginFeat[] = [];
  const selections = character.featureSelections || {};
  const bg = getBackground2024(character.background);
  if (bg) {
    const { name, fixed } = parseOriginFeat(bg.feat);
    out.push({ source: "background", key: ORIGIN_FEAT_KEY.background, name, fixed, options: { ...decodeFeatOptions(selections[`${ORIGIN_FEAT_KEY.background}-options`]), ...fixed } });
  }
  const species = character.race ? getStaticRace(character.race, "2024") : undefined;
  if (species?.originFeat) {
    const key = ORIGIN_FEAT_KEY.species;
    out.push({ source: "species", key, name: selections[key]?.[0] || "", fixed: {}, options: decodeFeatOptions(selections[`${key}-options`]) });
  }
  return out;
}

/** Whether the feat is chosen and every pick it asks for (spells, skills) is made. */
export function originFeatComplete(feat: OriginFeat): boolean {
  if (!feat.name) return false;
  return getFeatOptionGroups(feat.name, "2024").every((g) => !!feat.options[g.id]);
}

/** featureSelections patch saving one Origin feat and its picks. */
export function originFeatPatch(character: Pick<Character, "featureSelections">, feat: OriginFeat, name: string, options: Record<string, string>): Partial<Character> {
  return {
    featureSelections: {
      ...character.featureSelections,
      [feat.key]: name ? [name] : [],
      [`${feat.key}-options`]: encodeFeatOptions({ ...options, ...feat.fixed }),
    },
  };
}

const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"];

/** Whether the background's increase is placed legally: +2/+1 or +1/+1/+1 among its three abilities. */
export function backgroundAsiValid(character: Pick<Character, "background" | "flexAsi">): boolean {
  const bg = getBackground2024(character.background);
  if (!bg) return false;
  const placed = Object.entries(character.flexAsi || {}).filter(([, v]) => v > 0);
  if (placed.some(([k]) => !bg.abilityScores.includes(k))) return false;
  const values = placed.map(([, v]) => v).sort((a, b) => b - a).join(",");
  return values === "2,1" || values === "1,1,1";
}

/** The background increase as { ability: amount }, once it is placed legally. */
export function backgroundAsi(character: Pick<Character, "ruleset" | "background" | "flexAsi">): Record<string, number> {
  if (!is2024(character) || !backgroundAsiValid(character)) return {};
  return Object.fromEntries(Object.entries(character.flexAsi || {}).filter(([k, v]) => v > 0 && ABILITIES.includes(k)));
}

/** Whether every species question (lineage, spellcasting ability, size) has an answer. */
export function speciesChoicesComplete(character: Pick<Character, "race" | "raceChoices">): boolean {
  const species = character.race ? getStaticRace(character.race, "2024") : undefined;
  if (!species) return false;
  return activeRaceChoices(species.choices, character.raceChoices).every((c) => !!character.raceChoices?.[c.id]);
}

/** The chosen lineage option (Drow, Infernal), with its spells, speed and darkvision. */
export function chosenLineage(character: Pick<Character, "race" | "raceChoices" | "ruleset">) {
  if (!is2024(character) || !character.race) return undefined;
  const choice = lineageChoiceOf(getStaticRace(character.race, "2024"));
  if (!choice) return undefined;
  return choice.options?.find((o) => o.id === character.raceChoices?.[choice.id]);
}

const upTo = (table: Record<string, string[]> | undefined, level: number) =>
  Object.entries(table || {}).flatMap(([lvl, names]) => (Number(lvl) <= level ? names : []));

/** Spells a 2024 species gives by character level: its lineage's, plus Thaumaturgy for a Tiefling. */
export function speciesSpells2024(character: Pick<Character, "race" | "raceChoices" | "ruleset" | "level">): string[] {
  if (!is2024(character) || !character.race) return [];
  const level = character.level || 1;
  const species = getStaticRace(character.race, "2024");
  return [...upTo(species?.spells, level), ...upTo(chosenLineage(character)?.spells, level)];
}

/** The 2024 background picked: its skills and fixed tools, with the old one's taken back. */
export function applyBackground2024(data: Character, name: string): Partial<Character> {
  const old = getBackground2024(data.background);
  const bg = getBackground2024(name);
  const skills = { ...data.skills };
  for (const s of old?.skills || []) delete skills[s];
  for (const s of bg?.skills || []) skills[s] = true;
  const selections = { ...data.featureSelections };
  for (const key of [ORIGIN_FEAT_KEY.background, `${ORIGIN_FEAT_KEY.background}-options`, GEAR_KEY.background, BACKGROUND_TOOL_KEY]) delete selections[key];
  const patch: Partial<Character> = {
    background: name,
    skills,
    toolProficiencies: bg?.tools || [],
    featureSelections: selections,
    inventory: (data.inventory || []).filter((r) => !r.grantedFrom?.startsWith("background:")),
  };
  if (old?.name !== bg?.name) patch.flexAsi = {};
  if (bg) {
    const { name: feat, fixed } = parseOriginFeat(bg.feat);
    selections[ORIGIN_FEAT_KEY.background] = [feat];
    selections[`${ORIGIN_FEAT_KEY.background}-options`] = encodeFeatOptions(fixed);
  }
  return patch;
}

export function gearPackages(kind: GearKind, name: string | undefined): GearPackage[] {
  if (!name) return [];
  return (kind === "class" ? CLASS_GEAR_2024 : BACKGROUND_GEAR_2024)[name] || [];
}

export function pickedGear(character: Pick<Character, "featureSelections">, kind: GearKind): string | undefined {
  return character.featureSelections?.[GEAR_KEY[kind]]?.[0];
}

const gearSource = (kind: GearKind, name: string) => (kind === "class" ? `class2024:${name}` : `background:${name}`);

/** Swaps in one package: its items and gold replace whatever the last pick of that kind added. */
export function pickGearPatch(data: Character, kind: GearKind, letter: string): Partial<Character> {
  const name = kind === "class" ? data.class : data.background;
  const pkg = gearPackages(kind, name).find((p) => p.letter === letter);
  const from = gearSource(kind, name);
  let inventory = (data.inventory || []).filter((r) => r.grantedFrom !== from);
  if (pkg) {
    for (const line of pkg.items) inventory = addRows(inventory, backgroundGearRows(line, from));
    if (pkg.gold > 0) inventory = addRows(inventory, expandToRows("gp", pkg.gold, { isGranted: true, grantedFrom: from }));
  }
  return { inventory, featureSelections: { ...data.featureSelections, [GEAR_KEY[kind]]: pkg ? [letter] : [] } };
}

/** Both gear picks are made (a background without packages needs none). */
export function gear2024Complete(character: Pick<Character, "class" | "background" | "featureSelections">): boolean {
  const done = (kind: GearKind, name: string) => gearPackages(kind, name).length === 0 || !!pickedGear(character, kind);
  return done("class", character.class) && done("background", character.background);
}

/** Every Origin step answer for 2024: species questions, background, its feat and picks, and the Human's feat. */
export function origin2024Complete(character: Character): boolean {
  if (!character.class || !character.race || !getBackground2024(character.background)) return false;
  if (!speciesChoicesComplete(character)) return false;
  if (getBackground2024(character.background)?.toolChoice && !character.featureSelections?.[BACKGROUND_TOOL_KEY]?.[0]) return false;
  return originFeats(character).every(originFeatComplete);
}

/**
 * At the end of creation: the Origin feats' grants (spells, skills, tools) and
 * the Soldier's gaming set. Ability increases from the background are added
 * with the race ones (getRaceAsi); the feat rows come from syncBaseFeatures.
 */
export function applyOrigin2024(character: Character): Character {
  if (!is2024(character)) return character;
  let out = character;
  const tool = character.featureSelections?.[BACKGROUND_TOOL_KEY]?.[0];
  if (tool && !(out.toolProficiencies || []).includes(tool)) out = { ...out, toolProficiencies: [...(out.toolProficiencies || []), tool] };
  for (const feat of originFeats(character)) {
    if (feat.name) out = applyFeatGrants(out, feat.name, feat.options);
  }
  return out;
}

/** What a 2024 level 1 order pick trains you in (Protector, Warden). */
const ORDER_TRAINING: Record<string, string[]> = {
  Protector: ["Martial Weapons", "Heavy Armor"],
  Warden: ["Martial Weapons", "Medium Armor"],
};

/** Adds the weapon and armor training of a Divine Order or Primal Order pick. Safe to repeat. */
export function applyClassChoices2024(character: Character): Character {
  if (!is2024(character)) return character;
  const picks = ["Divine Order", "Primal Order"].map((name) => character.featureSelections?.[`class-feature-1-${name}`]?.[0]).filter(Boolean) as string[];
  const add = picks.flatMap((p) => ORDER_TRAINING[p] || []);
  if (add.length === 0) return character;
  const other = (character.otherProficiencies || "").split(/,\s*/).filter(Boolean);
  for (const a of add) if (!other.includes(a)) other.push(a);
  return { ...character, otherProficiencies: other.join(", ") };
}
