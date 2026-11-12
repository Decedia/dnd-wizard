// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { FEATURE_RULES_2024, SUB_OPTIONS, featureUsesAfterRest, ruleFor, ruleKey } from "@/data/turn-features";
import { buildTurnMenu, optionPatch } from "@/lib/turn";
import { restGains, shortRestPatch } from "@/lib/rest";
import { computeDerivedStats, createEmptyCharacter, getFeatureValue, type Character } from "@/lib/storage";
import { featureHealing } from "@/lib/healing";
import { weaponMastery } from "@/lib/weapon-mastery";
import { translations as en } from "@/locales/en.js";
import { translations as id } from "@/locales/id.js";

const make = (patch: Partial<Character>, features: string[], picks: Record<string, string[]> = {}): Character => {
  const c = {
    ...createEmptyCharacter(),
    ruleset: "2024",
    sources: ["PHB"],
    ...patch,
    featureSelections: picks,
    features: features.map((name, i) => ({ id: `f${i}`, name, description: `${name} text`, source: "class" })) as Character["features"],
  } as Character;
  return { ...c, ...computeDerivedStats(c) } as Character;
};
const options = (c: Character) => buildTurnMenu(c, []).options.filter((o) => o.group === "feature");
const find = (c: Character, name: string) => options(c).find((o) => o.name === name);
const apply = (c: Character, name: string) => ({ ...c, ...optionPatch(find(c, name)!) }) as Character;

/** Every class feature, subclass feature, species trait and feat name in the 2024 data. */
function names2024(): string[] {
  const read = (f: string) => JSON.parse(readFileSync(`src/data/en/${f}.json`, "utf8"));
  const classes = read("2024_classes").classes as any[];
  const subs = read("2024_subclasses");
  const species = read("2024_species").races as any[];
  const feats = read("2024_feats");
  return [
    ...classes.flatMap((c) => c.features.map((f: any) => f.name)),
    ...(subs.subclasses ?? subs).flatMap((s: any) => (s.features || []).map((f: any) => f.name)),
    ...species.flatMap((s) => s.traits.map((t: any) => t.name)),
    ...(feats.feats ?? feats).map((f: any) => f.name),
  ];
}

describe("2024 feature table", () => {
  const names = names2024();

  test("every rule matches a 2024 feature name", () => {
    expect(FEATURE_RULES_2024.filter((r) => !names.some((n) => r.name.test(n))).map(ruleKey)).toEqual([]);
  });

  test("every 2024 sub-option group belongs to a 2024 feature", () => {
    const c = make({}, []);
    const groups = SUB_OPTIONS.filter((g) => g.only && g.only({ ...c, class: g.feature === "Channel Divinity" ? "Cleric" : c.class }));
    expect(groups.filter((g) => !names.includes(g.feature)).map((g) => g.feature)).toEqual([]);
  });

  test("every new turn line has English and Indonesian text", () => {
    const keys = [
      ...FEATURE_RULES_2024.flatMap((r) => [r.when && `turn.when.${r.when}`, r.condition && `turn.cond.${r.condition}`]),
      ...SUB_OPTIONS.flatMap((g) => g.options).flatMap((o) => [`turn.sub.${o.key}`, o.condition && `turn.cond.${o.condition}`]),
      ...["Cleave", "Graze", "Nick", "Push", "Sap", "Slow", "Topple", "Vex"].map((m) => `mastery.text.${m}`),
      "turn.cost.focusPoints", "turn.cost.focusChoose", "rest.gain.focus",
    ].filter((k): k is string => !!k);
    expect(keys.filter((k) => !(k in (en as any)))).toEqual([]);
    expect(keys.filter((k) => !(k in (id as any)))).toEqual([]);
  });

  test("the 2024 timings differ from 2014 where the rules changed", () => {
    const old = make({ ruleset: "2014", class: "Druid", level: 2 }, []);
    const now = make({ class: "Druid", level: 2 }, []);
    expect(ruleFor(old, "Wild Shape")?.slot).toBe("action");
    expect(ruleFor(now, "Wild Shape")?.slot).toBe("bonus");
    expect(ruleFor(now, "Lay On Hands")?.slot).toBe("bonus");
    expect(ruleFor(now, "Countercharm")?.slot).toBe("reaction");
    expect(ruleFor(now, "Indomitable")?.when).toBe("onFailSave");
    expect(ruleFor(now, "Unarmored Defense")).toBeUndefined();
  });
});

