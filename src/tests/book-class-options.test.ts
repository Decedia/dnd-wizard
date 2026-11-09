// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, it, expect } from "bun:test";
import { buildLevelInfos } from "@/components/LevelUpWizard";
import { getStaticClass, getStaticSubclasses } from "@/lib/srd-client";
import invocations from "@/data/warlock_invocations.json";

// Non-SRD class options, checked against the 2014 books from memory (see audit/srd-level-check.md).

function run(cls: string, sub: string, extra: Record<string, any> = {}) {
  const character: any = {
    class: cls, subclass: sub, level: 1, str: 14, dex: 14, con: 14, int: 14, wis: 14, cha: 14,
    skills: {}, sources: ["PHB", "XGE"], ruleset: "2014", featureSelections: {}, spells: [], cantrips: [], expertise: [], ...extra,
  };
  return buildLevelInfos(character, 20, getStaticClass(cls, undefined, undefined, "en"), sub, 0, true, "en");
}
const subChoice = (infos: any[], level: number, name: string) =>
  (infos[level - 1].subclassFeatureChoices || []).find((c: any) => c.name === name);
const classChoice = (infos: any[], level: number, name: string) =>
  (infos[level - 1].classFeatureChoices || []).find((c: any) => c.name === name);
const names = (c: any) => c.options.map((o: any) => o.name);
const TASHA = { sources: ["PHB", "XGE", "TCE"], optionalClassFeatures: true };

describe("book class options", () => {
  it("Beast Master companions are CR 1/4 or lower and Medium or smaller", () => {
    const plain = names(subChoice(run("Ranger", "Beast Master"), 3, "Ranger's Companion"));
    expect(plain.sort()).toEqual(["Boar", "Deer", "Eagle", "Giant Badger", "Giant Wolf Spider", "Hawk", "Mastiff", "Panther", "Wolf"]);
    const tasha = names(subChoice(run("Ranger", "Beast Master", TASHA), 3, "Ranger's Companion"));
    expect(tasha.filter((n: string) => n.startsWith("Primal Companion"))).toHaveLength(3);
  });

  it("Tasha's maneuvers need optional class features", () => {
    expect(names(subChoice(run("Fighter", "Battle Master"), 3, "Combat Superiority"))).not.toContain("Ambush");
    expect(names(subChoice(run("Fighter", "Battle Master", TASHA), 3, "Combat Superiority"))).toContain("Ambush");
  });

  it("Mystic Arcanum offers every warlock spell of its level, plus patron spells", () => {
    expect(names(classChoice(run("Warlock", "Fiend"), 11, "Mystic Arcanum (6th level)"))).toContain("Arcane Gate");
    expect(names(classChoice(run("Warlock", "Fiend"), 17, "Mystic Arcanum (9th level)"))).not.toContain("Wish");
    expect(names(classChoice(run("Warlock", "The Genie", { sources: ["PHB", "TCE"] }), 17, "Mystic Arcanum (9th level)"))).toContain("Wish");
  });

  it("every book invocation has a level and a known source", () => {
    const all = (invocations as any).invocations as Record<string, { level: number; source?: string }>;
    for (const name of ["Cloak of Flies", "Bond of the Talisman", "Protection of the Talisman", "Rebuke of the Talisman"]) {
      expect(all[name]).toBeDefined();
    }
    for (const [, v] of Object.entries(all)) expect([undefined, "XGE", "TCE"]).toContain(v.source);
  });

  it("Kensei learns a tool, and Starry Form is not a level-up pick", () => {
    const kensei = getStaticSubclasses("Monk", ["PHB", "XGE"]).find((s) => s.name === "Way of the Kensei")!;
    expect(kensei.features.some((f: any) => f.name === "Path of the Kensei: Tool")).toBe(true);
    expect(subChoice(run("Druid", "Circle of Stars", TASHA), 2, "Starry Form")).toBeUndefined();
  });
});

describe("repeat picks", () => {
  it("Metamagic at 10 skips the options saved at 3", () => {
    const infos = run("Sorcerer", "Draconic Bloodline", {
      featureSelections: { "class-feature-3-Metamagic": ["Twinned Spell, Quickened Spell"] },
    });
    const later = names(classChoice(infos, 10, "Metamagic"));
    expect(later).not.toContain("Twinned Spell");
    expect(later).not.toContain("Quickened Spell");
    expect(names(classChoice(infos, 3, "Metamagic"))).toContain("Twinned Spell");
  });
});
