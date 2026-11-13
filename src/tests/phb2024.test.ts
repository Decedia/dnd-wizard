// The 2024 Player's Handbook content beyond SRD 5.2 (hand-written, source "PHB2024"):
// every expected subclass is there once, it only shows with the book on, and
// Eldritch Knight / Arcane Trickster casting works from the Wizard list.
// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import phb from "@/data/en/2024_phb_subclasses.json";
import srd from "@/data/en/2024_subclasses.json";
import spells2024 from "@/data/en/2024_spells.json";
import { getStaticBackgrounds2024, getStaticClass, getStaticFeat, getStaticFeats, getStaticSubclasses } from "@/lib/srd-client";
import { parseOriginFeat } from "@/lib/origin-2024";
import { BACKGROUND_GEAR_2024 } from "@/data/starting-gear-2024";
import { applyFeatGrants } from "@/lib/feat-grants";
import { buildLevelInfos } from "@/components/level-up/level-infos";
import { computeDerivedStats, createEmptyCharacter, getHpBonusPerLevel, type Character } from "@/lib/storage";
import { spellChoicePool } from "@/lib/spell-pool";
import { upgradeSave } from "@/lib/save-upgrade";
import { defaultSources, PHB_2024 } from "@/lib/rulesets";
import { getFeatOptionGroups, MASTERY_WEAPONS_2024 } from "@/data/feat-options";
import masteryData from "@/data/en/2024_weapon_mastery.json";
import { describeFeatRequirements, FEAT_REQUIREMENTS_2024 } from "@/lib/feat-requirements";
import { equipRow, rowFromCatalog, type InventoryRow } from "@/lib/inventory";
import { findCatalogItem } from "@/data/item-catalog";
import { getWeaponAttackDetails } from "@/lib/weapon-attacks";
import { weaponMastery } from "@/lib/weapon-mastery";
import { initiativeParts } from "@/lib/roll-parts";
import { getPassiveScore } from "@/lib/storage";
import { buildTurnMenu } from "@/lib/turn";

/** The 2024 book's subclasses, four per class (SRD 5.2 has the first of each). */
const EXPECTED: Record<string, string[]> = {
  Barbarian: ["Path of the Berserker", "Path of the Wild Heart", "Path of the World Tree", "Path of the Zealot"],
  Fighter: ["Battle Master", "Champion", "Eldritch Knight", "Psi Warrior"],
  Monk: ["Warrior of Mercy", "Warrior of Shadow", "Warrior of the Elements", "Warrior of the Open Hand"],
  Rogue: ["Arcane Trickster", "Assassin", "Soulknife", "Thief"],
  Bard: ["College of Dance", "College of Glamour", "College of Lore", "College of Valor"],
  Cleric: ["Life Domain", "Light Domain", "Trickery Domain", "War Domain"],
  Paladin: ["Oath of Devotion", "Oath of Glory", "Oath of Vengeance", "Oath of the Ancients"],
  Ranger: ["Beast Master", "Fey Wanderer", "Gloom Stalker", "Hunter"],
  Druid: ["Circle of the Land", "Circle of the Moon", "Circle of the Sea", "Circle of the Stars"],
  Sorcerer: ["Aberrant Sorcery", "Clockwork Sorcery", "Draconic Sorcery", "Wild Magic Sorcery"],
  Warlock: ["Archfey Patron", "Celestial Patron", "Fiend Patron", "Great Old One Patron"],
  Wizard: ["Abjurer", "Diviner", "Evoker", "Illusionist"],
};

/** Always-prepared spells from the 2024 book that SRD 5.2 lacks; the spells PR adds them. */
const SPELLS_STILL_MISSING = [
  "Arms of Hadar", "Crusader's Mantle", "Fount of Moonlight", "Hunger of Hadar", "Mind Sliver", "Steel Wind Strike",
  "Summon Aberration", "Summon Beast", "Summon Celestial", "Summon Construct", "Summon Fey", "Yolande's Regal Presence",
];

