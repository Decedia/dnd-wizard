import { activeRaceChoices, getStaticClass, getStaticRace, getStaticRaceDetails, getStaticRaces, getStaticSubclasses, getStaticWeapons } from "@/lib/srd-client";
import { applyBackground, buildChoiceGroups, initializeCharacter, racePatch, syncBaseFeatures, type Character } from "@/lib/character-creation";
import { addRows, expandToRows } from "@/lib/inventory";
import { getRaceSkills } from "@/lib/race-grants";
import { getBackgroundData, alignmentOptions } from "@/data/backgrounds";
import { LANGUAGE_NAMES } from "@/data/feat-options";
import { RECOMMENDED_SKILLS_PER_CLASS } from "@/lib/recommendations";
import { SPELL_WHY } from "@/lib/level-up-picks";
import { SOURCE_OPTIONS } from "@/components/SourceBadge";
import { getFeatOptionGroups } from "@/data/feat-options";
import { getStaticSpells } from "@/lib/srd-client";
import { encodeFeatOptions } from "@/lib/feat-grants";
import { BACKGROUND_TOOL_KEY, ORIGIN_FEAT_KEY, applyBackground2024, getBackground2024, originFeats, pickGearPatch } from "@/lib/origin-2024";

type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

/** Quick create uses every sourcebook so any subclass can be picked. */
export const QUICK_SOURCES = SOURCE_OPTIONS.map((s) => s.id);

/** The level quick create builds. */
export const QUICK_LEVEL = 3;

/** The most common race, background and alignment for each class; all can be changed. */
export const QUICK_ORIGINS: Record<string, { race: string; background: string; alignment: string }> = {
  Barbarian: { race: "Half-Orc", background: "Outlander", alignment: "Chaotic Neutral" },
  Bard: { race: "Half-Elf", background: "Entertainer", alignment: "Chaotic Good" },
  Cleric: { race: "Hill Dwarf", background: "Acolyte", alignment: "Lawful Good" },
  Druid: { race: "Wood Elf", background: "Hermit", alignment: "Neutral" },
  Fighter: { race: "Human", background: "Soldier", alignment: "Lawful Neutral" },
  Monk: { race: "Wood Elf", background: "Hermit", alignment: "Lawful Neutral" },
  Paladin: { race: "Half-Elf", background: "Noble", alignment: "Lawful Good" },
  Ranger: { race: "Wood Elf", background: "Outlander", alignment: "Neutral Good" },
  Rogue: { race: "Lightfoot Halfling", background: "Criminal", alignment: "Chaotic Neutral" },
  Sorcerer: { race: "Tiefling", background: "Sage", alignment: "Chaotic Good" },
  Warlock: { race: "Tiefling", background: "Charlatan", alignment: "Chaotic Neutral" },
  Wizard: { race: "High Elf", background: "Sage", alignment: "Neutral Good" },
  Artificer: { race: "Rock Gnome", background: "Guild Artisan", alignment: "Neutral" },
};

/**
 * 2024 rules (SRD 5.2: 9 species, 4 backgrounds, one subclass per class): the
 * species and background that suit each class, and the lineage to take.
 */
export const QUICK_ORIGINS_2024: Record<string, { race: string; background: string; lineage?: string }> = {
  Barbarian: { race: "Goliath", background: "Soldier", lineage: "giant-ancestry-stones-endurance" },
  Bard: { race: "Human", background: "Acolyte" },
  Cleric: { race: "Dwarf", background: "Acolyte" },
  Druid: { race: "Elf", background: "Sage", lineage: "elven-lineage-wood-elf" },
  Fighter: { race: "Human", background: "Soldier" },
  Monk: { race: "Elf", background: "Criminal", lineage: "elven-lineage-wood-elf" },
  Paladin: { race: "Dragonborn", background: "Soldier", lineage: "draconic-ancestor-gold" },
  Ranger: { race: "Elf", background: "Criminal", lineage: "elven-lineage-wood-elf" },
  Rogue: { race: "Halfling", background: "Criminal" },
  Sorcerer: { race: "Tiefling", background: "Acolyte", lineage: "fiendish-legacy-infernal" },
  Warlock: { race: "Tiefling", background: "Acolyte", lineage: "fiendish-legacy-infernal" },
  Wizard: { race: "Elf", background: "Sage", lineage: "elven-lineage-high-elf" },
};

