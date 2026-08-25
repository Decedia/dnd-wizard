"use client";

import { useState, useMemo, useCallback } from "react";
import { StepCard } from "./character-creator/StepCard";
import { WizardNav } from "./WizardNav";
import { ProgressIndicator } from "./character-creator/ProgressIndicator";
import {
  generateLevelUpSteps,
  sectionTitle,
  sectionIcon,
  normalizeDescription,
  type LevelUpStep,
  type LevelUpStepSection,
} from "@/lib/level-up";
import { getStaticClass, getStaticSubclasses, getStaticSpells } from "@/lib/srd-client";
import { getHitDieAverage, getModifier, computeDerivedStats, SKILLS, type Character } from "@/lib/storage";
import { applySubclassFeatures, syncBaseFeatures } from "@/lib/character-creation";

type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

const ABILITIES: { key: AbilityKey; label: string; full: string }[] = [
  { key: "str", label: "STR", full: "Strength" },
  { key: "dex", label: "DEX", full: "Dexterity" },
  { key: "con", label: "CON", full: "Constitution" },
  { key: "int", label: "INT", full: "Intelligence" },
  { key: "wis", label: "WIS", full: "Wisdom" },
  { key: "cha", label: "CHA", full: "Charisma" },
];

interface LevelUpWizardProps {
  character: Character;
  onCancel: () => void;
  onComplete: (character: Character) => void;
}