describe("2024 Player's Handbook subclasses", () => {
  test("each class has the book's subclasses, once each", () => {
    const all = [...srd.subclasses, ...phb.subclasses];
    for (const [cls, names] of Object.entries(EXPECTED)) {
      expect([cls, all.filter((s) => s.class === cls).map((s) => s.name).sort()]).toEqual([cls, names]);
    }
    expect(new Set(phb.subclasses.map((s) => s.index)).size).toBe(phb.subclasses.length);
  });

  test("every feature has a level and text; levels fit the class's subclass levels", () => {
    const levels: Record<string, number[]> = {
      Barbarian: [3, 6, 10, 14], Fighter: [3, 7, 10, 15, 18], Monk: [3, 6, 11, 17], Rogue: [3, 9, 13, 17],
      Bard: [3, 6, 14], Cleric: [3, 6, 17], Paladin: [3, 7, 15, 20], Ranger: [3, 7, 11, 15],
      Druid: [3, 6, 10, 14], Sorcerer: [3, 6, 14, 18], Warlock: [3, 6, 10, 14], Wizard: [3, 6, 10, 14],
    };
    for (const s of phb.subclasses) {
      for (const f of s.features) {
        expect([s.name, f.name, levels[s.class]?.includes(f.level), f.description.length > 15]).toEqual([s.name, f.name, true, true]);
      }
    }
  });

  test("always-prepared spells are real 2024 spells at levels the class can cast", () => {
    const known = new Set((spells2024 as any).spells.map((x: any) => x.name));
    const unknown = phb.subclasses.flatMap((s: any) => Object.values(s.expandedSpells || {}).flat() as string[]).filter((n) => !known.has(n));
    expect([...new Set(unknown)].sort()).toEqual(SPELLS_STILL_MISSING);
    const firstSlot: Record<string, number> = { Bard: 3, Cleric: 3, Paladin: 3, Ranger: 3, Druid: 3, Sorcerer: 3, Warlock: 3, Wizard: 3 };
    for (const s of phb.subclasses as any[]) {
      for (const lvl of Object.keys(s.expandedSpells || {})) expect([s.name, Number(lvl) >= (firstSlot[s.class] ?? 99)]).toEqual([s.name, true]);
    }
  });

  test("shown with the book on, hidden with core rules only", () => {
    const names = (sources: string[]) => getStaticSubclasses("Fighter", sources, "2024").map((s) => s.name);
    expect(names(defaultSources("2024"))).toContain("Battle Master");
    expect(names(["PHB"])).toEqual(["Champion"]);
    expect(getStaticClass("Fighter", "2024")!.subclasses!.map((s) => s.name)).toContain("Psi Warrior");
  });

  test("Battle Master learns 3 maneuvers, then 2 more at 7, 10 and 15", () => {
    const bm = getStaticSubclasses("Fighter", undefined, "2024").find((s) => s.name === "Battle Master")!;
    const cs = bm.features.find((f) => f.name === "Combat Superiority") as any;
    expect(cs.choicesCount).toBe(3);
    expect(cs.choicesCountByLevel).toEqual({ "3": 3, "7": 2, "10": 2, "15": 2 });
    expect(cs.choices.length).toBe(20);
  });

  test("an old 2024 save gets the book turned on; 2014 and all-books saves stay as they are", () => {
    const c = (patch: Partial<Character>) => upgradeSave({ ...createEmptyCharacter(), saveVersion: 2, ...patch });
    expect(c({ ruleset: "2024", sources: ["PHB"] }).sources).toEqual(["PHB", PHB_2024]);
    expect(c({ ruleset: "2014", sources: ["PHB"] }).sources).toEqual(["PHB"]);
    expect(c({ ruleset: "2024", sources: [] }).sources).toEqual([]);
  });
});

describe("2024 Eldritch Knight and Arcane Trickster", () => {
  const fighter = (subclass: string, level: number): Character => ({ ...createEmptyCharacter(), ruleset: "2024", sources: defaultSources("2024"), class: "Fighter", subclass, level, int: 16 });
  const info = (cls: string, subclass: string, level: number) =>
    buildLevelInfos({ ...fighter(subclass, level - 1), class: cls }, level, getStaticClass(cls, "2024"), subclass, level - 1, false, "en").at(-1)!;

  test("level 3 Eldritch Knight: 2 cantrips, 3 spells, two level 1 slots; a Champion gets none", () => {
    const ek = info("Fighter", "Eldritch Knight", 3);
    expect([ek.cantripSelectionCount, ek.spellSelectionCount, ek.maxSpellLevel]).toEqual([2, 3, 1]);
    const champ = info("Fighter", "Champion", 3);
    expect([champ.cantripSelectionCount ?? 0, champ.spellSelectionCount, champ.hasSpellSelection]).toEqual([0, 0, false]);
    expect(computeDerivedStats(fighter("Eldritch Knight", 3)).spellSlots).toEqual({ 1: 2 });
    expect(computeDerivedStats(fighter("Champion", 3)).spellSlots ?? {}).toEqual({});
  });

  test("level 3 Arcane Trickster: 3 cantrips and 3 spells; level 7 adds one", () => {
    const at = info("Rogue", "Arcane Trickster", 3);
    expect([at.cantripSelectionCount, at.spellSelectionCount]).toEqual([3, 3]);
    expect(info("Rogue", "Arcane Trickster", 7).spellSelectionCount).toBe(1);
  });

  test("picks come from the whole Wizard list, any school", () => {
    const pool = spellChoicePool(fighter("Eldritch Knight", 3), { maxLevel: 1, selectionType: "prepare" }).map((s: any) => s.name);
    expect(pool).toContain("Magic Missile");
    expect(pool).toContain("Sleep");
    expect(pool).not.toContain("Cure Wounds");
  });
});

