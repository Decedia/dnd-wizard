"use client";

import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import type { Character } from "./storage";
import { getModifier } from "./storage";
import { getStaticFeats, getStaticRace, getStaticSpells } from "./srd-client";
import { getFeatPicks } from "./feature-groups";
import { getWeaponAttackDetails } from "./weapon-attacks";
import { encodePdfCharacterData } from "./pdf-data";

type PdfLanguage = "en" | "id";

/**
 * A two-page printable sheet. Page 1: identity, defenses, abilities with their
 * saves and skills, combat numbers, weapons, features, race traits and feats.
 * Page 2: spellcasting, the spell table, story, languages, equipment and coins.
 * Anything that doesn't fit its box continues on the pages after.
 */

const L: Record<PdfLanguage, Record<string, string>> = {
  en: {
    characterName: "Character name", background: "Background", class: "Class", race: "Race", subclass: "Subclass",
    level: "Level", xp: "XP", armorClass: "Armor class", hitPoints: "Hit points", current: "Current", temp: "Temp", max: "Max",
    hitDice: "Hit dice", spent: "Spent", deathSaves: "Death saves", successes: "Successes", failures: "Failures",
    proficiencyBonus: "Proficiency bonus", savingThrow: "Saving throw", modifier: "Modifier", score: "Score",
    inspiration: "Inspiration", initiative: "Initiative", speed: "Speed", size: "Size", passivePerception: "Passive perception",
    weapons: "Weapons & damage cantrips", name: "Name", atkDc: "Atk bonus / DC", damage: "Damage & type", notes: "Notes",
    classFeatures: "Class features", raceTraits: "Race traits", feats: "Feats", proficiencies: "Proficiencies",
    armorTraining: "Armor training", light: "Light", medium: "Medium", heavy: "Heavy", shields: "Shields", tools: "Tools", other: "Other",
    spellcasting: "Spellcasting", ability: "Ability", saveDc: "Spell save DC", attackBonus: "Spell attack bonus",
    spellSlots: "Spell slots", lvlShort: "Lvl", spells: "Cantrips & spells", castingTime: "Time", range: "Range", crm: "C R M",
    appearance: "Appearance", backstory: "Backstory & personality", alignment: "Alignment", languages: "Languages",
    equipment: "Equipment", attunement: "Magic item attunement", coins: "Coins", more: "+{n} more, see the following pages",
    details: "Features & traits in full", spellsCont: "Cantrips & spells (continued)", story: "Story", none: "None",
    age: "Age", height: "Height", weight: "Weight", eyes: "Eyes", skin: "Skin", hair: "Hair",
    personality: "Personality", backstoryOnly: "Backstory", allies: "Allies & organizations", additional: "Additional features", treasure: "Treasure",
    cantrip: "C",
  },
  id: {
    characterName: "Nama karakter", background: "Latar belakang", class: "Kelas", race: "Ras", subclass: "Subkelas",
    level: "Level", xp: "XP", armorClass: "Armor class", hitPoints: "Hit points", current: "Saat ini", temp: "Sementara", max: "Maks",
    hitDice: "Hit dice", spent: "Terpakai", deathSaves: "Death saves", successes: "Berhasil", failures: "Gagal",
    proficiencyBonus: "Proficiency bonus", savingThrow: "Saving throw", modifier: "Modifier", score: "Skor",
    inspiration: "Inspiration", initiative: "Initiative", speed: "Kecepatan", size: "Ukuran", passivePerception: "Passive perception",
    weapons: "Senjata & cantrip damage", name: "Nama", atkDc: "Bonus atk / DC", damage: "Damage & tipe", notes: "Catatan",
    classFeatures: "Fitur kelas", raceTraits: "Trait ras", feats: "Feat", proficiencies: "Proficiency",
    armorTraining: "Pelatihan armor", light: "Light", medium: "Medium", heavy: "Heavy", shields: "Shield", tools: "Alat", other: "Lainnya",
    spellcasting: "Spellcasting", ability: "Ability", saveDc: "Spell save DC", attackBonus: "Spell attack bonus",
    spellSlots: "Spell slot", lvlShort: "Lv", spells: "Cantrip & spell", castingTime: "Waktu", range: "Jarak", crm: "C R M",
    appearance: "Penampilan", backstory: "Latar cerita & kepribadian", alignment: "Alignment", languages: "Bahasa",
    equipment: "Perlengkapan", attunement: "Attunement item sihir", coins: "Koin", more: "+{n} lagi, lihat halaman berikutnya",
    details: "Fitur & trait lengkap", spellsCont: "Cantrip & spell (lanjutan)", story: "Cerita", none: "Tidak ada",
    age: "Umur", height: "Tinggi", weight: "Berat", eyes: "Mata", skin: "Kulit", hair: "Rambut",
    personality: "Kepribadian", backstoryOnly: "Latar cerita", allies: "Sekutu & organisasi", additional: "Fitur tambahan", treasure: "Harta",
    cantrip: "C",
  },
};

