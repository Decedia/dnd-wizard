const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const FILES = [
  path.join(ROOT, "src", "data", "2014_spells.json"),
  path.join(ROOT, "src", "data", "2014_wizard_spells.json"),
  path.join(ROOT, "src", "data", "2014_arcane_trickster_spells.json"),
];

const ABILITIES = ["Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma"];
const CONDITIONS = ["blinded", "charmed", "deafened", "frightened", "grappled", "incapacitated", "invisible", "paralyzed", "petrified", "poisoned", "prone", "restrained", "stunned", "unconscious"];
const DAMAGE_TYPES = ["acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic", "piercing", "poison", "psychic", "radiant", "slashing", "thunder"];
const VAGUE_WORDS = new Set(["utility", "damage", "support", "heal", "healing", "buff", "control", "effect"]);

function cleanText(value) {
  let text = Array.isArray(value) ? value.join(" ") : String(value || "");
  text = text.replace(/\*\*/g, "").replace(/__/g, "");
  text = text.replace(/\n\s*[-*]\s*/g, " ");
  text = text.replace(/\n+/g, " ");
  text = text.replace(/\s+/g, " ").trim();
  return text.replace(/\s+([,.;:])/g, "$1");
}

function splitSentences(value) {
  const text = cleanText(value);
  if (!text) return [];
  const matches = text.match(/[^.!?]+[.!?]*/g) || [];
  return matches
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 1)
    .filter((sentence) => !/^(Animated Object Statistics|Familiarity|On Target|Off Target|Similar Area|Mishap|Death|Discord|Fear|Hopelessness|Insanity|Pain|Sleep|Stunning|Explosive Runes|Spell Glyph|Create Water|Destroy Water|Flood|Part Water|Redirect Flow|Whirlpool|Creature into Creature|Object into Creature|Creature into Object|Ending the Spell)\.?$/i.test(sentence));
}

function sentenceScore(sentence) {
  const text = sentence.toLowerCase();
  let score = 0;
  if (/\d+d\d+|\d+\s+feet|\d+\s+foot|\d+\s+minutes|\d+\s+hours|\d+\s+rounds|\d+\s+seconds|\d+\s+days|\d+\s+percent/i.test(sentence)) score += 4;
  if (/damage|hit points|\bhp\b|saving throw|attack roll|ability check|ac\b|speed|condition|resistance|immunity|advantage|disadvantage/i.test(sentence)) score += 3;
  if (/create|deal|restore|regain|gain|make|force|teleport|transform|turn|move|push|pull|blind|frighten|paraly|stun|sleep|invisible|fly|summon|heal|protect|reveal|see|hear/i.test(text)) score += 2;
  if (/when you cast|as part of the action|you can|this spell|the spell|until the spell ends/i.test(text)) score -= 1;
  if (/following|described below|described above|details|statistics|table|dm determines|choice of the following/i.test(text)) score -= 3;
  if (sentence.length < 20) score -= 2;
  return score;
}

function bestSentence(sentences, extraPattern) {
  const ranked = sentences
    .map((sentence) => ({ sentence, score: sentenceScore(sentence) + (extraPattern && extraPattern.test(sentence) ? 5 : 0) }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.sentence || sentences[0] || "";
}

function normalizeRange(range) {
  const value = cleanText(range).replace(/feet/gi, "ft").replace(/\s+/g, " ");
  return value || "range";
}

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match;
  }
  return null;
}

