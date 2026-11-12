/**
 * Structured sub-choices for feats that require a selection on pickup
 * (Resilient, Magic Initiate, Skilled, ...).
 *
 * Choice `value`s are stable keys used for persistence; `label`s are D&D
 * mechanical terms and stay in English. Group labels are localized through
 * `labelId` so the surrounding UI can render them in the active language.
 */

export interface FeatOptionChoice {
  value: string;
  label: string;
}

export interface FeatOptionSpellFilter {
  /** 0 = cantrip. Omit to allow any level. */
  level?: number;
  /** Fixed class restriction, e.g. "cleric" for Divinely Favored. */
  classes?: string[];
  /** id of a sibling option group that supplies the class. */
  classFromOptionId?: string;
  /** Only include spells tagged as rituals (Ritual Caster). */
  ritualOnly?: boolean;
  /** Only include spells of these schools (Fey Touched, Shadow Touched). */
  schools?: string[];
}

export interface FeatOptionGroup {
  id: string;
  labelId: string;
  label: string;
  type: "select" | "spell";
  /** How many distinct picks this group grants (renders one control each). */
  count: number;
  choices?: FeatOptionChoice[];
  spell?: FeatOptionSpellFilter;
}

const ABILITIES: FeatOptionChoice[] = [
  { value: "str", label: "STR" },
  { value: "dex", label: "DEX" },
  { value: "con", label: "CON" },
  { value: "int", label: "INT" },
  { value: "wis", label: "WIS" },
  { value: "cha", label: "CHA" },
];

const DAMAGE_TYPES: FeatOptionChoice[] = [
  { value: "acid", label: "Acid" },
  { value: "cold", label: "Cold" },
  { value: "fire", label: "Fire" },
  { value: "lightning", label: "Lightning" },
  { value: "thunder", label: "Thunder" },
];

const SKILLS: FeatOptionChoice[] = [
  { value: "Acrobatics", label: "Acrobatics" },
  { value: "Animal Handling", label: "Animal Handling" },
  { value: "Arcana", label: "Arcana" },
  { value: "Athletics", label: "Athletics" },
  { value: "Deception", label: "Deception" },
  { value: "History", label: "History" },
  { value: "Insight", label: "Insight" },
  { value: "Intimidation", label: "Intimidation" },
  { value: "Investigation", label: "Investigation" },
  { value: "Medicine", label: "Medicine" },
  { value: "Nature", label: "Nature" },
  { value: "Perception", label: "Perception" },
  { value: "Performance", label: "Performance" },
  { value: "Persuasion", label: "Persuasion" },
  { value: "Religion", label: "Religion" },
  { value: "Sleight of Hand", label: "Sleight of Hand" },
  { value: "Stealth", label: "Stealth" },
  { value: "Survival", label: "Survival" },
];

const TOOLS: FeatOptionChoice[] = [
  { value: "Alchemist's Supplies", label: "Alchemist's Supplies" },
  { value: "Calligrapher's Supplies", label: "Calligrapher's Supplies" },
  { value: "Carpenter's Tools", label: "Carpenter's Tools" },
  { value: "Cartographer's Tools", label: "Cartographer's Tools" },
  { value: "Cobbler's Tools", label: "Cobbler's Tools" },
  { value: "Cook's Utensils", label: "Cook's Utensils" },
  { value: "Dice Set", label: "Dice Set" },
  { value: "Disguise Kit", label: "Disguise Kit" },
  { value: "Forgery Kit", label: "Forgery Kit" },
  { value: "Glassblower's Tools", label: "Glassblower's Tools" },
  { value: "Herbalism Kit", label: "Herbalism Kit" },
  { value: "Jeweler's Tools", label: "Jeweler's Tools" },
  { value: "Leatherworker's Tools", label: "Leatherworker's Tools" },
  { value: "Mason's Tools", label: "Mason's Tools" },
  { value: "Navigator's Tools", label: "Navigator's Tools" },
  { value: "Painter's Supplies", label: "Painter's Supplies" },
  { value: "Playing Card Set", label: "Playing Card Set" },
  { value: "Poisoner's Kit", label: "Poisoner's Kit" },
  { value: "Potter's Tools", label: "Potter's Tools" },
  { value: "Smith's Tools", label: "Smith's Tools" },
  { value: "Thieves' Tools", label: "Thieves' Tools" },
  { value: "Tinker's Tools", label: "Tinker's Tools" },
  { value: "Weaver's Tools", label: "Weaver's Tools" },
  { value: "Woodcarver's Tools", label: "Woodcarver's Tools" },
];

