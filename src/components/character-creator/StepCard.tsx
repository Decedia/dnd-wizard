"use client";

import { SectionCard } from "@/components/character-sheet/SectionCard";
import {
  User,
  Users,
  Sword,
  ChartBar,
  Scroll,
  ListChecks,
  Backpack,
  Lightning,
  PaintBrush,
  Crown,
  ClipboardText,
} from "phosphor-react";

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
  const icons: Record<string, React.ReactNode> = {
    Identity: <User weight="regular" className="h-5 w-5" />,
    Race: <Users weight="regular" className="h-5 w-5" />,
    Class: <Sword weight="regular" className="h-5 w-5" />,
    "Ability Scores": <ChartBar weight="regular" className="h-5 w-5" />,
    Background: <Scroll weight="regular" className="h-5 w-5" />,
    Skills: <ListChecks weight="regular" className="h-5 w-5" />,
    Equipment: <Backpack weight="regular" className="h-5 w-5" />,
    Spells: <Lightning weight="regular" className="h-5 w-5" />,
    "Final Touches": <PaintBrush weight="regular" className="h-5 w-5" />,
    Subclass: <Crown weight="regular" className="h-5 w-5" />,
  };
  return icons[title] || <ClipboardText weight="regular" className="h-5 w-5" />;
}
