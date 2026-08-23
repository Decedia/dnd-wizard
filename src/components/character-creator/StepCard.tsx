"use client";

import { ReactNode } from "react";
import { SectionCard } from "@/components/character-sheet/SectionCard";

interface StepProps {
  title: string;
  hint?: string;
  children: React.ReactNode;
}

export function StepCard({ title, hint, children }: StepProps) {
  return (
    <SectionCard id="" title={title} icon={<span className="text-gold">{getStepIcon(title)}</span>}>
      {hint && (
        <div className="mb-4 rounded-lg border border-gold/20 bg-gold/5 px-3 py-2">
          <p className="text-xs text-gold/80">{hint}</p>
        </div>
      )}
      {children}
    </SectionCard>
  );
}

function getStepIcon(title: string) {
  const icons: Record<string, string> = {
    Identity: "🪪",
    Race: "🧝",
    Class: "⚔️",
    "Ability Scores": "📊",
    Background: "📜",
    Skills: "🎯",
    Equipment: "🎒",
    Spells: "✨",
    "Final Touches": "🖌️",
  };
  return icons[title] || "📋";
}
