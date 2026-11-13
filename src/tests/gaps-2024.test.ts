// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { computeDerivedStats, createEmptyCharacter, type Character } from "@/lib/storage";
import { buildTurnMenu, optionPatch } from "@/lib/turn";
import { equipRow, rowFromCatalog, type InventoryRow } from "@/lib/inventory";
import { findCatalogItem } from "@/data/item-catalog";
import { getWeaponAttackDetails, isMonkWeapon, martialArtsDie } from "@/lib/weapon-attacks";
import { asiPicks, defaultFeatOptions } from "@/lib/level-up-picks";
import { inspiringLeaderTempHp, longRestPatch, restGains, shortRestPatch } from "@/lib/rest";
import { getFeatOptionGroups } from "@/data/feat-options";
import { translations as en } from "@/locales/en.js";
import { translations as id } from "@/locales/id.js";

const item = (itemId: string): InventoryRow => ({ ...rowFromCatalog(findCatalogItem(itemId)!), id: itemId });
const make = (over: Partial<Character>): Character => {
  const c = { ...createEmptyCharacter(), ruleset: "2024", sources: ["PHB"], ...over } as Character;
  return { ...c, ...computeDerivedStats(c) } as Character;
};
const unarmed = (c: Character) => buildTurnMenu(c, []).options.find((o) => o.key === "attack:unarmed")!;

describe("Martial Arts", () => {
  test("a Monk's unarmed strike uses the Martial Arts die and the better of STR and DEX", () => {
    const monk = make({ class: "Monk", level: 5, str: 10, dex: 16 });
    expect(martialArtsDie(monk)).toBe("1d8");
    const u = unarmed(monk);
    expect(u.damageRoll?.dice).toBe("1d8");
    expect(u.toHit).toBe(3 + 3);
    expect(u.tags).toEqual(["melee"]);
    expect(unarmed({ ...monk, ruleset: "2014", level: 1 } as Character).damageRoll?.dice).toBe("1d4");
  });

  test("armor or a shield turns Martial Arts off; other classes punch for 1 + STR", () => {
    const armored = make({ class: "Monk", level: 5, dex: 16, inventory: [{ ...item("leather-armor"), equipped: true }] });
    expect(martialArtsDie(armored)).toBeUndefined();
    expect(unarmed(make({ class: "Fighter", level: 5, str: 14 })).damageRoll).toBeUndefined();
  });

  test("Monk weapons use DEX and the bigger die; other weapons don't", () => {
    const inventory = equipRow([item("quarterstaff")], "quarterstaff", "main").inventory;
    const monk = make({ class: "Monk", level: 5, str: 10, dex: 16, inventory });
    const staff = getWeaponAttackDetails(monk, { id: "quarterstaff" } as any)!;
    expect([staff.abilityKey, staff.damageDice]).toEqual(["dex", "1d8"]);
    expect(isMonkWeapon(monk, item("shortsword"))).toBe(true);
    expect(isMonkWeapon(monk, item("greatsword"))).toBe(false);
    expect(isMonkWeapon({ ...monk, ruleset: "2014" } as Character, item("scimitar"))).toBe(false);
    expect(isMonkWeapon(monk, item("scimitar"))).toBe(true);
  });
});

