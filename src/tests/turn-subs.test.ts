// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { SUB_OPTIONS } from "@/data/turn-features";
import { buildTurnMenu, critExtraDice, endTurnPatch, optionPatch } from "@/lib/turn";
import { shortRestPatch, longRestPatch } from "@/lib/rest";
import { computeDerivedStats, createEmptyCharacter, type Character } from "@/lib/storage";
import { getStaticSpells } from "@/lib/srd-client";
import { spellDamageBonuses } from "@/lib/spell-damage-bonus";
import subclassChoices from "@/data/subclass_feature_choices.json";

const make = (patch: Partial<Character>, features: string[], picks: Record<string, string[]> = {}): Character => {
  const c = {
    ...createEmptyCharacter(),
    ruleset: "2014",
    ...patch,
    featureSelections: picks,
    features: features.map((name, i) => ({ id: `f${i}`, name, description: `${name} text`, source: "class" })) as Character["features"],
  } as Character;
  return { ...c, ...computeDerivedStats(c) } as Character;
};
const options = (c: Character) => buildTurnMenu(c, []).options.filter((o) => o.group === "feature");
const find = (c: Character, name: string) => options(c).find((o) => o.name === name);
const apply = (c: Character, name: string) => ({ ...c, ...optionPatch(find(c, name)!) }) as Character;

describe("Metamagic", () => {
  const sorc = make({ class: "Sorcerer", level: 5, cha: 16 }, ["Metamagic", "Font of Magic"], { "class-feature-3-Metamagic": ["Quickened Spell, Twinned Spell"] });

  test("only the picked options show, each with its sorcery point cost", () => {
    const names = options(sorc).map((o) => o.name);
    expect(names).toContain("Quickened Spell");
    expect(names).toContain("Twinned Spell");
    expect(names).not.toContain("Careful Spell");
    expect(names).not.toContain("Metamagic");
    const quick = find(sorc, "Quickened Spell")!;
    expect(quick.slot).toBe("free");
    expect(quick.when).toBe("onCast");
    expect(apply(sorc, "Quickened Spell").sorceryPoints).toBe(sorc.sorceryPoints! - 2);
    // Twinned costs the spell's level: the player picks the amount.
    expect(find(sorc, "Twinned Spell")!.amount).toEqual({ field: "sorceryPoints", max: sorc.sorceryPoints! });
  });

  test("the picked options leave the read-only list", () => {
    expect(buildTurnMenu(sorc, []).features.map((f) => f.name)).not.toContain("Metamagic");
  });
});

describe("Flexible Casting", () => {
  const base = make({ class: "Sorcerer", level: 5 }, ["Flexible Casting: Creating Spell Slots", "Flexible Casting: Converting Spell Slot"]);

  test("a slot turns into points, and points buy a spent slot back", () => {
    // Points start full, so there is nothing to gain yet: one row says why.
    const converts = options(base).filter((o) => o.key.startsWith("flex:convert"));
    expect(converts.map((o) => o.blocked)).toEqual(["full"]);
    expect(converts[0].slot).toBe("bonus");
    const low = { ...base, sorceryPoints: 1, spellSlotsExpended: { 1: 1 } } as Character;
    const conv = options(low).find((o) => o.key === "flex:convert:2")!;
    expect(conv.blocked).toBeUndefined();
    const after = { ...low, ...optionPatch(conv) } as Character;
    expect(after.sorceryPoints).toBe(3);
    expect(after.spellSlotsExpended?.[2]).toBe(1);
    // A level 1 slot costs 2 points; one is spent, so it can come back.
    const create = options(after).find((o) => o.key === "flex:create:1")!;
    expect(create.blocked).toBeUndefined();
    const back = { ...after, ...optionPatch(create) } as Character;
    expect(back.sorceryPoints).toBe(1);
    expect(back.spellSlotsExpended?.[1]).toBe(0);
    // With points to pay, only levels with a spent slot are offered.
    const rich = options({ ...back, sorceryPoints: 5 } as Character).filter((o) => o.key.startsWith("flex:create")).map((o) => o.key);
    expect(rich).toEqual(["flex:create:2"]);
    const none = options({ ...back, sorceryPoints: 5, spellSlotsExpended: {} } as Character).filter((o) => o.key.startsWith("flex:create"));
    expect(none.map((o) => o.blocked)).toEqual(["slotsFull"]);
  });
});

