"use client";

import type { SpellMechanicSummary } from "@/lib/spell-mechanics-accessor";
import type { Character } from "@/lib/storage";
import { DamageBadge } from "./DamageBadge";
import { ConditionBadge } from "./ConditionBadge";
import { DiceBadge } from "../DiceBadge";
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

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      <span className="text-[var(--color-text-muted)] font-medium uppercase tracking-wide shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1">{children}</div>
    </div>
  );
}

export function SpellMechanicsChips({ mechanic, effectSummary, character, size = "sm" }: SpellMechanicsSummaryProps) {
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

  const badgeFontSize = size === "sm" ? "10px" : "12px";

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: "var(--color-bg)",
      }}
    >
      <div className="p-2">
        <p className="font-semibold leading-snug text-[var(--color-text-primary)]" style={{ fontSize: size === "sm" ? "11px" : "13px" }}>
          {resolvedSummary}
        </p>
      </div>
      <div className="px-2 pb-2 space-y-1">
        <InfoRow label="Target">
          <span className="text-[var(--color-text-primary)] font-medium">{target}</span>
        </InfoRow>
        <InfoRow label="Effect">
          <div className="flex flex-wrap items-center gap-1">
            {effectTypes.map((type) => (
              <span
                key={type}
                className="inline-flex items-center font-semibold rounded px-1.5 py-0.5 capitalize"
                style={{
                  fontSize: badgeFontSize,
                  backgroundColor: "var(--color-effect-summary-bg, #fef3c7)",
                  color: "var(--color-effect-summary-text, #78350f)",
                  border: "1px solid var(--color-effect-summary-border, #92400e)",
                }}
              >
                {type}
              </span>
            ))}
          </div>
        </InfoRow>
        {damageEffect?.amount && (
          <InfoRow label="Amount">
            <DiceBadge dice={damageEffect.amount} size={size} />
          </InfoRow>
        )}
        {damageEffect?.damageType && (
          <InfoRow label="Type">
            <DamageBadge type={damageEffect.damageType} size={size} showLabel={false} />
          </InfoRow>
        )}
        {healEffect?.amount && (
          <InfoRow label="Heal">
            <DiceBadge dice={healEffect.amount} size={size} />
          </InfoRow>
        )}
        {tempHPFormula && (
          <InfoRow label="Temp HP">
            <span
              className="inline-flex items-center font-semibold rounded px-1.5 py-0.5"
              style={{
                fontSize: badgeFontSize,
                backgroundColor: "var(--color-temp-hp-bg, #fef3c7)",
                color: "var(--color-temp-hp, #92400e)",
                border: "1px solid var(--color-temp-hp-border, #fcd34d)",
              }}
            >
              ♡ {tempHPFormula}
            </span>
          </InfoRow>
        )}
        {inflictedCondition && (
          <InfoRow label="Condition">
            <ConditionBadge condition={inflictedCondition} size={size} />
          </InfoRow>
        )}
        {immunityCondition && (
          <InfoRow label="Immune">
            <ConditionBadge condition={immunityCondition} size={size} />
          </InfoRow>
        )}
        {resistanceType && (
          <InfoRow label="Resist">
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
          </InfoRow>
        )}
        <InfoRow label="Save">
          <span className="text-[var(--color-text-primary)] font-medium capitalize">{resolution}</span>
        </InfoRow>
        <InfoRow label="Duration">
          <span className="text-[var(--color-text-primary)] font-medium">{duration}</span>
        </InfoRow>
        {hasConcentration && (
          <InfoRow label="Conc">
            <span
              className="inline-flex items-center font-semibold rounded px-1.5 py-0.5 text-[10px]"
              style={{
                backgroundColor: "var(--color-state-concentration-bg)",
                color: "var(--color-state-concentration)",
              }}
            >
              Concentration
            </span>
          </InfoRow>
        )}
      </div>
    </div>
  );
}

export { SpellMechanicSummary };