function makeSummary(spell) {
  const text = cleanText(spell.description || spell.effect || "");
  const lower = text.toLowerCase();
  const range = normalizeRange(spell.range);
  const damage = firstMatch(text, [
    /(\d+d\d+(?:\s*[+-]\s*\d+)?(?:\s*plus\s+[^\s,.;]+(?:\s+modifier)?)?)\s+(acid|cold|fire|lightning|necrotic|poison|psychic|radiant|thunder|force|bludgeoning|piercing|slashing)\s+damage/i,
    /(\d+d\d+(?:\s*[+-]\s*\d+)?)\s+(acid|cold|fire|lightning|necrotic|poison|psychic|radiant|thunder|force|bludgeoning|piercing|slashing)/i,
  ]);
  if (damage) {
    return `Deal ${damage[1].replace(/\s+/g, "")} ${damage[2].toLowerCase()} damage to a target within ${range}`;
  }

  const healing = firstMatch(text, [
    /regains?\s+(?:a number of hit points equal to\s+)?(\d+d\d+(?:\s*[+-]\s*\d+)?(?:\s*plus\s+[^\s,.;]+)?)\s+hit points/i,
    /heals?\s+(\d+d\d+(?:\s*[+-]\s*\d+)?)/i,
    /restore[s]?\s+(\d+d\d+(?:\s*[+-]\s*\d+)?)/i,
  ]);
  if (healing) {
    return `Restore ${healing[1].replace(/\s+/g, "")} HP to a creature you touch`;
  }

  const condition = CONDITIONS.find((condition) => new RegExp(`\\b${condition}\\b`, "i").test(text));
  if (condition) {
    if (condition === "invisible") return `Make a creature invisible until it attacks or the spell ends`;
    if (condition === "unconscious") return `Knock low-HP creatures unconscious until damaged or awakened`;
    return `Make a target ${condition} until it saves or the spell ends`;
  }

  if (/temporary hit points|\btemp hp\b/i.test(text)) {
    const amount = firstMatch(text, [/(\d+d\d+(?:\s*[+-]\s*\d+)?)\s+temporary hit points/i, /(\d+\s*\/\s*turn)\s+temporary hit points/i]);
    return `Gain ${amount ? amount[1].replace(/\s+/g, "") : "temporary"} hit points for the duration`;
  }
  if (/flying speed|fly\s+through the air/i.test(lower)) {
    const speed = firstMatch(text, [/flying speed of\s+(\d+\s+feet)/i]);
    return `Give a creature a ${speed ? speed[1].replace("feet", "ft") : "flying"} speed for the duration`;
  }
  if (/teleport/i.test(lower)) {
    return `Teleport up to ${range} to a space you can see`;
  }
  if (/resistance to/i.test(lower)) {
    const types = DAMAGE_TYPES.filter((type) => lower.includes(type));
    return `Gain resistance to ${types.length ? types.join(", ") : "one damage type"} for the duration`;
  }
  if (/immunity to/i.test(lower)) {
    return `Grant immunity to one damage type for the duration`;
  }
  if (/advantage on.{0,80}(ability checks|saving throws|attack rolls)/i.test(text)) {
    const match = text.match(/advantage on.{0,80}(ability checks|saving throws|attack rolls)/i);
    return `Give a creature advantage on ${match?.[1]?.toLowerCase() || "rolls"} for the duration`;
  }
  if (/disadvantage on.{0,80}(ability checks|saving throws|attack rolls)/i.test(text)) {
    const match = text.match(/disadvantage on.{0,80}(ability checks|saving throws|attack rolls)/i);
    return `Give a creature disadvantage on ${match?.[1]?.toLowerCase() || "rolls"} for the duration`;
  }
  if (/see and hear|see or hear/i.test(lower)) return `See and hear a distant creature on the same plane`;
  if (/create.{0,80}water|destroy.{0,80}water/i.test(lower)) return `Create or destroy up to 10 gallons of water`;
  if (/bright light|glow|sheds light/i.test(lower)) return `Make an object shed bright light for the duration`;
  if (/repair|mending/i.test(lower)) return `Repair one break or tear up to 1 foot wide`;
  if (/difficult terrain/i.test(lower)) return `Turn an area into difficult terrain for the duration`;
  if (/summon|conjure/i.test(lower)) return `Summon a creature to fight for you for the duration`;
  if (/transform|polymorph|shapechange/i.test(lower)) return `Transform a creature or object into a new form`;
  if (/wall|sphere|cube|cone|line/i.test(lower) && /create/i.test(lower)) return `Create a magical area that affects creatures inside it`;
  if (/message|communicate|telepath/i.test(lower)) return `Send a private message to a creature within range`;
  if (/detect|sense|identify|learn/i.test(lower)) return `Reveal magical or hidden information within range`;
  if (/push|pull|move/i.test(lower)) return `Move a creature or object a short distance`;
  if (/sleep/i.test(lower)) return `Put low-HP creatures to sleep until damaged or awakened`;
  if (/invisible/i.test(lower)) return `Make a creature invisible until the spell ends`;
  if (/create|produce|manifest/i.test(lower)) return `Create a magical effect at a point you choose`;

  const sentences = splitSentences(spell.description || spell.effect || "");
  let summary = bestSentence(sentences, /damage|hit points|saving throw|create|gain|make|force|teleport|transform|invisible|sleep|fly|resist/i);
  summary = summary
    .replace(/^(When|As|For|While|If|Although)\b[^,]*,?\s*/i, "")
    .replace(/^This spell\s*/i, "")
    .replace(/^You\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!summary) summary = "Change a target with a magical effect";
  let words = summary.split(/\s+/);
  if (words.length > 12) {
    words = words.slice(0, 12);
    while (words.length && !/[A-Za-z0-9)]$/.test(words[words.length - 1])) words.pop();
    summary = words.join(" ");
  }
  const firstWord = (summary.match(/^[A-Za-z]+/) || [""])[0].toLowerCase();
  const concreteVerbs = ["affect", "change", "create", "deal", "gain", "give", "make", "move", "protect", "restore", "reveal", "send", "set", "slow", "stop", "teleport", "transform", "turn", "use"];
  if (!concreteVerbs.includes(firstWord) && !/damage|hit points|saving throw/i.test(summary)) {
    summary = `Change a target: ${summary.charAt(0).toLowerCase() + summary.slice(1)}`;
  }
  words = summary.split(/\s+/);
  if (words.length > 12) summary = words.slice(0, 12).join(" ");
  if (VAGUE_WORDS.has(summary.toLowerCase().replace(/[^a-z]/g, ""))) summary = `Change a target with magic`;
  return summary.replace(/[.!?]+$/, "");
}

