"use client";

import type { SpellMechanicSummary } from "@/lib/spell-mechanics-accessor";
import type { Character } from "@/lib/storage";
import { DamageBadge } from "./DamageBadge";
import { ConditionBadge } from "./ConditionBadge";
import { DiceBadge } from "../DiceBadge";
import { resolveSpellMacros } from "@/lib/spell-macros";
import { getModifier } from "@/lib/storage";
import { getStaticClass } from "@/lib/srd-client";

interface SpellMechanicsSummaryProps {
  mechanic: SpellMechanicSummary | undefined;
  effectSummary?: string;
  character?: Character;
  ritual?: boolean;
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

export function SpellMechanicsChips({ mechanic, effectSummary, character, ritual = false, size = "sm" }: SpellMechanicsSummaryProps) {
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

  const fields: { label: string; value: React.ReactNode; fullWidth?: boolean }[] = [];

  fields.push({
    label: "Target",
    value: <span style={{ color: "#111", fontWeight: 500, fontSize: "13px" }}>{target}</span>,
  });

  fields.push({
    label: "Save",
    value: (
      <span style={{ color: resolution === "none" ? "#aaa" : "#111", fontWeight: 500, fontSize: "13px" }}>
        {resolution === "none" ? "None" : resolution}
      </span>
    ),
  });

  if (rangeText && !target.toLowerCase().includes("self") && rangeText !== "Self") {
    fields.push({
      label: "Range",
      value: <span style={{ color: "#111", fontWeight: 500, fontSize: "13px" }}>{rangeText}</span>,
    });
  }

  if (damageEffect?.amount || damageEffect?.damageType) {
    const amount = damageEffect.amount || "";
    const dtype = damageEffect.damageType || "";
    fields.push({
      label: "Damage",
      value: (
        <Badge style={{ backgroundColor: "#fff5f5", borderColor: "#feb2b2", color: "#c53030" }}>
          {amount && <span>{amount}</span>}
          {dtype && <span>{dtype}</span>}
        </Badge>
      ),
    });
  }

  if (healEffect?.amount) {
    fields.push({
      label: "Healing",
      value: (
        <Badge style={{ backgroundColor: "#f0fff4", borderColor: "#9ae6b4", color: "#276749" }}>
          <span>♥</span>
          <span>{healEffect.amount}</span>
        </Badge>
      ),
    });
  }

  if (tempHPFormula) {
    fields.push({
      label: "Temp HP",
      value: (
        <Badge style={{ backgroundColor: "#f0fff4", borderColor: "#9ae6b4", color: "#276749" }}>
          <span>♥</span>
          <span>{tempHPFormula}</span>
        </Badge>
      ),
    });
  }

  if (inflictedCondition) {
    fields.push({
      label: "Condition",
      value: (
        <Badge style={{ backgroundColor: "#fff7ed", borderColor: "#fed7aa", color: "#c05621" }}>
          {inflictedCondition}
        </Badge>
      ),
    });
  }

  if (immunityCondition) {
    fields.push({
      label: "Immune",
      value: (
        <Badge style={{ backgroundColor: "#fff7ed", borderColor: "#fed7aa", color: "#c05621" }}>
          {immunityCondition}
        </Badge>
      ),
    });
  }

  if (resistanceType) {
    fields.push({
      label: "Resist",
      value: (
        <Badge style={{ backgroundColor: "#f0fff4", borderColor: "#9ae6b4", color: "#276749" }}>
          <span>✦</span>
          <span>{resistanceType}</span>
        </Badge>
      ),
    });
  }

  fields.push({
    label: "Duration",
    value: <span style={{ color: "#111", fontWeight: 500, fontSize: "13px" }}>{duration}</span>,
  });

  if (hasConcentration || ritual) {
    const badges: React.ReactNode[] = [];
    if (hasConcentration) {
      badges.push(
        <Badge key="conc" style={{ backgroundColor: "#fff8e1", borderColor: "#f6e05e", color: "#b7791f" }}>
          Concentration
        </Badge>
      );
    }
    if (ritual) {
      badges.push(
        <Badge key="ritual" style={{ backgroundColor: "#f0fff4", borderColor: "#9ae6b4", color: "#276749" }}>
          Ritual
        </Badge>
      );
    }
    fields.push({
      label: "Requires",
      value: <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", flexWrap: "wrap" }}>{badges}</div>,
      fullWidth: true,
    });
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
        {fields.map((field) => (
          <div
            key={field.label}
            style={{
              gridColumn: field.fullWidth ? "1 / -1" : undefined,
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
              {field.label}
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
              {field.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { SpellMechanicSummary };
