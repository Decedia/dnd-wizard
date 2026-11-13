// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { translations as id } from "@/locales/id";
import { ID_TERM_RULES, countTerms } from "@/lib/id-terms";
import baseline from "./fixtures/id-terms-baseline.json";

/**
 * Translated game terms in Indonesian text (see src/lib/id-terms.ts).
 * The rewrite clears them file by file; each file's count may only go down.
 * After a rewrite lowers a count, run
 *   ID_TERMS_WRITE=1 bun test src/tests/id-terms.test.ts
 * to save the new, lower baseline.
 */

function strings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) value.forEach((v) => strings(v, out));
  else if (value && typeof value === "object") Object.values(value).forEach((v) => strings(v, out));
  return out;
}

const dataDir = join(process.cwd(), "src/data/id");
const sources: Record<string, string[]> = { "src/locales/id.js": strings(id) };
for (const f of readdirSync(dataDir).filter((f) => f.endsWith(".json")).sort()) {
  sources[`src/data/id/${f}`] = strings(JSON.parse(readFileSync(join(dataDir, f), "utf8")));
}
// Per-entry overrides (src/locales/parts/id), counted per group: 2014_spells_fireball.json goes under 2014_spells.
const partsDir = join(process.cwd(), "src/locales/parts/id");
for (const f of readdirSync(partsDir).filter((f) => f.endsWith(".json")).sort()) {
  const group = `src/locales/parts/id/${f.replace(/^(2014_spell_mechanics|2014_spells|2014_subclasses|2014_classes)_.*$/, "$1_*")}`;
  (sources[group] ||= []).push(...strings(JSON.parse(readFileSync(join(partsDir, f), "utf8"))));
}

function counts(texts: string[]): Record<string, number> {
  const totals = ID_TERM_RULES.map(() => 0);
  for (const s of texts) countTerms(s).forEach((n, i) => (totals[i] += n));
  return Object.fromEntries(ID_TERM_RULES.map((r, i) => [r.term, totals[i]]).filter(([, n]) => n));
}

const now = Object.fromEntries(Object.entries(sources).map(([f, texts]) => [f, counts(texts)]));

describe("Indonesian text keeps game terms in English", () => {
  test("report", () => {
    const rows = Object.entries(now).map(([f, c]) => `${f}: ${Object.values(c).reduce((a, b) => a + b, 0)}`);
    console.log(`Translated game terms per file:\n${rows.join("\n")}`);
    if (process.env.ID_TERMS_WRITE) {
      require("fs").writeFileSync(join(process.cwd(), "src/tests/fixtures/id-terms-baseline.json"), JSON.stringify(now, null, 1) + "\n");
    }
  });

  for (const [file, c] of Object.entries(now)) {
    test(`${file} has no more than its baseline`, () => {
      const base = (baseline as Record<string, Record<string, number>>)[file] || {};
      for (const [term, n] of Object.entries(c)) expect({ term, n }).toEqual({ term, n: Math.min(n, base[term] ?? 0) });
    });
  }
});