const INK = "#1a1a1a";
const LINE = "#4a4a4a";
const MUTED = "#6b6b6b";
const SOFT = "#f2f2f2";

const s = StyleSheet.create({
  page: { padding: 20, fontFamily: "Helvetica", fontSize: 7.5, color: INK, backgroundColor: "#ffffff" },
  row: { flexDirection: "row" },
  box: { border: `0.8 solid ${LINE}`, borderRadius: 4, padding: 5 },
  label: { fontSize: 5.6, fontFamily: "Helvetica-Bold", color: MUTED, textTransform: "uppercase", letterSpacing: 0.4 },
  title: { fontSize: 6.6, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.6, textAlign: "center", marginBottom: 4 },
  big: { fontSize: 16, fontFamily: "Helvetica-Bold", textAlign: "center" },
  mid: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  field: { borderBottom: `0.5 solid ${LINE}`, paddingBottom: 1, marginBottom: 1, minHeight: 10 },
  small: { fontSize: 6.6 },
  muted: { color: MUTED },
  bold: { fontFamily: "Helvetica-Bold" },
  dot: { width: 5.5, height: 5.5, borderRadius: 3, border: `0.7 solid ${LINE}`, marginRight: 3 },
  dotOn: { backgroundColor: INK },
  diamond: { width: 5.5, height: 5.5, border: `0.7 solid ${LINE}`, transform: "rotate(45deg)", marginRight: 3 },
  tableHead: { flexDirection: "row", borderBottom: `0.6 solid ${LINE}`, paddingBottom: 2, marginBottom: 1 },
  tableRow: { flexDirection: "row", borderBottom: `0.3 solid #c8c8c8`, minHeight: 11, alignItems: "center" },
  cell: { paddingRight: 3 },
});

const sign = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
const ABILITIES = [
  { key: "str", name: "Strength", skills: ["Athletics"] },
  { key: "dex", name: "Dexterity", skills: ["Acrobatics", "Sleight of Hand", "Stealth"] },
  { key: "con", name: "Constitution", skills: [] },
  { key: "int", name: "Intelligence", skills: ["Arcana", "History", "Investigation", "Nature", "Religion"] },
  { key: "wis", name: "Wisdom", skills: ["Animal Handling", "Insight", "Medicine", "Perception", "Survival"] },
  { key: "cha", name: "Charisma", skills: ["Deception", "Intimidation", "Performance", "Persuasion"] },
] as const;

function Dot({ on, double }: { on?: boolean; double?: boolean }) {
  return (
    <View style={[s.dot, on ? s.dotOn : {}, double ? { border: `1.6 solid ${INK}` } : {}]} />
  );
}

function Box({ title, style, children }: { title?: string; style?: any; children?: any }) {
  return (
    <View style={[s.box, style || {}]}>
      {title ? <Text style={s.title}>{title}</Text> : null}
      {children}
    </View>
  );
}

function Field({ label, value, style }: { label: string; value?: string | number | null; style?: any }) {
  return (
    <View style={[{ flex: 1 }, style || {}]}>
      <Text style={[s.field, s.bold]}>{value === undefined || value === null || value === "" ? " " : String(value)}</Text>
      <Text style={s.label}>{label}</Text>
    </View>
  );
}

