import { getFeatOptionGroups } from "@/data/feat-options";
import { getStaticSpells } from "./srd-client";
import { SKILLS, type Character } from "./storage";
import { normalizeDescription } from "./level-up";

/** What a feat gives on its own, before any of the player's picks. */
interface FixedFeatGrants {
  asi?: Record<string, number>;
  /** Armor and weapon proficiencies, kept in otherProficiencies. */
  proficiencies?: string[];
  tools?: string[];
  languages?: string[];
  spells?: string[];
}

export const FEAT_FIXED_GRANTS: Record<string, FixedFeatGrants> = {
  Actor: { asi: { cha: 1 } },
  Durable: { asi: { con: 1 } },
  "Dwarven Fortitude": { asi: { con: 1 } },
  "Heavily Armored": { asi: { str: 1 }, proficiencies: ["Heavy Armor"] },
  "Heavy Armor Master": { asi: { str: 1 } },
  "Infernal Constitution": { asi: { con: 1 } },
  "Keen Mind": { asi: { int: 1 } },
  Linguist: { asi: { int: 1 } },
  Gunner: { asi: { dex: 1 }, proficiencies: ["Firearms"] },
  "Lightly Armored": { proficiencies: ["Light Armor"] },
  "Moderately Armored": { proficiencies: ["Medium Armor", "Shields"] },
  "Tavern Brawler": { proficiencies: ["Improvised Weapons"] },
  Chef: { tools: ["Cook's Utensils"] },
  Poisoner: { tools: ["Poisoner's Kit"] },
  "Fey Teleportation": { languages: ["Sylvan"], spells: ["Misty Step"] },
  "Fey Touched": { spells: ["Misty Step"] },
  "Shadow Touched": { spells: ["Invisibility"] },
  Telekinetic: { spells: ["Mage Hand"] },
  Telepathic: { spells: ["Detect Thoughts"] },
  "Drow High Magic": { spells: ["Detect Magic", "Levitate", "Dispel Magic"] },
  "Svirfneblin Magic": { spells: ["Nondetection", "Blindness/Deafness", "Blur", "Disguise Self"] },
  "Wood Elf Magic": { spells: ["Longstrider", "Pass Without Trace"] },
  "Gift of the Metallic Dragon": { spells: ["Cure Wounds"] },
};

const MAX_SCORE = 20;
const ABILITY_KEYS = ["str", "dex", "con", "int", "wis", "cha"];

/** Feat picks are stored in featureSelections as "groupId=value" strings. */
export function encodeFeatOptions(options: Record<string, string> | undefined): string[] {
  return Object.entries(options || {})
    .filter(([, value]) => !!value)
    .map(([id, value]) => `${id}=${value}`);
}

export function decodeFeatOptions(entries: string[] | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of entries || []) {
    const i = entry.indexOf("=");
    if (i > 0) out[entry.slice(0, i)] = entry.slice(i + 1);
  }
  return out;
}

/** The ability increases a feat gives with these picks, e.g. { con: 1 } for Resilient (Constitution). */
export function featAbilityIncreases(featName: string, options: Record<string, string> = {}): Record<string, number> {
  const out: Record<string, number> = {};
  const add = (ability: string, amount: number) => {
    if (ABILITY_KEYS.includes(ability)) out[ability] = (out[ability] || 0) + amount;
  };
  for (const [ability, amount] of Object.entries(FEAT_FIXED_GRANTS[featName]?.asi || {})) add(ability, amount);
  for (const group of getFeatOptionGroups(featName)) {
    const value = options[group.id];
    if (value && group.id.replace(/_\d+$/, "") === "ability") add(value, 1);
  }
  return out;
}

/**
 * Applies a feat's ability increases, proficiencies, languages and spells.
 * Ability increases add to the stored scores, so call this once per feat, at
 * the moment the feat is taken.
 */
export function applyFeatGrants(character: Character, featName: string, options: Record<string, string> = {}): Character {
  const fixed = FEAT_FIXED_GRANTS[featName] || {};
  const groups = getFeatOptionGroups(featName);
  const skillNames = new Set<string>(SKILLS.map((s) => s.name));

  const scores: Record<string, number> = {};
  const raise = (ability: string, amount: number) => {
    if (!ABILITY_KEYS.includes(ability)) return;
    const current = scores[ability] ?? ((character as any)[ability] as number) ?? 10;
    scores[ability] = Math.min(MAX_SCORE, current + amount);
  };
  for (const [ability, amount] of Object.entries(featAbilityIncreases(featName, options))) raise(ability, amount);

  const skills = { ...character.skills };
  const expertise = new Set(character.expertise || []);
  const languages = new Set(character.languages || []);
  const tools = new Set(character.toolProficiencies || []);
  const other = (character.otherProficiencies || "").split(/,\s*/).filter(Boolean);
  const saves = new Set(character.bonusSaves || []);
  const spellNames: string[] = [...(fixed.spells || [])];

  for (const name of fixed.languages || []) languages.add(name);
  for (const name of fixed.tools || []) tools.add(name);
  for (const name of fixed.proficiencies || []) if (!other.includes(name)) other.push(name);

  for (const group of groups) {
    const value = options[group.id];
    if (!value) continue;
    const base = group.id.replace(/_\d+$/, "");
    if (group.type === "spell") {
      spellNames.push(value);
    } else if (base === "ability") {
      if (featName === "Resilient") saves.add(value);
    } else if (base === "expertise") {
      skills[value] = true;
      expertise.add(value);
    } else if (base === "skill" || base === "skill_or_tool") {
      if (skillNames.has(value)) skills[value] = true;
      else tools.add(value);
    } else if (base === "tool") {
      tools.add(value);
    } else if (base === "language") {
      languages.add(value);
    } else if (base === "weapon") {
      if (!other.includes(value)) other.push(value);
    }
  }

  const spells = [...(character.spells || [])];
  const cantrips = [...(character.cantrips || [])];
  if (spellNames.length > 0) {
    const all = getStaticSpells(character.sources);
    for (const name of spellNames) {
      const spell = all.find((s) => s.name === name) || getStaticSpells([]).find((s) => s.name === name);
      const level = spell?.level ?? 1;
      if (!spells.some((s) => s.name === name && s.level === level)) {
        spells.push({
          id: `spell-${name}-${level}`.replace(/\s+/g, "-"),
          name,
          level,
          source: "srd",
          srdSpellName: name,
          description: normalizeDescription(spell?.description),
        });
      }
      if (level === 0 && !cantrips.some((c) => c.name === name)) {
        cantrips.push({ id: `cantrip-${name}`.replace(/\s+/g, "-"), name });
      }
    }
  }

  return {
    ...character,
    ...scores,
    skills,
    expertise: [...expertise],
    languages: [...languages],
    toolProficiencies: [...tools],
    otherProficiencies: other.join(", "),
    bonusSaves: [...saves],
    spells,
    cantrips,
  };
}
