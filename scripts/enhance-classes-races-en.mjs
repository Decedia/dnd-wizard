import path from "path";
import { requireApiKey } from "./lib/nim.mjs";
import { buildUnits, applyToEnData, PATHS } from "./lib/srd-text.mjs";
import { runEnhancement, parseArgs } from "./lib/enhance-runner.mjs";

const options = parseArgs();
if (!options.dryRun && !options.showPrompt) requireApiKey();

const SYSTEM_PROMPT = [
  "You are a professional D&D 5e rules writer. You rewrite the official text of a class, subclass, class feature or racial trait so a player can read it once and immediately know what it does.",
  "",
  "GOAL: CLEAR, COMPLETE, MECHANICALLY EXACT ENGLISH.",
  "* Keep every rule. Never summarise away a mechanic, a limit, an exception or an example.",
  "* Fix awkward official phrasing and anything that reads like it was written for a spreadsheet.",
  "* Stay in second person ('you') throughout. The reader is the character.",
  "",
  "FIELD RULES:",
  "* 'summary' is the short card text shown in the character sheet list. One or two sentences, at most 40 words.",
  "  It must name the concrete effect ('Rage gives advantage on Strength checks and resistance to bludgeoning, piercing and slashing damage'),",
  "  not restate the feature name. Do not start it with the feature name.",
  "* 'description' is the full rules text. Keep all paragraph breaks, sub-headings and list structure.",
  "* 'flavorText' (classes and subclasses only) is evocative character fiction: no mechanical numbers, no rules.",
  "",
  "PRECISION RULES:",
  "* Use ONLY the mechanical facts given in the input fields. Never invent a number, a distance, a duration or a condition.",
  "* Prefer exact values from the context fields: 'as a bonus action', '1 per long rest', '60 feet', 'until the end of your next turn'.",
  "* Keep every number, dice expression and distance exactly as written in the source. Dice stay plain: 2d6 or **2d6**.",
  "* List markers must be standard dashes (-). NEVER use asterisks (*).",
  "* Ability names, damage types, conditions, skill names, action types and saving throws are written as plain words",
  "  ('Strength saving throw', 'Intelligence (Arcana) check', 'bludgeoning damage'). Do not wrap them in markup or tags.",
  "* Keep markdown bold around dice and key values. Do not add any other formatting.",
  "* Never translate or alter a proper name: class names, subclass names, feature names and spell names stay in English and keep their exact capitalisation.",
  "",
  "OUTPUT:",
  "* Return STRICT raw JSON. No markdown fences, no commentary.",
  "* Map each input id to an object with exactly the same field names it was given.",
].join("\n");

function buildUserPrompt(batch) {
  return (
    "Rewrite each entry below. Return ONLY a JSON object mapping each id to an object with the same field names it was given " +
    "(for example id -> {summary, description} or id -> {flavorText, description}). " +
    "Use only the mechanical facts supplied. Keep every number, dice expression and distance exactly as written. No commentary.\n\n" +
    JSON.stringify(batch, null, 1)
  );
}

function validate(result, unit) {
  const enhanced = result?.[unit.id];
  if (!enhanced || typeof enhanced !== "object") return { ok: false, reason: "no entry in response" };

  const values = {};
  for (const field of unit.fields) {
    const value = typeof enhanced[field] === "string" ? enhanced[field].trim() : "";
    if (!value) return { ok: false, reason: `empty ${field}` };
    // A rewrite that is dramatically shorter than the source lost rules; a wildly
    // longer one is usually the model padding or running on into the next entry.
    const sourceLength = unit.text[field].length;
    if (value.length < sourceLength * 0.45) return { ok: false, reason: `${field} collapsed to ${value.length}/${sourceLength} chars` };
    if (value.length > sourceLength * 2.5) return { ok: false, reason: `${field} ballooned to ${value.length}/${sourceLength} chars` };
    values[field] = value;
  }

  const all = Object.values(values).join("\n");
  if (/\[\[|\]\]/.test(all)) return { ok: false, reason: "output contains [[ ]] markers" };
  if (/(^|\n)\s*\*/.test(values.description || "")) return { ok: false, reason: "description uses asterisk list markers" };
  if (/^\s*\d+\.\s/m.test(values.description || "")) return { ok: false, reason: "description uses numbered list markers" };
  // An untranslated response is the classic failure mode: it would silently
  // replace the English source with the same text.
  if (unit.text.description && values.description === unit.text.description.trim()) {
    return { ok: false, reason: "description is byte-identical to the source" };
  }
  return { ok: true, values };
}

const { units, counts } = buildUnits();

console.log("Unit breakdown:", counts);

await runEnhancement({
  label: "classes/races (en)",
  units,
  progressFile: path.join(PATHS.partsDir, "en", ".enhance-classes-races-progress.json"),
  systemPrompt: SYSTEM_PROMPT,
  buildUserPrompt,
  validate,
  options,
  apply: (enhancements) => {
    const applied = applyToEnData(enhancements, { stampLastUpdated: true });
    return `wrote ${applied} unit(s) to src/data/en`;
  },
});

console.log("\nNext: refresh the derived English artefacts with");
console.log("  node scripts/build-en-classes-locale.mjs");
console.log("  node scripts/build-en-races-locale.mjs");
console.log("  node scripts/extract-srd-strings.mjs");
console.log("then run the Indonesian pass (scripts/enhance-classes-races-id.mjs).");
