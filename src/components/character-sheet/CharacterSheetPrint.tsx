"use client";

import type { Character } from "@/lib/storage";
import { getModifier, getProficiencyBonus } from "@/lib/storage";
import { getDamageTypeColor, getDamageTypeBgColor } from "./DamageBadge";

interface CharacterSheetPrintProps {
  character: Character;
}

const PAGE_WIDTH = 710;
const MARGIN = 0;

const S = {
  bg: "#ffffff",
  surface: "#f8f8f8",
  border: "#e2e2e2",
  borderLight: "#eeeeee",
  textPrimary: "#1a1a1a",
  textSecondary: "#555555",
  textMuted: "#999999",
  accent: "#722f37",
  accentLight: "#722f3715",
  success: "#16a34a",
  danger: "#dc2626",
  warning: "#ea580c",
  info: "#2563eb",
};

function Divider() {
  return (
    <div style={{ height: 1, backgroundColor: S.border, margin: "12px 0" }} />
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-pdf-page
      style={{
        width: PAGE_WIDTH,
        minHeight: 900,
        backgroundColor: S.bg,
        padding: 28,
        boxSizing: "border-box" as const,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        position: "relative" as const,
        overflow: "hidden" as const,
        marginBottom: 20,
      }}
    >
      {children}
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11,
      fontWeight: 700,
      color: S.accent,
      textTransform: "uppercase" as const,
      letterSpacing: "0.08em",
      marginBottom: 10,
      borderBottom: `2px solid ${S.accent}`,
      paddingBottom: 4,
    }}>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <span style={{ fontSize: 9, fontWeight: 600, color: S.textMuted, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>{children}</span>;
}

function Value({ children, size = 11, color = S.textPrimary, weight = 400 }: { children: React.ReactNode; size?: number; color?: string; weight?: number }) {
  return <span style={{ fontSize: size, color, fontWeight: weight, lineHeight: 1.4 }}>{children}</span>;
}

export function CharacterSheetPrint({ character }: CharacterSheetPrintProps) {
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
    <div>
      {/* ===== PAGE 1: Header, Combat, Abilities, Saves, Skills ===== */}
      <Page>
        {/* Header */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: S.textPrimary, marginBottom: 4 }}>
            {character.name || "Unnamed Character"}
          </div>
          <div style={{ fontSize: 11, color: S.textSecondary, marginBottom: 8 }}>
            {character.race} • {character.class} • Level {character.level}
            {character.subclass && <span style={{ color: S.accent, fontWeight: 600 }}> • {character.subclass}</span>}
          </div>
          <div style={{ fontSize: 10, color: S.textMuted }}>
            Background: {character.background || "—"}  |  Alignment: {character.alignment || "—"}  |  XP: {character.experiencePoints}
          </div>
        </div>
        <Divider />

        {/* Combat Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
          <div style={{ textAlign: "center", padding: "10px 6px", backgroundColor: S.surface, borderRadius: 8, border: `1px solid ${S.borderLight}` }}>
            <Label>AC</Label>
            <div style={{ fontSize: 22, fontWeight: 700, color: S.textPrimary, marginTop: 2 }}>{character.ac}</div>
          </div>
          <div style={{ textAlign: "center", padding: "10px 6px", backgroundColor: S.surface, borderRadius: 8, border: `1px solid ${S.borderLight}` }}>
            <Label>HP</Label>
            <div style={{ fontSize: 22, fontWeight: 700, color: S.success, marginTop: 2 }}>{character.currentHp}<span style={{ fontSize: 12, color: S.textMuted }}>/{character.maxHp}</span></div>
          </div>
          <div style={{ textAlign: "center", padding: "10px 6px", backgroundColor: S.surface, borderRadius: 8, border: `1px solid ${S.borderLight}` }}>
            <Label>Speed</Label>
            <div style={{ fontSize: 22, fontWeight: 700, color: S.textPrimary, marginTop: 2 }}>{character.speed}<span style={{ fontSize: 10, color: S.textMuted }}> ft</span></div>
          </div>
          <div style={{ textAlign: "center", padding: "10px 6px", backgroundColor: S.surface, borderRadius: 8, border: `1px solid ${S.borderLight}` }}>
            <Label>Prof Bonus</Label>
            <div style={{ fontSize: 22, fontWeight: 700, color: S.textPrimary, marginTop: 2 }}>+{profBonus}</div>
          </div>
          <div style={{ textAlign: "center", padding: "10px 6px", backgroundColor: S.surface, borderRadius: 8, border: `1px solid ${S.borderLight}` }}>
            <Label>Initiative</Label>
            <div style={{ fontSize: 22, fontWeight: 700, color: S.textPrimary, marginTop: 2 }}>{character.initiative >= 0 ? `+${character.initiative}` : character.initiative}</div>
          </div>
        </div>

        {/* HP Bar */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <Label>Hit Points</Label>
            <span style={{ fontSize: 9, fontWeight: 600, color: S.textMuted }}>{character.currentHp} / {character.maxHp} {character.temporaryHp > 0 && <span style={{ color: S.info }}>(+{character.temporaryHp} temp)</span>}</span>
          </div>
          <div style={{ height: 10, borderRadius: 5, backgroundColor: S.surface, overflow: "hidden", border: `1px solid ${S.borderLight}` }}>
            <div style={{ height: "100%", width: `${character.maxHp > 0 ? Math.min(100, Math.max(0, (character.currentHp / character.maxHp) * 100)) : 0}%`, backgroundColor: S.success, borderRadius: 5 }} />
          </div>
        </div>
        <Divider />

        {/* Ability Scores */}
        <SectionHeader>Ability Scores</SectionHeader>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 16 }}>
          {abilityKeys.map((key, idx) => {
            const score = character[key];
            const mod = getModifier(score);
            return (
              <div key={key} style={{ textAlign: "center", padding: "10px 4px", backgroundColor: S.surface, borderRadius: 8, border: `1px solid ${S.borderLight}` }}>
                <Label>{abilityLabels[idx]}</Label>
                <div style={{ fontSize: 20, fontWeight: 700, color: S.textPrimary, margin: "2px 0" }}>{score}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: S.accent }}>{mod >= 0 ? `+${mod}` : mod}</div>
              </div>
            );
          })}
        </div>
        <Divider />

        {/* Saving Throws */}
        <SectionHeader>Saving Throws</SectionHeader>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6, marginBottom: 16 }}>
          {abilityKeys.map((key) => {
            const st = character.savingThrows[key] ?? { proficient: false, value: 0 };
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", backgroundColor: S.surface, borderRadius: 6, border: `1px solid ${st.proficient ? S.accent : S.borderLight}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${st.proficient ? S.accent : S.border}`, backgroundColor: st.proficient ? S.accent : "transparent" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: st.proficient ? S.accent : S.textPrimary }}>{key.toUpperCase()}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: st.proficient ? S.accent : S.textSecondary }}>
                  {st.value >= 0 ? `+${st.value}` : st.value}
                </span>
              </div>
            );
          })}
        </div>
        <Divider />

        {/* Skills */}
        <SectionHeader>Skills</SectionHeader>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 4 }}>
          {skillsList.map(({ name, ability }) => {
            const proficient = character.skills[name] ?? false;
            const expert = (character.expertise || []).includes(name);
            const profMultiplier = expert ? 2 : 1;
            const abilityScore = character[ability as keyof Character] as number;
            const mod = getModifier(abilityScore);
            const total = mod + (profBonus * profMultiplier);
            return (
              <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", backgroundColor: S.surface, borderRadius: 4, border: `1px solid ${proficient ? S.accentLight : "transparent"}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, border: `2px solid ${proficient ? S.accent : S.border}`, backgroundColor: proficient ? S.accent : "transparent" }} />
                  <span style={{ fontSize: 10, fontWeight: proficient ? 600 : 400, color: S.textPrimary }}>{name}</span>
                  {expert && <span style={{ fontSize: 7, fontWeight: 700, color: S.danger, backgroundColor: S.danger + "15", padding: "1px 3px", borderRadius: 2 }}>EXP</span>}
                  <span style={{ fontSize: 8, color: S.textMuted }}>{ability.toUpperCase()}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: proficient ? S.accent : S.textSecondary }}>{total >= 0 ? `+${total}` : total}</span>
              </div>
            );
          })}
        </div>
      </Page>

      {/* ===== PAGE 2: Attacks, Features, Inventory ===== */}
      <Page>
        {/* Attacks */}
        <SectionHeader>Attacks & Spellcasting</SectionHeader>
        {character.attacks.filter((a) => a.name).length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {character.attacks.filter((a) => a.name).map((attack) => (
              <div key={attack.id} style={{ padding: "8px 12px", backgroundColor: S.surface, borderRadius: 6, border: `1px solid ${S.borderLight}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: S.textPrimary }}>{attack.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: S.textSecondary }}>+{attack.attackBonus} to hit</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {attack.damageType && (
                    <span style={{ fontSize: 9, fontWeight: 600, color: getDamageTypeColor(attack.damageType), backgroundColor: getDamageTypeBgColor(attack.damageType), padding: "2px 6px", borderRadius: 4 }}>
                      {attack.damageType}
                    </span>
                  )}
                  {attack.sneakAttack && (
                    <span style={{ fontSize: 9, fontWeight: 600, color: S.danger, backgroundColor: S.danger + "15", padding: "2px 6px", borderRadius: 4 }}>
                      +{attack.sneakAttack} sneak
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 10, color: S.textMuted, marginBottom: 16 }}>No attacks configured</div>
        )}
        <Divider />

        {/* Features & Traits */}
        <SectionHeader>Features & Traits</SectionHeader>
        {character.features.filter((f) => f.name).length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
            {character.features.filter((f) => f.name).map((feature) => (
              <div key={feature.id} style={{ padding: "8px 12px", backgroundColor: S.surface, borderRadius: 6, border: `1px solid ${S.borderLight}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: S.accent, marginBottom: 2 }}>{feature.name}</div>
                {feature.description && <div style={{ fontSize: 9, color: S.textSecondary, lineHeight: 1.6 }}>{feature.description}</div>}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 10, color: S.textMuted, marginBottom: 16 }}>No features</div>
        )}
        <Divider />

        {/* Inventory */}
        <SectionHeader>Inventory</SectionHeader>
        {character.inventory.filter((item) => item.name).length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 4, marginBottom: 16 }}>
            {character.inventory.filter((item) => item.name).map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 10px", backgroundColor: S.surface, borderRadius: 4, border: `1px solid ${item.equipped ? S.success : S.borderLight}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {item.equipped && <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: S.success }} />}
                  <span style={{ fontSize: 10, color: S.textPrimary, fontWeight: item.equipped ? 600 : 400 }}>{item.name}</span>
                </div>
                <span style={{ fontSize: 9, color: S.textMuted }}>x{item.quantity}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 10, color: S.textMuted, marginBottom: 16 }}>No items</div>
        )}
        <Divider />

        {/* Currency */}
        <SectionHeader>Currency</SectionHeader>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {character.currency.platinum > 0 && <span style={{ fontSize: 10, fontWeight: 600, color: S.textSecondary }}>PP: {character.currency.platinum}</span>}
          {character.currency.gold > 0 && <span style={{ fontSize: 10, fontWeight: 600, color: S.textSecondary }}>GP: {character.currency.gold}</span>}
          {character.currency.electrum > 0 && <span style={{ fontSize: 10, fontWeight: 600, color: S.textSecondary }}>EP: {character.currency.electrum}</span>}
          {character.currency.silver > 0 && <span style={{ fontSize: 10, fontWeight: 600, color: S.textSecondary }}>SP: {character.currency.silver}</span>}
          {character.currency.copper > 0 && <span style={{ fontSize: 10, fontWeight: 600, color: S.textSecondary }}>CP: {character.currency.copper}</span>}
          {character.currency.platinum === 0 && character.currency.gold === 0 && character.currency.electrum === 0 && character.currency.silver === 0 && character.currency.copper === 0 && (
            <span style={{ fontSize: 10, color: S.textMuted }}>No currency</span>
          )}
        </div>
      </Page>

      {/* ===== PAGE 3: Spells, Bio ===== */}
      <Page>
        {/* Spellcasting Stats */}
        {character.spellcastingAbility && (
          <>
            <SectionHeader>Spellcasting</SectionHeader>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 16 }}>
              <div style={{ textAlign: "center", padding: "10px 6px", backgroundColor: S.surface, borderRadius: 8, border: `1px solid ${S.borderLight}` }}>
                <Label>Spell Save DC</Label>
                <div style={{ fontSize: 18, fontWeight: 700, color: S.textPrimary, marginTop: 2 }}>
                  {8 + profBonus + getModifier(character[character.spellcastingAbility as keyof Character] as number)}
                </div>
              </div>
              <div style={{ textAlign: "center", padding: "10px 6px", backgroundColor: S.surface, borderRadius: 8, border: `1px solid ${S.borderLight}` }}>
                <Label>Spell Attack</Label>
                <div style={{ fontSize: 18, fontWeight: 700, color: S.textPrimary, marginTop: 2 }}>
                  +{profBonus + getModifier(character[character.spellcastingAbility as keyof Character] as number)}
                </div>
              </div>
              <div style={{ textAlign: "center", padding: "10px 6px", backgroundColor: S.surface, borderRadius: 8, border: `1px solid ${S.borderLight}` }}>
                <Label>Ability</Label>
                <div style={{ fontSize: 18, fontWeight: 700, color: S.accent, marginTop: 2 }}>
                  {character.spellcastingAbility.toUpperCase()}
                </div>
              </div>
            </div>
            <Divider />
          </>
        )}

        {/* Spell Slots */}
        {character.spellSlots && Object.keys(character.spellSlots).length > 0 && (
          <>
            <SectionHeader>Spell Slots</SectionHeader>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
              {Object.entries(character.spellSlots).map(([level, count]) => {
                const expended = character.spellSlotsExpended?.[Number(level)] ?? 0;
                const remaining = (count as number) - expended;
                return (
                  <div key={level} style={{ padding: "6px 12px", backgroundColor: S.surface, borderRadius: 6, textAlign: "center", minWidth: 50, border: `1px solid ${remaining > 0 ? S.border : S.borderLight}` }}>
                    <div style={{ fontSize: 8, fontWeight: 600, color: S.textMuted }}>Level {level}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: remaining > 0 ? S.textPrimary : S.textMuted }}>
                      {remaining}<span style={{ fontSize: 9, color: S.textMuted }}>/{count as number}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <Divider />
          </>
        )}

        {/* Spells */}
        {character.spells.filter((s) => s.name).length > 0 && (
          <>
            <SectionHeader>Spells</SectionHeader>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 4, marginBottom: 16 }}>
              {character.spells.filter((s) => s.name).map((spell) => (
                <div key={spell.id} style={{ padding: "6px 10px", backgroundColor: S.surface, borderRadius: 4, border: `1px solid ${S.borderLight}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, fontWeight: 600, color: S.textPrimary }}>{spell.name}</span>
                    <span style={{ fontSize: 9, fontWeight: 600, color: S.textMuted }}>{spell.level === 0 ? "Cantrip" : `Lvl ${spell.level}`}</span>
                  </div>
                  {(spell.damageDice || spell.damageType) && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                      {spell.damageType && (
                        <span style={{ fontSize: 8, fontWeight: 600, color: getDamageTypeColor(spell.damageType), backgroundColor: getDamageTypeBgColor(spell.damageType), padding: "1px 4px", borderRadius: 3 }}>
                          {spell.damageType} {spell.damageDice}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Divider />
          </>
        )}

        {/* Appearance & Bio */}
        <SectionHeader>Appearance & Bio</SectionHeader>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Appearance", value: character.appearance.characterAppearance },
            { label: "Personality", value: character.appearance.personality },
            { label: "Backstory", value: character.appearance.backstory },
            { label: "Allies & Organizations", value: character.appearance.alliesOrganizations },
            { label: "Additional Features", value: character.appearance.additionalFeaturesTraits },
            { label: "Treasure", value: character.appearance.treasure },
          ].map(({ label, value }) => (
            value.trim() && (
              <div key={label}>
                <Label>{label}</Label>
                <div style={{ fontSize: 9, color: S.textSecondary, lineHeight: 1.6, marginTop: 2, whiteSpace: "pre-wrap" as const }}>{value}</div>
              </div>
            )
          ))}
          {!character.appearance.characterAppearance.trim() && !character.appearance.personality.trim() && !character.appearance.backstory.trim() && (
            <div style={{ fontSize: 10, color: S.textMuted }}>No bio information</div>
          )}
        </div>

        {/* Other Proficiencies */}
        {character.otherProficiencies && (
          <>
            <Divider />
            <SectionHeader>Other Proficiencies & Languages</SectionHeader>
            <div style={{ fontSize: 9, color: S.textSecondary, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {character.otherProficiencies}
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{ position: "absolute", bottom: 16, left: 28, right: 28, textAlign: "center" }}>
          <div style={{ fontSize: 8, color: S.textMuted, borderTop: `1px solid ${S.borderLight}`, paddingTop: 6 }}>
            Generated by DND Wizard • {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </div>
        </div>
      </Page>
    </div>
  );
}
