"use client";

import { SectionCard } from "@/components/character-sheet/SectionCard";
import {
  UserIcon as User,
  ChartBarIcon as ChartBar,
  ScrollIcon as Scroll,
  ListChecksIcon as ListChecks,
  BackpackIcon as Backpack,
  LightningIcon as Lightning,
  PaintBrushIcon as PaintBrush,
  CrownIcon as Crown,
  ClipboardTextIcon as ClipboardText,
} from "@/components/icons";
import { PiUsers as PiUsersIcon, PiSword as PiSwordIcon } from "react-icons/pi";

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
          <p className="text-muted">{hint}</p>
        </div>
      )}
      {children}
    </SectionCard>
  );
}

function getStepIcon(title: string) {
  const icons: Record<string, React.ReactNode> = {
    Identity: <User className="h-5 w-5" />,
    Race: <PiUsersIcon className="h-5 w-5" />,
    Class: <PiSwordIcon className="h-5 w-5" />,
    "Ability Scores": <ChartBar className="h-5 w-5" />,
    Background: <Scroll className="h-5 w-5" />,
    Skills: <ListChecks className="h-5 w-5" />,
    Equipment: <Backpack className="h-5 w-5" />,
    Spells: <Lightning className="h-5 w-5" />,
    "Final Touches": <PaintBrush className="h-5 w-5" />,
    Subclass: <Crown className="h-5 w-5" />,
  };
  return icons[title] || <ClipboardText className="h-5 w-5" />;
}
