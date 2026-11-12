// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { getStaticClasses, getStaticFeats, getStaticRaces, getStaticSpells, getStaticSubclasses } from "@/lib/srd-client";
import { RULESET_2024_READY, rulesetOf } from "@/lib/rulesets";

const rs = (record: unknown) => (record as { ruleset?: string }).ruleset || "2014";

describe("rule sets never mix", () => {
  for (const locale of ["en", "id"]) {
    for (const ruleset of [undefined, "2014", "2024"] as const) {
      const want = ruleset === "2024" ? "2024" : "2014";
      test(`${locale} ${ruleset ?? "no ruleset"} lookups return only ${want} data`, () => {
        const classes = getStaticClasses([], ruleset, locale);
        const lists: unknown[][] = [
          getStaticRaces([], ruleset, locale),
          classes,
          getStaticSpells([], ruleset, locale),
          getStaticFeats([], ruleset, locale),
          ...getStaticClasses([], "2014", locale).map((c) => getStaticSubclasses(c.name, [], ruleset, locale)),
        ];
        for (const list of lists) for (const record of list) expect(rs(record)).toBe(want);
      });
    }

    test(`${locale} 2014 lookups are unchanged by the 2024 file`, () => {
      expect(getStaticRaces([], "2014", locale).map((r) => r.name)).toEqual(getStaticRaces([], undefined, locale).map((r) => r.name));
      expect(getStaticClasses([], "2014", locale).length).toBeGreaterThanOrEqual(12);
    });
  }
});

describe("rulesetOf", () => {
  test("2024 stays off until it is ready", () => {
    expect(rulesetOf({ ruleset: "2024" })).toBe(RULESET_2024_READY ? "2024" : "2014");
    expect(rulesetOf({})).toBe("2014");
    expect(rulesetOf(undefined)).toBe("2014");
  });
});

describe("loading a character", () => {
  test("a character saved as 2024 before 2024 was ready loads as 2014", async () => {
    const { normalizeCharacter, createEmptyCharacter } = await import("@/lib/storage");
    const loaded = normalizeCharacter({ ...createEmptyCharacter(), ruleset: "2024" });
    expect(loaded.ruleset).toBe(RULESET_2024_READY ? "2024" : "2014");
  });
});
