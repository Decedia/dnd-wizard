// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { completeQuickDraft, quickRaceOptions, quickSpellOrder, startQuickDraft, QUICK_ORIGINS, QUICK_SOURCES } from "@/lib/quick-create";
import { autoEquipStartingGear, getCreationSteps, racePatch } from "@/lib/character-creation";
import { getStaticRace, getStaticSubclasses } from "@/lib/srd-client";
import { getBackgroundData } from "@/data/backgrounds";

/** Creation steps (all but the level step, which the level-up wizard finishes) still open. */
const openSteps = (c: ReturnType<typeof completeQuickDraft>) =>
  getCreationSteps(c).filter((s) => s.required && !s.completed && s.type !== "level").map((s) => s.id);

describe("quick create", () => {
  test("every class's default race and background exist", () => {
    for (const [cls, origin] of Object.entries(QUICK_ORIGINS)) {
      expect(getStaticRace(origin.race, "2014"), `${cls} race`).toBeTruthy();
      expect(getBackgroundData(origin.background), `${cls} background`).toBeTruthy();
    }
  });

  test("every subclass finishes all creation steps", () => {
    let count = 0;
    for (const cls of Object.keys(QUICK_ORIGINS)) {
      for (const sub of getStaticSubclasses(cls, QUICK_SOURCES, "2014")) {
        const c = completeQuickDraft(startQuickDraft(cls, sub.name), { name: "Test" });
        expect(openSteps(c), `${cls} / ${sub.name}`).toEqual([]);
        expect(c.subclass).toBe(sub.name);
        count++;
      }
    }
    expect(count).toBeGreaterThan(100);
  });

  test("every race finishes all creation steps", () => {
    for (const race of quickRaceOptions()) {
      const draft = startQuickDraft("Wizard", "Evocation");
      const c = completeQuickDraft({ ...draft, ...racePatch(draft, { name: race }) }, { name: "Test" });
      expect(openSteps(c), race).toEqual([]);
    }
  });

  test("standard array goes where the class needs it", () => {
    const wizard = completeQuickDraft(startQuickDraft("Wizard", "Evocation"), { name: "W" });
    expect([wizard.int, wizard.con, wizard.dex]).toEqual([15, 14, 13]);
    const fighter = completeQuickDraft(startQuickDraft("Fighter", "Champion"), { name: "F" });
    expect(fighter.str).toBe(15);
  });

  test("player text is kept and the name is required", () => {
    const c = completeQuickDraft(startQuickDraft("Bard", "Lore"), { name: "Lyra", alignment: "Neutral Good", flaw: "I trust too easily.", appearance: { eyes: "Gold" } });
    expect(c.name).toBe("Lyra");
    expect(c.alignment).toBe("Neutral Good");
    expect(c.flaw).toBe("I trust too easily.");
    expect(c.appearance.eyes).toBe("Gold");
  });

  test("spell order puts popular spells first, then higher levels", () => {
    const order = quickSpellOrder([
      { name: "Alarm", level: 1 },
      { name: "Shield", level: 1 },
      { name: "Darkvision", level: 2 },
    ]).map((s) => s.name);
    expect(order).toEqual(["Shield", "Darkvision", "Alarm"]);
  });

  test("starting gear: a Dexterity ranger holds the shortsword, an archer the longbow", () => {
    const ranger = completeQuickDraft(startQuickDraft("Ranger", "Hunter"), { name: "R" });
    const held = (inv: typeof ranger.inventory) => inv.filter((r) => r.equipped && r.itemType === "weapon").map((r) => r.name);
    expect(held(autoEquipStartingGear(ranger))).toEqual(["Shortsword"]);
    const archer = { ...ranger, featureSelections: { "class-feature-2-Fighting Style": ["Archery"] } };
    expect(held(autoEquipStartingGear(archer))).toEqual(["Longbow"]);
  });
});