export function LevelUpWizard({ character, onCancel, onComplete }: LevelUpWizardProps) {
  const classData = character.class ? getStaticClass(character.class) : undefined;
  const currentLevel = character.level || 1;
  const hitDie = classData?.hitDie || 10;
  const conMod = getModifier(character.con);
  const averageHp = getHitDieAverage(hitDie) + conMod;

  const [targetLevel, setTargetLevel] = useState(Math.min(20, currentLevel + 1));
  const [stepIndex, setStepIndex] = useState(0);

  // accumulated hp gains per level
  const [hpGains, setHpGains] = useState<Record<number, number>>({});
  const [subclassSelection, setSubclassSelection] = useState<string>(character.subclass || "");
  const [featureChoices, setFeatureChoices] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      Object.entries(character.featureSelections || {}).map(([k, v]) => [
        k,
        Array.isArray(v) ? v[0] || "" : v,
      ])
    )
  );
  const [asiAllocations, setAsiAllocations] = useState<Record<number, Record<AbilityKey, number>>>({});
  const [expertiseSelections, setExpertiseSelections] = useState<Record<number, string[]>>({});
  const [spellSelections, setSpellSelections] = useState<Record<number, string[]>>({});

  const steps = useMemo(
    () => generateLevelUpSteps(currentLevel, targetLevel, character.class, character.expertise, character.skills, false, subclassSelection || character.subclass),
    [currentLevel, targetLevel, character.class, character.expertise, character.skills, subclassSelection, character.subclass]
  );

  const currentStep: LevelUpStep | undefined = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  const setHp = (level: number, value: number) =>
    setHpGains((prev) => ({ ...prev, [level]: value }));

  const setAsi = (level: number, alloc: Record<AbilityKey, number>) =>
    setAsiAllocations((prev) => ({ ...prev, [level]: alloc }));

  const setExpertise = (level: number, list: string[]) =>
    setExpertiseSelections((prev) => ({ ...prev, [level]: list }));

  const setSpells = (level: number, list: string[]) =>
    setSpellSelections((prev) => ({ ...prev, [level]: list }));

  const finishedSteps = useMemo(() => Math.min(stepIndex + 1, steps.length), [stepIndex, steps.length]);

  const canProceed = useCallback(() => {
    if (!currentStep) return true;
    for (const section of currentStep.sections) {
      if (section.type === "hp") {
        if (!hpGains[section.level!] || hpGains[section.level!] <= 0) return false;
      }
      if (section.type === "subclassSelection") {
        if (!subclassSelection) return false;
      }
      if (section.type === "asi") {
        const alloc = asiAllocations[section.level!] || {};
        const total = Object.values(alloc).reduce((a, b) => a + b, 0);
        if (total !== (section.asiCount || 2)) return false;
      }
      if (section.type === "expertise") {
        const sel = expertiseSelections[section.level!] || [];
        if (sel.length < (section.expertiseCount || 0)) return false;
      }
    }
    return true;
  }, [currentStep, hpGains, subclassSelection, asiAllocations, expertiseSelections]);

  const handleFinish = () => {
    if (!classData) return;

    let draft: Character = {
      ...character,
      subclass: subclassSelection || character.subclass,
      featureSelections: Object.fromEntries(
        Object.entries(featureChoices).map(([k, v]) => [k, [v]])
      ),
    };

    // HP — record each level's gain into levelHp and derive maxHp from it.
    // For characters created before per-level HP existed (no levelHp), keep
    // the existing maxHp and just add the new gains.
    const existingLevelHp = character.levelHp && Object.keys(character.levelHp).length > 0 ? character.levelHp : null;
    let totalHp = 0;
    for (const [, gain] of Object.entries(hpGains)) totalHp += gain;
    if (existingLevelHp) {
      const mergedLevelHp: Record<number, number> = { ...existingLevelHp };
      for (const [lvlStr, gain] of Object.entries(hpGains)) {
        const lvl = Number(lvlStr);
        mergedLevelHp[lvl] = (mergedLevelHp[lvl] || 0) + gain;
      }
      let sum = 0;
      for (const v of Object.values(mergedLevelHp)) sum += v;
      draft.levelHp = mergedLevelHp;
      draft.maxHp = sum;
    } else {
      draft.maxHp = (character.maxHp || 0) + totalHp;
    }
    draft.currentHp = draft.maxHp;

    // ASI
    for (const [lvlStr, alloc] of Object.entries(asiAllocations)) {
      const lvl = Number(lvlStr);
      draft = { ...draft, appliedAsi: [...(draft.appliedAsi || []), lvl] };
      for (const { key } of ABILITIES) {
        const add = alloc[key] || 0;
        if (add > 0) draft = { ...draft, [key]: ((draft[key] as number) || 0) + add };
      }
    }

    // Expertise
    const allExpertise = new Set(character.expertise || []);
    for (const list of Object.values(expertiseSelections)) list.forEach((s) => allExpertise.add(s));
    draft.expertise = Array.from(allExpertise);

    // Spells
    const spells = [...(character.spells || [])];
    for (const list of Object.values(spellSelections)) {
      for (const name of list) {
        if (!spells.some((s) => s.name === name)) {
          const spell = getStaticSpells().find((s) => s.name === name);
          spells.push({
            id: `spell-${name}`.replace(/\s+/g, "-"),
            name,
            level: spell?.level ?? 1,
            source: "srd",
            srdSpellName: name,
            description: normalizeDescription(spell?.description),
          });
        }
      }
    }
    draft.spells = spells;

    draft.level = targetLevel;

    // Rebuild features from class/subclass data and apply subclass features
    let finalChar = applySubclassFeatures(draft);
    finalChar = syncBaseFeatures(finalChar);
    finalChar = { ...finalChar, ...computeDerivedStats(finalChar) };

    onComplete(finalChar);
  };

  return (
    <div className="min-h-screen bg-charcoal">
      <div className="sticky top-0 z-40 bg-charcoal/95 backdrop-blur-xl border-b border-border">
        <div className="mx-auto max-w-lg px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={onCancel} className="text-sm text-parchment/70 hover:text-parchment">
              Cancel
            </button>
            <div className="text-sm font-semibold text-parchment">
              Level Up
            </div>
            <div className="w-12" />
          </div>
          <div className="mt-2">
            <label className="text-[10px] uppercase tracking-wider text-parchment/40 font-medium">
              Target Level
            </label>
            <div className="mt-1 flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
              {Array.from({ length: 20 - currentLevel }, (_, i) => i + currentLevel + 1).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => { setTargetLevel(lvl); setStepIndex(0); setHpGains({}); setAsiAllocations({}); setExpertiseSelections({}); setSpellSelections({}); }}
                  className={`h-9 min-w-[2.5rem] rounded-full px-3 text-sm font-semibold transition-all ${
                    lvl === targetLevel
                      ? "bg-accent text-white"
                      : "bg-charcoal-lighter text-text-muted hover:text-parchment border border-border"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="px-4 py-6 pb-40">
        <div className="mx-auto max-w-lg">
          <ProgressIndicator currentStep={finishedSteps} totalSteps={Math.max(1, steps.length)} />
          {currentStep ? (
            <StepCard title={currentStep.title} hint={currentStep.description}>
              <div className="space-y-5">
                {currentStep.sections.map((section, idx) => (
                  <SectionRenderer
                    key={idx}
                    section={section}
                    character={character}
                    subclassSelection={subclassSelection}
                    onSubclassSelect={setSubclassSelection}
                    hpGain={section.level ? (hpGains[section.level] || 0) : 0}
                    onHpChange={(v) => section.level && setHp(section.level, v)}
                    averageHp={averageHp}
                    asiAllocation={section.level ? (asiAllocations[section.level] || { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }) : { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 }}
                    onAsiChange={(alloc) => section.level && setAsi(section.level, alloc)}
                    featureChoices={featureChoices}
                    onFeatureChoice={(name, value) => setFeatureChoices((prev) => ({ ...prev, [name]: value }))}
                    expertise={section.level ? (expertiseSelections[section.level] || character.expertise || []) : (character.expertise || [])}
                    onExpertiseChange={(list) => section.level && setExpertise(section.level, list)}
                    spells={section.level ? (spellSelections[section.level] || []) : []}
                    onSpellsChange={(list) => section.level && setSpells(section.level, list)}
                  />
                ))}
              </div>
            </StepCard>
          ) : (
            <StepCard title="No Levels">
              <p className="text-sm text-parchment/60">Choose a target level above to begin leveling up.</p>
            </StepCard>
          )}
        </div>
      </main>

      <WizardNav
        onBack={() => setStepIndex((s) => Math.max(0, s - 1))}
        onNext={() => {
          if (isLastStep) handleFinish();
          else setStepIndex((s) => Math.min(steps.length - 1, s + 1));
        }}
        backLabel="Back"
        nextLabel={isLastStep ? "Finish Level Up" : "Next"}
        canProceed={canProceed()}
        showBack={stepIndex > 0}
      />
    </div>
  );
}

interface SectionRendererProps {
  section: LevelUpStepSection;
  character: Character;
  subclassSelection: string;
  onSubclassSelect: (name: string) => void;
  hpGain: number;
  onHpChange: (v: number) => void;
  averageHp: number;
  asiAllocation: Record<AbilityKey, number>;
  onAsiChange: (alloc: Record<AbilityKey, number>) => void;
  featureChoices: Record<string, string>;
  onFeatureChoice: (name: string, value: string) => void;
  expertise: string[];
  onExpertiseChange: (list: string[]) => void;
  spells: string[];
  onSpellsChange: (list: string[]) => void;
}

function SectionRenderer({
  section,
  character,
  subclassSelection,
  onSubclassSelect,
  hpGain,
  onHpChange,
  averageHp,
  asiAllocation,
  onAsiChange,
  featureChoices,
  onFeatureChoice,
  expertise,
  onExpertiseChange,
  spells,
  onSpellsChange,
}: SectionRendererProps) {
  const header = (
    <div className="flex items-center gap-2">
      <span className="text-base">{sectionIcon(section.type)}</span>
      <div className="text-xs font-semibold uppercase tracking-wider text-accent">
        {sectionTitle(section.type)}
      </div>
    </div>
  );

  if (section.type === "subclassSelection" && section.subclassOptions) {
    return (
      <div className="space-y-3">
        {header}
        <div className="space-y-2">
          {section.subclassOptions.map((opt) => {
            const isSel = subclassSelection === opt.name;
            return (
              <button
                key={opt.name}
                type="button"
                onClick={() => onSubclassSelect(opt.name)}
                className={`w-full rounded-lg border p-3 text-left transition-all ${
                  isSel ? "border-accent bg-accent/10" : "border-border bg-charcoal/40 hover:border-accent/30"
                }`}
              >
                <div className="text-sm font-semibold text-parchment">{opt.name}</div>
                {opt.description && (
                  <p className="mt-1 text-[11px] text-parchment/70 whitespace-pre-line leading-relaxed">{opt.description}</p>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (section.type === "hp") {
    return (
      <div className="space-y-3">
        {header}
        <p className="text-xs text-parchment/70">{section.description}</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onHpChange(averageHp)}
            className="rounded-lg border border-border bg-charcoal/40 px-3 py-2 text-xs font-semibold text-parchment hover:border-accent/40"
          >
            Average ({averageHp})
          </button>
          <input
            type="number"
            value={hpGain || ""}
            onChange={(e) => onHpChange(Math.max(1, parseInt(e.target.value || "1", 10)))}
            className="input w-28 text-center"
            placeholder={String(averageHp)}
          />
        </div>
      </div>
    );
  }

  if (section.type === "features") {
    return (
      <div className="space-y-3">
        {header}
        <div className="space-y-3">
          {section.features?.map((f, i) => (
            <div key={i} className="rounded-lg border border-border bg-charcoal/30 p-3">
              <div className="text-sm font-bold text-accent tracking-wide">{f.name}</div>
              <p className="mt-1 text-xs text-parchment/80 leading-relaxed whitespace-pre-line">{f.description}</p>
              {section.featureChoices
                ?.filter((fc) => fc.featureName === f.name)
                .map((fc) => (
                  <div key={fc.featureName} className="mt-2">
                    <div className="text-[10px] uppercase tracking-wider text-parchment/40 font-medium">Choose</div>
                    <div className="mt-1 grid grid-cols-1 gap-1.5">
                      {fc.options.map((opt) => {
                        const isSel = (featureChoices[fc.storageKey || fc.featureName] || "") === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => onFeatureChoice(fc.storageKey || fc.featureName, opt)}
                            className={`rounded-lg border px-2.5 py-1.5 text-left text-xs transition-all ${
                              isSel ? "border-accent/40 bg-accent/10 text-parchment" : "border-border bg-charcoal/40 text-parchment/80 hover:border-accent/30"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === "asi") {
    const total = Object.values(asiAllocation).reduce((a, b) => a + b, 0);
    const max = section.asiCount || 2;
    const allocate = (key: AbilityKey) =>
      onAsiChange({ ...asiAllocation, [key]: Math.min(2, (asiAllocation[key] || 0) + 1) });
    const remove = (key: AbilityKey) =>
      onAsiChange({ ...asiAllocation, [key]: Math.max(0, (asiAllocation[key] || 0) - 1) });
    return (
      <div className="space-y-3">
        {header}
        <p className="text-xs text-parchment/70">Distribute {max} points: +2 to one ability, or +1 to two (max 20).</p>
        <div className="space-y-2">
          {ABILITIES.map(({ key, label, full }) => {
            const current = character[key] as number;
            const allocated = asiAllocation[key] || 0;
            const atCap = current >= 20;
            return (
              <div key={key} className="flex items-center justify-between rounded-lg border border-border bg-charcoal/40 px-3 py-2">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-parchment/90 w-12">{label}</span>
                  <span className="text-[10px] text-text-muted">{full}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-parchment w-8 text-center">{current}</span>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => remove(key)} disabled={allocated <= 0} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-parchment/70 disabled:opacity-25 hover:border-accent">−</button>
                    <span className="text-sm font-bold text-accent w-7 text-center">{allocated > 0 ? `+${allocated}` : "0"}</span>
                    <button type="button" onClick={() => allocate(key)} disabled={allocated >= 2 || total >= max || atCap} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-parchment/70 disabled:opacity-25 hover:border-accent">+</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (section.type === "expertise") {
    const count = section.expertiseCount || 0;
    const toggle = (skill: string) => {
      if (expertise.includes(skill)) onExpertiseChange(expertise.filter((s) => s !== skill));
      else if (expertise.length < count) onExpertiseChange([...expertise, skill]);
    };
    return (
      <div className="space-y-3">
        {header}
        <p className="text-xs text-parchment/70">Choose {count} skill{count !== 1 ? "s" : ""} to gain expertise (double proficiency).</p>
        <div className="grid grid-cols-2 gap-1.5">
          {SKILLS.map((s) => {
            const isSel = expertise.includes(s.name);
            const disabled = !isSel && expertise.length >= count;
            return (
              <button
                key={s.name}
                type="button"
                onClick={() => toggle(s.name)}
                disabled={disabled}
                className={`rounded-lg border px-2.5 py-1.5 text-left text-xs transition-all ${
                  isSel ? "border-accent/40 bg-accent/10 text-parchment" : disabled ? "border-border bg-charcoal/40 opacity-50" : "border-border bg-charcoal/40 text-parchment/80 hover:border-accent/30"
                }`}
              >
                {s.name}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (section.type === "spellSlots") {
    return (
      <div className="space-y-3">
        {header}
        <div className="flex flex-wrap gap-2">
          {Object.entries(section.spellSlots || {}).map(([lvl, n]) => (
            <span key={lvl} className="rounded-full border border-border bg-charcoal/40 px-3 py-1 text-xs text-parchment/80">
              Level {lvl}: {n} slots
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === "spellSelection") {
    const available = getStaticSpells().filter((s) => s.classes?.includes(character.class));
    const count = section.spellSelectionCount || 0;
    const toggle = (name: string) => {
      if (spells.includes(name)) onSpellsChange(spells.filter((s) => s !== name));
      else if (spells.length < count) onSpellsChange([...spells, name]);
    };
    return (
      <div className="space-y-3">
        {header}
        <p className="text-xs text-parchment/70">You may add up to {count} spell{count !== 1 ? 's' : ''}. (Optional)</p>
        <div className="max-h-64 overflow-y-auto space-y-1.5">
          {available.map((sp) => {
            const isSel = spells.includes(sp.name);
            const disabled = !isSel && spells.length >= count;
            return (
              <button
                key={sp.name}
                type="button"
                onClick={() => toggle(sp.name)}
                disabled={disabled}
                className={`w-full rounded-lg border px-2.5 py-1.5 text-left text-xs transition-all ${
                  isSel ? "border-accent/40 bg-accent/10 text-parchment" : disabled ? "border-border bg-charcoal/40 opacity-50" : "border-border bg-charcoal/40 text-parchment/80 hover:border-accent/30"
                }`}
              >
                {sp.name} <span className="text-parchment/40">Lv {sp.level}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
