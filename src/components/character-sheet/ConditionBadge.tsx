"use client";

import { useMemo } from "react";

interface ConditionBadgeProps {
  condition: string;
  size?: "sm" | "md";
}

const CONDITION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  prone: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  restrained: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  stunned: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  unconscious: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
  invisible: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  poisoned: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  frightened: { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
  charmed: { bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
  blinded: { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
  deafened: { bg: "bg-stone-100", text: "text-stone-700", border: "border-stone-200" },
  grappled: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  paralyzed: { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  petrified: { bg: "bg-zinc-100", text: "text-zinc-700", border: "border-zinc-200" },
  incapacitated: { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
  concentration: { bg: "bg-cyan-50", text: "text-cyan-700", border: "border-cyan-200" },
  exhaustion: { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200" },
  hidden: { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200" },
};

const ALL_CONDITIONS = Object.keys(CONDITION_COLORS);

export function ConditionBadge({ condition, size = "sm" }: ConditionBadgeProps) {
  const colors = CONDITION_COLORS[condition.toLowerCase()] || { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded border ${colors.bg} ${colors.text} ${colors.border} ${
        size === "sm" ? "px-1.5 py-0.5 text-[9px]" : "px-2 py-0.5 text-[10px]"
      }`}
    >
      {condition}
    </span>
  );
}

export function parseConditions(text: string): string[] {
  if (!text) return [];
  const found: string[] = [];
  const lowerText = text.toLowerCase();
  for (const condition of ALL_CONDITIONS) {
    if (lowerText.includes(condition)) {
      found.push(condition);
    }
  }
  return found;
}

interface ConditionBadgesProps {
  text: string;
  size?: "sm" | "md";
}

export function ConditionBadges({ text, size = "sm" }: ConditionBadgesProps) {
  const conditions = useMemo(() => parseConditions(text), [text]);

  if (conditions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {conditions.map((condition) => (
        <ConditionBadge key={condition} condition={condition} size={size} />
      ))}
    </div>
  );
}
