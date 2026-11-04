// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { computeDerivedStats, createEmptyCharacter, getBaseSpeed, getHpBonusPerLevel, type Character } from "@/lib/storage";

const make = (patch: Partial<Character>): Character =>
  ({ ...createEmptyCharacter(), sources: ["PHB"], ruleset: "2014", class: "Fighter", level: 4, str: 10, dex: 14, con: 12, int: 10, wis: 12, cha: 10, ...patch } as Character);
const feat = (name: string) => ({ id: `feat-${name}`, name, description: "", source: "custom" as const });

describe("feat numbers", () => {
  test("Alert adds 5 to initiative", () => {
    expect(computeDerivedStats(make({ features: [feat("Alert")] })).initiative).toBe(2 + 5);
  });

  test("Observant adds 5 to passive Perception, expertise doubles proficiency", () => {
    expect(computeDerivedStats(make({ features: [feat("Observant")] })).passivePerception).toBe(10 + 1 + 5);
    const expert = make({ skills: { Perception: true } as any, expertise: ["Perception"] });
    expect(computeDerivedStats(expert).passivePerception).toBe(10 + 1 + 2 + 2);
  });

  test("Mobile and Squat Nimbleness add speed on top of the race's", () => {
    expect(computeDerivedStats(make({ race: "Hill Dwarf", features: [feat("Mobile")] })).speed).toBe(25 + 10);
    expect(computeDerivedStats(make({ race: "Wood Elf", features: [feat("Squat Nimbleness")] })).speed).toBe(35 + 5);
  });

  test("speed does not grow each time stats are derived", () => {
    let c = make({ race: "Human", class: "Monk", level: 6, features: [feat("Mobile")] });
    c = { ...c, ...computeDerivedStats(c) };
    c = { ...c, ...computeDerivedStats(c) };
    expect(c.speed).toBe(30 + 10 + 15);
  });

  test("a hand-set base speed wins over the race's", () => {
    expect(getBaseSpeed(make({ race: "Hill Dwarf", baseSpeed: 40 }))).toBe(40);
  });

  test("Dragon Hide sets unarmored AC to 13 + Dex", () => {
    expect(computeDerivedStats(make({ features: [feat("Dragon Hide")], inventory: [] })).ac).toBe(13 + 2);
  });
});

describe("HP bonus per level", () => {
  test("Tough, Hill Dwarf and Draconic Bloodline", () => {
    expect(getHpBonusPerLevel(make({ features: [feat("Tough")] }))).toBe(2);
    expect(getHpBonusPerLevel(make({ featureSelections: { "asi-feat-4": ["Tough"] } }))).toBe(2);
    expect(getHpBonusPerLevel(make({ race: "Hill Dwarf" }))).toBe(1);
    expect(getHpBonusPerLevel(make({ class: "Sorcerer", subclass: "Draconic Bloodline", race: "Hill Dwarf", featureSelections: { "variant-human-feat": ["Tough"] } }))).toBe(4);
    expect(getHpBonusPerLevel(make({}))).toBe(0);
  });
});
