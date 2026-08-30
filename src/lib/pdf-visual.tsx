"use client";

import { Document, Page, Text, View, StyleSheet, pdf, Font } from "@react-pdf/renderer";
import type { Character } from "./storage";
import { getModifier } from "./storage";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf", fontWeight: 700 },
  ],
});

const C = {
  bg: "#ffffff",
  surface: "#f8f8f8",
  border: "#e2e2e2",
  textPrimary: "#1a1a1a",
  textSecondary: "#555555",
  textMuted: "#999999",
  accent: "#722f37",
  success: "#16a34a",
  danger: "#dc2626",
  info: "#2563eb",
};

const styles = StyleSheet.create({
  page: {
    padding: "28 28 40 28",
    backgroundColor: C.bg,
    fontFamily: "Inter",
    fontSize: 10,
    color: C.textPrimary,
    position: "relative",
  },

  // Header
  header: { marginBottom: 10 },
  characterName: { fontSize: 20, fontWeight: 700, color: C.textPrimary, marginBottom: 3 },
  subtitle: { fontSize: 10, color: C.textSecondary, marginBottom: 3 },
  meta: { fontSize: 8, color: C.textMuted },

  divider: { height: 1, backgroundColor: "#e2e2e2", marginVertical: 8 },
  dividerAccent: { height: 2, backgroundColor: C.accent, marginBottom: 2 },

  sectionHeader: {
    fontSize: 10,
    fontWeight: 700,
    color: C.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },

  // Combat Stats
  combatGrid: { flexDirection: "row", gap: 6, marginBottom: 10 },
  combatBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: C.surface,
    borderRadius: 6,
    border: "1 solid #e8e8e8",
  },
  combatLabel: { fontSize: 7, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  combatValue: { fontSize: 18, fontWeight: 700, color: C.textPrimary, marginTop: 2 },
  combatSub: { fontSize: 9, color: C.textMuted },

  // HP Bar
  hpBarContainer: { marginBottom: 10 },
  hpBarLabel: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  hpBarBg: { height: 8, borderRadius: 4, backgroundColor: "#f0f0f0", border: "1 solid #e0e0e0", overflow: "hidden" },
  hpBarFill: { height: "100%", backgroundColor: C.success, borderRadius: 4 },

  // Ability Scores
  abilityGrid: { flexDirection: "row", gap: 6, marginBottom: 10 },
  abilityBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: C.surface,
    borderRadius: 6,
    border: "1 solid #e8e8e8",
  },
  abilityLabel: { fontSize: 7, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  abilityScore: { fontSize: 16, fontWeight: 700, color: C.textPrimary, marginVertical: 1 },
  abilityMod: { fontSize: 11, fontWeight: 600, color: C.accent },

  // Saves & Skills
  twoColGrid: { flexDirection: "row", flexWrap: "wrap", gap: 3, marginBottom: 10 },
  saveSkillRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: C.surface,
    borderRadius: 4,
    marginBottom: 3,
    border: "1 solid #e8e8e8",
  },
  saveSkillProf: { borderColor: C.accent },
  saveSkillLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5, border: "1.5 solid #d0d0d0" },
  dotProficient: { backgroundColor: C.accent, borderColor: C.accent },
  saveSkillName: { fontSize: 9, fontWeight: 600, color: C.textPrimary },
  saveSkillNameProf: { color: C.accent },
  saveSkillMod: { fontSize: 10, fontWeight: 700, color: C.textSecondary },
  saveSkillModProf: { color: C.accent },
  badgeExpert: { fontSize: 6, fontWeight: 700, color: C.danger, backgroundColor: C.danger + "15", paddingHorizontal: 3, paddingVertical: 1, borderRadius: 2 },

  // Cards
  card: { padding: 8, backgroundColor: C.surface, borderRadius: 6, border: "1 solid #e8e8e8", marginBottom: 4 },
  cardTitle: { fontSize: 10, fontWeight: 700, color: C.textPrimary, marginBottom: 2 },
  cardTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  cardDesc: { fontSize: 8, color: C.textSecondary, lineHeight: 1.5 },
  cardFeatureTitle: { fontSize: 9, fontWeight: 700, color: C.accent, marginBottom: 2 },

  // Badges
  badge: { fontSize: 7, fontWeight: 600, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
  badgeDamage: { color: C.info, backgroundColor: C.info + "15" },
  badgeSneak: { color: C.danger, backgroundColor: C.danger + "15" },

  // Inventory
  inventoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 3, marginBottom: 10 },
  inventoryItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: C.surface,
    borderRadius: 4,
    border: "1 solid #e8e8e8",
  },
  inventoryEquipped: { borderColor: C.success },
  inventoryName: { fontSize: 8, color: C.textPrimary },
  inventoryNameEquipped: { fontWeight: 600 },
  inventoryQty: { fontSize: 7, color: C.textMuted },
  equippedDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.success, marginRight: 3 },

  // Currency
  currencyRow: { flexDirection: "row", gap: 12, marginBottom: 10 },
  currencyItem: { fontSize: 8, fontWeight: 600, color: C.textSecondary },

  // Spellcasting
  spellcastGrid: { flexDirection: "row", gap: 6, marginBottom: 10 },
  spellcastBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: C.surface,
    borderRadius: 6,
    border: "1 solid #e8e8e8",
  },

  // Spell Slots
  spellSlotRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 10 },
  spellSlotBox: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: C.surface,
    borderRadius: 4,
    border: "1 solid #e8e8e8",
    alignItems: "center",
    minWidth: 45,
  },

  // Spells
  spellItem: {
    width: "48%",
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: C.surface,
    borderRadius: 4,
    border: "1 solid #e8e8e8",
    marginBottom: 3,
  },
  spellRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  spellName: { fontSize: 8, fontWeight: 600, color: C.textPrimary },
  spellLevel: { fontSize: 7, fontWeight: 600, color: C.textMuted },
  spellDamageBadge: { fontSize: 7, fontWeight: 600, color: C.info, backgroundColor: C.info + "15", paddingHorizontal: 3, paddingVertical: 1, borderRadius: 2, marginTop: 2 },

  // Bio
  bioSection: { marginBottom: 8 },
  bioLabel: { fontSize: 8, fontWeight: 700, color: C.textPrimary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  bioText: { fontSize: 8, color: C.textSecondary, lineHeight: 1.6 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 16,
    left: 28,
    right: 28,
    textAlign: "center",
    fontSize: 7,
    color: "#aaaaaa",
    borderTop: "1 solid #e8e8e8",
    paddingTop: 4,
  },
});

