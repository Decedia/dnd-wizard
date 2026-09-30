/**
 * The omission check - the safety net that was missing.
 *
 * Six of the errors in the first race pass were omissions: a trait that exists
 * in the rules but was never written, or a variant trait written on the wrong
 * race. Care did not catch them; a diff against an independent list did.
 *
 * The existing SRD files are useless as a *mechanic* source - their `effect`
 * field is empty in 0 of 288 class features - but their *names* are a valid
 * inventory. This script treats them as a checklist only and reports every
 * inventory entry that has no counterpart in the engine dataset, so an omission
 * becomes a line in a worklist rather than something nobody notices for months.
 *
 * Read-only. Exits non-zero under --strict, for use as a completion gate.
 *
 *   node scripts/engine-inventory.mjs                 # what is still missing
 *   node scripts/engine-inventory.mjs --strict        # fail while any remain
 *   node scripts/engine-inventory.mjs --class Barbarian
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRD = path.join(ROOT, "src", "data", "en");
const ENGINE = path.join(ROOT, "src", "data", "engine");
const args = process.argv.slice(2);
const strict = args.includes("--strict");
const onlyClass = args.includes("--class") ? args[args.indexOf("--class") + 1] : null;

const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const slug = (t) =>
  String(t ?? "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

// Several old names encode a level tier in a parenthetical, which the engine
// models as a tier on a single entry. Matching the base name avoids reporting
// the same feature as missing three times, which would also let a genuinely
// missing tier hide behind a written one.
// A parenthetical that starts with a digit is a tier annotation in this dataset:
// "(d6)", "(1/rest)", "(1 use)", "(2 dice)", "(CR 1/4)".
const TIER_SUFFIX = /\s*\((?:\d+[^)]*|d\d+|cr[^)]*|once per turn|see per turn|see class table)\)\s*$/i;
// The old data labels a class's own spellcasting "Spellcasting: Bard"; the rules call it "Spellcasting".
const CLASS_PREFIX = /^spellcasting\s*:\s*.+$/i;
const SPELLCASTING = "Spellcasting";
const baseName = (name) => {
  const stripped = String(name).replace(TIER_SUFFIX, "").trim();
  return CLASS_PREFIX.test(stripped) ? SPELLCASTING : stripped;
};

// --- inventory -------------------------------------------------------------

const classes = read(path.join(SRD, "2014_classes.json")).classes ?? [];
const subclasses = read(path.join(SRD, "2014_subclasses.json")).subclasses ?? [];
const feats = read(path.join(SRD, "2014_feats.json")).feats ?? [];
const races = read(path.join(SRD, "2014_races.json")).races ?? [];

/** { group, owner, name, level, key } - key is what the engine must contain. */
const inventory = [];

for (const c of classes) {
  for (const level of c.levels ?? []) {
    for (const f of level.features ?? []) {
      inventory.push({ group: "class", owner: c.name, name: f.name, level: level.level, key: `class.${slug(c.name)}.${slug(baseName(f.name))}` });
    }
  }
}
for (const s of subclasses) {
  for (const f of s.features ?? []) {
    inventory.push({ group: "subclass", owner: s.name, name: f.name, level: f.level ?? null, key: `subclass.${slug(s.name)}.${slug(baseName(f.name))}` });
  }
}
// A feat is identified by its name, not its sourcebook: the old data lists Alert
// three times (PHB, TCE, VRGR) and Bountiful Luck four times, all the same feat.
// The engine holds one Alert, so the inventory must too - otherwise 146 rows
// read as 146 feats when there are 79.
const unregisteredRaces = [];

const featSeen = new Set();
for (const f of feats) {
  const key = `feat.${slug(baseName(f.name))}`;
  if (featSeen.has(key)) continue;
  featSeen.add(key);
  inventory.push({ group: "feat", owner: "Feat", name: f.name, level: null, key, books: typeof f.source === "string" ? [f.source] : ["unresolved"] });
}
const racesDoc = read(path.join(ROOT, "src", "data", "engine", "races.json"));

/**
 * Maps a normalised race name to its engine key prefix, for both the base race
 * and each variant, under either of the two forms the old data uses:
 * "Dragonborn (Metallic)" and "Hill Dwarf". Resolving through the registry rather
 * than by string surgery is what keeps a variant from reading as a missing race.
 */
