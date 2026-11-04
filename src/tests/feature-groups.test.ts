// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { getFeatPicks, getFeaturePicks, matchesFeatureSearch, poolMax } from "@/lib/feature-groups";
import { createEmptyCharacter, type Character } from "@/lib/storage";

const sel = (featureSelections: Record<string, string[]>) => ({ featureSelections });

describe("feature picks", () => {
  test("class, subclass and later picks of one feature are gathered", () => {
    const c = sel({
      "class-feature-1-Fighting Style": ["Defense"],
      "subclass-feature-3-Path of the Kensei": ["Longsword"],
      "subclass-feature-3-Path of the Kensei: Ranged Weapon": ["Shortbow"],
      "subclass-feature-6-Path of the Kensei: 6th-level Weapon": ["Spear"],
      "subclass-feature-3-Maneuvers": ["Riposte, Trip Attack"],
    });
    expect(getFeaturePicks(c, "Fighting Style")).toEqual(["Defense"]);
    expect(getFeaturePicks(c, "Path of the Kensei")).toEqual(["Longsword", "Shortbow", "Spear"]);
    expect(getFeaturePicks(c, "Maneuvers")).toEqual(["Riposte", "Trip Attack"]);
    expect(getFeaturePicks(c, "Extra Attack")).toEqual([]);
  });

  test("a feat shows its level and options", () => {
    const c = sel({ "asi-feat-6": ["Fey Touched"], "asi-feat-6-options": ["ability=wis", "first_level_spell=Bless"] });
    expect(getFeatPicks(c, "Fey Touched")).toEqual({ taken: true, level: 6, picks: ["+1 WIS", "Bless"] });
    expect(getFeatPicks(sel({ "variant-human-feat": ["Alert"] }), "Alert")).toEqual({ taken: true, level: null, picks: [] });
    expect(getFeatPicks(c, "Tough").taken).toBe(false);
  });

  test("a feat taken twice lists both picks at its first level", () => {
    const c = sel({
      "asi-feat-8": ["Elemental Adept"],
      "asi-feat-8-options": ["damage_type=Cold"],
      "asi-feat-4": ["Elemental Adept"],
      "asi-feat-4-options": ["damage_type=Fire"],
    });
    const info = getFeatPicks(c, "Elemental Adept");
    expect(info.taken).toBe(true);
    expect(info.level).toBe(4);
    expect([...info.picks].sort()).toEqual(["Cold", "Fire"]);
  });
});

test("search looks at name, summary and picks", () => {
  expect(matchesFeatureSearch("ripo", ["Maneuvers", "Spend dice", "Riposte"])).toBe(true);
  expect(matchesFeatureSearch("zzz", ["Maneuvers"])).toBe(false);
  expect(matchesFeatureSearch("  ", ["x"])).toBe(true);
});

test("pool max follows the max-field naming", () => {
  const c = { ...createEmptyCharacter(), maxRages: 3, maxSuperiorityDice: 0 } as Character;
  expect(poolMax(c, "rages")).toBe(3);
  expect(poolMax(c, "superiorityDice")).toBe(null);
});