const LANGUAGES: FeatOptionChoice[] = [
  { value: "Abyssal", label: "Abyssal" },
  { value: "Celestial", label: "Celestial" },
  { value: "Common", label: "Common" },
  { value: "Deep Speech", label: "Deep Speech" },
  { value: "Draconic", label: "Draconic" },
  { value: "Dwarvish", label: "Dwarvish" },
  { value: "Elvish", label: "Elvish" },
  { value: "Giant", label: "Giant" },
  { value: "Gnomish", label: "Gnomish" },
  { value: "Goblin", label: "Goblin" },
  { value: "Halfling", label: "Halfling" },
  { value: "Infernal", label: "Infernal" },
  { value: "Orc", label: "Orc" },
  { value: "Primordial", label: "Primordial" },
  { value: "Sylvan", label: "Sylvan" },
  { value: "Undercommon", label: "Undercommon" },
];

export const LANGUAGE_NAMES: string[] = LANGUAGES.map((l) => l.value);

const FIGHTING_STYLES: FeatOptionChoice[] = [
  { value: "Archery", label: "Archery" },
  { value: "Blind Fighting", label: "Blind Fighting" },
  { value: "Defense", label: "Defense" },
  { value: "Dueling", label: "Dueling" },
  { value: "Great Weapon Fighting", label: "Great Weapon Fighting" },
  { value: "Interception", label: "Interception" },
  { value: "Protection", label: "Protection" },
  { value: "Superior Technique", label: "Superior Technique" },
  { value: "Thrown Weapon Fighting", label: "Thrown Weapon Fighting" },
  { value: "Two-Weapon Fighting", label: "Two-Weapon Fighting" },
  { value: "Unarmed Fighting", label: "Unarmed Fighting" },
];

const METAMAGIC: FeatOptionChoice[] = [
  { value: "Careful Spell", label: "Careful Spell" },
  { value: "Distant Spell", label: "Distant Spell" },
  { value: "Empowered Spell", label: "Empowered Spell" },
  { value: "Extended Spell", label: "Extended Spell" },
  { value: "Heightened Spell", label: "Heightened Spell" },
  { value: "Quickened Spell", label: "Quickened Spell" },
  { value: "Seeking Spell", label: "Seeking Spell" },
  { value: "Subtle Spell", label: "Subtle Spell" },
  { value: "Transmuted Spell", label: "Transmuted Spell" },
  { value: "Twinned Spell", label: "Twinned Spell" },
];

const MANEUVERS: FeatOptionChoice[] = [
  { value: "Ambush", label: "Ambush" },
  { value: "Bait and Switch", label: "Bait and Switch" },
  { value: "Brace", label: "Brace" },
  { value: "Commander's Strike", label: "Commander's Strike" },
  { value: "Commanding Presence", label: "Commanding Presence" },
  { value: "Disarming Attack", label: "Disarming Attack" },
  { value: "Distracting Strike", label: "Distracting Strike" },
  { value: "Evasive Footwork", label: "Evasive Footwork" },
  { value: "Feinting Attack", label: "Feinting Attack" },
  { value: "Goading Attack", label: "Goading Attack" },
  { value: "Lunging Attack", label: "Lunging Attack" },
  { value: "Maneuvering Attack", label: "Maneuvering Attack" },
  { value: "Menacing Attack", label: "Menacing Attack" },
  { value: "Parry", label: "Parry" },
  { value: "Precision Attack", label: "Precision Attack" },
  { value: "Pushing Attack", label: "Pushing Attack" },
  { value: "Quick Toss", label: "Quick Toss" },
  { value: "Rally", label: "Rally" },
  { value: "Riposte", label: "Riposte" },
  { value: "Sweeping Attack", label: "Sweeping Attack" },
  { value: "Tactical Assessment", label: "Tactical Assessment" },
  { value: "Trip Attack", label: "Trip Attack" },
];

