// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { Vector3 } from "three";
import { dieValue, droppedIndex, groupText, groupTotal, parseRoll, spellDamageGroups } from "@/lib/dice-roll";
import { dieShape, topValue, type ShapeKind } from "@/components/dice/shapes";

describe("parseRoll", () => {
  test("dice and bonus", () => {
    expect(parseRoll("1d20+7")).toEqual({ dice: ["d20"], mod: 7 });
    expect(parseRoll("2d6 + 1d8 - 1")).toEqual({ dice: ["d6", "d6", "d8"], mod: -1 });
    expect(parseRoll("d20")).toEqual({ dice: ["d20"], mod: 0 });
    expect(parseRoll("1d8 + 3 slashing damage")).toEqual({ dice: ["d8"], mod: 3 });
    expect(parseRoll("1d8 − 1")).toEqual({ dice: ["d8"], mod: -1 });
  });
  test("repeats", () => {
    expect(parseRoll("3 × 1d4+1")).toEqual({ dice: ["d4", "d4", "d4"], mod: 3 });
    expect(parseRoll("3x(1d4+1)")).toEqual({ dice: ["d4", "d4", "d4"], mod: 3 });
  });
  test("no dice the tray has", () => {
    expect(parseRoll("5")).toBeNull();
    expect(parseRoll("1d7")).toBeNull();
    expect(parseRoll("fire")).toBeNull();
  });
});

describe("counting", () => {
  test("die values", () => {
    expect(dieValue("d10", [0])).toBe(10);
    expect(dieValue("d10", [7])).toBe(7);
    expect(dieValue("d100", [0, 0])).toBe(100);
    expect(dieValue("d100", [0, 5])).toBe(5);
    expect(dieValue("d100", [9, 0])).toBe(90);
  });
  test("advantage and disadvantage keep one d20", () => {
    const g = { label: "To hit", dice: ["d20" as const], mod: 5, d20Test: true };
    expect(groupTotal(g, [4, 17], "adv")).toBe(22);
    expect(groupTotal(g, [4, 17], "dis")).toBe(9);
    expect(groupTotal(g, [12])).toBe(17);
    expect(droppedIndex(g, [4, 17], "adv")).toBe(0);
    expect(droppedIndex(g, [4, 17], "dis")).toBe(1);
    expect(droppedIndex(g, [12], "normal")).toBe(-1);
  });
  test("damage ignores advantage", () => {
    expect(groupTotal({ label: "Damage", dice: ["d6", "d6"], mod: 2 }, [3, 4], "adv")).toBe(9);
  });
  test("text", () => {
    expect(groupText({ label: "", dice: ["d6", "d6", "d8"], mod: -1 })).toBe("2d6 + 1d8 − 1");
    expect(groupText({ label: "", dice: ["d100"], mod: 0 })).toBe("1d100");
  });
  test("spell damage groups", () => {
    const groups = spellDamageGroups(
      [
        { dice: "1d4+1", type: "force", count: 3 },
        { dice: "2d6", type: "fire", count: 1, when: "laterTurn" },
      ],
      "Damage",
    );
    expect(groups).toEqual([{ label: "Damage force", dice: ["d4", "d4", "d4"], mod: 3 }]);
  });
});

describe("dice shapes", () => {
  const counts: Record<ShapeKind, number> = { d4: 4, d6: 6, d8: 8, d10: 10, pct: 10, d12: 12, d20: 20 };
  for (const kind of Object.keys(counts) as ShapeKind[]) {
    test(`${kind} is a closed solid with flat faces`, () => {
      const s = dieShape(kind);
      expect(s.faces.length).toBe(counts[kind]);
      s.faces.forEach((f, i) => {
        const n = s.normals[i];
        const d = s.verts[f[0]].dot(n);
        expect(d).toBeGreaterThan(0);
        for (const c of f) expect(Math.abs(s.verts[c].dot(n) - d)).toBeLessThan(1e-6);
      });
    });
  }
  test("opposite faces add up like real dice", () => {
    const sums: Partial<Record<ShapeKind, number>> = { d6: 7, d8: 9, d12: 13, d20: 21, d10: 9, pct: 9 };
    for (const [kind, sum] of Object.entries(sums) as [ShapeKind, number][]) {
      const s = dieShape(kind);
      s.normals.forEach((n, i) => {
        const j = s.normals.findIndex((m) => m.dot(n) < -0.99);
        expect(j).toBeGreaterThanOrEqual(0);
        expect(s.values[i] + s.values[j]).toBe(sum);
      });
      const max = kind === "d10" || kind === "pct" ? 9 : s.faces.length;
      const min = kind === "d10" || kind === "pct" ? 0 : 1;
      expect([...s.values].sort((a, b) => a - b)).toEqual(Array.from({ length: max - min + 1 }, (_, k) => k + min));
    }
  });
  test("top face is read", () => {
    const s = dieShape("d6");
    const up = new Vector3(0, 1, 0);
    expect(topValue(s, s.normals.map((n) => n.dot(up)))).toBe(s.values[s.normals.findIndex((n) => n.y > 0.99)]);
    const d4 = dieShape("d4");
    expect(topValue(d4, [], d4.verts.map((p) => p.y))).toBe(d4.cornerValues![d4.verts.findIndex((p) => p.y === Math.max(...d4.verts.map((q) => q.y)))]);
  });
});
