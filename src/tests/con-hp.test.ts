import { describe, expect, it } from "bun:test";
import { applyConChangeToHp, type Character } from "@/lib/storage";

const fighter = (extra: Partial<Character> = {}) =>
  ({ level: 3, con: 14, maxHp: 28, currentHp: 20, levelHp: { 1: 12, 2: 8, 3: 8 }, isCustomHp: false, ...extra }) as Character;

function change(prev: Character, patch: Partial<Character>) {
  const next = { ...prev, ...patch };
  return { ...next, ...applyConChangeToHp(prev, next, patch) };
}

describe("max HP follows a CON change on the sheet", () => {
  it("adds the new modifier at every level", () => {
    const after = change(fighter(), { con: 16 });
    expect(after.levelHp).toEqual({ 1: 13, 2: 9, 3: 9 });
    expect(after.maxHp).toBe(31);
    expect(after.currentHp).toBe(23);
  });
  it("comes back to the same HP after typing through a low score", () => {
    const low = change(fighter(), { con: 1 });
    const back = change(low, { con: 14 });
    expect(back.levelHp).toEqual({ 1: 12, 2: 8, 3: 8 });
    expect(back.maxHp).toBe(28);
  });
  it("leaves a custom max HP and a same-modifier change alone", () => {
    expect(change(fighter({ isCustomHp: true }), { con: 18 }).maxHp).toBe(28);
    expect(change(fighter(), { con: 15 }).maxHp).toBe(28);
  });
});