/** Where the standard array (15, 14, 13, 12, 10, 8) goes, best score first. */
const ABILITY_ORDER: Record<string, AbilityKey[]> = {
  Barbarian: ["str", "con", "dex", "wis", "cha", "int"],
  Bard: ["cha", "dex", "con", "wis", "int", "str"],
  Cleric: ["wis", "con", "str", "dex", "cha", "int"],
  Druid: ["wis", "con", "dex", "int", "cha", "str"],
  Fighter: ["str", "con", "dex", "wis", "int", "cha"],
  Monk: ["dex", "wis", "con", "str", "int", "cha"],
  Paladin: ["str", "cha", "con", "wis", "dex", "int"],
  Ranger: ["dex", "wis", "con", "str", "int", "cha"],
  Rogue: ["dex", "con", "wis", "int", "cha", "str"],
  Sorcerer: ["cha", "con", "dex", "wis", "int", "str"],
  Warlock: ["cha", "con", "dex", "wis", "int", "str"],
  Wizard: ["int", "con", "dex", "wis", "cha", "str"],
  Artificer: ["int", "con", "dex", "wis", "cha", "str"],
};
// Subclasses that want a different third or second score.
const SUBCLASS_ABILITY_ORDER: Record<string, AbilityKey[]> = {
  "Eldritch Knight": ["str", "con", "int", "dex", "wis", "cha"],
  "Arcane Trickster": ["dex", "int", "con", "wis", "cha", "str"],
  Swashbuckler: ["dex", "cha", "con", "wis", "int", "str"],
  Bladesinging: ["int", "dex", "con", "wis", "cha", "str"],
};
const STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

export function abilityOrder(className: string, subclass?: string): AbilityKey[] {
  return (subclass && SUBCLASS_ABILITY_ORDER[subclass]) || ABILITY_ORDER[className] || ["str", "dex", "con", "int", "wis", "cha"];
}

const SKILL_ORDER = [
  "Perception", "Stealth", "Athletics", "Insight", "Persuasion", "Acrobatics", "Investigation", "Survival",
  "Arcana", "Deception", "Intimidation", "Religion", "History", "Nature", "Medicine", "Animal Handling",
  "Sleight of Hand", "Performance",
];

const LANGUAGE_ORDER = ["Elvish", "Dwarvish", "Draconic", "Halfling", "Giant", "Gnomish", "Orc", "Goblin", "Celestial", "Infernal", "Sylvan", "Primordial"];

/** Weapons picked when a starting option says "any martial weapon" and so on, best first. */
const WEAPON_ORDER = [
  "Longsword", "Rapier", "Warhammer", "Battleaxe", "Shortsword", "Longbow", "Greatsword",
  "Spear", "Mace", "Quarterstaff", "Handaxe", "Light Crossbow", "Shortbow", "Dagger",
];
const FOCUS_PICK = {
  isInstrumentChoice: "Lute",
  isArcaneFocusChoice: "Crystal",
  isHolySymbolChoice: "Amulet",
  isDruidicFocusChoice: "Sprig of Mistletoe",
} as const;

/** Races quick create offers: the ones a player can pick directly (no parent races like "Elf"). */
export function quickRaceOptions(): string[] {
  return getStaticRaces(QUICK_SOURCES, "2014").filter((r) => !r.requiresSubrace).map((r) => r.name);
}

const preferred = <T extends string>(order: readonly string[], options: T[]): T[] => {
  const rank = (o: string) => {
    const i = order.indexOf(o);
    return i < 0 ? order.length : i;
  };
  return [...options].sort((a, b) => rank(a) - rank(b));
};

export interface QuickPersona {
  name: string;
  gender?: string;
  alignment?: string;
  personalityTrait1?: string;
  ideal?: string;
  bond?: string;
  flaw?: string;
  appearance?: Partial<Record<"age" | "height" | "weight" | "eyes" | "hair" | "skin", string>>;
}

