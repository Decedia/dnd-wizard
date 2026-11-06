// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { equipRow, expandToRows, type InventoryRow } from "@/lib/inventory";
import { getItemProficiency, getRowProficiency } from "@/lib/proficiency";
import { computeDerivedStats, computeEquippedEffects, createEmptyCharacter, type Character } from "@/lib/storage";
import { getWeaponAttackDetails } from "@/lib/weapon-attacks";

const make = (patch: Partial<Character> = {}): Character =>
  ({ ...createEmptyCharacter(), sources: ["PHB"], ruleset: "2014", class: "Fighter", level: 1, str: 14, dex: 12, con: 14, int: 10, wis: 10, cha: 10, ...patch }) as Character;

const row = (name: string): InventoryRow => expandToRows(name)[0];
const equipAll = (inv: InventoryRow[], ...ids: string[]) => ids.reduce((acc, id) => equipRow(acc, id).inventory, inv);
const equippedNames = (inv: InventoryRow[]) => inv.filter((r) => r.equipped).map((r) => `${r.name}:${r.hand ?? "-"}`).sort();

describe("hands and the shield", () => {
  const sword = row("Shortsword");
  const dagger = row("Dagger");
  const mace = row("Mace");
  const shield = row("Shield");
  const greatsword = row("Greatsword");
  const base = [sword, dagger, mace, shield, greatsword];

  test("a shield takes the off hand from a second weapon (item 13)", () => {
    const inv = equipAll(base, sword.id, dagger.id);
    const { inventory, removed } = equipRow(inv, shield.id);
    expect(equippedNames(inventory)).toEqual(["Shield:-", "Shortsword:main"]);
    expect(removed).toEqual(["Dagger"]);
  });

  test("a shield next to a two-handed weapon takes it off instead of doing nothing (item 14)", () => {
    const inv = equipAll(base, greatsword.id);
    const { inventory, removed } = equipRow(inv, shield.id);
    expect(equippedNames(inventory)).toEqual(["Shield:-"]);
    expect(removed).toEqual(["Greatsword"]);
  });

  test("a new weapon with a shield up replaces the main-hand weapon (item 15)", () => {
    const inv = equipAll(base, sword.id, shield.id);
    const { inventory, removed } = equipRow(inv, mace.id);
    expect(equippedNames(inventory)).toEqual(["Mace:main", "Shield:-"]);
    expect(removed).toEqual(["Shortsword"]);
  });

  test("a second weapon goes to the off hand when it is free", () => {
    const inv = equipAll(base, sword.id, dagger.id);
    expect(equippedNames(inv)).toEqual(["Dagger:off", "Shortsword:main"]);
  });

  test("a two-handed weapon clears both hands and the shield", () => {
    const inv = equipAll(base, sword.id, shield.id, greatsword.id);
    expect(equippedNames(inv)).toEqual(["Greatsword:both"]);
  });

  test("new body armor replaces the old", () => {
    const leather = row("Leather Armor");
    const chain = row("Chain Mail");
    const inv = equipAll([leather, chain], leather.id, chain.id);
    expect(equippedNames(inv)).toEqual(["Chain Mail:-"]);
  });
});

describe("monk unarmored defense (items 1 and 16)", () => {
  const monkFeature = { id: "ud", name: "Unarmored Defense", description: "", source: "class" as const };
  const monk = (inventory: InventoryRow[] = []) =>
    make({ class: "Monk", dex: 16, wis: 16, con: 14, features: [monkFeature], inventory });

  test("a monk uses DEX + WIS, not CON", () => {
    expect(computeDerivedStats(monk()).ac).toBe(10 + 3 + 3);
  });

  test("a monk with a shield loses Unarmored Defense", () => {
    const shield = { ...row("Shield"), equipped: true };
    expect(computeDerivedStats(monk([shield])).ac).toBe(10 + 3 + 2);
  });

  test("a barbarian keeps it with a shield", () => {
    const shield = { ...row("Shield"), equipped: true };
    const barb = make({ class: "Barbarian", dex: 14, con: 16, features: [{ ...monkFeature }], inventory: [shield] });
    expect(computeDerivedStats(barb).ac).toBe(10 + 2 + 3 + 2);
  });
});

