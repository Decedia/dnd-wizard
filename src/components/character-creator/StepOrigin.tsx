"use client";

import { useState, useCallback } from "react";
import { Sword, Users, Sparkle, MusicNotes, Shield, Flame, Skull, HandFist, Leaf, Eye, MagicWand, Heart } from "phosphor-react";
import { StepCard } from "./StepCard";
import { getStaticClasses, getStaticRaces, type SRDClass, type SRDRace } from "@/lib/srd-client";
import { InfoButton } from "@/components/InfoButton";
import type { Character } from "@/lib/storage";

const classIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Barbarian: Flame,
  Bard: MusicNotes,
  Cleric: Heart,
  Druid: Leaf,
  Fighter: Sword,
  Monk: HandFist,
  Paladin: Shield,
  Ranger: Eye,
  Rogue: Eye,
  Sorcerer: Sparkle,
  Warlock: Skull,
  Wizard: MagicWand,
};

const raceIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  Human: Users,
  Elf: Leaf,
  Dwarf: Shield,
  Halfling: Users,
  Dragonborn: Flame,
  Gnome: Sparkle,
  "Half-Elf": Users,
  "Half-Orc": Sword,
  Tiefling: Skull,
};

interface StepOriginProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepOrigin({ data, onChange }: StepOriginProps) {
  const [popupType, setPopupType] = useState<"class" | "race" | null>(null);
  const classes: SRDClass[] = getStaticClasses();
  const races: SRDRace[] = getStaticRaces();

  const handleClassSelect = useCallback(
    (className: string) => {
      onChange({ class: className, subclass: undefined });
      setPopupType(null);
    },
    [onChange]
  );

  const handleRaceSelect = useCallback(
    (raceName: string) => {
      onChange({ race: raceName });
      setPopupType(null);
    },
    [onChange]
  );

  return (
    <StepCard title="Origin" hint="Choose your character's class and race. Your class defines your abilities and role, while your race provides unique traits and ability bonuses.">
      <div className="space-y-4">
        <div>
          <label className="field-label-light">Character Name</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="input w-full"
            placeholder="Enter character name"
          />
        </div>

        <button
          type="button"
          onClick={() => setPopupType("class")}
          className={`w-full p-6 text-left rounded-[var(--radius-md)] transition-all border-2 ${
            data.class
              ? "bg-[var(--color-surface)] border-[var(--color-border-active)]"
              : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-active)]"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center w-14 h-14 rounded-[var(--radius-md)] ${data.class ? "bg-[var(--color-border-active)] text-white" : "bg-[var(--color-bg)] text-[var(--color-text-muted)]"}`}>
              {data.class ? (() => { const Icon = classIcons[data.class] || Sword; return <Icon className="h-7 w-7" />; })() : <Sword className="h-7 w-7" />}
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Class</div>
              <div className="text-lg font-bold text-[var(--color-text-primary)] mt-1">
                {data.class || "Select Class"}
              </div>
            </div>
            <div className="text-2xl text-[var(--color-text-muted)]">→</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setPopupType("race")}
          className={`w-full p-6 text-left rounded-[var(--radius-md)] transition-all border-2 ${
            data.race
              ? "bg-[var(--color-surface)] border-[var(--color-border-active)]"
              : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-active)]"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center w-14 h-14 rounded-[var(--radius-md)] ${data.race ? "bg-[var(--color-border-active)] text-white" : "bg-[var(--color-bg)] text-[var(--color-text-muted)]"}`}>
              {data.race ? (() => { const Icon = raceIcons[data.race] || Users; return <Icon className="h-7 w-7" />; })() : <Users className="h-7 w-7" />}
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Race</div>
              <div className="text-lg font-bold text-[var(--color-text-primary)] mt-1">
                {data.race || "Select Race"}
              </div>
            </div>
            <div className="text-2xl text-[var(--color-text-muted)]">→</div>
          </div>
        </button>
      </div>

      {popupType === "class" && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setPopupType(null); }}
        >
          <div className="w-full max-w-md max-h-[80vh] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <div className="text-sm font-bold text-[var(--color-text-primary)]">Select Class</div>
              <button
                type="button"
                onClick={() => setPopupType(null)}
                className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {classes.map((cls) => {
                const isSelected = data.class === cls.name;
                const hasSubclasses = cls.subclasses && cls.subclasses.length > 0;
                const Icon = classIcons[cls.name] || Sparkle;

                return (
                  <div key={cls.name} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleClassSelect(cls.name)}
                      className={`flex-1 p-4 text-left rounded-[var(--radius-md)] transition-all ${
                        isSelected
                          ? "bg-[var(--color-bg)] border-2 border-[var(--color-border-active)]"
                          : "bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)] ${isSelected ? "bg-[var(--color-border-active)] text-white" : "bg-[var(--color-surface)] text-[var(--color-text-muted)]"}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-card-title">{cls.name}</span>
                            {hasSubclasses && (
                              <span className="badge text-[var(--color-text-primary)] bg-[var(--color-surface)]">
                                Subclass at Lv {cls.subclassLevel}
                              </span>
                            )}
                          </div>
                          {hasSubclasses && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {cls.subclasses!.map((sub) => (
                                <span
                                  key={sub.name}
                                  className="text-[10px] font-bold text-[var(--color-text-muted)] bg-[var(--color-surface)] px-1.5 py-0.5 rounded-full"
                                >
                                  {sub.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                    {cls.flavorText && (
                      <InfoButton title={cls.name} description={cls.flavorText} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {popupType === "race" && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setPopupType(null); }}
        >
          <div className="w-full max-w-md max-h-[80vh] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <div className="text-sm font-bold text-[var(--color-text-primary)]">Select Race</div>
              <button
                type="button"
                onClick={() => setPopupType(null)}
                className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {races.map((race) => {
                const isSelected = data.race === race.name;
                const Icon = raceIcons[race.name] || Users;
                return (
                  <div key={race.name} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRaceSelect(race.name)}
                      className={`flex-1 p-4 text-left rounded-[var(--radius-md)] transition-all ${
                        isSelected
                          ? "bg-[var(--color-bg)] border-2 border-[var(--color-border-active)]"
                          : "bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)] ${isSelected ? "bg-[var(--color-border-active)] text-white" : "bg-[var(--color-surface)] text-[var(--color-text-muted)]"}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-card-title">{race.name}</span>
                            <span className="text-muted">
                              {race.size} / Speed {race.speed} ft
                            </span>
                          </div>
                          <p className="mt-1 text-description">
                            {Object.entries(race.abilityScoreIncreases || {})
                              .map(([stat, bonus]) => `+${bonus} ${stat.toUpperCase()}`)
                              .join(", ")}
                          </p>
                        </div>
                      </div>
                    </button>
                    {race.traits && race.traits.length > 0 && (
                      <InfoButton
                        title={`${race.name} Traits`}
                        description={race.traits.map((t) => `${t.name}: ${t.description}`).join("\n\n")}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </StepCard>
  );
}
