"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import type { Character } from "@/lib/storage";

interface DeathSavesSectionProps {
  character: Pick<Character, "deathSaveSuccesses" | "deathSaveFailures">;
  onChange: (patch: Partial<Pick<Character, "deathSaveSuccesses" | "deathSaveFailures">>) => void;
  editMode?: boolean;
}

export function DeathSavesSection({ character, onChange, editMode = true }: DeathSavesSectionProps) {
  const { onFieldBlur } = useCharacterSheet();

  const renderDot = (filled: boolean, color: "gold" | "red") => (
    <span
      className={`inline-block h-4 w-4 rounded-full border-2 ${
        filled
          ? color === "gold"
            ? "border-burgundy bg-burgundy shadow-sm shadow-burgundy/40"
            : "border-burgundy bg-burgundy shadow-sm shadow-burgundy/40"
          : "border-border bg-transparent"
      }`}
    />
  );

  return (
    <SectionCard id="death-saves" title="DEATH SAVES" icon={<DeathIcon className="h-5 w-5" />}>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-text-secondary">Successes</span>
          {editMode
            ? [0, 1, 2].map((i) => (
                <label key={`ds-s-${i}`} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={character.deathSaveSuccesses > i}
                    onChange={(e) => onChange({ deathSaveSuccesses: e.target.checked ? i + 1 : i })}
                    onBlur={onFieldBlur}
                    className="h-4 w-4 rounded border-border bg-charcoal text-burgundy focus:ring-burgundy/50"
                  />
                </label>
              ))
            : [0, 1, 2].map((i) => (
                <span key={`ds-s-${i}`}>{renderDot(character.deathSaveSuccesses > i, "red")}</span>
              ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-text-secondary">Failures</span>
          {editMode
            ? [0, 1, 2].map((i) => (
                <label key={`ds-f-${i}`} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={character.deathSaveFailures > i}
                    onChange={(e) => onChange({ deathSaveFailures: e.target.checked ? i + 1 : i })}
                    onBlur={onFieldBlur}
                    className="h-4 w-4 rounded border-border bg-charcoal text-burgundy focus:ring-burgundy/50"
                  />
                </label>
              ))
            : [0, 1, 2].map((i) => (
                <span key={`ds-f-${i}`}>{renderDot(character.deathSaveFailures > i, "red")}</span>
              ))}
        </div>
      </div>
    </SectionCard>
  );
}

function DeathIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}
