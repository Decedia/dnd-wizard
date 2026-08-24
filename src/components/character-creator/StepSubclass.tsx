"use client";

import { useState, useMemo } from "react";
import { StepCard } from "./StepCard";
import { getStaticClass, getStaticSubclasses } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";

interface StepSubclassProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepSubclass({ data, onChange }: StepSubclassProps) {
  const classData = data.class ? getStaticClass(data.class) : null;
  const className = classData?.name || "Class";
  const subclassUnlockLevel = classData?.subclassLevel ?? 3;

  const subclasses = useMemo(() => getStaticSubclasses(data.class), [data.class]);

  const [selectedSubclass, setSelectedSubclass] = useState(data.subclass || "");

  const selectedOption = useMemo(
    () => subclasses.find((s) => s.name === selectedSubclass),
    [subclasses, selectedSubclass]
  );

  const handleSubclassSelect = (name: string) => {
    setSelectedSubclass(name);
    onChange({ subclass: name });
  };

  const ownedFeatures = data.features;

  return (
    <StepCard
      title={`Subclass (Level ${subclassUnlockLevel})`}
      hint={`At level ${subclassUnlockLevel}, you choose a subclass that defines your character's archetype. Each subclass grants unique features and abilities that shape how your character plays.`}
    >
      <div className="space-y-6">
        {/* PART 1 — What you already have (read-only, informational) */}
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-parchment/70 mb-2">
            Your {className} Features So Far
          </h3>
          {ownedFeatures.length === 0 ? (
            <p className="text-sm text-parchment/50">
              You haven&apos;t gained any class or race features yet.
            </p>
          ) : (
            <div className="space-y-2">
              {ownedFeatures.map((feature) => {
                const isLocked = feature.locked === true;
                return (
                  <div
                    key={feature.id}
                    className={`rounded-lg border p-3 ${
                      isLocked ? "border-green-500/20 bg-green-500/5" : "border-border bg-charcoal/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-parchment">{feature.name}</span>
                      {isLocked && (
                        <span className="text-[10px] font-medium text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded whitespace-nowrap">
                          default
                        </span>
                      )}
                    </div>
                    {feature.description && (
                      <p className="text-sm text-parchment/70 leading-relaxed mt-1">{feature.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* PART 2 — What your subclass adds (selection required) */}
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-parchment/70 mb-2">
            Choose Your Path
          </h3>
          <p className="text-sm text-parchment/70 leading-relaxed mb-3">
            At this level your {className} begins to specialize. Your choice here defines your playstyle
            and grants you unique features now and as you level up. This is called your subclass — you can
            only choose once.
          </p>

          {subclasses.length === 0 ? (
            <p className="text-sm text-parchment/60">This class does not have subclasses.</p>
          ) : (
            <div className="space-y-3">
              {subclasses.map((subclass) => {
                const isSelected = selectedSubclass === subclass.name;
                const startingFeatures = subclass.features.filter(
                  (f) => f.level == null || f.level === subclassUnlockLevel
                );

                return (
                  <button
                    key={subclass.name}
                    type="button"
                    onClick={() => handleSubclassSelect(subclass.name)}
                    className={`w-full rounded-lg border p-4 text-left transition-all ${
                      isSelected
                        ? "border-accent bg-accent/10"
                        : "border-border bg-charcoal/40 hover:border-accent/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-semibold text-parchment">{subclass.name}</span>
                      {isSelected && (
                        <span className="text-[10px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                          Selected
                        </span>
                      )}
                    </div>
                    {subclass.description && (
                      <p className="mt-1 text-xs text-parchment/80">{subclass.description}</p>
                    )}

                    {startingFeatures.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-[10px] font-medium text-parchment/50 uppercase tracking-wider">
                          Features you gain
                        </p>
                        {startingFeatures.map((feature, idx) => (
                          <div
                            key={idx}
                            className="rounded-md border border-border bg-charcoal/30 px-3 py-2"
                          >
                            <span className="text-xs font-semibold text-accent">{feature.name}</span>
                            {feature.description && (
                              <p className="text-[11px] text-parchment/80 mt-0.5 leading-relaxed">
                                {feature.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </StepCard>
  );
}
