// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { applyStartingGold, averageGold, goldFormula, higherLevelRoll, rollGold, startingGoldOf, wealthRoll } from "@/lib/starting-gold";
import { createEmptyCharacter, type Character } from "@/lib/storage";

const make = (patch: Partial<Character>): Character => ({ ...createEmptyCharacter(), ...patch }) as Character;
const gear = [
  { id: "a", name: "Longsword", quantity: 1, equipped: false, source: "srd", choiceGroupIndex: 0 },
  { id: "b", name: "Explorer's Pack", quantity: 1, equipped: false, source: "srd", isGranted: true, grantedFrom: "Explorer's Pack" },
  { id: "c", name: "Pouch", quantity: 1, equipped: false, source: "srd", grantedFrom: "background:Soldier", contents: [{ id: "gp", quantity: 10 }] },
  { id: "d", name: "Lucky Coin", quantity: 1, equipped: false, source: "custom" },
] as Character["inventory"];

describe("starting gold", () => {
  test("class wealth dice from the rulebook", () => {
    expect(goldFormula(wealthRoll("Fighter")!)).toBe("5d4 x 10 gp");
    expect(goldFormula(wealthRoll("Monk")!)).toBe("5d4 gp");
    expect(averageGold(wealthRoll("Wizard")!)).toBe(100);
    expect(averageGold(wealthRoll("Barbarian")!)).toBe(50);
    expect(rollGold(wealthRoll("Fighter")!, () => 0.999).total).toBe(200);
  });

  test("extra gold for higher levels", () => {
    expect(higherLevelRoll(4)).toBeNull();
    expect(averageGold(higherLevelRoll(5)!)).toBe(500 + 137);
    expect(averageGold(higherLevelRoll(11)!)).toBe(5000 + 1375);
    expect(goldFormula(higherLevelRoll(17)!)).toBe("20,000 gp + 1d10 x 250 gp");
  });

  test("taking gold drops class and background gear and adds the gold", () => {
    const c = applyStartingGold(make({ class: "Fighter", level: 1, inventory: gear, startingGold: { mode: "gold", gold: 130, extra: 0 } }));
    expect(c.inventory.map((r) => r.name)).toEqual(["Lucky Coin"]);
    expect(c.currency.gold).toBe(130);
  });

  test("taking the gear keeps it; a level 5 start adds the extra gold either way", () => {
    const c = applyStartingGold(make({ class: "Fighter", level: 5, inventory: gear }));
    expect(c.inventory).toHaveLength(4);
    expect(c.currency.gold).toBe(637);
    expect(startingGoldOf(make({ class: "Fighter", level: 1 }))).toEqual({ mode: "gear", gold: 125, extra: 0 });
  });
});