const INVOCATIONS: FeatOptionChoice[] = [
  { value: "Agonizing Blast", label: "Agonizing Blast" },
  { value: "Armor of Shadows", label: "Armor of Shadows" },
  { value: "Ascendant Step", label: "Ascendant Step" },
  { value: "Beast Speech", label: "Beast Speech" },
  { value: "Beguiling Influence", label: "Beguiling Influence" },
  { value: "Bewitching Whispers", label: "Bewitching Whispers" },
  { value: "Book of Ancient Secrets", label: "Book of Ancient Secrets" },
  { value: "Chains of Carceri", label: "Chains of Carceri" },
  { value: "Devil's Sight", label: "Devil's Sight" },
  { value: "Dreadful Word", label: "Dreadful Word" },
  { value: "Eldritch Mind", label: "Eldritch Mind" },
  { value: "Eldritch Sight", label: "Eldritch Sight" },
  { value: "Eldritch Spear", label: "Eldritch Spear" },
  { value: "Eyes of the Rune Keeper", label: "Eyes of the Rune Keeper" },
  { value: "Fiendish Vigor", label: "Fiendish Vigor" },
  { value: "Gaze of Two Minds", label: "Gaze of Two Minds" },
  { value: "Gift of the Depths", label: "Gift of the Depths" },
  { value: "Gift of the Ever-Living Ones", label: "Gift of the Ever-Living Ones" },
  { value: "Gift of the Protectors", label: "Gift of the Protectors" },
  { value: "Lance of Lethargy", label: "Lance of Lethargy" },
  { value: "Maddening Hex", label: "Maddening Hex" },
  { value: "Mask of Many Faces", label: "Mask of Many Faces" },
  { value: "Master of Myriad Forms", label: "Master of Myriad Forms" },
  { value: "Minions of Chaos", label: "Minions of Chaos" },
  { value: "Mire the Mind", label: "Mire the Mind" },
  { value: "Misty Visions", label: "Misty Visions" },
  { value: "One with Shadows", label: "One with Shadows" },
  { value: "Otherworldly Leap", label: "Otherworldly Leap" },
  { value: "Rebuke of the Talisman", label: "Rebuke of the Talisman" },
  { value: "Relentless Hex", label: "Relentless Hex" },
  { value: "Sculptor of Flesh", label: "Sculptor of Flesh" },
  { value: "Shroud of Shadow", label: "Shroud of Shadow" },
  { value: "Sign of Ill Omen", label: "Sign of Ill Omen" },
  { value: "Thief of Five Fates", label: "Thief of Five Fates" },
  { value: "Tomb of Levistus", label: "Tomb of Levistus" },
  { value: "Trickster's Escape", label: "Trickster's Escape" },
  { value: "Visions of Distant Realms", label: "Visions of Distant Realms" },
  { value: "Voice of the Chain Master", label: "Voice of the Chain Master" },
  { value: "Whispers of the Grave", label: "Whispers of the Grave" },
  { value: "Witch Sight", label: "Witch Sight" },
];

const SPELLCASTING_CLASSES: FeatOptionChoice[] = [
  { value: "bard", label: "Bard" },
  { value: "cleric", label: "Cleric" },
  { value: "druid", label: "Druid" },
  { value: "sorcerer", label: "Sorcerer" },
  { value: "warlock", label: "Warlock" },
  { value: "wizard", label: "Wizard" },
];

const optionGroup = (
  id: string,
  labelId: string,
  label: string,
  choices: FeatOptionChoice[],
  count = 1,
): FeatOptionGroup => ({ id, labelId, label, type: "select", count, choices });

const spellGroup = (
  id: string,
  labelId: string,
  label: string,
  spell: FeatOptionSpellFilter,
  count = 1,
): FeatOptionGroup => ({ id, labelId, label, type: "spell", count, spell });

const repeated = (
  groups: FeatOptionGroup[],
): FeatOptionGroup[] => {
  const out: FeatOptionGroup[] = [];
  for (const group of groups) {
    for (let index = 1; index <= group.count; index += 1) {
      out.push({
        ...group,
        id: group.count > 1 ? `${group.id}_${index}` : group.id,
        count: 1,
      });
    }
  }
  return out;
};

/** "+1 to one of these abilities" picker. */
const abilityGroup = (...keys: string[]): FeatOptionGroup =>
  optionGroup("ability", "feat.opt.abilityScore", "Ability Score", ABILITIES.filter((a) => keys.includes(a.value)));

const ALL_ABILITIES = ["str", "dex", "con", "int", "wis", "cha"];

const ARTISAN_TOOLS = TOOLS.filter((tool) => /Supplies|Tools|Utensils/.test(tool.value) && tool.value !== "Thieves' Tools" && tool.value !== "Navigator's Tools");

const WEAPONS: FeatOptionChoice[] = [
  "Club", "Dagger", "Greatclub", "Handaxe", "Javelin", "Light Hammer", "Mace", "Quarterstaff", "Sickle", "Spear",
  "Light Crossbow", "Dart", "Shortbow", "Sling",
  "Battleaxe", "Flail", "Glaive", "Greataxe", "Greatsword", "Halberd", "Lance", "Longsword", "Maul", "Morningstar",
  "Pike", "Rapier", "Scimitar", "Shortsword", "Trident", "War Pick", "Warhammer", "Whip",
  "Blowgun", "Hand Crossbow", "Heavy Crossbow", "Longbow", "Net",
].map((name) => ({ value: name, label: name }));

