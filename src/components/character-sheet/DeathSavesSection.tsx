"use client";

import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import type { Character } from "@/lib/storage";

interface DeathSavesSectionProps {
  character: Pick<Character, "deathSaveSuccesses" | "deathSaveFailures">;
  onChange: (patch: Partial<Pick<Character, "deathSaveSuccesses" | "deathSaveFailures">>) => void;
}

export function DeathSavesSection({ character, onChange }: DeathSavesSectionProps) {
  const { onFieldBlur } = useCharacterSheet();

  return (
    <SectionCard id="death-saves" title="Death Saves" icon={<DeathIcon className="h-5 w-5" />}>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-parchment/70">Successes</span>
          {[0, 1, 2].map((i) => (
            <label key={`ds-s-${i}`} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={character.deathSaveSuccesses > i}
                onChange={(e) => onChange({ deathSaveSuccesses: e.target.checked ? i + 1 : i })}
                onBlur={onFieldBlur}
                className="h-4 w-4 rounded border-parchment/30 bg-charcoal text-gold focus:ring-gold/50"
              />
            </label>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-parchment/70">Failures</span>
          {[0, 1, 2].map((i) => (
            <label key={`ds-f-${i}`} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={character.deathSaveFailures > i}
                onChange={(e) => onChange({ deathSaveFailures: e.target.checked ? i + 1 : i })}
                onBlur={onFieldBlur}
                className="h-4 w-4 rounded border-parchment/30 bg-charcoal text-red-400 focus:ring-red-400/50"
              />
            </label>
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
