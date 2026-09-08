"use client";

import { useMemo } from "react";
import type { SpellMechanicSummary } from "@/lib/spell-mechanics-accessor";

interface SpellMechanicsChipsProps {
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
  if (t.type === "self") return "Self";
  if (t.type === "point") return "Point";
  if (t.type === "multiple") return `${t.maxTargets ?? "?"} target${(t.maxTargets ?? 0) !== 1 ? "s" : ""}`;
  if (t.type === "area") {
    const shape = t.shape ? capitalize(t.shape) : "Area";
    const size = t.size ? `${t.size} ft` : "";
    return `${shape}${size ? " " + size : ""}`;
  }
  if (t.selfAllowed) return "Self or creature";
  return "Creature";
}

function formatResolution(m: SpellMechanicSummary): string | null {
  const r = m.resolution;
  if (!r) return null;
  if (r.type === "attack") return "Spell attack";
  if (r.type === "check") return "Ability check";
  if (r.type === "save") {
    const ability = r.ability ? capitalize(r.ability) : "Save";
    const outcome =
      r.onSuccess === "negates" ? "no effect on success"
      : r.onSuccess === "half" ? "half on success"
      : r.onSuccess === "full" ? "full on success"
      : "save";
    return `${ability} save (${outcome})`;
  }
  return null;
}

function formatEffect(m: SpellMechanicSummary): { label: string; color?: string } | null {
  const effects = m.effects;
  if (effects.length === 0) return null;

  const damage = effects.find((e) => e.type === "damage");
  if (damage) {
    return {
      label: `${damage.amount || "?"} ${damage.damageType ? capitalize(damage.damageType) : "damage"}`,
      color: damage.damageType,
    };
  }
  const heal = effects.find((e) => e.type === "healing");
  if (heal) {
    return { label: `Heal ${heal.amount || "?"}`, color: "healing" };
  }
  const buff = effects.find((e) => e.type === "buff");
  if (buff) {
    const label = buff.bonusTo ? humanize(buff.bonusTo) : (buff.effectType ? humanize(buff.effectType) : "Buff");
    return { label, color: "buff" };
  }
  const debuff = effects.find((e) => e.type === "debuff");
  if (debuff) {
    return { label: debuff.effectType ? humanize(debuff.effectType) : "Debuff", color: "debuff" };
  }
  const cond = effects.find((e) => e.type === "condition");
  if (cond) {
    return { label: cond.effectType ? humanize(cond.effectType) : "Condition", color: "condition" };
  }
  const control = effects.find((e) => e.type === "control");
  if (control) {
    return { label: control.effectType ? humanize(control.effectType) : "Control", color: "control" };
  }
  const summon = effects.find((e) => e.type === "summon");
  if (summon) {
    return { label: summon.effectType ? humanize(summon.effectType) : "Summon", color: "summon" };
  }
  const tele = effects.find((e) => e.type === "teleport");
  if (tele) {
    return { label: "Teleport", color: "teleport" };
  }
  const util = effects.find((e) => e.type === "utility");
  if (util) {
    return { label: util.special ? humanize(util.special) : "Utility", color: "utility" };
  }
  return null;
}

function chipColor(color?: string): string | undefined {
  if (!color) return undefined;
  // damage type
  const damageKeys = ["acid","bludgeoning","cold","fire","force","lightning","necrotic","piercing","poison","psychic","radiant","slashing","thunder"];
  if (damageKeys.includes(color)) return `var(--color-damage-${color})`;
  if (color === "healing") return "var(--color-success-500)";
  if (color === "buff") return "var(--color-info-500)";
  if (color === "debuff") return "var(--color-warning-500)";
  if (color === "condition") return "var(--color-error-500)";
  if (color === "control") return "var(--color-accent-purple-500)";
  if (color === "summon") return "var(--color-accent-teal-500)";
  if (color === "teleport") return "var(--color-accent-indigo-500)";
  if (color === "utility") return "var(--color-text-secondary)";
  return undefined;
}

export function SpellMechanicsChips({ mechanic, size = "sm" }: SpellMechanicsChipsProps) {
  const chips = useMemo(() => {
    if (!mechanic) return [];
    const list: { key: string; label: string; color?: string }[] = [];

    list.push({ key: "target", label: formatTarget(mechanic) });
    const res = formatResolution(mechanic);
    if (res) list.push({ key: "resolution", label: res });
    const eff = formatEffect(mechanic);
    if (eff) list.push({ key: "effect", label: eff.label, color: eff.color });
    if (mechanic.casting.concentration) list.push({ key: "concentration", label: "Concentration" });
    return list;
  }, [mechanic]);

  if (!mechanic) return null;

  const chipClass = size === "sm"
    ? "px-1.5 py-0.5 text-[10px]"
    : "px-2 py-1 text-xs";

  return (
    <div className="flex flex-wrap items-center gap-1">
      {chips.map((chip) => {
        const color = chipColor(chip.color);
        const style = color
          ? { backgroundColor: color, color: "var(--color-surface)" }
          : undefined;
        return (
          <span
            key={chip.key}
            className={`inline-flex items-center font-semibold rounded ${chipClass}`}
            style={style}
          >
            {chip.label}
          </span>
        );
      })}
    </div>
  );
}

export function SpellMechanicsRow({ mechanic, size = "sm" }: SpellMechanicsChipsProps) {
  if (!mechanic) return null;

  const parts: string[] = [];
  parts.push(`Range: ${mechanic.casting.range}`);
  parts.push(`Duration: ${mechanic.casting.duration}`);
  parts.push(`Target: ${formatTarget(mechanic)}`);
  const res = formatResolution(mechanic);
  if (res) parts.push(res);
  const eff = formatEffect(mechanic);
  if (eff) parts.push(eff.label);

  return (
    <div className="text-[10px] text-[var(--color-text-secondary)] leading-snug">
      {parts.join(" · ")}
    </div>
  );
}

export { SpellMechanicSummary };