const FEAT_OPTIONS: Record<string, FeatOptionGroup[]> = {
  Athlete: [abilityGroup("str", "dex")],
  "Lightly Armored": [abilityGroup("str", "dex")],
  "Moderately Armored": [abilityGroup("str", "dex")],
  Observant: [abilityGroup("int", "wis")],
  "Tavern Brawler": [abilityGroup("str", "con")],
  "Weapon Master": repeated([
    abilityGroup("str", "dex"),
    optionGroup("weapon", "feat.opt.weapon", "Weapon", WEAPONS, 4),
  ]),
  "Dragon Fear": [abilityGroup("str", "con", "cha")],
  "Dragon Hide": [abilityGroup("str", "con", "cha")],
  "Elven Accuracy": [abilityGroup("dex", "int", "wis", "cha")],
  "Fade Away": [abilityGroup("dex", "int")],
  "Fey Teleportation": [abilityGroup("int", "cha")],
  "Flames of Phlegethos": [abilityGroup("int", "cha")],
  "Orcish Fury": [abilityGroup("str", "con")],
  "Second Chance": [abilityGroup("dex", "con", "cha")],
  "Squat Nimbleness": [
    abilityGroup("str", "dex"),
    optionGroup("skill", "feat.opt.skill", "Skill", SKILLS.filter((s) => s.value === "Acrobatics" || s.value === "Athletics")),
  ],
  "Wood Elf Magic": [spellGroup("cantrip", "feat.opt.cantrip", "Cantrip", { level: 0, classes: ["druid"] })],
  "Artificer Initiate": [
    spellGroup("cantrip", "feat.opt.cantrip", "Cantrip", { level: 0, classes: ["artificer"] }),
    spellGroup("first_level_spell", "feat.opt.firstLevelSpell", "1st-Level Spell", { level: 1, classes: ["artificer"] }),
    optionGroup("tool", "feat.opt.tool", "Tool", ARTISAN_TOOLS),
  ],
  Chef: [abilityGroup("con", "wis")],
  Crusher: [abilityGroup("str", "con")],
  "Fey Touched": [
    abilityGroup("int", "wis", "cha"),
    spellGroup("first_level_spell", "feat.opt.firstLevelSpell", "1st-Level Spell", { level: 1, schools: ["Divination", "Enchantment"] }),
  ],
  Piercer: [abilityGroup("str", "dex")],
  "Shadow Touched": [
    abilityGroup("int", "wis", "cha"),
    spellGroup("first_level_spell", "feat.opt.firstLevelSpell", "1st-Level Spell", { level: 1, schools: ["Illusion", "Necromancy"] }),
  ],
  Slasher: [abilityGroup("str", "dex")],
  Telekinetic: [abilityGroup("int", "wis", "cha")],
  Telepathic: [abilityGroup("int", "wis", "cha")],
  "Revenant Blade": [abilityGroup("str", "dex")],
  "Gift of the Gem Dragon": [abilityGroup("int", "wis", "cha")],

  "Aberrant Dragonmark": repeated([
    {
      id: "cantrip",
      labelId: "feat.opt.cantrip",
      label: "Cantrip",
      type: "spell",
      count: 1,
      spell: { level: 0, classes: ["sorcerer"] },
    },
    {
      id: "first_level_spell",
      labelId: "feat.opt.firstLevelSpell",
      label: "1st-Level Spell",
      type: "spell",
      count: 1,
      spell: { level: 1, classes: ["sorcerer"] },
    },
  ]),

  "Elemental Adept": repeated([
    optionGroup("damage_type", "feat.opt.damageType", "Damage Type", DAMAGE_TYPES),
  ]),

  "Eldritch Adept": repeated([
    optionGroup("invocation", "feat.opt.invocation", "Eldritch Invocation", INVOCATIONS),
  ]),

  "Fighting Initiate": repeated([
    optionGroup("fighting_style", "feat.opt.fightingStyle", "Fighting Style", FIGHTING_STYLES),
  ]),

  "Divinely Favored": repeated([
    {
      id: "cantrip",
      labelId: "feat.opt.cantrip",
      label: "Cantrip",
      type: "spell",
      count: 1,
      spell: { level: 0, classes: ["cleric"] },
    },
    {
      id: "first_level_spell",
      labelId: "feat.opt.firstLevelSpell",
      label: "1st-Level Spell",
      type: "spell",
      count: 1,
      spell: { level: 1, classes: ["cleric"] },
    },
  ]),

  Linguist: repeated([
    optionGroup("language", "feat.opt.language", "Language", LANGUAGES, 3),
  ]),

  "Magic Initiate": repeated([
    optionGroup("spell_class", "feat.opt.spellClass", "Spell List Class", SPELLCASTING_CLASSES),
    {
      id: "cantrip",
      labelId: "feat.opt.cantrip",
      label: "Cantrip",
      type: "spell",
      count: 2,
      spell: { level: 0, classFromOptionId: "spell_class" },
    },
    {
      id: "first_level_spell",
      labelId: "feat.opt.firstLevelSpell",
      label: "1st-Level Spell",
      type: "spell",
      count: 1,
      spell: { level: 1, classFromOptionId: "spell_class" },
    },
  ]),

  "Martial Adept": repeated([
    optionGroup("maneuver", "feat.opt.maneuver", "Maneuver", MANEUVERS, 2),
  ]),

  "Metamagic Adept": repeated([
    optionGroup("metamagic", "feat.opt.metamagic", "Metamagic", METAMAGIC, 2),
  ]),

  Prodigy: [
    optionGroup("skill", "feat.opt.skill", "Skill", SKILLS),
    optionGroup("tool", "feat.opt.tool", "Tool", TOOLS),
    optionGroup("language", "feat.opt.language", "Language", LANGUAGES),
    optionGroup("expertise", "feat.opt.expertise", "Expertise", SKILLS),
  ],

  Resilient: repeated([
    optionGroup("ability", "feat.opt.abilityScore", "Ability Score", ABILITIES),
  ]),

  "Ritual Caster": repeated([
    optionGroup("spell_class", "feat.opt.spellClass", "Spell List Class", SPELLCASTING_CLASSES),
    {
      id: "ritual_spell",
      labelId: "feat.opt.ritualSpell",
      label: "1st-Level Ritual Spell",
      type: "spell",
      count: 2,
      spell: { level: 1, classFromOptionId: "spell_class", ritualOnly: true },
    },
  ]),

  Skilled: repeated([
    optionGroup("skill_or_tool", "feat.opt.skillOrTool", "Skill or Tool", [...SKILLS, ...TOOLS], 3),
  ]),

  "Skill Expert": [
    abilityGroup(...ALL_ABILITIES),
    optionGroup("skill", "feat.opt.skill", "Skill", SKILLS),
    optionGroup("expertise", "feat.opt.expertise", "Expertise", SKILLS),
  ],

  "Spell Sniper": repeated([
    {
      id: "cantrip",
      labelId: "feat.opt.cantrip",
      label: "Cantrip",
      type: "spell",
      count: 1,
      spell: {
        level: 0,
        classes: ["bard", "cleric", "druid", "sorcerer", "warlock", "wizard"],
      },
    },
  ]),
};