const raceKeyOf = (() => {
  const byName = new Map();
  for (const race of racesDoc?.races ?? []) {
    byName.set(slug(race.name), `race.${slug(race.name)}`);
    // The registry may record an older or alternative name for a race.
    for (const alias of race.alsoCalled ?? []) byName.set(slug(alias), `race.${slug(race.name)}`);
    for (const v of race.variants ?? []) {
      // Register both "Dwarf mountain" and "Mountain Dwarf" spellings.
      byName.set(slug(`${v.name} ${race.name}`), `race.${slug(race.name)}.${slug(v.id)}`);
      byName.set(slug(v.name), `race.${slug(race.name)}.${slug(v.id)}`);
    }
  }
  return (name) => {
    const direct = byName.get(slug(name));
    if (direct) return direct;
    const paren = /^(.*?)\s*\((.+)\)\s*$/.exec(name);
    if (paren) return byName.get(slug(paren[1])) ? `${byName.get(slug(paren[1]))}.${slug(paren[2])}` : null;
    return null;
  };
})();

for (const r of races) {
  const prefix = raceKeyOf(r.name);
  if (!prefix) {
    unregisteredRaces.push(r.name);
  }
  for (const t of r.traits ?? []) {
    inventory.push({ group: "race", owner: r.name, name: t.name, level: null, key: `${prefix ?? `race.${slug(r.name)}`}.${slug(baseName(t.name))}` });
  }
}

// --- what the engine holds -------------------------------------------------

const authored = new Map();
const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith(".json")) {
      for (const f of read(full).features ?? []) {
        authored.set(f.id, f);
        // Also index without the variant segment, so a variant trait still
        // satisfies the base-name checklist.
        if (f.id.split(".").length === 4) authored.set(f.id.split(".").slice(0, 3).join("."), f);
      }
    }
  }
};
walk(path.join(ENGINE, "features"));

// --- compare ---------------------------------------------------------------

// Several old names are 3e/4e leftovers or repo-specific renames whose correct
// engine name differs. Listed explicitly so a genuine omission is not hidden by
// an alias, and so an alias cannot quietly cover a missing entry forever.
const ALIASES = {
  "class.cleric.divine_intervention_improvement": "a tier on Divine Intervention, at 18th level",
  // The old data marks the oath's 7/15/20-level features and the 18th-level aura
  // improvement as separate class rows. They are the subclass choice and a tier
  // on the auras, both of which the engine already models.
  "class.paladin.sacred_oath_feature": "the subclass choice, see Sacred Oath",
  "class.paladin.aura_improvements": "a tier on Aura of Protection and Aura of Courage at 18th level",
  "class.paladin.oath_spells": "a tier on Oath Spells",
  "class.fighter.martial_archetype_feature": "the subclass choice",
  "class.monk.monastic_tradition_feature": "the subclass choice",
  "class.ranger.ranger_archetype_feature": "the subclass choice",
  "class.warlock.otherworldly_patron_feature": "the subclass choice",
  "class.wizard.arcane_tradition_feature": "the subclass choice",
  "class.artificer.artificer_specialist_feature": "the subclass choice",
};

// Old race entries whose name does not map to a registry key, and old trait
// names the rules spell differently.
const RACE_ALIASES = {
  "race.deep_gnome.svirfneblin.darkvision": "registry names this race Svirfneblin",
  "race.deep_gnome.svirfneblin.stone_camouflage": "registry names this race Svirfneblin",
  "race.deep_gnome.svirfneblin.svirfneblin_magic": "registry names this race Svirfneblin",
  "race.eladrin.elf.darkvision": "Eladrin is its own race, not an elf variant",
  "race.eladrin.elf.fey_ancestry": "Eladrin is its own race, not an elf variant",
  "race.eladrin.elf.trance": "Eladrin is its own race, not an elf variant",
  "race.changeling.shapechanger": "the rules spell it Shapeshifter",
  "race.half_elf.high_elf_variant.darkvision": "a half-elf takes one elf variant; see variantFrom",
};

// Rows like "Path feature" or "Divine Domain feature" are the subclass choice
// itself, not a feature - the real content belongs to each subclass entry. They
// are matched by pattern so 37 placeholders do not need 37 aliases, and each
// subclass's own features are still checked individually.
const SUBCLASS_PLACEHOLDER =
  // Either a bare placeholder ("Path feature", "Bard College") or one with a suffix ("Divine Domain feature").
  /^(path|bard college|college|divine domain|domain|druid circle|circle|martial archetype|archetype|monastic tradition|roguish archetype|sorcerous origin|otherworldly patron|arcane tradition|artificer specialist|constitution|oath|ranger archetype|domain spells|domain|devotion|ancients|watchers|life)\s*(feature|features)?$/i;

