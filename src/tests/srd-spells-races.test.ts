// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import srd from "./fixtures/srd51-spells-races-feats.json";
import enSpells from "@/data/en/2014_spells.json";
import idSpells from "@/data/id/2014_spells.json";
import enRaces from "@/data/en/2014_races.json";
import enFeats from "@/data/en/2014_feats.json";
import { getFeatOptionGroups } from "@/data/feat-options";

// Locks every SRD 5.1 spell, the SRD races and the SRD feat to the SRD, so a
// data change that drifts from the rules fails CI. Non-SRD races and feats are
// held by the manifests in scripts/data (data:completeness --strict).

const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/^concentration,?\s*/, "")
    .replace(/\bone\b/g, "1")
    .replace(/\b1 day\b/, "24 hours")
    .replace(/\.$/, "")
    .replace(/\s+/g, " ")
    .trim();

type Fx = { level: number; school: string; ritual: boolean; concentration: boolean; classes: string[]; components: string[]; castingTime: string; range: string; duration: string };
const fixture = srd.spells as Record<string, Fx>;

for (const [locale, data] of [["en", enSpells], ["id", idSpells]] as const) {
  describe(`SRD spells (${locale})`, () => {
    const byName = new Map(((data as any).spells as any[]).map((s) => [s.name.toLowerCase(), s]));
    test("every SRD spell is in the data", () => {
      expect(Object.keys(fixture).filter((n) => !byName.has(n.toLowerCase()))).toEqual([]);
    });
    test("level, school, ritual, concentration and components match", () => {
      const wrong: string[] = [];
      for (const [name, f] of Object.entries(fixture)) {
        const s = byName.get(name.toLowerCase());
        if (!s) continue;
        const comps = (["V", "S", "M"] as const).filter((c, i) => s.components?.[["verbal", "somatic", "material"][i]]);
        if (s.level !== f.level) wrong.push(`${name} level ${s.level}`);
        if (s.school?.index !== f.school) wrong.push(`${name} school ${s.school?.index}`);
        if (!!s.ritual !== f.ritual) wrong.push(`${name} ritual`);
        if (!!s.concentration !== f.concentration) wrong.push(`${name} concentration`);
        if (comps.join() !== f.components.join()) wrong.push(`${name} components ${comps.join()}`);
      }
      expect(wrong).toEqual([]);
    });
    test("casting time, range and duration match", () => {
      const wrong: string[] = [];
      for (const [name, f] of Object.entries(fixture)) {
        const s = byName.get(name.toLowerCase());
        if (!s) continue;
        if (norm(s.casting_time) !== norm(f.castingTime)) wrong.push(`${name} casting time "${s.casting_time}"`);
        if (norm(s.range) !== norm(f.range)) wrong.push(`${name} range "${s.range}"`);
        if (norm(s.duration) !== norm(f.duration)) wrong.push(`${name} duration "${s.duration}"`);
      }
      expect(wrong).toEqual([]);
    });
    test("every SRD class list holds the spell (books may add more classes)", () => {
      const missing: string[] = [];
      for (const [name, f] of Object.entries(fixture)) {
        const s = byName.get(name.toLowerCase());
        for (const c of f.classes) if (s && !(s.classes || []).includes(c)) missing.push(`${name}: ${c}`);
      }
      expect(missing).toEqual([]);
    });
  });
}

describe("SRD races", () => {
  const byName = new Map(((enRaces as any).races as any[]).map((r) => [r.name, r]));
  for (const [name, f] of Object.entries(srd.races as Record<string, any>)) {
    test(name, () => {
      const r = byName.get(name);
      expect(r).toBeDefined();
      expect(r.abilityScoreIncreases).toEqual(f.asi);
      expect(r.speed).toBe(f.speed);
      expect(r.size).toBe(f.size);
      expect((r.languages || []).filter((l: string) => l !== "any").sort()).toEqual(f.languages);
      expect(r.extraLanguages || 0).toBe(f.extraLanguages);
      expect(r.darkvision?.range ?? 0).toBe(f.darkvision);
      const traits = (r.traits || []).map((t: any) => t.name);
      expect(f.traits.filter((t: string) => !traits.includes(t))).toEqual([]);
    });
  }
});

describe("SRD feat", () => {
  test("Grappler needs Strength 13 and gives no ability increase", () => {
    const g = ((enFeats as any).feats as any[]).find((f) => f.name === "Grappler");
    expect(g?.prerequisites).toMatch(/Strength 13/);
    expect(getFeatOptionGroups("Grappler").some((o) => o.id.startsWith("ability"))).toBe(false);
  });
});
