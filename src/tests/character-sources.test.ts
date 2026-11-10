// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { getStaticClass, getStaticSpells } from "@/lib/srd-client";
import { computeDerivedStats, getMaxPreparedSpells, getSpellSlotTable, normalizeCharacter, type Character } from "@/lib/storage";
import { isFinesseOrRanged, weaponAbility, withCatalogStats } from "@/lib/inventory";
import { fillPrepared, needsPrepare, preparableSpells, suggestPrepared } from "@/lib/prepared-spells";
import { buildTurnMenu } from "@/lib/turn";
import { getWeaponAttackDetails } from "@/lib/weapon-attacks";
import oldSave from "./fixtures/old-save-wizard-12.json";

const spells = getStaticSpells(undefined, "2014") as any[];
const CLASSES = ["Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard"];
const open = (c: any): Character => {
  const n = normalizeCharacter(c as Character);
  return { ...n, ...computeDerivedStats(n) } as Character;
};

describe("spell slots follow the class table", () => {
  test("every class at every level, whatever was saved", () => {
    for (const cls of CLASSES) {
      const classData = getStaticClass(cls, "2014");
      for (let level = 1; level <= 20; level++) {
        const table = getSpellSlotTable(classData, level) || {};
        const stale = { ...(oldSave as any), class: cls, subclass: "", level, spellSlots: { 1: 1 }, spellSlotsExpended: { 1: 9, 9: 3 } };
        const derived = computeDerivedStats(stale as Character);
        if (Object.keys(table).length === 0) {
          expect(derived.spellSlots).toBeUndefined();
          continue;
        }
        expect(derived.spellSlots as any).toEqual(Object.fromEntries(Object.entries(table).map(([k, v]) => [Number(k), v])));
        for (const [lvl, spent] of Object.entries(derived.spellSlotsExpended!)) {
          expect(spent).toBeLessThanOrEqual((table as any)[lvl]);
        }
      }
    }
  });

  test("third casters get their subclass table", () => {
    const knight = computeDerivedStats({ ...(oldSave as any), class: "Fighter", subclass: "Eldritch Knight", level: 7 } as Character);
    expect(knight.spellSlots as any).toEqual({ 1: 4, 2: 2 });
  });
});

describe("an old save opens correct", () => {
  const c = open(oldSave);

  test("the level 12 wizard has its 6th-level slot", () => {
    expect((oldSave as any).spellSlots[6]).toBeUndefined();
    expect(c.spellSlots).toEqual({ 1: 4, 2: 3, 3: 3, 4: 3, 5: 2, 6: 1 });
  });

  test("the quarterstaff gets its damage back from the catalog", () => {
    const staff = c.inventory.find((i) => i.name === "Quarterstaff")!;
    expect(staff.damageDice).toBe("1d6");
    expect(staff.damageType?.toLowerCase()).toBe("bludgeoning");
    expect(staff.description?.startsWith("{")).toBe(false);
    const attack = c.attacks.find((a) => a.id === staff.id)!;
    expect(attack.damageType).toContain("1d6");
    expect(getWeaponAttackDetails(c, attack)?.damageDice).toBe("1d6");
  });

  test("the blank feature row is gone", () => {
    expect((oldSave as any).features.some((f: any) => !f.name)).toBe(true);
    expect(c.features.every((f) => f.name.trim())).toBe(true);
    expect(buildTurnMenu(c, spells).features.every((f) => f.name.trim())).toBe(true);
  });

  test("nothing prepared is flagged, and a filled list brings the spells back", () => {
    expect(needsPrepare(c)).toBe(true);
    const before = buildTurnMenu(c, spells);
    expect(before.options.some((o) => o.name === "Counterspell")).toBe(false);
    const preparedSpells = suggestPrepared(c);
    expect(preparedSpells.length).toBe(Math.min(getMaxPreparedSpells(c), preparableSpells(c).length));
    const ready = { ...c, preparedSpells: c.spells.filter((s) => s.level > 0).map((s) => s.id) };
    expect(needsPrepare(ready)).toBe(false);
    const after = buildTurnMenu(ready, spells);
    expect(after.options.find((o) => o.name === "Counterspell")?.slot).toBe("reaction");
    // A 6th-level spell has a slot to spend now.
    const sixth = c.spells.find((s) => s.level === 6)!;
    expect(after.options.find((o) => o.name === sixth.name)?.blocked).toBeUndefined();
  });
});

describe("prepared list", () => {
  const book = [1, 1, 1, 2, 2, 3].map((level, i) => ({ id: `s${i}`, name: `S${i}`, level }));

  test("keeps earlier picks, never passes the limit, spreads over levels", () => {
    expect(fillPrepared(book, ["s0", "gone"], 4)).toEqual(["s0", "s5", "s3", "s1"]);
    expect(fillPrepared(book, ["s0", "s1", "s2", "s3", "s4"], 3)).toEqual(["s0", "s1", "s2"]);
    expect(fillPrepared(book, [], 99).length).toBe(6);
  });
});

describe("weapon stats come from the catalog", () => {
  const row = (name: string, itemId: string) => withCatalogStats({ id: name, itemId, name, quantity: 1, equipped: true, source: "srd", itemType: "weapon" });

  test("finesse is read from weapon properties, not a name list", () => {
    for (const [name, id] of [["Scimitar", "scimitar"], ["Whip", "whip"], ["Rapier", "rapier"], ["Dagger", "dagger"]]) {
      expect(isFinesseOrRanged(row(name, id))).toBe(true);
    }
    expect(isFinesseOrRanged(row("Longsword", "longsword"))).toBe(false);
    expect(weaponAbility(row("Scimitar", "scimitar"), 0, 3)).toBe("dex");
    expect(weaponAbility(row("Scimitar", "scimitar"), 3, 0)).toBe("str");
    expect(weaponAbility(row("Longbow", "longbow"), 3, 0)).toBe("dex");
    expect(weaponAbility(row("Longsword", "longsword"), 0, 3)).toBe("str");
  });

  test("a custom row is left alone", () => {
    const custom = { id: "c", name: "Moon Blade", quantity: 1, equipped: true, source: "custom" as const, itemType: "weapon" as const, damageDice: "2d6" };
    expect(withCatalogStats(custom)).toBe(custom);
  });
});
