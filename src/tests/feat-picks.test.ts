// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { featPicks } from "@/lib/level-up-picks";

describe("featPicks", () => {
  test("class feats first, then ones that suit anyone", () => {
    expect(featPicks("Fighter", ["Lucky", "Sentinel", "Tough", "Great Weapon Master", "Alert"]).map((p) => p.name)).toEqual(["Great Weapon Master", "Sentinel", "Tough"]);
  });
  test("skips feats that can't be taken, and works with no class yet", () => {
    expect(featPicks(undefined, ["Alert", "Tough"]).map((p) => p.name)).toEqual(["Tough", "Alert"]);
  });
});
