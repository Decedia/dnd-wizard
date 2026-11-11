"use client";

import type { IconType } from "react-icons";
import {
  GiCheckedShield, GiClover, GiSparkles, GiFlame, GiHolySymbol, GiLightningArc, GiMusicalNotes,
  GiBrain, GiPawPrint, GiRollingDices, GiStarSwirl, GiYinYang,
} from "react-icons/gi";

/** The Game Icon of each resource; a feature's own uses get sparkles. */
const ICON: Record<string, IconType> = {
  rages: GiFlame,
  kiPoints: GiYinYang,
  channelDivinityUses: GiHolySymbol,
  actionSurgeUses: GiLightningArc,
  indomitableUses: GiCheckedShield,
  wildShapeUses: GiPawPrint,
  sorceryPoints: GiStarSwirl,
  bardicInspirationUses: GiMusicalNotes,
  superiorityDice: GiRollingDices,
  luckPoints: GiClover,
  psionicDice: GiBrain,
};

interface ResourceTokenProps {
  /** Pool field ("rages", "kiPoints"...) or undefined for a feature's own uses. */
  resource?: string;
  /** Filled (ready to spend) or spent. */
  filled: boolean;
  size?: number;
}

/** A flat token in the sheet's ink style: solid with its icon when ready, an outline when spent. */
export function ResourceToken({ resource, filled, size = 30 }: ResourceTokenProps) {
  const Icon = (resource && ICON[resource]) || GiSparkles;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors ${
        filled
          ? "border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-[var(--color-surface)]"
          : "border-dashed border-[var(--color-border-strong,#B8B2A7)] bg-[var(--color-surface)] text-[var(--color-text-muted)]"
      }`}
      style={{ width: size, height: size }}
    >
      <Icon aria-hidden style={{ width: size * 0.56, height: size * 0.56 }} className={filled ? "" : "opacity-40"} />
    </span>
  );
}
