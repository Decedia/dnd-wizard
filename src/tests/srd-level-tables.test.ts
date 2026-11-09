// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, it, expect } from "bun:test";
import srd from "./fixtures/srd51-class-tables.json";
import enClasses from "@/data/en/2014_classes.json";
import idClasses from "@/data/id/2014_classes.json";
import enSubclasses from "@/data/en/2014_subclasses.json";
import invocations from "@/data/warlock_invocations.json";
import { buildLevelInfos } from "@/components/LevelUpWizard";
import { getStaticClass } from "@/lib/srd-client";

// Locks the 2014 class tables to the SRD 5.1 text, level by level, so they never need a manual re-check.

type Row = (typeof srd.classes)["Bard"][number] & Record<string, any>;
const CLASSES = Object.keys(srd.classes) as (keyof typeof srd.classes)[];

const norm = (s: string) => s.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
const sameFeature = (a: string, b: string) => {
  const x = norm(a), y = norm(b);
  return x === y || x.includes(y) || y.includes(x);
};

/** Value of a level table that may be keyed only at the levels where it changes. */
function at(table: any, level: number): any {
  if (table == null) return undefined;
  if (Array.isArray(table)) return table[level - 1];
  let v: any;
  for (const k of Object.keys(table).map(Number).sort((a, b) => a - b)) if (k <= level) v = table[k];
  return v;
}

function slots(s: Record<string, number> | null | undefined): Record<string, number> {
  return Object.fromEntries(Object.entries(s || {}).filter(([, v]) => v));
}

for (const [locale, data] of [["en", enClasses], ["id", idClasses]] as const) {
  describe(`2014 class tables match SRD 5.1 (${locale})`, () => {
    for (const cls of CLASSES) {
      const app = (data as any).classes.find((c: any) => c.name === cls);
      it(`${cls}: subclass level`, () => {
        expect(app.subclassLevel).toBe((srd.subclassLevel as any)[cls]);
      });
      for (const row of srd.classes[cls] as Row[]) {
        it(`${cls} level ${row.level}`, () => {
          const lv = app.levels[row.level - 1];
          expect(lv.level).toBe(row.level);
          expect(!!lv.asi).toBe(row.asi);
          expect(slots(lv.spellSlots)).toEqual(row.spellSlots || {});
          const names = lv.features.filter((f: any) => f.source?.type !== "subclass").map((f: any) => f.name);
          for (const want of row.features) {
            expect({ level: row.level, feature: want, found: names.some((n: string) => sameFeature(n, want)) })
              .toEqual({ level: row.level, feature: want, found: true });
          }
          const cols: [string, any][] = [
            ["cantripsKnown", at(app.cantripsKnown, row.level) ?? 0],
            ["spellsKnown", at(app.spellsKnown, row.level) ?? 0],
            ["rages", app.rageUses?.[row.level]],
            ["rageDamage", app.rageDamageBonus?.[row.level]],
            ["kiPoints", app.kiPoints?.[row.level]],
            ["martialArtsDie", app.martialArtsDie?.[row.level]],
            ["unarmoredMovement", app.unarmoredMovement?.[row.level]],
            ["sneakAttackDice", app.sneakAttackDice?.[row.level]],
            ["sorceryPoints", app.sorceryPoints?.[row.level]],
            ["invocationsKnown", app.invocationsKnown?.[row.level]],
          ];
          for (const [key, value] of cols) {
            if (key in row) expect({ key, value }).toEqual({ key, value: row[key] });
          }
        });
      }
    }
  });
}

describe("SRD subclasses match SRD 5.1", () => {
  for (const [index, sub] of Object.entries(srd.subclasses)) {
    it(`${sub.class} / ${index}`, () => {
      const app = (enSubclasses as any).subclasses.find((s: any) => s.index === index);
      expect(app).toBeDefined();
      for (const [level, wanted] of Object.entries(sub.features)) {
        const names = app.features.filter((f: any) => f.level === Number(level)).map((f: any) => f.name);
        for (const want of wanted) {
          expect({ level, want, found: names.some((n: string) => sameFeature(n, want)) }).toEqual({ level, want, found: true });
        }
      }
    });
  }
});

describe("every SRD invocation can be picked at its SRD level", () => {
  const app = (invocations as any).invocations as Record<string, { level: number }>;
  for (const [name, level] of Object.entries(srd.invocations)) {
    it(name, () => {
      expect(app[name]).toBeDefined();
      expect(app[name].level).toBe(level);
    });
  }
});

