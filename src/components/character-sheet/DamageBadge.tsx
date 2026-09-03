"use client";

import { getDamageTypeColor, getDamageTypeBgColor, getDamageTypeStyle, type DamageType } from "@/lib/damage-types";

interface DamageBadgeProps {
  type: string | undefined | null;
  size?: "sm" | "md";
  showLabel?: boolean;
  iconOnly?: boolean;
}

export function DamageBadge({ type, size = "sm", showLabel = true }: DamageBadgeProps) {
  if (!type) return null;

  const style = getDamageTypeStyle(type);

  if (!style) {
    return (
      <span
        className="inline-flex items-center gap-1 font-semibold"
        style={{
          fontSize: size === "sm" ? "11px" : "13px",
          padding: size === "sm" ? "2px 6px" : "4px 10px",
          borderRadius: "6px",
          backgroundColor: "var(--color-border-muted)",
          color: "var(--color-text-muted)",
        }}
      >
        {showLabel && <span>{type}</span>}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 font-semibold"
      style={{
        fontSize: size === "sm" ? "11px" : "13px",
        padding: size === "sm" ? "2px 6px" : "4px 10px",
        borderRadius: "6px",
        backgroundColor: `var(${style.bgColorVar})`,
        color: `var(${style.colorVar})`,
      }}
    >
      <style.icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {showLabel && <span>{style.label}</span>}
    </span>
  );
}

interface DamageTypeLabelProps {
  type: string | undefined | null;
  dice?: string;
  size?: "sm" | "md";
}

export function DamageTypeLabel({ type, dice, size = "sm" }: DamageTypeLabelProps) {
  if (!type) return null;

  const style = getDamageTypeStyle(type);
  const color = style ? `var(${style.colorVar})` : "var(--color-text-muted)";
  const bgColor = style ? `var(${style.bgColorVar})` : "var(--color-border-muted)";
  const IconComponent = style?.icon;

  return (
    <span className="inline-flex items-center gap-1">
      <span
        className="inline-flex items-center justify-center font-semibold"
        style={{
          width: size === "sm" ? "20px" : "26px",
          height: size === "sm" ? "20px" : "26px",
          borderRadius: "6px",
          backgroundColor: bgColor,
          color: color,
        }}
      >
        {IconComponent ? <IconComponent className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} /> : null}
      </span>
      {dice && (
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ color, backgroundColor: bgColor }}
        >
          {dice}
        </span>
      )}
    </span>
  );
}

export { getDamageTypeColor, getDamageTypeBgColor } from "@/lib/damage-types";