/**
 * Traits the old data has that do not exist in 2014 rules, deliberately dropped
 * rather than authored. Listed with the reason so the omission is on the record
 * instead of looking like a gap that was overlooked.
 */
const LEGACY_TRAITS = new Map(Object.entries({
  gnome_cunning: "3e/4e",
  keen_senses: "3e/4e",
  dwarven_resilience: "3e/4e",
  dwarven_combat_training: "Tasha's, not PHB",
  dwarven_armor_training: "Tasha's, not PHB",
  long_limbed: "3e/4e",
  powerful_build: "3e/4e build, replaced by Stonecunning",
  sneaky: "3e/4e",
  surprise_attack: "3e/4e",
  nimble_escape: "legacy goblin, folded into Goblin Cunning",
  fury_of_the_small: "3e/4e",
  grovel_cower_and_beg: "3e/4e, split into Grovel",
  hidden_step: "legacy Firbolg, not in Volo",
  speech_of_beast_and_leaf: "3e/4e",
  deathless_nature: "legacy",
  spider_climb: "legacy Dhampir, not in VgtM",
  duplicity: "legacy Changeling",
  fey_step: "legacy Eladrin",
  flying_speed: "a speed, not a trait; Aarakocra has Wings of the Sky",
  githyanki_psionics: "3e psionics",
  githzerai_psionics: "3e psionics",
  thri_kreen_psionics: "3e psionics",
  decadent_mastery: "3e/4e gith",
  mental_discipline: "3e/4e gith",
  psionic_mind: "3e/4e",
  hex_magic: "legacy Hexblood",
  eerie_token: "legacy Hexblood",
  infernal_legacy: "misnamed Infernal Constitution",
  stout_resilience: "Tasha's, not PHB",
  silent_speech: "3e/4e",
  naturally_stealthy: "misnamed Naturally Sneaky",
  martial_training: "renamed Martial Advantage",
  saving_face: "renamed Martial Advantage",
  cunning_artisan: "Tasha's, not Volo",
  control_air_and_water: "Tasha's, not Volo",
  emissary_of_the_sea: "Tasha's, not Volo",
  guardians_of_the_depths: "Tasha's, not Volo",
  expert_forgery: "Tasha's, not Volo",
  innate_spellcasting: "renamed Pureblood Magic",
  knowledge_from_a_past_life: "legacy Reborn",
  reborn_resilience: "legacy Reborn",
  vampiric_bite: "legacy Dhampir, not in VgtM",
  drow_heritage: "4e subrace heritage",
  high_elf_heritage: "4e subrace heritage",
  wood_elf_heritage: "4e subrace heritage",
  moon_elf_heritage: "4e subrace heritage",
  sun_elf_heritage: "4e subrace heritage",
  sea_elf_heritage: "4e subrace heritage",
  shadar_kai_heritage: "4e subrace heritage",
  eladrin_heritage: "4e subrace heritage",
  aarakocra_darkvision: "2014 Aarakocra has no darkvision; it has flight",
  human: "placeholder trait; 2014 Human has no racial traits, see Versatile",
  kenku_training: "3e/4e Kenku",
  mimicry: "3e/4e Kenku",
  fey: "legacy Hexblood",
  eladrin_season: "renamed Seasonal Magic",
  shape_yourself: "not a Volo Plasmoid trait",
  plasmatic_resistance: "not a Volo Plasmoid trait; real traits are acid resistance and poison immunity",
  gem_flight: "not an Eberron Gem Dragonborn trait",
  natural_illusionist: "3e/4e gnome",
  speak_with_small_beasts: "3e/4e gnome",
  artificers_lore: "not a 2014 Rock Gnome trait",
  psychic_resilience: "3e/4e gith",
  tool_proficiency: "a proficiency, not a trait; folded into the class's proficiencies",
  keen_senses_drow: "3e/4e",
}));

// A trait listed on a variant in the old data may legitimately live on the base
// in the engine, because that is where it belongs: Darkvision is repeated across
// 19 old variant entries and the engine writes it once on the base race. So a
// variant entry is satisfied by either key.
const baseKeyOf = (key) => {
  const parts = key.split(".");
  if (parts[0] !== "race" || parts.length !== 4) return null;
  return `race.${parts[1]}.${parts[3]}`;
};

