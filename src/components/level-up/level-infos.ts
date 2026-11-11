/**
 * Data layer of the level-up: what each level gives and asks (buildLevelInfos),
 * and which screens a level needs. No React here.
 */
import { getStaticClass, getStaticSubclasses, getStaticSpells, getSubclassFlags, getStaticEquipments, getStaticRace } from "@/lib/srd-client";
import { getHitDieAverage, getModifier, getBardicInspirationDie, getMaxSpellLevel, isThirdCaster, getSpellSlotTable, getFeatureValue, getWarlockExpandedSpellNames, type Character } from "@/lib/storage";
import { normalizeDescription } from "@/lib/level-up";
import invocationsData from "@/data/warlock_invocations.json";
import { type LevelPicks } from "@/lib/level-choices";
import { getOptionalClassFeatures, getOptionalChoiceOptions, isReplacedFeature, usesOptionalClassFeatures } from "@/data/optional-class-features";
import { isRecommended } from "@/lib/recommendations";

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function getSubclassFlagsByName(className: string, subclassName: string, sources: string[] | undefined, language: string): Record<string, boolean> {
  if (!subclassName) return {};
  const subclasses = getStaticSubclasses(className, sources, undefined, language);
  const found = subclasses.find(s => s.name.toLowerCase() === subclassName.toLowerCase());
  if (!found?.index) return {};
  return getSubclassFlags(found.index);
}

export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

export const ABILITIES: { key: AbilityKey; label: string; full: string }[] = [
  { key: "str", label: "STR", full: "Strength" },
  { key: "dex", label: "DEX", full: "Dexterity" },
  { key: "con", label: "CON", full: "Constitution" },
  { key: "int", label: "INT", full: "Intelligence" },
  { key: "wis", label: "WIS", full: "Wisdom" },
  { key: "cha", label: "CHA", full: "Charisma" },
];

export interface InvocationPrerequisite {
  level: number;
  requires?: string;
  source?: string;
}

export const invocationPrereqs: Record<string, InvocationPrerequisite> = (invocationsData as any).invocations || {};

export function getAvailableInvocations(level: number, pactBoon: string, knownInvocations: string[], knowsEldritchBlast: boolean, sources: string[] | undefined, usesTasha: boolean): { name: string; available: boolean; reason?: string }[] {
  // Xanathar's invocations need that book; Tasha's ones are optional class features.
  const allInvocations = Object.keys(invocationPrereqs).filter((name) => {
    const src = invocationPrereqs[name]?.source;
    if (!src) return true;
    if (src === "TCE") return usesTasha;
    return !sources || sources.length === 0 || sources.includes(src);
  });
  return allInvocations.map((name) => {
    const prereq = invocationPrereqs[name];
    if (!prereq) return { name, available: true };
    if (level < prereq.level) return { name, available: false, reason: `Requires level ${prereq.level}` };
    if (prereq.requires) {
      const req = prereq.requires.toLowerCase();
      if (req.includes("pact of the blade") && pactBoon !== "Pact of the Blade") return { name, available: false, reason: "Requires Pact of the Blade" };
      if (req.includes("pact of the chain") && pactBoon !== "Pact of the Chain") return { name, available: false, reason: "Requires Pact of the Chain" };
      if (req.includes("pact of the tome") && pactBoon !== "Pact of the Tome") return { name, available: false, reason: "Requires Pact of the Tome" };
      if (req.includes("pact of the talisman") && pactBoon !== "Pact of the Talisman") return { name, available: false, reason: "Requires Pact of the Talisman" };
      if (req.includes("eldritch blast") && !knowsEldritchBlast) return { name, available: false, reason: "Requires the Eldritch Blast cantrip" };
    }
    return { name, available: true };
  });
}

