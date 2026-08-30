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

const styles = StyleSheet.create({
  page: {
    padding: 32,
    backgroundColor: "#ffffff",
    fontFamily: "Inter",
    fontSize: 10,
    color: "#1a1a1a",
  },

  // Header
  header: {
    marginBottom: 12,
  },
  characterName: {
    fontSize: 22,
    fontWeight: 700,
    color: "#1a1a1a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#555555",
    marginBottom: 4,
  },
  meta: {
    fontSize: 9,
    color: "#888888",
  },

  // Dividers
  divider: {
    height: 1,
    backgroundColor: "#e2e2e2",
    marginVertical: 10,
  },
  dividerAccent: {
    height: 2,
    backgroundColor: "#722f37",
    marginBottom: 2,
  },

  // Section Headers
  sectionHeader: {
    fontSize: 11,
    fontWeight: 700,
    color: "#722f37",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 8,
  },

  // Combat Stats Row
  combatGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  combatBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    border: "1 solid #e8e8e8",
  },
  combatLabel: {
    fontSize: 8,
    fontWeight: 600,
    color: "#999999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  combatValue: {
    fontSize: 20,
    fontWeight: 700,
    color: "#1a1a1a",
    marginTop: 2,
  },
  combatSub: {
    fontSize: 10,
    color: "#888888",
  },

  // HP Bar
  hpBarContainer: {
    marginBottom: 12,
  },
  hpBarLabel: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  hpBarBg: {
    height: 10,
    borderRadius: 5,
    backgroundColor: "#f0f0f0",
    border: "1 solid #e0e0e0",
    overflow: "hidden",
  },
  hpBarFill: {
    height: "100%",
    backgroundColor: "#16a34a",
    borderRadius: 5,
  },

  // Ability Scores
  abilityGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  abilityBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    border: "1 solid #e8e8e8",
  },
  abilityLabel: {
    fontSize: 8,
    fontWeight: 600,
    color: "#999999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  abilityScore: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1a1a1a",
    marginVertical: 2,
  },
  abilityMod: {
    fontSize: 12,
    fontWeight: 600,
    color: "#722f37",
  },

  // Saving Throws & Skills
  saveSkillRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 6,
    marginBottom: 4,
    border: "1 solid #e8e8e8",
  },
  saveSkillProf: {
    border: "1 solid #722f37",
  },
  saveSkillLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    border: "1.5 solid #d0d0d0",
  },
  dotProficient: {
    backgroundColor: "#722f37",
    borderColor: "#722f37",
  },
  saveSkillName: {
    fontSize: 10,
    fontWeight: 600,
    color: "#1a1a1a",
  },
  saveSkillMod: {
    fontSize: 11,
    fontWeight: 700,
    color: "#555555",
  },
  saveSkillModProf: {
    color: "#722f37",
  },

  // Two column grid for saves/skills
  twoColGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 12,
  },
  twoColItem: {
    width: "48%",
  },

  // Attacks & Features
  card: {
    padding: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 6,
    border: "1 solid #e8e8e8",
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#1a1a1a",
    marginBottom: 2,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 9,
    color: "#555555",
    lineHeight: 1.5,
  },
  cardFeatureTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#722f37",
    marginBottom: 2,
  },

  // Badges
  badge: {
    fontSize: 8,
    fontWeight: 600,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeDamage: {
    color: "#2563eb",
    backgroundColor: "#2563eb15",
  },
  badgeSneak: {
    color: "#dc2626",
    backgroundColor: "#dc262615",
  },
  badgeExpert: {
    color: "#dc2626",
    backgroundColor: "#dc262615",
    fontSize: 7,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },

  // Inventory
  inventoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 12,
  },
  inventoryItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 4,
    border: "1 solid #e8e8e8",
  },
  inventoryEquipped: {
    borderColor: "#16a34a",
  },
  inventoryName: {
    fontSize: 9,
    color: "#1a1a1a",
  },
  inventoryQty: {
    fontSize: 8,
    color: "#888888",
  },
  equippedDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#16a34a",
    marginRight: 4,
  },

  // Currency
  currencyRow: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  currencyItem: {
    fontSize: 9,
    fontWeight: 600,
    color: "#555555",
  },

  // Spellcasting
  spellcastGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  spellcastBox: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 6,
    backgroundColor: "#f8f8f8",
    borderRadius: 8,
    border: "1 solid #e8e8e8",
  },

  // Spell Slots
  spellSlotRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  spellSlotBox: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 6,
    border: "1 solid #e8e8e8",
    alignItems: "center",
    minWidth: 50,
  },

  // Spells
  spellItem: {
    width: "48%",
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#f8f8f8",
    borderRadius: 4,
    border: "1 solid #e8e8e8",
    marginBottom: 4,
  },
  spellRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  spellName: {
    fontSize: 9,
    fontWeight: 600,
    color: "#1a1a1a",
  },
  spellLevel: {
    fontSize: 8,
    fontWeight: 600,
    color: "#888888",
  },
  spellDamage: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  spellDamageBadge: {
    fontSize: 8,
    fontWeight: 600,
    color: "#2563eb",
    backgroundColor: "#2563eb15",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },

  // Bio
  bioSection: {
    marginBottom: 12,
  },
  bioLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: "#1a1a1a",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  bioText: {
    fontSize: 9,
    color: "#555555",
    lineHeight: 1.6,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 20,
    left: 32,
    right: 32,
    textAlign: "center",
    fontSize: 7,
    color: "#aaaaaa",
    borderTop: "1 solid #e8e8e8",
    paddingTop: 6,
  },
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
  warning: "#ea580c",
  info: "#2563eb",
};

