// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { optionLine, SHORT_LINE_MAX } from "@/lib/option-line";
import { optionIcon, subclassIcon } from "@/components/option-icons";
import { GiCrown, GiSparkles } from "react-icons/gi";

// Lists of spells, skills, tools, weapons and languages get their line from the item or spell itself.
const OWN_LINES = /Magical Secrets|Signature|Mystic|Student of War|Kensei|Bonus Proficiencies|Training in War|Envoy|Glamour|Intrigue|Blessings of Knowledge|Acolyte|Lore|Divine Magic|Draconic Gift|Eldritch Invocations/;

const choices: { feature: string; name: string; description: string }[] = [];
const add = (feature: string, o: any) => choices.push(typeof o === "string" ? { feature, name: o, description: "" } : { feature, name: o.name, description: o.description || "" });
const visit = (x: any) => {
  if (!x || typeof x !== "object") return;
  if (x.name && x.choices?.options?.length && !OWN_LINES.test(x.name)) for (const o of x.choices.options) add(x.name, o);
  for (const k of Object.keys(x)) visit(x[k]);
};
visit(JSON.parse(readFileSync("src/data/en/2014_classes.json", "utf8")));
visit(JSON.parse(readFileSync("src/data/en/2014_subclasses.json", "utf8")));
for (const c of Object.values<any>(JSON.parse(readFileSync("src/data/subclass_feature_choices.json", "utf8"))))
  for (const s of Object.values<any>(c)) for (const [f, v] of Object.entries<any>(s)) if (!OWN_LINES.test(f)) for (const o of v.options || []) add(f, o);
for (const name of Object.keys(JSON.parse(readFileSync("src/data/warlock_invocations.json", "utf8")).invocations)) add("Eldritch Invocations", name);

describe("level-up option cards", () => {
  test("every option has one short line in English and Indonesian", () => {
    const bad = choices.flatMap((c) => ["en", "id"].map((lang) => ({ ...c, lang, line: optionLine(c.feature, c, lang) }))).filter((c) => !c.line || c.line.length > SHORT_LINE_MAX + 10);
    expect(bad.map((c) => `${c.lang} ${c.feature}: ${c.name}`)).toEqual([]);
  });

  test("every option has its own icon", () => {
    expect(choices.filter((c) => optionIcon(c.feature, c.name) === GiSparkles).map((c) => `${c.feature}: ${c.name}`)).toEqual([]);
  });

  test("the same name means different things in different features", () => {
    expect(optionLine("Totem Spirit", { name: "Bear" }, "en")).toContain("half damage");
    expect(optionLine("Aspect of the Beast", { name: "Bear" }, "en")).toContain("twice as much");
  });

  test("SRD subclasses have their own icon", () => {
    const names = ["Berserker", "Lore", "Life", "Land", "Champion", "Open Hand", "Devotion", "Hunter", "Thief", "Draconic", "Fiend", "Evocation"];
    expect(names.filter((n) => subclassIcon(n) === GiCrown)).toEqual([]);
  });
});
