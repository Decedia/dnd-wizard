"use client";

import type { Character } from "@/lib/storage";
import { getModifier, getProficiencyBonus } from "@/lib/storage";
import { DamageBadge, getDamageTypeColor, getDamageTypeBgColor } from "./DamageBadge";

interface CharacterSheetPrintProps {
  character: Character;
}

const PRINT_WIDTH = 794;
const C = {
  bg: "#ffffff",
  cardBg: "#f5f5f5",
  text: "#111111",
  textSecondary: "#666666",
  textMuted: "#aaaaaa",
  border: "#e0e0e0",
  borderActive: "#111111",
  primary: "#111111",
};

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-print-page
      style={{
        width: PRINT_WIDTH,
        minHeight: "1030px",
        backgroundColor: C.bg,
        color: C.text,
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "13px",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        marginBottom: "12px",
        color: C.text,
      }}
    >
      {children}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        backgroundColor: C.cardBg,
        borderRadius: "8px",
        border: `1px solid ${C.border}`,
        padding: "16px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function CharacterSheetPrint({ character }: CharacterSheetPrintProps) {
  const profBonus = character.proficiencyBonus || 2;
  const abilityKeys = ["str", "dex", "con", "int", "wis", "cha"] as const;
  const abilityLabels = ["STR", "DEX", "CON", "INT", "WIS", "CHA"] as const;
  const savingThrowKeys = ["str", "dex", "con", "int", "wis", "cha"] as const;

  const skillsList = [
    "Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception",
    "History", "Insight", "Intimidation", "Investigation", "Medicine",
    "Nature", "Perception", "Performance", "Persuasion", "Religion",
    "Sleight of Hand", "Stealth", "Survival",
  ];
  const abilityMap: Record<string, string> = {
    Acrobatics: "dex", "Animal Handling": "wis", Arcana: "int", Athletics: "str", Deception: "cha",
    History: "int", Insight: "wis", Intimidation: "cha", Investigation: "int", Medicine: "wis",
    Nature: "int", Perception: "wis", Performance: "cha", Persuasion: "cha", Religion: "int",
    "Sleight of Hand": "dex", Stealth: "dex", Survival: "wis",
  };

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Page 1 */}
      <Page>
        {/* Header */}
        <div style={{ marginBottom: "16px" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 700, color: C.text, margin: 0 }}>
            {character.name || "Unnamed Character"}
          </h1>
          <p style={{ fontSize: "12px", color: C.textSecondary, marginTop: "4px" }}>
            {character.race} {character.class} Level {character.level} {character.subclass ? `• ${character.subclass}` : ""}
          </p>
        </div>

        {/* Top row: Ability Scores + Combat */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
          {/* Ability Scores */}
          <Card style={{ flex: "0 0 55%" }}>
            <SectionTitle>Stats</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              {abilityKeys.map((key, idx) => {
                const score = character[key];
                const mod = getModifier(score);
                return (
                  <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: "56px", height: "56px",
                      borderRadius: "8px",
                      border: `1px solid ${C.border}`,
                      backgroundColor: C.bg,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: "9px", fontWeight: 600, color: C.textMuted, textTransform: "uppercase" }}>
                        {abilityLabels[idx]}
                      </span>
                      <span style={{ fontSize: "16px", fontWeight: 700, color: C.text }}>
                        {mod >= 0 ? `+${mod}` : mod}
                      </span>
                    </div>
                    <div style={{ marginTop: "4px", fontSize: "10px", fontWeight: 600, color: C.textSecondary }}>
                      {score}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Combat Stats */}
          <Card style={{ flex: 1 }}>
            <SectionTitle>Combat Stats</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* AC */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "56px", height: "64px",
                  borderRadius: "8px",
                  border: `2px solid ${C.primary}`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: "9px", fontWeight: 600, color: C.textMuted }}>AC</span>
                  <span style={{ fontSize: "20px", fontWeight: 700, color: C.text }}>{character.ac}</span>
                </div>
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  {[
                    { label: "HP", value: character.currentHp },
                    { label: "Max HP", value: character.maxHp },
                    { label: "Temp HP", value: character.temporaryHp },
                    { label: "Speed", value: character.speed },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "6px", backgroundColor: C.bg, borderRadius: "6px", border: `1px solid ${C.border}` }}>
                      <div style={{ fontSize: "9px", color: C.textMuted }}>{label}</div>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Saving Throws */}
              <div>
                <div style={{ fontSize: "10px", fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                  Saving Throws
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {savingThrowKeys.map((key) => {
                    const st = character.savingThrows[key] ?? { proficient: false, value: 0 };
                    const abilityMod = getModifier(character[key]);
                    return (
                      <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", backgroundColor: C.bg, borderRadius: "6px", border: `1px solid ${C.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{
                            width: "16px", height: "16px", borderRadius: "50%",
                            border: `2px solid ${st.proficient ? C.primary : C.border}`,
                            backgroundColor: st.proficient ? C.primary : "transparent",
                          }} />
                          <span style={{ fontSize: "11px", fontWeight: 600, color: C.text, width: "28px" }}>{key.toUpperCase()}</span>
                          <span style={{ fontSize: "9px", color: C.textMuted }}>
                            {abilityMod >= 0 ? `+${abilityMod}` : abilityMod} mod
                          </span>
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: 700, color: C.text, width: "30px", textAlign: "right" }}>
                          {st.value >= 0 ? `+${st.value}` : st.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Skills */}
        <Card style={{ marginBottom: "12px" }}>
          <SectionTitle>Skills</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "4px" }}>
            {skillsList.map((name) => {
              const proficient = character.skills[name] ?? false;
              const expert = (character.expertise || []).includes(name);
              const profMultiplier = expert ? 2 : 1;
              const abilityKey = abilityMap[name] || "dex";
              const abilityScore = character[abilityKey as keyof Character] as number;
              const mod = getModifier(abilityScore);
              const total = mod + (profBonus * profMultiplier);
              return (
                <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", backgroundColor: C.bg, borderRadius: "6px", border: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      width: "16px", height: "16px", borderRadius: "50%",
                      border: `2px solid ${proficient ? C.primary : C.border}`,
                      backgroundColor: proficient ? C.primary : "transparent",
                    }} />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "11px", color: C.text }}>
                        {name}
                        {expert && <span style={{ fontSize: "8px", fontWeight: 700, color: "#ef4444", marginLeft: "4px", backgroundColor: "#ef444415", padding: "1px 4px", borderRadius: "3px" }}>EXPERTISE</span>}
                      </span>
                      <span style={{ fontSize: "9px", color: C.textMuted }}>
                        {abilityKey.toUpperCase()} {mod >= 0 ? `+${mod}` : mod}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: C.text, width: "28px", textAlign: "right" }}>
                    {total >= 0 ? `+${total}` : total}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Death Saves + Hit Dice */}
        <div style={{ display: "flex", gap: "12px" }}>
          <Card style={{ flex: 1 }}>
            <SectionTitle>Death Saves</SectionTitle>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Successes</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {[0, 1, 2].map((i) => (
                    <div key={`s-${i}`} style={{
                      width: "16px", height: "16px", borderRadius: "50%",
                      border: `2px solid ${character.deathSaveSuccesses > i ? "#22c55e" : C.border}`,
                      backgroundColor: character.deathSaveSuccesses > i ? "#22c55e" : "transparent",
                    }} />
                  ))}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Failures</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {[0, 1, 2].map((i) => (
                    <div key={`f-${i}`} style={{
                      width: "16px", height: "16px", borderRadius: "50%",
                      border: `2px solid ${character.deathSaveFailures > i ? "#ef4444" : C.border}`,
                      backgroundColor: character.deathSaveFailures > i ? "#ef4444" : "transparent",
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card style={{ flex: 1 }}>
            <SectionTitle>Hit Dice</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div>
                <span style={{ fontSize: "10px", color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total: {character.hitDiceTotal || "—"}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px" }}>
                {Array.from({ length: character.hitDiceRemaining || 0 }).map((_, i) => (
                  <div key={`r-${i}`} style={{ width: "16px", height: "16px", borderRadius: "4px", backgroundColor: C.primary, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "8px", color: C.bg, fontWeight: 700 }}>✓</span>
                  </div>
                ))}
                {Array.from({ length: Math.max(0, (parseInt(character.hitDiceTotal) || 0) - (character.hitDiceRemaining || 0)) }).map((_, i) => (
                  <div key={`u-${i}`} style={{ width: "16px", height: "16px", borderRadius: "4px", border: `1px solid ${C.border}` }} />
                ))}
              </div>
            </div>
          </Card>
        </div>
      </Page>

      {/* Page 2: Features, Attacks, Inventory */}
      <Page>
        <Card style={{ marginBottom: "12px" }}>
          <SectionTitle>Features & Traits</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {character.features.filter((f) => f.name).map((feature) => (
              <div key={feature.id} style={{ padding: "8px 10px", backgroundColor: C.bg, borderRadius: "6px", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: C.text }}>{feature.name}</div>
                {feature.description && (
                  <div style={{ fontSize: "10px", color: C.textSecondary, marginTop: "2px" }}>{feature.description}</div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card style={{ marginBottom: "12px" }}>
          <SectionTitle>Attacks</SectionTitle>
          {character.attacks.filter((a) => a.name).length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {character.attacks.filter((a) => a.name).map((attack) => (
                <div key={attack.id} style={{ padding: "8px 10px", backgroundColor: C.bg, borderRadius: "6px", border: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: C.text }}>{attack.name}</span>
                    <span style={{ fontSize: "11px", color: C.textSecondary }}>
                      {attack.attackBonus ? `+${attack.attackBonus}` : ""} {attack.damageType}
                    </span>
                  </div>
                  {attack.description && (
                    <span style={{ fontSize: "10px", color: C.textMuted }}>{attack.description}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "11px", color: C.textMuted }}>No attacks</p>
          )}
        </Card>

        <Card style={{ marginBottom: "12px" }}>
          <SectionTitle>Inventory</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {character.inventory.filter((item) => item.name).map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 10px", backgroundColor: C.bg, borderRadius: "6px", border: `1px solid ${C.border}` }}>
                <span style={{ fontSize: "11px", color: C.text }}>{item.name}</span>
                <span style={{ fontSize: "10px", color: C.textSecondary }}>x{item.quantity}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Other Proficiencies</SectionTitle>
          {character.otherProficiencies ? (
            <div style={{ fontSize: "11px", color: C.text, backgroundColor: C.bg, padding: "10px", borderRadius: "6px", border: `1px solid ${C.border}`, whiteSpace: "pre-wrap" }}>
              {character.otherProficiencies}
            </div>
          ) : (
            <p style={{ fontSize: "11px", color: C.textMuted }}>None</p>
          )}
        </Card>
      </Page>

      {/* Page 3: Spells, Appearance */}
      <Page>
        {character.spells.filter((s) => s.name).length > 0 && (
          <Card style={{ marginBottom: "12px" }}>
            <SectionTitle>Spells</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {character.spells.filter((s) => s.name).map((spell) => (
                <div key={spell.id} style={{ padding: "8px 10px", backgroundColor: C.bg, borderRadius: "6px", border: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: C.text }}>{spell.name}</span>
                    <span style={{ fontSize: "10px", color: C.textSecondary }}>{spell.level === 0 ? "Cantrip" : `Level ${spell.level}`}</span>
                  </div>
                  {(spell.damageDice || spell.damageType) && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
                      {spell.damageType && <DamageBadge type={spell.damageType} size="sm" showLabel={false} />}
                      {spell.damageDice && (
                        <span style={{ fontSize: "10px", fontWeight: 700, color: getDamageTypeColor(spell.damageType), backgroundColor: getDamageTypeBgColor(spell.damageType), padding: "2px 6px", borderRadius: "4px" }}>
                          {spell.damageDice}
                        </span>
                      )}
                    </div>
                  )}
                  {spell.description && (
                    <span style={{ fontSize: "10px", color: C.textMuted, display: "block", marginTop: "4px" }}>{spell.description}</span>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {character.spellSlots && Object.keys(character.spellSlots).length > 0 && (
          <Card style={{ marginBottom: "12px" }}>
            <SectionTitle>Spell Slots</SectionTitle>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              {Object.entries(character.spellSlots).map(([level, count]) => {
                const expended = character.spellSlotsExpended?.[Number(level)] ?? 0;
                const remaining = (count as number) - expended;
                return (
                  <div key={level} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "8px 12px", backgroundColor: C.bg, borderRadius: "6px", border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: "9px", color: C.textMuted, textTransform: "uppercase" }}>Level {level}</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>{remaining} / {count as number}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <Card>
          <SectionTitle>Appearance & Bio</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {[
              { label: "Character Appearance", value: character.appearance.characterAppearance },
              { label: "Personality", value: character.appearance.personality },
              { label: "Backstory", value: character.appearance.backstory },
              { label: "Allies & Organizations", value: character.appearance.alliesOrganizations },
              { label: "Additional Features & Traits", value: character.appearance.additionalFeaturesTraits },
              { label: "Treasure", value: character.appearance.treasure },
            ].map(({ label, value }) => (
              value.trim() && (
                <div key={label} style={{ padding: "8px 10px", backgroundColor: C.bg, borderRadius: "6px", border: `1px solid ${C.border}` }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: C.text, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                  <div style={{ fontSize: "11px", color: C.textSecondary, marginTop: "2px", whiteSpace: "pre-wrap" }}>{value}</div>
                </div>
              )
            ))}
          </div>
        </Card>
      </Page>
    </div>
  );
}
