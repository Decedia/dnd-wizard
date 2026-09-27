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

const DAMAGE_TYPES = [
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
];

const STATUSES = [
  "blinded",
  "charmed",
  "deafened",
  "frightened",
  "grappled",
  "incapacitated",
  "invisible",
  "paralyzed",
  "petrified",
  "poisoned",
  "prone",
  "restrained",
  "stunned",
  "unconscious",
  "exhaustion",
];

const DAMAGE_TYPE_RE = new RegExp(`\\b(${DAMAGE_TYPES.join("|")})\\s+damage\\b`, "gi");
const STATUS_RE = new RegExp(`\\b(${STATUSES.join("|")})\\b`, "gi");

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

function splitDamageTokens(value) {
  const tokens = [];
  let lastIndex = 0;
  let match;

  while ((match = DAMAGE_TYPE_RE.exec(value)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: value.slice(lastIndex, match.index) });
    }

    tokens.push({ type: "damage", value: match[0] });

    lastIndex = DAMAGE_TYPE_RE.lastIndex;
  }

  if (lastIndex < value.length) {
    tokens.push({ type: "text", value: value.slice(lastIndex) });
  }

  return tokens;
}

function splitStatusTokens(value) {
  const tokens = [];
  let lastIndex = 0;
  let match;

  while ((match = STATUS_RE.exec(value)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: value.slice(lastIndex, match.index) });
    }

    tokens.push({ type: "status", value: match[0] });

    lastIndex = STATUS_RE.lastIndex;
  }

  if (lastIndex < value.length) {
    tokens.push({ type: "text", value: value.slice(lastIndex) });
  }

  return tokens;
}

function renderTextSegment(value) {
  const nodes = [];
  const segments = value.split(/(\*\*[^*]+\*\*)/g);

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
}

function renderDiceText(text) {
  const parts = highlightDice(text);
  return parts.map((part, idx) => {
    if (part.type === "dice") {
      return `[DICE:${part.value}]`;
    }

    const damageTokens = splitDamageTokens(part.value);

    return damageTokens.map((token, tokenIdx) => {
      if (token.type === "damage") {
        return `[DAMAGE:${token.value}]`;
      }

      const statusTokens = splitStatusTokens(token.value);

      return statusTokens.map((statusToken, statusIdx) => {
        if (statusToken.type === "status") {
          return `[STATUS:${statusToken.value}]`;
        }

        return renderTextSegment(statusToken.value);
      }).join("");
    }).join("");
  }).join("");
}

async function main() {
  console.log("Loading spell data...");
  const raw = fs.readFileSync(spellFile, "utf-8");
  const data = JSON.parse(raw);

  const grouped = groupSpells(data);
  const testSpells = ["protection-from-evil-and-good", "ray-of-sickness", "acid-splash"];

  console.log("\n=== Dice + Damage + Status Rendering Test ===\n");

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
    console.log("\nRendered with dice + damage + status tags:");
    console.log(renderDiceText(entry.description));
    console.log("\n---\n");
  }
}

main();
