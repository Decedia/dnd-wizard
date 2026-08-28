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
  acid: {
    icon: TestTube,
    label: "Acid",
    color: "#22c55e",
    bgColor: "#22c55e15",
  },
  bludgeoning: {
    icon: Club,
    label: "Bludgeoning",
    color: "#78716c",
    bgColor: "#78716c15",
  },
  cold: {
    icon: Snowflake,
    label: "Cold",
    color: "#38bdf8",
    bgColor: "#38bdf815",
  },
  fire: {
    icon: Fire,
    label: "Fire",
    color: "#ef4444",
    bgColor: "#ef444415",
  },
  force: {
    icon: Sparkle,
    label: "Force",
    color: "#a855f7",
    bgColor: "#a855f715",
  },
  lightning: {
    icon: Lightning,
    label: "Lightning",
    color: "#eab308",
    bgColor: "#eab30815",
  },
  necrotic: {
    icon: Skull,
    label: "Necrotic",
    color: "#4d7c0f",
    bgColor: "#4d7c0f15",
  },
  piercing: {
    icon: Needle,
    label: "Piercing",
    color: "#94a3b8",
    bgColor: "#94a3b815",
  },
  poison: {
    icon: Drop,
    label: "Poison",
    color: "#84cc16",
    bgColor: "#84cc1615",
  },
  psychic: {
    icon: Brain,
    label: "Psychic",
    color: "#ec4899",
    bgColor: "#ec489915",
  },
  radiant: {
    icon: Sun,
    label: "Radiant",
    color: "#f59e0b",
    bgColor: "#f59e0b15",
  },
  slashing: {
    icon: Sword,
    label: "Slashing",
    color: "#64748b",
    bgColor: "#64748b15",
  },
  thunder: {
    icon: CloudLightning,
    label: "Thunder",
    color: "#6366f1",
    bgColor: "#6366f115",
  },
};

interface DamageBadgeProps {
  type: string | undefined | null;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function DamageBadge({ type, size = "sm", showLabel = true }: DamageBadgeProps) {
  if (!type) return null;

  const key = type.toLowerCase() as DamageType;
  const style = DAMAGE_TYPES[key];

  if (!style) {
    return (
      <span
        className="inline-flex items-center gap-1 font-semibold"
        style={{
          fontSize: size === "sm" ? "11px" : "13px",
          padding: size === "sm" ? "2px 6px" : "4px 10px",
          borderRadius: "6px",
          backgroundColor: "#e5e5e515",
          color: "#666666",
        }}
      >
        {showLabel && <span>{type}</span>}
      </span>
    );
  }

  const IconComponent = style.icon;

  return (
    <span
      className="inline-flex items-center gap-1 font-semibold"
      style={{
        fontSize: size === "sm" ? "11px" : "13px",
        padding: size === "sm" ? "2px 6px" : "4px 10px",
        borderRadius: "6px",
        backgroundColor: style.bgColor,
        color: style.color,
      }}
    >
      <IconComponent weight="bold" size={size === "sm" ? 12 : 14} />
      {showLabel && <span>{style.label}</span>}
    </span>
  );
}

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
