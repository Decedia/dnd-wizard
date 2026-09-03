"use client";

import { useMemo } from "react";
import { getDamageTypeColor, getDamageTypeBgColor, getDamageTypeStyle, type DamageType } from "@/lib/damage-types";
import type { Character } from "@/lib/storage";

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
        const style = getDamageTypeStyle(dmg.type);
        const color = style ? `var(${style.colorVar})` : "var(--color-text-muted)";
        const bgColor = style ? `var(${style.bgColorVar})` : "var(--color-border-muted)";
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
                  backgroundColor: "var(--color-bg)",
                  color: "var(--color-text-primary)",
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
              {IconComponent && <IconComponent className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />}
              <span>{label}</span>
            </span>
          </span>
        );
      })}
    </span>
  );
}