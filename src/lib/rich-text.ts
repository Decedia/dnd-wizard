// Splits rules text into blocks and inline tokens so the UI can show dice,
// damage types, saving throws and conditions as badges. Works on the English
// and Indonesian data text; names in the Indonesian text are often left in
// English, so both vocabularies are matched at once.

export type InlineToken =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "term"; value: string }
  | { type: "dice"; value: string }
  | { type: "damage"; value: string; damage: string }
  | { type: "save"; value: string; ability: string }
  | { type: "condition"; value: string; condition: string };

export type Block =
  | { type: "paragraph"; lead?: string; tokens: InlineToken[] }
  | { type: "list"; ordered: boolean; items: { lead?: string; tokens: InlineToken[] }[] };

const DAMAGE_WORDS: Record<string, string> = {
  acid: "acid", bludgeoning: "bludgeoning", cold: "cold", fire: "fire", force: "force", lightning: "lightning",
  necrotic: "necrotic", piercing: "piercing", poison: "poison", psychic: "psychic", radiant: "radiant",
  slashing: "slashing", thunder: "thunder",
  // Indonesian data text
  asam: "acid", tumpul: "bludgeoning", blunt: "bludgeoning", dingin: "cold", api: "fire", kekuatan: "force",
  petir: "lightning", listrik: "lightning", nekrotik: "necrotic", tembus: "piercing", tusuk: "piercing",
  racun: "poison", psikis: "psychic", radiasi: "radiant", potong: "slashing", tebas: "slashing", guntur: "thunder",
};
const EN_DAMAGE = "acid|bludgeoning|cold|fire|force|lightning|necrotic|piercing|poison|psychic|radiant|slashing|thunder";
const ANY_DAMAGE = Object.keys(DAMAGE_WORDS).join("|");

const ABILITY_WORDS: Record<string, string> = {
  strength: "str", dexterity: "dex", constitution: "con", intelligence: "int", wisdom: "wis", charisma: "cha",
  kekuatan: "str", kelincahan: "dex", ketangkasan: "dex", destrezza: "dex", konstitusi: "con", kecerdasan: "int",
  kearifan: "wis", kebijaksanaan: "wis", karisma: "cha",
};
const EN_ABILITY = "Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma";
const ANY_ABILITY = Object.keys(ABILITY_WORDS).join("|");

const CONDITION_WORDS: Record<string, string> = {
  blinded: "blinded", charmed: "charmed", deafened: "deafened", frightened: "frightened", grappled: "grappled",
  incapacitated: "incapacitated", invisible: "invisible", paralyzed: "paralyzed", petrified: "petrified",
  poisoned: "poisoned", prone: "prone", restrained: "restrained", stunned: "stunned", unconscious: "unconscious",
  terpesona: "charmed", ketakutan: "frightened", lumpuh: "paralyzed", membatu: "petrified", keracunan: "poisoned",
  "tak terlihat": "invisible", pingsan: "unconscious",
};

// Shown in bold, not as badges: distances, durations, DCs, action timing, rests.
const TERMS = [
  "\\d+(?:,\\d{3})?(?:-foot| feet| foot| kaki| miles?| mil)",
  "\\d+ (?:minutes?|hours?|rounds?|days?|menit|jam|ronde|hari)",
  "DC \\d+",
  "\\d+ (?:actions?|aksi)|bonus actions?|reactions?|aksi bonus|reaksi",
  "short or long rest|short rest|long rest|istirahat pendek atau panjang|istirahat pendek|istirahat panjang",
  "advantage|disadvantage",
  "\\d+ (?:sorcery|ki|superiority|hit|temporary hit) (?:points?|dice|die)",
  "temporary hit points",
].join("|");

const DICE = "(?:\\d+d\\d+|d\\d+)s?(?:\\s?[+\\-−]\\s?\\d+(?![d\\d]))?";

const TOKEN_RE = new RegExp(
  [
    `\\*\\*([^*\\n]+)\\*\\*`, // 1 bold
    `(?<![\\w*])(${DICE})(?![\\w])`, // 2 dice
    `\\b((?:${EN_DAMAGE})(?:(?:,| or| and|, or|, and) (?:${EN_DAMAGE}))* damage)\\b`, // 3 "fire or cold damage"
    `\\b((?:kerusakan|damage) (?:${ANY_DAMAGE}))\\b`, // 4 "kerusakan api"
    `\\b((?:${EN_ABILITY}) saving throws?)\\b`, // 5
    `\\b(saving throws? (?:${ANY_ABILITY}))\\b`, // 6 "saving throw Konstitusi"
    `\\b(${Object.keys(CONDITION_WORDS).join("|")})\\b`, // 7
    `\\b(${TERMS})\\b`, // 8 numbers and timing words worth a second look
  ].join("|"),
  "gi",
);
const DICE_ONLY_RE = new RegExp(`^${DICE}$`, "i");
const EN_DAMAGE_WORD_RE = new RegExp(`\\b(${EN_DAMAGE})\\b`, "gi");