function explainSavingThrows(sentence) {
  let result = sentence;
  for (const ability of ABILITIES) {
    const short = ability.slice(0, 3).toUpperCase();
    result = result.replace(new RegExp(`a\\s+${ability.toLowerCase()}\\s+saving throw`, "gi"), `a ${ability} saving throw; roll a d20, add the ${short} modifier, and compare it with your spell save DC`);
  }
  return result.replace(/\bDC\b/g, "spell save DC").replace(/\bHP\b/g, "hit points");
}

function singleSentence(text) {
  let result = cleanText(text).replace(/\.$/, "");
  result = result.replace(/([.!?])\s+(?=[A-Z])/g, "; ");
  return result.trim();
}

function makeFullDescription(spell) {
  const sentences = splitSentences(spell.description || spell.effect || "");
  const castingTime = cleanText(spell.castingTime || spell.casting_time || "the required action");
  const duration = cleanText(spell.duration || "the stated duration");
  const opening = sentences.find((sentence) => /cast|choose|touch|create|speak|brandish|extend|point|inscribe|sing|whisper|pray|invoke|trace|reach|turn|look|name|perform|chant|gesture|concentrate/i.test(sentence)) || sentences[0] || "Cast the spell.";
  const keySentences = sentences
    .filter((sentence) => sentence !== opening)
    .filter((sentence) => !/when you cast|as part of the action/i.test(sentence))
    .sort((a, b) => sentenceScore(b) - sentenceScore(a))
    .slice(0, 2);
  let effectText = keySentences.map(singleSentence).join("; ");
  if (!effectText) effectText = singleSentence(opening);
  const higherLevel = cleanText(spell.higherLevel || spell.higher_level);
  if (higherLevel && !effectText.toLowerCase().includes("higher level")) {
    effectText = `${effectText}; ${singleSentence(higherLevel)}`;
  }

  const limit = sentences.find((sentence) => /until|ends|end if|lasts|dismiss|concentration|takes damage|wake|awaken|destroyed|dispelled|concentrate/i.test(sentence));
  let limitText = limit ? singleSentence(limit) : "";
  if (!limitText) {
    limitText = duration.toLowerCase().includes("instantaneous")
      ? "The effect happens immediately and then ends"
      : `The effect lasts for ${duration.toLowerCase()}`;
  }
  if (spell.concentration && !/concentrat/i.test(limitText)) {
    limitText = `${limitText}; you must concentrate, and the effect ends if your concentration ends`;
  }
  if (spell.ritual) limitText = `${limitText}; you can cast it as a ritual`;

  const castSentence = `Using ${castingTime.toLowerCase()}, ${singleSentence(opening).replace(/^\w/, (character) => character.toLowerCase())}`;
  const effectSentence = explainSavingThrows(effectText);
  const finalSentence = explainSavingThrows(limitText);
  const parts = [castSentence, effectSentence, finalSentence].map((part) => part.replace(/[.!?]+$/, ""));
  return `${parts[0]}. ${parts[1]}. ${parts[2]}.`;
}

function validateSummary(summary, name) {
  const words = summary.trim().split(/\s+/).filter(Boolean);
  if (words.length > 12) throw new Error(`${name}: effectSummary has ${words.length} words`);
  if (VAGUE_WORDS.has(summary.trim().toLowerCase())) throw new Error(`${name}: vague effectSummary`);
  if (!/[A-Za-z]/.test(summary)) throw new Error(`${name}: empty effectSummary`);
}

function rewriteFile(filePath) {
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const spells = parsed.spells || parsed;
  let changed = 0;
  for (const spell of spells) {
    if (!spell.name || !spell.description) continue;
    const effectSummary = makeSummary(spell);
    const fullDescription = makeFullDescription(spell);
    validateSummary(effectSummary, spell.name);
    const sentenceCount = (fullDescription.match(/[.!?](?:\s|$)/g) || []).length;
    if (sentenceCount < 2 || sentenceCount > 3) throw new Error(`${spell.name}: fullDescription has ${sentenceCount} sentences`);
    spell.effectSummary = effectSummary;
    spell.fullDescription = fullDescription;
    changed++;
  }
  fs.writeFileSync(filePath, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  console.log(`${path.basename(filePath)}: rewrote ${changed} spells`);
}

for (const file of FILES) rewriteFile(file);
