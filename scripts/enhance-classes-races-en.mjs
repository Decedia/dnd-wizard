import path from "path";
import { requireApiKey } from "./lib/nim.mjs";
import { buildUnits, applyToEnData, PATHS } from "./lib/srd-text.mjs";
import { runEnhancement, parseArgs } from "./lib/enhance-runner.mjs";
import { tidy, structuralProblems } from "./lib/text-tidy.mjs";

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
  "YOU ARE REWRITING, NOT SUMMARISING. THIS IS THE MOST IMPORTANT RULE.",
  "* Your output must be about as long as the input. A shorter result means you dropped content and will be rejected.",
  "* Every number, dice expression, distance, duration and quantity in the source MUST appear in your output.",
  "  Never replace a concrete value with a reference. Write '+2 to the damage roll', never 'as per the Barbarian table'.",
  "* If the source is a bullet list, your output is a bullet list. Never turn a list into a paragraph.",
  "* Keep every level-scaling section as its own block ('At 2nd level, you gain Reckless Attack...'), in the same order.",
  "  Never merge them into the surrounding prose.",
  "* Keep every paragraph break the source had. Do not condense several paragraphs into one.",
  "",
  "FIELD RULES:",
  "* 'summary' is the short card text shown in the character sheet list. One or two sentences, at most 40 words.",
  "  It must name the concrete effect ('Rage gives advantage on Strength checks and resistance to bludgeoning, piercing and slashing damage'),",
  "  not restate the feature name. Do not start it with the feature name.",
  "* 'description' is the full rules text. Keep all paragraph breaks, sub-headings and list structure.",
  "* 'flavorText' (classes and subclasses only) is evocative character fiction: no mechanical numbers, no rules.",
  "  Keep every paragraph and every idea; improve the wording, do not cut it down.",
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
  "OUTPUT FORMAT:",
  "* Return STRICT raw JSON, no markdown fences, no commentary.",
  "* It must be a flat object mapping each input id to an object holding only the rewritten text fields.",
  "* Do NOT repeat 'name', 'group', 'fields', 'context' or 'source' in your answer.",
  '* Example of the exact shape expected:',
  '  { "2014_races.bugbear.sneaky": { "summary": "...", "description": "..." } }',
  "* Always return every field that was in the input, even if you only lightly edited it. Never omit a field.",
].join("\n");

function buildUserPrompt(batch) {
  return (
    "Rewrite each entry below, word for word where it is already correct and only clearer where it is not. " +
    "Do not summarise: your output must keep every number, every bullet point, every level-scaling section and every paragraph from the source. " +
    "Return a flat JSON object mapping each id to an object containing only the rewritten text fields, " +
    "with the same field names the input used (summary, description, flavorText). " +
    "Do not repeat the input's name, group, fields, context or source keys. " +
    "Use only the mechanical facts supplied. Keep every number, dice expression and distance exactly as written. No commentary.\n\n" +
    JSON.stringify(batch, null, 1)
  );
}

// Fields are judged independently: a model that rewrites a description well but
// returns nothing for flavorText should still get its description saved, and the
// original flavorText stays. Only a unit where every field failed is discarded.
function validate(result, unit) {
  const enhanced = result?.[unit.id];
  if (!enhanced || typeof enhanced !== "object") return { ok: false, reason: "no entry in response" };

  const values = {};
  const reasons = [];
  for (const field of unit.fields) {
    const raw = typeof enhanced[field] === "string" ? enhanced[field] : "";
    if (!raw.trim()) {
      reasons.push(`${field}: not returned`);
      continue;
    }
    const value = tidy(raw);
    const sourceLength = unit.text[field].length;
    if (value.length < sourceLength * 0.45) {
      reasons.push(`${field}: collapsed to ${value.length}/${sourceLength} chars`);
      continue;
    }
    // Several subclasses ship a stub flavorText of one line. Growing that into real
    // prose is the point of the pass, so summaries and flavorText get an absolute
    // floor on their ceiling rather than a purely proportional one.
    const absoluteCeiling = field === "summary" ? 300 : 800;
    const ceiling =
      field === "summary" || field === "flavorText" ? Math.max(sourceLength * 2.5, absoluteCeiling) : sourceLength * 2.5;
    if (value.length > ceiling) {
      reasons.push(`${field}: ballooned to ${value.length}/${ceiling} chars`);
      continue;
    }
    const structural = structuralProblems(unit.text[field], value, field);
    if (structural.length) {
      reasons.push(`${field}: ${structural.join("; ")}`);
      continue;
    }
    values[field] = value;
  }

  if (Object.keys(values).length) return { ok: true, values, reasons };
  if (/\[\[|\]\]/.test(JSON.stringify(enhanced))) return { ok: false, reason: "output contains [[ ]] markers" };
  return { ok: false, reason: reasons.join("; ") || "nothing usable" };
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