function pushText(out: InlineToken[], value: string) {
  if (!value) return;
  const last = out[out.length - 1];
  if (last?.type === "text") last.value += value;
  else out.push({ type: "text", value });
}

/** "fire or cold damage" becomes one badge per type; the last one keeps the word "damage". */
function pushDamageList(out: InlineToken[], value: string) {
  const words = [...value.matchAll(EN_DAMAGE_WORD_RE)];
  words.forEach((m, i) => {
    const start = m.index ?? 0;
    const prevEnd = i === 0 ? 0 : (words[i - 1].index ?? 0) + words[i - 1][0].length;
    pushText(out, value.slice(prevEnd, start));
    const isLast = i === words.length - 1;
    out.push({ type: "damage", value: isLast ? value.slice(start) : m[0], damage: m[0].toLowerCase() });
  });
}

export function tokenizeInline(text: string): InlineToken[] {
  const out: InlineToken[] = [];
  let last = 0;
  for (const m of text.matchAll(TOKEN_RE)) {
    const index = m.index ?? 0;
    pushText(out, text.slice(last, index));
    last = index + m[0].length;
    if (m[1] !== undefined) {
      const inner = m[1].trim();
      out.push(DICE_ONLY_RE.test(inner) ? { type: "dice", value: inner } : { type: "bold", value: inner });
    } else if (m[2] !== undefined) {
      out.push({ type: "dice", value: m[2] });
    } else if (m[3] !== undefined) {
      pushDamageList(out, m[3]);
    } else if (m[4] !== undefined) {
      const word = m[4].split(" ").pop()!.toLowerCase();
      out.push({ type: "damage", value: m[4], damage: DAMAGE_WORDS[word] });
    } else if (m[5] !== undefined) {
      out.push({ type: "save", value: m[5], ability: ABILITY_WORDS[m[5].split(" ")[0].toLowerCase()] });
    } else if (m[6] !== undefined) {
      out.push({ type: "save", value: m[6], ability: ABILITY_WORDS[m[6].split(" ").pop()!.toLowerCase()] });
    } else if (m[7] !== undefined) {
      out.push({ type: "condition", value: m[7], condition: CONDITION_WORDS[m[7].toLowerCase()] });
    } else if (m[8] !== undefined) {
      out.push({ type: "term", value: m[8] });
    }
  }
  pushText(out, text.slice(last));
  return out;
}

// "Dragon Wings: ..." or "Starting at 6th level, ..." opens many rules paragraphs.
const LEAD_RES = [
  /^([A-Z][^.:!?\n]{1,40}):\s+(?=\S)/,
  /^((?:Starting|Beginning) (?:at|when you reach) \d+(?:st|nd|rd|th) level|(?:At|By) \d+(?:st|nd|rd|th) level|(?:Mulai|Pada|Di|Saat mencapai) level \d+)(?=[,\s])/,
];

function withLead(text: string): { lead?: string; tokens: InlineToken[] } {
  for (const re of LEAD_RES) {
    const m = text.match(re);
    if (!m) continue;
    const rest = text.slice(m[0].length);
    return { lead: m[1] + (m[0].includes(":") ? ":" : ""), tokens: tokenizeInline(/^[\s,.;]/.test(rest) ? rest : ` ${rest}`) };
  }
  return { tokens: tokenizeInline(text) };
}

/** The data mixes strings, string arrays and {name|text|description} objects. */
export function toPlainText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(toPlainText).filter(Boolean).join("\n");
  if (value && typeof value === "object") {
    const named = value as { name?: unknown; text?: unknown; description?: unknown };
    return toPlainText(named.text ?? named.description ?? named.name ?? "");
  }
  return value === null || value === undefined ? "" : String(value);
}

export function parseBlocks(value: unknown): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  const flush = () => {
    const text = paragraph.join(" ").trim();
    if (text) blocks.push({ type: "paragraph", ...withLead(text) });
    paragraph = [];
  };
  for (const raw of toPlainText(value).split("\n")) {
    const line = raw.trim();
    const bullet = line.match(/^[-•*]\s+(.+)$/);
    const numbered = line.match(/^\d+[.)]\s+(.+)$/);
    if (bullet || numbered) {
      flush();
      const ordered = !bullet;
      const item = withLead((bullet || numbered)![1]);
      const prev = blocks[blocks.length - 1];
      if (prev?.type === "list" && prev.ordered === ordered) prev.items.push(item);
      else blocks.push({ type: "list", ordered, items: [item] });
    } else {
      // Every line is its own paragraph: the data uses single newlines between paragraphs too.
      flush();
      if (line) paragraph.push(line);
    }
  }
  flush();
  return blocks;
}
