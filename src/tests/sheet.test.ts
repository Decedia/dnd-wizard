// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { autoEquipStartingGear } from "@/lib/character-creation";
import { addRows, carriedWeight, equipRow, expandToRows, rowText, setCoinAmount } from "@/lib/inventory";
import { computeDerivedStats, createEmptyCharacter, getMaxCantripsKnown, getMaxSpellsKnown, type Character } from "@/lib/storage";

const make = (patch: Partial<Character> = {}): Character =>
  ({ ...createEmptyCharacter(), sources: ["PHB"], ruleset: "2014", class: "Fighter", level: 3, str: 16, dex: 12, con: 14, int: 10, wis: 10, cha: 10, ...patch }) as Character;

const inv = (...names: string[]) => names.reduce((acc, n) => addRows(acc, expandToRows(n)), [] as Character["inventory"]);
const worn = (rows: Character["inventory"]) => rows.filter((r) => r.equipped).map((r) => r.name).sort();

describe("starting gear is put on", () => {
  test("a fighter wears chain mail, holds a longsword and a shield", () => {
    const c = make({ inventory: inv("Chain Mail", "Longsword", "Shield", "Crossbow, light", "Handaxe") });
    expect(worn(autoEquipStartingGear(c))).toEqual(["Chain Mail", "Longsword", "Shield"]);
  });

  test("without a shield the strongest weapon wins, two-handed or not", () => {
    const c = make({ inventory: inv("Greataxe", "Javelin") });
    expect(worn(autoEquipStartingGear(c))).toEqual(["Greataxe"]);
  });

  test("a wizard does not put on armor they can't use", () => {
    const c = make({ class: "Wizard", inventory: inv("Leather Armor", "Dagger") });
    expect(worn(autoEquipStartingGear(c))).toEqual(["Dagger"]);
  });

  test("gear already worn is left alone", () => {
    const rows = inv("Chain Mail", "Longsword");
    const c = make({ inventory: equipRow(rows, rows[1].id).inventory });
    expect(worn(autoEquipStartingGear(c))).toEqual(["Longsword"]);
  });
});

describe("attacks follow the inventory", () => {
  test("a saved, stale attack list is rebuilt from equipped weapons", () => {
    const rows = inv("Longsword");
    const c = make({ inventory: equipRow(rows, rows[0].id).inventory, attacks: [] });
    const attacks = computeDerivedStats(c).attacks!;
    expect(attacks.some((a) => a.name === "Longsword" && a.source === "weapon")).toBe(true);
    const unequipped = make({ inventory: rows, attacks: [{ id: rows[0].id, name: "Longsword", attackBonus: 5, damageType: "", source: "weapon" }] });
    expect(computeDerivedStats(unequipped).attacks!.some((a) => a.source === "weapon")).toBe(false);
  });
});

describe("only casters get spells", () => {
  test("a Champion knows no spells, an Eldritch Knight does", () => {
    expect(getMaxSpellsKnown(make({ subclass: "Champion" }))).toBe(0);
    expect(getMaxCantripsKnown(make({ subclass: "Champion" }))).toBe(0);
    expect(getMaxSpellsKnown(make({ subclass: "Eldritch Knight" }))).toBeGreaterThan(0);
  });
});

describe("sheet display", () => {
  test("item names follow the language unless renamed", () => {
    const [sword] = expandToRows("Longsword");
    expect(rowText(sword, "en").name).toBe("Longsword");
    expect(rowText({ ...sword, name: "Oathkeeper" }, "id").name).toBe("Oathkeeper");
  });

  test("carried weight counts quantities and coins", () => {
    let rows = inv("Chain Mail", "Torch");
    rows = setCoinAmount(rows, "gp", 50);
    expect(carriedWeight(rows)).toBe(55 + 1 + 1);
  });
});
