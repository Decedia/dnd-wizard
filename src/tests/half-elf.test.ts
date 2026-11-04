// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { createEmptyCharacter, getBaseSpeed, type Character } from "@/lib/storage";
import { halfElfPicksComplete } from "@/lib/character-creation";
import { getGrantedSpellNames } from "@/lib/granted-spells";
import { getStaticRaceDetails } from "@/lib/srd-client";

const make = (patch: Partial<Character>): Character =>
  ({ ...createEmptyCharacter(), sources: ["PHB", "SCAG"], ruleset: "2014", class: "Fighter", level: 1, halfElfAbilities: ["str", "con"], ...patch } as Character);

describe("half-elf versatility", () => {
  test("variants replace Skill Versatility", () => {
    const traits = getStaticRaceDetails("Half-Elf (Wood Elf)", ["SCAG"])!.traits.map((t: any) => t.name);
    expect(traits).not.toContain("Skill Versatility");
    expect(getStaticRaceDetails("Half-Elf", ["PHB"])!.traits.map((t: any) => t.name)).toContain("Skill Versatility");
  });

  test("base half-elf needs two skills, a variant needs its elf trait", () => {
    expect(halfElfPicksComplete(make({ race: "Half-Elf", halfElfSkills: ["Arcana"] }))).toBe(false);
    expect(halfElfPicksComplete(make({ race: "Half-Elf", halfElfSkills: ["Arcana", "History"] }))).toBe(true);
    expect(halfElfPicksComplete(make({ race: "Half-Elf (Wood Elf)" }))).toBe(false);
    expect(halfElfPicksComplete(make({ race: "Half-Elf (Wood Elf)", raceChoices: { "half-elf-versatility": "mask-of-the-wild" } }))).toBe(true);
    expect(halfElfPicksComplete(make({ race: "Half-Elf (Drow)" }))).toBe(true);
  });

  test("the cantrip is asked for, and granted, only when the trait is Cantrip", () => {
    const race = "Half-Elf (High Elf)";
    expect(halfElfPicksComplete(make({ race, raceChoices: { "half-elf-versatility": "cantrip" } }))).toBe(false);
    const withCantrip = make({ race, raceChoices: { "half-elf-versatility": "cantrip", "high-elf-cantrip": "fire-bolt" } });
    expect(halfElfPicksComplete(withCantrip)).toBe(true);
    expect(getGrantedSpellNames(withCantrip)).toContain("Fire Bolt");
    const weapons = make({ race, raceChoices: { "half-elf-versatility": "elf-weapon-training", "high-elf-cantrip": "fire-bolt" } });
    expect(getGrantedSpellNames(weapons)).not.toContain("Fire Bolt");
  });

  test("Fleet of Foot gives a wood half-elf 35 feet", () => {
    expect(getBaseSpeed(make({ race: "Half-Elf (Wood Elf)" }))).toBe(30);
    expect(getBaseSpeed(make({ race: "Half-Elf (Wood Elf)", raceChoices: { "half-elf-versatility": "fleet-of-foot" } }))).toBe(35);
    expect(getBaseSpeed(make({ race: "Hill Dwarf", raceChoices: { "half-elf-versatility": "fleet-of-foot" } }))).toBe(25);
  });
});
