import path from "path";
import { requireApiKey } from "./lib/nim.mjs";
import { buildUnits, applyToLocaleParts, PATHS } from "./lib/srd-text.mjs";
import { runEnhancement, parseArgs } from "./lib/enhance-runner.mjs";

const options = parseArgs();
if (!options.dryRun && !options.showPrompt) requireApiKey();

// Terms an Indonesian player says in English. They are wrapped in visible [[...]]
// markers before the request and unwrapped afterwards: the model can still read
// and reuse the word inside natural Indonesian grammar, and validateResult can
// prove afterwards that none of them were dropped or translated.
const PROTECTED_TERMS = [
  // Saves and checks
  "saving throw", "spell save DC", "DC", "attack roll", "ability check",
  // Action economy
  "Action", "Bonus Action", "Reaction", "Free Action", "opportunity attack",
  "Advantage", "Disadvantage",
  // Resources
  "Hit Point", "Hit Dice", "Long Rest", "Short Rest", "Spell Slot",
  "Proficiency", "expertise", "level up", "Channel Divinity", "Wild Shape",
  "Divine Smite", "Eldritch Invocation", "Favored Enemy", "Rage",
  // Dice and rolls
  "roll", "d20", "critical hit", "natural 20",
  // Positions and senses
  "Darkvision", "blindsight", "truesight",
];

// The optional "s" matters: official text says "saving throws" and "rolls" far
// more often than the singular, and a bare \b would silently miss those.
const PROTECTED_REGEX = new RegExp(
  `\\b(${PROTECTED_TERMS.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})s?\\b`,
  "gi",
);
const TOKEN_PATTERN = /\[\[([^\]]+)\]\]/g;

function protectTerms(text) {
  return String(text).replace(PROTECTED_REGEX, (match) => `[[${match}]]`);
}

function restoreTerms(text) {
  return String(text).replace(TOKEN_PATTERN, "$1");
}

const countTokens = (text) => (String(text).match(/\[\[[^\]]+\]\]/g) || []).length;

const SYSTEM_PROMPT = [
  "You are an Indonesian D&D 5e player and technical writer. You rewrite official English class, subclass, class feature and racial trait text into Bahasa Indonesia so an Indonesian player reads it and immediately understands how it works.",
  "",
  "GOAL: NATURAL INDONESIAN, NOT A WORD-FOR-WORD TRANSLATION.",
  "* Indonesian players already know the D&D rules and vocabulary. Write the way a good Indonesian tabletop guide would: fluent, natural, immediately understandable.",
  "* Do NOT translate literally. Reshape English word order, idioms and filler into natural Indonesian.",
  "* Fix anything that reads awkwardly in English so it reads naturally in Indonesian.",
  "* Use 'sebuah' or 'satu' for count nouns, as Indonesian normally does.",
  "* Use natural connectives: 'dan', 'atau', 'tetapi', 'jika', 'ketika', 'setelah', 'sebelum', 'karena'.",
  "* Address the reader as 'kamu' consistently throughout.",
  "",
  "TERMS THAT STAY IN ENGLISH:",
  "* Words wrapped in double square brackets, such as [[Action]] or [[saving throw]], are D&D terms Indonesian players use in English.",
  "  Keep the word itself in English and keep the [[ ]] brackets.",
  "* Write natural Indonesian grammar AROUND them: 'seorang [[target]]', 'menggunakan [[Bonus Action]]', 'harus berhasil melakukan [[saving throw]]'.",
  "* Never translate a bracketed word, never merge the brackets into other text, never drop one.",
  "",
  "TERMS TO TRANSLATE:",
  "* creature -> makhluk, range -> jangkauan, duration -> durasi, feet -> kaki, turn -> giliran, round -> ronde,",
  "  damage -> kerusakan, spell -> sihir, target (when not bracketed) -> sasaran, feature -> fitur, trait -> sifat.",
  "* Damage types: acid -> asam, fire -> api, cold -> dingin, lightning -> petir, thunder -> guntur,",
  "  necrotic -> nekrotik, radiant -> radiasi, force -> kekuatan, psychic -> psikis, bludgeoning -> blunt,",
  "  piercing -> tembus, slashing -> potong, poison -> racun.",
  "* Abilities: Strength -> Kekuatan, Dexterity -> Destrezza, Constitution -> Konstitusi,",
  "  Intelligence -> Kecerdasan, Wisdom -> Kearifan, Charisma -> Karisma.",
  "* Conditions: Blinded -> Buta, Deafened -> Tuli, Charmed -> Terpesona, Frightened -> Takut, Grappled -> Terpegang,",
  "  Incapacitated -> Tidak Mampu Bertindak, Invisible -> Tidak Terlihat, Paralyzed -> Lumpuh, Petrified -> Membatu,",
  "  Poisoned -> Keracunan, Prone -> Terbaring, Restrained -> Terikat, Stunned -> Pusing, Unconscious -> Tidak Sadar.",
  "",
  "FIELD RULES:",
  "* 'summary' is the short card text shown in the character sheet list. One or two sentences, at most 40 kata.",
  "  It must name the concrete effect, not repeat the feature name, and must not start with the feature name.",
  "* 'description' is the full teks aturan. Keep every rule, number, example and paragraph break. Never summarise away mechanics.",
  "* 'flavorText' (class dan subclass saja) is cerita karakter yang evocatif: no mechanical numbers, no rules.",
  "* Keep every numeric value exactly as written. Dice stay plain: 1d6 or **1d6**.",
  "* Use standard dashes (-) for lists, never asterisks (*).",
  "* Keep the higher-level/scaling section as a list, e.g. '- Tingkat 5: **2d6**'.",
  "* Never translate or alter a proper name: class names, subclass names, feature names and spell names stay in English.",
  "",
  "OUTPUT:",
  "* Output STRICT raw JSON. No markdown fences, no commentary.",
  "* Map each input id to an object with exactly the same field names it was given.",
].join("\n");

