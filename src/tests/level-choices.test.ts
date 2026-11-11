// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { computeDerivedStats, createEmptyCharacter, type Character } from "@/lib/storage";
import { applySubclassFeatures, syncBaseFeatures } from "@/lib/character-creation";
import { syncGrantedSpells } from "@/lib/granted-spells";
import { applyFeatGrants, encodeFeatOptions } from "@/lib/feat-grants";
import { addLevelPicks, changeLevelPicks, choicesOf, levelRewind, levelUpIncreases, removeLevelPicks } from "@/lib/level-choices";
import { classRebuildDraft } from "@/lib/rebuild";
import { undoableChange, undoLevelUp } from "@/lib/level-snapshot";
import { upgradeSave } from "@/lib/save-upgrade";

const make = (over: Partial<Character>): Character => {
  let c = { ...createEmptyCharacter(), ruleset: "2014", race: "Human", str: 15, dex: 14, con: 14, int: 12, wis: 10, cha: 8, maxHp: 40, currentHp: 40, ...over } as Character;
  c = syncGrantedSpells(syncBaseFeatures(applySubclassFeatures(c, "en"), "en"));
  return { ...c, ...computeDerivedStats(c) } as Character;
};
const featNames = (c: Character) => c.features.map((f) => f.name);

describe("each level's picks", () => {
  test("an older save's picks come from what it recorded; an old ability increase is marked unknown", () => {
    const c = make({
      class: "Fighter", level: 8, subclass: "Battle Master",
      appliedAsi: [4, 6],
      featureSelections: { "class-feature-1-Fighting Style": ["Defense"], "subclass-feature-3-Combat Superiority": ["Parry, Riposte, Trip Attack"], "asi-feat-6": ["Alert"] },
    });
    const all = choicesOf(c);
    expect(all[1].classFeatures).toEqual({ "Fighting Style": "Defense" });
    expect(all[3].subclassFeatures).toEqual({ "Combat Superiority": "Parry, Riposte, Trip Attack" });
    expect(all[4].asi).toEqual({ mode: "unknown" });
    expect(all[6].asi).toMatchObject({ mode: "feat", feat: "Alert" });
    expect(all[4].spells).toBeUndefined();
  });

  test("changing a level's +2 STR to +1 DEX +1 CON moves the scores and HP, keeps the level, and can be undone", () => {
    const c = make({ class: "Fighter", level: 5, str: 17, con: 14, levelHp: { 1: 12, 2: 8, 3: 8, 4: 8, 5: 8 }, maxHp: 44, currentHp: 44, appliedAsi: [4], levelChoices: { 4: { asi: { mode: "single", single: "str" } } } });
    const out = changeLevelPicks(c, 4, c.levelChoices![4], { asi: { mode: "double", d1: "dex", d2: "con" } });
    expect(out.str).toBe(15);
    expect(out.dex).toBe(15);
    expect(out.con).toBe(15);
    expect(out.level).toBe(5);
    expect(out.appliedAsi).toEqual([4]);
    // CON 14 to 15 is no new modifier, so HP stays.
    expect(out.maxHp).toBe(44);
    expect(out.levelChoices?.[4].asi).toEqual({ mode: "double", d1: "dex", d2: "con" });
    expect(undoableChange(out)?.kind).toBe("choice");
    expect(undoLevelUp(out)?.str).toBe(17);
  });

  test("CON going up a modifier adds HP to every level", () => {
    const c = make({ class: "Fighter", level: 4, con: 13, levelHp: { 1: 11, 2: 7, 3: 7, 4: 7 }, maxHp: 32, currentHp: 30, appliedAsi: [4], levelChoices: { 4: { asi: { mode: "single", single: "str" } } } });
    const out = changeLevelPicks(c, 4, c.levelChoices![4], { asi: { mode: "double", d1: "con", d2: "dex" } });
    expect(out.con).toBe(14);
    expect(out.maxHp).toBe(36);
    expect(out.currentHp).toBe(34);
  });

  test("swapping a feat for another takes the old feat's grants off", () => {
    const opts = { ability: "con" };
    let c = make({ class: "Fighter", level: 4, con: 14, appliedAsi: [4] });
    c = applyFeatGrants({ ...c, features: [...c.features, { id: "feat-Resilient", name: "Resilient", description: "", source: "custom" }], featureSelections: { ...c.featureSelections, "asi-feat-4": ["Resilient"], "asi-feat-4-options": encodeFeatOptions(opts) } }, "Resilient", opts);
    expect(c.con).toBe(15);
    expect(c.bonusSaves).toContain("con");
    const old = choicesOf(c)[4];
    const out = changeLevelPicks(c, 4, old, { asi: { mode: "feat", feat: "Alert" } });
    expect(out.con).toBe(14);
    expect(out.bonusSaves || []).not.toContain("con");
    expect(featNames(out)).not.toContain("Resilient");
    expect(featNames(out)).toContain("Alert");
    expect(out.featureSelections["asi-feat-4"]).toEqual(["Alert"]);
  });

  test("a fighting style changes; other levels' picks stay", () => {
    const c = make({ class: "Fighter", level: 3, subclass: "Battle Master", featureSelections: { "class-feature-1-Fighting Style": ["Defense"], "subclass-feature-3-Combat Superiority": ["Parry, Riposte, Trip Attack"] } });
    const out = changeLevelPicks(c, 1, choicesOf(c)[1], { classFeatures: { "Fighting Style": "Dueling" } });
    expect(out.featureSelections["class-feature-1-Fighting Style"]).toEqual(["Dueling"]);
    expect(out.featureSelections["subclass-feature-3-Combat Superiority"]).toEqual(["Parry, Riposte, Trip Attack"]);
  });

  test("spells learned at a level are swapped; a spell swapped out there comes back first", () => {
    const c = make({
      class: "Wizard", level: 3,
      spells: [
        { id: "spell-Shield-1", name: "Shield", level: 1, source: "srd" },
        { id: "spell-Misty-Step-2", name: "Misty Step", level: 2, source: "srd" },
        { id: "spell-Web-2", name: "Web", level: 2, source: "srd" },
      ] as any,
      preparedSpells: ["spell-Misty-Step-2"],
      levelChoices: { 3: { spells: ["Misty Step:2", "Web:2"], replacedSpell: { name: "Sleep", level: 1 } } },
    });
    const removed = removeLevelPicks(c, 3, c.levelChoices![3]);
    expect(removed.spells.map((s) => s.name).sort()).toEqual(["Shield", "Sleep"]);
    expect(removed.preparedSpells).toEqual([]);
    const out = changeLevelPicks(c, 3, c.levelChoices![3], { spells: ["Scorching Ray:2", "Web:2"] });
    expect(out.spells.map((s) => s.name).sort()).toEqual(["Scorching Ray", "Shield", "Sleep", "Web"]);
  });

  test("invocations taken at a level are swapped, the rest stay", () => {
    const c = make({ class: "Warlock", level: 5, featureSelections: { "warlock-invocations": ["Agonizing Blast", "Armor of Shadows", "Mask of Many Faces"] }, levelChoices: { 5: { invocations: ["Mask of Many Faces"] } } });
    const out = addLevelPicks(removeLevelPicks(c, 5, c.levelChoices![5]), 5, { invocations: ["Devil's Sight"] });
    expect(out.featureSelections["warlock-invocations"]).toEqual(["Agonizing Blast", "Armor of Shadows", "Devil's Sight"]);
  });

  test("expertise moves with the pick", () => {
    const c = make({ class: "Rogue", level: 6, skills: { Stealth: true, Perception: true, Athletics: true } as any, expertise: ["Stealth", "Perception"], featureSelections: { "expertise-6-Perception": ["Perception"] } });
    const out = changeLevelPicks(c, 6, choicesOf(c)[6], { expertise: ["Athletics"] });
    expect(out.expertise.sort()).toEqual(["Athletics", "Stealth"]);
    expect(out.featureSelections["expertise-6-Athletics"]).toEqual(["Athletics"]);
    expect(out.featureSelections["expertise-6-Perception"]).toBeUndefined();
  });

  test("the wizard sees the character a level below, without that level's picks", () => {
    const c = make({ class: "Fighter", level: 6, str: 18, appliedAsi: [4, 6], levelChoices: { 6: { asi: { mode: "single", single: "str" } } } });
    const r = levelRewind(c, 6, c.levelChoices![6]);
    expect(r.level).toBe(5);
    expect(r.str).toBe(16);
    expect(r.appliedAsi).toEqual([4]);
  });

  test("a class change takes the level-up increases off too", () => {
    const old = make({ class: "Fighter", level: 8, race: "Human", str: 18, dex: 14, appliedAsi: [4, 6], levelChoices: { 4: { asi: { mode: "single", single: "str" } }, 6: { asi: { mode: "double", d1: "str", d2: "dex" } } } });
    expect(levelUpIncreases(old)).toEqual({ str: 3, dex: 1 });
    const d = classRebuildDraft(old);
    // Human +1 to all, then +3 STR and +1 DEX from level-ups.
    expect(d.str).toBe(14);
    expect(d.dex).toBe(12);
  });

  test("an older save's level-up expertise joins the sheet's expertise", () => {
    const c = { ...make({ class: "Rogue", level: 6, expertise: ["Stealth"], featureSelections: { "expertise-6-Perception": ["Perception"] } }), saveVersion: 1 };
    expect(upgradeSave(c).expertise).toEqual(["Stealth", "Perception"]);
  });
});
