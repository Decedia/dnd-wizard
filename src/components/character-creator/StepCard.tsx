"use client";

import { SectionCard } from "@/components/character-sheet/SectionCard";

interface StepProps {
  title: string;
  children: React.ReactNode;
}

export function StepCard({ title, children }: StepProps) {
  return (
    <SectionCard id="" title={title} icon={<span className="text-gold">{getStepIcon(title)}</span>}>
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
