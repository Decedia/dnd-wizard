"use client";

import { useMemo } from "react";
import type { SpellMechanicSummary } from "@/lib/spell-mechanics-accessor";
import { DamageBadge } from "./DamageBadge";
import { ConditionBadge } from "./ConditionBadge";

interface SpellMechanicsSummaryProps {
  mechanic: SpellMechanicSummary | undefined;
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

function formatEffect(m: SpellMechanicSummary): string | null {
  const effects = m.effects;
  if (effects.length === 0) return null;

  const damage = effects.find((e) => e.type === "damage");
  if (damage) {
    const amount = damage.amount || "damage";
    const type = damage.damageType ? capitalize(damage.damageType) : "damage";
    return `deals ${amount} ${type} damage`;
  }
  const heal = effects.find((e) => e.type === "healing");
  if (heal) {
    return `heals up to ${heal.amount || "hit points"}`;
  }
  const buff = effects.find((e) => e.type === "buff");
  if (buff) {
    const key = buff.special || buff.effectType || "";
    if (BUFF_LABELS[key]) return `grants ${BUFF_LABELS[key]}`;
    if (buff.bonusTo === "AC") return "grants +2 AC";
    if (buff.effectType === "advantage") return `grants advantage on ${humanize(buff.bonusTo || "saving throws")}`;
    return `grants ${humanize(buff.bonusTo || buff.effectType || "a bonus")}`;
  }
  const debuff = effects.find((e) => e.type === "debuff");
  if (debuff) {
    return `imposes ${humanize(debuff.effectType || "a disadvantage")}`;
  }
  const cond = effects.find((e) => e.type === "condition");
  if (cond) {
    return `inflicts ${humanize(cond.effectType || "a condition")}`;
  }
  const control = effects.find((e) => e.type === "control");
  if (control) {
    return `creates ${humanize(control.effectType || "a hazard")}`;
  }
  const summon = effects.find((e) => e.type === "summon");
  if (summon) {
    return "summons a creature";
  }
  const tele = effects.find((e) => e.type === "teleport");
  if (tele) {
    return "teleports the target";
  }
  const util = effects.find((e) => e.type === "utility");
  if (util) {
    if (util.special && UTILITY_LABELS[util.special]) return UTILITY_LABELS[util.special];
    if (util.description) {
      const desc = util.description.trim();
      const lower = desc.toLowerCase();
      
      // Temp HP each turn (Heroism-style)
      if (lower.includes("start of each of its turns") && lower.includes("temporary hit point")) {
        const immuneMatch = lower.match(/immune to being (\w+)/);
        let tempHPFormula = "temp HP/turn";
        const amountMatch = desc.match(/temporary hit points? equal to ([^.]+)/i) ||
                           desc.match(/gains? ([^.]+) temporary hit points?/i);
        if (amountMatch) tempHPFormula = amountMatch[1].trim() + "/turn";
        if (immuneMatch) return `grants immunity to ${immuneMatch[1]} + ${tempHPFormula}`;
        return `grants ${tempHPFormula}`;
      }
      
      // One-time temp HP gain (False Life, Armor of Agathys)
      if (lower.includes("gain") && lower.includes("temporary hit point") && !lower.includes("each turn")) {
        const amountMatch = desc.match(/gain ([^.]+) temporary hit points?/i);
        if (amountMatch) return `grants ${amountMatch[1].trim()} temp HP`;
        return "grants temporary HP";
      }
      
      // Immunity to condition
      if (lower.includes("immune to being ") || lower.includes("immunity to ")) {
        const match = lower.match(/immune to being (\w+)/) || lower.match(/immunity to (\w+)/);
        if (match) return `grants immunity to ${match[1]}`;
        return "grants immunity";
      }
      
      // Advantage on checks/saves
      if (lower.includes("advantage on") || lower.includes("advantage to")) {
        const match = desc.match(/advantage on ([^.]+)/i);
        if (match) return `grants advantage on ${match[1]}`;
        return "grants advantage";
      }
      
      // Resistance
      if (lower.includes("resistance to")) {
        const match = desc.match(/resistance to ([^.]+)/i);
        if (match) return `grants resistance to ${match[1]}`;
        return "grants resistance";
      }
      
      // Disadvantage on enemies
      if (lower.includes("disadvantage on") && (lower.includes("attack roll") || lower.includes("saving throw"))) {
        return "imposes disadvantage on attacks/saves";
      }
      
      const firstSentence = desc.split(". ")[0];
      return firstSentence.length > 100 ? firstSentence.slice(0, 97) + "..." : firstSentence;
    }
    return util.special ? humanize(util.special) : "has a special effect";
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

function buildSentence(m: SpellMechanicSummary): string {
  const target = formatTarget(m);
  const res = formatResolution(m);
  const effect = formatEffect(m);

  const parts: string[] = [];
  parts.push(target);
  if (res) parts.push(res);
  if (effect) parts.push(effect);
  if (m.casting.concentration) parts.push("Concentration");
  return parts.join(" · ");
}

export function SpellMechanicsChips({ mechanic, size = "sm" }: SpellMechanicsSummaryProps) {
  const sentence = useMemo(() => (mechanic ? buildSentence(mechanic) : ""), [mechanic]);

  if (!mechanic) return null;

  const damageEffect = mechanic.effects.find((e) => e.type === "damage");
  const healEffect = mechanic.effects.find((e) => e.type === "healing");
  const hasConcentration = mechanic.casting.concentration;
  const conditionEffect = mechanic.effects.find((e) => e.type === "condition");
  const utilityEffect = mechanic.effects.find((e) => e.type === "utility");
  const buffEffect = mechanic.effects.find((e) => e.type === "buff");
  const debuffEffect = mechanic.effects.find((e) => e.type === "debuff");

  const lineClass = size === "sm" ? "text-[11px]" : "text-xs";

  // Extract temp HP formula from utility effect
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

  // Extract condition from condition effect
  let inflictedCondition: string | null = null;
  if (conditionEffect?.effectType) {
    inflictedCondition = conditionEffect.effectType.toLowerCase();
  }

  // Extract resistance from buff effect
  let resistanceType: string | null = null;
  if (buffEffect?.effectType === "resistance" && buffEffect.bonusTo) {
    resistanceType = buffEffect.bonusTo.toLowerCase();
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <p className={`text-[var(--color-text-secondary)] leading-snug ${lineClass} min-w-0`}>
        {sentence}
      </p>
      {damageEffect?.damageType && (
        <DamageBadge type={damageEffect.damageType} size={size} showLabel={false} />
      )}
      {healEffect && (
        <span
          className="inline-flex items-center font-semibold rounded px-1.5 py-0.5"
          style={{
            fontSize: size === "sm" ? "10px" : "12px",
            backgroundColor: "var(--color-heal-bg, #dcfce7)",
            color: "var(--color-heal, #166534)",
            border: "1px solid var(--color-heal-border, #86efac)",
          }}
        >
          ♡ {healEffect.amount || "heal"}
        </span>
      )}
      {tempHPFormula && (
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
            fontSize: size === "sm" ? "10px" : "12px",
            backgroundColor: "var(--color-resist-bg, #e0e7ff)",
            color: "var(--color-resist, #3730a3)",
            border: "1px solid var(--color-resist-border, #c7d2fe)",
          }}
        >
          ✦ {resistanceType}
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
          C
        </span>
      )}
    </div>
  );
}

export { SpellMechanicSummary };