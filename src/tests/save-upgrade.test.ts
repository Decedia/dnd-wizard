// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, it } from "bun:test";
import { createEmptyCharacter, type Character } from "@/lib/storage";
import { SAVE_VERSION, upgradeSave } from "@/lib/save-upgrade";

// A level 3 Fighter (d10, average 6) with CON 14, saved by an old version.
const old = (extra: Partial<Character> = {}): Character => ({
  ...createEmptyCharacter(),
  class: "Fighter", race: "Human", level: 3, con: 14, speed: 30,
  levelHp: { 1: 12, 2: 8, 3: 8 }, maxHp: 28, currentHp: 28,
  saveVersion: undefined, ...extra,
});

describe("old-save upgrade", () => {
  it("leaves a correct save as it is, apart from the version", () => {
    const before = old();
    const after = upgradeSave(before);
    expect({ ...after, saveVersion: undefined }).toEqual(before);
    expect(after.saveVersion).toBe(SAVE_VERSION);
  });

  it("runs once: a new character is never touched", () => {
    const fresh = createEmptyCharacter();
    expect(upgradeSave(fresh)).toBe(fresh);
  });

  it("restores max HP that exhaustion halved, once or twice", () => {
    expect(upgradeSave(old({ maxHp: 14, currentHp: 10, exhaustionLevel: 4 })).maxHp).toBe(28);
    expect(upgradeSave(old({ maxHp: 7, currentHp: 7 })).maxHp).toBe(28);
    expect(upgradeSave(old({ maxHp: 20, currentHp: 20 })).maxHp).toBe(20);
    expect(upgradeSave(old({ maxHp: 14, isCustomHp: true })).maxHp).toBe(14);
  });

  it("adds Tough HP to past levels that took the plain value", () => {
    const after = upgradeSave(old({ levelHp: { 1: 12, 2: 8, 3: 5 }, maxHp: 25, currentHp: 25, featureSelections: { "variant-human-feat": ["Tough"] } }));
    // Levels 1 and 2 are hit die / average + CON, level 3 was rolled.
    expect(after.levelHp).toEqual({ 1: 14, 2: 10, 3: 5 });
    expect(after.maxHp).toBe(29);
    expect(after.currentHp).toBe(29);
  });

  it("does not add Hill Dwarf HP twice", () => {
    const save = old({ race: "Hill Dwarf", levelHp: { 1: 13, 2: 9, 3: 9 }, maxHp: 31, currentHp: 31, speed: 25 });
    expect(upgradeSave(save).levelHp).toEqual({ 1: 13, 2: 9, 3: 9 });
  });

  it("keeps a hand-typed speed as the base speed", () => {
    expect(upgradeSave(old({ speed: 40 })).baseSpeed).toBe(40);
    expect(upgradeSave(old({ speed: 30 })).baseSpeed).toBeUndefined();
    expect(upgradeSave(old({ speed: 15, exhaustionLevel: 2 })).baseSpeed).toBeUndefined();
  });

  it("gives an old feat its proficiencies and spells, but not its ability increase", () => {
    const after = upgradeSave(old({
      con: 14,
      features: [{ id: "f1", name: "Heavily Armored", description: "" } as any, { id: "f2", name: "Fey Touched", description: "" } as any],
    }));
    expect(after.otherProficiencies).toContain("Heavy Armor");
    expect(after.spells.some((s) => s.name === "Misty Step")).toBe(true);
    expect(after.str).toBe(old().str);
  });
});