function AbilityBox({ character, ability, t }: { character: Character; ability: (typeof ABILITIES)[number]; t: (k: string) => string }) {
  const score = character[ability.key] as number;
  const mod = getModifier(score);
  const prof = character.proficiencyBonus || 2;
  const save = character.savingThrows?.[ability.key] ?? { proficient: false, value: mod };
  return (
    <View style={[s.box, { marginBottom: 5 }]} wrap={false}>
      <Text style={s.title}>{ability.name}</Text>
      <View style={[s.row, { alignItems: "center", marginBottom: 3 }]}>
        <View style={{ width: 34, height: 26, borderRadius: 13, border: `0.8 solid ${LINE}`, justifyContent: "center" }}>
          <Text style={[s.mid, { textAlign: "center" }]}>{sign(mod)}</Text>
        </View>
        <View style={{ marginLeft: 6 }}>
          <Text style={[s.mid]}>{score}</Text>
          <Text style={s.label}>{t("score")}</Text>
        </View>
      </View>
      <View style={[s.row, { alignItems: "center", borderTop: `0.4 solid #bbbbbb`, paddingTop: 2 }]}>
        <Dot on={save.proficient} />
        <Text style={[s.bold, { width: 16 }]}>{sign(save.value)}</Text>
        <Text style={s.bold}>{t("savingThrow")}</Text>
      </View>
      {ability.skills.map((skill) => {
        const proficient = !!character.skills?.[skill];
        const expert = (character.expertise || []).includes(skill);
        const total = mod + (proficient ? prof * (expert ? 2 : 1) : 0);
        return (
          <View key={skill} style={[s.row, { alignItems: "center", marginTop: 1.5 }]}>
            <Dot on={proficient} double={expert} />
            <Text style={{ width: 16 }}>{sign(total)}</Text>
            <Text>{skill}</Text>
          </View>
        );
      })}
    </View>
  );
}

type FeatureLine = { name: string; level?: number | null; summary: string; picks?: string[] };

function FeatureList({ items, max, t }: { items: FeatureLine[]; max: number; t: (k: string) => string }) {
  const shown = items.slice(0, max);
  return (
    <View>
      {shown.map((f, i) => (
        <View key={`${f.name}-${i}`} style={{ marginBottom: 2.5 }}>
          <Text style={[s.small, { maxLines: 2, textOverflow: "ellipsis" }]}>
            <Text style={s.bold}>{f.name}</Text>
            {f.level ? <Text style={s.muted}>{` ${t("lvlShort")} ${f.level}`}</Text> : null}
            {f.picks && f.picks.length ? <Text style={s.bold}>{` (${f.picks.join(", ")})`}</Text> : null}
            {f.summary ? <Text>{` - ${f.summary}`}</Text> : null}
          </Text>
        </View>
      ))}
      {items.length > max ? <Text style={[s.small, s.muted]}>{t("more").replace("{n}", String(items.length - max))}</Text> : null}
    </View>
  );
}

/** Feature text without the markdown bold/italic markers the data uses. */
const plain = (text?: string | null) => String(text || "").replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1").trim();

const firstSentence = (text?: string | null) => {
  const clean = plain(text).replace(/\s+/g, " ");
  const cut = clean.search(/[.!?](\s|$)/);
  return (cut > 0 && cut < 140 ? clean.slice(0, cut + 1) : clean.slice(0, 140)).trim();
};

const CLASS_FEATURE_MAX = 16;
const SIDE_MAX = 7;
const SPELL_ROWS = 34;

