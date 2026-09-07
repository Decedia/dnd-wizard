"use client";

import { useState, useCallback } from "react";
import { UsersIcon as Users, CheckIcon as Check, StarIcon as Star, PersonIcon, BarbarianIcon, MusicNotesIcon, ClericIcon, DruidIcon, FighterIcon, MonkIcon, PaladinIcon, RangerIcon, RogueIcon, SparkleIcon, WarlockIcon, WizardStaffIcon, GearGiIcon as ArtificerIcon, SwordIcon, HumanIcon, ElfIcon, DwarfIcon, GnomeIcon, DragonHeadIcon, GoblinIcon, DevilMaskIcon, KenkuIcon, LizardfolkIcon } from "@/components/icons";
import { StepCard } from "./StepCard";
import { getStaticClasses, getStaticRaces, getStaticSubclasses, type SRDClass, type SRDRace } from "@/lib/srd-client";
import { FeatSelectionModal } from "../modals/FeatSelectionModal";
import { SourceBadge } from "../SourceBadge";
import { NewPlayerTips } from "@/components/NewPlayerTips";
import { BasePopup } from "@/components/BasePopup";
import type { Character } from "@/lib/storage";
import { SKILLS } from "@/lib/storage";
import { isRecommended } from "@/lib/recommendations";
import type { SRDFeat } from "@/lib/srd-client";

const CLASS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Barbarian: BarbarianIcon,
  Bard: MusicNotesIcon,
  Cleric: ClericIcon,
  Druid: DruidIcon,
  Fighter: FighterIcon,
  Monk: MonkIcon,
  Paladin: PaladinIcon,
  Ranger: RangerIcon,
  Rogue: RogueIcon,
  Sorcerer: SparkleIcon,
  Warlock: WarlockIcon,
  Wizard: WizardStaffIcon,
  Artificer: ArtificerIcon,
};

const RACE_SKIN_COLORS: Record<string, string> = {
  Human: "#f1c27d",
  Elf: "#ffdbac",
  Dwarf: "#d2a679",
  Halfling: "#ffdbac",
  Dragonborn: "#cd7f32",
  Gnome: "#ffdbac",
  "Half-Elf": "#f1c27d",
  "Half-Orc": "#6b7c5e",
  Tiefling: "#8b3a3a",
  "Variant Human": "#f1c27d",
  Bugbear: "#8b7355",
  Changeling: "#e0ac69",
  Dhampir: "#d3d3d3",
  Firbolg: "#e0ac69",
  Githyanki: "#d3d3d3",
  Githzerai: "#e0ac69",
  Goblin: "#7d8a6e",
  Hobgoblin: "#8b7355",
  Kenku: "#5c4033",
  Lizardfolk: "#6b8e23",
  Orc: "#5a7248",
  Reborn: "#d3d3d3",
  Shifter: "#8b7355",
  Tabaxi: "#d2a679",
  Triton: "#5f9ea0",
  Hexblood: "#e0ac69",
  "Dragonborn (Chromatic)": "#cd7f32",
  "Dragonborn (Gem)": "#e0ac69",
  "Dragonborn (Metallic)": "#c0c0c0",
  "Deep Gnome (Svirfneblin)": "#ffdbac",
  "Eladrin (Elf)": "#ffdbac",
  "Forest Gnome": "#ffdbac",
  "Rock Gnome": "#ffdbac",
  "Hill Dwarf": "#d2a679",
  "Mountain Dwarf": "#d2a679",
  "Lightfoot Halfling": "#ffdbac",
  "Stout Halfling": "#ffdbac",
  "Ghostwise Halfling": "#ffdbac",
  "Half-Elf (High Elf)": "#f1c27d",
  "Half-Elf (Wood Elf)": "#f1c27d",
  "Half-Elf (Drow)": "#f1c27d",
  "Half-Elf (Moon Elf)": "#f1c27d",
  "Half-Elf (Sun Elf)": "#f1c27d",
  "Half-Elf (Sea Elf)": "#f1c27d",
  "Half-Elf (Shadar-kai)": "#f1c27d",
  "Half-Elf (Eladrin)": "#f1c27d",
  "Tiefling (Asmodeus)": "#8b3a3a",
  "Tiefling (Baalzebul)": "#8b3a3a",
  "Tiefling (Zariel)": "#c0c0c0",
  "Tiefling (Dispater)": "#8b3a3a",
  "Tiefling (Fierna)": "#8b3a3a",
  "Tiefling (Glasya)": "#8b3a3a",
  "Tiefling (Levistus)": "#8b3a3a",
  "Tiefling (Mammon)": "#8b3a3a",
  "Tiefling (Mephistopheles)": "#8b3a3a",
};

