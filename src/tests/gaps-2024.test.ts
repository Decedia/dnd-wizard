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