// What the level-up wizard actually asks for, level 1 to 20.
const SUBCLASS: Record<string, string> = {
  Barbarian: "Berserker", Bard: "Lore", Cleric: "Life", Druid: "Land", Fighter: "Champion", Monk: "Open Hand",
  Paladin: "Devotion", Ranger: "Hunter", Rogue: "Thief", Sorcerer: "Draconic", Warlock: "Fiend", Wizard: "Evocation",
};

function run(cls: string, extra: Record<string, any> = {}, sub = SUBCLASS[cls]) {
  const character: any = {
    class: cls, subclass: sub, level: 1, str: 14, dex: 14, con: 14, int: 14, wis: 14, cha: 14,
    skills: { Athletics: true, Arcana: true, Stealth: true }, sources: ["PHB"], ruleset: "2014",
    featureSelections: {}, spells: [{ id: "s", name: "Sleep", level: 1 }], cantrips: [], expertise: [], ...extra,
  };
  return buildLevelInfos(character, 20, getStaticClass(cls, undefined, undefined, "en"), sub, 0, true, "en");
}
const choice = (info: any, name: string) => (info.classFeatureChoices || []).find((c: any) => c.name === name);

describe("level-up wizard follows the SRD", () => {
  it("Warlock invocation picks add up to the Invocations Known column", () => {
    const infos = run("Warlock");
    let total = 0;
    for (const info of infos) {
      total += choice(info, "Eldritch Invocations")?.count || 0;
      expect({ level: info.level, total }).toEqual({ level: info.level, total: (srd.classes.Warlock[info.level - 1] as Row).invocationsKnown });
    }
  });

  it("Bard Magical Secrets is part of the Spells Known column, not extra", () => {
    const infos = run("Bard");
    let known = 0;
    for (const info of infos) {
      known += info.spellSelectionCount + info.magicalSecretsCount;
      expect({ level: info.level, known }).toEqual({ level: info.level, known: (srd.classes.Bard[info.level - 1] as Row).spellsKnown });
      expect(choice(info, "Magical Secrets")).toBeUndefined();
    }
  });

  it("known-spell casters get new spells by the Spells Known column", () => {
    for (const cls of ["Sorcerer", "Warlock", "Ranger"]) {
      let known = 0;
      for (const info of run(cls)) {
        known += info.hasSpellSelection ? info.spellSelectionCount : 0;
        expect({ cls, level: info.level, known }).toEqual({ cls, level: info.level, known: (srd.classes as any)[cls][info.level - 1].spellsKnown });
      }
    }
  });

  it("every class that knows a fixed list of spells may swap one on level-up", () => {
    for (const cls of ["Bard", "Sorcerer", "Warlock", "Ranger"]) {
      expect({ cls, swap: run(cls).filter((i: any) => i.level >= 3).every((i: any) => i.canReplaceSpell) }).toEqual({ cls, swap: true });
    }
    expect(run("Fighter", {}, "Eldritch Knight").filter((i: any) => i.level >= 4).every((i: any) => i.canReplaceSpell)).toBe(true);
    expect(run("Wizard").some((i: any) => i.canReplaceSpell)).toBe(false);
  });

  it("Circle of the Land picks its land once", () => {
    expect(run("Druid").filter((i: any) => i.circleTerrainSelection).map((i: any) => i.level)).toEqual([3]);
    expect(run("Druid", { circleTerrain: "forest" }).some((i: any) => i.circleTerrainSelection)).toBe(false);
  });

  it("Expertise offers only proficiencies the character has", () => {
    const rogue = choice(run("Rogue")[0], "Expertise");
    expect(rogue.options.map((o: any) => o.name)).toEqual(["Arcana", "Athletics", "Stealth", "Thieves' Tools"]);
    const bard = choice(run("Bard")[2], "Expertise");
    expect(bard.options.map((o: any) => o.name)).toEqual(["Arcana", "Athletics", "Stealth"]);
  });

  it("Tasha's options stay hidden unless the table turns them on", () => {
    const fighter = choice(run("Fighter")[0], "Fighting Style");
    expect(fighter.options.map((o: any) => o.name)).toEqual(["Archery", "Defense", "Dueling", "Great Weapon Fighting", "Protection", "Two-Weapon Fighting"]);
    expect(run("Barbarian")[9].features.map((f: any) => f.name)).not.toContain("Primal Knowledge");
    const tasha = choice(run("Paladin", { sources: ["PHB", "TCE"], optionalClassFeatures: true })[1], "Fighting Style");
    expect(tasha.options.map((o: any) => o.name)).toContain("Blind Fighting");
  });

  it("proficiency bonus follows the SRD", () => {
    for (const info of run("Monk")) expect(info.proficiencyBonus).toBe(srd.classes.Monk[info.level - 1].proficiencyBonus);
  });
});