/** A fresh quick-create draft: class, subclass and the class's usual race, background and alignment. */
export function startQuickDraft(className: string, subclass: string, ruleset: "2014" | "2024" = "2014"): Character {
  const origin = QUICK_ORIGINS[className] || QUICK_ORIGINS.Fighter;
  let c: Character = {
    ...initializeCharacter(),
    sources: ruleset === "2024" ? ["PHB"] : QUICK_SOURCES,
    ruleset,
    class: className,
    abilityMethod: "standard" as any,
    alignment: origin.alignment,
  };
  c = setQuickSubclass(c, subclass);
  if (ruleset === "2024") {
    const origin2024 = QUICK_ORIGINS_2024[className] || QUICK_ORIGINS_2024.Fighter;
    c = { ...c, ...racePatch(c, { name: origin2024.race }) };
    if (origin2024.lineage) c.raceChoices = { ...c.raceChoices, [`${origin2024.race.toLowerCase()}-2024-lineage`]: origin2024.lineage };
    return { ...c, ...applyBackground2024(c, origin2024.background) };
  }
  c = { ...c, ...racePatch(c, { name: origin.race }) };
  c = { ...c, ...applyBackground(c, origin.background) };
  return c;
}

/** Subclasses quick create offers for the rule set. */
export const quickSubclasses = (className: string, ruleset: string | undefined, language = "en") =>
  getStaticSubclasses(className, ruleset === "2024" ? ["PHB"] : QUICK_SOURCES, ruleset === "2024" ? "2024" : "2014", language).filter((s) => s.name);

/** Switch the draft's subclass (by name). */
export function setQuickSubclass(c: Character, subclass: string): Character {
  const sub = quickSubclasses(c.class, c.ruleset).find((s) => s.name === subclass);
  return { ...c, subclass: sub?.name, subclassIndex: sub?.index };
}

/**
 * Fills every creation choice the way most players do it: standard array,
 * the class's usual skills, the first starting gear option, race picks and
 * languages. The level-up wizard then takes it to level 3 with its
 * suggested picks.
 */
export function completeQuickDraft(draft: Character, persona: QuickPersona, language = "en"): Character {
  if (draft.ruleset === "2024") return completeQuickDraft2024(draft, persona, language);
  let c: Character = { ...draft, name: persona.name, gender: persona.gender || "" };
  const origin = QUICK_ORIGINS[c.class] || QUICK_ORIGINS.Fighter;

  // Ability scores: standard array, best scores where the class needs them.
  const order = abilityOrder(c.class, c.subclass);
  order.forEach((key, i) => { (c as any)[key] = STANDARD_ARRAY[i]; });

  const race = getStaticRace(c.race, "2014");
  const flex = race?.flexibleAsi;
  if (flex) {
    const fixed = Object.keys(race?.abilityScoreIncreases || {});
    const free = order.filter((k) => !(flex === "one" && fixed.includes(k)));
    c.flexAsi = flex === "one" ? { [free[0]]: 1 } : { [free[0]]: 2, [free[1]]: 1 };
  }
  const taken = new Set(Object.entries(c.skills || {}).filter(([, v]) => v).map(([k]) => k));
  if (c.race.startsWith("Half-Elf")) {
    if ((c.halfElfAbilities || []).length !== 2) c.halfElfAbilities = order.filter((k) => k !== "cha").slice(0, 2);
    if (!c.race.startsWith("Half-Elf (") && (c.halfElfSkills || []).length !== 2) {
      c.halfElfSkills = SKILL_ORDER.filter((s) => !taken.has(s)).slice(0, 2);
    }
    (c.halfElfSkills || []).forEach((s) => taken.add(s));
  }
  if (race?.skillChoice) {
    const options = race.skillChoice.options || SKILL_ORDER;
    c.raceSkillPicks = preferred(SKILL_ORDER, options.filter((s) => !taken.has(s))).slice(0, race.skillChoice.count);
  }
  for (const s of getRaceSkills(c)) taken.add(s);
  const raceChoices: Record<string, string> = { ...(c.raceChoices || {}) };
  const details = getStaticRaceDetails(c.race, QUICK_SOURCES);
  // Choices can unlock more choices (a half-elf's cantrip), so go round until nothing new opens.
  for (let pass = 0; pass < 3; pass++) {
    for (const choice of activeRaceChoices(details?.choices, raceChoices)) {
      if (raceChoices[choice.id] || (choice.type as string) === "variant") continue;
      const options = choice.options || [];
      if (choice.type === "cantrip") {
        const best = preferred(Object.keys(SPELL_WHY), options.map((o) => o.name))[0];
        const opt = options.find((o) => o.name === best);
        if (opt) raceChoices[choice.id] = opt.id;
      } else if (options[0]) {
        raceChoices[choice.id] = options[0].id;
      }
    }
  }
  c.raceChoices = raceChoices;

  // Class skills the background and race don't already give.
  const classData = getStaticClass(c.class, "2014");
  if (classData?.skillChoices) {
    const { count, options } = classData.skillChoices;
    const skillOrder = [...(RECOMMENDED_SKILLS_PER_CLASS[c.class] || []), ...SKILL_ORDER];
    const picks = preferred(skillOrder, options.filter((s) => !taken.has(s))).slice(0, count);
    c.skills = { ...c.skills, ...Object.fromEntries(picks.map((s) => [s, true])) };
  }

  // Languages from the race and background: the most spoken ones not known yet.
  const bonus = (race?.extraLanguages || 0) + (getBackgroundData(c.background)?.languages || 0);
  const known = new Set(race?.languages || ["Common"]);
  c.languages = preferred(LANGUAGE_ORDER, LANGUAGE_NAMES.filter((l) => !known.has(l))).slice(0, bonus);

  c.inventory = quickStartingGear(c);
  c.alignment = persona.alignment && alignmentOptions.includes(persona.alignment) ? persona.alignment : c.alignment || origin.alignment;
  c.personalityTrait1 = persona.personalityTrait1 || "";
  c.ideal = persona.ideal || "";
  c.bond = persona.bond || "";
  c.flaw = persona.flaw || "";
  c.appearance = { ...c.appearance, ...(persona.appearance || {}) };
  return syncBaseFeatures(c, language);
}

