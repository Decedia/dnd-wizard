/**
 * Game terms that Indonesian text must keep in English (user rule,
 * 2026-11-13): players at the table say "damage", "saving throw",
 * "Advantage", "Bonus Action", "Charmed", "STR"... A translated term is
 * harder to match with the book and the dice. Each rule finds one such
 * translation in `id` text. src/tests/id-terms.test.ts counts them per file.
 */
export interface TermRule {
  /** The English term that should be used instead. */
  term: string;
  /** The translation to find (whole words, any case). */
  pattern: RegExp;
}

const w = (words: string) => new RegExp(`(?<![\\p{L}])(?:${words})(?![\\p{L}])`, "giu");

export const ID_TERM_RULES: TermRule[] = [
  { term: "damage", pattern: w("kerusakan|kerugian damage") },
  { term: "damage type (fire, cold, ...)", pattern: w("damage (?:api|dingin|petir|racun|tebasan|tusukan|tumpul|hantaman|asam|guntur|psikis|nekrotik|cahaya|kekuatan|gaya)") },
  { term: "Advantage", pattern: w("keuntungan") },
  { term: "Disadvantage", pattern: w("kerugian") },
  { term: "saving throw", pattern: w("lemparan penyelamatan|lemparan selamat|penyelamatan|roll penyelamatan") },
  { term: "ability check", pattern: w("pemeriksaan kemampuan|cek kemampuan") },
  { term: "Action / Bonus Action", pattern: w("aksi bonus|aksi") },
  { term: "Reaction", pattern: w("reaksi") },
  { term: "spell / spell slot", pattern: w("mantra|slot mantra") },
  { term: "Proficiency", pattern: w("kemahiran|mahir") },
  { term: "Expertise", pattern: w("keahlian") },
  { term: "AC", pattern: w("kelas armor|kelas zirah|kelas baju zirah") },
  { term: "HP / Hit Dice", pattern: w("poin hidup|titik hidup|poin nyawa|dadu hidup|dadu hit") },
  { term: "ability names (STR, DEX...)", pattern: w("ketangkasan|kelincahan|konstitusi|kecerdasan|kebijaksanaan|karisma") },
  { term: "Concentration", pattern: w("konsentrasi") },
  { term: "Short / Long Rest", pattern: w("istirahat pendek|istirahat panjang") },
  { term: "Opportunity Attack", pattern: w("serangan peluang|serangan kesempatan") },
  { term: "critical hit", pattern: w("serangan kritis|pukulan kritis|kritis") },
  {
    term: "conditions (Charmed, Prone...)",
    pattern: w("terpikat|ketakutan|lumpuh|tak sadarkan diri|tidak sadarkan diri|telungkup|tergeletak|tertahan|terbutakan|tuli|tak terlihat|tidak terlihat|membatu|keracunan|tercengkeram|tercengkram|kelelahan|tak berdaya|tidak berdaya|tertegun|terpana"),
  },
];

/** How many times each rule matches in a text. */
export function countTerms(text: string): number[] {
  return ID_TERM_RULES.map((r) => (text.match(r.pattern) || []).length);
}
