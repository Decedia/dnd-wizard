"use client";

import { DamageBadge } from "@/components/character-sheet/DamageBadge";
import { DiceBadge } from "@/components/DiceBadge";

function renderWithBadges(text: string): React.ReactNode[] {
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
  return parts.length > 0 ? parts : [text];
}

interface FormattedDescriptionProps {
  children: string | string[];
  className?: string;
}

export function FormattedDescription({ children, className = "" }: FormattedDescriptionProps) {
  const raw = Array.isArray(children) ? children.join("\n") : children || "";

  const paragraphs = raw.split(/\n\n+/).filter(Boolean);

  const renderLine = (line: string, idx: number): React.ReactNode => {
    const trimmed = line.trim();

    const bulletMatch = trimmed.match(/^[-•*]\s+(.+)/);
    if (bulletMatch) {
      return (
        <li key={idx} className="ml-4 list-disc text-xs leading-relaxed">
          {renderWithBadges(bulletMatch[1])}
        </li>
      );
    }

    const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numberedMatch) {
      return (
        <li key={idx} className="ml-4 list-decimal text-xs leading-relaxed">
          {renderWithBadges(numberedMatch[2])}
        </li>
      );
    }

    const colonMatch = trimmed.match(/^([A-Z][A-Za-z\s]+):\s+(.+)/);
    if (colonMatch) {
      return (
        <p key={idx} className="text-xs leading-relaxed mt-1">
          <span className="font-semibold">{colonMatch[1]}:</span>{" "}
          {renderWithBadges(colonMatch[2])}
        </p>
      );
    }

    return (
      <p key={idx} className="text-xs leading-relaxed">
        {renderWithBadges(trimmed)}
      </p>
    );
  };

  const renderParagraph = (para: string, pIdx: number): React.ReactNode => {
    const lines = para.split("\n").filter(Boolean);

    const hasBullets = lines.some((l) => /^[-•*]\s+/.test(l.trim()));
    const hasNumbered = lines.some((l) => /^\d+\.\s+/.test(l.trim()));
    const hasColons = lines.length > 1 && lines.every((l) => /^[A-Z][A-Za-z\s]+:\s+/.test(l.trim()));

    const content = (() => {
      if (hasBullets) {
        const nonBulletIntro = lines.filter((l) => !/^[-•*]\s+/.test(l.trim()));
        const bulletLines = lines.filter((l) => /^[-•*]\s+/.test(l.trim()));
        return (
          <>
            {nonBulletIntro.map((line, i) => renderLine(line, i))}
            <ul className="mt-1 space-y-0.5">
              {bulletLines.map((line, i) => renderLine(line, i))}
            </ul>
          </>
        );
      }

      if (hasNumbered) {
        return (
          <ol className="space-y-0.5">
            {lines.map((line, i) => renderLine(line, i))}
          </ol>
        );
      }

      return (
        <>
          {lines.map((line, i) => renderLine(line, i))}
        </>
      );
    })();

    return (
      <div key={pIdx} className="mb-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)] p-3 space-y-1">
        {content}
      </div>
    );
  };

  return (
    <div className={`text-[var(--color-text-secondary)] ${className}`}>
      {paragraphs.map((para, i) => renderParagraph(para, i))}
    </div>
  );
}
