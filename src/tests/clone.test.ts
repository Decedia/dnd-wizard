// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { computeDerivedStats, createEmptyCharacter, type Character } from "@/lib/storage";
import { applySubclassFeatures, syncBaseFeatures } from "@/lib/character-creation";
import { syncGrantedSpells } from "@/lib/granted-spells";
import { addLevelPicks, type LevelPicks } from "@/lib/level-choices";
import { cloneStart, finishClone } from "@/lib/clone";
import oldWizard from "./fixtures/old-save-wizard-12.json";

const make = (over: Partial<Character>): Character => {
  let c = { ...createEmptyCharacter(), ruleset: "2014", race: "Human", str: 8, dex: 14, con: 14, int: 16, wis: 12, cha: 10, ...over } as Character;
  c = syncGrantedSpells(syncBaseFeatures(applySubclassFeatures(c, "en"), "en"));
  return { ...c, ...computeDerivedStats(c) } as Character;
};

const L1 = { cantrips: [{ id: "cantrip-Fire-Bolt", name: "Fire Bolt" }], spells: [{ id: "spell-Magic-Missile-1", name: "Magic Missile", level: 1, source: "srd" as const }, { id: "spell-Shield-1", name: "Shield", level: 1, source: "srd" as const }] };

/** A level 5 Wizard (Evocation at 2, +2 INT at 4) with every level's picks in the log. */
function wizard5(): Character {
  const log: Record<number, LevelPicks> = {
    2: { spells: ["Sleep:1", "Grease:1"] },
    3: { spells: ["Misty Step:2", "Web:2"] },
    4: { asi: { mode: "single", single: "int" }, spells: ["Light:0", "Scorching Ray:2"] },
    5: { spells: ["Fireball:3", "Counterspell:3"] },
  };
  let c = make({ class: "Wizard", level: 1, ...L1, levelHp: { 1: 8 }, maxHp: 8 });
  for (const [lvl, picks] of Object.entries(log)) c = addLevelPicks(c, Number(lvl), picks);
  c = make({ ...c, level: 5, subclass: "School of Evocation", subclassIndex: "school-of-evocation", appliedAsi: [4], levelChoices: { 1: {}, ...log }, levelHp: { 1: 8, 2: 6, 3: 4, 4: 6, 5: 5 }, maxHp: 29, currentHp: 12, inventory: [{ id: "i1", name: "Quarterstaff", quantity: 1, equipped: true, source: "srd" }] });
  return c;
}

describe("clone a hero", () => {
  test("the copy starts at level 1 with creation picks, gear and story, and every later pick is waiting to be filled in", () => {
    const original = { ...wizard5(), backstory: "Grew up in a tower." } as Character;
    const { base, prefill, level } = cloneStart(original);
    expect(level).toBe(5);
    expect(base.level).toBe(1);
    expect(base.int).toBe(16);
    expect(base.subclass).toBeUndefined();
    expect(base.features.some((f) => f.source === "subclass")).toBe(false);
    expect(base.spells.map((s) => s.name).sort()).toEqual(["Magic Missile", "Shield"]);
    expect(base.cantrips.map((c) => c.name)).toEqual(["Fire Bolt"]);
    expect(base.appliedAsi).toEqual([]);
    expect(base.levelHp).toEqual({ 1: 8 });
    expect(base.maxHp).toBe(8);
    expect(base.inventory.map((i) => i.name)).toEqual(["Quarterstaff"]);
    expect((base as any).backstory).toBe("Grew up in a tower.");
    expect(base.levelUpSnapshot).toBeUndefined();

    expect(prefill.subclass).toBe("School of Evocation");
    expect(prefill.picks[4].asi).toEqual({ mode: "single", single: "int" });
    expect(prefill.picks[5].spells).toEqual(["Fireball:3", "Counterspell:3"]);
    expect(prefill.picks[1]).toBeUndefined();
    // Dice rolled, with the level 1 CON (+2) on top.
    expect(prefill.hp).toEqual({ 2: 6, 3: 4, 4: 6, 5: 5 });
  });

  test("HP per level comes back to the die when CON went up later", () => {
    const c = { ...wizard5(), con: 16, levelHp: { 1: 9, 2: 7, 3: 5, 4: 7, 5: 6 }, maxHp: 34, appliedAsi: [4], levelChoices: { ...wizard5().levelChoices, 4: { asi: { mode: "single" as const, single: "con" as const }, spells: ["Light:0", "Scorching Ray:2"] } } } as Character;
    const { base, prefill } = cloneStart(c);
    expect(base.con).toBe(14);
    expect(base.levelHp).toEqual({ 1: 8 });
    expect(prefill.hp[2]).toBe(6);
  });

  test("an older save keeps what its log doesn't have: an unknown ability increase and unlogged spells", () => {
    const original = oldWizard as unknown as Character;
    const { base, prefill } = cloneStart(original);
    expect(base.level).toBe(1);
    for (const [lvl, p] of Object.entries(prefill.picks)) {
      if (p.asi?.mode === "unknown") expect(base.appliedAsi).toContain(Number(lvl));
    }
    // No spells log: the spells stay on the copy (the wizard won't ask them again).
    if (Object.values(prefill.picks).every((p) => p.spells === undefined)) {
      const kept = new Set(base.spells.map((s) => s.name));
      expect((original.spells || []).filter((s) => s.level > 0 && !kept.has(s.name))).toEqual([]);
    }
  });

  test("the finished copy is a new hero: own id, own name, rested, nothing to undo", () => {
    const c = wizard5();
    const copy = finishClone({ ...c, levelUpSnapshot: { level: 4, kind: "levelUp", at: 1, character: c } as any, spellSlotsExpended: { 1: 2 } as any, currentHp: 3 }, "Elara (copy)");
    expect(copy.id).not.toBe(c.id);
    expect(copy.name).toBe("Elara (copy)");
    expect(copy.currentHp).toBe(c.maxHp);
    expect(copy.levelUpSnapshot).toBeUndefined();
    expect(Object.values(copy.spellSlotsExpended || {}).every((v) => !v)).toBe(true);
  });
});
