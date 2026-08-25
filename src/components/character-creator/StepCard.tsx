"use client";

import { SectionCard } from "@/components/character-sheet/SectionCard";

interface StepProps {
  title: string;
  hint?: string;
  children: React.ReactNode;
}

export function StepCard({ title, hint, children }: StepProps) {
  return (
    <SectionCard id="" title={title} icon={<span className="text-ink/70">{getStepIcon(title)}</span>}>
      {hint && (
        <div className="mb-3 hint-box-light">
          <p className="text-[11px] text-ink-muted">{hint}</p>
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
    Subclass: "👑",
  };
  return icons[title] || "📋";
}