describe("Battle Master maneuvers", () => {
  const bm = make({ class: "Fighter", subclass: "Battle Master", level: 3 }, ["Combat Superiority"], { "subclass-feature-3-Combat Superiority": ["Riposte, Trip Attack, Precision Attack"] });

  test("each picked maneuver is its own row and spends a die", () => {
    expect(bm.maxSuperiorityDice).toBe(4);
    expect(find(bm, "Combat Superiority")).toBeUndefined();
    expect(find(bm, "Riposte")!.slot).toBe("reaction");
    expect(find(bm, "Trip Attack")!.when).toBe("onHit");
    expect(apply(bm, "Precision Attack").superiorityDice).toBe(3);
  });

  test("without picks the general Combat Superiority row stays", () => {
    const none = make({ class: "Fighter", subclass: "Battle Master", level: 3 }, ["Combat Superiority"]);
    expect(find(none, "Combat Superiority")).toBeDefined();
  });
});

describe("Rune Knight runes", () => {
  const picks = { "subclass-feature-3-Rune Carver": ["Fire Rune, Hill Rune"] };

  test("each rune once per short rest, twice from level 15", () => {
    const rk = make({ class: "Fighter", subclass: "Rune Knight", level: 3 }, ["Rune Carver"], picks);
    expect(find(rk, "Fire Rune")!.when).toBe("onHit");
    const used = apply(rk, "Hill Rune");
    expect(find(used, "Hill Rune")!.blocked).toBe("empty");
    expect(find(used, "Fire Rune")!.blocked).toBeUndefined();
    const rested = { ...used, ...shortRestPatch(used) } as Character;
    expect(find(rested, "Hill Rune")!.blocked).toBeUndefined();
    const master = make({ class: "Fighter", subclass: "Rune Knight", level: 15 }, ["Rune Carver"], picks);
    expect(find(apply(master, "Hill Rune"), "Hill Rune")!.blocked).toBeUndefined();
  });
});

describe("Psi Warrior", () => {
  const psi = make({ class: "Fighter", subclass: "Psi Warrior", level: 3, int: 14 }, ["Psionic Power"]);

  test("psionic dice: twice the proficiency bonus, back on a long rest", () => {
    expect(psi.maxPsionicDice).toBe(4);
    expect(make({ class: "Fighter", subclass: "Psi Warrior", level: 9 }, []).maxPsionicDice).toBe(8);
    const spent = apply(psi, "Psionic Strike");
    expect(spent.psionicDice).toBe(3);
    expect(({ ...spent, ...shortRestPatch(spent) } as Character).psionicDice).toBe(3);
    expect(({ ...spent, ...longRestPatch(spent) } as Character).psionicDice).toBe(4);
  });

  test("Telekinetic Movement is free once, then costs a die", () => {
    const once = apply(psi, "Telekinetic Movement");
    expect(once.psionicDice).toBe(4);
    const twice = apply(once, "Telekinetic Movement");
    expect(twice.psionicDice).toBe(3);
  });

  test("a Soulknife's Psionic Power is not the Psi Warrior's", () => {
    const rogue = make({ class: "Rogue", subclass: "Soulknife", level: 3, int: 14 }, ["Psionic Power"]);
    expect(find(rogue, "Psionic Strike")).toBeUndefined();
    expect(buildTurnMenu(rogue, []).features.map((f) => f.name)).toContain("Psionic Power");
  });

  test("recovering a die: blocked while full, once per short rest", () => {
    expect(find(psi, "Recover a psionic die")!.blocked).toBe("full");
    const spent = apply(apply(psi, "Psionic Strike"), "Psionic Strike");
    const back = apply(spent, "Recover a psionic die");
    expect(back.psionicDice).toBe(3);
    expect(find(back, "Recover a psionic die")!.blocked).toBe("empty");
  });
});

test("every sub-option names a real pick in the app data", () => {
  const choices = subclassChoices as any;
  const known = new Set<string>([
    ...choices.Fighter["Battle Master"]["Combat Superiority"].options.map((o: any) => o.name),
    ...choices.Fighter["Rune Knight"]["Rune Carver"].options.map((o: any) => o.name),
    // Hunter picks are saved as "Hunter's Prey: Colossus Slayer".
    ...Object.values(choices.Ranger.Hunter).flatMap((f: any) => f.options.map((o: any) => o.name.split(": ").pop())),
  ]);
  const classes = ["2014_classes", "2024_classes", "2024_species"].map((f) => readFileSync(`src/data/en/${f}.json`, "utf8")).join("\n");
  const feats = readFileSync("src/data/feat-options.ts", "utf8");
  for (const group of SUB_OPTIONS) {
    if (!group.picked) continue;
    for (const o of group.options) {
      const found = known.has(o.name) || classes.includes(`"${o.name}"`) || feats.includes(`"${o.name}"`);
      expect(`${group.feature}: ${o.name} ${found}`).toBe(`${group.feature}: ${o.name} true`);
    }
  }
});

