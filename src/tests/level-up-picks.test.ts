// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { getStaticClass, getStaticFeats, getStaticSpells, getStaticSubclasses } from "@/lib/srd-client";
import { getFeatOptionGroups } from "@/data/feat-options";
import { FEAT_WHY, FIGHTING_STYLE_PICKS, INVOCATION_PICKS, MANEUVER_PICKS, METAMAGIC_PICKS, SPELL_WHY, SUBCLASS_PICKS, asiPicks, expertisePicks, spellPicks } from "@/lib/level-up-picks";
import { buildLevelInfos } from "@/components/level-up/level-infos";
import { isRecommended } from "@/lib/recommendations";
import invocationsData from "@/data/warlock_invocations.json";

function levelInfos(cls: string, sub: string) {
  const character = { id: "t", name: "t", class: cls, race: "Human", level: 0, ruleset: "2014", sources: ["PHB"], abilities: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, skills: {}, features: [], spells: [], cantrips: [] } as any;
  return buildLevelInfos(character, 20, getStaticClass(cls, undefined, undefined, "en") as any, sub, 0, true, "en");
}
const missing = (picks: { name: string }[], names: string[]) => picks.map((p) => p.name).filter((n) => !names.includes(n));

// A suggestion whose name is not in the data would never show, so these lock
// every suggested name to the data it is matched against.
describe("level-up suggestions name real options", () => {
  test("every suggested subclass exists for its class", () => {
    for (const [cls, picks] of Object.entries(SUBCLASS_PICKS)) {
      const names = new Set(getStaticSubclasses(cls, undefined, "2014").map((s) => s.name));
      for (const p of picks) expect(`${cls}: ${names.has(p.name) ? p.name : `missing ${p.name}`}`).toBe(`${cls}: ${p.name}`);
      expect(picks.length).toBeGreaterThanOrEqual(3);
    }
  });

  test("every suggested fighting style exists", () => {
    const style = getStaticClass("Fighter")?.levels[0]?.features.find((f: any) => f.name === "Fighting Style") as any;
    const names = new Set((style?.choices?.options || []).map((o: any) => (typeof o === "string" ? o : o.name)));
    for (const picks of Object.values(FIGHTING_STYLE_PICKS)) for (const p of picks) expect(names.has(p.name)).toBe(true);
  });

  test("every suggested spell exists", () => {
    const names = new Set(getStaticSpells(undefined, "2014").map((s) => s.name));
    for (const name of Object.keys(SPELL_WHY)) expect(names.has(name) ? name : `missing ${name}`).toBe(name);
  });

  test("every suggested metamagic exists", () => {
    const fc = levelInfos("Sorcerer", "Draconic").flatMap((i) => i.classFeatureChoices || []).find((c) => c.name === "Metamagic");
    expect(missing(METAMAGIC_PICKS, fc!.options.map((o) => o.name))).toEqual([]);
  });

  test("every suggested maneuver exists", () => {
    const fc = levelInfos("Fighter", "Battle Master").flatMap((i) => i.subclassFeatureChoices || []).find((c) => c.name === "Combat Superiority");
    expect(missing(MANEUVER_PICKS, fc!.options.map((o) => o.name))).toEqual([]);
  });

  test("every suggested invocation exists", () => {
    expect(missing(INVOCATION_PICKS, Object.keys((invocationsData as any).invocations))).toEqual([]);
  });

  test("every suggested expertise is a skill the class can pick", () => {
    for (const cls of ["Rogue", "Bard"]) {
      const fc = levelInfos(cls, cls === "Rogue" ? "Thief" : "Lore").flatMap((i) => i.classFeatureChoices || []).find((c) => c.name === "Expertise");
      expect(missing(expertisePicks(cls), fc!.options.map((o) => o.name))).toEqual([]);
    }
  });

  test("subclass badges use the same names as the data", () => {
    expect(isRecommended("subclass", "Life", "Cleric")).toBe(true);
    expect(isRecommended("subclass", "Champion", "Fighter")).toBe(true);
  });

  test("every suggested feat exists and needs no extra choice", () => {
    const names = new Set(getStaticFeats([], "2014").map((f) => f.name));
    for (const name of Object.keys(FEAT_WHY)) {
      expect(names.has(name) ? name : `missing ${name}`).toBe(name);
      expect(getFeatOptionGroups(name)).toEqual([]);
    }
  });
});

describe("ability score suggestions", () => {
  const scores = { str: 8, dex: 14, con: 13, int: 17, wis: 12, cha: 10 };

  test("wizard: +2 INT, +1 INT/+1 CON (both odd), then a feat", () => {
    const picks = asiPicks("Wizard", scores, ["War Caster", "Lucky"]);
    expect(picks).toHaveLength(3);
    expect(picks[0]).toMatchObject({ kind: "single", ability: "int" });
    expect(picks[1]).toMatchObject({ kind: "double", d1: "int", d2: "con" });
    expect(picks[2]).toMatchObject({ kind: "feat", feat: "War Caster" });
  });

  test("never pushes a score past 20", () => {
    const picks = asiPicks("Wizard", { ...scores, int: 20 }, []);
    for (const p of picks) {
      if (p.kind === "single") expect(p.ability).not.toBe("int");
      if (p.kind === "double") expect([p.d1, p.d2]).not.toContain("int");
    }
  });

  test("falls back to a feat anyone can use", () => {
    const picks = asiPicks("Fighter", { ...scores, str: 16 }, ["Lucky"]);
    expect(picks.find((p) => p.kind === "feat")).toMatchObject({ feat: "Lucky" });
  });
});

describe("spell suggestions", () => {
  test("only suggests spells that can be picked, newest level first", () => {
    const picks = spellPicks([
      { name: "Magic Missile", level: 1 },
      { name: "Fireball", level: 3 },
      { name: "Not A Real Spell", level: 1 },
    ]);
    expect(picks.map((p) => p.name)).toEqual(["Fireball", "Magic Missile"]);
  });
});
