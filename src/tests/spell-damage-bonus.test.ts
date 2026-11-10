// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { getStaticSpells } from "@/lib/srd-client";
import { spellDamageBonuses } from "@/lib/spell-damage-bonus";
import { buildTurnMenu } from "@/lib/turn";
import { createEmptyCharacter, type Character } from "@/lib/storage";

const spells = getStaticSpells(undefined, "2014") as any[];
const spell = (name: string) => {
  const s = spells.find((x) => x.name === name);
  if (!s) throw new Error(`no spell ${name}`);
  return { name: s.name, level: s.level, school: s.school, classes: s.classes, damageType: s.damage?.damageType, description: s.description };
};
const make = (patch: Partial<Character>, features: string[] = []): Character => ({
  ...createEmptyCharacter(),
  ...patch,
  features: features.map((name, i) => ({ id: `f${i}`, name, description: "", source: "subclass" })) as Character["features"],
});
const bonus = (c: Character, name: string) => spellDamageBonuses(c, spell(name)).map((b) => `${b.source} ${b.value} ${b.per}`);

describe("spell damage bonuses", () => {
  const evoker = make({ class: "Wizard", level: 10, int: 18 }, ["Empowered Evocation"]);

  test("Empowered Evocation: wizard evocation spells that deal damage", () => {
    for (const name of ["Fire Bolt", "Fireball", "Magic Missile", "Chromatic Orb", "Witch Bolt", "Cone of Cold"]) {
      expect(bonus(evoker, name)).toEqual(["Empowered Evocation 4 roll"]);
    }
    expect(bonus(evoker, "Ice Knife")).toEqual([]); // Conjuration
    expect(bonus(evoker, "Shield")).toEqual([]); // no damage
    expect(bonus(evoker, "Sacred Flame")).toEqual([]); // not a wizard spell
    expect(bonus(make({ class: "Wizard", level: 9, int: 18 }), "Fireball")).toEqual([]);
  });

  test("Agonizing Blast adds CHA to every Eldritch Blast beam", () => {
    const warlock = make({ class: "Warlock", level: 5, cha: 16, featureSelections: { "warlock-invocations": ["Agonizing Blast"] } });
    expect(bonus(warlock, "Eldritch Blast")).toEqual(["Agonizing Blast 3 beam"]);
    expect(bonus(warlock, "Chill Touch")).toEqual([]);
  });

  test("Potent Spellcasting: cleric cantrips only", () => {
    const cleric = make({ class: "Cleric", level: 8, wis: 18 }, ["Potent Spellcasting"]);
    expect(bonus(cleric, "Sacred Flame")).toEqual(["Potent Spellcasting 4 roll"]);
    expect(bonus(cleric, "Toll the Dead")).toEqual(["Potent Spellcasting 4 roll"]);
    expect(bonus(cleric, "Guiding Bolt")).toEqual([]);
  });

  test("Elemental Affinity follows the dragon ancestor's damage type", () => {
    const red = make({ class: "Sorcerer", level: 6, cha: 16, featureSelections: { "subclass-feature-1-Dragon Ancestor": ["Dragon Ancestor: Red - Fire Damage"] } }, ["Elemental Affinity"]);
    expect(bonus(red, "Fireball")).toEqual(["Elemental Affinity 3 roll"]);
    expect(bonus(red, "Ray of Frost")).toEqual([]);
  });

  test("Radiant Soul is the Celestial warlock's, not the Aasimar's", () => {
    const celestial = make({ class: "Warlock", level: 6, cha: 16 }, ["Radiant Soul"]);
    expect(bonus(celestial, "Fireball")).toEqual(["Radiant Soul 3 roll"]);
    expect(bonus(celestial, "Eldritch Blast")).toEqual([]);
    expect(bonus(make({ class: "Paladin", level: 6, cha: 16, race: "Aasimar" }, ["Radiant Soul"]), "Fireball")).toEqual([]);
  });

  test("the turn menu carries the bonus on spell rows", () => {
    const c = { ...evoker, cantrips: [{ id: "c1", name: "Fire Bolt" }] } as Character;
    const row = buildTurnMenu(c, spells).options.find((o) => o.name === "Fire Bolt");
    expect(row?.damageBonuses?.map((b) => b.value)).toEqual([4]);
  });
});
