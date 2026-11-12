// Every rules text in the 2024 data (SRD 5.2) has Indonesian in
// src/data/id/2024_text.json, and the Indonesian copy keeps names English.
// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { TEXT_FIELDS_2024, translate2024 } from "@/lib/locale-2024";
import textId from "@/data/id/2024_text.json";
import species from "@/data/en/2024_species.json";
import classes from "@/data/en/2024_classes.json";
import subclasses from "@/data/en/2024_subclasses.json";
import spells from "@/data/en/2024_spells.json";
import feats from "@/data/en/2024_feats.json";
import backgrounds from "@/data/en/2024_backgrounds.json";

const map = textId as Record<string, string>;
const files: Record<string, unknown> = { species, classes, subclasses, spells, feats, backgrounds };

function texts(data: unknown, key?: string, out: string[] = []): string[] {
  if (Array.isArray(data)) data.forEach((v) => texts(v, key, out));
  else if (data && typeof data === "object") Object.entries(data).forEach(([k, v]) => texts(v, k, out));
  else if (typeof data === "string" && key && TEXT_FIELDS_2024.has(key) && data.trim()) out.push(data);
  return out;
}

describe("2024 data Indonesian", () => {
  for (const [name, data] of Object.entries(files)) {
    test(`${name}: every text has Indonesian`, () => {
      const missing = texts(data).filter((t) => !map[t]?.trim());
      expect(missing.map((t) => t.slice(0, 60))).toEqual([]);
    });
  }

  test("translation keeps names and leaves non-text fields alone", () => {
    const en = (spells as { spells: Record<string, unknown>[] }).spells[0];
    const id = translate2024(en, map);
    expect(id.name).toBe(en.name);
    expect(id.level).toBe(en.level);
    expect(id.description).not.toBe(en.description);
  });

  test("no unused entries", () => {
    const used = new Set(Object.values(files).flatMap((d) => texts(d)));
    expect(Object.keys(map).filter((k) => !used.has(k)).map((k) => k.slice(0, 60))).toEqual([]);
  });
});