describe("feat numbers", () => {
  test("Thrown Weapon Fighting adds 2 to a thrown ranged weapon", () => {
    const inventory = equipRow([item("dart")], "dart", "main").inventory;
    const c = make({ class: "Fighter", level: 1, dex: 16, inventory, featureSelections: { "class-feature-1-Fighting Style": ["Thrown Weapon Fighting"] } });
    expect(getWeaponAttackDetails(c, { id: "dart" } as any)!.damageBonus).toBe(3 + 2);
  });

  test("Inspiring Leader gives level + CHA (2024: or WIS) temporary HP after a rest", () => {
    const leader = make({ class: "Paladin", level: 8, cha: 16, wis: 14, temporaryHp: 0, featureSelections: { "asi-feat-4": ["Inspiring Leader"], "asi-feat-4-options": ["ability=cha"] } });
    expect(inspiringLeaderTempHp(leader)).toBe(8 + 3);
    expect(longRestPatch(leader).temporaryHp).toBe(11);
    expect(shortRestPatch(leader).temporaryHp).toBe(11);
    expect(restGains(leader, "long").some((g) => g.id === "inspiringLeader")).toBe(true);
    const wise = make({ ...leader, featureSelections: { "asi-feat-4": ["Inspiring Leader"], "asi-feat-4-options": ["ability=wis"] } });
    expect(inspiringLeaderTempHp(wise)).toBe(8 + 2);
    expect(inspiringLeaderTempHp(make({ class: "Paladin", level: 8 }))).toBe(0);
    expect([en["rest.gain.inspiringLeader"], id["rest.gain.inspiringLeader"]].every(Boolean)).toBe(true);
  });

  test("Chef treats give the Proficiency Bonus in temporary HP", () => {
    const chef = make({ class: "Fighter", level: 5, temporaryHp: 0, features: [{ id: "chef", name: "Chef", description: "", source: "custom" }] as Character["features"] });
    const treat = buildTurnMenu(chef, []).options.find((o) => o.name === "Chef")!;
    expect(treat.slot).toBe("bonus");
    expect(optionPatch(treat).temporaryHp).toBe(3);
  });

  test("Ritual Caster asks for as many spells as the Proficiency Bonus", () => {
    const groups = getFeatOptionGroups("Ritual Caster", "2024").filter((g) => g.type === "spell");
    const at = (level: number) => groups.filter((g) => !g.minLevel || g.minLevel <= level).length;
    expect([at(4), at(5), at(9), at(13), at(17)]).toEqual([2, 3, 4, 5, 6]);
  });
});

describe("2024 feat suggestion cards", () => {
  const scores = { str: 16, dex: 12, con: 14, int: 8, wis: 10, cha: 10 };

  test("a Fighter is offered Great Weapon Master with its +1 going to STR", () => {
    const pick = asiPicks("Fighter", scores, ["Great Weapon Master", "Sentinel", "Durable"], "2024").find((p) => p.kind === "feat");
    expect(pick?.kind === "feat" && pick.feat).toBe("Great Weapon Master");
    expect(defaultFeatOptions("Great Weapon Master", "2024", "Fighter", scores)).toEqual({ ability: "str" });
  });

  test("the +1 skips a score already at 20, and feats with other picks get no card", () => {
    expect(defaultFeatOptions("Sentinel", "2024", "Fighter", { ...scores, str: 20 })).toEqual({ ability: "dex" });
    expect(defaultFeatOptions("Fey Touched", "2024", "Wizard", scores)).toBeNull();
    expect(defaultFeatOptions("War Caster", "2024", "Wizard", { ...scores, int: 16 })).toEqual({ ability: "int" });
  });
});

import { activeResistances, damageResistances, reducedDamage } from "@/lib/resistances";
import { addFeatPicks, openFeatPicks } from "@/lib/feat-grants";

