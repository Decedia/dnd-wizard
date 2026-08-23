"use client";

import { useState, useMemo } from "react";
import { StepCard } from "./StepCard";
import { getStaticClass, getStaticRaces } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";

interface StepSubclassProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepSubclass({ data, onChange }: StepSubclassProps) {
  const classData = data.class ? getStaticClass(data.class) : null;
  const [selectedSubclass, setSelectedSubclass] = useState(data.subclass || "");
  const [featureChoices, setFeatureChoices] = useState<Record<string, string>>({});

  const subclasses = useMemo(() => classData?.subclasses || [], [classData?.subclasses]);
  const subclassLevel = classData?.subclassLevel || 3;

  const selectedOption = useMemo(() => {
    return subclasses.find((s) => s.name === selectedSubclass);
  }, [subclasses, selectedSubclass]);

  const handleSubclassSelect = (name: string) => {
    setSelectedSubclass(name);
    onChange({ subclass: name });
  };

  const handleFeatureChoice = (featureName: string, value: string) => {
    setFeatureChoices((prev) => {
      if (value) {
        return { ...prev, [featureName]: value };
      } else {
        const next = { ...prev };
        delete next[featureName];
        return next;
      }
    });
  };

  return (
    <StepCard
      title={`Subclass (Level ${subclassLevel})`}
      hint={`At level ${subclassLevel}, you choose a subclass that defines your character's archetype. Each subclass grants unique features and abilities that shape how your character plays.`}
    >
      {subclasses.length === 0 ? (
        <p className="text-sm text-parchment/60">This class does not have subclasses.</p>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {subclasses.map((subclass: any) => {
              const isSelected = selectedSubclass === subclass.name;
              const subclassFeatures = (subclass.features || []).filter((f: any) => !f.level || f.level === subclassLevel);

              return (
                <div
                  key={subclass.name}
                  className={`rounded-lg border p-4 transition-colors ${
                    isSelected
                      ? "border-accent bg-accent/10"
                      : "border-border bg-charcoal/40 hover:border-accent/30"
                  }`}
                >
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="subclass"
                      checked={isSelected}
                      onChange={() => handleSubclassSelect(subclass.name)}
                      className="mt-0.5 h-4 w-4 text-accent focus:ring-accent/50"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-parchment/80">{subclass.name}</span>
                      {subclass.description && (
                        <p className="text-xs text-parchment/50 mt-1">{subclass.description}</p>
                      )}
                      {isSelected && subclassFeatures.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium text-parchment/60 uppercase tracking-wider">
                            Features at Level {subclassLevel}
                          </p>
                          {subclassFeatures.map((feature: any, idx: number) => {
                            const choiceKey = feature.name;
                            const choice = featureChoices[choiceKey];

                            return (
                              <div
                                key={idx}
                                className="rounded-md border border-border bg-charcoal/30 px-3 py-2"
                              >
                                <span className="text-xs font-medium text-accent">{feature.name}:</span>
                                <span className="text-[11px] text-parchment/60 ml-1 whitespace-pre-line">
                                  {typeof feature.description === "string"
                                    ? feature.description
                                    : Array.isArray(feature.description)
                                      ? feature.description.join("\n")
                                      : ""}
                                </span>
                                {choiceKey === "Totem Spirit" && (
                                  <div className="mt-2">
                                    <select
                                      value={choice || ""}
                                      onChange={(e) => handleFeatureChoice(choiceKey, e.target.value)}
                                      className="input w-full text-xs"
                                    >
                                      <option value="">Choose totem animal...</option>
                                      <option value="Bear">Bear</option>
                                      <option value="Eagle">Eagle</option>
                                      <option value="Elk">Elk</option>
                                      <option value="Tiger">Tiger</option>
                                      <option value="Wolf">Wolf</option>
                                    </select>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </StepCard>
  );
}
