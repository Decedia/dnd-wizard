"use client";

import type { SpellMechanicSummary } from "@/lib/spell-mechanics-accessor";
import type { Character } from "@/lib/storage";
import { DamageBadge } from "./DamageBadge";
import { ConditionBadge } from "./ConditionBadge";
import { resolveSpellMacros } from "@/lib/spell-macros";

interface SpellMechanicsSummaryProps {
  mechanic: SpellMechanicSummary | undefined;
  effectSummary?: string;
  character?: Character;
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
  if (t.type === "self") return "you";
  if (t.type === "point") return "a point you choose";
  if (t.type === "multiple") {
    const n = t.maxTargets ?? 1;
    return `${n} creature${n !== 1 ? "s" : ""} within range`;
  }
  if (t.type === "area") {
    const shape = t.shape ? capitalize(t.shape) : "area";
    const size = t.size ? `${t.size}-foot` : "";
    return `a ${size} ${shape}${t.maxRange ? ` within ${t.maxRange} ft` : ""}`;
  }
  if (t.selfAllowed) return "you or a creature you can see";
  return "a creature you can see";
}

function formatResolution(m: SpellMechanicSummary): string | null {
  const r = m.resolution;
  if (!r) return null;
  if (r.type === "attack") return "on a hit";
  if (r.type === "check") return "on an ability check";
  if (r.type === "save") {
    const ability = r.ability ? capitalize(r.ability) : "a saving throw";
    if (r.onSuccess === "negates") return `on a failed ${ability} save (no effect on success)`;
    if (r.onSuccess === "half") return `on a failed ${ability} save (half on success)`;
    if (r.onSuccess === "full") return `on a failed ${ability} save (full on success)`;
    if (r.onFailure === "full") return `on a failed ${ability} save`;
    return `on a ${ability} save`;
  }
  return null;
}

const UTILITY_LABELS: Record<string, string> = {
  negateSpell: "negates the target spell",
  negateMagicMissile: "negates Magic Missile",
  instantKill: "kills the target",
  freeForm: "produces any effect of 8th level or lower",
  igniteFlammableObjects: "ignites flammable objects in the area",
  spreadAroundCorners: "spreads around corners",
  counterspell: "counters the target spell",
  endsOnAttackOrCast: "ends if the target attacks or casts a spell",
  transform: "transforms the target",
  flammable: "is flammable",
  doubleSpeed: "doubles the target's speed",
  extraAction: "grants an extra action",
  baseAC13PlusDex: "sets base AC to 13 + Dexterity",
};

const BUFF_LABELS: Record<string, string> = {
  "d4 bonus": "a d4 bonus to attack rolls and saving throws",
  doubleSpeed: "doubled speed",
  extraAction: "an extra action",
  baseAC13PlusDex: "base AC of 13 + Dexterity",
  resistance: "resistance to a damage type",
  transform: "a new form",
  advantage: "advantage",
  restrained: "restrained condition",
};

function TempHPBadge({ formula, size = "sm" }: { formula: string; size?: "sm" | "md" }) {
  return (
    <span
      className="inline-flex items-center font-semibold rounded px-1.5 py-0.5"
      style={{
        fontSize: size === "sm" ? "10px" : "12px",
        backgroundColor: "var(--color-temp-hp-bg, #fef3c7)",
        color: "var(--color-temp-hp, #92400e)",
        border: "1px solid var(--color-temp-hp-border, #fcd34d)",
      }}
    >
      ♡ {formula}
    </span>
  );
}