describe("damage resistances", () => {
  const types = (c: Character) => damageResistances(c).map((r) => r.type).sort();
  const feature = (name: string) => ({ id: name, name, description: "", source: "class" });

  test("species: 2024 Dwarf, Tiefling legacy, Dragonborn ancestor, 2014 Dragonborn, Aasimar", () => {
    expect(types(make({ race: "Dwarf" }))).toEqual(["Poison"]);
    expect(types(make({ race: "Tiefling", raceChoices: { "tiefling-2024-lineage": "fiendish-legacy-infernal" } }))).toEqual(["Fire"]);
    expect(types(make({ race: "Dragonborn", raceChoices: { "dragonborn-2024-lineage": "draconic-ancestor-silver" } }))).toEqual(["Cold"]);
    expect(types(make({ race: "Dragonborn", ruleset: "2014", raceChoices: { "draconic-ancestry": "red" } }))).toEqual(["Fire"]);
    expect(types(make({ race: "Aasimar", sources: ["PHB", "PHB2024"] }))).toEqual(["Necrotic", "Radiant"]);
    expect(types(make({ race: "Human" }))).toEqual([]);
  });

  test("Rage counts only while raging; the Bear totem resists all but Psychic", () => {
    const barb = make({ class: "Barbarian", level: 3, ruleset: "2014", features: [feature("Rage"), feature("Totem Spirit")] as Character["features"], featureSelections: { "subclass-feature-3-Totem Spirit": ["Bear"] } });
    expect(damageResistances(barb).filter((r) => r.source === "Rage").map((r) => r.type)).toEqual(["Bludgeoning", "Piercing", "Slashing"]);
    expect(activeResistances(barb)).toEqual([]);
    const raging = { ...barb, activeStates: ["raging"] } as Character;
    expect(new Set(activeResistances(raging).map((r) => r.type)).size).toBe(12);
    expect(activeResistances(raging).some((r) => r.type === "Psychic")).toBe(false);
  });

  test("feats and immunities", () => {
    const boon = make({ class: "Fighter", level: 19, featureSelections: { "asi-feat-19": ["Boon of Energy Resistance"], "asi-feat-19-options": ["ability=str", "resistance_1=Fire", "resistance_2=Cold"] } });
    expect(types(boon)).toEqual(["Cold", "Fire"]);
    const monk = make({ class: "Monk", level: 10, ruleset: "2014", features: [feature("Purity of Body")] as Character["features"] });
    expect(damageResistances(monk)).toEqual([{ type: "Poison", source: "Purity of Body", immune: true }]);
    expect([reducedDamage(15, "normal"), reducedDamage(15, "resist"), reducedDamage(15, "immune")]).toEqual([15, 7, 0]);
  });
});

describe("thrown attacks", () => {
  test("a javelin can be thrown, with Thrown Weapon Fighting +2 only on the throw", () => {
    const inventory = equipRow([item("javelin")], "javelin", "main").inventory;
    const c = make({ class: "Fighter", level: 1, str: 16, inventory, attacks: [{ id: "javelin", name: "Javelin", source: "weapon" }] as any, featureSelections: { "class-feature-1-Fighting Style": ["Thrown Weapon Fighting"] } });
    const menu = buildTurnMenu(c, []).options;
    const melee = menu.find((o) => o.key === "attack:javelin")!;
    const thrown = menu.find((o) => o.key === "attack:javelin:thrown")!;
    expect(melee.damageRoll?.parts?.reduce((a, p) => a + p.value, 0)).toBe(3);
    expect(thrown.damageRoll?.parts?.reduce((a, p) => a + p.value, 0)).toBe(5);
    expect(thrown.tags).toEqual(["ranged", "thrown"]);
    expect([en["turn.throwName"], id["turn.throwName"]].every(Boolean)).toBe(true);
  });
});

describe("Ritual Caster grows with the Proficiency Bonus", () => {
  test("level 5 owes a third ritual spell; picking it adds the spell and keeps the old picks", () => {
    const c = make({ class: "Wizard", level: 5, int: 16, featureSelections: { "asi-feat-4": ["Ritual Caster"], "asi-feat-4-options": ["ability=int", "ritual_spell_1=Detect Magic", "ritual_spell_2=Find Familiar"] } });
    expect(openFeatPicks(c)).toEqual([{ feat: "Ritual Caster", key: "asi-feat-4", groupIds: ["ritual_spell_3"] }]);
    expect(openFeatPicks({ ...c, level: 4 } as Character)).toEqual([]);
    const patch = addFeatPicks(c, "asi-feat-4", "Ritual Caster", { ritual_spell_3: "Alarm" });
    expect(patch.featureSelections?.["asi-feat-4-options"]).toContain("ritual_spell_3=Alarm");
    expect(patch.featureSelections?.["asi-feat-4-options"]).toContain("ritual_spell_1=Detect Magic");
    expect(patch.spells?.some((s) => s.name === "Alarm")).toBe(true);
    expect(openFeatPicks({ ...c, ...patch } as Character)).toEqual([]);
  });
});
