// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { computeDerivedStats, createEmptyCharacter, type Character } from "@/lib/storage";
import { applySubclassFeatures, syncBaseFeatures } from "@/lib/character-creation";
import { syncGrantedSpells } from "@/lib/granted-spells";
import { applySubclassRebuild, classRebuildDraft, finishClassRebuild, subclassRewind } from "@/lib/rebuild";
import { undoableChange, undoLevelUp } from "@/lib/level-snapshot";

const make = (over: Partial<Character>): Character => {
  let c = { ...createEmptyCharacter(), ruleset: "2014", race: "Human", str: 15, dex: 14, con: 14, int: 12, wis: 10, cha: 8, maxHp: 40, currentHp: 40, ...over } as Character;
  c = syncGrantedSpells(syncBaseFeatures(applySubclassFeatures(c, "en"), "en"));
  return { ...c, ...computeDerivedStats(c) } as Character;
};
const names = (c: Character) => c.features.map((f) => f.name);

describe("picking the subclass again", () => {
  test("the wizard sees the character one level below the subclass level, with no subclass", () => {
    const c = make({ class: "Fighter", level: 7, subclass: "Champion", featureSelections: { "class-feature-1-Fighting Style": ["Defense"], "subclass-feature-3-Old": ["x"] } });
    const r = subclassRewind(c);
    expect(r.level).toBe(2);
    expect(r.subclass).toBeUndefined();
    expect(names(r)).not.toContain("Improved Critical");
    expect(r.featureSelections["class-feature-1-Fighting Style"]).toEqual(["Defense"]);
    expect(r.featureSelections["subclass-feature-3-Old"]).toBeUndefined();
  });

  test("an Eldritch Knight's learned spells go; free spells stay", () => {
    const c = make({ class: "Fighter", level: 5, subclass: "Eldritch Knight", spells: [{ id: "s1", name: "Shield", level: 1, source: "srd" }] as any, cantrips: [{ id: "c1", name: "Fire Bolt" }] });
    const r = subclassRewind(c);
    expect(r.spells.some((s) => s.name === "Shield")).toBe(false);
    expect(r.cantrips).toHaveLength(0);
  });

  test("the wizard's subclass picks land on the character as it was; level, HP and class picks stay", () => {
    const c = make({ class: "Fighter", level: 7, maxHp: 60, currentHp: 52, subclass: "Champion", featureSelections: { "class-feature-1-Fighting Style": ["Defense"] } });
    // What the wizard returns: the rewound character levelled with its own HP, plus the picks.
    const wizard = { ...subclassRewind(c), level: 7, maxHp: 99, subclass: "Battle Master", subclassIndex: "battle-master", featureSelections: { ...subclassRewind(c).featureSelections, "subclass-feature-3-Combat Superiority": ["Parry, Riposte, Trip Attack"] } } as Character;
    const out = applySubclassRebuild(c, wizard, "en");
    expect(out.level).toBe(7);
    expect(out.maxHp).toBe(60);
    expect(out.currentHp).toBe(52);
    expect(out.subclass).toBe("Battle Master");
    expect(out.featureSelections["class-feature-1-Fighting Style"]).toEqual(["Defense"]);
    expect(out.featureSelections["subclass-feature-3-Combat Superiority"]).toEqual(["Parry, Riposte, Trip Attack"]);
    expect(names(out)).toContain("Combat Superiority");
    expect(names(out)).not.toContain("Improved Critical");
    expect(names(out)).toContain("Extra Attack");
    // It can be undone.
    expect(undoableChange(out)?.kind).toBe("subclass");
    expect(undoLevelUp(out)?.subclass).toBe("Champion");
  });

  test("a cleric's domain spells follow the new domain", () => {
    const c = make({ class: "Cleric", level: 3, subclass: "Life" });
    const wizard = { ...subclassRewind(c), level: 3, subclass: "Light", subclassIndex: "light" } as Character;
    const out = applySubclassRebuild(c, wizard, "en");
    expect(out.spells.some((s) => s.name === "Burning Hands")).toBe(true);
    expect(out.spells.some((s) => s.name === "Bless" && s.granted)).toBe(false);
  });
});

describe("picking the class again", () => {
  test("the draft keeps who the character is and drops the class", () => {
    const old = make({
      id: "keep-me", name: "Bram", class: "Fighter", level: 5, subclass: "Champion", race: "Hill Dwarf", background: "Soldier",
      str: 17, con: 16, personalityTrait1: "Loud", appearance: { ...createEmptyCharacter().appearance, backstory: "Born in the hills" },
      languages: ["Common", "Dwarvish", "Thieves' Cant"],
    });
    const d = classRebuildDraft(old);
    expect(d.id).toBe("keep-me");
    expect(d.name).toBe("Bram");
    expect(d.race).toBe("Hill Dwarf");
    expect(d.background).toBe("Soldier");
    expect(d.personalityTrait1).toBe("Loud");
    expect(d.appearance.backstory).toBe("Born in the hills");
    expect(d.class).toBe("");
    expect(d.level).toBe(1);
    expect(d.rebuildOf).toEqual({ level: 5 });
    // Hill Dwarf: +2 CON, +1 WIS come back at the end of creation.
    expect(d.con).toBe(14);
    expect(d.str).toBe(17);
    expect(d.languages).not.toContain("Thieves' Cant");
    // Soldier's skills come back with the background.
    expect(d.skills["Athletics"]).toBe(true);
  });

  test("the finished character keeps the old gear and coins, and can be undone", () => {
    const old = make({ id: "x", class: "Fighter", level: 3, inventory: [{ id: "i1", name: "Lucky coin", quantity: 1, equipped: false, source: "custom" }] as any });
    const created = { ...make({ id: "x", class: "Wizard", level: 3 }), rebuildOf: { level: 3 }, inventory: [], currency: { copper: 0, silver: 0, electrum: 0, gold: 10, platinum: 0 } } as Character;
    const out = finishClassRebuild(old, created);
    expect(out.class).toBe("Wizard");
    expect(out.inventory).toEqual(old.inventory);
    expect(out.inventory.some((i) => i.name === "Lucky coin")).toBe(true);
    expect(out.currency).toEqual(old.currency);
    expect(out.rebuildOf).toBeUndefined();
    expect(undoableChange(out)?.kind).toBe("class");
    expect(undoLevelUp(out)?.class).toBe("Fighter");
  });
});
