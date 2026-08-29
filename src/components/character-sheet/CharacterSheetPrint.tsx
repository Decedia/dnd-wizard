"use client";

import type { Character } from "@/lib/storage";
import { getModifier, getProficiencyBonus } from "@/lib/storage";
import { DamageBadge, getDamageTypeColor, getDamageTypeBgColor } from "./DamageBadge";

interface CharacterSheetPrintProps {
  character: Character;
}

const W = 794;
const C = {
  bg: "#ffffff",
  surface: "#f5f5f5",
  border: "#e0e0e0",
  textPrimary: "#111111",
  textSecondary: "#666666",
  textMuted: "#aaaaaa",
  primary: "#111111",
  success: "#22c55e",
  danger: "#ef4444",
  warning: "#f59e0b",
  info: "#2563eb",
};

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div data-print-page style={{ width: W, backgroundColor: C.bg, padding: "24px", boxSizing: "border-box", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {children}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      borderRadius: "10px",
      backgroundColor: C.bg,
      border: `1px solid ${C.border}`,
      padding: "16px",
      marginBottom: "12px",
      ...style,
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: "13px",
      fontWeight: 600,
      display: "flex",
      alignItems: "center",
      gap: "8px",
      marginBottom: "12px",
      color: C.textPrimary,
    }}>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize: "11px", fontWeight: 600, color: C.textMuted, display: "block" }}>
      {children}
    </span>
  );
}

function Badge({ children, color, bgColor }: { children: React.ReactNode; color?: string; bgColor?: string }) {
  return (
    <span style={{
      fontSize: "10px",
      fontWeight: 600,
      color: color || C.textSecondary,
      backgroundColor: bgColor || C.surface,
      padding: "2px 6px",
      borderRadius: "4px",
    }}>
      {children}
    </span>
  );
}