describe("2024 class features on a turn", () => {
  test("Second Wind grows with level, and Tactical Mind spends the same uses", () => {
    const f = make({ class: "Fighter", level: 4 }, ["Second Wind", "Tactical Mind"]);
    expect(find(f, "Second Wind")!.cost?.values).toEqual({ left: 3, max: 3 });
    const after = apply(f, "Tactical Mind");
    expect(find(after, "Second Wind")!.cost?.values).toEqual({ left: 2, max: 3 });
    // A short rest gives one use back, a long rest all.
    const twice = apply(after, "Second Wind");
    expect(featureUsesAfterRest(twice.featureUses, "short", twice)).toEqual({ secondWind: 1 });
  });

  test("Monk's Focus: free Disengage or Dash, and Focus for the stronger version", () => {
    const m = make({ class: "Monk", level: 5 }, ["Monk's Focus", "Uncanny Metabolism"]);
    expect(find(m, "Patient Defense")!.cost).toBeUndefined();
    const dodge = find(m, "Patient Defense + Dodge")!;
    expect(dodge.cost?.key).toBe("turn.cost.focusPoints");
    expect(apply(m, "Flurry of Blows").kiPoints).toBe(4);
    // Uncanny Metabolism fills Focus back up on initiative.
    const spent = { ...m, kiPoints: 1 } as Character;
    expect(apply(spent, "Uncanny Metabolism").kiPoints).toBe(5);
  });

  test("Cleric Channel Divinity offers Divine Spark and Turn Undead; Blessed Strikes only with Divine Strike", () => {
    const c = make({ class: "Cleric", level: 7 }, ["Channel Divinity", "Blessed Strikes"], { "class-feature-7-Blessed Strikes": ["Potent Spellcasting"] });
    expect(options(c).map((o) => o.name)).toEqual(expect.arrayContaining(["Divine Spark", "Turn Undead"]));
    expect(find(c, "Blessed Strikes")).toBeUndefined();
    const strike = make({ class: "Cleric", level: 14 }, ["Blessed Strikes"], { "class-feature-7-Blessed Strikes": ["Divine Strike"] });
    expect(find(strike, "Blessed Strikes")!.featureDice).toBe("2d8");
  });

  test("Paladin Channel Divinity is Divine Sense, a bonus action", () => {
    const p = make({ class: "Paladin", level: 3 }, ["Channel Divinity", "Lay On Hands"]);
    expect(find(p, "Divine Sense")!.slot).toBe("bonus");
    expect(find(p, "Lay On Hands")!.amount).toEqual({ field: "layOnHandsPool", max: 15 });
  });

  test("Cunning Strike options open up with level", () => {
    const r5 = make({ class: "Rogue", level: 5 }, ["Cunning Strike"]);
    expect(options(r5).map((o) => o.name)).toEqual(["Poison", "Trip", "Withdraw"]);
    const r14 = make({ class: "Rogue", level: 14 }, ["Cunning Strike"]);
    expect(options(r14).map((o) => o.name)).toContain("Knock Out");
    expect(getFeatureValue("Sneak Attack", r14)).toBe("7d6");
  });

  test("2024 Metamagic costs and Font of Magic slot trading", () => {
    const s = make({ class: "Sorcerer", level: 5, cha: 16, sorceryPoints: 2 }, ["Metamagic", "Font of Magic"], { "class-feature-2-Metamagic": ["Heightened Spell, Twinned Spell"] });
    expect(find(s, "Heightened Spell")!.cost?.values.amount).toBe(2);
    expect(find(s, "Twinned Spell")!.cost?.values.amount).toBe(1);
    const flex = options(s).filter((o) => o.key.startsWith("flex:"));
    expect(flex.find((o) => o.key.startsWith("flex:convert"))!.slot).toBe("free");
    expect(flex.some((o) => o.key.startsWith("flex:create"))).toBe(true);
    expect(buildTurnMenu(s, []).features.map((f) => f.name)).not.toContain("Font of Magic");
  });

  test("Goliath Giant Ancestry shows only the picked boon", () => {
    const g = make({ class: "Fighter", level: 1, race: "Goliath", raceChoices: { "goliath-2024-lineage": "giant-ancestry-stones-endurance" } }, ["Giant Ancestry"]);
    expect(options(g).map((o) => o.name)).toEqual(["Stone's Endurance"]);
    expect(find(g, "Stone's Endurance")!.slot).toBe("reaction");
  });

  test("Wholeness of Body heals a Martial Arts die plus WIS in 2024", () => {
    const m = make({ class: "Monk", level: 6, wis: 16 }, []);
    expect(featureHealing(m, "Wholeness of Body")).toMatchObject({ dice: "1d8", bonus: 3 });
  });
});

describe("2024 short rest", () => {
  test("one Rage, one Channel Divinity and one Wild Shape come back; Focus all", () => {
    const b = make({ class: "Barbarian", level: 5 }, []);
    expect(shortRestPatch({ ...b, rages: 0 } as Character).rages).toBe(1);
    const c = make({ class: "Cleric", level: 6 }, []);
    expect(shortRestPatch({ ...c, channelDivinityUses: 0 } as Character).channelDivinityUses).toBe(1);
    const d = make({ class: "Druid", level: 6 }, []);
    expect(shortRestPatch({ ...d, wildShapeUses: 0 } as Character).wildShapeUses).toBe(1);
    const m = make({ class: "Monk", level: 5 }, []);
    const tired = { ...m, kiPoints: 0 } as Character;
    expect(shortRestPatch(tired).kiPoints).toBe(5);
    expect(restGains(tired, "short")).toContainEqual({ id: "focus", values: { count: 5 } });
  });

  test("Sorcerous Restoration gives half the level back once per long rest", () => {
    const s = { ...make({ class: "Sorcerer", level: 6 }, []), sorceryPoints: 0 } as Character;
    const once = { ...s, ...shortRestPatch(s) } as Character;
    expect(once.sorceryPoints).toBe(3);
    expect(shortRestPatch({ ...once, sorceryPoints: 0 } as Character).sorceryPoints).toBeUndefined();
  });
});

describe("Weapon Mastery", () => {
  const row = { itemId: undefined, srdItemName: "Longsword", name: "Longsword" };
  test("only for trained weapon kinds, only in 2024", () => {
    const trained = make({ class: "Fighter", level: 1 }, [], { "class-feature-1-Weapon Mastery": ["Longsword, Shortbow, Greataxe"] });
    expect(weaponMastery(trained, row)).toBe("Sap");
    expect(weaponMastery(trained, { ...row, srdItemName: "Dagger", name: "Dagger" })).toBeUndefined();
    expect(weaponMastery({ ...trained, ruleset: "2014" }, row)).toBeUndefined();
  });
});
