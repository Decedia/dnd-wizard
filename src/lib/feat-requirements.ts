// Feat prerequisites, checked by hand against the books (PHB, XGE, TCE, ERLW,
// MTF). Feats not listed have no prerequisite. The `prerequisites` text in the
// feat data is what the player reads; this table is what the picker checks.
import { collectProficiencies } from "@/lib/proficiency";
import { getStaticRace } from "@/lib/srd-client";
import { findCatalogItem } from "@/data/item-catalog";
import type { Character } from "@/lib/storage";

type Ability = "str" | "dex" | "con" | "int" | "wis" | "cha";
type Race = "dragonborn" | "dwarf" | "elf" | "drow" | "highElf" | "woodElf" | "halfElf" | "gnome" | "deepGnome" | "halfling" | "halfOrc" | "human" | "tiefling" | "small";

export interface FeatRequirement {
  /** One of these at 13 or higher (Ritual Caster: INT or WIS). */
  ability?: Ability[];
  /** The character's race must be one of these. */
  race?: Race[];
  armor?: "light" | "medium" | "heavy" | "shield";
  martialWeapon?: boolean;
  spellcasting?: boolean;
}

export const FEAT_REQUIREMENTS: Record<string, FeatRequirement> = {
  "Bountiful Luck": { race: ["halfling"] },
  "Defensive Duelist": { ability: ["dex"] },
  "Dragon Fear": { race: ["dragonborn"] },
  "Dragon Hide": { race: ["dragonborn"] },
  "Drow High Magic": { race: ["drow"] },
  "Dwarven Fortitude": { race: ["dwarf"] },
  "Eldritch Adept": { spellcasting: true },
  "Elemental Adept": { spellcasting: true },
  "Elven Accuracy": { race: ["elf", "halfElf"] },
  "Fade Away": { race: ["gnome"] },
  "Fey Teleportation": { race: ["highElf"] },
  "Fighting Initiate": { martialWeapon: true },
  "Flames of Phlegethos": { race: ["tiefling"] },
  "Grappler": { ability: ["str"] },
  "Heavily Armored": { armor: "medium" },
  "Heavy Armor Master": { armor: "heavy" },
  "Infernal Constitution": { race: ["tiefling"] },
  "Inspiring Leader": { ability: ["cha"] },
  "Medium Armor Master": { armor: "medium" },
  "Metamagic Adept": { spellcasting: true },
  "Moderately Armored": { armor: "light" },
  "Orcish Fury": { race: ["halfOrc"] },
  "Prodigy": { race: ["halfElf", "halfOrc", "human"] },
  "Revenant Blade": { race: ["elf"] },
  "Ritual Caster": { ability: ["int", "wis"] },
  "Second Chance": { race: ["halfling"] },
  "Skulker": { ability: ["dex"] },
  "Spell Sniper": { spellcasting: true },
  "Squat Nimbleness": { race: ["dwarf", "small"] },
  "Svirfneblin Magic": { race: ["deepGnome"] },
  "War Caster": { spellcasting: true },
  "Wood Elf Magic": { race: ["woodElf"] },
};

/**
 * 2024 Player's Handbook feats (Level 4+ is the feat's minLevel). The SRD 5.2
 * Grappler takes Strength or Dexterity; Spellcasting or Pact Magic counts as
 * "able to cast".
 */
export const FEAT_REQUIREMENTS_2024: Record<string, FeatRequirement> = {
  Actor: { ability: ["cha"] },
  Athlete: { ability: ["str", "dex"] },
  Charger: { ability: ["str", "dex"] },
  "Crossbow Expert": { ability: ["dex"] },
  "Defensive Duelist": { ability: ["dex"] },
  "Dual Wielder": { ability: ["str", "dex"] },
  "Elemental Adept": { spellcasting: true },
  Grappler: { ability: ["str", "dex"] },
  "Great Weapon Master": { ability: ["str"] },
  "Heavily Armored": { armor: "medium" },
  "Heavy Armor Master": { armor: "heavy" },
  "Inspiring Leader": { ability: ["wis", "cha"] },
  "Keen Mind": { ability: ["int"] },
  "Medium Armor Master": { armor: "medium" },
  "Moderately Armored": { armor: "light" },
  Observant: { ability: ["int", "wis"] },
  "Polearm Master": { ability: ["str", "dex"] },
  "Ritual Caster": { ability: ["int", "wis", "cha"] },
  Sentinel: { ability: ["str", "dex"] },
  Sharpshooter: { ability: ["dex"] },
  "Shield Master": { armor: "shield" },
  Skulker: { ability: ["dex"] },
  Speedy: { ability: ["dex", "con"] },
  "Spell Sniper": { spellcasting: true },
  "War Caster": { spellcasting: true },
};

