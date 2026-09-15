const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const CLASSES_FILE = path.join(ROOT, "src", "data", "2014_classes.json");
const RACES_FILE = path.join(ROOT, "src", "data", "2014_races.json");
const SUBCLASSES_FILE = path.join(ROOT, "src", "data", "2014_subclasses.json");

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
    .filter((sentence) => sentence.length > 1);
}

function sentenceScore(sentence) {
  const text = sentence.toLowerCase();
  let score = 0;
  if (/\d+d\d+|\d+\s+feet|\d+\s+foot|\d+\s+minutes|\d+\s+hours|\d+\s+rounds|\d+\s+seconds|\d+\s+days|\d+\s+percent/i.test(sentence)) score += 4;
  if (/damage|hit points|\bhp\b|saving throw|attack roll|ability check|ac\b|speed|condition|resistance|immunity|advantage|disadvantage/i.test(text)) score += 3;
  if (/create|deal|restore|regain|gain|make|force|teleport|transform|turn|move|push|pull|blind|frighten|paraly|stun|sleep|invisible|fly|summon|heal|protect|reveal|see|hear/i.test(text)) score += 2;
  if (/when you cast|as part of the action|you can|this spell|the spell|until the spell ends/i.test(text)) score -= 1;
  if (/following|described below|described above|details|statistics|table|dm determines|choice of the following/i.test(text)) score -= 3;
  if (sentence.length < 20) score -= 2;
  return score;
}

function bestSentence(sentences) {
  const ranked = sentences
    .map((sentence) => ({ sentence, score: sentenceScore(sentence) }))
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.sentence || sentences[0] || "";
}

function capWords(text, maxWords) {
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  const capped = words.slice(0, maxWords);
  while (capped.length && !/[A-Za-z0-9)]$/.test(capped[capped.length - 1])) capped.pop();
  return capped.join(" ");
}

function makeFeatureSummary(feature) {
  const description = cleanText(feature.description || "");
  if (!description) return "";

  const mechanismParts = [];
  if (feature.actionType && feature.actionType !== "passive") mechanismParts.push(feature.actionType.toLowerCase());
  if (feature.uses) {
    const total = typeof feature.uses.total === "number" ? feature.uses.total : feature.uses.total;
    const recharge = feature.uses.recharge;
    mechanismParts.push(`${total}/${recharge}`);
  }
  if (feature.requirement) mechanismParts.push(feature.requirement.toLowerCase());
  if (feature.duration && feature.duration !== "Instantaneous") mechanismParts.push(feature.duration.toLowerCase());
  if (feature.featureType === "Active" && !feature.actionType) mechanismParts.push("action");
  if (feature.onUse) mechanismParts.push(feature.onUse.toLowerCase());
  if (feature.scaling) mechanismParts.push("scales");

  const mechanismStr = mechanismParts.length > 0 ? ` (${mechanismParts.join(", ")})` : "";

  const sentences = splitSentences(description);
  let summary = bestSentence(sentences);
  summary = summary
    .replace(/^(When|As|For|While|If|Although)\b[^,]*,?\s*/i, "")
    .replace(/^This feature\s*/i, "")
    .replace(/^You\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (summary) summary = summary.charAt(0).toUpperCase() + summary.slice(1);

  if (!summary) summary = "Provides a special ability or trait";
  summary = capWords(summary, 30);
  summary = summary + mechanismStr;
  summary = capWords(summary, 30);
  return summary.replace(/[.!?]+$/, "");
}

function updateFeatureSummaries(filePath, accessor) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let updated = 0;

  const items = accessor(data);
  for (const item of items) {
    const features = item.features || item.traits || [];
    for (const f of features) {
      const summary = makeFeatureSummary(f);
      if (summary && summary !== f.summary) {
        f.summary = summary;
        updated++;
      }
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`${path.basename(filePath)}: updated ${updated} summaries`);
}

function main() {
  console.log("=== Regenerating Feature/Trait/Subclass Summaries (30-word cap) ===\n");

  updateFeatureSummaries(CLASSES_FILE, (data) => data.classes);
  updateFeatureSummaries(RACES_FILE, (data) => data.races);
  updateFeatureSummaries(SUBCLASSES_FILE, (data) => data.subclasses);

  console.log("\nDone.");
}

main();