const RACE_ICONS_GI: Record<string, React.ComponentType<{ className?: string }> | "hybrid"> = {
  Human: PersonIcon,
  Elf: ElfIcon,
  Dwarf: DwarfIcon,
  Halfling: PersonIcon,
  Dragonborn: DragonHeadIcon,
  Gnome: GnomeIcon,
  "Half-Elf": "hybrid",
  "Half-Orc": "hybrid",
  Tiefling: DevilMaskIcon,
  "Variant Human": HumanIcon,
  Bugbear: PersonIcon,
  Changeling: PersonIcon,
  Dhampir: PersonIcon,
  Firbolg: PersonIcon,
  Githyanki: PersonIcon,
  Githzerai: PersonIcon,
  Goblin: GoblinIcon,
  Hobgoblin: GoblinIcon,
  Kenku: KenkuIcon,
  Lizardfolk: LizardfolkIcon,
  Orc: GoblinIcon,
  Reborn: PersonIcon,
  Shifter: PersonIcon,
  Tabaxi: PersonIcon,
  Triton: PersonIcon,
  Hexblood: PersonIcon,
  "Dragonborn (Chromatic)": DragonHeadIcon,
  "Dragonborn (Gem)": DragonHeadIcon,
  "Dragonborn (Metallic)": DragonHeadIcon,
  "Deep Gnome (Svirfneblin)": GnomeIcon,
  "Eladrin (Elf)": ElfIcon,
  "Forest Gnome": GnomeIcon,
  "Rock Gnome": GnomeIcon,
  "Hill Dwarf": DwarfIcon,
  "Mountain Dwarf": DwarfIcon,
  "Lightfoot Halfling": PersonIcon,
  "Stout Halfling": PersonIcon,
  "Ghostwise Halfling": PersonIcon,
  "Half-Elf (High Elf)": "hybrid",
  "Half-Elf (Wood Elf)": "hybrid",
  "Half-Elf (Drow)": "hybrid",
  "Half-Elf (Moon Elf)": "hybrid",
  "Half-Elf (Sun Elf)": "hybrid",
  "Half-Elf (Sea Elf)": "hybrid",
  "Half-Elf (Shadar-kai)": "hybrid",
  "Half-Elf (Eladrin)": "hybrid",
  "Tiefling (Asmodeus)": DevilMaskIcon,
  "Tiefling (Baalzebul)": DevilMaskIcon,
  "Tiefling (Zariel)": DevilMaskIcon,
  "Tiefling (Dispater)": DevilMaskIcon,
  "Tiefling (Fierna)": DevilMaskIcon,
  "Tiefling (Glasya)": DevilMaskIcon,
  "Tiefling (Levistus)": DevilMaskIcon,
  "Tiefling (Mammon)": DevilMaskIcon,
  "Tiefling (Mephistopheles)": DevilMaskIcon,
};

function HybridRaceIcon({
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  leftColor,
  rightColor,
  className,
}: {
  leftIcon: React.ComponentType<{ className?: string }>;
  rightIcon: React.ComponentType<{ className?: string }>;
  leftColor: string;
  rightColor: string;
  className?: string;
}) {
  return (
    <div className={`inline-flex ${className || ""}`}>
      <span style={{ color: leftColor }} className="inline-flex">
        <LeftIcon className="w-1/2 h-auto" />
      </span>
      <span style={{ color: rightColor }} className="inline-flex">
        <RightIcon className="w-1/2 h-auto" />
      </span>
    </div>
  );
}

function RaceIconRenderer({ raceName, isVariant, className }: { raceName: string; isVariant: boolean; className?: string }) {
  if (raceName === "Human" && isVariant) {
    return <span style={{ color: RACE_SKIN_COLORS["Variant Human"] }} className="inline-flex"><HumanIcon className={className} /></span>;
  }

  const iconEntry = RACE_ICONS_GI[raceName];

  if (iconEntry === "hybrid") {
    if (raceName === "Half-Elf" || raceName.startsWith("Half-Elf")) {
      return (
        <HybridRaceIcon
          leftIcon={PersonIcon}
          rightIcon={ElfIcon}
          leftColor={RACE_SKIN_COLORS.Human}
          rightColor={RACE_SKIN_COLORS.Elf}
          className={className}
        />
      );
    }
    if (raceName === "Half-Orc") {
      return (
        <HybridRaceIcon
          leftIcon={PersonIcon}
          rightIcon={GoblinIcon}
          leftColor={RACE_SKIN_COLORS.Human}
          rightColor={RACE_SKIN_COLORS.Orc}
          className={className}
        />
      );
    }
  }

  const Icon = iconEntry ? (iconEntry as React.ComponentType<{ className?: string }>) : Users;
  const color = RACE_SKIN_COLORS[raceName];
  return <span style={{ color }} className="inline-flex"><Icon className={className} /></span>;
}