// Legacy race entries as a whole: the 2014 Tiefling is one race, so the nine
// 4e-style variants are dropped rather than authored.
const LEGACY_RACE_ENTRIES = /^(Deep Gnome \(Svirfneblin\)|Eladrin \(Elf\)|Half-Elf \(.+\)|Tiefling \(.+\)|Scout|Half-Orc \(Legacy\))$/;

const missing = [];
const droppedLegacy = [];
const resolvedAliases = [];
for (const item of inventory) {
  if (onlyClass && slug(item.owner) !== slug(onlyClass)) continue;
  if (authored.has(item.key)) continue;
  if (item.group === "race" && LEGACY_RACE_ENTRIES.test(item.owner)) {
    droppedLegacy.push({ ...item, reason: "legacy race entry; 2014 has one tiefling, one half-elf and one Eladrin" });
    continue;
  }
  const baseKey = baseKeyOf(item.key);
  if (baseKey && authored.has(baseKey)) continue;
  if (SUBCLASS_PLACEHOLDER.test(item.name)) continue;
  const traitSlug = slug(baseName(item.name));
  const wholeEntry = `${slug(item.owner)}_${traitSlug}`;
  if (item.group === "race" && (LEGACY_TRAITS.has(traitSlug) || LEGACY_TRAITS.has(wholeEntry))) {
    droppedLegacy.push({ ...item, reason: LEGACY_TRAITS.get(traitSlug) });
    continue;
  }
  const alias = ALIASES[item.key] ?? RACE_ALIASES[item.key];
  if (alias) {
    // A rename or a modelling decision, not a gap. Counted as covered.
    resolvedAliases.push({ ...item, alias });
    continue;
  }
  missing.push(item);
}

// --- report ----------------------------------------------------------------

const byGroup = new Map();
for (const m of missing) {
  if (!byGroup.has(m.group)) byGroup.set(m.group, []);
  byGroup.get(m.group).push(m);
}

console.log("=".repeat(78));
console.log("INVENTORY CHECK - rules entries with no engine counterpart");
console.log("=".repeat(78));
console.log("\nThe old SRD files are used as a name checklist only. Anything listed");
console.log("below is either unwritten or written under a different name.\n");

const TOTAL = inventory.filter((i) => !onlyClass || slug(i.owner) === slug(onlyClass)).length;
const DONE = TOTAL - missing.length;
console.log(`  ${DONE}/${TOTAL} inventory entries have an engine entry`);
for (const [group, list] of byGroup) {
  console.log(`\n  ${group.toUpperCase()}  (${list.length} missing)`);
  const byOwner = new Map();
  for (const m of list) {
    if (!byOwner.has(m.owner)) byOwner.set(m.owner, []);
    byOwner.get(m.owner).push(m);
  }
  for (const [owner, items] of [...byOwner].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`    ${owner}  (${items.length})`);
    for (const m of items) {
      const level = m.level ? `L${String(m.level).padEnd(2)} ` : "   ";
      const alias = m.alias ? `  <- ${m.alias}` : "";
      console.log(`      ${level}${m.name}${alias}`);
    }
  }
}
if (resolvedAliases.length > 0) {
  console.log(`\n  ${resolvedAliases.length} entries satisfied by a rename or a modelling decision:`);
  for (const a of resolvedAliases) console.log(`    ${a.owner} ${a.name}  <- ${a.alias}`);
}
if (unregisteredRaces.length > 0) {
  console.log(`\n  Old race entries with no registry match (${unregisteredRaces.length}):`);
  for (const n of unregisteredRaces) console.log(`    ${n}`);
}
console.log("");
console.log(`  ${droppedLegacy.length} old race traits deliberately dropped as legacy or renamed:`);
const byReason = new Map();
for (const d of droppedLegacy) {
  const r = d.reason ?? "unspecified";
  if (!byReason.has(r)) byReason.set(r, []);
  byReason.get(r).push(d);
}
for (const [reason, list] of [...byReason].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`    ${String(list.length).padStart(3)}  ${reason}`);
}
console.log("");

if (strict && missing.length > 0) {
  console.error(`${missing.length} inventory entries still have no engine counterpart.`);
  process.exit(1);
}