describe("2024 Player's Handbook backgrounds and Origin feats", () => {
  const BACKGROUNDS = ["Acolyte", "Artisan", "Charlatan", "Criminal", "Entertainer", "Farmer", "Guard", "Guide", "Hermit", "Merchant", "Noble", "Sage", "Sailor", "Scribe", "Soldier", "Wayfarer"];
  const ORIGIN_FEATS = ["Alert", "Crafter", "Healer", "Lucky", "Magic Initiate", "Musician", "Savage Attacker", "Skilled", "Tavern Brawler", "Tough"];

  test("16 backgrounds and 10 Origin feats with the book on; the SRD ones with it off", () => {
    expect(getStaticBackgrounds2024("en", defaultSources("2024")).map((b) => b.name).sort()).toEqual(BACKGROUNDS);
    expect(getStaticBackgrounds2024("en", ["PHB"]).map((b) => b.name).sort()).toEqual(["Acolyte", "Criminal", "Sage", "Soldier"]);
    const origin = (sources: string[]) => getStaticFeats(sources, "2024").filter((f) => f.category === "Origin").map((f) => f.name).sort();
    expect(origin(defaultSources("2024"))).toEqual(ORIGIN_FEATS);
    expect(origin(["PHB"])).toEqual(["Alert", "Magic Initiate", "Savage Attacker", "Skilled"]);
  });

  test("every background: three abilities, two skills, a real Origin feat, a tool, and gear packages", () => {
    for (const bg of getStaticBackgrounds2024()) {
      expect([bg.name, bg.abilityScores.length, bg.skills.length]).toEqual([bg.name, 3, 2]);
      expect([bg.name, !!getStaticFeat(parseOriginFeat(bg.feat).name, "2024")]).toEqual([bg.name, true]);
      expect([bg.name, bg.tools.length + (bg.toolChoice ? 1 : 0)]).toEqual([bg.name, 1]);
      expect([bg.name, BACKGROUND_GEAR_2024[bg.name]?.map((p) => p.letter)]).toEqual([bg.name, ["A", "B"]]);
    }
  });

  test("Crafter and Musician give three tools; Tavern Brawler trains improvised weapons", () => {
    const base = { ...createEmptyCharacter(), ruleset: "2024" } as Character;
    expect(applyFeatGrants(base, "Crafter", { tool_1: "Smith's Tools", tool_2: "Cook's Utensils", tool_3: "Potter's Tools" }).toolProficiencies).toEqual(["Smith's Tools", "Cook's Utensils", "Potter's Tools"]);
    expect(applyFeatGrants(base, "Musician", { tool_1: "Lute", tool_2: "Drum", tool_3: "Flute" }).toolProficiencies).toEqual(["Lute", "Drum", "Flute"]);
    expect(applyFeatGrants(base, "Tavern Brawler").otherProficiencies).toBe("Improvised Weapons");
  });

  test("2024 Lucky gives Luck Points equal to the Proficiency Bonus; 2014 Lucky gives 3", () => {
    const lucky = (ruleset: string, level: number) =>
      computeDerivedStats({ ...createEmptyCharacter(), class: "Fighter", ruleset, level, features: [{ id: "f", name: "Lucky", description: "", source: "custom" }] } as Character).maxLuckPoints;
    expect([lucky("2024", 1), lucky("2024", 9), lucky("2014", 9)]).toEqual([2, 4, 3]);
  });

  test("Tough adds 2 HP per level", () => {
    expect(getHpBonusPerLevel({ ...createEmptyCharacter(), ruleset: "2024", features: [{ id: "f", name: "Tough", description: "", source: "custom" }] } as Character)).toBe(2);
  });
});