interface StepOriginProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepOrigin({ data, onChange }: StepOriginProps) {
  const [popupType, setPopupType] = useState<"class" | "race" | null>(null);
  const [featModalOpen, setFeatModalOpen] = useState(false);
  const [pendingClass, setPendingClass] = useState<string | null>(data.class || null);
  const [pendingRace, setPendingRace] = useState<string | null>(data.race || null);
  const [pendingVariant, setPendingVariant] = useState<boolean>(data.raceVariant === "variant");
  const classes: SRDClass[] = getStaticClasses(data.sources, data.ruleset);
  const races: SRDRace[] = getStaticRaces(data.sources, data.ruleset);

  const isVariantHuman = data.race === "Human" && data.raceVariant === "variant";
  const selectedFeat = data.featureSelections?.["variant-human-feat"]?.[0];

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

  const handleClassSelect = useCallback(
    (className: string) => {
      setPendingClass(className);
    },
    []
  );

  const handleConfirmClass = () => {
    if (pendingClass && pendingClass !== data.class) {
      onChange({
        class: pendingClass,
        subclass: undefined,
        inventory: [],
        skills: {},
        spells: [],
        cantrips: [],
        features: [],
        featureSelections: {},
        appliedAsi: [],
        attacks: [],
        costumeSpells: [],
      });
    }
    setPopupType(null);
  };

  const handleRaceSelect = useCallback(
    (raceName: string) => {
      setPendingRace(raceName);
      setPendingVariant(false);
    },
    []
  );

  const handleConfirmRace = () => {
    if (pendingRace) {
      const isVariant = pendingVariant;
      const raceChanged = pendingRace !== data.race;
      onChange({
        race: pendingRace,
        raceVariant: isVariant ? "variant" : undefined,
        ...(isVariant ? {} : { variantHumanAbilities: undefined, variantHumanSkill: undefined, featureSelections: { ...data.featureSelections, "variant-human-feat": [] } }),
        ...(raceChanged ? { raceChoices: undefined } : {}),
      });
    }
    setPopupType(null);
  };

  const handleVariantToggle = useCallback(() => {
    if (popupType === "race") {
      setPendingVariant((prev) => !prev);
    } else {
      if (isVariantHuman) {
        onChange({
          raceVariant: undefined,
          featureSelections: { ...data.featureSelections, "variant-human-feat": [] },
          variantHumanAbilities: undefined,
          variantHumanSkill: undefined,
        });
      } else {
        onChange({ raceVariant: "variant" });
      }
    }
  }, [isVariantHuman, data.featureSelections, onChange, popupType]);

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

  const handleVariantAbilityToggle = useCallback(
    (ability: string) => {
      const current = data.variantHumanAbilities || [];
      let next: string[];
      if (current.includes(ability)) {
        next = current.filter((a) => a !== ability);
      } else if (current.length < 2) {
        next = [...current, ability];
      } else {
        next = [current[1], ability];
      }
      onChange({ variantHumanAbilities: next });
    },
    [data.variantHumanAbilities, onChange]
  );

  const handleVariantSkillSelect = useCallback(
    (skill: string) => {
      onChange({ variantHumanSkill: data.variantHumanSkill === skill ? undefined : skill });
    },
    [data.variantHumanSkill, onChange]
  );

  const variantAbilities = data.variantHumanAbilities || [];
  const variantSkill = data.variantHumanSkill;
  const abilityOptions = ["str", "dex", "con", "int", "wis", "cha"];

  const canConfirmRace = pendingRace && (!pendingVariant || (variantAbilities.length === 2 && variantSkill && selectedFeat));