const RACE_LABEL: Record<Race, string> = {
  dragonborn: "Dragonborn", dwarf: "Dwarf", elf: "Elf", drow: "Drow", highElf: "High Elf", woodElf: "Wood Elf",
  halfElf: "Half-Elf", gnome: "Gnome", deepGnome: "Deep Gnome", halfling: "Halfling", halfOrc: "Half-Orc",
  human: "Human", tiefling: "Tiefling", small: "Small",
};

/** Elves by the books: the elf subraces plus Eladrin, Sea Elf and Shadar-kai, never a half-elf. */
const ELF = /^(Elf|High Elf|Wood Elf|Drow|Sea Elf|Shadar-kai|Eladrin \(Elf\))$/;

function isRace(character: Pick<Character, "race" | "ruleset">, race: Race): boolean {
  const name = (character.race || "").trim();
  switch (race) {
    case "dragonborn": return /^Dragonborn/.test(name);
    case "dwarf": return /Dwarf$/.test(name) || name === "Duergar";
    case "elf": return ELF.test(name);
    case "drow": return name === "Drow";
    case "highElf": return name === "High Elf";
    case "woodElf": return name === "Wood Elf";
    case "halfElf": return /^Half-Elf/.test(name);
    case "gnome": return /Gnome( \(|$)/.test(name);
    case "deepGnome": return /^Deep Gnome/.test(name);
    case "halfling": return /Halfling$/.test(name);
    case "halfOrc": return name === "Half-Orc";
    case "human": return name === "Human";
    case "tiefling": return /^Tiefling/.test(name);
    case "small": return getStaticRace(name, character.ruleset)?.size === "Small";
  }
}

function canCastSpells(character: Character): boolean {
  if (character.spellcastingAbility) return true;
  if ((character.spells || []).length > 0 || (character.cantrips || []).length > 0) return true;
  return (character.features || []).some((f) => /spellcasting|pact magic/i.test(f.name || ""));
}

function hasMartialWeapon(character: Character): boolean {
  const set = collectProficiencies(character);
  if (set.weaponTiers.has("martial")) return true;
  return [...set.weapons].some((w) => {
    const item = findCatalogItem(w);
    return item?.weapon?.class === "martial";
  });
}

export interface FeatRequirementLine {
  text: string;
  met: boolean;
}

type T = (key: string, fallbackOrParams?: Record<string, string | number> | string, fallback?: string) => string;
const plain: T = (_key, fallbackOrParams, fallback) => {
  const text = typeof fallbackOrParams === "string" ? fallbackOrParams : fallback ?? "";
  const params = typeof fallbackOrParams === "object" ? fallbackOrParams : {};
  return text.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? ""));
};

/** One line per prerequisite, each with whether the character meets it. Empty when the feat has none. */
export function describeFeatRequirements(character: Character, featName: string, t: T = plain): FeatRequirementLine[] {
  const req = (character.ruleset === "2024" ? FEAT_REQUIREMENTS_2024 : FEAT_REQUIREMENTS)[featName];
  if (!req) return [];
  const lines: FeatRequirementLine[] = [];
  if (req.ability) {
    const names = req.ability.map((a) => a.toUpperCase());
    const text = names.length === 1
      ? t("feat.req.abilityMin", { ability: names[0], n: 13 }, "{ability} {n} or higher")
      : names.length === 2
        ? t("feat.req.abilityAny", { a: names[0], b: names[1], n: 13 }, "{a} or {b} {n} or higher")
        : t("feat.req.abilityAny3", { a: names[0], b: names[1], c: names[2], n: 13 }, "{a}, {b} or {c} {n} or higher");
    lines.push({ text, met: req.ability.some((a) => ((character[a] as number | undefined) ?? 0) >= 13) });
  }
  if (req.race) {
    lines.push({
      text: t("feat.req.race", { names: req.race.map((r) => RACE_LABEL[r]).join(" / ") }, "Race: {names}"),
      met: req.race.some((r) => isRace(character, r)),
    });
  }
  if (req.armor) {
    lines.push({
      text: t("feat.req.proficiency", { item: t(`feat.req.armor.${req.armor}`, `${req.armor} armor`) }, "Proficiency with {item}"),
      met: collectProficiencies(character).armor.has(req.armor),
    });
  }
  if (req.martialWeapon) {
    lines.push({
      text: t("feat.req.proficiency", { item: t("feat.req.martialWeapon", "a martial weapon") }, "Proficiency with {item}"),
      met: hasMartialWeapon(character),
    });
  }
  if (req.spellcasting) {
    lines.push({ text: t("feat.req.spellcasting", "Able to cast at least one spell"), met: canCastSpells(character) });
  }
  return lines;
}

/** Whether the character may take this feat. */
export function meetsPrerequisites(character: Character, featName: string): boolean {
  return describeFeatRequirements(character, featName).every((line) => line.met);
}