function CharacterPdfDocument({ character, language = "en" as PdfLanguage }: { character: Character; language?: PdfLanguage }) {
  const t = (k: string) => L[language]?.[k] ?? L.en[k] ?? k;
  const prof = character.proficiencyBonus || 2;
  const featNames = new Set(getStaticFeats([], character.ruleset).map((f) => f.name));
  const race = character.race ? getStaticRace(character.race, character.ruleset, language) : undefined;

  const features = (character.features || []).filter((f) => f.name);
  const line = (f: Character["features"][number]): FeatureLine => ({ name: f.name, summary: firstSentence(f.summary || f.description) });
  const featLines: FeatureLine[] = [];
  const classLines: FeatureLine[] = [];
  const raceLines: FeatureLine[] = [];
  for (const f of features) {
    const fp = getFeatPicks(character, f.name);
    if (fp.taken || ((f.source === "custom" || !f.source) && featNames.has(f.name))) featLines.push({ ...line(f), level: fp.level, picks: fp.picks });
    else if (f.source === "race") raceLines.push(line(f));
    else classLines.push(line(f));
  }

  // Weapons from the inventory, then class attacks, then damage cantrips.
  const weaponRows: { name: string; atk: string; damage: string; notes: string }[] = [];
  for (const attack of character.attacks || []) {
    const d = getWeaponAttackDetails(character, attack);
    if (d) {
      weaponRows.push({
        name: attack.name,
        atk: sign(d.attackBonus),
        damage: `${d.damageDice}${d.damageBonus ? ` ${sign(d.damageBonus)}` : ""} ${d.damageType}`.trim(),
        notes: (d.weapon.properties || []).join(", "),
      });
    } else if (attack.name) {
      weaponRows.push({ name: attack.name, atk: sign(attack.attackBonus || 0), damage: attack.damageType || "", notes: attack.sneakAttack ? `+${attack.sneakAttack} sneak` : "" });
    }
  }
  const spellData = new Map(getStaticSpells([], character.ruleset, language).map((sp) => [sp.name.toLowerCase(), sp]));
  const dc = character.spellSaveDc || 8 + prof + (character.spellcastingAbility ? getModifier(character[character.spellcastingAbility as keyof Character] as number) : 0);
  for (const sp of (character.spells || []).filter((x) => x.level === 0 && (x.damageDice || x.damageType))) {
    weaponRows.push({ name: sp.name, atk: `DC ${dc}`, damage: `${sp.damageDice || ""} ${sp.damageType || ""}`.trim(), notes: "" });
  }

  const spells = [...(character.spells || [])]
    .filter((x) => x.name)
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
    .map((x) => {
      const d = spellData.get(x.name.toLowerCase());
      // Components come as a list or a string ("V, S, M (a pinch of sulfur)").
      const raw = d?.components as unknown;
      const comps = (Array.isArray(raw) ? raw : String(raw || "").split(/,\s*/)).map((c) => String(c).trim().charAt(0).toUpperCase());
      return {
        level: x.level === 0 ? t("cantrip") : String(x.level),
        name: x.name,
        time: d?.castingTime || "",
        range: d?.range || "",
        c: !!d?.concentration,
        r: !!d?.ritual,
        m: comps.includes("M"),
        notes: [x.damageDice, x.damageType].filter(Boolean).join(" "),
      };
    });

  const otherText = character.otherProficiencies || "";
  const lower = otherText.toLowerCase();
  const armor = {
    light: /light armor|all armor/.test(lower),
    medium: /medium armor|all armor/.test(lower),
    heavy: /heavy armor|all armor/.test(lower),
    shields: /shield/.test(lower),
  };
  const hasCasting = !!character.spellcastingAbility;
  const castMod = hasCasting ? getModifier(character[character.spellcastingAbility as keyof Character] as number) : null;
  const a = character.appearance || ({} as Character["appearance"]);
  const looks = [
    [t("age"), a.age], [t("height"), a.height], [t("weight"), a.weight], [t("eyes"), a.eyes], [t("skin"), a.skin], [t("hair"), a.hair],
  ].filter(([, v]) => v);
  const story = [
    { label: t("personality"), value: a.personality },
    { label: t("backstoryOnly"), value: a.backstory },
    { label: t("allies"), value: a.alliesOrganizations },
    { label: t("additional"), value: a.additionalFeaturesTraits },
    { label: t("treasure"), value: a.treasure },
  ].filter((x) => (x.value || "").trim());
  const attuned = (character.inventory || []).filter((i) => i.attunement);
  const inventory = (character.inventory || []).filter((i) => i.name);
  const deathOn = (n: number, i: number) => i < n;

  return (
    <Document
      title={character.name || "DND Wizard Character"}
      author="DND Wizard"
      subject="DND Wizard Character Sheet"
      keywords={encodePdfCharacterData(character)}
      creator="DND Wizard"
      producer="DND Wizard"
    >
      {/* ===== Page 1 ===== */}
      <Page size="A4" style={s.page}>
        <View style={[s.row, { marginBottom: 6 }]}>
          <Box style={{ flex: 1, marginRight: 5 }}>
            <Text style={[s.field, { fontSize: 13, fontFamily: "Helvetica-Bold" }]}>{character.name || " "}</Text>
            <Text style={[s.label, { marginBottom: 4 }]}>{t("characterName")}</Text>
            <View style={[s.row, { marginBottom: 3 }]}>
              <Field label={t("background")} value={character.background} style={{ marginRight: 6 }} />
              <Field label={t("class")} value={character.class} />
            </View>
            <View style={s.row}>
              <Field label={t("race")} value={character.race} style={{ marginRight: 6 }} />
              <Field label={t("subclass")} value={character.subclass} />
            </View>
          </Box>
          <Box style={{ width: 52, marginRight: 5, justifyContent: "center" }}>
            <Text style={s.big}>{character.level}</Text>
            <Text style={[s.label, { textAlign: "center", marginBottom: 4 }]}>{t("level")}</Text>
            <Text style={[s.bold, { textAlign: "center" }]}>{character.experiencePoints || 0}</Text>
            <Text style={[s.label, { textAlign: "center" }]}>{t("xp")}</Text>
          </Box>
          <Box style={{ width: 52, marginRight: 5, justifyContent: "center" }}>
            <Text style={[s.label, { textAlign: "center" }]}>{t("armorClass")}</Text>
            <Text style={[s.big, { fontSize: 20 }]}>{character.ac}</Text>
          </Box>
          <Box title={t("hitPoints")} style={{ width: 118, marginRight: 5 }}>
            <View style={s.row}>
              <View style={{ flex: 1.2 }}>
                <Text style={[s.big, { textAlign: "left" }]}>{character.currentHp}</Text>
                <Text style={s.label}>{t("current")}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.field, s.bold]}>{character.temporaryHp || 0}</Text>
                <Text style={[s.label, { marginBottom: 2 }]}>{t("temp")}</Text>
                <Text style={[s.field, s.bold]}>{character.effectiveMaxHp ?? character.maxHp}</Text>
                <Text style={s.label}>{t("max")}</Text>
              </View>
            </View>
          </Box>
          <Box title={t("hitDice")} style={{ width: 62, marginRight: 5 }}>
            <Text style={[s.field, s.bold]}>{Math.max(0, (character.level || 1) - (character.hitDiceRemaining ?? character.level))}</Text>
            <Text style={[s.label, { marginBottom: 2 }]}>{t("spent")}</Text>
            <Text style={[s.field, s.bold]}>{character.hitDiceTotal || `${character.level}d?`}</Text>
            <Text style={s.label}>{t("max")}</Text>
          </Box>
          <Box title={t("deathSaves")} style={{ width: 66 }}>
            <View style={[s.row, { marginBottom: 1 }]}>{[0, 1, 2].map((i) => <Dot key={i} on={deathOn(character.deathSaveSuccesses || 0, i)} />)}</View>
            <Text style={[s.label, { marginBottom: 4 }]}>{t("successes")}</Text>
            <View style={[s.row, { marginBottom: 1 }]}>{[0, 1, 2].map((i) => <Dot key={i} on={deathOn(character.deathSaveFailures || 0, i)} />)}</View>
            <Text style={s.label}>{t("failures")}</Text>
          </Box>
        </View>

        <View style={[s.row, { flexGrow: 1 }]}>
          {/* Left: abilities */}
          <View style={{ width: 222, marginRight: 6 }}>
            <View style={s.row}>
              <View style={{ flex: 1, marginRight: 5 }}>
                <Box style={{ marginBottom: 5, alignItems: "center" }}>
                  <Text style={s.label}>{t("proficiencyBonus")}</Text>
                  <Text style={s.big}>{sign(prof)}</Text>
                </Box>
                {ABILITIES.slice(0, 3).map((ab) => <AbilityBox key={ab.key} character={character} ability={ab} t={t} />)}
                <Box style={{ alignItems: "center" }}>
                  <Text style={s.label}>{t("inspiration")}</Text>
                  <View style={{ marginTop: 3, width: 10, height: 10, border: `0.8 solid ${LINE}`, backgroundColor: character.inspiration ? INK : "#ffffff" }} />
                </Box>
              </View>
              <View style={{ flex: 1 }}>
                {ABILITIES.slice(3).map((ab) => <AbilityBox key={ab.key} character={character} ability={ab} t={t} />)}
              </View>
            </View>
            <Box title={t("proficiencies")} style={{ marginTop: 1, flexGrow: 1 }}>
              <View style={[s.row, { alignItems: "center", marginBottom: 3, flexWrap: "wrap" }]}>
                <Text style={[s.label, { marginRight: 4 }]}>{t("armorTraining")}</Text>
                {(["light", "medium", "heavy", "shields"] as const).map((k) => (
                  <View key={k} style={[s.row, { alignItems: "center", marginRight: 5 }]}>
                    <Dot on={armor[k]} />
                    <Text style={s.small}>{t(k)}</Text>
                  </View>
                ))}
              </View>
              <Text style={s.label}>{t("tools")}</Text>
              <Text style={[s.small, { marginBottom: 3 }]}>{(character.toolProficiencies || []).join(", ") || t("none")}</Text>
              <Text style={s.label}>{t("other")}</Text>
              <Text style={[s.small, { maxLines: 6, textOverflow: "ellipsis" }]}>{otherText || t("none")}</Text>
            </Box>
          </View>

          {/* Right: combat, weapons, features */}
          <View style={{ flex: 1 }}>
            <View style={[s.row, { marginBottom: 5 }]}>
              {[
                [t("initiative"), sign(character.initiative || 0)],
                [t("speed"), `${character.speed} ft`],
                [t("size"), race?.size || ""],
                [t("passivePerception"), character.passivePerception],
              ].map(([label, value], i) => (
                <Box key={String(label)} style={{ flex: 1, marginRight: i < 3 ? 5 : 0, alignItems: "center" }}>
                  <Text style={s.label}>{label}</Text>
                  <Text style={[s.mid, { marginTop: 2 }]}>{String(value || " ")}</Text>
                </Box>
              ))}
            </View>

            <Box title={t("weapons")} style={{ marginBottom: 5 }}>
              <View style={s.tableHead}>
                <Text style={[s.label, s.cell, { flex: 2.2 }]}>{t("name")}</Text>
                <Text style={[s.label, s.cell, { flex: 1.1 }]}>{t("atkDc")}</Text>
                <Text style={[s.label, s.cell, { flex: 1.6 }]}>{t("damage")}</Text>
                <Text style={[s.label, s.cell, { flex: 2 }]}>{t("notes")}</Text>
              </View>
              {[...weaponRows.slice(0, 6), ...Array(Math.max(0, 6 - weaponRows.length)).fill(null)].map((w, i) => (
                <View key={i} style={s.tableRow}>
                  <Text style={[[s.cell, s.bold, { flex: 2.2 }], { maxLines: 1, textOverflow: "ellipsis" }]}>{w?.name || " "}</Text>
                  <Text style={[s.cell, { flex: 1.1 }]}>{w?.atk || ""}</Text>
                  <Text style={[[s.cell, { flex: 1.6 }], { maxLines: 1, textOverflow: "ellipsis" }]}>{w?.damage || ""}</Text>
                  <Text style={[[s.cell, s.small, { flex: 2 }], { maxLines: 1, textOverflow: "ellipsis" }]}>{w?.notes || ""}</Text>
                </View>
              ))}
            </Box>

            <Box title={t("classFeatures")} style={{ flexGrow: 1, marginBottom: 5 }}>
              <FeatureList items={classLines} max={CLASS_FEATURE_MAX} t={t} />
            </Box>

            <View style={[s.row, { height: 168 }]}>
              <Box title={t("raceTraits")} style={{ flex: 1, marginRight: 5 }}>
                <FeatureList items={raceLines} max={SIDE_MAX} t={t} />
              </Box>
              <Box title={t("feats")} style={{ flex: 1 }}>
                <FeatureList items={featLines} max={SIDE_MAX} t={t} />
              </Box>
            </View>
          </View>
        </View>
      </Page>

      {/* ===== Page 2 ===== */}
      <Page size="A4" style={s.page}>
        <View style={[s.row, { marginBottom: 6 }]}>
          <Box title={t("spellcasting")} style={{ width: 150, marginRight: 5 }}>
            {[
              [t("ability"), hasCasting ? character.spellcastingAbility.toUpperCase() : "-"],
              [t("modifier"), castMod === null ? "-" : sign(castMod)],
              [t("saveDc"), hasCasting ? String(dc) : "-"],
              [t("attackBonus"), hasCasting ? sign(character.spellAttackBonus || prof + (castMod || 0)) : "-"],
            ].map(([label, value]) => (
              <View key={label} style={[s.row, { alignItems: "center", marginBottom: 2 }]}>
                <View style={{ width: 30, border: `0.7 solid ${LINE}`, borderRadius: 2, paddingVertical: 1.5, marginRight: 5 }}>
                  <Text style={[s.bold, { textAlign: "center" }]}>{value}</Text>
                </View>
                <Text style={s.label}>{label}</Text>
              </View>
            ))}
          </Box>
          <Box title={t("spellSlots")} style={{ flex: 1 }}>
            <View style={[s.row, { flexWrap: "wrap" }]}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((lvl) => {
                const total = Number(character.spellSlots?.[lvl] || 0);
                const used = Number(character.spellSlotsExpended?.[lvl] || 0);
                return (
                  <View key={lvl} style={[s.row, { width: "33%", alignItems: "center", marginBottom: 4 }]}>
                    <Text style={[s.bold, { width: 30 }]}>{`${t("level")} ${lvl}`}</Text>
                    <Text style={{ width: 12 }}>{total || "-"}</Text>
                    {Array.from({ length: total }).map((_, i) => (
                      <View key={i} style={[s.diamond, i < used ? s.dotOn : {}]} />
                    ))}
                  </View>
                );
              })}
            </View>
          </Box>
        </View>

        <View style={[s.row, { flexGrow: 1 }]}>
          <Box title={t("spells")} style={{ flex: 1, marginRight: 6 }}>
            <SpellTableHead t={t} />
            {[...spells.slice(0, SPELL_ROWS), ...Array(Math.max(0, SPELL_ROWS - spells.length)).fill(null)].map((sp, i) => (
              <SpellRow key={i} sp={sp} />
            ))}
            {spells.length > SPELL_ROWS ? <Text style={[s.small, s.muted, { marginTop: 2 }]}>{t("more").replace("{n}", String(spells.length - SPELL_ROWS))}</Text> : null}
          </Box>

          <View style={{ width: 190 }}>
            <Box title={t("appearance")} style={{ marginBottom: 5, minHeight: 104 }}>
              {looks.length ? <Text style={[s.small, { marginBottom: 2 }]}>{looks.map(([k, v]) => `${k}: ${v}`).join(", ")}</Text> : null}
              <Text style={[s.small, { maxLines: 8, textOverflow: "ellipsis" }]}>{a.characterAppearance || ""}</Text>
            </Box>
            <Box title={t("backstory")} style={{ marginBottom: 5, minHeight: 150, justifyContent: "space-between" }}>
              {story.slice(0, 3).map((x) => (
                <Text key={x.label} style={[s.small, { marginBottom: 2, maxLines: 4, textOverflow: "ellipsis" }]}>
                  <Text style={s.bold}>{`${x.label}: `}</Text>
                  {x.value}
                </Text>
              ))}
              <View style={{ marginTop: 4, borderTop: `0.5 solid ${LINE}`, paddingTop: 2 }}>
                <Text style={s.label}>{t("alignment")}</Text>
                <Text style={s.bold}>{character.alignment || " "}</Text>
              </View>
            </Box>
            <Box title={t("languages")} style={{ marginBottom: 5 }}>
              <Text style={s.small}>{(character.languages || []).join(", ") || t("none")}</Text>
            </Box>
            <Box title={t("equipment")} style={{ marginBottom: 5, flexGrow: 1 }}>
              {inventory.slice(0, 28).map((item) => (
                <View key={item.id} style={[s.row, { alignItems: "center" }]}>
                  <View style={[s.dot, { width: 4, height: 4 }, item.equipped ? s.dotOn : { borderColor: "#ffffff" }]} />
                  <Text style={[s.small, { maxLines: 1, textOverflow: "ellipsis" }]}>
                    {item.name}
                    {item.quantity > 1 ? ` x${item.quantity}` : ""}
                  </Text>
                </View>
              ))}
              {inventory.length > 28 ? <Text style={[s.small, s.muted]}>{t("more").replace("{n}", String(inventory.length - 28))}</Text> : null}
              <Text style={[s.label, { marginTop: 4 }]}>{t("attunement")}</Text>
              {[0, 1, 2].map((i) => (
                <View key={i} style={[s.row, { alignItems: "center", borderBottom: `0.4 solid #bbbbbb`, minHeight: 10 }]}>
                  <View style={[s.diamond, attuned[i] ? s.dotOn : {}]} />
                  <Text style={s.small}>{attuned[i]?.name || ""}</Text>
                </View>
              ))}
            </Box>
            <Box title={t("coins")}>
              <View style={s.row}>
                {([
                  ["CP", character.currency?.copper],
                  ["SP", character.currency?.silver],
                  ["EP", character.currency?.electrum],
                  ["GP", character.currency?.gold],
                  ["PP", character.currency?.platinum],
                ] as const).map(([k, v], i) => (
                  <View key={k} style={{ flex: 1, marginRight: i < 4 ? 3 : 0, alignItems: "center", border: `0.7 solid ${LINE}`, borderRadius: 3, paddingVertical: 2 }}>
                    <Text style={s.label}>{k}</Text>
                    <Text style={s.bold}>{v || 0}</Text>
                  </View>
                ))}
              </View>
            </Box>
          </View>
        </View>
      </Page>

      {/* ===== Overflow: full feature text, extra spells, long story ===== */}
      {features.length > 0 || spells.length > SPELL_ROWS || story.length > 0 ? (
        <Page size="A4" style={s.page} wrap>
          {features.length > 0 ? (
            <View>
              <Text style={[s.title, { textAlign: "left", fontSize: 9 }]}>{t("details")}</Text>
              {[
                [t("classFeatures"), classLines, features.filter((f) => classLines.some((c) => c.name === f.name))],
                [t("raceTraits"), raceLines, features.filter((f) => raceLines.some((c) => c.name === f.name))],
                [t("feats"), featLines, features.filter((f) => featLines.some((c) => c.name === f.name))],
              ].map(([title, lines, list]) =>
                (list as Character["features"]).length ? (
                  <View key={title as string} style={{ marginBottom: 6 }}>
                    <Text style={[s.label, { fontSize: 7, marginBottom: 3 }]}>{title as string}</Text>
                    {(list as Character["features"]).map((f, i) => {
                      const ln = (lines as FeatureLine[]).find((x) => x.name === f.name);
                      return (
                        <View key={`${f.id}-${i}`} style={{ marginBottom: 4 }} wrap={false}>
                          <Text style={s.bold}>
                            {f.name}
                            {ln?.picks?.length ? ` (${ln.picks.join(", ")})` : ""}
                          </Text>
                          <Text style={s.small}>{plain(f.description || f.summary)}</Text>
                        </View>
                      );
                    })}
                  </View>
                ) : null
              )}
            </View>
          ) : null}
          {spells.length > SPELL_ROWS ? (
            <View style={{ marginTop: 6 }}>
              <Text style={[s.title, { textAlign: "left", fontSize: 9 }]}>{t("spellsCont")}</Text>
              <SpellTableHead t={t} />
              {spells.slice(SPELL_ROWS).map((sp, i) => <SpellRow key={i} sp={sp} />)}
            </View>
          ) : null}
          {story.length > 0 ? (
            <View style={{ marginTop: 6 }}>
              <Text style={[s.title, { textAlign: "left", fontSize: 9 }]}>{t("story")}</Text>
              {story.map((x) => (
                <View key={x.label} style={{ marginBottom: 4 }}>
                  <Text style={s.bold}>{x.label}</Text>
                  <Text style={s.small}>{x.value}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </Page>
      ) : null}
    </Document>
  );
}

type SpellLine = { level: string; name: string; time: string; range: string; c: boolean; r: boolean; m: boolean; notes: string } | null;

function SpellTableHead({ t }: { t: (k: string) => string }) {
  return (
    <View style={s.tableHead}>
      <Text style={[s.label, s.cell, { width: 18 }]}>{t("lvlShort")}</Text>
      <Text style={[s.label, s.cell, { flex: 2.4 }]}>{t("name")}</Text>
      <Text style={[s.label, s.cell, { flex: 1.1 }]}>{t("castingTime")}</Text>
      <Text style={[s.label, s.cell, { flex: 1.1 }]}>{t("range")}</Text>
      <Text style={[s.label, s.cell, { width: 34 }]}>{t("crm")}</Text>
      <Text style={[s.label, s.cell, { flex: 1.4 }]}>{t("notes")}</Text>
    </View>
  );
}

function SpellRow({ sp }: { sp: SpellLine }) {
  return (
    <View style={s.tableRow} wrap={false}>
      <Text style={[s.cell, s.bold, { width: 18 }]}>{sp?.level || ""}</Text>
      <Text style={[[s.cell, s.bold, { flex: 2.4 }], { maxLines: 1, textOverflow: "ellipsis" }]}>{sp?.name || " "}</Text>
      <Text style={[[s.cell, s.small, { flex: 1.1 }], { maxLines: 1, textOverflow: "ellipsis" }]}>{sp?.time || ""}</Text>
      <Text style={[[s.cell, s.small, { flex: 1.1 }], { maxLines: 1, textOverflow: "ellipsis" }]}>{sp?.range || ""}</Text>
      <View style={[s.row, { width: 34 }]}>
        <View style={[s.diamond, sp?.c ? s.dotOn : {}]} />
        <View style={[s.diamond, sp?.r ? s.dotOn : {}]} />
        <View style={[s.diamond, sp?.m ? s.dotOn : {}]} />
      </View>
      <Text style={[[s.cell, s.small, { flex: 1.4 }], { maxLines: 1, textOverflow: "ellipsis" }]}>{sp?.notes || ""}</Text>
    </View>
  );
}

export { CharacterPdfDocument };

export async function exportCharacterToPdf(character: Character, language: PdfLanguage = "en"): Promise<void> {
  const doc = <CharacterPdfDocument character={character} language={language} />;
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(character.name || "unnamed").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "")}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