  return (
    <StepCard title="Origin" hint="Choose your character's class and race. Your class defines your abilities and role, while your race provides unique traits and ability bonuses.">
      <div className="space-y-4">
        <div className="card p-4">
          <label className="field-label-light">Character Name *</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="input w-full text-lg font-semibold mt-1"
            placeholder="Enter character name"
          />
        </div>

        <NewPlayerTips
          tips={[
            {
              title: "Choosing a Class",
              content: "Your class determines your main role in the party. Fighters are great for beginners—they're tough and deal consistent damage. Clerics are also beginner-friendly, as they can heal and fight.",
              icon: SwordIcon,
            },
            {
              title: "Choosing a Race",
              content: "Race gives you special abilities and ability score bonuses. Humans are versatile, Dwarves are tough, and Elves are agile. Pick one that fits your character concept!",
              icon: PersonIcon,
            },
            {
              title: "Golden Star Icon",
              content: "Look for the gold star icon—it marks options that are especially good for new players.",
              icon: Star,
            },
          ]}
        />

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
            <div className={`flex items-center justify-center w-14 h-14 rounded-[var(--radius-md)] ${data.class ? "bg-[var(--color-border-active)] text-[var(--color-nav-icon)]" : "bg-[var(--color-bg)] text-[var(--color-text-muted)]"}`}>
              {data.class ? (() => { const Icon = CLASS_ICONS[data.class] || SwordIcon; return <Icon className="h-7 w-7" />; })() : <SwordIcon className="h-7 w-7" />}
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
            <div className={`flex items-center justify-center w-14 h-14 rounded-[var(--radius-md)] ${data.race ? "bg-[var(--color-border-active)] text-[var(--color-nav-icon)]" : "bg-[var(--color-bg)] text-[var(--color-text-muted)]"}`}>
              {data.race ? <RaceIconRenderer raceName={data.race} isVariant={data.race === "Human" && data.raceVariant === "variant"} className="h-7 w-7" /> : <Users className="h-7 w-7" />}
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
        <BasePopup
          isOpen={true}
          onClose={() => { setPopupType(null); setPendingClass(data.class || null); }}
          title="Select Class"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          onConfirm={handleConfirmClass}
          confirmDisabled={!pendingClass}
          showFooter={true}
        >
           <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
             {[...classes].sort((a, b) => (isRecommended("class", b.name) ? 1 : 0) - (isRecommended("class", a.name) ? 1 : 0)).map((cls) => {
              const isSelected = pendingClass === cls.name;
              const hasSubclasses = cls.subclasses && cls.subclasses.length > 0;
               const WeaponIcon = CLASS_ICONS[cls.name] || SwordIcon;

              return (
                <div key={cls.name} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingClass(cls.name)}
                    className={`flex-1 p-4 text-left rounded-[var(--radius-md)] transition-all ${
                      isSelected
                        ? "bg-[var(--color-ink)] border-2 border-[var(--color-ink)]"
                        : "bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)] ${isSelected ? "bg-[var(--color-surface)] text-[var(--color-ink)]" : "bg-[var(--color-bg)] text-[var(--color-text-muted)]"}`}>
                        <WeaponIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {cls.source && cls.source !== "PHB" && <SourceBadge source={cls.source} />}
                          <div>
                            <span className={`text-card-title ${isSelected ? "text-[var(--color-surface)]" : ""}`}>
                              {cls.name}
                            </span>
                            {hasSubclasses && (() => {
                               const filteredCount = getStaticSubclasses(cls.name, data.sources, data.ruleset).length;
                              return (
                                <div className="text-[10px] font-semibold text-[var(--color-text-muted)] mt-0.5">
                                  {filteredCount} subclass{filteredCount !== 1 ? "es" : ""} at Lv {cls.subclassLevel}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                        {isRecommended("class", cls.name) && <Star className="h-3.5 w-3.5 text-amber-500" />}
                      </div>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </BasePopup>
      )}

      {popupType === "race" && (
        <BasePopup
          isOpen={true}
          onClose={() => { setPopupType(null); setPendingRace(data.race || null); setPendingVariant(data.raceVariant === "variant"); }}
          title="Select Race"
          confirmLabel="Confirm"
          cancelLabel="Cancel"
          onConfirm={handleConfirmRace}
          confirmDisabled={!canConfirmRace}
          showFooter={true}
        >
           <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {[...races].sort((a, b) => (isRecommended("race", b.name) ? 1 : 0) - (isRecommended("race", a.name) ? 1 : 0)).map((race) => {
               const isSelected = pendingRace === race.name;
                const isHuman = race.name === "Human";

                return (
                 <div key={race.name} className="space-y-2">
                   <div className="flex items-center gap-2">
                     <button
                       type="button"
                       onClick={() => setPendingRace(race.name)}
                       className={`flex-1 p-4 text-left rounded-[var(--radius-md)] transition-all ${
                         isSelected
                           ? "bg-[var(--color-ink)] border-2 border-[var(--color-ink)]"
                           : "bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                       }`}
                     >
                       <div className="flex items-center gap-3">
                         <div className={`flex items-center justify-center w-10 h-10 rounded-[var(--radius-sm)] ${isSelected ? "bg-[var(--color-surface)] text-[var(--color-ink)]" : "bg-[var(--color-bg)] text-[var(--color-text-muted)]"}`}>
                            <RaceIconRenderer raceName={race.name} isVariant={isHuman && pendingVariant} className="h-5 w-5" />
                         </div>
                         <div className="flex-1">
                              <div className="flex items-center justify-between">
                                 <span className={`text-card-title ${isSelected ? "text-[var(--color-surface)]" : ""}`}>
                                   {race.name}
                                 </span>
                                 <div className="flex items-center gap-1">
                                   {race.source && race.source !== "PHB" && <SourceBadge source={race.source} />}
                                   {isRecommended("race", race.name) && <Star className="h-3.5 w-3.5 text-amber-500" />}
                                 </div>
                               </div>
                              <div className="mt-0.5">
                              <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">
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
                    </div>

                    {isSelected && race.choices && race.choices.length > 0 && (
                      <div className="ml-12 mt-2 space-y-2 p-2 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)]">
                        <div className="text-[10px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">Race Options</div>
                        {race.choices.map((choice) => (
                          <div key={choice.id} className="space-y-1">
                            <div className="text-xs font-semibold text-[var(--color-text-primary)]">{choice.name}</div>
                            {choice.type === "single" && choice.options && (
                              <div className="flex flex-wrap gap-1">
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
                                className="input text-xs"
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
                                className="input text-xs"
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
                            pendingVariant
                              ? "border-[var(--color-border-active)] bg-[var(--color-bg)]"
                              : "border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                pendingVariant
                                  ? "border-[var(--color-border-active)] bg-[var(--color-text-primary)]"
                                  : "border-[var(--color-border)]"
                              }`}
                            >
                               {pendingVariant && <Check className="h-3 w-3 text-[var(--color-surface)]" />}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-[var(--color-text-primary)]">Variant Human</div>
                              <div className="text-[10px] text-[var(--color-text-secondary)]">
                                +1 to two abilities, one skill proficiency, and one feat
                              </div>
                            </div>
                          </div>
                        </button>

                        {pendingVariant && (
                          <div className="space-y-3">
                            <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                              <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">+1 to Two Abilities</div>
                              <div className="grid grid-cols-3 gap-1.5">
                                {abilityOptions.map((ability) => {
                                  const isSelected = variantAbilities.includes(ability);
                                  return (
                                    <button
                                      key={ability}
                                      type="button"
                                      onClick={() => handleVariantAbilityToggle(ability)}
                                      className={`p-2 text-center rounded-[var(--radius-sm)] border text-xs font-bold uppercase transition-all ${
                                        isSelected
                                          ? "border-[var(--color-border-active)] bg-[var(--color-text-primary)] text-[var(--color-surface)]"
                                          : "border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                                      }`}
                                    >
                                      {ability}
                                    </button>
                                  );
                                })}
                              </div>
                              <div className="text-[10px] text-[var(--color-text-muted)] mt-1.5">
                                Selected: {variantAbilities.length}/2
                              </div>
                            </div>

                            <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
                              <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-2">Skill Proficiency</div>
                              <div className="grid grid-cols-2 gap-1">
                                {SKILLS.map((skill) => {
                                  const isSelected = variantSkill === skill.name;
                                  return (
                                    <button
                                      key={skill.name}
                                      type="button"
                                      onClick={() => handleVariantSkillSelect(skill.name)}
                                      className={`p-1.5 text-left rounded-[var(--radius-sm)] border text-[10px] font-semibold transition-all ${
                                        isSelected
                                          ? "border-[var(--color-border-active)] bg-[var(--color-text-primary)] text-[var(--color-surface)]"
                                          : "border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                                      }`}
                                    >
                                      {skill.name}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

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
          </BasePopup>
        )}

      {featModalOpen && (
        <FeatSelectionModal
          selectedFeat={selectedFeat}
          sources={data.sources}
          onSelect={(feat: SRDFeat) => {
            handleFeatSelect(feat);
          }}
          onClose={() => setFeatModalOpen(false)}
        />
      )}
    </StepCard>
  );
}
