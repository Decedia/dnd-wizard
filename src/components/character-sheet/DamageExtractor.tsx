"use client";

import { useMemo } from "react";

export interface ExtractedDamage {
  dice: string;
  type: string;
  modifier: string;
  raw: string;
}

const DAMAGE_DICE_PATTERN = /(\d+d\d+(?:\s*[-+]\s*\d+)?)\s*(\w+)\s*(?:damage)?/gi;
const DAMAGE_TYPE_PATTERN = /(bludgeoning|piercing|slashing|fire|cold|lightning|thunder|acid|poison|psychic|radiant|necrotic|force)/gi;
const MODIFIER_PATTERN = /(?:plus|and|[\+\-])\s*(\d+)\s*(?:damage|to hit)/gi;

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
    const typeMatch = lowerText.match(DAMAGE_TYPE_PATTERN);
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
}

export function DamageDisplay({ damages, size = "sm" }: DamageDisplayProps) {
  if (damages.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-1">
      {damages.map((dmg, idx) => (
        <div
          key={idx}
          className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 ${
            size === "sm" ? "text-[9px]" : "text-[10px]"
          } font-semibold`}
          style={{
            color: getDamageTypeColor(dmg.type),
            backgroundColor: getDamageTypeBgColor(dmg.type),
            borderColor: getDamageTypeColor(dmg.type) + "30",
          }}
        >
          <span>{dmg.dice}</span>
          <span className="capitalize">{dmg.type}</span>
        </div>
      ))}
    </div>
  );
}

function getDamageTypeColor(type: string): string {
  const colors: Record<string, string> = {
    bludgeoning: "#64748b",
    piercing: "#64748b",
    slashing: "#64748b",
    fire: "#dc2626",
    cold: "#2563eb",
    lightning: "#eab308",
    thunder: "#7c3aed",
    acid: "#16a34a",
    poison: "#15803d",
    psychic: "#ec4899",
    radiant: "#f59e0b",
    necrotic: "#1e293b",
    force: "#6366f1",
  };
  return colors[type.toLowerCase()] || "#64748b";
}

function getDamageTypeBgColor(type: string): string {
  const color = getDamageTypeColor(type);
  return color + "15";
}
