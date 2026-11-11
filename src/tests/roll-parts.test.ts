// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { computeDerivedStats, createEmptyCharacter, type Character } from "@/lib/storage";
import { initiativeParts, saveParts, skillParts, spellAttackParts } from "@/lib/roll-parts";
import { skillBonus } from "@/lib/skill-bonus";
import { sumParts } from "@/lib/dice-roll";
import { spellHealing } from "@/lib/healing";
import { characterSpellDamage } from "@/lib/spell-dice";

const make = (patch: Partial<Character>): Character => {
  const c = { ...createEmptyCharacter(), name: "T", ...patch } as Character;
  return { ...c, ...computeDerivedStats(c) } as Character;
};

describe("where each bonus comes from", () => {
  const rogue = make({ class: "Rogue", level: 5, dex: 18, wis: 12, skills: { Stealth: true, Perception: true } as any, expertise: ["Stealth"] });

  test("skills: ability, proficiency, expertise", () => {
    expect(skillParts(rogue, "Stealth", "dex")).toEqual([{ source: "@dex", value: 4 }, { source: "@prof", value: 3 }, { source: "@expertise", value: 3 }]);
    expect(sumParts(skillParts(rogue, "Perception", "wis"))).toBe(skillBonus(rogue, "Perception", "wis"));
  });

  test("a number set by hand", () => {
    const set = make({ ...rogue, overrides: { "skill:Stealth": { mode: "set", value: 12 }, initiative: { mode: "add", value: 1 } } });
    expect(skillParts(set, "Stealth", "dex")).toEqual([{ source: "@byHand", value: 12 }]);
    expect(initiativeParts(set)).toEqual([{ source: "@dex", value: 4 }, { source: "@byHand", value: 1 }]);
    expect(set.initiative).toBe(5);
  });

  test("saves add up to the sheet's number, cover included", () => {
    const covered = make({ ...rogue, activeStates: ["half cover"] });
    for (const key of ["str", "dex", "con", "int", "wis", "cha"]) {
      const st = covered.savingThrows[key];
      expect(sumParts(saveParts(covered, key, st.proficient))).toBe(st.value);
    }
    expect(saveParts(covered, "dex", true).at(-1)).toEqual({ source: "@cover", value: 2 });
  });

  test("Alert and spell attack", () => {
    const wizard = make({ class: "Wizard", level: 9, int: 18, dex: 14, features: [{ id: "f", name: "Alert", description: "", source: "feat" } as any] });
    expect(initiativeParts(wizard)).toEqual([{ source: "@dex", value: 2 }, { source: "Alert", value: 5 }]);
    expect(spellAttackParts(wizard, "int")).toEqual([{ source: "@int", value: 4 }, { source: "@prof", value: 4 }]);
    expect(wizard.spellAttackBonus).toBe(8);
  });

  test("spell damage and healing name the ability", () => {
    const cleric = make({ class: "Cleric", level: 5, wis: 16 });
    const heal = spellHealing(cleric, { name: "Cure Wounds", level: 1, heal_at_slot_level: { 1: "1d8 + MOD" } }, 1)!;
    expect(heal.parts).toEqual([{ source: "@wis", value: 3 }]);
    const warlock = make({ class: "Warlock", level: 5, cha: 18, features: [{ id: "a", name: "Eldritch Invocation: Agonizing Blast", description: "", source: "class" } as any] });
    const parts = characterSpellDamage(warlock, { name: "Eldritch Blast", level: 0, school: "Evocation", classes: ["Warlock"] });
    if (parts?.[0]?.bonuses) expect(parts[0].bonuses.every((b) => b.value === 4)).toBe(true);
  });
});