export function SpellMechanicsChips({ mechanic, effectSummary, character, size = "sm" }: SpellMechanicsSummaryProps) {
  if (!mechanic) return null;

  const damageEffect = mechanic.effects.find((e) => e.type === "damage");
  const healEffect = mechanic.effects.find((e) => e.type === "healing");
  const hasConcentration = mechanic.casting.concentration;
  const conditionEffect = mechanic.effects.find((e) => e.type === "condition");
  const utilityEffect = mechanic.effects.find((e) => e.type === "utility");
  const buffEffect = mechanic.effects.find((e) => e.type === "buff");
  const debuffEffect = mechanic.effects.find((e) => e.type === "debuff");

  let tempHPFormula: string | null = null;
  let immunityCondition: string | null = null;
  if (utilityEffect?.description) {
    const desc = utilityEffect.description.trim();
    const lower = desc.toLowerCase();
    if (lower.includes("start of each of its turns") && lower.includes("temporary hit point")) {
      const immuneMatch = lower.match(/immune to being (\w+)/);
      if (immuneMatch) immunityCondition = immuneMatch[1];
      const amountMatch = desc.match(/temporary hit points? equal to ([^.]+)/i) ||
                         desc.match(/gains? ([^.]+) temporary hit points?/i);
      if (amountMatch) tempHPFormula = amountMatch[1].trim() + "/turn";
      else tempHPFormula = "temp HP/turn";
    } else if (lower.includes("gain") && lower.includes("temporary hit point") && !lower.includes("each turn")) {
      const amountMatch = desc.match(/gain ([^.]+) temporary hit points?/i);
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

  const resolvedSummary = effectSummary ? resolveSpellMacros(effectSummary, character) : "";

  const boxFontSize = size === "sm" ? "11px" : "13px";
  const badgeFontSize = size === "sm" ? "10px" : "12px";

  const summaryMentionsTempHP = resolvedSummary.toLowerCase().includes("temporary hit point") || resolvedSummary.toLowerCase().includes("temp hp");

  return (
    <div
      className="rounded-lg p-2"
      style={{
        backgroundColor: "var(--color-effect-summary-bg, #fef3c7)",
        color: "var(--color-effect-summary-text, #78350f)",
        border: "2px solid var(--color-effect-summary-border, #92400e)",
      }}
    >
      <p className="font-semibold leading-snug" style={{ fontSize: boxFontSize }}>
        {resolvedSummary}
      </p>
      <div className="flex flex-wrap items-center gap-1.5 mt-1">
        {damageEffect?.damageType && (
          <DamageBadge type={damageEffect.damageType} size={size} showLabel={false} />
        )}
        {healEffect && (
          <span
            className="inline-flex items-center font-semibold rounded px-1.5 py-0.5"
            style={{
              fontSize: badgeFontSize,
              backgroundColor: "var(--color-heal-bg, #dcfce7)",
              color: "var(--color-heal, #166534)",
              border: "1px solid var(--color-heal-border, #86efac)",
            }}
          >
            ♡ {healEffect.amount || "heal"}
          </span>
        )}
        {tempHPFormula && !summaryMentionsTempHP && (
          <TempHPBadge formula={tempHPFormula} size={size} />
        )}
        {immunityCondition && (
          <ConditionBadge condition={immunityCondition} size={size} />
        )}
        {inflictedCondition && (
          <ConditionBadge condition={inflictedCondition} size={size} />
        )}
        {resistanceType && (
          <span
            className="inline-flex items-center font-semibold rounded px-1.5 py-0.5"
            style={{
              fontSize: badgeFontSize,
              backgroundColor: "var(--color-resist-bg, #e0e7ff)",
              color: "var(--color-resist, #3730a3)",
              border: "1px solid var(--color-resist-border, #c7d2fe)",
            }}
          >
            ✦ {resistanceType}
          </span>
        )}
        {buffEffect?.bonus !== undefined && buffEffect.bonusTo && (
          <span
            className="inline-flex items-center font-semibold rounded px-1.5 py-0.5"
            style={{
              fontSize: badgeFontSize,
              backgroundColor: "var(--color-info-100, #dbeafe)",
              color: "var(--color-info-700, #1d4ed8)",
              border: "1px solid var(--color-info-200, #93c5fd)",
            }}
          >
            +{buffEffect.bonus} {humanize(buffEffect.bonusTo)}
          </span>
        )}
        {debuffEffect?.bonus !== undefined && debuffEffect.bonusTo && (
          <span
            className="inline-flex items-center font-semibold rounded px-1.5 py-0.5"
            style={{
              fontSize: badgeFontSize,
              backgroundColor: "var(--color-error-100, #fee2e2)",
              color: "var(--color-error-700, #b91c1c)",
              border: "1px solid var(--color-error-200, #fecaca)",
            }}
          >
            -{debuffEffect.bonus} {humanize(debuffEffect.bonusTo)}
          </span>
        )}
        {hasConcentration && (
          <span
            className="inline-flex items-center font-semibold rounded px-1.5 py-0.5 text-[10px]"
            style={{
              backgroundColor: "var(--color-state-concentration-bg)",
              color: "var(--color-state-concentration)",
            }}
          >
            Conc
          </span>
        )}
      </div>
    </div>
  );
}

export { SpellMechanicSummary };
