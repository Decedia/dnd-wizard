// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { computeDerivedStats, createEmptyCharacter, type Character } from "@/lib/storage";
import { changeSubclass, syncBaseFeatures, applySubclassFeatures } from "@/lib/character-creation";
import { removeFeature, restoreFeature, saveFeatureEdit } from "@/lib/feature-edit";
import { featureUsesAfterRest, ruleFor, ruleKey } from "@/data/turn-features";
import { undoLevelUp, withLevelSnapshot } from "@/lib/level-snapshot";
import { syncGrantedSpells } from "@/lib/granted-spells";

const make = (over: Partial<Character>): Character => {
  let c = { ...createEmptyCharacter(), ruleset: "2014", race: "Human", str: 14, dex: 14, con: 14, int: 14, wis: 14, cha: 14, maxHp: 40, currentHp: 40, ...over } as Character;
  c = syncGrantedSpells(syncBaseFeatures(applySubclassFeatures(c, "en"), "en"));
  return { ...c, ...computeDerivedStats(c) } as Character;
};
const apply = (c: Character, patch: Partial<Character>): Character => ({ ...c, ...patch }) as Character;
const names = (c: Character) => c.features.map((f) => f.name);

describe("features the player adds, changes and removes", () => {
  test("a new feature is saved with its name, text and turn use", () => {
    const c = make({ class: "Fighter", level: 3 });
    const next = apply(c, saveFeatureEdit(c, null, { name: "Forge Blessing", description: "Touch a weapon.", turn: { slot: "action", uses: { max: 2, per: "short" } } }));
    const row = next.features.find((f) => f.name === "Forge Blessing")!;
    expect(row.source).toBe("custom");
    expect(row.description).toBe("Touch a weapon.");
    const rule = ruleFor(next, "Forge Blessing")!;
    expect(rule.slot).toBe("action");
    expect(rule.uses).toEqual({ max: 2, per: "short" });
    // A short rest gives its uses back.
    expect(featureUsesAfterRest({ [ruleKey(rule)]: 2 }, "short", next)).toEqual({});
  });

  test("a blank name saves nothing", () => {
    const c = make({ class: "Fighter", level: 3 });
    expect(saveFeatureEdit(c, null, { name: "  ", description: "x" })).toEqual({});
  });

  test("a removed rule feature stays removed after a sync and a level-up", () => {
    const c = make({ class: "Barbarian", level: 3 });
    const rage = c.features.find((f) => f.name === "Rage")!;
    const removed = apply(c, removeFeature(c, rage.id));
    expect(names(removed)).not.toContain("Rage");
    expect(removed.removedFeatures).toEqual(["Rage"]);
    const leveled = syncBaseFeatures({ ...removed, level: 5 }, "en");
    expect(names(leveled)).not.toContain("Rage");
    expect(names(leveled)).toContain("Extra Attack");
  });

  test("changing a rule feature keeps the player's text through a sync", () => {
    const c = make({ class: "Barbarian", level: 3 });
    const rage = c.features.find((f) => f.name === "Rage")!;
    const edited = apply(c, saveFeatureEdit(c, rage.id, { name: "Rage", description: "My table's rage." }));
    const synced = syncBaseFeatures(edited, "en");
    const rows = synced.features.filter((f) => f.name === "Rage");
    expect(rows).toHaveLength(1);
    expect(rows[0].description).toBe("My table's rage.");
    // The table rule still applies, so it stays tappable.
    expect(ruleFor(synced, "Rage")?.slot).toBe("bonus");
  });

  test("putting a feature back brings the rule version and drops the player's copy", () => {
    const c = make({ class: "Barbarian", level: 3 });
    const rage = c.features.find((f) => f.name === "Rage")!;
    const edited = apply(c, saveFeatureEdit(c, rage.id, { name: "Rage", description: "Mine." }));
    const back = restoreFeature(edited, "Rage", "en");
    const rows = back.features.filter((f) => f.name === "Rage");
    expect(rows).toHaveLength(1);
    expect(rows[0].source).toBe("class");
    expect(back.removedFeatures).toEqual([]);
  });

  test("a removed subclass feature comes back on restore", () => {
    const c = make({ class: "Fighter", level: 3, subclass: "Champion" });
    const crit = c.features.find((f) => f.name === "Improved Critical")!;
    const removed = apply(c, removeFeature(c, crit.id));
    expect(names(syncBaseFeatures(applySubclassFeatures(removed, "en"), "en"))).not.toContain("Improved Critical");
    expect(names(restoreFeature(removed, "Improved Critical", "en"))).toContain("Improved Critical");
  });
});

