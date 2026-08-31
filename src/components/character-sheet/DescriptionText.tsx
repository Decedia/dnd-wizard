"use client";

import { DamageBadge } from "./DamageBadge";
import { DiceBadge } from "@/components/DiceBadge";

interface DescriptionTextProps {
  children: React.ReactNode;
  className?: string;
}

function renderWithBadges(text: string) {
  const parts: React.ReactNode[] = [];
  const regex = /\[(dice|damage)\](.*?)\[\/(dice|damage)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const type = match[1];
    const content = match[2];

    if (type === "dice") {
      parts.push(<DiceBadge key={key++} dice={content} />);
    } else if (type === "damage") {
      parts.push(<DamageBadge key={key++} type={content} size="sm" />);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

export function DescriptionText({ children, className }: DescriptionTextProps) {
  const content = typeof children === "string" ? renderWithBadges(children) : children;

  return (
    <p className={`text-sm text-[var(--color-text-secondary)] leading-relaxed font-medium ${className || ""}`}>
      {content}
    </p>
  );
}
