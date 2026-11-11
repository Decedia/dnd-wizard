// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import spellsData from "@/data/en/2014_spells.json";
import { NO_DAMAGE_LINE, SPELL_DICE } from "@/data/spell-dice";
import { characterSpellDamage, formatDice, parseDice, spellDamage, type DamagePart } from "@/lib/spell-dice";
import { buildTurnMenu } from "@/lib/turn";
import { getStaticSpells } from "@/lib/srd-client";
import { createEmptyCharacter, type Character } from "@/lib/storage";

type RawSpell = { name: string; level: number; desc?: string[]; description?: string | string[]; damage?: { damage_at_slot_level?: Record<string, string>; damage_at_character_level?: Record<string, string> } };
const raw = (spellsData as unknown as { spells: RawSpell[] }).spells;
const textOf = (s: RawSpell) => [s.description, s.desc].flat().filter(Boolean).join(" ");
const levelOf = (name: string) => raw.find((s) => s.name === name)!.level;

const at = (name: string, slot: number, characterLevel = 1, mod = 0) => spellDamage(name, levelOf(name), { slot, characterLevel, mod });
const line = (parts: DamagePart[] | null) => (parts || []).map((p) => `${p.count > 1 ? `${p.count}x` : ""}${p.dice} ${p.type}${p.when ? ` (${p.when})` : ""}`.trim());

const make = (patch: Partial<Character>, features: string[] = []): Character => ({
  ...createEmptyCharacter(),
  ...patch,
  features: features.map((name, i) => ({ id: `f${i}`, name, description: "", source: "subclass" })) as Character["features"],
});

describe("checked spell dice table", () => {
  test("every spell that rolls damage dice is in the table, or listed as not getting a damage line", () => {
    const missing = raw
      .filter((s) => s.damage || /\b\d+d\d+\b[^.]*?\bdamage\b/i.test(textOf(s)))
      .map((s) => s.name)
      .filter((name) => !(name in SPELL_DICE) && !NO_DAMAGE_LINE.has(name));
    expect(missing).toEqual([]);
  });

  test("every table entry is a real spell", () => {
    const names = new Set(raw.map((s) => s.name));
    expect([...Object.keys(SPELL_DICE), ...NO_DAMAGE_LINE].filter((n) => !names.has(n))).toEqual([]);
    for (const [name, parts] of Object.entries(SPELL_DICE)) expect(parts.length > 0 ? name : `${name} empty`).toBe(name);
  });

  test("agrees with the spell data's slot table where that data is right", () => {
    // Data that counts one ray/dart/beam, adds parts together, or leaves the modifier as text.
    const dataWrong = new Set(["Scorching Ray", "Magic Missile", "Spiritual Weapon", "Flame Strike", "Ice Storm", "Meteor Swarm", "Sleep", "Eldritch Blast", "Storm of Vengeance"]);
    const off: string[] = [];
    for (const s of raw) {
      const bySlot = s.damage?.damage_at_slot_level;
      if (!bySlot || dataWrong.has(s.name) || NO_DAMAGE_LINE.has(s.name)) continue;
      for (const [slot, dice] of Object.entries(bySlot)) {
        const ours = at(s.name, Number(slot))?.[0]?.dice;
        if (ours !== formatDice(parseDice(dice))) off.push(`${s.name} @${slot}: data ${dice}, table ${ours}`);
      }
    }
    expect(off).toEqual([]);
  });

  test("agrees with the spell data's cantrip table", () => {
    const off: string[] = [];
    for (const s of raw) {
      const byLevel = s.damage?.damage_at_character_level;
      if (!byLevel || s.name === "Eldritch Blast") continue;
      for (const [lvl, dice] of Object.entries(byLevel)) {
        const ours = at(s.name, 0, Number(lvl))?.[0]?.dice;
        if (ours !== dice) off.push(`${s.name} @${lvl}: data ${dice}, table ${ours}`);
      }
    }
    // Thorn Whip's data only lists level 1; the book scales it like every attack cantrip.
    expect(off).toEqual([]);
    expect(line(at("Thorn Whip", 0, 11))).toEqual(["3d6 piercing"]);
  });
});