const DND_MARKER = "DND_WIZARD_CHARACTER_DATA";

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
      <Page size="A4" style={styles.page} wrap>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.characterName}>{character.name || "Unnamed Character"}</Text>
          <Text style={styles.subtitle}>
            {character.race} {character.class} Level {character.level}
            {character.subclass ? ` • ${character.subclass}` : ""}
          </Text>
          <Text style={styles.meta}>
            Background: {character.background || "—"}  |  Alignment: {character.alignment || "—"}  |  XP: {character.experiencePoints}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.dividerAccent} />

        {/* Combat Stats */}
        <View style={styles.combatGrid}>
          {[
            { label: "AC", value: `${character.ac}` },
            { label: "HP", value: `${character.currentHp}`, sub: `/${character.maxHp}`, color: C.success },
            { label: "Speed", value: `${character.speed}`, sub: "ft" },
            { label: "Prof", value: `+${profBonus}` },
            { label: "Init", value: `${character.initiative >= 0 ? "+" : ""}${character.initiative}` },
          ].map((item) => (
            <View key={item.label} style={styles.combatBox}>
              <Text style={styles.combatLabel}>{item.label}</Text>
              <Text style={[styles.combatValue, item.color ? { color: item.color } : {}]}>{item.value}</Text>
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
              <View key={key} style={[styles.saveSkillRow, styles.twoColItem, st.proficient ? styles.saveSkillProf : {}]}>
                <View style={styles.saveSkillLeft}>
                  <View style={[styles.dot, st.proficient ? styles.dotProficient : {}]} />
                  <Text style={[styles.saveSkillName, st.proficient ? { color: C.accent } : {}]}>{key.toUpperCase()}</Text>
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
              <View key={name} style={[styles.saveSkillRow, styles.twoColItem, proficient ? { borderColor: "#722f37" } : {}]}>
                <View style={styles.saveSkillLeft}>
                  <View style={[styles.dot, { borderRadius: 2 }, proficient ? styles.dotProficient : {}]} />
                  <Text style={styles.saveSkillName}>{name}</Text>
                  {expert && <Text style={styles.badgeExpert}>EXP</Text>}
                  <Text style={[styles.saveSkillName, { color: C.textMuted, fontSize: 8 }]}>{ability.toUpperCase()}</Text>
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
      <Page size="A4" style={styles.page} wrap>
        {/* Attacks */}
        <Text style={styles.sectionHeader}>Attacks & Spellcasting</Text>
        {character.attacks.filter((a) => a.name).length > 0 ? (
          <View style={{ marginBottom: 12 }}>
            {character.attacks.filter((a) => a.name).map((attack) => (
              <View key={attack.id} style={styles.card}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.cardTitle}>{attack.name}</Text>
                  <Text style={[styles.cardDesc, { color: C.textSecondary }]}>+{attack.attackBonus} to hit</Text>
                </View>
                <View style={{ flexDirection: "row", gap: 6 }}>
                  {attack.damageType && (
                    <Text style={[styles.badge, styles.badgeDamage]}>{attack.damageType}</Text>
                  )}
                  {attack.sneakAttack && (
                    <Text style={[styles.badge, styles.badgeSneak]}>+{attack.sneakAttack} sneak</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.cardDesc, { marginBottom: 12 }]}>No attacks configured</Text>
        )}
        <View style={styles.divider} />

        {/* Features & Traits */}
        <Text style={styles.sectionHeader}>Features & Traits</Text>
        {character.features.filter((f) => f.name).length > 0 ? (
          <View style={{ marginBottom: 12 }}>
            {character.features.filter((f) => f.name).map((feature) => (
              <View key={feature.id} style={styles.card}>
                <Text style={styles.cardFeatureTitle}>{feature.name}</Text>
                {feature.description && <Text style={styles.cardDesc}>{feature.description}</Text>}
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.cardDesc, { marginBottom: 12 }]}>No features</Text>
        )}
        <View style={styles.divider} />

        {/* Inventory */}
        <Text style={styles.sectionHeader}>Inventory</Text>
        {character.inventory.filter((item) => item.name).length > 0 ? (
          <View style={styles.inventoryGrid}>
            {character.inventory.filter((item) => item.name).map((item) => (
              <View key={item.id} style={[styles.inventoryItem, item.equipped ? styles.inventoryEquipped : {}]}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  {item.equipped && <View style={styles.equippedDot} />}
                  <Text style={[styles.inventoryName, item.equipped ? { fontWeight: 600 } : {}]}>{item.name}</Text>
                </View>
                <Text style={styles.inventoryQty}>x{item.quantity}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.cardDesc, { marginBottom: 12 }]}>No items</Text>
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
      <Page size="A4" style={styles.page} wrap>
        {/* Spellcasting */}
        {character.spellcastingAbility && (
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
        {character.spellSlots && Object.keys(character.spellSlots).length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Spell Slots</Text>
            <View style={styles.spellSlotRow}>
              {Object.entries(character.spellSlots).map(([level, count]) => {
                const expended = character.spellSlotsExpended?.[Number(level)] ?? 0;
                const remaining = (count as number) - expended;
                return (
                  <View key={level} style={styles.spellSlotBox}>
                    <Text style={styles.combatLabel}>Level {level}</Text>
                    <Text style={[styles.cardTitle, { fontSize: 12, marginTop: 2 }]}>
                      {remaining}<Text style={{ fontSize: 9, color: C.textMuted }}>/{count as number}</Text>
                    </Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.divider} />
          </>
        )}

        {/* Spells */}
        {character.spells.filter((s) => s.name).length > 0 && (
          <>
            <Text style={styles.sectionHeader}>Spells</Text>
            <View style={styles.twoColGrid}>
              {character.spells.filter((s) => s.name).map((spell) => (
                <View key={spell.id} style={styles.spellItem}>
                  <View style={styles.spellRow}>
                    <Text style={styles.spellName}>{spell.name}</Text>
                    <Text style={styles.spellLevel}>{spell.level === 0 ? "Cantrip" : `Lvl ${spell.level}`}</Text>
                  </View>
                  {(spell.damageDice || spell.damageType) && (
                    <View style={styles.spellDamage}>
                      {spell.damageType && (
                        <Text style={styles.spellDamageBadge}>
                          {spell.damageType} {spell.damageDice}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
            <View style={styles.divider} />
          </>
        )}

        {/* Appearance & Bio */}
        <Text style={styles.sectionHeader}>Appearance & Bio</Text>
        <View style={styles.bioSection}>
          {[
            { label: "Appearance", value: character.appearance.characterAppearance },
            { label: "Personality", value: character.appearance.personality },
            { label: "Backstory", value: character.appearance.backstory },
            { label: "Allies & Organizations", value: character.appearance.alliesOrganizations },
            { label: "Additional Features", value: character.appearance.additionalFeaturesTraits },
            { label: "Treasure", value: character.appearance.treasure },
          ].map(({ label, value }) =>
            value.trim() ? (
              <View key={label} style={{ marginBottom: 8 }}>
                <Text style={styles.bioLabel}>{label}</Text>
                <Text style={styles.bioText}>{value}</Text>
              </View>
            ) : null
          )}
          {!character.appearance.characterAppearance.trim() && !character.appearance.personality.trim() && !character.appearance.backstory.trim() && (
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
          Generated by DND Wizard • {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
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
