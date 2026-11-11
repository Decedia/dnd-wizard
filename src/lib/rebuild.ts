import { computeDerivedStats, createEmptyCharacter, isThirdCaster, type Character } from "./storage";
import { getStaticClass } from "./srd-client";
import { applyBackground, applySubclassFeatures, syncBaseFeatures } from "./character-creation";
import { getRaceAsi } from "./race-grants";
import { decodeFeatOptions, featAbilityIncreases } from "./feat-grants";
import { withSnapshot } from "./level-snapshot";
import { getGrantedSpellNames, syncGrantedSpells } from "./granted-spells";
import { levelUpIncreases } from "./level-choices";

/** The level a class picks its subclass at (Cleric 1, Wizard 2, most 3). */
export function subclassLevelOf(character: Pick<Character, "class" | "ruleset">): number {
  return getStaticClass(character.class, character.ruleset)?.subclassLevel ?? 3;
}

const isLand = (c: Pick<Character, "class" | "subclass">) => c.class === "Druid" && /land/i.test(c.subclass || "");

/**
 * The character as the level-up wizard should see it to pick a subclass again:
 * one level below the subclass level, with no subclass and none of its picks,
 * features or spells. Everything else (ability scores, class picks, HP) stays,
 * and the wizard only asks the subclass questions.
 */
export function subclassRewind(character: Character): Character {
  const level = subclassLevelOf(character);
  const featureSelections = Object.fromEntries(
    Object.entries(character.featureSelections || {}).filter(([key]) => !key.startsWith("subclass-feature-"))
  );
  let next: Character = {
    ...character,
    level: Math.max(1, level - 1),
    subclass: undefined,
    subclassIndex: undefined,
    features: (character.features || []).filter((f) => f.source !== "subclass"),
    featureSelections,
    levelChoices: withoutSubclassPicks(character.levelChoices),
  };
  // An Eldritch Knight's or Arcane Trickster's spells come from the subclass.
  if (isThirdCaster(character.subclass)) next = withoutChosenSpells(next);
  if (isLand(character)) next = { ...next, circleTerrain: "", circleSpells: [], bonusCantrips: [] };
  return syncGrantedSpells(next);
}

/** The level log without the subclass's own picks. */
function withoutSubclassPicks(log: Character["levelChoices"]): Character["levelChoices"] {
  if (!log) return log;
  return Object.fromEntries(Object.entries(log).map(([lvl, { subclassFeatures: _f, subclassSpells: _s, ...rest }]) => [lvl, rest]));
}

/** Only the free spells stay (race, feats' grants); the ones the player learned go. */
function withoutChosenSpells(character: Character): Character {
  const free = new Set(getGrantedSpellNames(character).map((n) => n.toLowerCase()));
  const spells = (character.spells || []).filter((s) => s.granted || free.has(s.name.toLowerCase()));
  const keptIds = new Set(spells.map((s) => s.id));
  return {
    ...character,
    spells,
    cantrips: (character.cantrips || []).filter((c) => free.has((c.name || "").toLowerCase())),
    preparedSpells: (character.preparedSpells || []).filter((id) => keptIds.has(id)),
  };
}

/**
 * The subclass picks from the wizard, put onto the character as it was before:
 * the new subclass, its picks, its features and its spells. Level, HP, ability
 * scores and class picks come from the character before.
 */
export function applySubclassRebuild(before: Character, wizardResult: Character, language = "en"): Character {
  const rewound = subclassRewind(before);
  const subclassPicks = Object.fromEntries(
    Object.entries(wizardResult.featureSelections || {}).filter(([key]) => key.startsWith("subclass-feature-"))
  );
  let next: Character = {
    ...rewound,
    level: before.level,
    subclass: wizardResult.subclass,
    subclassIndex: wizardResult.subclassIndex,
    featureSelections: { ...rewound.featureSelections, ...subclassPicks },
    // The new subclass's picks join each level's log.
    levelChoices: Object.fromEntries(
      [...new Set([...Object.keys(rewound.levelChoices || {}), ...Object.keys(wizardResult.levelChoices || {})])].map((lvl) => {
        const fresh = wizardResult.levelChoices?.[Number(lvl)];
        return [lvl, { ...rewound.levelChoices?.[Number(lvl)], ...(fresh?.subclassFeatures ? { subclassFeatures: fresh.subclassFeatures } : {}), ...(fresh?.subclassSpells ? { subclassSpells: fresh.subclassSpells } : {}) }];
      })
    ),
    // Skills, languages and tools a subclass pick gives (Blessings of Knowledge).
    skills: { ...rewound.skills, ...wizardResult.skills },
    expertise: [...new Set([...(rewound.expertise || []), ...(wizardResult.expertise || [])])],
    languages: [...new Set([...(rewound.languages || []), ...(wizardResult.languages || [])])],
    toolProficiencies: [...new Set([...(rewound.toolProficiencies || []), ...(wizardResult.toolProficiencies || [])])],
  };
  // Spells the wizard added: a third caster's spells, a Land druid's cantrip, Lore bard secrets.
  const had = new Set((rewound.spells || []).map((s) => `${s.name}:${s.level}`));
  const added = (wizardResult.spells || []).filter((s) => !had.has(`${s.name}:${s.level}`));
  const hadCantrips = new Set((rewound.cantrips || []).map((c) => c.name));
  next = {
    ...next,
    spells: [...(rewound.spells || []), ...added],
    cantrips: [...(rewound.cantrips || []), ...(wizardResult.cantrips || []).filter((c) => !hadCantrips.has(c.name))],
  };
  if (isLand(wizardResult)) {
    next = { ...next, circleTerrain: wizardResult.circleTerrain, circleSpells: wizardResult.circleSpells, bonusCantrips: wizardResult.bonusCantrips };
  }
  next = applySubclassFeatures(next, language);
  next = syncGrantedSpells(next);
  next = syncBaseFeatures(next, language);
  return withSnapshot(before, { ...next, ...computeDerivedStats(next) }, "subclass");
}