export const TOOL_EMOJI_MAP: Record<string, string> = {
  "Alchemist's Supplies": "⚗️",
  "Brewer's Supplies": "🍺",
  "Calligrapher's Supplies": "✒️",
  "Carpenter's Tools": "🪚",
  "Cartographer's Tools": "🗺️",
  "Cobbler's Tools": "👞",
  "Cook's utensils": "🍳",
  "Dice Set": "🎲",
  "Drum": "🥁",
  "Dulcimer": "🎵",
  "Flute": "🎵",
  "Glassblower's Tools": "🫧",
  "Horn": "📯",
  "Jeweler's Tools": "💎",
  "Leatherworker's Tools": "🧵",
  "Lute": "🎵",
  "Lyre": "🎵",
  "Mason's Tools": "🧱",
  "Navigator's Tools": "🧭",
  "Painter's Supplies": "🎨",
  "Pan flute": "🎵",
  "Playing Card Set": "🃏",
  "Potter's Tools": "🏺",
  "Shawm": "🎵",
  "Smith's Tools": "⚒️",
  "Thieves' Tools": "🔓",
  "Tinker's Tools": "🔧",
  "Viol": "🎵",
  "Weaver's Tools": "🪡",
  "Woodcarver's Tools": "🪵",
};

export function toolEmoji(name: string): string {
  return TOOL_EMOJI_MAP[name] || "🔧";
}

export interface LevelUpWizardProps {
  character: Character;
  onCancel: () => void;
  onComplete: (character: Character) => void;
  minLevel?: number;
  maxLevel?: number;
  title?: string;
  subtitle?: string;
  startFromLevelOne?: boolean;
  /** Level to aim for on open (creation starts at level 1 otherwise). */
  initialLevel?: number;
  /**
   * Quick create: take the top suggestion for every choice and finish on its
   * own, showing `autoView` meanwhile. If some choice can't be filled,
   * `onAutoStuck` is called and the normal screens show so the player can finish.
   */
  auto?: boolean;
  autoView?: React.ReactNode;
  onAutoStuck?: () => void;
  /**
   * Picking the subclass again on a finished character: only the subclass
   * screens show (subclass, its feature picks, its spells), HP stays as it is,
   * and ability scores and class picks are left alone.
   */
  subclassOnly?: boolean;
  /** A header button that fills every open pick with its top suggestion. */
  suggestAll?: boolean;
  /**
   * Changing one past level's picks: the wizard asks only that level
   * (maxLevel), starts from these picks, and leaves HP alone. Picks the log
   * doesn't have (older saves) aren't asked.
   */
  redo?: LevelPicks;
}

export interface LevelInfo {
  level: number;
  hp: { hitDie: number; conMod: number; average: number };
  proficiencyBonus: number;
  features: { name: string; description: string; summary?: string; source?: string }[];
  asi: boolean;
  spellSlots?: Record<number, number>;
  cantripsKnown?: number;
  spellsKnown?: number;
  classFeatures: { name: string; value: string }[];
  subclassOptions?: { name: string; description: string; hasDetails: boolean }[];
  subclassFeatureChoices?: { name: string; description: string; options: { name: string; description: string; icon?: string }[]; count?: number }[];
  classFeatureChoices?: { name: string; description: string; options: { name: string; description: string; icon?: string }[]; count?: number }[];
  hasSpellSelection: boolean;
  spellSelectionType: "known" | "book" | "prepare";
  spellSelectionCount: number;
  cantripSelectionCount: number;
  maxSpellLevel: number;
  spellsKnownChanged?: boolean;
  prevSpellsKnown?: number;
  magicalSecretsCount: number;
  canReplaceSpell: boolean;
  subclassSpellSelectionCount: number;
  circleTerrainSelection: boolean;
  bonusCantripSelection: boolean;
  spellbookTotal?: number;
  maxPrepared?: number;
  preparedCount?: number;
  expertise?: { count: number; selected: string[]; availableOptions: string[] };
}

export type ChoiceOption = { name: string; description: string; icon?: string };

// Tasha's fighting styles each class may add when the table uses optional class features.
// Blessed Warrior and Druidic Warrior are left out: they teach cantrips the wizard can't grant yet.
export const TCE_FIGHTING_STYLES: Record<string, string[]> = {
  Fighter: ["Blind Fighting", "Interception", "Superior Technique", "Thrown Weapon Fighting", "Unarmed Fighting"],
  Paladin: ["Blind Fighting", "Interception"],
  Ranger: ["Blind Fighting", "Thrown Weapon Fighting"],
};