function CharacterPdfDocument({ character }: { character: Character }) {
  const profBonus = character.proficiencyBonus || 2;
  const abilityKeys = ["str", "dex", "con", "int", "wis", "cha"] as const;
  const abilityLabels = ["STR", "DEX", "CON", "INT", "WIS", "CHA"] as const;

  const skillsList = [
    { name: "Acrobatics", ability: "dex" }, { name: "Animal Handling", ability: "wis" }, { name: "Arcana", ability: "int" },
    { name: "Athletics", ability: "str" }, { name: "Deception", ability: "cha" }, { name: "History", ability: "int" },
    { name: "Insight", ability: "wis" }, { name: "Intimidation", ability: "cha" }, { name: "Investigation", ability: "int" },
    { name: "Medicine", ability: "wis" }, { name: "Nature", ability: "int" }, { name: "Perception", ability: "wis" },
    { name: "Performance", ability: "cha" }, { name: "Persuasion", ability: "cha" }, { name: "Religion", ability: "int" },
    { name: "Sleight of Hand", ability: "dex" }, { name: "Stealth", ability: "dex" }, { name: "Survival", ability: "wis" },
  ];

  const attacks = character.attacks.filter((a) => a.name);
  const features = character.features.filter((f) => f.name);
  const inventory = character.inventory.filter((item) => item.name);
  const spells = character.spells.filter((s) => s.name);
  const hasSpellcasting = !!character.spellcastingAbility;
  const hasSpellSlots = character.spellSlots && Object.keys(character.spellSlots).length > 0;

  const bioFields = [
    { label: "Appearance", value: character.appearance.characterAppearance },
    { label: "Personality", value: character.appearance.personality },
    { label: "Backstory", value: character.appearance.backstory },
    { label: "Allies & Organizations", value: character.appearance.alliesOrganizations },
    { label: "Additional Features", value: character.appearance.additionalFeaturesTraits },
    { label: "Treasure", value: character.appearance.treasure },
  ].filter((f) => f.value.trim());

  return (
    <Document
      title={character.name || "DND Wizard Character"}
      author="DND Wizard"
      subject="DND Wizard Character Sheet"
      keywords="dnd wizard character"
      creator="DND Wizard"
      producer="DND Wizard"
    >
      {/* ===== PAGE 1: Combat, Abilities, Saves, Skills ===== */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.characterName}>{character.name || "Unnamed Character"}</Text>
          <Text style={styles.subtitle}>
            {character.race} {character.class} Level {character.level}
            {character.subclass ? ` \u2022 ${character.subclass}` : ""}
          </Text>
          <Text style={styles.meta}>
            Background: {character.background || "\u2014"}  |  Alignment: {character.alignment || "\u2014"}  |  XP: {character.experiencePoints}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.dividerAccent} />

        {/* Combat Stats */}
        <View style={styles.combatGrid}>
          {[
            { label: "AC", value: `${character.ac}`, color: C.textPrimary },
            { label: "HP", value: `${character.currentHp}`, sub: `/${character.maxHp}`, color: C.success },
            { label: "Speed", value: `${character.speed}`, sub: "ft", color: C.textPrimary },
            { label: "Prof", value: `+${profBonus}`, color: C.textPrimary },
            { label: "Init", value: `${character.initiative >= 0 ? "+" : ""}${character.initiative}`, color: C.textPrimary },
          ].map((item) => (
            <View key={item.label} style={styles.combatBox}>
              <Text style={styles.combatLabel}>{item.label}</Text>
              <Text style={[styles.combatValue, { color: item.color }]}>{item.value}</Text>
              {item.sub && <Text style={styles.combatSub}>{item.sub}</Text>}
            </View>
          ))}
        </View>

        {/* HP Bar */}
        <View style={styles.hpBarContainer}>
          <View style={styles.hpBarLabel}>
            <Text style={styles.combatLabel}>Hit Points</Text>
            <Text style={styles.meta}>
              {character.currentHp} / {character.maxHp}
              {character.temporaryHp > 0 ? ` (+${character.temporaryHp} temp)` : ""}
            </Text>
          </View>
          <View style={styles.hpBarBg}>
            <View style={[styles.hpBarFill, { width: `${character.maxHp > 0 ? Math.min(100, Math.max(0, (character.currentHp / character.maxHp) * 100)) : 0}%` }]} />
          </View>
        </View>
        <View style={styles.divider} />

        {/* Ability Scores */}
        <Text style={styles.sectionHeader}>Ability Scores</Text>
        <View style={styles.abilityGrid}>
          {abilityKeys.map((key, idx) => {
            const score = character[key];
            const mod = getModifier(score);
            return (
              <View key={key} style={styles.abilityBox}>
                <Text style={styles.abilityLabel}>{abilityLabels[idx]}</Text>
                <Text style={styles.abilityScore}>{score}</Text>
                <Text style={styles.abilityMod}>{mod >= 0 ? `+${mod}` : mod}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.divider} />

        {/* Saving Throws */}
        <Text style={styles.sectionHeader}>Saving Throws</Text>
        <View style={styles.twoColGrid}>
          {abilityKeys.map((key) => {
            const st = character.savingThrows[key] ?? { proficient: false, value: 0 };
            return (
              <View key={key} style={[styles.saveSkillRow, { width: "48%" }, st.proficient ? styles.saveSkillProf : {}]}>
                <View style={styles.saveSkillLeft}>
                  <View style={[styles.dot, st.proficient ? styles.dotProficient : {}]} />
                  <Text style={[styles.saveSkillName, st.proficient ? styles.saveSkillNameProf : {}]}>{key.toUpperCase()}</Text>
                </View>
                <Text style={[styles.saveSkillMod, st.proficient ? styles.saveSkillModProf : {}]}>
                  {st.value >= 0 ? `+${st.value}` : st.value}
                </Text>
              </View>
            );
          })}
        </View>
        <View style={styles.divider} />

        {/* Skills */}
        <Text style={styles.sectionHeader}>Skills</Text>
        <View style={styles.twoColGrid}>
          {skillsList.map(({ name, ability }) => {
            const proficient = character.skills[name] ?? false;
            const expert = (character.expertise || []).includes(name);
            const profMultiplier = expert ? 2 : 1;
            const abilityScore = character[ability as keyof Character] as number;
            const mod = getModifier(abilityScore);
            const total = mod + (profBonus * profMultiplier);
            return (
              <View key={name} style={[styles.saveSkillRow, { width: "48%" }, proficient ? { borderColor: C.accent } : {}]}>
                <View style={styles.saveSkillLeft}>
                  <View style={[styles.dot, { borderRadius: 2 }, proficient ? styles.dotProficient : {}]} />
                  <Text style={styles.saveSkillName}>{name}</Text>
                  {expert && <Text style={styles.badgeExpert}>EXP</Text>}
                  <Text style={[styles.saveSkillName, { color: C.textMuted, fontSize: 7 }]}>{ability.toUpperCase()}</Text>
                </View>
                <Text style={[styles.saveSkillMod, proficient ? styles.saveSkillModProf : {}]}>
                  {total >= 0 ? `+${total}` : total}
                </Text>
              </View>
            );
          })}
        </View>
      </Page>

      {/* ===== PAGE 2: Attacks, Features, Inventory ===== */}
      <Page size="A4" style={styles.page}>
        {/* Attacks */}
        <Text style={styles.sectionHeader}>Attacks & Spellcasting</Text>
        {attacks.length > 0 ? (
          <View style={{ marginBottom: 10 }}>
            {attacks.map((attack) => (
              <View key={attack.id} style={styles.card}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>{attack.name}</Text>
                  <Text style={[styles.cardDesc, { color: C.textSecondary }]}>+{attack.attackBonus} to hit</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 4 }}>
                  {attack.damageType && <Text style={[styles.badge, styles.badgeDamage]}>{attack.damageType}</Text>}
                  {attack.sneakAttack && <Text style={[styles.badge, styles.badgeSneak]}>+{attack.sneakAttack} sneak</Text>}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.cardDesc, { marginBottom: 10 }]}>No attacks configured</Text>
        )}
        <View style={styles.divider} />

        {/* Features & Traits */}
        <Text style={styles.sectionHeader}>Features & Traits</Text>
        {features.length > 0 ? (
          <View style={{ marginBottom: 10 }}>
            {features.map((feature) => (
              <View key={feature.id} wrap={false} style={styles.card}>
                <Text style={styles.cardFeatureTitle}>{feature.name}</Text>
                {feature.description && <Text style={styles.cardDesc}>{feature.description}</Text>}
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.cardDesc, { marginBottom: 10 }]}>No features</Text>
        )}
        <View style={styles.divider} />

        {/* Inventory */}
        <Text style={styles.sectionHeader}>Inventory</Text>
        {inventory.length > 0 ? (
          <View style={styles.inventoryGrid}>
            {inventory.map((item) => (
              <View key={item.id} style={[styles.inventoryItem, item.equipped ? styles.inventoryEquipped : {}]}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {item.equipped && <View style={styles.equippedDot} />}
                  <Text style={[styles.inventoryName, item.equipped ? styles.inventoryNameEquipped : {}]}>{item.name}</Text>
                </View>
                <Text style={styles.inventoryQty}>x{item.quantity}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.cardDesc, { marginBottom: 10 }]}>No items</Text>
        )}
        <View style={styles.divider} />

        {/* Currency */}
        <Text style={styles.sectionHeader}>Currency</Text>
        <View style={styles.currencyRow}>
          {character.currency.platinum > 0 && <Text style={styles.currencyItem}>PP: {character.currency.platinum}</Text>}
          {character.currency.gold > 0 && <Text style={styles.currencyItem}>GP: {character.currency.gold}</Text>}
          {character.currency.electrum > 0 && <Text style={styles.currencyItem}>EP: {character.currency.electrum}</Text>}
          {character.currency.silver > 0 && <Text style={styles.currencyItem}>SP: {character.currency.silver}</Text>}
          {character.currency.copper > 0 && <Text style={styles.currencyItem}>CP: {character.currency.copper}</Text>}
          {character.currency.platinum === 0 && character.currency.gold === 0 && character.currency.electrum === 0 && character.currency.silver === 0 && character.currency.copper === 0 && (
            <Text style={styles.cardDesc}>No currency</Text>
          )}
        </View>
      </Page>

      {/* ===== PAGE 3: Spells, Bio ===== */}
      <Page size="A4" style={styles.page}>
        {/* Spellcasting */}
        {hasSpellcasting && (
          <>
            <Text style={styles.sectionHeader}>Spellcasting</Text>
            <View style={styles.spellcastGrid}>
              <View style={styles.spellcastBox}>
                <Text style={styles.combatLabel}>Spell Save DC</Text>
                <Text style={styles.combatValue}>
                  {8 + profBonus + getModifier(character[character.spellcastingAbility as keyof Character] as number)}
                </Text>
              </View>
              <View style={styles.spellcastBox}>
                <Text style={styles.combatLabel}>Spell Attack</Text>
                <Text style={styles.combatValue}>
                  +{profBonus + getModifier(character[character.spellcastingAbility as keyof Character] as number)}
                </Text>
              </View>
              <View style={styles.spellcastBox}>
                <Text style={styles.combatLabel}>Ability</Text>
                <Text style={[styles.combatValue, { color: C.accent }]}>
                  {character.spellcastingAbility.toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.divider} />
          </>
        )}

        {/* Spell Slots */}
        {hasSpellSlots && (
          <>
            <Text style={styles.sectionHeader}>Spell Slots</Text>
            <View style={styles.spellSlotRow}>
              {Object.entries(character.spellSlots).map(([level, count]) => {
                const expended = character.spellSlotsExpended?.[Number(level)] ?? 0;
                const remaining = (count as number) - expended;
                return (
                  <View key={level} style={styles.spellSlotBox}>
                    <Text style={styles.combatLabel}>Level {level}</Text>
                    <Text style={[styles.cardTitle, { fontSize: 11, marginTop: 1 }]}>
                      {remaining}<Text style={{ fontSize: 8, color: C.textMuted }}>/{count as number}</Text>
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.divider} />
          </>
        )}

        {/* Spells */}
        {spells.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Spells</Text>
            <View style={styles.twoColGrid}>
              {spells.map((spell) => (
                <View key={spell.id} style={styles.spellItem}>
                  <View style={styles.spellRow}>
                    <Text style={styles.spellName}>{spell.name}</Text>
                    <Text style={styles.spellLevel}>{spell.level === 0 ? "Cantrip" : `Lvl ${spell.level}`}</Text>
                  </View>
                  {(spell.damageDice || spell.damageType) && (
                    <Text style={styles.spellDamageBadge}>{spell.damageType} {spell.damageDice}</Text>
                  )}
                </View>
              ))}
            </View>
            <View style={styles.divider} />
          </>
        )}

        {/* Appearance & Bio */}
        <Text style={styles.sectionHeader}>Appearance & Bio</Text>
        <View>
          {bioFields.length > 0 ? (
            bioFields.map((field) => (
              <View key={field.label} wrap={false} style={styles.bioSection}>
                <Text style={styles.bioLabel}>{field.label}</Text>
                <Text style={styles.bioText}>{field.value}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.cardDesc}>No bio information</Text>
          )}
        </View>

        {/* Other Proficiencies */}
        {character.otherProficiencies ? (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionHeader}>Other Proficiencies & Languages</Text>
            <Text style={styles.bioText}>{character.otherProficiencies}</Text>
          </>
        ) : null}

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by DND Wizard \u2022 {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
        </Text>
      </Page>
    </Document>
  );
}

export async function exportCharacterToPdf(character: Character): Promise<void> {
  const doc = <CharacterPdfDocument character={character} />;
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(character.name || "unnamed").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "")}.pdf`;
  link.click();
  URL.revokeObjectURL(url);
}
