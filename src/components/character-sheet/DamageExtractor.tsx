"use client";

import { useMemo } from "react";
import {
  Drop,
  Club,
  Snowflake,
  Fire,
  Sparkle,
  Lightning,
  Skull,
  Needle,
  Brain,
  Sun,
  Sword,
  CloudLightning,
  TestTube,
  Icon,
} from "phosphor-react";

export type DamageType =
  | "acid"
  | "bludgeoning"
  | "cold"
  | "fire"
  | "force"
  | "lightning"
  | "necrotic"
  | "piercing"
  | "poison"
  | "psychic"
  | "radiant"
  | "slashing"
  | "thunder";

interface DamageTypeStyle {
  icon: Icon;
  label: string;
  color: string;
  bgColor: string;
}

const DAMAGE_TYPES: Record<DamageType, DamageTypeStyle> = {
  acid: { icon: TestTube, label: "Acid", color: "#22c55e", bgColor: "#22c55e15" },
  bludgeoning: { icon: Club, label: "Bludgeoning", color: "#78716c", bgColor: "#78716c15" },
  cold: { icon: Snowflake, label: "Cold", color: "#38bdf8", bgColor: "#38bdf815" },
  fire: { icon: Fire, label: "Fire", color: "#ef4444", bgColor: "#ef444415" },
  force: { icon: Sparkle, label: "Force", color: "#a855f7", bgColor: "#a855f715" },
  lightning: { icon: Lightning, label: "Lightning", color: "#eab308", bgColor: "#eab30815" },
  necrotic: { icon: Skull, label: "Necrotic", color: "#4d7c0f", bgColor: "#4d7c0f15" },
  piercing: { icon: Needle, label: "Piercing", color: "#94a3b8", bgColor: "#94a3b815" },
  poison: { icon: Drop, label: "Poison", color: "#84cc16", bgColor: "#84cc1615" },
  psychic: { icon: Brain, label: "Psychic", color: "#ec4899", bgColor: "#ec489915" },
  radiant: { icon: Sun, label: "Radiant", color: "#f59e0b", bgColor: "#f59e0b15" },
  slashing: { icon: Sword, label: "Slashing", color: "#64748b", bgColor: "#64748b15" },
  thunder: { icon: CloudLightning, label: "Thunder", color: "#6366f1", bgColor: "#6366f115" },
};

export function getDamageTypeColor(type: string | undefined | null): string {
  if (!type) return "#666666";
  const key = type.toLowerCase() as DamageType;
  return DAMAGE_TYPES[key]?.color ?? "#666666";
}

export function getDamageTypeBgColor(type: string | undefined | null): string {
  if (!type) return "#e5e5e515";
  const key = type.toLowerCase() as DamageType;
  return DAMAGE_TYPES[key]?.bgColor ?? "#e5e5e515";
}

function getDamageIcon(type: string): Icon | null {
  const key = type.toLowerCase() as DamageType;
  return DAMAGE_TYPES[key]?.icon ?? null;
}

function getDamageLabel(type: string): string {
  const key = type.toLowerCase() as DamageType;
  return DAMAGE_TYPES[key]?.label ?? type;
}

export interface ExtractedDamage {
  dice: string;
  type: string;
  modifier: string;
  raw: string;
}

const DAMAGE_DICE_PATTERN = /(\d+d\d+(?:\s*[-+]\s*\d+)?)\s*(bludgeoning|piercing|slashing|fire|cold|lightning|thunder|acid|poison|psychic|radiant|necrotic|force)/gi;

export function extractDamage(text: string): ExtractedDamage[] {
  if (!text) return [];
  const results: ExtractedDamage[] = [];
  const lowerText = text.toLowerCase();

  const diceMatches = text.matchAll(DAMAGE_DICE_PATTERN);
  for (const match of diceMatches) {
    const dice = match[1]?.trim() || "";
    const type = match[2]?.toLowerCase() || "";
    if (dice && type) {
      results.push({
        dice,
        type,
        modifier: "",
        raw: match[0] || "",
      });
    }
  }

  if (results.length === 0) {
    const typeMatch = lowerText.match(/(bludgeoning|piercing|slashing|fire|cold|lightning|thunder|acid|poison|psychic|radiant|necrotic|force)/);
    if (typeMatch) {
      const modMatch = lowerText.match(/(\d+)\s*(?:bludgeoning|piercing|slashing|fire|cold|lightning|thunder|acid|poison|psychic|radiant|necrotic|force)/);
      if (modMatch) {
        results.push({
          dice: `${modMatch[1]}`,
          type: typeMatch[0] || "",
          modifier: "",
          raw: modMatch[0] || "",
        });
      }
    }
  }

  return results;
}

export function getSpellDamageInfo(spell: { damageDice?: string; damageType?: string; description?: string }): ExtractedDamage[] {
  if (spell.damageDice || spell.damageType) {
    return [{
      dice: spell.damageDice || "",
      type: spell.damageType || "",
      modifier: "",
      raw: `${spell.damageDice || ""} ${spell.damageType || ""}`.trim(),
    }];
  }
  if (spell.description) {
    return extractDamage(spell.description);
  }
  return [];
}

export function getFeatureDamageInfo(description: string): ExtractedDamage[] {
  return extractDamage(description);
}

interface DamageDisplayProps {
  damages: ExtractedDamage[];
  size?: "sm" | "md";
  inline?: boolean;
}

export function DamageDisplay({ damages, size = "sm", inline = false }: DamageDisplayProps) {
  if (damages.length === 0) return null;

  const containerClass = inline
    ? "inline-flex flex-wrap gap-1 ml-2"
    : "flex flex-wrap gap-1.5 mt-1.5";

  return (
    <span className={containerClass}>
      {damages.map((dmg, idx) => {
        const key = dmg.type.toLowerCase() as DamageType;
        const style = DAMAGE_TYPES[key];
        const color = style?.color ?? "#666666";
        const bgColor = style?.bgColor ?? "#e5e5e515";
        const IconComponent = style?.icon;
        const label = style?.label ?? dmg.type;

        return (
          <span key={idx} className="inline-flex items-center gap-1">
            {dmg.dice && (
              <span
                className="inline-flex items-center font-semibold"
                style={{
                  fontSize: size === "sm" ? "10px" : "12px",
                  padding: size === "sm" ? "1px 5px" : "3px 8px",
                  borderRadius: "4px",
                  backgroundColor: "#f0f0f0",
                  color: "#333333",
                }}
              >
                {dmg.dice}
              </span>
            )}
            <span
              className="inline-flex items-center gap-1 font-semibold"
              style={{
                fontSize: size === "sm" ? "11px" : "13px",
                padding: size === "sm" ? "2px 6px" : "4px 10px",
                borderRadius: "6px",
                backgroundColor: bgColor,
                color: color,
              }}
            >
              {IconComponent && <IconComponent weight="bold" size={size === "sm" ? 12 : 14} />}
              <span>{label}</span>
            </span>
          </span>
        );
      })}
    </span>
  );
}