function buildUserPrompt(batch) {
  const marked = batch.map((entry) => ({
    ...entry,
    source: Object.fromEntries(Object.entries(entry.source).map(([field, value]) => [field, protectTerms(value)])),
  }));
  return (
    "Tulis ulang setiap entri di bawah dalam Bahasa Indonesia yang natural dan enak dibaca pemain Indonesia. " +
    "Ini bukan terjemahan harfiah: sesuaikan struktur kalimatnya agar mengalir dan masuk akal. " +
    "Kembalikan HANYA objek JSON yang memetakan setiap id ke objek dengan nama field yang sama seperti inputnya. " +
    "Pertahankan setiap istilah berformat [[...]] apa adanya, dan jangan mengubah nama yang harus tetap dalam bahasa Inggris. " +
    "Tanpa penjelasan.\n\n" +
    JSON.stringify(marked, null, 1)
  );
}

function validate(result, unit) {
  const enhanced = result?.[unit.id];
  if (!enhanced || typeof enhanced !== "object") return { ok: false, reason: "no entry in response" };

  const values = {};
  for (const field of unit.fields) {
    const raw = typeof enhanced[field] === "string" ? enhanced[field].trim() : "";
    if (!raw) return { ok: false, reason: `empty ${field}` };
    if (/\[\[|\]\]/.test(raw)) return { ok: false, reason: `${field} contains leftover [[ ]] markers` };

    const expected = countTokens(protectTerms(unit.text[field]));
    const got = countTokens(raw);
    if (got < expected) return { ok: false, reason: `${field} lost protected terms (${got}/${expected})` };

    const value = restoreTerms(raw);
    const sourceLength = unit.text[field].length;
    if (value.length < sourceLength * 0.45) return { ok: false, reason: `${field} collapsed to ${value.length}/${sourceLength} chars` };
    if (value.length > sourceLength * 2.5) return { ok: false, reason: `${field} ballooned to ${value.length}/${sourceLength} chars` };
    values[field] = value;
  }

  if (/(^|\n)\s*\*/.test(values.description || "")) return { ok: false, reason: "description uses asterisk list markers" };
  if (/(^|\n)\s*\d+\.\s/.test(values.description || "")) return { ok: false, reason: "description uses numbered list markers" };
  // Untranslated output would be worse than what is already there.
  if (unit.text.description && values.description === unit.text.description.trim()) {
    return { ok: false, reason: "description is byte-identical to the English source" };
  }
  return { ok: true, values };
}

const { units, counts } = buildUnits();

console.log("Unit breakdown:", counts);

await runEnhancement({
  label: "classes/races (id)",
  units,
  progressFile: path.join(PATHS.partsDir, "id", ".enhance-classes-races-progress.json"),
  systemPrompt: SYSTEM_PROMPT,
  buildUserPrompt,
  validate,
  options,
  apply: (enhancements) => {
    const files = applyToLocaleParts("id", units, enhancements);
    return `wrote ${files.length} locale file(s)`;
  },
});

console.log("\nNext: fold the parts into the shipped data with");
console.log("  node scripts/merge-parts-to-srd-strings.mjs");
console.log("  node scripts/build-srd-locale.mjs id");