export function fightingStyleOptions(className: string, options: ChoiceOption[], usesTasha: boolean, language: string): ChoiceOption[] {
  const allTasha = new Set(Object.values(TCE_FIGHTING_STYLES).flat());
  const base = options.filter((o) => !allTasha.has(o.name));
  if (!usesTasha) return base;
  const fighterStyles = getStaticClass("Fighter", undefined, undefined, language)?.levels[0]?.features.find((f: any) => f.name === "Fighting Style") as any;
  const tasha = (TCE_FIGHTING_STYLES[className] || []).map((name) => {
    const opt = (fighterStyles?.choices?.options || []).find((o: any) => (typeof o === "string" ? o : o.name) === name);
    return opt && typeof opt !== "string" ? { name, description: opt.description || "", icon: opt.icon } : { name, description: "" };
  });
  return [...base, ...tasha].sort((a, b) => a.name.localeCompare(b.name));
}

// Expertise doubles a proficiency you already have: skills you are proficient in, or a rogue's thieves' tools.
export function expertiseOptions(className: string, options: ChoiceOption[], character: Character): ChoiceOption[] {
  const skills = character.skills || {};
  const has = new Set(character.expertise || []);
  const proficient = Object.keys(skills).filter((name) => skills[name] && !has.has(name));
  const names = className === "Rogue" && !has.has("Thieves' Tools") ? [...proficient, "Thieves' Tools"] : proficient;
  // Skills may not be picked yet when the level step comes first; offer the full list then.
  if (proficient.length === 0) return options;
  return names.sort().map((name) => options.find((o) => o.name === name) || { name, description: "" });
}

