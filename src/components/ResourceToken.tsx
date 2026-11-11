"use client";

import type { IconType } from "react-icons";
import {
  GiCheckedShield, GiClover, GiSparkles, GiFlame, GiHolySymbol, GiLightningArc, GiMusicalNotes,
  GiPawPrint, GiRollingDices, GiStarSwirl, GiYinYang,
} from "react-icons/gi";

/** Look of each resource: a Game Icon and the gem colour (light, dark). */
const LOOK: Record<string, { icon: IconType; light: string; dark: string }> = {
  rages: { icon: GiFlame, light: "#ff8a4c", dark: "#b91c1c" },
  kiPoints: { icon: GiYinYang, light: "#e2e8f0", dark: "#1e293b" },
  channelDivinityUses: { icon: GiHolySymbol, light: "#fde68a", dark: "#b45309" },
  actionSurgeUses: { icon: GiLightningArc, light: "#fcd34d", dark: "#c2410c" },
  indomitableUses: { icon: GiCheckedShield, light: "#cbd5e1", dark: "#475569" },
  wildShapeUses: { icon: GiPawPrint, light: "#86efac", dark: "#15803d" },
  sorceryPoints: { icon: GiStarSwirl, light: "#e9a8ff", dark: "#7e22ce" },
  bardicInspirationUses: { icon: GiMusicalNotes, light: "#f9a8d4", dark: "#be185d" },
  superiorityDice: { icon: GiRollingDices, light: "#fdba74", dark: "#9a3412" },
  luckPoints: { icon: GiClover, light: "#bef264", dark: "#4d7c0f" },
};
const USES = { icon: GiSparkles, light: "#99f6e4", dark: "#0e7490" };

export const resourceLook = (resource: string | undefined) => (resource && LOOK[resource]) || USES;

interface ResourceTokenProps {
  /** Pool field ("rages", "kiPoints"...) or undefined for a feature's own uses. */
  resource?: string;
  /** Filled (ready to spend) or spent. */
  filled: boolean;
  size?: number;
  className?: string;
}

/** A gem-like game token: glowing with its icon when ready, a dark empty socket when spent. */
export function ResourceToken({ resource, filled, size = 36, className = "" }: ResourceTokenProps) {
  const look = resourceLook(resource);
  const Icon = look.icon;
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full transition-all duration-200 ${className}`}
      style={{
        width: size,
        height: size,
        background: filled
          ? `radial-gradient(circle at 32% 28%, #ffffffcc 0%, ${look.light} 22%, ${look.dark} 78%)`
          : "radial-gradient(circle at 50% 60%, var(--color-paper-muted, #eee) 0%, var(--color-border, #ccc) 100%)",
        boxShadow: filled
          ? `0 0 0 2px ${look.dark}, 0 0 0 3.5px #f5d58a, 0 2px 6px ${look.dark}88, inset 0 -3px 4px #00000040`
          : "0 0 0 2px var(--color-border-strong, #b8b2a7), inset 0 2px 4px #00000035",
      }}
    >
      <Icon
        aria-hidden
        style={{ width: size * 0.58, height: size * 0.58 }}
        className={filled ? "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.55)]" : "text-[var(--color-text-muted)] opacity-35"}
      />
    </span>
  );
}