/**
 * 2024 Origin feats (SRD 5.2). Magic Initiate draws from the Cleric, Druid or
 * Wizard list, and its spellcasting ability is a pick of its own (no increase).
 * A background that names the list ("Magic Initiate (Cleric)") fixes spell_class.
 */
const FEAT_OPTIONS_2024: Record<string, FeatOptionGroup[]> = {
  "Magic Initiate": repeated([
    optionGroup("spell_class", "feat.opt.spellClass", "Spell List Class", SPELLCASTING_CLASSES.filter((c) => ["cleric", "druid", "wizard"].includes(c.value))),
    optionGroup("spell_ability", "feat.opt.spellAbility", "Spellcasting Ability", ABILITIES.filter((a) => ["int", "wis", "cha"].includes(a.value))),
    spellGroup("cantrip", "feat.opt.cantrip", "Cantrip", { level: 0, classFromOptionId: "spell_class" }, 2),
    spellGroup("first_level_spell", "feat.opt.firstLevelSpell", "1st-Level Spell", { level: 1, classFromOptionId: "spell_class" }),
  ]),
  Skilled: repeated([
    optionGroup("skill_or_tool", "feat.opt.skillOrTool", "Skill or Tool", [...SKILLS, ...TOOLS], 3),
  ]),
};

export function getFeatOptionGroups(featName: string, ruleset?: string): FeatOptionGroup[] {
  if (ruleset === "2024") return FEAT_OPTIONS_2024[featName] ?? [];
  return FEAT_OPTIONS[featName] ?? [];
}

export function hasFeatOptions(featName: string, ruleset?: string): boolean {
  return getFeatOptionGroups(featName, ruleset).length > 0;
}

export { FEAT_OPTIONS };