describe("changing the subclass on the sheet", () => {
  test("old subclass features go and new ones come in", () => {
    const c = make({ class: "Fighter", level: 7, subclass: "Champion" });
    expect(names(c)).toContain("Remarkable Athlete");
    const next = changeSubclass(c, "Battle Master", "en");
    expect(next.subclass).toBe("Battle Master");
    expect(names(next)).not.toContain("Improved Critical");
    expect(names(next)).not.toContain("Remarkable Athlete");
    expect(names(next)).toContain("Combat Superiority");
    expect(names(next)).toContain("Know Your Enemy");
    // Class features stay.
    expect(names(next)).toContain("Action Surge");
  });

  test("a subclass's free spells follow it", () => {
    const c = make({ class: "Cleric", level: 3, subclass: "Life" });
    expect(c.spells.some((s) => s.name === "Bless")).toBe(true);
    const next = changeSubclass(c, "Light", "en");
    expect(next.spells.some((s) => s.name === "Bless" && s.granted)).toBe(false);
    expect(next.spells.some((s) => s.name === "Burning Hands")).toBe(true);
  });
});

describe("undo the last level-up", () => {
  test("goes back to the old level and keeps gear, coins and story", () => {
    const before = make({ class: "Fighter", level: 4, maxHp: 36, currentHp: 36 });
    const after = withLevelSnapshot(before, { ...before, level: 5, maxHp: 45, currentHp: 45, features: syncBaseFeatures({ ...before, level: 5 }, "en").features });
    expect(after.levelUpSnapshot?.level).toBe(4);
    const later = { ...after, currentHp: 20, currency: { ...after.currency, gold: 99 }, appearance: { ...after.appearance, backstory: "New tale" } };
    const undone = undoLevelUp(later)!;
    expect(undone.level).toBe(4);
    expect(undone.maxHp).toBe(36);
    expect(undone.currentHp).toBe(20);
    expect(names(undone)).not.toContain("Extra Attack");
    expect(undone.currency.gold).toBe(99);
    expect(undone.appearance.backstory).toBe("New tale");
    expect(undone.levelUpSnapshot).toBeUndefined();
  });

  test("features made or removed by hand since the level-up stay that way", () => {
    const before = make({ class: "Fighter", level: 4 });
    let after = withLevelSnapshot(before, { ...before, level: 5 });
    after = apply(after, saveFeatureEdit(after, null, { name: "Forge Blessing", description: "x" }));
    after = apply(after, removeFeature(after, after.features.find((f) => f.name === "Second Wind")!.id));
    const undone = undoLevelUp(after)!;
    expect(names(undone)).toContain("Forge Blessing");
    expect(names(undone)).not.toContain("Second Wind");
    expect(undone.removedFeatures).toEqual(["Second Wind"]);
  });

  test("HP left can't go over the old maximum", () => {
    const before = make({ class: "Fighter", level: 4, maxHp: 36, currentHp: 36 });
    const after = withLevelSnapshot(before, { ...before, level: 5, maxHp: 45, currentHp: 45 });
    expect(undoLevelUp(after)!.currentHp).toBe(36);
  });

  test("a snapshot never nests the one before it", () => {
    const l4 = make({ class: "Fighter", level: 4 });
    const l5 = withLevelSnapshot(l4, { ...l4, level: 5 });
    const l6 = withLevelSnapshot(l5, { ...l5, level: 6 });
    expect(l6.levelUpSnapshot?.level).toBe(5);
    expect((l6.levelUpSnapshot?.character as any).levelUpSnapshot).toBeUndefined();
  });
});