const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"] as const;
const CLASS_LANGUAGES = new Set(["Druidic", "Thieves' Cant"]);

/**
 * A new creation draft for picking the class again. Who the character is
 * stays: name, look, personality, race and its picks, background and
 * languages. Ability scores start without the race's bonuses, which creation
 * adds back. Class, skills, spells, features and levels start fresh.
 */
export function classRebuildDraft(old: Character): Character {
  const raceBonus = getRaceAsi(old);
  const vhFeat = old.featureSelections?.["variant-human-feat"]?.[0];
  const featBonus = vhFeat ? featAbilityIncreases(vhFeat, decodeFeatOptions(old.featureSelections?.["variant-human-feat-options"])) : {};
  // Increases from level-ups (and the Barbarian's level 20 +4) go too; the new class earns its own.
  const levelUp = levelUpIncreases(old);
  const capstone: Record<string, number> = old.class === "Barbarian" && (old.level || 1) >= 20 ? { str: 4, con: 4 } : {};
  const scores = Object.fromEntries(
    ABILITIES.map((k) => {
      const vh = (old.variantHumanAbilities || []).includes(k) ? 1 : 0;
      const levelUps = (levelUp[k] || 0) + (capstone[k] || 0);
      return [k, Math.max(3, (old[k] || 10) - (raceBonus[k] || 0) - (featBonus[k] || 0) - vh - levelUps)];
    })
  ) as Record<(typeof ABILITIES)[number], number>;
  const raceSelections = Object.fromEntries(Object.entries(old.featureSelections || {}).filter(([key]) => key.startsWith("variant-human-feat")));
  const blank = createEmptyCharacter();
  const draft: Character = {
    ...blank,
    id: old.id,
    createdAt: old.createdAt,
    name: old.name,
    playerName: old.playerName,
    gender: old.gender,
    race: old.race,
    raceVariant: old.raceVariant,
    raceChoices: old.raceChoices,
    flexAsi: old.flexAsi,
    halfElfAbilities: old.halfElfAbilities,
    halfElfSkills: old.halfElfSkills,
    variantHumanAbilities: old.variantHumanAbilities,
    variantHumanSkill: old.variantHumanSkill,
    raceSkillPicks: old.raceSkillPicks,
    featureSelections: raceSelections,
    alignment: old.alignment,
    personalityTrait1: old.personalityTrait1,
    personalityTrait2: old.personalityTrait2,
    ideal: old.ideal,
    bond: old.bond,
    flaw: old.flaw,
    appearance: old.appearance,
    languages: (old.languages || []).filter((l) => !CLASS_LANGUAGES.has(l)),
    sources: old.sources,
    ruleset: old.ruleset,
    optionalClassFeatures: old.optionalClassFeatures,
    creationOrder: old.creationOrder,
    experiencePoints: old.experiencePoints,
    abilityMethod: "manual",
    ...scores,
    rebuildOf: { level: old.level || 1 },
  };
  return { ...draft, ...applyBackground(draft, old.background) };
}

/**
 * After creation: the gear and coins the character carried stay (a class
 * change doesn't empty the backpack), and the old character is kept for undo.
 */
export function finishClassRebuild(old: Character, created: Character): Character {
  const { rebuildOf: _done, ...rest } = created;
  return withSnapshot(old, { ...rest, inventory: old.inventory, currency: old.currency, coinsInInventory: old.coinsInInventory }, "class");
}
