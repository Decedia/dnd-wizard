"use client";

import type { Character } from "@/lib/storage";

interface CharacterSheetPrintProps {
  character: Character;
}

const PRINT_WIDTH = 794; // A4 width at 96dpi
const COLORS = {
  bg: "#f8f4e9",
  cardBg: "#fffef7",
  text: "#2c1810",
  textMuted: "#5c4a3a",
  gold: "#b8860b",
  burgundy: "#722f37",
  border: "#d4c5a9",
  parchment: "#f5f0e1",
};

function Page({ children, pageNum }: { children: React.ReactNode; pageNum?: number }) {
  return (
    <div
      data-print-page
      style={{
        width: PRINT_WIDTH,
        minHeight: "1030px",
        backgroundColor: COLORS.bg,
        color: COLORS.text,
        padding: "24px",
        boxSizing: "border-box",
        pageBreakAfter: pageNum && pageNum < 3 ? "always" : "auto",
      }}
    >
      {children}
    </div>
  );
}

export function CharacterSheetPrint({ character }: CharacterSheetPrintProps) {
  const profBonus = character.proficiencyBonus || 2;
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
  const savingThrowKeys = ["str", "dex", "con", "int", "wis", "cha"] as const;
  const abilityLabels = ["STR", "DEX", "CON", "INT", "WIS", "CHA"] as const;
  const abilityKeys = ["str", "dex", "con", "int", "wis", "cha"] as const;

  const getMod = (score: number) => Math.floor((score - 10) / 2);

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      {/* Page 1 */}
      <Page pageNum={1}>
        {/* Header / Scroll Banner */}
        <div style={{ position: "relative", textAlign: "center", marginBottom: "16px", padding: "0 20px" }}>
          <svg viewBox="0 0 400 60" style={{ position: "absolute", left: 0, right: 0, top: -5, width: "100%", height: 50 }} preserveAspectRatio="none">
            <defs>
              <linearGradient id="printScrollGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={COLORS.gold} stopOpacity="0.2" />
                <stop offset="50%" stopColor={COLORS.gold} stopOpacity="0.08" />
                <stop offset="100%" stopColor={COLORS.gold} stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <path d="M20 10 Q200 -5 380 10 L370 45 Q200 55 30 45 Z" fill="url(#printScrollGrad)" stroke={COLORS.gold} strokeWidth="1.5" opacity="0.5" />
            <path d="M30 15 Q200 3 370 15 L362 40 Q200 48 38 40 Z" fill="none" stroke={COLORS.gold} strokeWidth="0.75" opacity="0.3" />
          </svg>
          <div style={{ position: "relative", zIndex: 1, paddingTop: "8px" }}>
            <h1 style={{ fontFamily: "serif", fontSize: "22px", fontWeight: "bold", color: COLORS.burgundy, margin: 0 }}>
              {character.name || "Unnamed Character"}
            </h1>
            <p style={{ fontSize: "11px", color: COLORS.textMuted, marginTop: "4px" }}>
              {character.race} {character.class} Level {character.level} {character.subclass ? `• ${character.subclass}` : ""}
            </p>
          </div>
        </div>

        {/* Top row: Ability Scores + Combat */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
          {/* Ability Scores */}
          <div style={{ flex: "0 0 55%", backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "16px" }}>
            <h2 style={{ fontSize: "13px", fontWeight: "bold", color: COLORS.burgundy, marginBottom: "12px", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: "6px" }}>
              Ability Scores
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              {abilityKeys.map((key, idx) => {
                const score = character[key];
                const mod = getMod(score);
                return (
                  <div key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <div style={{
                      width: "64px", height: "64px", borderRadius: "50%",
                      border: `2px solid ${COLORS.gold}`, backgroundColor: COLORS.parchment,
                      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                    }}>
                      <span style={{ fontSize: "9px", fontWeight: "medium", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {abilityLabels[idx]}
                      </span>
                      <span style={{ fontSize: "18px", fontWeight: "bold", color: mod >= 0 ? COLORS.gold : "#8b0000" }}>
                        {mod >= 0 ? `+${mod}` : mod}
                      </span>
                    </div>
                    <div style={{ marginTop: "4px", fontSize: "10px", fontWeight: "bold", color: COLORS.text, backgroundColor: COLORS.bg, padding: "1px 8px", borderRadius: "10px", border: `1px solid ${COLORS.border}` }}>
                      {score}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Combat Stats */}
          <div style={{ flex: 1, backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "16px" }}>
            <h2 style={{ fontSize: "13px", fontWeight: "bold", color: COLORS.burgundy, marginBottom: "12px", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: "6px" }}>
              Combat Stats
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {/* AC with shield */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ position: "relative", width: "60px", height: "72px" }}>
                  <svg viewBox="0 0 100 120" style={{ width: "100%", height: "100%", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.15))" }}>
                    <defs>
                      <linearGradient id="printShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={COLORS.burgundy} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={COLORS.burgundy} stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    <path d="M50 5 L90 20 L90 55 C90 80 50 115 50 115 C50 115 10 80 10 55 L10 20 Z" fill="url(#printShieldGrad)" stroke={COLORS.burgundy} strokeWidth="3" strokeLinejoin="round" />
                    <path d="M50 15 L80 27 L80 55 C80 75 50 103 50 103 C50 103 20 75 20 55 L20 27 Z" fill="none" stroke={COLORS.burgundy} strokeWidth="1.5" opacity="0.4" />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "8px", color: COLORS.textMuted, textTransform: "uppercase" }}>AC</span>
                    <span style={{ fontSize: "20px", fontWeight: "bold", color: COLORS.gold }}>{character.ac}</span>
                  </div>
                </div>
                <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "6px", backgroundColor: COLORS.bg, borderRadius: "4px", border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: "9px", color: COLORS.textMuted }}>Current HP</div>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: COLORS.text }}>{character.currentHp}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "6px", backgroundColor: COLORS.bg, borderRadius: "4px", border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: "9px", color: COLORS.textMuted }}>Max HP</div>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: COLORS.text }}>{character.maxHp}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "6px", backgroundColor: COLORS.bg, borderRadius: "4px", border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: "9px", color: COLORS.textMuted }}>Temp HP</div>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: COLORS.text }}>{character.temporaryHp}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "6px", backgroundColor: COLORS.bg, borderRadius: "4px", border: `1px solid ${COLORS.border}` }}>
                    <div style={{ fontSize: "9px", color: COLORS.textMuted }}>Speed</div>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: COLORS.text }}>{character.speed}ft</div>
                  </div>
                </div>
              </div>

              {/* Saving Throws */}
              <div>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
                  Saving Throws
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  {savingThrowKeys.map((key) => {
                    const st = character.savingThrows[key] ?? { proficient: false, value: 0 };
                    return (
                      <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "3px 6px", backgroundColor: COLORS.bg, borderRadius: "4px", border: `1px solid ${COLORS.border}` }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "11px", fontWeight: "bold", color: COLORS.text, width: "28px" }}>{key.toUpperCase()}</span>
                          <div style={{
                            width: "16px", height: "16px", borderRadius: "50%",
                            border: `2px solid ${st.proficient ? COLORS.gold : COLORS.border}`,
                            backgroundColor: st.proficient ? COLORS.gold : "transparent",
                          }} />
                        </div>
                        <span style={{ fontSize: "12px", fontWeight: "bold", color: COLORS.text, width: "30px", textAlign: "right" }}>
                          {st.value >= 0 ? `+${st.value}` : st.value}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div style={{ backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: "bold", color: COLORS.burgundy, marginBottom: "10px", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: "6px" }}>
            Skills
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "4px" }}>
            {skillsList.map((name) => {
              const proficient = character.skills[name] ?? false;
              const expert = (character.expertise || []).includes(name);
              const profMultiplier = expert ? 2 : 1;
              const abilityKey = abilityMap[name] || "dex";
              const abilityScore = character[abilityKey as keyof Character] as number;
              const mod = getMod(abilityScore);
              const total = mod + (profBonus * profMultiplier);
              return (
                <div key={name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "3px 6px", backgroundColor: COLORS.bg, borderRadius: "4px", border: `1px solid ${COLORS.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "10px", color: COLORS.textMuted, width: "18px" }}>
                      {proficient ? "★" : ""}
                    </span>
                    <span style={{ fontSize: "11px", color: COLORS.text }}>
                      {name}
                      {expert && <span style={{ fontSize: "8px", fontWeight: "bold", color: COLORS.burgundy, marginLeft: "3px", backgroundColor: COLORS.parchment, padding: "1px 4px", borderRadius: "3px", border: `1px solid ${COLORS.burgundy}30` }}>EXPERTISE</span>}
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: "bold", color: COLORS.text, width: "28px", textAlign: "right" }}>
                    {total >= 0 ? `+${total}` : total}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Death Saves + Hit Dice */}
        <div style={{ display: "flex", gap: "16px", marginBottom: "16px" }}>
          <div style={{ flex: 1, backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "16px" }}>
            <h2 style={{ fontSize: "13px", fontWeight: "bold", color: COLORS.burgundy, marginBottom: "10px", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: "6px" }}>
              Death Saves
            </h2>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Successes</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {[0, 1, 2].map((i) => (
                    <div key={`s-${i}`} style={{
                      width: "16px", height: "16px", borderRadius: "50%",
                      border: `2px solid ${character.deathSaveSuccesses > i ? COLORS.burgundy : COLORS.border}`,
                      backgroundColor: character.deathSaveSuccesses > i ? COLORS.burgundy : "transparent",
                      boxShadow: character.deathSaveSuccesses > i ? `0 0 6px ${COLORS.burgundy}80` : "none",
                    }} />
                  ))}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "10px", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>Failures</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  {[0, 1, 2].map((i) => (
                    <div key={`f-${i}`} style={{
                      width: "16px", height: "16px", borderRadius: "50%",
                      border: `2px solid ${character.deathSaveFailures > i ? "#8b0000" : COLORS.border}`,
                      backgroundColor: character.deathSaveFailures > i ? "#8b0000" : "transparent",
                      boxShadow: character.deathSaveFailures > i ? "0 0 6px rgba(139,0,0,0.5)" : "none",
                    }} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ flex: 1, backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: "8px", padding: "16px" }}>
            <h2 style={{ fontSize: "13px", fontWeight: "bold", color: COLORS.burgundy, marginBottom: "10px", borderBottom: `1px solid ${COLORS.border}`, paddingBottom: "6px" }}>
              Hit Dice
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div>
                <span style={{ fontSize: "10px", color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Total: {character.hitDiceTotal || "—"}</span>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px" }}>
                {Array.from({ length: character.hitDiceRemaining || 0 }).map((_, i) => (
                  <svg key={`r-${i}`} viewBox="0 0 20 20" style={{ width: "16px", height: "16px" }}>
                    <polygon points="10,1 18,5 18,15 10,19 2,15 2,5" fill={COLORS.burgundy} stroke={COLORS.burgundy} strokeWidth="1.5" opacity="0.8" />
                    <circle cx="10" cy="10" r="2" fill="#ffcccb" opacity="0.6" />
                  </svg>
                ))}
                {Array.from({ length: Math.max(0, (parseInt(character.hitDiceTotal) || 0) - (character.hitDiceRemaining || 0)) }).map((_, i) => (
                  <svg key={`u-${i}`} viewBox="0 0 20 20" style={{ width: "16px", height: "16px" }}>
                    <polygon points="10,1 18,5 18,15 10,19 2,15 2,5" fill="transparent" stroke={COLORS.burgundy} strokeWidth="1.5" opacity="0.4" />
                    <circle cx="10" cy="10" r="2" fill={COLORS.burgundy} opacity="0.3" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Page>

      {/* Page 2: Features, Attacks, Inventory, Proficiencies */}
      <Page pageNum={2}>
        <h2 style={{ fontSize: "16px", fontWeight: "bold", color: COLORS.burgundy, marginBottom: "12px", borderBottom: `2px solid ${COLORS.gold}`, paddingBottom: "6px" }}>
          Features & Traits
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
          {character.features.filter((f) => f.name).map((feature) => (
            <div key={feature.id} style={{ padding: "6px 10px", backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: "4px" }}>
              <div style={{ fontSize: "12px", fontWeight: "bold", color: COLORS.burgundy }}>{feature.name}</div>
              {feature.description && (
                <div style={{ fontSize: "10px", color: COLORS.textMuted, marginTop: "2px" }}>{feature.description}</div>
              )}
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: "16px", fontWeight: "bold", color: COLORS.burgundy, marginBottom: "12px", borderBottom: `2px solid ${COLORS.gold}`, paddingBottom: "6px" }}>
          Attacks
        </h2>
        {character.attacks.filter((a) => a.name).length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}>
            {character.attacks.filter((a) => a.name).map((attack) => (
              <div key={attack.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: "4px" }}>
                <span style={{ fontSize: "12px", fontWeight: "bold", color: COLORS.text }}>{attack.name}</span>
                <span style={{ fontSize: "11px", color: COLORS.textMuted }}>
                  {attack.attackBonus ? `+${attack.attackBonus}` : ""} {attack.damageType}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "11px", color: COLORS.textMuted, marginBottom: "16px" }}>No attacks</p>
        )}

        <h2 style={{ fontSize: "16px", fontWeight: "bold", color: COLORS.burgundy, marginBottom: "12px", borderBottom: `2px solid ${COLORS.gold}`, paddingBottom: "6px" }}>
          Inventory
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "16px" }}>
          {character.inventory.filter((item) => item.name).map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 10px", backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: "4px" }}>
              <span style={{ fontSize: "11px", color: COLORS.text }}>{item.name}</span>
              <span style={{ fontSize: "10px", color: COLORS.textMuted }}>x{item.quantity}</span>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: "16px", fontWeight: "bold", color: COLORS.burgundy, marginBottom: "12px", borderBottom: `2px solid ${COLORS.gold}`, paddingBottom: "6px" }}>
          Other Proficiencies
        </h2>
        {character.otherProficiencies ? (
          <div style={{ fontSize: "11px", color: COLORS.text, backgroundColor: COLORS.cardBg, padding: "10px", borderRadius: "4px", border: `1px solid ${COLORS.border}`, whiteSpace: "pre-wrap", marginBottom: "16px" }}>
            {character.otherProficiencies}
          </div>
        ) : (
          <p style={{ fontSize: "11px", color: COLORS.textMuted, marginBottom: "16px" }}>None</p>
        )}
      </Page>

      {/* Page 3: Spells, Spellcasting, Appearance */}
      <Page pageNum={3}>
        {character.spells.filter((s) => s.name).length > 0 && (
          <>
            <h2 style={{ fontSize: "16px", fontWeight: "bold", color: COLORS.burgundy, marginBottom: "12px", borderBottom: `2px solid ${COLORS.gold}`, paddingBottom: "6px" }}>
              Spells
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "16px" }}>
              {character.spells.filter((s) => s.name).map((spell) => (
                <div key={spell.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 10px", backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: "4px" }}>
                  <span style={{ fontSize: "11px", color: COLORS.text }}>{spell.name}</span>
                  <span style={{ fontSize: "10px", color: COLORS.textMuted }}>{spell.level === 0 ? "Cantrip" : `Level ${spell.level}`}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {character.spellSlots && Object.keys(character.spellSlots).length > 0 && (
          <>
            <h2 style={{ fontSize: "16px", fontWeight: "bold", color: COLORS.burgundy, marginBottom: "12px", borderBottom: `2px solid ${COLORS.gold}`, paddingBottom: "6px" }}>
              Spell Slots
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              {Object.entries(character.spellSlots).map(([level, count]) => (
                <div key={level} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "6px 10px", backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: "4px" }}>
                  <div style={{ fontSize: "9px", color: COLORS.textMuted, textTransform: "uppercase" }}>Level {level}</div>
                  <div style={{ fontSize: "14px", fontWeight: "bold", color: COLORS.gold }}>{count}</div>
                </div>
              ))}
            </div>
          </>
        )}

        <h2 style={{ fontSize: "16px", fontWeight: "bold", color: COLORS.burgundy, marginBottom: "12px", borderBottom: `2px solid ${COLORS.gold}`, paddingBottom: "6px" }}>
          Appearance & Bio
        </h2>
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
              <div key={label} style={{ padding: "6px 10px", backgroundColor: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: "4px" }}>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: COLORS.burgundy, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                <div style={{ fontSize: "11px", color: COLORS.text, marginTop: "2px", whiteSpace: "pre-wrap" }}>{value}</div>
              </div>
            )
          ))}
        </div>
      </Page>
    </div>
  );
}