/** Persona fields (alignment, traits, look) shared by both rule sets. */
function withPersona(c: Character, persona: QuickPersona): Character {
  const origin = QUICK_ORIGINS[c.class] || QUICK_ORIGINS.Fighter;
  return {
    ...c,
    alignment: persona.alignment && alignmentOptions.includes(persona.alignment) ? persona.alignment : c.alignment || origin.alignment,
    personalityTrait1: persona.personalityTrait1 || "",
    ideal: persona.ideal || "",
    bond: persona.bond || "",
    flaw: persona.flaw || "",
    appearance: { ...c.appearance, ...(persona.appearance || {}) },
  };
}

const MENTAL: AbilityKey[] = ["int", "wis", "cha"];

/**
 * The 2024 version: standard array, the background's +2/+1 on the class's best
 * two of its three abilities, species questions answered (lineage, spellcasting
 * ability, Medium size), the Origin feats and their picks, the class's usual
 * skills, and gear package A from both class and background.
 */
export function completeQuickDraft2024(draft: Character, persona: QuickPersona, language = "en"): Character {
  let c: Character = { ...draft, name: persona.name, gender: persona.gender || "" };
  const order = abilityOrder(c.class, c.subclass);
  order.forEach((key, i) => { (c as any)[key] = STANDARD_ARRAY[i]; });

  const bg = getBackground2024(c.background);
  const fits = order.filter((k) => bg?.abilityScores.includes(k));
  c.flexAsi = fits.length >= 2 ? { [fits[0]]: 2, [fits[1]]: 1 } : {};

  // Species questions: the lineage that suits the class, the class's casting ability, Medium.
  const classData = getStaticClass(c.class, "2024");
  const casting = String(classData?.spellcastingAbility || "").toLowerCase().slice(0, 3) as AbilityKey;
  const spellAbility = MENTAL.includes(casting) ? casting : order.find((k) => MENTAL.includes(k)) || "cha";
  const raceChoices: Record<string, string> = { ...(c.raceChoices || {}) };
  const species = getStaticRace(c.race, "2024");
  for (let pass = 0; pass < 3; pass++) {
    for (const choice of activeRaceChoices(species?.choices, raceChoices)) {
      if (raceChoices[choice.id]) continue;
      const ids = (choice.options || []).map((o) => o.id);
      raceChoices[choice.id] = /-spell-ability$/.test(choice.id) && ids.includes(spellAbility) ? spellAbility : ids.includes("medium") ? "medium" : ids[0];
    }
  }
  c.raceChoices = raceChoices;

  // Skills the background gives come first, then the species pick (Human Skillful, Elf Keen Senses); class picks fill the rest.
  const taken = new Set([...(bg?.skills || []), ...Object.entries(c.skills || {}).filter(([, v]) => v).map(([k]) => k)]);
  if (species?.skillChoice) {
    const options = species.skillChoice.options || SKILL_ORDER;
    c.raceSkillPicks = preferred(SKILL_ORDER, options.filter((s) => !taken.has(s))).slice(0, species.skillChoice.count);
  }
  for (const s of getRaceSkills(c)) taken.add(s);
  if (classData?.skillChoices) {
    const { count, options } = classData.skillChoices;
    const skillOrder = [...(RECOMMENDED_SKILLS_PER_CLASS[c.class] || []), ...SKILL_ORDER];
    const picks = preferred(skillOrder, options.filter((s) => !taken.has(s))).slice(0, count);
    picks.forEach((s) => taken.add(s));
    c.skills = { ...c.skills, ...Object.fromEntries(picks.map((s) => [s, true])) };
  }

  // Origin feats: a Human's Versatile feat is Alert (Skilled when the background gives Alert).
  const selections = { ...(c.featureSelections || {}) };
  if (species?.originFeat && !selections[ORIGIN_FEAT_KEY.species]?.[0]) {
    selections[ORIGIN_FEAT_KEY.species] = [bg?.feat === "Alert" ? "Skilled" : "Alert"];
  }
  if (bg?.toolChoice && !selections[BACKGROUND_TOOL_KEY]?.[0]) selections[BACKGROUND_TOOL_KEY] = ["Dice Set"];
  c.featureSelections = selections;
  for (const feat of originFeats(c)) {
    const options = { ...feat.options };
    const chosen = new Set<string>();
    for (const group of getFeatOptionGroups(feat.name, "2024")) {
      if (options[group.id]) { chosen.add(options[group.id]); continue; }
      if (group.type === "select") {
        const values = (group.choices || []).map((o) => o.value);
        const pick =
          group.id === "spell_ability" ? spellAbility
          : group.id === "spell_class" ? values[0]
          : preferred(SKILL_ORDER, values.filter((v) => !taken.has(v) && !chosen.has(v)))[0];
        if (pick) { options[group.id] = pick; chosen.add(pick); taken.add(pick); }
      } else if (group.spell) {
        const list = options[group.spell.classFromOptionId || ""] || "";
        const spells = getStaticSpells([], "2024").filter((sp) => sp.level === group.spell!.level && (sp.classes || []).some((cl) => cl.toLowerCase() === list) && !chosen.has(sp.name));
        const pick = quickSpellOrder(spells)[0]?.name;
        if (pick) { options[group.id] = pick; chosen.add(pick); }
      }
    }
    c.featureSelections = { ...c.featureSelections, [feat.key]: [feat.name], [`${feat.key}-options`]: encodeFeatOptions(options) };
  }

  c = { ...c, ...pickGearPatch(c, "class", "A") };
  c = { ...c, ...pickGearPatch(c, "background", "A") };
  // Common plus two languages of the player's choice (the species gives the two picks).
  const known = new Set(species?.languages || ["Common"]);
  c.languages = preferred(LANGUAGE_ORDER, LANGUAGE_NAMES.filter((l) => !known.has(l))).slice(0, species?.extraLanguages || 0);
  return syncBaseFeatures(withPersona(c, persona), language);
}

