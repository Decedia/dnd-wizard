"use client";

import { useCallback, useState, useMemo } from "react";
import { StepCard } from "./StepCard";
import { getStaticRaces, type SRDRace } from "@/lib/srd-client";
import { InfoButton } from "@/components/InfoButton";
import { FeatSelector } from "./FeatSelector";
import { SourceBadge } from "../SourceBadge";
import type { SRDFeat } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";
import { CheckIcon as Check } from "@/components/icons";

interface StepRaceProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepRace({ data, onChange }: StepRaceProps) {
  const races: SRDRace[] = getStaticRaces(data.sources);
  const [featModalOpen, setFeatModalOpen] = useState(false);

  const isVariantHuman = data.race === "Human" && data.raceVariant === "variant";

  const handleSelect = useCallback(
    (raceName: string) => {
      onChange({ race: raceName, raceVariant: undefined, raceChoices: undefined });
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

  const handleRaceChoiceChange = useCallback(
    (choiceId: string, value: string) => {
      onChange({
        raceChoices: {
          ...data.raceChoices,
          [choiceId]: value,
        },
      });
    },
    [data.raceChoices, onChange]
  );

  const selectedFeat = data.featureSelections?.["variant-human-feat"]?.[0];

  const selectedRace = useMemo(() => races.find(r => r.name === data.race), [races, data.race]);

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
                    <div className="flex items-center gap-2">
                      <span className="text-card-title">{race.name}</span>
                      {race.source && race.source !== "PHB" && <SourceBadge source={race.source} />}
                    </div>
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

                {isSelected && race.choices && race.choices.length > 0 && (
                  <div className="ml-4 space-y-3 p-3 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)]">
                    <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Race Options</div>
                    {race.choices.map((choice) => (
                      <div key={choice.id} className="space-y-1">
                        <div className="text-xs font-semibold text-[var(--color-text-primary)]">{choice.name}</div>
                        {choice.description && (
                          <div className="text-[10px] text-[var(--color-text-secondary)]">{choice.description}</div>
                        )}
                        {choice.type === "single" && choice.options && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {choice.options.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleRaceChoiceChange(choice.id, opt.id)}
                                className={`px-2 py-1 text-[10px] font-bold rounded border transition-colors ${
                                  data.raceChoices?.[choice.id] === opt.id
                                    ? "border-[var(--color-border-active)] bg-[var(--color-text-primary)] text-[var(--color-surface)]"
                                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-active)]"
                                }`}
                              >
                                {opt.name}
                              </button>
                            ))}
                          </div>
                        )}
                        {choice.type === "language" && (
                          <select
                            value={data.raceChoices?.[choice.id] || ""}
                            onChange={(e) => handleRaceChoiceChange(choice.id, e.target.value)}
                            className="input text-xs mt-1"
                          >
                            <option value="">Select language...</option>
                            {["Common", "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin", "Halfling", "Orc", "Abyssal", "Celestial", "Draconic", "Deep Speech", "Infernal", "Primordial", "Sylvan", "Undercommon", "Gith", "Quori", "Thri-kreen", "Druidic"].map(lang => (
                              <option key={lang} value={lang}>{lang}</option>
                            ))}
                          </select>
                        )}
                        {choice.type === "proficiency" && (
                          <select
                            value={data.raceChoices?.[choice.id] || ""}
                            onChange={(e) => handleRaceChoiceChange(choice.id, e.target.value)}
                            className="input text-xs mt-1"
                          >
                            <option value="">Select skill or tool...</option>
                            {["Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History", "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception", "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival", "Alchemist's Supplies", "Brewer's Supplies", "Calligrapher's Supplies", "Carpenter's Tools", "Cartographer's Tools", "Cobbler's Tools", "Cook's Utensils", "Glassblower's Tools", "Jeweler's Tools", "Leatherworker's Tools", "Mason's Tools", "Painter's Supplies", "Potter's Tools", "Smith's Tools", "Tinker's Tools", "Weaver's Tools", "Woodcarver's Tools", "Dice Set", "Dragonchess Set", "Playing Card Set", "Three-Dragon Ante Set", "Bagpipes", "Drum", "Dulcimer", "Flute", "Lute", "Lyre", "Horn", "Pan Flute", "Shawm", "Viol", "Navigator's Tools", "Poisoner's Kit", "Thieves' Tools", "Herbalism Kit", "Disguise Kit", "Forgery Kit"].map(prof => (
                              <option key={prof} value={prof}>{prof}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                )}

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
