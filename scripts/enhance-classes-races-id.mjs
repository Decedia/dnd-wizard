import path from "path";
import { requireApiKey } from "./lib/nim.mjs";
import { buildUnits, applyToLocaleParts, PATHS } from "./lib/srd-text.mjs";
import { runEnhancement, parseArgs } from "./lib/enhance-runner.mjs";
import { tidy, structuralProblems } from "./lib/text-tidy.mjs";

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
  "  Keep every paragraph and every idea; improve the wording, do not cut it down.",
  "",
  "KAMU MENULIS ULANG, BUKAN MENERJEMAHKAN HARFIK. INI ATURAN PALING PENTING.",
  "* Hasilmu harus panjangnya mendekati input. Hasil yang jauh lebih pendek berarti ada isi yang hilang dan akan ditolak.",
  "* Setiap angka, ekspresi dadu, jarak, durasi, dan jumlah di teks asli WAJIB ada di hasilmu.",
  "  Jangan pernah diganti rujukan tabel. Tulis '**2d6** kerusakan', jangan 'sesuai tabel Barbarian'.",
  "* Kalau teks asli berupa daftar berpoin, hasilmu juga harus berpoin. Jangan ubah daftar menjadi paragraf.",
  "* Pertahankan setiap bagian scaling per level sebagai blok tersendiri, dengan urutan yang sama.",
  "* Pertahankan setiap pemisah paragraf. Jangan gabungkan beberapa paragraf menjadi satu.",
  "* Keep every number, dice expression and distance exactly as written. Dice stay plain: 1d6 or **1d6**.",
  "* Use standard dashes (-) for lists, never asterisks (*).",
  "* Never translate or alter a proper name: class names, subclass names, feature names and spell names stay in English.",
  "",
  "FORMAT OUTPUT:",
  "* Selalu kembalikan semua field yang ada di input, bahkan jika kamu hanya menyunting sedikit. Jangan pernah menghilangkan field.",
  "* Output STRICT raw JSON, no markdown fences, no commentary.",
  "* Hasilnya harus berupa objek JSON datar yang memetakan setiap id input ke objek yang hanya berisi teks hasil tulis ulang.",
  "* JANGAN mengulang 'name', 'group', 'fields', 'context', atau 'source' di jawabanmu.",
  '* Contoh bentuk yang diharapkan:',
  '  { "2014_races.bugbear.sneaky": { "summary": "...", "description": "..." } }',
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

// Fields are judged independently: a model that translates a description well but
// returns nothing for flavorText should still get its description saved, and the
// original flavorText stays. Only a unit where every field failed is discarded.
function validate(result, unit) {
  const enhanced = result?.[unit.id];
  if (!enhanced || typeof enhanced !== "object") return { ok: false, reason: "no entry in response" };

  const values = {};
  const reasons = [];
  for (const field of unit.fields) {
    const raw = typeof enhanced[field] === "string" ? enhanced[field].trim() : "";
    if (!raw) {
      reasons.push(`${field}: not returned`);
      continue;
    }
    // The model is told to keep the [[...]] brackets, so they are expected here.
    // What matters is that every protected term survived; restoreTerms strips the
    // brackets once the count checks out.
    const expected = countTokens(protectTerms(unit.text[field]));
    const got = countTokens(raw);
    if (got < expected) {
      reasons.push(`${field}: lost protected terms (${got}/${expected})`);
      continue;
    }

    const value = tidy(restoreTerms(raw));
    // Defensive: nothing may reach the shipped data still wrapped in brackets.
    if (/\[\[|\]\]/.test(value)) {
      reasons.push(`${field}: unbalanced marker after restore`);
      continue;
    }
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
    // Untranslated output would be worse than what is already there.
    if (unit.text[field] && value === unit.text[field].trim()) {
      reasons.push(`${field}: byte-identical to the English source`);
      continue;
    }
    values[field] = value;
  }

  if (Object.keys(values).length) return { ok: true, values, reasons };
  return { ok: false, reason: reasons.join("; ") || "nothing usable" };
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
    const files = applyToLocaleParts("id", enhancements);
    return `wrote ${files.length} locale file(s)`;
  },
});

console.log("\nNext: fold the parts into the shipped data with");
console.log("  node scripts/merge-parts-to-srd-strings.mjs");
console.log("  node scripts/build-srd-locale.mjs id");