/** The class's starting gear: every fixed item plus the first option of every choice. */
export function quickStartingGear(c: Character): Character["inventory"] {
  const classData = getStaticClass(c.class, c.ruleset);
  const startingEquipment: any[] = classData?.startingEquipment || [];
  let inventory = [...(c.inventory || [])];
  for (const entry of startingEquipment) {
    if (!entry.granted || !entry.items) continue;
    for (const item of entry.items) {
      inventory = addRows(inventory, expandToRows(item.name, item.quantity || 1, { isGranted: true, grantedFrom: item.name }));
    }
  }
  const weapons = getStaticWeapons(c.sources);
  const inCategory = (type?: string) =>
    weapons.filter((w: any) => {
      const cat = w.weapon_category;
      const range = w.category_range;
      if (type === "martial") return cat === "Martial";
      if (type === "simple") return cat === "Simple";
      if (type === "martial_melee") return cat === "Martial" && range === "Melee";
      if (type === "martial_ranged") return cat === "Martial" && range === "Ranged";
      if (type === "simple_melee") return cat === "Simple" && range === "Melee";
      if (type === "simple_ranged") return cat === "Simple" && range === "Ranged";
      return false;
    }).map((w: any) => w.name as string);
  for (const group of buildChoiceGroups(startingEquipment, c.ruleset)) {
    const groupIndex = parseInt(group.id.replace("choice-", ""), 10);
    const opt = group.options[0];
    if (!opt) continue;
    const grant = { choiceGroupIndex: groupIndex, choiceOptionIndex: 0 };
    const rows: Character["inventory"] = [];
    if (opt.isWeaponChoice) {
      const best = preferred(WEAPON_ORDER, inCategory(opt.weaponType))[0];
      if (best) for (let i = 0; i < (opt.selectionCount || 1); i++) rows.push(...expandToRows(best, 1, grant));
    }
    for (const key of Object.keys(FOCUS_PICK) as (keyof typeof FOCUS_PICK)[]) {
      if (opt[key]) rows.push(...expandToRows(FOCUS_PICK[key], 1, grant));
    }
    for (const item of opt.items || []) rows.push(...expandToRows(item.name, item.quantity || 1, grant));
    inventory = addRows(inventory, rows);
  }
  return inventory;
}

