"use client";

import { useCallback, useState } from "react";
import { StepCard } from "./StepCard";
import { getStaticRaces, type SRDRace } from "@/lib/srd-client";
import { InfoButton } from "@/components/InfoButton";
import { FeatSelector } from "./FeatSelector";
import type { SRDFeat } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";
import { CheckIcon as Check } from "@/components/icons";

interface StepRaceProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepRace({ data, onChange }: StepRaceProps) {
  const races: SRDRace[] = getStaticRaces();
  const [featModalOpen, setFeatModalOpen] = useState(false);

  const isVariantHuman = data.race === "Human" && data.raceVariant === "variant";

  const handleSelect = useCallback(
    (raceName: string) => {
      onChange({ race: raceName, raceVariant: undefined });
    },
    [onChange]
  );

  const handleVariantToggle = useCallback(() => {
    if (isVariantHuman) {
      onChange({ raceVariant: undefined, featureSelections: { ...data.featureSelections, "variant-human-feat": [] } });
    } else {
      onChange({ raceVariant: "variant" });
    }
  }, [isVariantHuman, data.featureSelections, onChange]);

  const handleFeatSelect = useCallback(
    (feat: SRDFeat) => {
      onChange({
        featureSelections: {
          ...data.featureSelections,
          "variant-human-feat": [feat.name],
        },
      });
    },
    [data.featureSelections, onChange]
  );

  const selectedFeat = data.featureSelections?.["variant-human-feat"]?.[0];

  return (
    <>
      <StepCard title="Race" hint="Choose your character's race. Each race has unique traits, ability bonuses, and special abilities.">
        <div className="space-y-3">
          {races.map((race) => {
            const isSelected = data.race === race.name;
            const isHuman = race.name === "Human";

            return (
              <div key={race.name} className="space-y-2">
                <button
                  type="button"
                  onClick={() => handleSelect(race.name)}
                  className={`w-full p-4 text-left rounded-[var(--radius-md)] transition-all ${
                    isSelected
                      ? "bg-[var(--color-surface)] border-2 border-[var(--color-border-active)]"
                      : "bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-card-title">{race.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted">
                        {race.size} / Speed {race.speed} ft
                      </span>
                      {race.traits && race.traits.length > 0 && (
                        <InfoButton
                          title={`${race.name} Traits`}
                          description={race.traits.map((t) => `${t.name}: ${t.description}`).join("\n\n")}
                        />
                      )}
                    </div>
                  </div>
                  <p className="mt-1 text-description">
                    {Object.entries(race.abilityScoreIncreases || {})
                      .map(([stat, bonus]) => `+${bonus} ${stat.toUpperCase()}`)
                      .join(", ")}
                  </p>
                </button>

                {isHuman && isSelected && (
                  <div className="ml-4 space-y-2">
                    <button
                      type="button"
                      onClick={handleVariantToggle}
                      className={`w-full p-3 text-left rounded-[var(--radius-sm)] border transition-all ${
                        isVariantHuman
                          ? "border-[var(--color-border-active)] bg-[var(--color-bg)]"
                          : "border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                            isVariantHuman
                              ? "border-[var(--color-border-active)] bg-[var(--color-text-primary)]"
                              : "border-[var(--color-border)]"
                          }`}
                        >
                           {isVariantHuman && <Check className="h-3 w-3 text-[var(--color-surface)]" />}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[var(--color-text-primary)]">Variant Human</div>
                          <div className="text-[10px] text-[var(--color-text-secondary)]">
                            +1 to two abilities, one skill proficiency, and one feat
                          </div>
                        </div>
                      </div>
                    </button>

                    {isVariantHuman && (
                      <div className="space-y-2">
                        {selectedFeat && (
                          <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                            <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Selected Feat</div>
                            <div className="text-sm font-bold text-[var(--color-text-primary)] mt-0.5">{selectedFeat}</div>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => setFeatModalOpen(true)}
                          className="btn btn-secondary w-full text-sm"
                        >
                          {selectedFeat ? "Change Feat" : "Choose Feat"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </StepCard>

      {featModalOpen && (
        <FeatSelector
          selectedFeat={selectedFeat}
          sources={data.sources}
          onSelect={(feat: SRDFeat) => {
            handleFeatSelect(feat);
          }}
          onClose={() => setFeatModalOpen(false)}
        />
      )}
    </>
  );
}
