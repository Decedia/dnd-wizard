// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import fixture from "./fixtures/non-srd-spell-classes.json";
import srd from "./fixtures/srd51-spells-races-feats.json";
import enSpells from "@/data/en/2014_spells.json";
import idSpells from "@/data/id/2014_spells.json";

// The SRD test locks the SRD spells; this one locks who can learn every other spell.
const checked = fixture.classes as Record<string, string[]>;
const srdNames = new Set(Object.keys(srd.spells).map((n) => n.toLowerCase()));

for (const [locale, data] of [["en", enSpells], ["id", idSpells]] as const) {
  describe(`non-SRD spell class lists (${locale})`, () => {
    const spells = (data as any).spells as { name: string; classes: string[] }[];

    test("every non-SRD spell has a checked class list", () => {
      const unchecked = spells.filter((s) => !srdNames.has(s.name.toLowerCase()) && !checked[s.name]).map((s) => s.name);
      expect(unchecked).toEqual([]);
    });

    test("class lists match the books", () => {
      const wrong = spells
        .filter((s) => checked[s.name])
        .filter((s) => [...s.classes].sort().join() !== checked[s.name].join())
        .map((s) => `${s.name}: ${[...s.classes].sort().join()}`);
      expect(wrong).toEqual([]);
    });

    test("no spell is listed twice", () => {
      const seen = new Set<string>();
      const twice = spells.map((s) => s.name.toLowerCase()).filter((n) => seen.has(n) || !seen.add(n));
      expect(twice).toEqual([]);
    });
  });
}

test("non-SRD spell text lives only in the spell data, written in our own words", () => {
  // The locale files used to carry book text over the top of the data; it must not come back.
  const en = require("@/locales/parts/en/2014_spells.json") as Record<string, string>;
  const id = require("@/locales/parts/id/2014_spells.json") as Record<string, string>;
  const indexes = new Set(((enSpells as any).spells as any[]).filter((s) => checked[s.name]).map((s) => s.index));
  const overrides = [...Object.keys(en), ...Object.keys(id)].filter((k) => {
    const m = k.match(/^2014_spells\.([^.]+)\.(description|effectSummary|fullDescription)$/);
    return m && indexes.has(m[1]);
  });
  expect(overrides).toEqual([]);
});
