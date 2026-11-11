// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import choices from "@/data/subclass_feature_choices.json";
import textId from "@/data/id/subclass_feature_choices_text.json";
import { BEASTS, ELEMENTALS } from "@/data/wild-shapes";
import { translations as id } from "@/locales/id";
import { getStaticSubclasses } from "@/lib/srd-client";

const allTexts = () => {
  const out = new Set<string>();
  for (const subs of Object.values(choices as any)) for (const feats of Object.values(subs as any)) for (const v of Object.values(feats as any) as any[]) {
    if (v.description) out.add(v.description);
    for (const o of v.options || []) if (o.description) out.add(o.description);
    for (const x of v.extra || []) {
      if (x.description) out.add(x.description);
      for (const o of x.options || []) if (o.description) out.add(o.description);
    }
  }
  return out;
};

describe("Indonesian subclass picks and beast names", () => {
  test("every subclass pick text has an Indonesian version", () => {
    const missing = [...allTexts()].filter((s) => !(s in (textId as Record<string, string>)));
    expect(missing).toEqual([]);
  });

  test("the subclass list in Indonesian shows the Indonesian text and keeps the English pick names", () => {
    const champion = getStaticSubclasses("Fighter", undefined, "2014", "id").find((s: any) => s.name === "Champion") as any;
    const style = champion.features.find((f: any) => f.name === "Additional Fighting Style");
    const defense = style.choices.find((c: any) => c.name === "Fighting Style: Defense");
    expect(defense.description).toBe("Saat memakai armor, kamu mendapat bonus +1 AC.");
  });

  test("every Wild Shape form has an Indonesian name", () => {
    const missing = [...BEASTS, ...ELEMENTALS].filter((b) => !(id as Record<string, string>)[`wild.name.${b.name}`]);
    expect(missing.map((b) => b.name)).toEqual([]);
  });
});
