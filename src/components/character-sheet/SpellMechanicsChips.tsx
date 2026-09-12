"use client";

import React from "react";
import type { SpellMechanicSummary } from "@/lib/spell-mechanics-accessor";
import type { Character } from "@/lib/storage";
import { DamageBadge } from "./DamageBadge";
import { ConditionBadge } from "./ConditionBadge";
import { DiceBadge } from "../DiceBadge";
import { InfoButton } from "@/components/InfoButton";
import { resolveSpellMacros } from "@/lib/spell-macros";
import { getModifier } from "@/lib/storage";
import { getStaticClass } from "@/lib/srd-client";

interface SpellMechanicsSummaryProps {
  mechanic: SpellMechanicSummary | undefined;
  effectSummary?: string;
  character?: Character;
  ritual?: boolean;
  actionType?: string | null;
  onHit?: string | null;
  saveType?: string | null;
  onFailedSave?: string | null;
  onSuccessfulSave?: string | null;
  ongoingEffect?: string | null;
  escapeCondition?: string | null;
  immunities?: string | null;
  upcastEffect?: string | null;
  components?: { verbal: boolean; somatic: boolean; material: boolean; materialDesc: string | null };
  size?: "sm" | "md";
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function humanize(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatTarget(m: SpellMechanicSummary): string {
  const t = m.targeting;
  if (t.type === "self") return "self";
  if (t.type === "point") return "point";
  if (t.type === "multiple") {
    const n = t.maxTargets ?? 1;
    return `${n} targets`;
  }
  if (t.type === "area") {
    const shape = t.shape ? capitalize(t.shape) : "area";
    const size = t.size ? `${t.size}-foot` : "";
    return `${size} ${shape}`.trim();
  }
  if (t.selfAllowed) return "self or creature";
  return "creature";
}

function formatResolution(m: SpellMechanicSummary): string {
  const r = m.resolution;
  if (!r) return "none";
  if (r.type === "attack") return "attack";
  if (r.type === "check") return "ability check";
  if (r.type === "save") {
    const ability = r.ability ? capitalize(r.ability) : "saving throw";
    return ability;
  }
  return "none";
}

function Badge({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 500,
    padding: "2px 8px",
    border: "1.5px solid",
    ...style,
  };
  return <span style={base}>{children}</span>;
}

function Cell({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        padding: "8px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "3px",
      }}
    >
      <span
        style={{
          fontSize: "10px",
          fontWeight: 600,
          color: "#aaa",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "3px",
        }}
      >
        {label}
      </span>
      <div
        style={{
          fontSize: "13px",
          fontWeight: 500,
          color: "#111",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          flexWrap: "wrap",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function BlankCell() {
  return <div style={{ backgroundColor: "#ffffff", padding: "8px 12px" }} />;
}

export function SpellMechanicsChips({
  mechanic,
  effectSummary,
  character,
  ritual = false,
  actionType,
  onHit,
  saveType,
  onFailedSave,
  onSuccessfulSave,
  ongoingEffect,
  escapeCondition,
  immunities,
  upcastEffect,
  components,
  size = "sm",
}: SpellMechanicsSummaryProps) {
  if (!mechanic) return null;

  const resolvedSummary = effectSummary ? resolveSpellMacros(effectSummary, character) : "";

  const damageEffect = mechanic.effects.find((e) => e.type === "damage");
  const healEffect = mechanic.effects.find((e) => e.type === "healing");
  const conditionEffect = mechanic.effects.find((e) => e.type === "condition");
  const utilityEffect = mechanic.effects.find((e) => e.type === "utility");
  const buffEffect = mechanic.effects.find((e) => e.type === "buff");
  const debuffEffect = mechanic.effects.find((e) => e.type === "debuff");
  const controlEffect = mechanic.effects.find((e) => e.type === "control");
  const summonEffect = mechanic.effects.find((e) => e.type === "summon");
  const teleportEffect = mechanic.effects.find((e) => e.type === "teleport");

  const hasConcentration = mechanic.casting.concentration;

  let tempHPFormula: string | null = null;
  let immunityCondition: string | null = null;
  if (utilityEffect?.description) {
    const desc = utilityEffect.description.trim();
    const lower = desc.toLowerCase();
    if (lower.includes("start of each of its turns") && lower.includes("temporary hit point")) {
      const immuneMatch = lower.match(/immune to being (\w+)/);
      if (immuneMatch) immunityCondition = immuneMatch[1];
      const amountMatch = desc.match(/temporary hit points? equal to ([^.,;]+?)(?:\s+at\s+|\s+for\s+|\s+until\s+|$)/i) ||
                         desc.match(/gains? ([^.,;]+?) temporary hit points?/i);
      if (amountMatch) {
        let formula = amountMatch[1].trim();
        if (formula.toLowerCase().includes("spellcasting ability modifier")) {
          const classData = character?.class ? getStaticClass(character.class, character?.ruleset) : undefined;
          const abilityKey = classData?.spellcastingAbility as keyof Character | undefined;
          const abilityScore = abilityKey ? (character?.[abilityKey] as number | undefined) : undefined;
          const modifier = abilityScore !== undefined ? getModifier(abilityScore) : null;
          if (modifier !== null) {
            formula = `${modifier} temp HP/turn`;
          } else {
            formula = "spellcasting modifier temp HP/turn";
          }
        } else if (formula.toLowerCase().includes("your ")) {
          formula = formula.replace(/your /gi, "").trim();
        }
        tempHPFormula = formula;
      } else {
        tempHPFormula = "temp HP/turn";
      }
    } else if (lower.includes("gain") && lower.includes("temporary hit point") && !lower.includes("each turn")) {
      const amountMatch = desc.match(/gain ([^.,;]+?) temporary hit points?/i);
      if (amountMatch) tempHPFormula = amountMatch[1].trim();
      else tempHPFormula = "temporary HP";
    }
  }

  let inflictedCondition: string | null = null;
  if (conditionEffect?.effectType) {
    inflictedCondition = conditionEffect.effectType.toLowerCase();
  }

  let resistanceType: string | null = null;
  if (buffEffect?.effectType === "resistance" && buffEffect.bonusTo) {
    resistanceType = buffEffect.bonusTo.toLowerCase();
  }

  const effectTypes: string[] = [];
  if (damageEffect) effectTypes.push("damage");
  if (healEffect) effectTypes.push("heal");
  if (tempHPFormula && !resolvedSummary.toLowerCase().includes("temporary hit point")) effectTypes.push("temp HP");
  if (buffEffect) effectTypes.push("buff");
  if (debuffEffect) effectTypes.push("debuff");
  if (controlEffect) effectTypes.push("control");
  if (summonEffect) effectTypes.push("summon");
  if (teleportEffect) effectTypes.push("teleport");
  if (utilityEffect && effectTypes.length === 0) effectTypes.push("utility");

  const target = formatTarget(mechanic);
  const resolution = formatResolution(mechanic);
  const duration = mechanic.casting.duration;
  const rangeText = mechanic.casting.range;

  const hasDamage = !!(damageEffect?.amount || damageEffect?.damageType);
  const hasHealing = !!healEffect?.amount;
  const hasTempHP = !!tempHPFormula;
  const hasOnHit = !!onHit;
  const hasOngoing = !!ongoingEffect;
  const hasOnFail = !!onFailedSave;
  const hasOnSave = !!onSuccessfulSave;
  const hasEscape = !!escapeCondition && escapeCondition !== "Effect ends when duration expires";
  const hasImmunities = !!immunities;
  const hasUpcast = !!upcastEffect;
  const hasRange = !!rangeText && !target.toLowerCase().includes("self") && rangeText !== "Self";
  const hasRequirements = hasConcentration || ritual;
  const hasComponents = !!components;

  const rows: [React.ReactNode, React.ReactNode][] = [];

  // Row 1: Target | Save
  rows.push([
    <Cell
      key="target"
      label="Target"
      value={<span style={{ color: "#111", fontWeight: 500, fontSize: "13px" }}>{target}</span>}
    />,
    <Cell
      key="save"
      label="Save"
      value={
        <span style={{ color: saveType ? "#111" : "#aaa", fontWeight: 500, fontSize: "13px" }}>
          {saveType ? `${saveType} Save` : "None"}
        </span>
      }
    />,
  ]);

  // Row 2: Action | Duration
  rows.push([
    <Cell
      key="action"
      label="Action"
      value={
        actionType === "Reaction" ? (
          <Badge style={{ backgroundColor: "#fff8e1", borderColor: "#f6e05e", color: "#b7791f" }}>
            {actionType}
          </Badge>
        ) : (
          <span style={{ color: "#111", fontWeight: 500, fontSize: "13px" }}>{actionType || "Action"}</span>
        )
      }
    />,
    <Cell
      key="duration"
      label="Duration"
      value={<span style={{ color: "#111", fontWeight: 500, fontSize: "13px" }}>{duration}</span>}
    />,
  ]);

  // Row 3: Damage | Range (if has damage OR range)
  if (hasDamage || hasRange) {
    rows.push([
      hasDamage ? (
        <Cell
          key="damage"
          label="Damage"
          value={
            <Badge style={{ backgroundColor: "#fff5f5", borderColor: "#feb2b2", color: "#c53030" }}>
              {damageEffect?.amount && <span>{damageEffect.amount}</span>}
              {damageEffect?.damageType && <span>{damageEffect.damageType}</span>}
            </Badge>
          }
        />
      ) : (
        <BlankCell key="damage-blank" />
      ),
      hasRange ? (
        <Cell
          key="range"
          label="Range"
          value={<span style={{ color: "#111", fontWeight: 500, fontSize: "13px" }}>{rangeText}</span>}
        />
      ) : (
        <BlankCell key="range-blank" />
      ),
    ]);
  }

  // Row 4: Healing | Temp HP (if has healing OR temp HP)
  if (hasHealing || hasTempHP) {
    rows.push([
      hasHealing ? (
        <Cell
          key="healing"
          label="Healing"
          value={
            <Badge style={{ backgroundColor: "#f0fff4", borderColor: "#9ae6b4", color: "#276749" }}>
              <span>♥</span>
              <span>{healEffect?.amount}</span>
            </Badge>
          }
        />
      ) : (
        <BlankCell key="healing-blank" />
      ),
      hasTempHP ? (
        <Cell
          key="tempHP"
          label="Temp HP"
          value={
            <Badge style={{ backgroundColor: "#f0fff4", borderColor: "#9ae6b4", color: "#276749" }}>
              <span>♥</span>
              <span>{tempHPFormula}</span>
            </Badge>
          }
        />
      ) : (
        <BlankCell key="tempHP-blank" />
      ),
    ]);
  }

  // Row 5: On Hit | Each Turn (if has onHit OR ongoingEffect)
  if (hasOnHit || hasOngoing) {
    rows.push([
      hasOnHit ? (
        <Cell
          key="onHit"
          label="On Hit"
          value={<span style={{ color: "#111", fontWeight: 500, fontSize: "13px" }}>{onHit}</span>}
        />
      ) : (
        <BlankCell key="onHit-blank" />
      ),
      hasOngoing ? (
        <Cell
          key="ongoing"
          label="Each Turn"
          value={<span style={{ color: "#111", fontWeight: 500, fontSize: "13px" }}>{ongoingEffect}</span>}
        />
      ) : (
        <BlankCell key="ongoing-blank" />
      ),
    ]);
  }

  // Row 6: On Fail | On Save (if has onFailedSave OR onSuccessfulSave)
  if (hasOnFail || hasOnSave) {
    rows.push([
      hasOnFail ? (
        <Cell
          key="onFail"
          label="On Fail"
          value={<span style={{ color: "#c53030", fontWeight: 500, fontSize: "13px" }}>{onFailedSave}</span>}
        />
      ) : (
        <BlankCell key="onFail-blank" />
      ),
      hasOnSave ? (
        <Cell
          key="onSave"
          label="On Save"
          value={<span style={{ color: "#276749", fontWeight: 500, fontSize: "13px" }}>{onSuccessfulSave}</span>}
        />
      ) : (
        <BlankCell key="onSave-blank" />
      ),
    ]);
  }

  // Row 7: Ends If | Immune (if has escapeCondition OR immunities)
  if (hasEscape || hasImmunities) {
    rows.push([
      hasEscape ? (
        <Cell
          key="escape"
          label="Ends If"
          value={<span style={{ color: "#2b6cb0", fontWeight: 500, fontSize: "13px" }}>{escapeCondition}</span>}
        />
      ) : (
        <BlankCell key="escape-blank" />
      ),
      hasImmunities ? (
        <Cell
          key="immune"
          label="Immune"
          value={<span style={{ color: "#888", fontWeight: 500, fontSize: "13px" }}>{immunities}</span>}
        />
      ) : (
        <BlankCell key="immune-blank" />
      ),
    ]);
  }

  // Row 8: Requires | Needs (always shown)
  const requireBadges: React.ReactNode[] = [];
  if (hasConcentration) {
    requireBadges.push(
      <Badge key="conc" style={{ backgroundColor: "#fff8e1", borderColor: "#f6e05e", color: "#b7791f" }}>
        Concentration
      </Badge>
    );
  }
  if (ritual) {
    requireBadges.push(
      <Badge key="ritual" style={{ backgroundColor: "#f0fff4", borderColor: "#9ae6b4", color: "#276749" }}>
        Ritual
      </Badge>
    );
  }
  if (actionType === "Reaction") {
    requireBadges.push(
      <Badge key="reaction" style={{ backgroundColor: "#fff8e1", borderColor: "#f6e05e", color: "#b7791f" }}>
        Reaction
      </Badge>
    );
  }

  const requireValue = requireBadges.length > 0 ? (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
      {requireBadges}
    </div>
  ) : (
    <span style={{ color: "#aaa", fontWeight: 500, fontSize: "13px" }}>None</span>
  );

  const needsParts: React.ReactNode[] = [];
  if (components?.verbal) needsParts.push(<span key="v">V</span>);
  if (components?.somatic) needsParts.push(<span key="s">S</span>);
  if (components?.material) {
    needsParts.push(
      <span key="m" style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
        M
        {components.materialDesc && <InfoButton title="Material Component" description={components.materialDesc} />}
      </span>
    );
  }
  const needsValue = needsParts.length > 0 ? (
    <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>
      {needsParts}
    </div>
  ) : (
    <span style={{ color: "#aaa", fontWeight: 500, fontSize: "13px" }}>None</span>
  );

  rows.push([
    <Cell key="requires" label="Requires" value={requireValue} />,
    <Cell key="needs" label="Needs" value={needsValue} />,
  ]);

  // Row 9: Upcast | blank (if has upcastEffect)
  if (hasUpcast) {
    rows.push([
      <Cell
        key="upcast"
        label="Upcast"
        value={<span style={{ color: "#6b46c1", fontWeight: 500, fontSize: "13px" }}>{upcastEffect}</span>}
      />,
      <BlankCell key="upcast-blank" />,
    ]);
  }

  return (
    <div
      style={{
        backgroundColor: "var(--color-bg)",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <div className="p-2">
        <p className="font-semibold leading-snug text-[var(--color-text-primary)]" style={{ fontSize: size === "sm" ? "11px" : "13px" }}>
          {resolvedSummary}
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1px",
          backgroundColor: "#f0f0f0",
          borderTop: "1px solid #f0f0f0",
          borderBottom: "1px solid #f0f0f0",
        }}
      >
        {rows.map(([left, right], idx) => (
          <React.Fragment key={idx}>
            {left}
            {right}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export { SpellMechanicSummary };
