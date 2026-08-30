"use client";

import { Document, Page, Text, View, StyleSheet, pdf, Font, Svg, Path, Rect, Circle } from "@react-pdf/renderer";
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

function ShieldIcon({ size = 32, color = C.accent }: { size?: number; color?: string }) {
  return (
    <Svg viewBox="0 0 100 120" width={size} height={size * 1.2}>
      <Path
        d="M50 5 L90 20 L90 55 C90 80 50 115 50 115 C50 115 10 80 10 55 L10 20 Z"
        fill={C.surface}
        stroke={color}
        strokeWidth={3}
      />
      <Path
        d="M50 18 L78 28 L78 55 C78 72 50 98 50 98 C50 98 22 72 22 55 L22 28 Z"
        fill="none"
        stroke={C.border}
        strokeWidth={1}
      />
    </Svg>
  );
}

function SpeedIcon({ size = 32, color = C.accent }: { size?: number; color?: string }) {
  return (
    <Svg viewBox="0 0 100 120" width={size} height={size * 1.2}>
      <Path
        d="M55 5 L25 60 L45 60 L40 95 L75 40 L52 40 Z"
        fill={C.surface}
        stroke={color}
        strokeWidth={3}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HeartIcon({ size = 32, color = C.danger }: { size?: number; color?: string }) {
  return (
    <Svg viewBox="0 0 100 120" width={size} height={size * 1.2}>
      <Path
        d="M50 90 C20 65 5 50 5 35 C5 20 18 10 32 10 C42 10 48 16 50 20 C52 16 58 10 68 10 C82 10 95 20 95 35 C95 50 80 65 50 90 Z"
        fill={C.surface}
        stroke={color}
        strokeWidth={3}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  page: {
    padding: "24 24 36 24",
    backgroundColor: C.bg,
    fontFamily: "Inter",
    fontSize: 10,
    color: C.textPrimary,
    position: "relative",
  },

  // Header
  header: {
    marginBottom: 12,
    borderBottom: `2px solid ${C.accent}`,
    paddingBottom: 8,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  characterName: {
    fontSize: 24,
    fontWeight: 700,
    color: C.textPrimary,
  },
  characterSubtitle: {
    fontSize: 11,
    color: C.textSecondary,
    marginTop: 2,
  },
  headerBadges: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  badge: {
    fontSize: 8,
    fontWeight: 600,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeRace: { color: C.info, backgroundColor: C.info + "15" },
  badgeClass: { color: C.textPrimary, backgroundColor: C.textPrimary + "10" },
  badgeLevel: { color: C.accent, backgroundColor: C.accent + "15" },
  badgeSubclass: { color: C.textSecondary, backgroundColor: C.surface },
  headerMeta: {
    fontSize: 8,
    color: C.textMuted,
    marginTop: 4,
  },

  // Section Header
  sectionHeader: {
    fontSize: 10,
    fontWeight: 700,
    color: C.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
    borderBottom: `1.5px solid ${C.accent}`,
    paddingBottom: 3,
  },

  // Combat Stats - 3 inline boxes with icons
  combatRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    justifyContent: "center",
  },
  combatBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: C.surface,
    borderRadius: 10,
    border: `1.5px solid ${C.accent}`,
    minWidth: 80,
  },
  combatBoxSecondary: {
    borderColor: C.border,
  },
  combatBoxDanger: {
    borderColor: C.danger,
  },
  combatIcon: {
    marginBottom: 4,
  },
  combatLabel: {
    fontSize: 7,
    fontWeight: 600,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  combatValue: {
    fontSize: 18,
    fontWeight: 700,
    color: C.textPrimary,
  },
  combatValueDanger: {
    color: C.danger,
  },
  combatSub: {
    fontSize: 8,
    color: C.textMuted,
  },

  // Ability Scores - 3 col grid
  abilityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  abilityBox: {
    width: "31.5%",
    alignItems: "center",
    paddingVertical: 8,
    backgroundColor: C.surface,
    borderRadius: 8,
    border: "1 solid #e8e8e8",
  },
  abilityLabel: {
    fontSize: 8,
    fontWeight: 600,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  abilityMod: {
    fontSize: 18,
    fontWeight: 700,
    color: C.textPrimary,
    marginVertical: 1,
  },
  abilityScore: {
    fontSize: 9,
    fontWeight: 600,
    color: C.textSecondary,
  },

  // Saving Throws
  savesSection: {
    marginBottom: 10,
  },
  saveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: C.surface,
    borderRadius: 4,
    marginBottom: 2,
    border: "1 solid #e8e8e8",
  },
  saveRowProf: {
    borderColor: C.accent,
  },
  saveLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  saveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    border: "1.5 solid #d0d0d0",
  },
  saveDotProf: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  saveName: {
    fontSize: 9,
    fontWeight: 600,
    color: C.textPrimary,
  },
  saveNameProf: {
    color: C.accent,
  },
  saveMod: {
    fontSize: 10,
    fontWeight: 700,
    color: C.textSecondary,
  },
  saveModProf: {
    color: C.accent,
  },

  // Skills - 2 col grid
  skillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
  },
  skillItem: {
    width: "48.5%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: C.surface,
    borderRadius: 4,
    border: "1 solid #e8e8e8",
  },
  skillProf: {
    borderColor: C.accent,
  },
  skillLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  skillDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
    border: "1.5 solid #d0d0d0",
  },
  skillDotProf: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  skillName: {
    fontSize: 8,
    fontWeight: 400,
    color: C.textPrimary,
  },
  skillNameProf: {
    fontWeight: 600,
  },
  skillInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  skillAbility: {
    fontSize: 7,
    color: C.textMuted,
  },
  skillTotal: {
    fontSize: 9,
    fontWeight: 700,
    color: C.textSecondary,
  },
  skillTotalProf: {
    color: C.accent,
  },
  skillExpert: {
    fontSize: 6,
    fontWeight: 700,
    color: C.danger,
    backgroundColor: C.danger + "15",
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
  },

  // Cards for attacks/features
  card: {
    padding: 8,
    backgroundColor: C.surface,
    borderRadius: 6,
    border: "1 solid #e8e8e8",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: C.textPrimary,
    marginBottom: 2,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 8,
    color: C.textSecondary, lineHeight: 1.5,
  },
  cardFeatureTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: C.accent,
    marginBottom: 2,
  },

  // Badges
  attackBadge: {
    fontSize: 7,
    fontWeight: 600,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  badgeDamage: { color: C.info, backgroundColor: C.info + "15" },
  badgeSneak: { color: C.danger, backgroundColor: C.danger + "15" },

  // Inventory
  inventoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    marginBottom: 10,
  },
  inventoryItem: {
    width: "48.5%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: C.surface,
    borderRadius: 4,
    border: "1 solid #e8e8e8",
  },
  inventoryEquipped: {
    borderColor: C.success,
  },
  inventoryName: {
    fontSize: 8,
    color: C.textPrimary,
  },
  inventoryNameEquipped: {
    fontWeight: 600,
  },
  inventoryQty: {
    fontSize: 7,
    color: C.textMuted,
  },
  equippedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.success,
    marginRight: 3,
  },

  // Currency
  currencyRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  currencyItem: {
    fontSize: 8,
    fontWeight: 600,
    color: C.textSecondary,
  },

  // Spellcasting
  spellcastGrid: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 10,
  },
  spellcastBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: C.surface,
    borderRadius: 6,
    border: "1 solid #e8e8e8",
  },
  spellcastLabel: {
    fontSize: 7,
    fontWeight: 600,
    color: C.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  spellcastValue: {
    fontSize: 16,
    fontWeight: 700,
    color: C.textPrimary,
    marginTop: 2,
  },

  // Spell Slots
  spellSlotRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 10,
  },
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
    width: "48.5%",
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: C.surface,
    borderRadius: 4,
    border: "1 solid #e8e8e8",
    marginBottom: 3,
  },
  spellRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  spellName: {
    fontSize: 8,
    fontWeight: 600,
    color: C.textPrimary,
  },
  spellLevel: {
    fontSize: 7,
    fontWeight: 600,
    color: C.textMuted,
  },
  spellDamageBadge: {
    fontSize: 7,
    fontWeight: 600,
    color: C.info,
    backgroundColor: C.info + "15",
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 2,
    marginTop: 2,
  },

  // Bio
  bioSection: {
    marginBottom: 8,
  },
  bioLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: C.textPrimary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  bioText: {
    fontSize: 8,
    color: C.textSecondary,
    lineHeight: 1.6,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 12,
    left: 24,
    right: 24,
    textAlign: "center",
    fontSize: 6,
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
      {/* ===== PAGE 1: Header, Combat, Abilities, Saves, Skills ===== */}
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.characterName}>{character.name || "Unnamed Character"}</Text>
              <Text style={styles.characterSubtitle}>
                {character.race} {character.class} Level {character.level}
                {character.subclass ? ` \u2022 ${character.subclass}` : ""}
              </Text>
            </View>
          </View>
          <View style={styles.headerBadges}>
            {character.race && <Text style={[styles.badge, styles.badgeRace]}>{character.race}</Text>}
            {character.class && <Text style={[styles.badge, styles.badgeClass]}>{character.class}</Text>}
            <Text style={[styles.badge, styles.badgeLevel]}>Level {character.level}</Text>
            {character.subclass && <Text style={[styles.badge, styles.badgeSubclass]}>{character.subclass}</Text>}
          </View>
          <Text style={styles.headerMeta}>
            Background: {character.background || "\u2014"}  |  Alignment: {character.alignment || "\u2014"}  |  XP: {character.experiencePoints}
          </Text>
        </View>

        {/* Combat Stats: 3 inline boxes with icons */}
        <View style={styles.combatRow}>
          {/* AC */}
          <View style={styles.combatBox}>
            <View style={styles.combatIcon}>
              <ShieldIcon size={28} color={C.accent} />
            </View>
            <Text style={styles.combatLabel}>AC</Text>
            <Text style={styles.combatValue}>{character.ac}</Text>
          </View>

          {/* Speed */}
          <View style={[styles.combatBox, styles.combatBoxSecondary]}>
            <View style={styles.combatIcon}>
              <SpeedIcon size={28} color={C.accent} />
            </View>
            <Text style={styles.combatLabel}>Speed</Text>
            <Text style={styles.combatValue}>{character.speed}<Text style={styles.combatSub}> ft</Text></Text>
          </View>

          {/* HP */}
          <View style={[styles.combatBox, styles.combatBoxDanger]}>
            <View style={styles.combatIcon}>
              <HeartIcon size={28} color={C.danger} />
            </View>
            <Text style={styles.combatLabel}>HP</Text>
            <Text style={[styles.combatValue, styles.combatValueDanger]}>{character.currentHp}<Text style={styles.combatSub}>/{character.maxHp}</Text></Text>
          </View>
        </View>

        {/* Ability Scores - 3 column grid */}
        <Text style={styles.sectionHeader}>Stats</Text>
        <View style={styles.abilityGrid}>
          {abilityKeys.map((key, idx) => {
            const score = character[key];
            const mod = getModifier(score);
            return (
              <View key={key} style={styles.abilityBox}>
                <Text style={styles.abilityLabel}>{abilityLabels[idx]}</Text>
                <Text style={styles.abilityMod}>{mod >= 0 ? `+${mod}` : mod}</Text>
                <Text style={styles.abilityScore}>{score}</Text>
              </View>
            );
          })}
        </View>

        {/* Saving Throws */}
        <View style={styles.savesSection}>
          <Text style={styles.sectionHeader}>Saving Throws</Text>
          {abilityKeys.map((key) => {
            const st = character.savingThrows[key] ?? { proficient: false, value: 0 };
            return (
              <View key={key} wrap={false} style={[styles.saveRow, st.proficient ? styles.saveRowProf : {}]}>
                <View style={styles.saveLeft}>
                  <View style={[styles.saveDot, st.proficient ? styles.saveDotProf : {}]} />
                  <Text style={[styles.saveName, st.proficient ? styles.saveNameProf : {}]}>{key.toUpperCase()}</Text>
                  <Text style={{ fontSize: 8, color: C.textMuted }}>
                    {getModifier(character[key]) >= 0 ? `+${getModifier(character[key])}` : getModifier(character[key])}
                  </Text>
                </View>
                <Text style={[styles.saveMod, st.proficient ? styles.saveModProf : {}]}>
                  {st.value >= 0 ? `+${st.value}` : st.value}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Skills */}
        <Text style={styles.sectionHeader}>Skills</Text>
        <View style={styles.skillsGrid}>
          {skillsList.map(({ name, ability }) => {
            const proficient = character.skills[name] ?? false;
            const expert = (character.expertise || []).includes(name);
            const profMultiplier = expert ? 2 : 1;
            const abilityScore = character[ability as keyof Character] as number;
            const mod = getModifier(abilityScore);
            const total = mod + (proficient ? profBonus * profMultiplier : 0);
            return (
              <View key={name} style={[styles.skillItem, proficient ? styles.skillProf : {}]}>
                <View style={styles.skillLeft}>
                  <View style={[styles.skillDot, proficient ? styles.skillDotProf : {}]} />
                  <Text style={[styles.skillName, proficient ? styles.skillNameProf : {}]}>{name}</Text>
                  {expert && <Text style={styles.skillExpert}>EXP</Text>}
                </View>
                <View style={styles.skillInfo}>
                  <Text style={styles.skillAbility}>{ability.toUpperCase()} {mod >= 0 ? `+${mod}` : mod}</Text>
                  <Text style={[styles.skillTotal, proficient ? styles.skillTotalProf : {}]}>
                    {total >= 0 ? `+${total}` : total}
                  </Text>
                </View>
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
              <View key={attack.id} wrap={false} style={styles.card}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>{attack.name}</Text>
                  <Text style={[styles.cardDesc, { color: C.textSecondary }]}>+{attack.attackBonus} to hit</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 4 }}>
                  {attack.damageType && <Text style={[styles.attackBadge, styles.badgeDamage]}>{attack.damageType}</Text>}
                  {attack.sneakAttack && <Text style={[styles.attackBadge, styles.badgeSneak]}>+{attack.sneakAttack} sneak</Text>}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.cardDesc, { marginBottom: 10 }]}>No attacks configured</Text>
        )}

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
                <Text style={styles.spellcastLabel}>Spell Save DC</Text>
                <Text style={styles.spellcastValue}>
                  {8 + profBonus + getModifier(character[character.spellcastingAbility as keyof Character] as number)}
                </Text>
              </View>
              <View style={styles.spellcastBox}>
                <Text style={styles.spellcastLabel}>Spell Attack</Text>
                <Text style={styles.spellcastValue}>
                  +{profBonus + getModifier(character[character.spellcastingAbility as keyof Character] as number)}
                </Text>
              </View>
              <View style={styles.spellcastBox}>
                <Text style={styles.spellcastLabel}>Ability</Text>
                <Text style={[styles.spellcastValue, { color: C.accent }]}>
                  {character.spellcastingAbility.toUpperCase()}
                </Text>
              </View>
            </View>
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
                    <Text style={styles.spellcastLabel}>Level {level}</Text>
                    <Text style={[styles.cardTitle, { fontSize: 11, marginTop: 1 }]}>
                      {remaining}<Text style={{ fontSize: 8, color: C.textMuted }}>/{count as number}</Text>
                    </Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Spells */}
        {spells.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Spells</Text>
            <View style={styles.skillsGrid}>
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