describe("spell dice bonuses", () => {
  const spells = getStaticSpells(undefined, "2014") as any[];
  const spell = (name: string) => {
    const s = spells.find((x) => x.name === name)!;
    return { name: s.name, level: s.level, school: s.school, classes: s.classes, damageType: s.damage?.damageType, description: s.description };
  };
  const lines = (c: Character, name: string) => spellDamageBonuses(c, spell(name)).map((b) => `${b.source} ${b.dice ?? b.value} ${b.per}`);

  test("Blessed Strikes: +1d8 radiant once per turn on cantrips only", () => {
    const cleric = make({ class: "Cleric", level: 8 }, ["Blessed Strikes"]);
    expect(lines(cleric, "Sacred Flame")).toContain("Blessed Strikes 1d8 radiant oncePerTurn");
    expect(lines(cleric, "Guiding Bolt")).not.toContain("Blessed Strikes 1d8 radiant oncePerTurn");
  });

  test("Arcane Firearm: +1d8 on artificer spells (and an Artificer sheet computes at all)", () => {
    const art = make({ class: "Artificer", level: 5 }, ["Arcane Firearm"]);
    expect(lines(art, "Fire Bolt")).toContain("Arcane Firearm 1d8 roll");
    expect(lines(art, "Sacred Flame")).toEqual([]);
  });

  test("Hexblade's Curse: proficiency bonus against the cursed target", () => {
    const hex = make({ class: "Warlock", level: 5 }, ["Hexblade's Curse"]);
    expect(lines(hex, "Eldritch Blast")).toContain("Hexblade's Curse 3 target");
  });
});

describe("once per turn", () => {
  const hunter = make({ class: "Ranger", subclass: "Hunter", level: 11 }, ["Hunter's Prey", "Multiattack", "Defensive Tactics", "Sneak Attack"], {
    "subclass-feature-3-Hunter's Prey": ["Hunter's Prey: Colossus Slayer"],
    "subclass-feature-11-Multiattack": ["Multiattack: Volley"],
    "subclass-feature-7-Defensive Tactics": ["Defensive Tactics: Steel Will"],
  });

  test("Colossus Slayer is a free row that greys out until End turn", () => {
    const row = find(hunter, "Colossus Slayer")!;
    expect(row.slot).toBe("free");
    expect(row.oncePerTurn).toBe(true);
    expect(row.condition).toBe("hurt");
    const used = apply(hunter, "Colossus Slayer");
    expect(find(used, "Colossus Slayer")!.blocked).toBe("usedThisTurn");
    const next = { ...used, ...endTurnPatch(used, []) } as Character;
    expect(find(next, "Colossus Slayer")!.blocked).toBeUndefined();
    expect(find(hunter, "Giant Killer")).toBeUndefined();
  });

  test("Hunter picks: Volley is an action, a passive pick stays in the read-only list", () => {
    expect(find(hunter, "Volley")!.slot).toBe("action");
    expect(buildTurnMenu(hunter, []).features.map((f) => f.name)).toContain("Defensive Tactics");
  });

  test("ready on-hit rows come first, used ones last", () => {
    const names = options(apply(hunter, "Sneak Attack")).filter((o) => o.slot === "free").map((o) => o.name);
    expect(names.indexOf("Colossus Slayer")).toBeLessThan(names.indexOf("Sneak Attack"));
  });

  test("Brutal Critical and Savage Attacks add weapon dice on a crit", () => {
    const orc = make({ class: "Barbarian", race: "Half-Orc", level: 13 }, ["Brutal Critical (2 dice)", "Savage Attacks"]);
    expect(critExtraDice(orc, "1d12 + 4 slashing")).toEqual({ dice: "3d12", sources: ["Brutal Critical", "Savage Attacks"] });
    expect(critExtraDice(hunter, "1d8 + 3 piercing")).toBeNull();
  });
});
