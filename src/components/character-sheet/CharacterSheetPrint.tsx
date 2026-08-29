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
  surface: "#f8f9fa",
  border: "#e2e8f0",
  borderLight: "#f1f5f9",
  text: "#1e293b",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",
  primary: "#0f172a",
  accent: "#3b82f6",
  success: "#22c55e",
  danger: "#ef4444",
  warning: "#f59e0b",
};

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div data-print-page style={{ width: W, minHeight: 1123, backgroundColor: C.bg, padding: "32px 40px", boxSizing: "border-box", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {children}
    </div>
  );
}

function Section({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ marginBottom: "24px", ...style }}>
      <div style={{ fontSize: "11px", fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px", paddingBottom: "6px", borderBottom: `2px solid ${C.primary}` }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function StatBox({ label, value, size = "md" }: { label: string; value: string | number; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { box: 48, value: 14, label: 8 },
    md: { box: 64, value: 18, label: 9 },
    lg: { box: 80, value: 24, label: 10 },
  };
  const s = sizes[size];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      <div style={{ width: s.box, height: s.box, borderRadius: "12px", border: `2px solid ${C.border}`, backgroundColor: C.surface, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: s.value, fontWeight: 700, color: C.primary, lineHeight: 1 }}>{value}</span>
      </div>
      <span style={{ fontSize: s.label, fontWeight: 600, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
    </div>
  );
}

function Badge({ children, color, bgColor }: { children: React.ReactNode; color?: string; bgColor?: string }) {
  return (
    <span style={{ fontSize: "10px", fontWeight: 600, color: color || C.textSecondary, backgroundColor: bgColor || C.surface, padding: "3px 8px", borderRadius: "6px", border: `1px solid ${C.borderLight}` }}>
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
      {/* Page 1: Core Stats */}
      <Page>
        {/* Header */}
        <div style={{ marginBottom: "28px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: C.primary, margin: 0, letterSpacing: "-0.02em" }}>
            {character.name || "Unnamed Character"}
          </h1>
          <div style={{ display: "flex", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
            {character.race && <Badge color={C.accent} bgColor={C.accent + "10"}>{character.race}</Badge>}
            {character.class && <Badge color={C.primary} bgColor={C.primary + "10"}>{character.class}</Badge>}
            <Badge color={C.warning} bgColor={C.warning + "10"}>Level {character.level}</Badge>
            {character.subclass && <Badge>{character.subclass}</Badge>}
          </div>
        </div>

        {/* Ability Scores */}
        <Section title="Ability Scores">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px" }}>
            {abilityKeys.map((key, idx) => {
              const score = character[key];
              const mod = getModifier(score);
              return <StatBox key={key} label={abilityLabels[idx]} value={`${mod >= 0 ? "+" : ""}${mod}`} size="md" />;
            })}
          </div>
        </Section>

        {/* Combat Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "24px" }}>
          <div style={{ textAlign: "center", padding: "20px", backgroundColor: C.surface, borderRadius: "12px", border: `2px solid ${C.primary}` }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Armor Class</div>
            <div style={{ fontSize: "36px", fontWeight: 800, color: C.primary }}>{character.ac}</div>
          </div>
          <div style={{ textAlign: "center", padding: "20px", backgroundColor: C.surface, borderRadius: "12px", border: `2px solid ${C.border}` }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Hit Points</div>
            <div style={{ fontSize: "36px", fontWeight: 800, color: C.success }}>{character.currentHp}</div>
            <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "2px" }}>/ {character.maxHp}</div>
          </div>
          <div style={{ textAlign: "center", padding: "20px", backgroundColor: C.surface, borderRadius: "12px", border: `2px solid ${C.border}` }}>
            <div style={{ fontSize: "10px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>Speed</div>
            <div style={{ fontSize: "36px", fontWeight: 800, color: C.primary }}>{character.speed}</div>
            <div style={{ fontSize: "11px", color: C.textMuted, marginTop: "2px" }}>ft.</div>
          </div>
        </div>

        {/* Proficiency, Initiative, Temp HP */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
          <div style={{ padding: "12px 16px", backgroundColor: C.surface, borderRadius: "10px", border: `1px solid ${C.border}`, textAlign: "center" }}>
            <div style={{ fontSize: "9px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Proficiency</div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: C.primary }}>+{profBonus}</div>
          </div>
          <div style={{ padding: "12px 16px", backgroundColor: C.surface, borderRadius: "10px", border: `1px solid ${C.border}`, textAlign: "center" }}>
            <div style={{ fontSize: "9px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Initiative</div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: C.primary }}>{character.initiative >= 0 ? `+${character.initiative}` : character.initiative}</div>
          </div>
          <div style={{ padding: "12px 16px", backgroundColor: C.surface, borderRadius: "10px", border: `1px solid ${C.border}`, textAlign: "center" }}>
            <div style={{ fontSize: "9px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Temp HP</div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: C.primary }}>{character.temporaryHp}</div>
          </div>
        </div>

        {/* Saving Throws */}
        <Section title="Saving Throws">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
            {savingThrowKeys.map((key) => {
              const st = character.savingThrows[key] ?? { proficient: false, value: 0 };
              const abilityMod = getModifier(character[key]);
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: C.surface, borderRadius: "8px", border: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${st.proficient ? C.primary : C.border}`, backgroundColor: st.proficient ? C.primary : "transparent" }} />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: C.text }}>{key.toUpperCase()}</span>
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: st.proficient ? C.primary : C.textSecondary }}>
                    {st.value >= 0 ? `+${st.value}` : st.value}
                  </span>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Skills */}
        <Section title="Skills">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px" }}>
            {skillsList.map(({ name, ability }) => {
              const proficient = character.skills[name] ?? false;
              const expert = (character.expertise || []).includes(name);
              const profMultiplier = expert ? 2 : 1;
              const abilityScore = character[ability as keyof Character] as number;
              const mod = getModifier(abilityScore);
              const total = mod + (profBonus * profMultiplier);
              return (
                <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px", backgroundColor: C.surface, borderRadius: "8px", border: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "18px", height: "18px", borderRadius: "4px", border: `2px solid ${proficient ? C.primary : C.border}`, backgroundColor: proficient ? C.primary : "transparent" }} />
                    <div>
                      <span style={{ fontSize: "12px", fontWeight: proficient ? 600 : 400, color: C.text }}>{name}</span>
                      {expert && <span style={{ fontSize: "8px", fontWeight: 700, color: C.danger, marginLeft: "6px" }}>EXP</span>}
                      <span style={{ fontSize: "10px", color: C.textMuted, marginLeft: "6px" }}>{ability.toUpperCase()}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: C.primary }}>{total >= 0 ? `+${total}` : total}</span>
                </div>
              );
            })}
          </div>
        </Section>
      </Page>

      {/* Page 2: Combat & Inventory */}
      <Page>
        {/* Attacks */}
        <Section title="Attacks">
          {character.attacks.filter((a) => a.name).length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px" }}>
              {character.attacks.filter((a) => a.name).map((attack) => (
                <div key={attack.id} style={{ padding: "14px", backgroundColor: C.surface, borderRadius: "10px", border: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: C.primary }}>{attack.name}</span>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: C.textSecondary }}>+{attack.attackBonus} to hit</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {attack.damageType && <DamageBadge type={attack.damageType} size="sm" showLabel={false} />}
                    {attack.damageType && (
                      <span style={{ fontSize: "11px", fontWeight: 600, color: getDamageTypeColor(attack.damageType), backgroundColor: getDamageTypeBgColor(attack.damageType), padding: "2px 8px", borderRadius: "4px" }}>
                        {attack.damageType}
                      </span>
                    )}
                    {attack.sneakAttack && <Badge color={C.danger} bgColor={C.danger + "10"}>+{attack.sneakAttack} sneak</Badge>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "12px", color: C.textMuted }}>No attacks</p>
          )}
        </Section>

        {/* Features & Traits */}
        <Section title="Features & Traits">
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {character.features.filter((f) => f.name).map((feature) => (
              <div key={feature.id} style={{ padding: "12px 14px", backgroundColor: C.surface, borderRadius: "10px", border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: C.primary, marginBottom: "4px" }}>{feature.name}</div>
                {feature.description && <div style={{ fontSize: "11px", color: C.textSecondary, lineHeight: 1.5 }}>{feature.description}</div>}
              </div>
            ))}
          </div>
        </Section>

        {/* Inventory */}
        <Section title="Inventory">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px" }}>
            {character.inventory.filter((item) => item.name).map((item) => (
              <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", backgroundColor: C.surface, borderRadius: "8px", border: `1px solid ${C.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {item.equipped && <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: C.success }} />}
                  <span style={{ fontSize: "12px", color: C.text, fontWeight: item.equipped ? 600 : 400 }}>{item.name}</span>
                </div>
                <span style={{ fontSize: "11px", color: C.textMuted }}>x{item.quantity}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Death Saves & Hit Dice */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px", paddingBottom: "6px", borderBottom: `2px solid ${C.primary}` }}>
              Death Saves
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              <div>
                <div style={{ fontSize: "9px", color: C.textMuted, marginBottom: "6px" }}>Successes</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {[0, 1, 2].map((i) => (
                    <div key={`s-${i}`} style={{ width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${character.deathSaveSuccesses > i ? C.success : C.border}`, backgroundColor: character.deathSaveSuccesses > i ? C.success : "transparent" }} />
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "9px", color: C.textMuted, marginBottom: "6px" }}>Failures</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  {[0, 1, 2].map((i) => (
                    <div key={`f-${i}`} style={{ width: "20px", height: "20px", borderRadius: "50%", border: `2px solid ${character.deathSaveFailures > i ? C.danger : C.border}`, backgroundColor: character.deathSaveFailures > i ? C.danger : "transparent" }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px", paddingBottom: "6px", borderBottom: `2px solid ${C.primary}` }}>
              Hit Dice
            </div>
            <div style={{ fontSize: "12px", color: C.textSecondary, marginBottom: "8px" }}>Total: {character.hitDiceTotal || "—"}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
              {Array.from({ length: character.hitDiceRemaining || 0 }).map((_, i) => (
                <div key={`r-${i}`} style={{ width: "18px", height: "18px", borderRadius: "4px", backgroundColor: C.primary }} />
              ))}
              {Array.from({ length: Math.max(0, (parseInt(character.hitDiceTotal) || 0) - (character.hitDiceRemaining || 0)) }).map((_, i) => (
                <div key={`u-${i}`} style={{ width: "18px", height: "18px", borderRadius: "4px", border: `1px solid ${C.border}` }} />
              ))}
            </div>
          </div>
        </div>
      </Page>

      {/* Page 3: Spells & Bio */}
      <Page>
        {/* Spellcasting Stats */}
        {character.spellcastingAbility && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
            <div style={{ padding: "14px", backgroundColor: C.surface, borderRadius: "10px", border: `1px solid ${C.border}`, textAlign: "center" }}>
              <div style={{ fontSize: "9px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Spell Save DC</div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: C.primary }}>{8 + profBonus + getModifier(character[character.spellcastingAbility as keyof Character] as number)}</div>
            </div>
            <div style={{ padding: "14px", backgroundColor: C.surface, borderRadius: "10px", border: `1px solid ${C.border}`, textAlign: "center" }}>
              <div style={{ fontSize: "9px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Spell Attack</div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: C.primary }}>+{profBonus + getModifier(character[character.spellcastingAbility as keyof Character] as number)}</div>
            </div>
            <div style={{ padding: "14px", backgroundColor: C.surface, borderRadius: "10px", border: `1px solid ${C.border}`, textAlign: "center" }}>
              <div style={{ fontSize: "9px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>Ability</div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: C.primary }}>{character.spellcastingAbility.toUpperCase()}</div>
            </div>
          </div>
        )}

        {/* Spell Slots */}
        {character.spellSlots && Object.keys(character.spellSlots).length > 0 && (
          <Section title="Spell Slots">
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {Object.entries(character.spellSlots).map(([level, count]) => {
                const expended = character.spellSlotsExpended?.[Number(level)] ?? 0;
                const remaining = (count as number) - expended;
                return (
                  <div key={level} style={{ padding: "10px 16px", backgroundColor: C.surface, borderRadius: "10px", border: `1px solid ${C.border}`, textAlign: "center", minWidth: "70px" }}>
                    <div style={{ fontSize: "9px", fontWeight: 700, color: C.textMuted, textTransform: "uppercase" }}>Level {level}</div>
                    <div style={{ fontSize: "18px", fontWeight: 700, color: remaining > 0 ? C.primary : C.textMuted }}>{remaining}<span style={{ fontSize: "12px", color: C.textMuted }}>/{count as number}</span></div>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Spells */}
        {character.spells.filter((s) => s.name).length > 0 && (
          <Section title="Spells">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
              {character.spells.filter((s) => s.name).map((spell) => (
                <div key={spell.id} style={{ padding: "12px", backgroundColor: C.surface, borderRadius: "10px", border: `1px solid ${C.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: C.primary }}>{spell.name}</span>
                    <span style={{ fontSize: "10px", fontWeight: 600, color: C.textMuted }}>{spell.level === 0 ? "Cantrip" : `Lvl ${spell.level}`}</span>
                  </div>
                  {(spell.damageDice || spell.damageType) && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
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
          </Section>
        )}

        {/* Appearance & Bio */}
        <Section title="Appearance & Bio">
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
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
                  <div style={{ fontSize: "10px", fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>{label}</div>
                  <div style={{ fontSize: "11px", color: C.textSecondary, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{value}</div>
                </div>
              )
            ))}
          </div>
        </Section>

        {/* Other Proficiencies */}
        {character.otherProficiencies && (
          <Section title="Other Proficiencies & Languages">
            <div style={{ fontSize: "11px", color: C.textSecondary, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {character.otherProficiencies}
            </div>
          </Section>
        )}
      </Page>
    </div>
  );
}