/**
 * Spells most players take, best first, for picks past the suggestion cards.
 * Spells not listed come after, highest level first.
 */
export const QUICK_SPELL_ORDER = [
  // Cantrips
  "Eldritch Blast", "Fire Bolt", "Toll the Dead", "Sacred Flame", "Guidance", "Shillelagh", "Produce Flame",
  "Vicious Mockery", "Mind Sliver", "Ray of Frost", "Mage Hand", "Minor Illusion", "Prestidigitation",
  "Thorn Whip", "Booming Blade", "Green-Flame Blade", "Shocking Grasp", "Light", "Message", "Spare the Dying",
  "Druidcraft", "Thaumaturgy", "Mending",
  // 1st level
  "Shield", "Magic Missile", "Healing Word", "Bless", "Cure Wounds", "Guiding Bolt", "Silvery Barbs", "Sleep",
  "Faerie Fire", "Hunter's Mark", "Hex", "Absorb Elements", "Find Familiar", "Goodberry", "Entangle",
  "Mage Armor", "Chromatic Orb", "Thunderwave", "Shield of Faith", "Sanctuary", "Dissonant Whispers",
  "Tasha's Hideous Laughter", "Command", "Detect Magic", "Armor of Agathys", "Feather Fall", "Burning Hands",
  "Ensnaring Strike", "Heroism", "Protection from Evil and Good", "Speak with Animals", "Fog Cloud",
  "Inflict Wounds", "Charm Person", "Disguise Self", "Identify",
  // 2nd level
  "Misty Step", "Hold Person", "Spiritual Weapon", "Web", "Shatter", "Scorching Ray", "Pass without Trace",
  "Moonbeam", "Spike Growth", "Heat Metal", "Invisibility", "Aid", "Lesser Restoration", "Mirror Image",
  "Suggestion", "Shadow Blade", "Silence", "Barkskin", "Prayer of Healing", "Enhance Ability",
  "Phantasmal Force", "Blur", "Darkness", "Flaming Sphere",
];

/** Spell names in the order quick create picks them. */
export function quickSpellOrder<T extends { name: string; level: number }>(spells: T[]): T[] {
  const rank = (name: string) => {
    const i = QUICK_SPELL_ORDER.indexOf(name);
    return i < 0 ? QUICK_SPELL_ORDER.length : i;
  };
  return [...spells].sort((a, b) => rank(a.name) - rank(b.name) || b.level - a.level || a.name.localeCompare(b.name));
}

