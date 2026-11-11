import { activeRaceChoices, getStaticClass, getStaticRace, getStaticRaceDetails, getStaticRaces, getStaticSubclasses, getStaticWeapons } from "@/lib/srd-client";
import { applyBackground, buildChoiceGroups, initializeCharacter, racePatch, syncBaseFeatures, type Character } from "@/lib/character-creation";
import { addRows, expandToRows } from "@/lib/inventory";
import { getRaceSkills } from "@/lib/race-grants";
import { getBackgroundData, alignmentOptions } from "@/data/backgrounds";
import { LANGUAGE_NAMES } from "@/data/feat-options";
import { RECOMMENDED_SKILLS_PER_CLASS } from "@/lib/recommendations";
import { SPELL_WHY } from "@/lib/level-up-picks";
import { SOURCE_OPTIONS } from "@/components/SourceBadge";

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
export function startQuickDraft(className: string, subclass: string): Character {
  const origin = QUICK_ORIGINS[className] || QUICK_ORIGINS.Fighter;
  let c: Character = {
    ...initializeCharacter(),
    sources: QUICK_SOURCES,
    ruleset: "2014",
    class: className,
    abilityMethod: "standard" as any,
    alignment: origin.alignment,
  };
  c = setQuickSubclass(c, subclass);
  c = { ...c, ...racePatch(c, { name: origin.race }) };
  c = { ...c, ...applyBackground(c, origin.background) };
  return c;
}

/** Switch the draft's subclass (by name). */
export function setQuickSubclass(c: Character, subclass: string): Character {
  const sub = getStaticSubclasses(c.class, QUICK_SOURCES, "2014").find((s) => s.name === subclass);
  return { ...c, subclass: sub?.name, subclassIndex: sub?.index };
}

/**
 * Fills every creation choice the way most players do it: standard array,
 * the class's usual skills, the first starting gear option, race picks and
 * languages. The level-up wizard then takes it to level 3 with its
 * suggested picks.
 */
export function completeQuickDraft(draft: Character, persona: QuickPersona, language = "en"): Character {
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

