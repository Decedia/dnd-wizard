"use client";

import { DiceIcon as Dice } from "@/components/icons";

interface DiceBadgeProps {
  dice: string;
  size?: "sm" | "md";
}

export function DiceBadge({ dice, size = "sm" }: DiceBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 font-semibold"
      style={{
        fontSize: size === "sm" ? "11px" : "13px",
        padding: size === "sm" ? "2px 6px" : "4px 10px",
        borderRadius: "6px",
        backgroundColor: "#f59e0b15",
        color: "#f59e0b",
      }}
    >
      <Dice className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      <span>{dice}</span>
    </span>
  );
}