describe("2024 Player's Handbook General feats, Fighting Styles and Epic Boons", () => {
  const BOOK = defaultSources("2024");
  const named = (category: string, sources: string[]) => getStaticFeats(sources, "2024").filter((f) => f.category === category).map((f) => f.name);
  const phbFeats = getStaticFeats(BOOK, "2024").filter((f) => (f as any).source === "PHB2024" && f.category !== "Origin");
  const feat = (name: string) => ({ id: `f-${name}`, name, description: "", source: "custom" as const });
  const base = (over: Partial<Character> = {}) => ({ ...createEmptyCharacter(), ruleset: "2024", sources: BOOK, class: "Fighter", level: 8, ...over }) as Character;
  const item = (id: string): InventoryRow => ({ ...rowFromCatalog(findCatalogItem(id)!), id });

  test("43 General feats, 10 Fighting Styles and 12 Epic Boons with the book on; the SRD ones with it off", () => {
    expect([named("General", BOOK).length, named("Fighting Style", BOOK).length, named("Epic Boon", BOOK).length]).toEqual([43, 10, 12]);
    expect(named("General", ["PHB"]).sort()).toEqual(["Ability Score Improvement", "Grappler"]);
    expect(named("Fighting Style", ["PHB"]).length).toBe(4);
    expect(named("Epic Boon", ["PHB"]).length).toBe(7);
  });

  test("every General feat and Epic Boon raises an ability (to 20, or 30 for a boon) and has the right level", () => {
    for (const f of phbFeats.filter((f) => f.category !== "Fighting Style")) {
      const boon = f.category === "Epic Boon";
      expect([f.name, getFeatOptionGroups(f.name, "2024").some((g) => g.id === "ability")]).toEqual([f.name, true]);
      expect([f.name, f.minLevel, f.description.includes(`maximum of ${boon ? 30 : 20}`)]).toEqual([f.name, boon ? 19 : 4, true]);
    }
  });

  test("prerequisites: every feat that lists one is checked, and the checks read the text", () => {
    const listed = phbFeats.filter((f) => f.prerequisites).map((f) => f.name).sort();
    const checked = Object.keys(FEAT_REQUIREMENTS_2024).filter((n) => n !== "Grappler").sort();
    expect(checked).toEqual(listed);
    expect(describeFeatRequirements(base({ cha: 12 }), "Actor")[0].met).toBe(false);
    expect(describeFeatRequirements(base({ cha: 13 }), "Actor")[0].met).toBe(true);
    expect(describeFeatRequirements(base({ str: 10, dex: 14 }), "Grappler")[0].met).toBe(true);
    expect(describeFeatRequirements(base(), "Ritual Caster")[0].text).toBe("INT, WIS or CHA 13 or higher");
    // A Fighter has shield training.
    expect(describeFeatRequirements(base(), "Shield Master")[0].met).toBe(true);
    expect(describeFeatRequirements(base({ class: "Wizard" }), "Shield Master")[0].met).toBe(false);
  });

  test("feat picks: skill or Expertise, armor and weapon training, all skills, a save", () => {
    const c = base({ skills: { History: true } as any });
    expect(applyFeatGrants(c, "Keen Mind", { ability: "int", skill_up: "History" }).expertise).toEqual(["History"]);
    expect(applyFeatGrants(c, "Keen Mind", { ability: "int", skill_up: "Arcana" }).skills.Arcana).toBe(true);
    expect(applyFeatGrants(c, "Lightly Armored", { ability: "dex" }).otherProficiencies).toBe("Light Armor, Shields");
    expect(applyFeatGrants(c, "Martial Weapon Training", { ability: "str" }).otherProficiencies).toBe("Martial Weapons");
    expect(Object.values(applyFeatGrants(c, "Boon of Skill", { ability: "dex", expertise: "Stealth" }).skills).filter(Boolean).length).toBe(18);
    expect(applyFeatGrants(c, "Resilient", { ability: "wis" }).bonusSaves).toEqual(["wis"]);
    const fey = applyFeatGrants(c, "Fey Touched", { ability: "wis", first_level_spell: "Bless" });
    expect(fey.spells.map((s) => s.name).sort()).toEqual(["Bless", "Misty Step"]);
  });

  test("sheet numbers: Speedy, Boon of Speed, Boon of Fortitude, 2024 Alert and Observant", () => {
    expect(computeDerivedStats(base({ baseSpeed: 30, features: [feat("Speedy"), feat("Boon of Speed")] })).speed).toBe(70);
    const tough = computeDerivedStats(base({ maxHp: 50, currentHp: 50, features: [feat("Boon of Fortitude")] }));
    expect(tough.effectiveMaxHp).toBe(90);
    expect(initiativeParts(base({ dex: 10, features: [feat("Alert")] }))).toEqual([{ source: "@dex", value: 0 }, { source: "Alert", value: 3 }]);
    expect(getPassiveScore(base({ wis: 10, features: [feat("Observant")] }), "Perception")).toBe(10);
    expect(getPassiveScore({ ...base({ wis: 10, features: [feat("Observant")] }), ruleset: "2014" }, "Perception")).toBe(15);
  });

  test("Fighting Styles: Archery, Dueling and Defense from a class pick; Great Weapon Master adds the Proficiency Bonus", () => {
    const styled = (style: string, inventory: InventoryRow[]) => base({ str: 16, dex: 16, inventory, featureSelections: { "class-feature-1-Fighting Style": [style] } });
    const bow = equipRow([item("longbow")], "longbow").inventory;
    expect(getWeaponAttackDetails(styled("Archery", bow), { id: "longbow" } as any)!.attackBonus).toBe(3 + 3 + 2);
    const sword = equipRow([item("longsword")], "longsword", "main").inventory;
    expect(getWeaponAttackDetails(styled("Dueling", sword), { id: "longsword" } as any)!.damageBonus).toBe(3 + 2);
    const twoHands = equipRow([item("longsword")], "longsword", "both").inventory;
    expect(getWeaponAttackDetails(styled("Dueling", twoHands), { id: "longsword" } as any)!.damageBonus).toBe(3);
    const greatsword = equipRow([item("greatsword")], "greatsword", "both").inventory;
    expect(getWeaponAttackDetails(base({ str: 16, inventory: greatsword, features: [feat("Great Weapon Master")] }), { id: "greatsword" } as any)!.damageBonus).toBe(3 + 3);
    const mail = equipRow([item("chain-mail")], "chain-mail").inventory;
    const ac = (style: string) => computeDerivedStats(styled(style, mail)).ac ?? 0;
    expect(ac("Defense") - ac("Archery")).toBe(1);
  });

  test("the book's Fighting Styles join the class pick only with the book on", () => {
    const options = (sources: string[]) =>
      buildLevelInfos({ ...base({ level: 0, sources }), level: 0 }, 1, getStaticClass("Fighter", "2024"), "", 0, true, "en")[0]
        .classFeatureChoices!.find((c) => c.name === "Fighting Style")!.options.map((o) => o.name);
    expect(options(BOOK)).toContain("Interception");
    expect(options(["PHB"])).not.toContain("Interception");
    const champion = (sources: string[]) => getStaticSubclasses("Fighter", sources, "2024").find((s) => s.name === "Champion")!.features.find((f: any) => f.name === "Additional Fighting Style")!.choices!.map((c: any) => c.name);
    expect(champion(BOOK)).toContain("Unarmed Fighting");
    expect(champion(["PHB"])).not.toContain("Unarmed Fighting");
  });

  test("Weapon Master trains one weapon's mastery; Unarmed Fighting hits for 1d8 empty-handed", () => {
    const c = base({ class: "Wizard", featureSelections: { "asi-feat-4": ["Weapon Master"], "asi-feat-4-options": ["ability=dex", "mastery=Rapier"] } });
    expect(weaponMastery(c, { name: "Rapier" })).toBe("Vex");
    expect(weaponMastery(c, { name: "Longsword" })).toBeUndefined();
    expect(MASTERY_WEAPONS_2024).toEqual(Object.keys(masteryData.weapons));
    const brawler = base({ str: 14, featureSelections: { "class-feature-1-Fighting Style": ["Unarmed Fighting"] } });
    const unarmed = buildTurnMenu(brawler, []).options.find((o) => o.key === "attack:unarmed")!;
    expect(unarmed.damageRoll?.dice).toBe("1d8");
  });
});
