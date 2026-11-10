// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { parseBlocks, tokenizeInline } from "@/lib/rich-text";

const kinds = (text: string) => tokenizeInline(text).filter((t) => t.type !== "text").map((t) => `${t.type}:${t.value}`);

describe("rich text tokens", () => {
  test("dice, with and without a modifier or bold marks", () => {
    expect(kinds("deals 2d6 + 4 on a hit, or **1d8** and a d20 roll")).toEqual(["dice:2d6 + 4", "dice:1d8", "dice:d20"]);
    expect(kinds("roll 1d6 - 1d4, your dice turn into d10s")).toEqual(["dice:1d6", "dice:1d4", "dice:d10s"]);
    expect(kinds("the word and and odd3d stay plain")).toEqual([]);
  });

  test("damage types in English, also in a list", () => {
    const tokens = tokenizeInline("takes 8d6 fire damage, or cold or lightning damage");
    expect(tokens.filter((t) => t.type === "damage")).toEqual([
      { type: "damage", value: "fire damage", damage: "fire" },
      { type: "damage", value: "cold", damage: "cold" },
      { type: "damage", value: "lightning damage", damage: "lightning" },
    ]);
  });

  test("damage types in Indonesian text", () => {
    expect(tokenizeInline("menerima 2d6 kerusakan api dan kerusakan kekuatan").filter((t) => t.type === "damage")).toEqual([
      { type: "damage", value: "kerusakan api", damage: "fire" },
      { type: "damage", value: "kerusakan kekuatan", damage: "force" },
    ]);
  });

  test("saving throws and conditions", () => {
    expect(kinds("make a Wisdom saving throw or be frightened")).toEqual(["save:Wisdom saving throw", "condition:frightened"]);
    expect(kinds("saving throw Konstitusi atau menjadi lumpuh")).toEqual(["save:saving throw Konstitusi", "condition:lumpuh"]);
  });

  test("distances, timing and DCs are marked as terms", () => {
    expect(kinds("as a bonus action, a creature within 30 feet makes a DC 15 check for 1 minute")).toEqual(["term:bonus action", "term:30 feet", "term:DC 15", "term:1 minute"]);
    expect(kinds("a 20-foot radius, regained on a short or long rest")).toEqual(["term:20-foot", "term:short or long rest"]);
  });

  test("plain bold stays bold", () => {
    expect(kinds("within **30 feet** of you")).toEqual(["bold:30 feet"]);
  });
});

describe("rich text blocks", () => {
  test("paragraphs, lists and lead-ins", () => {
    const blocks = parseBlocks("Starting at 6th level, you gain wings.\n\nDragon Wings: you can fly.\n- one\n- two\n1. first");
    expect(blocks.map((b) => b.type)).toEqual(["paragraph", "paragraph", "list", "list"]);
    expect((blocks[0] as any).lead).toBe("Starting at 6th level");
    expect((blocks[0] as any).tokens[0].value.startsWith(",")).toBe(true);
    expect((blocks[1] as any).lead).toBe("Dragon Wings:");
    expect((blocks[2] as any).items).toHaveLength(2);
    expect((blocks[3] as any).ordered).toBe(true);
  });

  test("accepts arrays and empty values", () => {
    expect(parseBlocks(["a", "b"])).toHaveLength(2);
    expect(parseBlocks(undefined)).toEqual([]);
  });
});