describe("proficiency", () => {
  test("class weapon and armor lists", () => {
    const wizard = make({ class: "Wizard" });
    expect(getItemProficiency(wizard, "Dagger")).toEqual({ kind: "weapon", proficient: true });
    expect(getItemProficiency(wizard, "Crossbow, light")).toEqual({ kind: "weapon", proficient: true });
    expect(getItemProficiency(wizard, "Longsword")).toEqual({ kind: "weapon", proficient: false });
    expect(getItemProficiency(wizard, "Leather Armor")).toEqual({ kind: "armor", proficient: false });
    const fighter = make({ class: "Fighter" });
    expect(getItemProficiency(fighter, "Plate Armor")!.proficient).toBe(true);
    expect(getItemProficiency(fighter, "Shield")).toEqual({ kind: "shield", proficient: true });
    expect(getItemProficiency(make({ class: "Rogue" }), "Rapier")!.proficient).toBe(true);
  });

  test("race and subclass features grant proficiency", () => {
    const elfWizard = make({
      class: "Wizard",
      features: [{ id: "e", name: "Elf Weapon Training", description: "You have proficiency with the longsword, shortsword, shortbow, and longbow.", source: "race" }],
    });
    expect(getItemProficiency(elfWizard, "Longbow")!.proficient).toBe(true);
    const lifeCleric = make({
      class: "Cleric",
      features: [{ id: "l", name: "Bonus Proficiency", description: "When you choose this domain at 1st level, you gain proficiency with heavy armor.", source: "subclass" }],
    });
    expect(getItemProficiency(lifeCleric, "Chain Mail")!.proficient).toBe(true);
    const mountainDwarf = make({
      class: "Wizard",
      features: [{ id: "d", name: "Dwarven Armor Training", description: "You have proficiency with light and medium armor.", source: "race" }],
    });
    expect(getItemProficiency(mountainDwarf, "Scale Mail")!.proficient).toBe(true);
    expect(getItemProficiency(mountainDwarf, "Plate Armor")!.proficient).toBe(false);
  });

  test("feats in other proficiencies count", () => {
    const armored = make({ class: "Wizard", otherProficiencies: "Light Armor, Medium Armor, Shields" });
    expect(getItemProficiency(armored, "Shield")!.proficient).toBe(true);
    expect(getItemProficiency(armored, "Breastplate")!.proficient).toBe(true);
  });

  test("tools: named ones count, a pick-one choice is left unknown", () => {
    const rogue = make({ class: "Rogue" });
    expect(getItemProficiency(rogue, "Thieves' Tools")).toEqual({ kind: "tool", proficient: true });
    expect(getItemProficiency(rogue, "Lute")).toEqual({ kind: "tool", proficient: false });
    const artisan = make({ class: "Fighter", toolProficiencies: ["One type of artisan's tools"] });
    expect(getItemProficiency(artisan, "Smith's Tools")).toBeNull();
  });

  test("gear has no proficiency", () => {
    expect(getItemProficiency(make(), "Torch")).toBeNull();
  });

  test("a weapon without proficiency loses the bonus on the sheet's attack", () => {
    const sword = { ...row("Longsword"), equipped: true, hand: "main" as const };
    const wizard = make({ class: "Wizard", str: 14, inventory: [sword] });
    const fighter = make({ class: "Fighter", str: 14, inventory: [sword] });
    expect(getRowProficiency(wizard, sword)!.proficient).toBe(false);
    expect(getWeaponAttackDetails(wizard, { id: sword.id } as any)!.attackBonus).toBe(2);
    expect(getWeaponAttackDetails(fighter, { id: sword.id } as any)!.attackBonus).toBe(4);
    expect(computeEquippedEffects(wizard).attacks.find((a) => a.id === sword.id)!.attackBonus).toBe(2);
  });
});
