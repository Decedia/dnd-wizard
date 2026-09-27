import fs from "fs";
import path from "path";

const spellFile = path.resolve("src/locales/parts/en/2014_spells.json");

function groupSpells(data) {
  const grouped = {};

  for (const [key, value] of Object.entries(data)) {
    const match = key.match(/^2014_spells\.([^.]+)\.(description|effectSummary|fullDescription)$/);
    if (!match) continue;

    const spellName = match[1];
    const field = match[2];

    if (!grouped[spellName]) {
      grouped[spellName] = { description: "", effectSummary: "", fullDescription: "" };
    }
    grouped[spellName][field] = value;
  }

  return grouped;
}

const DICE_RE = /\*\*(\d+d\d+)\*\*|(?<!\*)(\d+d\d+)(?!\*)/g;

function highlightDice(text) {
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = DICE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }

    const dice = match[1] || match[2];
    parts.push({ type: "dice", value: dice });

    lastIndex = DICE_RE.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }

  return parts;
}

function renderDiceText(text) {
  const parts = highlightDice(text);
  return parts.map((part, idx) => {
    if (part.type === "dice") {
      return `[DICE:${part.value}]`;
    }

    const nodes = [];
    const segments = part.value.split(/(\*\*[^*]+\*\*)/g);

    segments.forEach((segment, segIdx) => {
      if (!segment) return;

      if (segment.startsWith("**") && segment.endsWith("**")) {
        const inner = segment.slice(2, -2);
        nodes.push(`**${inner}**`);
      } else {
        nodes.push(segment);
      }
    });

    return nodes.join("");
  }).join("");
}

async function main() {
  console.log("Loading spell data...");
  const raw = fs.readFileSync(spellFile, "utf-8");
  const data = JSON.parse(raw);

  const grouped = groupSpells(data);
  const testSpells = ["acid-splash", "blade-bite", "booming-blade"];

  console.log("\n=== Dice Rendering Test for 3 Spells ===\n");

  for (const name of testSpells) {
    const entry = grouped[name];
    if (!entry || !entry.description) {
      console.log(`\n--- ${name} ---`);
      console.log("No description found");
      continue;
    }

    console.log(`\n--- ${name} ---`);
    console.log("Original description:");
    console.log(entry.description);
    console.log("\nRendered with dice tags:");
    console.log(renderDiceText(entry.description));
    console.log("\n---\n");
  }
}

main();
