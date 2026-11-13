// The SRD 5.2 source flattened two-column tables and merged two spells; the
// importer (scripts/import-srd52.py, SPELL_TEXT) rebuilds them. This keeps them whole.
// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import spellsData from "@/data/en/2024_spells.json";

const spells = (spellsData as { spells: { name: string; description: string; higherLevel?: string }[] }).spells;
const byName = (name: string) => spells.find((s) => s.name === name)!;

describe("2024 spell text", () => {
  test("no squeezed tables: no pipes or runs of spaces", () => {
    const bad = spells.filter((s) => /\||\S {3,}\S/.test(`${s.description}\n${s.higherLevel || ""}`)).map((s) => s.name);
    expect(bad).toEqual([]);
  });

  test("the higher-level line sits in its own field", () => {
    expect(spells.filter((s) => s.description.includes("Using a Higher-Level Spell Slot")).map((s) => s.name)).toEqual([]);
  });

  test("tables keep every row", () => {
    const prismatic = byName("Prismatic Spray").description;
    for (const ray of ["1, Red", "2, Orange", "3, Yellow", "4, Green", "5, Blue", "6, Indigo", "7, Violet", "8, Special"]) expect(prismatic).toContain(ray);
    expect(byName("Prismatic Wall").description).toContain("7, Violet");
    expect(byName("Divine Word").description).toContain("31-40 Hit Points");
    expect(byName("Confusion").description).toContain("7-8:");
    expect(byName("Augury").description).toContain("Weal: Good");
    expect(byName("Creation").description).toContain("Vegetable matter: 24 hours");
  });

  test("Control Water and Control Weather each keep their own text", () => {
    expect(byName("Control Water").description).not.toMatch(/weather|Precipitation/i);
    expect(byName("Control Weather").description).toContain("Wind: 1, Calm");
  });
});