describe("spell damage at a casting", () => {
  test("upcasting adds dice per slot level", () => {
    expect(line(at("Fireball", 3))).toEqual(["8d6 fire"]);
    expect(line(at("Fireball", 5))).toEqual(["10d6 fire"]);
    expect(line(at("Disintegrate", 7))).toEqual(["13d6+40 force"]);
    expect(line(at("Flame Blade", 3))).toEqual(["3d6 fire"]);
    expect(line(at("Flame Blade", 4))).toEqual(["4d6 fire"]);
    expect(line(at("Shadow Blade", 3))).toEqual(["3d8 psychic"]);
    expect(line(at("Shadow Blade", 7))).toEqual(["5d8 psychic"]);
  });

  test("rays, darts and beams are separate rolls", () => {
    expect(line(at("Scorching Ray", 2))).toEqual(["3x2d6 fire"]);
    expect(line(at("Scorching Ray", 4))).toEqual(["5x2d6 fire"]);
    expect(line(at("Magic Missile", 1))).toEqual(["3x1d4+1 force"]);
    expect(line(at("Eldritch Blast", 0, 1))).toEqual(["1d10 force"]);
    expect(line(at("Eldritch Blast", 0, 11))).toEqual(["3x1d10 force"]);
  });

  test("cantrips grow with character level, Booming Blade's hit part only from level 5", () => {
    expect(line(at("Fire Bolt", 0, 4))).toEqual(["1d10 fire"]);
    expect(line(at("Fire Bolt", 0, 17))).toEqual(["4d10 fire"]);
    expect(line(at("Booming Blade", 0, 1))).toEqual(["1d8 thunder (move)"]);
    expect(line(at("Booming Blade", 0, 5))).toEqual(["1d8 thunder (hit)", "2d8 thunder (move)"]);
    expect(line(at("Green-Flame Blade", 0, 1, 3))).toEqual(["3 fire (others)"]);
    expect(line(at("Green-Flame Blade", 0, 5, 3))).toEqual(["1d8 fire (hit)", "1d8+3 fire (others)"]);
  });

  test("spells that add the casting modifier", () => {
    expect(line(at("Spiritual Weapon", 4, 7, 4))).toEqual(["2d8+4 force"]);
    expect(line(at("Magic Stone", 0, 11, 3))).toEqual(["1d6+3 bludgeoning"]);
  });
});

describe("bonuses join the total", () => {
  const spell = (name: string) => {
    const s = (getStaticSpells(undefined, "2014") as any[]).find((x) => x.name === name);
    return { name: s.name, level: s.level, school: s.school, classes: s.classes, damageType: s.damage?.damageType, description: s.description };
  };

  test("Empowered Evocation adds INT to one roll", () => {
    const evoker = make({ class: "Wizard", level: 10, int: 18 }, ["Empowered Evocation"]);
    expect(line(characterSpellDamage(evoker, spell("Fireball"), 4))).toEqual(["9d6+4 fire"]);
    // Several darts: the bonus goes on one roll, so it stays a separate line instead.
    expect(line(characterSpellDamage(evoker, spell("Magic Missile")))).toEqual(["3x1d4+1 force"]);
  });

  test("Agonizing Blast adds CHA to every beam", () => {
    const warlock = make({ class: "Warlock", level: 5, cha: 16, featureSelections: { "Eldritch Invocations": ["Agonizing Blast"] } });
    expect(line(characterSpellDamage(warlock, spell("Eldritch Blast")))).toEqual(["2x1d10+3 force"]);
  });

  test("Elemental Affinity goes on the part of the ancestor's type", () => {
    const sorc = make({ class: "Sorcerer", level: 7, cha: 16, featureSelections: { "Dragon Ancestor": ["Dragon Ancestor: White - Cold Damage"] } }, ["Elemental Affinity"]);
    expect(line(characterSpellDamage(sorc, spell("Ice Storm")))).toEqual(["2d8 bludgeoning", "4d6+3 cold"]);
  });

  test("Potent Spellcasting covers both Toll the Dead dice", () => {
    const cleric = make({ class: "Cleric", level: 8, wis: 18 }, ["Potent Spellcasting"]);
    expect(line(characterSpellDamage(cleric, spell("Toll the Dead")))).toEqual(["2d8+4 necrotic", "2d12+4 necrotic (hurt)"]);
  });

  test("turn panel shows the damage at the slot it will spend", () => {
    const evoker = make({
      class: "Wizard", level: 10, int: 18,
      spells: [{ id: "fb", name: "Fireball", level: 3 }] as Character["spells"],
      preparedSpells: ["fb"],
      spellSlots: { 3: 2, 4: 3 }, spellSlotsExpended: { 3: 2 },
    }, ["Empowered Evocation"]);
    const fireball = buildTurnMenu(evoker, getStaticSpells(undefined, "2014") as any[]).options.find((o) => o.name === "Fireball");
    expect(line(fireball?.spellDamage ?? null)).toEqual(["9d6+4 fire"]);
  });
});