// Mystic Arcanum: any warlock spell of that level from the character's books, plus the patron's expanded spells.
export function mysticArcanumOptions(featureName: string, options: ChoiceOption[], character: Character, subclass: string, language: string): ChoiceOption[] {
  const spellLevel = Number(featureName.match(/\((\d)/)?.[1]);
  if (!spellLevel) return options;
  const all = getStaticSpells(character.sources, character.ruleset, language);
  const expanded = new Set(getWarlockExpandedSpellNames(character, subclass));
  const names = new Set(
    all.filter((sp) => sp.level === spellLevel && ((sp.classes || []).includes("Warlock") || expanded.has(sp.name))).map((sp) => sp.name)
  );
  for (const o of options) names.add(o.name);
  return [...names].sort().map((name) => options.find((o) => o.name === name) || { name, description: all.find((sp) => sp.name === name)?.school || "" });
}

export function getProficiencyBonus(level: number): number {
  if (level <= 4) return 2;
  if (level <= 8) return 3;
  if (level <= 12) return 4;
  if (level <= 16) return 5;
  return 6;
}

export function buildLevelInfos(
  character: Character,
  targetLevel: number,
  classData: ReturnType<typeof getStaticClass>,
  subclassSelection: string,
  startLevel: number,
  showLevelOne: boolean,
  language: string
): LevelInfo[] {
  if (!classData) return [];

  const infos: LevelInfo[] = [];
  const hitDie = classData.hitDie || 10;
  const conMod = getModifier(character.con);
  const averageHp = getHitDieAverage(hitDie) + conMod;
  const className = classData.name;

  const loopStart = showLevelOne ? 1 : startLevel + 1;

  for (let level = loopStart; level <= targetLevel; level++) {
    const levelData = classData.levels[level - 1];
    const prevLevelData = level > 1 ? classData.levels[level - 2] : null;

    // Tasha's optional features the table turned on, up to this level.
    const optional = getOptionalClassFeatures({ ...character, level });
    const optionalHere = optional.filter((f) => f.level === level);

    const features = (levelData?.features || [])
      .filter((f: any) => !isReplacedFeature(f.name, optional))
      .filter((f: any) => {
        const src = f.source;
        if (!src) return true;
        if (src.type === "class") return src.name === className;
        if (src.type === "subclass") return src.name === subclassSelection;
        if (f.choices) return false;
        return true;
      })
      .map((f: any) => ({
        name: f.name,
        description: normalizeDescription(f.description),
        summary: (typeof f.summary === "string" ? f.summary : undefined) as string | undefined,
      }))
      .concat(optionalHere.filter((f) => !f.hidden).map((f) => ({
        name: f.name,
        description: f.text[language as "en" | "id"] || f.text.en,
        summary: undefined,
      })));

    const asi = levelData?.asi || false;
    let spellSlots = levelData?.spellSlots;

    // Eldritch Knight and Arcane Trickster use their own spell slot progression
    const isThirdCasterSubclass = isThirdCaster(subclassSelection);
    if (!spellSlots && isThirdCasterSubclass) {
      spellSlots = getSpellSlotTable(classData, level, subclassSelection);
    }

    // Fighters and rogues only cast with a third-caster subclass.
    const rogueWithoutArcaneTrickster = (className === "Rogue" || className === "Fighter") && !isThirdCasterSubclass;

    let cantripsKnown: number | undefined;
    if (classData.cantripsKnown && !rogueWithoutArcaneTrickster) {
      if (Array.isArray(classData.cantripsKnown)) {
        const idx = Math.min(level - 1, classData.cantripsKnown.length - 1);
        cantripsKnown = classData.cantripsKnown[idx >= 0 ? idx : 0];
      } else {
        const levels = Object.keys(classData.cantripsKnown).map(Number).sort((a, b) => a - b);
        for (const l of levels) {
          if (level >= l) cantripsKnown = (classData.cantripsKnown as Record<number, number>)[l];
        }
      }
    }

    let spellsKnown: number | undefined;
    if ((classData as any)?.spellsKnown && !rogueWithoutArcaneTrickster) {
      const known = (classData as any).spellsKnown;
      if (known[String(level)] !== undefined) {
        spellsKnown = known[String(level)];
      }
    }

    const spellsKnownByLevel: Record<string, Record<number, number>> = {
      Sorcerer: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 11, 11: 12, 12: 12, 13: 13, 14: 13, 15: 14, 16: 14, 17: 15, 18: 15, 19: 15, 20: 15 },
      Bard: { 1: 4, 2: 5, 3: 6, 4: 7, 5: 8, 6: 9, 7: 10, 8: 11, 9: 12, 10: 14, 11: 15, 12: 15, 13: 16, 14: 18, 15: 19, 16: 19, 17: 20, 18: 22, 19: 22, 20: 22 },
      Warlock: { 1: 2, 2: 3, 3: 4, 4: 5, 5: 6, 6: 7, 7: 8, 8: 9, 9: 10, 10: 10, 11: 11, 12: 11, 13: 12, 14: 12, 15: 13, 16: 13, 17: 14, 18: 14, 19: 15, 20: 15 },
      Ranger: { 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 5, 9: 6, 10: 6, 11: 7, 12: 7, 13: 8, 14: 8, 15: 9, 16: 9, 17: 10, 18: 10, 19: 11, 20: 11 },
    };
    if (spellsKnown === undefined && spellsKnownByLevel[className] && spellsKnownByLevel[className][level]) {
      spellsKnown = spellsKnownByLevel[className][level];
    }

    const classFeatures: { name: string; value: string }[] = [];

    if (className === "Bard") {
      classFeatures.push({ name: "Bardic Inspiration", value: `${getBardicInspirationDie({ ...character, level } as Character)}` });
    }

    const featureNames = [
      "Rage Uses", "Rage Damage", "Channel Divinity", "Wild Shape",
      "Action Surge", "Indomitable", "Ki Points", "Martial Arts",
      "Sneak Attack", "Sorcery Points", "Invocations", "Spellbook",
      "Lay on Hands", "Bardic Inspiration Uses", "Song of Rest",
      "Movement",
    ];

    for (const name of featureNames) {
      const value = getFeatureValue(name, { ...character, level } as Character);
      if (value) {
        classFeatures.push({ name, value });
      }
    }

    const unlockLevel = classData.subclassLevel ?? 3;
    const subclasses = getStaticSubclasses(className, character.sources, undefined, language);
    const subclassOptions = level === unlockLevel && !character.subclass && subclasses.length > 0
      ? subclasses.map((s) => ({ name: s.name, description: s.description, hasDetails: true })).sort((a, b) => (isRecommended("subclass", b.name, className) ? 1 : 0) - (isRecommended("subclass", a.name, className) ? 1 : 0))
      : undefined;

    const subclassFeatureChoices: { name: string; description: string; options: { name: string; description: string }[]; count?: number }[] = [];
    const usesTasha = usesOptionalClassFeatures(character);
    const passiveSubclassFeatures: { name: string; description: string; source?: string }[] = [];
    // A language pick (Blessings of Knowledge, Draconic Gift) skips languages the
    // character already speaks from race, background or another pick.
    const knownLanguages = new Set([
      ...(character.languages || []),
      ...(getStaticRace(character.race, character.ruleset)?.languages || []),
    ]);
    if (subclassSelection && level >= unlockLevel) {
      const selectedSubclass = subclasses.find((s) => s.name === subclassSelection);
      if (selectedSubclass) {
        const subclassSource = selectedSubclass.source;
        const earnedFeatures = selectedSubclass.features.filter(
          (f) => f.level != null && f.level === level
        );
        for (const f of earnedFeatures) {
          const desc = Array.isArray(f.description) ? f.description.join(" ") : (f.description || "");
          if (f.choices && f.choices.length > 0) {
            // When the same feature comes back at a later level (Disciple of the
            // Elements, Combat Superiority), the options picked before are gone.
            // Later picks of one feature ("Path of the Kensei: 6th-level Weapon")
            // also skip what the feature itself picked.
            const base = f.name.split(":")[0];
            const pickedBefore = new Set(
              Object.entries(character.featureSelections || {})
                .filter(([key]) => {
                  const m = key.match(/^subclass-feature-\d+-(.*)$/);
                  return !!m && m[1].split(":")[0] === base && key !== `subclass-feature-${level}-${f.name}`;
                })
                .flatMap(([, v]) => (v || []).flatMap((s) => String(s).split(", ")))
            );
            subclassFeatureChoices.push({
              name: f.name,
              description: desc,
              options: f.choices!
                .filter((c: any) => (!c.minLevel || c.minLevel <= level) && !pickedBefore.has(c.name) && !knownLanguages.has(c.name) && (!c.optional || usesTasha))
                .map((c: any) => ({ name: c.name, description: c.description || "", icon: c.icon })),
              count: (f as any).choicesCountByLevel?.[String(level)] ?? f.choicesCount ?? 1,
            });
          } else if (!isReplacedFeature(f.name, optional)) {
            passiveSubclassFeatures.push({ name: f.name, description: desc, source: subclassSource });
          }
        }
      }
    }

    // Class feature choices (e.g., Primal Knowledge for Barbarian)
    const classFeatureChoices: { name: string; description: string; options: { name: string; description: string; icon?: string }[]; count?: number }[] = [];
    const levelFeatures = classData.levels[level - 1]?.features || [];
    for (const feature of levelFeatures) {
      const f = feature as any;
      if (isReplacedFeature(f.name, optional)) continue;
      // Magical Secrets has its own picker below.
      if (f.name === "Magical Secrets") continue;
      if (f.choices && f.choices.type === "tools") {
        const tools = getStaticEquipments([], character.ruleset).filter((e: any) => e.equipment_category === "Tools");
        classFeatureChoices.push({
          name: f.name,
          description: f.description || "",
          options: tools.map((t: any) => ({
            name: t.name,
            description: t.description || "",
            icon: toolEmoji(t.name),
          })),
          count: f.choices.count || 1,
        });
      } else if (f.choices && f.choices.options && f.choices.options.length > 0) {
        let options = f.choices.options.map((opt: any) => ({
          name: typeof opt === "string" ? opt : opt.name,
          description: typeof opt === "string" ? "" : (opt.description || ""),
          icon: typeof opt === "string" ? undefined : opt.icon,
        }));
        if (f.name === "Fighting Style") options = fightingStyleOptions(className, options, usesOptionalClassFeatures(character), language);
        if (f.name === "Expertise") options = expertiseOptions(className, options, character);
        if (f.name.startsWith("Mystic Arcanum")) options = mysticArcanumOptions(f.name, options, { ...character, level }, subclassSelection, language);
        // Metamagic and other repeat picks skip what earlier level-ups saved.
        const pickedBefore = new Set(
          Object.entries(character.featureSelections || {})
            .filter(([key]) => key !== `class-feature-${level}-${f.name}` && key.match(/^class-feature-\d+-(.*)$/)?.[1] === f.name)
            .flatMap(([, v]) => (v || []).flatMap((x) => String(x).split(", ")))
        );
        if (pickedBefore.size) options = options.filter((o: ChoiceOption) => !pickedBefore.has(o.name));
        classFeatureChoices.push({
          name: f.name,
          description: f.description || "",
          options,
          count: f.choices.count || 1,
        });
      }
    }

    for (const f of optionalHere) {
      if (!f.choice) continue;
      classFeatureChoices.push({
        name: f.name,
        description: f.text[language as "en" | "id"] || f.text.en,
        options: getOptionalChoiceOptions(f, character).map((name) => ({ name, description: "" })),
        count: f.choice.count,
      });
    }

    const prevSlots = prevLevelData?.spellSlots || {};
    const slotsChanged = spellSlots && (Object.keys(spellSlots).length !== Object.keys(prevSlots).length ||
      Object.entries(spellSlots).some(([k, v]) => prevSlots[Number(k)] !== v));

    let prevCantrips = 0;
    if (prevLevelData && classData.cantripsKnown) {
      if (Array.isArray(classData.cantripsKnown)) {
        const prevIdx = Math.min(level - 2, classData.cantripsKnown.length - 1);
        prevCantrips = classData.cantripsKnown[prevIdx >= 0 ? prevIdx : 0] || 0;
      } else {
        const levels = Object.keys(classData.cantripsKnown).map(Number).sort((a, b) => a - b);
        for (const l of levels) {
          if (level - 1 >= l) prevCantrips = (classData.cantripsKnown as Record<number, number>)[l] || 0;
        }
      }
    }
    const cantripsDelta = cantripsKnown !== undefined ? cantripsKnown - prevCantrips : 0;
    const cantripsChanged = cantripsDelta > 0;

    // Calculate spells known change
    const prevSpellsKnownRaw = prevLevelData ? ((classData as any)?.spellsKnown?.[String(level - 1)] || 0) : 0;
    const prevSpellsKnownFromTable = (spellsKnownByLevel[className] && spellsKnownByLevel[className][level - 1]) || 0;
    const prevSpellsKnown = prevSpellsKnownRaw || prevSpellsKnownFromTable;
    const spellsKnownChanged = spellsKnown !== undefined && spellsKnown > prevSpellsKnown;

    const isArcaneTrickster = isThirdCasterSubclass;
    const maxSpellLevel = spellSlots
      ? Math.max(...Object.keys(spellSlots).map(Number))
      : getMaxSpellLevel(className, level, character.ruleset);

    // Spell selection count is based on class-specific rules, NEVER on slot counts
    const isSpellsKnownCaster = ["Sorcerer", "Bard", "Warlock", "Ranger"].includes(className);
    const isPrepCaster = ["Cleric", "Druid", "Artificer", "Paladin"].includes(className);
    let spellSelectionCount = isSpellsKnownCaster
      ? (spellsKnownChanged ? (spellsKnown || 0) - prevSpellsKnown : 0)
      : (className === "Wizard" ? 2 : 0);

    // Wizard uses spellbookSpells for starting spell count: 6 at level 1, +2 per additional level
    if (className === "Wizard" && (classData as any)?.spellbookSpells) {
      const sb = (classData as any).spellbookSpells as Record<string, number>;
      const currentTotal = sb[String(level)] || 0;
      const prevTotal = level > 1 ? (sb[String(level - 1)] || 0) : 0;
      spellSelectionCount = currentTotal - prevTotal;
    }

    // Arcane Trickster: spells known progression (like Wizard but half-caster)
    if (isArcaneTrickster && (classData as any)?.spellsKnown) {
      const known = (classData as any).spellsKnown as Record<string, number>;
      const currentTotal = known[String(level)] || 0;
      const prevTotal = level > 1 ? (known[String(level - 1)] || 0) : 0;
      spellSelectionCount = currentTotal - prevTotal;
    }

    // Preparation casters (Cleric, Druid): prepare Wisdom mod + level spells
    // A paladin has no spells before 2nd level, so nothing to prepare.
    if (isPrepCaster && classData.spellcastingAbility && spellSlots && Object.keys(spellSlots).length > 0) {
      const abilityScore = character[classData.spellcastingAbility as keyof Character] as number;
      const abilityMod = getModifier(abilityScore || 10);
      if (className === "Artificer" || className === "Paladin") {
        // Artificer and Paladin: ability modifier + half class level, rounded down (minimum 1)
        const maxPrepared = Math.max(1, abilityMod + Math.floor(level / 2));
        spellSelectionCount = maxPrepared;
      } else {
        const maxPrepared = Math.max(1, abilityMod + level);
        spellSelectionCount = maxPrepared;
      }
    }

    const isBard = className === "Bard";
    const isSorcerer = className === "Sorcerer";
    const magicalSecretsLevels = [10, 14, 18];
    const magicalSecretsCount = isBard && magicalSecretsLevels.includes(level) ? 2 : 0;
    // Magical Secrets spells are part of the Spells Known column, not extra.
    if (magicalSecretsCount > 0) spellSelectionCount = Math.max(0, spellSelectionCount - magicalSecretsCount);
    // Classes that learn a fixed list of spells may swap one of them each level.
    const swapsSpells = isBard || isSorcerer || className === "Warlock" || className === "Ranger" || isThirdCasterSubclass;
    const canReplaceSpell = swapsSpells && level > 1 && (character.spells || []).some((s) => s.level > 0);
    const subclassFlags = getSubclassFlagsByName(className, subclassSelection || "", character.sources, language);
    const isLoreBard = isBard && subclassFlags.grantsMagicalSecrets;
    const subclassSpellSelectionCount = isLoreBard && level === 6 ? 2 : 0;

    const hasSpellSelectionFromClass = !!(classData.spellcastingAbility && (slotsChanged || cantripsChanged || spellsKnownChanged));
    const hasSpellSelection = hasSpellSelectionFromClass || (isArcaneTrickster && (slotsChanged || cantripsChanged || spellsKnownChanged)) || spellSelectionCount > 0 || cantripsDelta > 0;

    const spellSelectionType: "known" | "book" | "prepare" = isPrepCaster ? "prepare" : (className === "Wizard" ? "book" : "known");

    const spellbookTotal = (className === "Wizard" && (classData as any)?.spellbookSpells)
      ? ((classData as any).spellbookSpells as Record<string, number>)[String(level)] || 0
      : undefined;
    const prepAbilityScore = character[classData.spellcastingAbility as keyof Character] as number;
    const prepAbilityMod = getModifier(prepAbilityScore || 10);
    const maxPrepared = isPrepCaster && classData.spellcastingAbility
      ? Math.max(1, className === "Artificer" || className === "Paladin" ? prepAbilityMod + Math.floor(level / 2) : prepAbilityMod + level)
      : undefined;
    const preparedCount = isPrepCaster && maxPrepared ? maxPrepared : undefined;

    // Rogue Expertise
    let expertise: LevelInfo["expertise"];
    if (className === "Rogue") {
      const expertiseScaling = (classData as any).scalingFeatures?.find((f: any) => f.type === "feature" && f.name === "Expertise");
      if (expertiseScaling?.values) {
        const sortedLevels = Object.keys(expertiseScaling.values).map(Number).sort((a, b) => a - b);
        const currentIndex = sortedLevels.indexOf(level);
        if (currentIndex >= 0) {
          const currentValue = expertiseScaling.values[level];
          const prevValue = currentIndex > 0 ? (expertiseScaling.values[sortedLevels[currentIndex - 1]] || 0) : 0;
          if (currentValue > prevValue) {
            const newCount = currentValue - prevValue;
            const proficientSkills = Object.entries(character.skills)
              .filter(([, proficient]) => proficient)
              .map(([name]) => name);
            const hasThievesTools = character.class === "Rogue";
            const allOptions = [...proficientSkills];
            if (hasThievesTools && !allOptions.includes("Thieves' Tools")) {
              allOptions.push("Thieves' Tools");
            }
            const currentExpertise = character.expertise || [];
            const availableOptions = allOptions.filter(opt => !currentExpertise.includes(opt));
            expertise = {
              count: newCount,
              selected: [],
              availableOptions,
            };
          }
        }
      }
    }

    // A subclass feature with the same name as a class feature (Oath Spells) replaces it here.
    const subclassNames = new Set(passiveSubclassFeatures.map((f) => f.name));
    const allFeatures = [...features.filter((f) => !subclassNames.has(f.name)), ...passiveSubclassFeatures];

    infos.push({
      level,
      hp: { hitDie, conMod, average: averageHp },
      proficiencyBonus: getProficiencyBonus(level),
      features: allFeatures,
      asi,
      spellSlots,
      cantripsKnown: cantripsKnown,
      spellsKnown: spellsKnown,
      classFeatures,
      subclassOptions,
      subclassFeatureChoices: subclassFeatureChoices.length > 0 ? subclassFeatureChoices : undefined,
      classFeatureChoices: classFeatureChoices.length > 0 ? classFeatureChoices : undefined,
      hasSpellSelection: hasSpellSelection,
      spellSelectionType: spellSelectionType,
      spellSelectionCount: spellSelectionCount,
      cantripSelectionCount: cantripsDelta,
      maxSpellLevel,
      spellsKnownChanged,
      prevSpellsKnown,
      magicalSecretsCount,
      canReplaceSpell,
      subclassSpellSelectionCount,
      // The land is chosen once (at 3rd level); ask only if it is still missing.
      circleTerrainSelection: className === "Druid" && subclassFlags.requiresTerrainSelection && !character.circleTerrain &&
        level === [3, 5, 7, 9].find((l) => l >= loopStart),
      bonusCantripSelection: className === "Druid" && subclassFlags.requiresTerrainSelection && level === 2,
      spellbookTotal: spellbookTotal,
      maxPrepared: maxPrepared,
      preparedCount: preparedCount,
      expertise,
    });
  }

  return infos;
}