export function CharacterSheetPrint({ character }: CharacterSheetPrintProps) {
  const profBonus = character.proficiencyBonus || 2;
  const abilityKeys = ["str", "dex", "con", "int", "wis", "cha"] as const;
  const abilityLabels = ["STR", "DEX", "CON", "INT", "WIS", "CHA"] as const;
  const savingThrowKeys = ["str", "dex", "con", "int", "wis", "cha"] as const;

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
      {/* Page 1: Combat & Stats */}
      <Page>
        {/* Header */}
        <div style={{ marginBottom: "16px" }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: C.textPrimary, margin: 0 }}>
            {character.name || "Unnamed Character"}
          </h1>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
            {character.race && <Badge color={C.info} bgColor="#2563eb15">{character.race}</Badge>}
            {character.class && <Badge color={C.textPrimary} bgColor="#11111115">{character.class}</Badge>}
            <Badge color={C.warning} bgColor="#f59e0b15">Level {character.level}</Badge>
            {character.subclass && <Badge>{character.subclass}</Badge>}
          </div>
        </div>

        {/* Combat Stats */}
        <Card>
          <SectionTitle>⚔ Combat Stats</SectionTitle>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "24px", marginBottom: "16px" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "80px", height: "96px", borderRadius: "10px", border: `2px solid ${C.primary}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "10px", fontWeight: 600, color: C.textMuted }}>AC</span>
                <span style={{ fontSize: "28px", fontWeight: 700, color: C.textPrimary }}>{character.ac}</span>
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: "80px", height: "96px", borderRadius: "10px", border: `2px solid ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontSize: "10px", fontWeight: 600, color: C.textMuted }}>SPD</span>
                <span style={{ fontSize: "28px", fontWeight: 700, color: C.textPrimary }}>{character.speed}</span>
                <span style={{ fontSize: "10px", color: C.textMuted }}>ft.</span>
              </div>
            </div>
          </div>
          <div style={{ marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
              <Label>HP</Label>
              <span style={{ fontSize: "10px", fontWeight: 600, color: C.textMuted }}>{character.currentHp} / {character.maxHp}</span>
            </div>
            <div style={{ height: "12px", borderRadius: "6px", backgroundColor: C.surface, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${character.maxHp > 0 ? Math.min(100, Math.max(0, (character.currentHp / character.maxHp) * 100)) : 0}%`, backgroundColor: C.success, borderRadius: "6px" }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
            <div style={{ padding: "8px", backgroundColor: C.surface, borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "9px", fontWeight: 600, color: C.textMuted }}>Temp HP</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: C.textPrimary }}>{character.temporaryHp}</div>
            </div>
            <div style={{ padding: "8px", backgroundColor: C.surface, borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "9px", fontWeight: 600, color: C.textMuted }}>Proficiency</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: C.textPrimary }}>+{profBonus}</div>
            </div>
            <div style={{ padding: "8px", backgroundColor: C.surface, borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "9px", fontWeight: 600, color: C.textMuted }}>Initiative</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: C.textPrimary }}>{character.initiative >= 0 ? `+${character.initiative}` : character.initiative}</div>
            </div>
          </div>
        </Card>

        {/* Ability Scores */}
        <Card>
          <SectionTitle>✦ Stats</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "8px" }}>
            {abilityKeys.map((key, idx) => {
              const score = character[key];
              const mod = getModifier(score);
              return (
                <div key={key} style={{ textAlign: "center" }}>
                  <div style={{
                    width: "100%", aspectRatio: "1", borderRadius: "10px",
                    border: `1px solid ${C.border}`, backgroundColor: C.surface,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{ fontSize: "18px", fontWeight: 700, color: C.textPrimary }}>{mod >= 0 ? `+${mod}` : mod}</span>
                  </div>
                  <div style={{ fontSize: "9px", fontWeight: 600, color: C.textMuted, marginTop: "4px", textTransform: "uppercase" }}>{abilityLabels[idx]}</div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: C.textSecondary }}>{score}</div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Saving Throws */}
        <Card>
          <SectionTitle>🛡 Saving Throws</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px" }}>
            {savingThrowKeys.map((key) => {
              const st = character.savingThrows[key] ?? { proficient: false, value: 0 };
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", backgroundColor: C.surface, borderRadius: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      width: "16px", height: "16px", borderRadius: "50%",
                      border: `2px solid ${st.proficient ? C.primary : C.border}`,
                      backgroundColor: st.proficient ? C.primary : "transparent",
                    }} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color: C.textPrimary }}>{key.toUpperCase()}</span>
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 700, color: st.proficient ? C.primary : C.textSecondary }}>
                    {st.value >= 0 ? `+${st.value}` : st.value}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Skills */}
        <Card>
          <SectionTitle>★ Skills</SectionTitle>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "4px" }}>
            {skillsList.map(({ name, ability }) => {
              const proficient = character.skills[name] ?? false;
              const expert = (character.expertise || []).includes(name);
              const profMultiplier = expert ? 2 : 1;
              const abilityScore = character[ability as keyof Character] as number;
              const mod = getModifier(abilityScore);
              const total = mod + (profBonus * profMultiplier);
              return (
                <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", backgroundColor: C.surface, borderRadius: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{
                      width: "14px", height: "14px", borderRadius: "3px",
                      border: `2px solid ${proficient ? C.primary : C.border}`,
                      backgroundColor: proficient ? C.primary : "transparent",
                    }} />
                    <div>
                      <span style={{ fontSize: "11px", fontWeight: proficient ? 600 : 400, color: C.textPrimary }}>{name}</span>
                      {expert && <span style={{ fontSize: "8px", fontWeight: 700, color: C.danger, marginLeft: "4px" }}>EXP</span>}
                      <span style={{ fontSize: "9px", color: C.textMuted, marginLeft: "4px" }}>{ability.toUpperCase()}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: C.textPrimary }}>{total >= 0 ? `+${total}` : total}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </Page>

      {/* Page 2: Attacks & Features */}
      <Page>
        {/* Attacks */}
        <Card>
          <SectionTitle>⚔ Attacks</SectionTitle>
          {character.attacks.filter((a) => a.name).length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {character.attacks.filter((a) => a.name).map((attack) => (
                <div key={attack.id} style={{ padding: "10px", backgroundColor: C.surface, borderRadius: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: C.textPrimary }}>{attack.name}</span>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: C.textSecondary }}>+{attack.attackBonus} to hit</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {attack.damageType && <DamageBadge type={attack.damageType} size="sm" showLabel={false} />}
                    {attack.damageType && (
                      <span style={{ fontSize: "10px", fontWeight: 600, color: getDamageTypeColor(attack.damageType), backgroundColor: getDamageTypeBgColor(attack.damageType), padding: "2px 6px", borderRadius: "4px" }}>
                        {attack.damageType}
                      </span>
                    )}
                    {attack.sneakAttack && <Badge color={C.danger} bgColor="#ef444415">+{attack.sneakAttack} sneak</Badge>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "11px", color: C.textMuted }}>No attacks</p>
          )}
          <p style={{ fontSize: "10px", color: C.textMuted, marginTop: "8px" }}>Attacks are automatically generated from equipped weapons and class features.</p>
        </Card>

        {/* Features & Traits */}
        <Card>
          <SectionTitle>✦ Features & Traits</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {character.features.filter((f) => f.name).map((feature) => (
              <div key={feature.id} style={{ padding: "8px 10px", backgroundColor: C.surface, borderRadius: "6px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: C.textPrimary, marginBottom: "2px" }}>{feature.name}</div>
                {feature.description && <div style={{ fontSize: "10px", color: C.textSecondary, lineHeight: 1.5 }}>{feature.description}</div>}
              </div>
            ))}
          </div>
        </Card>

        {/* Inventory */}
        <Card>
          <SectionTitle>🎒 Inventory</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {character.inventory.filter((item) => item.name).map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", backgroundColor: C.surface, borderRadius: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {item.equipped && <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: C.success }} />}
                  <span style={{ fontSize: "11px", color: C.textPrimary, fontWeight: item.equipped ? 600 : 400 }}>{item.name}</span>
                </div>
                <span style={{ fontSize: "10px", color: C.textMuted }}>x{item.quantity}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Death Saves & Hit Dice */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <Card style={{ marginBottom: 0 }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Death Saves</div>
            <div style={{ display: "flex", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "9px", color: C.textMuted, marginBottom: "4px" }}>Successes</div>
                <div style={{ display: "flex", gap: "4px" }}>
                  {[0, 1, 2].map((i) => (
                    <div key={`s-${i}`} style={{ width: "16px", height: "16px", borderRadius: "50%", border: `2px solid ${character.deathSaveSuccesses > i ? C.success : C.border}`, backgroundColor: character.deathSaveSuccesses > i ? C.success : "transparent" }} />
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "9px", color: C.textMuted, marginBottom: "4px" }}>Failures</div>
                <div style={{ display: "flex", gap: "4px" }}>
                  {[0, 1, 2].map((i) => (
                    <div key={`f-${i}`} style={{ width: "16px", height: "16px", borderRadius: "50%", border: `2px solid ${character.deathSaveFailures > i ? C.danger : C.border}`, backgroundColor: character.deathSaveFailures > i ? C.danger : "transparent" }} />
                  ))}
                </div>
              </div>
            </div>
          </Card>
          <Card style={{ marginBottom: 0 }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>Hit Dice</div>
            <div style={{ fontSize: "11px", color: C.textSecondary, marginBottom: "6px" }}>Total: {character.hitDiceTotal || "—"}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
              {Array.from({ length: character.hitDiceRemaining || 0 }).map((_, i) => (
                <div key={`r-${i}`} style={{ width: "14px", height: "14px", borderRadius: "3px", backgroundColor: C.primary }} />
              ))}
              {Array.from({ length: Math.max(0, (parseInt(character.hitDiceTotal) || 0) - (character.hitDiceRemaining || 0)) }).map((_, i) => (
                <div key={`u-${i}`} style={{ width: "14px", height: "14px", borderRadius: "3px", border: `1px solid ${C.border}` }} />
              ))}
            </div>
          </Card>
        </div>
      </Page>

      {/* Page 3: Spells & Bio */}
      <Page>
        {/* Spellcasting Stats */}
        {character.spellcastingAbility && (
          <Card>
            <SectionTitle>🔮 Spellcasting</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
              <div style={{ padding: "10px", backgroundColor: C.surface, borderRadius: "6px", textAlign: "center" }}>
                <div style={{ fontSize: "9px", fontWeight: 600, color: C.textMuted }}>Spell Save DC</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: C.textPrimary }}>{8 + profBonus + getModifier(character[character.spellcastingAbility as keyof Character] as number)}</div>
              </div>
              <div style={{ padding: "10px", backgroundColor: C.surface, borderRadius: "6px", textAlign: "center" }}>
                <div style={{ fontSize: "9px", fontWeight: 600, color: C.textMuted }}>Spell Attack</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: C.textPrimary }}>+{profBonus + getModifier(character[character.spellcastingAbility as keyof Character] as number)}</div>
              </div>
              <div style={{ padding: "10px", backgroundColor: C.surface, borderRadius: "6px", textAlign: "center" }}>
                <div style={{ fontSize: "9px", fontWeight: 600, color: C.textMuted }}>Ability</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: C.textPrimary }}>{character.spellcastingAbility.toUpperCase()}</div>
              </div>
            </div>
          </Card>
        )}

        {/* Spell Slots */}
        {character.spellSlots && Object.keys(character.spellSlots).length > 0 && (
          <Card>
            <SectionTitle>✧ Spell Slots</SectionTitle>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {Object.entries(character.spellSlots).map(([level, count]) => {
                const expended = character.spellSlotsExpended?.[Number(level)] ?? 0;
                const remaining = (count as number) - expended;
                return (
                  <div key={level} style={{ padding: "6px 12px", backgroundColor: C.surface, borderRadius: "6px", textAlign: "center", minWidth: "50px" }}>
                    <div style={{ fontSize: "9px", fontWeight: 600, color: C.textMuted }}>Level {level}</div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: remaining > 0 ? C.textPrimary : C.textMuted }}>{remaining}<span style={{ fontSize: "10px", color: C.textMuted }}>/{count as number}</span></div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Spells */}
        {character.spells.filter((s) => s.name).length > 0 && (
          <Card>
            <SectionTitle>🔮 Spells</SectionTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {character.spells.filter((s) => s.name).map((spell) => (
                <div key={spell.id} style={{ padding: "8px 10px", backgroundColor: C.surface, borderRadius: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: C.textPrimary }}>{spell.name}</span>
                    <span style={{ fontSize: "10px", fontWeight: 600, color: C.textMuted }}>{spell.level === 0 ? "Cantrip" : `Lvl ${spell.level}`}</span>
                  </div>
                  {(spell.damageDice || spell.damageType) && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                      {spell.damageType && <DamageBadge type={spell.damageType} size="sm" showLabel={false} />}
                      {spell.damageDice && (
                        <span style={{ fontSize: "10px", fontWeight: 600, color: getDamageTypeColor(spell.damageType), backgroundColor: getDamageTypeBgColor(spell.damageType), padding: "2px 6px", borderRadius: "4px" }}>
                          {spell.damageDice}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Appearance & Bio */}
        <Card>
          <SectionTitle>📜 Appearance & Bio</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
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
                  <div style={{ fontSize: "10px", fontWeight: 700, color: C.textPrimary, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "3px" }}>{label}</div>
                  <div style={{ fontSize: "10px", color: C.textSecondary, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{value}</div>
                </div>
              )
            ))}
          </div>
        </Card>

        {/* Other Proficiencies */}
        {character.otherProficiencies && (
          <Card>
            <SectionTitle>📖 Other Proficiencies & Languages</SectionTitle>
            <div style={{ fontSize: "10px", color: C.textSecondary, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
              {character.otherProficiencies}
            </div>
          </Card>
        )}
      </Page>
    </div>
  );
}
