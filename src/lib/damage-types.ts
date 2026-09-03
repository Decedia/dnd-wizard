import {
  DropIcon as Drop,
  ClubIcon as Club,
  SnowflakeIcon as Snowflake,
  FireGiIcon as Fire,
  SparkleIcon as Sparkle,
  PowerLightningIcon as Lightning,
  SkullIcon as Skull,
  ArrowClusterIcon as Needle,
  BrainIcon as Brain,
  SunGiIcon as Sun,
  SwordIcon as Sword,
  ThunderStruckIcon as CloudLightning,
  AcidIcon as TestTube,
} from "@/components/icons";

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

export interface DamageTypeStyle {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  colorVar: string;
  bgColorVar: string;
}

export const DAMAGE_TYPES: Record<DamageType, DamageTypeStyle> = {
  acid: { icon: TestTube, label: "Acid", colorVar: "--color-damage-acid", bgColorVar: "--color-damage-acid-bg" },
  bludgeoning: { icon: Club, label: "Bludgeoning", colorVar: "--color-damage-bludgeoning", bgColorVar: "--color-damage-bludgeoning-bg" },
  cold: { icon: Snowflake, label: "Cold", colorVar: "--color-damage-cold", bgColorVar: "--color-damage-cold-bg" },
  fire: { icon: Fire, label: "Fire", colorVar: "--color-damage-fire", bgColorVar: "--color-damage-fire-bg" },
  force: { icon: Sparkle, label: "Force", colorVar: "--color-damage-force", bgColorVar: "--color-damage-force-bg" },
  lightning: { icon: Lightning, label: "Lightning", colorVar: "--color-damage-lightning", bgColorVar: "--color-damage-lightning-bg" },
  necrotic: { icon: Skull, label: "Necrotic", colorVar: "--color-damage-necrotic", bgColorVar: "--color-damage-necrotic-bg" },
  piercing: { icon: Needle, label: "Piercing", colorVar: "--color-damage-piercing", bgColorVar: "--color-damage-piercing-bg" },
  poison: { icon: Drop, label: "Poison", colorVar: "--color-damage-poison", bgColorVar: "--color-damage-poison-bg" },
  psychic: { icon: Brain, label: "Psychic", colorVar: "--color-damage-psychic", bgColorVar: "--color-damage-psychic-bg" },
  radiant: { icon: Sun, label: "Radiant", colorVar: "--color-damage-radiant", bgColorVar: "--color-damage-radiant-bg" },
  slashing: { icon: Sword, label: "Slashing", colorVar: "--color-damage-slashing", bgColorVar: "--color-damage-slashing-bg" },
  thunder: { icon: CloudLightning, label: "Thunder", colorVar: "--color-damage-thunder", bgColorVar: "--color-damage-thunder-bg" },
};

export function getDamageTypeColor(type: string | undefined | null): string {
  if (!type) return "var(--color-text-muted)";
  const key = type.toLowerCase() as DamageType;
  return DAMAGE_TYPES[key]?.colorVar ?? "var(--color-text-muted)";
}

export function getDamageTypeBgColor(type: string | undefined | null): string {
  if (!type) return "var(--color-border-muted)";
  const key = type.toLowerCase() as DamageType;
  return DAMAGE_TYPES[key]?.bgColorVar ?? "var(--color-border-muted)";
}

export function getDamageTypeStyle(type: string | undefined | null): DamageTypeStyle | undefined {
  if (!type) return undefined;
  const key = type.toLowerCase() as DamageType;
  return DAMAGE_TYPES[key];
}