/** One screen of the game-style level-up: the free gains, one kind of choice, or the recap. */
export type LevelPart = "moment" | "subclass" | "asi" | "features" | "spells";

/** The choice screens a level needs, in the order the wizard shows them. */
export function levelParts(info: LevelInfo, subclassSelection: string, className: string): LevelPart[] {
  const parts: LevelPart[] = [];
  if (info.subclassOptions && info.subclassOptions.length > 0) parts.push("subclass");
  if (info.asi) parts.push("asi");
  const features =
    (!!info.subclassFeatureChoices?.length && !!subclassSelection) ||
    !!info.classFeatureChoices?.length ||
    (!!info.expertise && info.expertise.count > 0) ||
    (className === "Wizard" && info.level === 18) ||
    (className === "Warlock" && info.level === 3) ||
    info.circleTerrainSelection;
  if (features) parts.push("features");
  if (info.hasSpellSelection || info.magicalSecretsCount > 0 || info.subclassSpellSelectionCount > 0 || info.canReplaceSpell || info.bonusCantripSelection) parts.push("spells");
  return parts;
}

/** Which screen an unfinished task (by its section id) belongs to. */
export function partOfSection(sectionId: string): LevelPart {
  if (sectionId.startsWith("hp-")) return "moment";
  if (sectionId.startsWith("asi-")) return "asi";
  if (sectionId.startsWith("subclass-fc-") || sectionId.startsWith("class-fc-") || sectionId.startsWith("expertise-")) return "features";
  if (sectionId.startsWith("subclass-")) return "subclass";
  return "spells";
}
