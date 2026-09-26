"use client";

import { useState, useCallback } from "react";
import { UsersIcon as Users, StarIcon as Star, PersonIcon, BarbarianIcon, MusicNotesIcon, ClericIcon, DruidIcon, FighterIcon, MonkIcon, PaladinIcon, RangerIcon, RogueIcon, SparkleIcon, WarlockIcon, WizardStaffIcon, GearGiIcon as ArtificerIcon, SwordIcon, HumanIcon, ElfIcon, DwarfIcon, GnomeIcon, DragonHeadIcon, GoblinIcon, DevilMaskIcon, KenkuIcon, LizardfolkIcon } from "@/components/icons";
import { StepCard } from "./StepCard";
import { getStaticClasses, getStaticRaces, getStaticSubclasses, getStaticFeat, type SRDClass, type SRDRace } from "@/lib/srd-client";
import { SourceBadge } from "../SourceBadge";
import { NewPlayerTips } from "@/components/NewPlayerTips";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Character } from "@/lib/storage";
import { SKILLS } from "@/lib/storage";
import { isRecommended } from "@/lib/recommendations";
import { BasePopup } from "@/components/BasePopup";
import { ClassSelectionModal } from "../modals/ClassSelectionModal";
import { RaceSelectionModal } from "../modals/RaceSelectionModal";

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
  "Half-Elf (Eladrin)": "#ffdbac",
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

const RACE_ICONS_GI: Record<string, React.ComponentType<{ className?: string }>> = {
  Human: PersonIcon,
  Elf: ElfIcon,
  Dwarf: DwarfIcon,
  Halfling: PersonIcon,
  Dragonborn: DragonHeadIcon,
  Gnome: GnomeIcon,
  "Half-Elf": ElfIcon,
  "Half-Orc": GoblinIcon,
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
  "Half-Elf (High Elf)": ElfIcon,
  "Half-Elf (Wood Elf)": ElfIcon,
  "Half-Elf (Drow)": ElfIcon,
  "Half-Elf (Moon Elf)": ElfIcon,
  "Half-Elf (Sun Elf)": ElfIcon,
  "Half-Elf (Sea Elf)": ElfIcon,
  "Half-Elf (Shadar-kai)": ElfIcon,
  "Half-Elf (Eladrin)": ElfIcon,
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

function RaceIconRenderer({ raceName, isVariant, className }: { raceName: string; isVariant: boolean; className?: string }) {
  if (raceName === "Human" && isVariant) {
    return <span style={{ color: RACE_SKIN_COLORS["Variant Human"] }} className="inline-flex"><HumanIcon className={className} /></span>;
  }

  const Icon = RACE_ICONS_GI[raceName] || Users;
  const color = RACE_SKIN_COLORS[raceName];
  return <span style={{ color }} className="inline-flex"><Icon className={className} /></span>;
}

interface StepOriginProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepOrigin({ data, onChange }: StepOriginProps) {
  const { t } = useLanguage();
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [raceModalOpen, setRaceModalOpen] = useState(false);
  const classes: SRDClass[] = getStaticClasses(data.sources, data.ruleset);
  const races: SRDRace[] = getStaticRaces(data.sources, data.ruleset);

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
    (payload: any) => {
      const className = payload.name;
      if (className !== data.class) {
        onChange({
          class: className,
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
      setClassModalOpen(false);
    },
    [data.class, onChange]
  );

  const handleRaceSelect = useCallback(
    (payload: any) => {
      const raceName = payload.name;
      const isVariant = payload.configChoice?.featureData?.choiceType === "variant";
      const nextRaceChoices = { ...data.raceChoices };
      if (payload.configChoice?.parentChoiceId && payload.configChoice?.featureData?.id) {
        nextRaceChoices[payload.configChoice.parentChoiceId] = payload.configChoice.featureData.id;
      }

      const oldAbilities = data.variantHumanAbilities || [];
      const newAbilities = isVariant ? (payload.configChoice?.featureData?.abilities || []) : [];
      const oldSkill = data.variantHumanSkill;
      const newSkill = isVariant ? payload.configChoice?.featureData?.skill : undefined;
      const oldFeat = data.featureSelections?.["variant-human-feat"]?.[0];
      const newFeat = isVariant ? payload.configChoice?.featureData?.feat : undefined;

      const abilityPatch: Record<string, number> = {};
      for (const ab of oldAbilities) {
        if (abilityPatch[ab] !== undefined) continue;
        abilityPatch[ab] = ((data[ab as keyof Character] as number) || 10) - 1;
      }
      for (const ab of newAbilities) {
        if (abilityPatch[ab] !== undefined) continue;
        abilityPatch[ab] = ((data[ab as keyof Character] as number) || 10) + 1;
      }

      const skillPatch: Record<string, any> = {};
      if (newSkill && !data.skills[newSkill]) {
        skillPatch.skills = { ...data.skills, [newSkill]: true };
      }

      const featPatch: Record<string, any> = { features: data.features };
      if (newFeat && !data.features.some((f) => f.name === newFeat)) {
        const featData = getStaticFeat(newFeat);
        if (featData) {
          featPatch.features = [
            ...data.features,
            {
              id: `feat-${newFeat}`.replace(/\s+/g, "-"),
              name: featData.name,
              description: featData.description,
              summary: featData.summary || null,
              source: "race" as const,
              locked: true,
            },
          ];
        }
      }
      if (!newFeat && oldFeat) {
        featPatch.features = data.features.filter((f) => f.name !== oldFeat);
      }

      onChange({
        race: raceName,
        raceVariant: isVariant ? "variant" : undefined,
        raceChoices: nextRaceChoices,
        ...(isVariant ? {
          variantHumanAbilities: newAbilities,
          variantHumanSkill: newSkill,
          featureSelections: {
            ...data.featureSelections,
            "variant-human-feat": newFeat ? [newFeat] : [],
          },
        } : { 
          variantHumanAbilities: undefined, 
          variantHumanSkill: undefined, 
          featureSelections: { ...data.featureSelections, "variant-human-feat": [] } 
        }),
        ...abilityPatch,
        ...skillPatch,
        ...featPatch,
      });
      setRaceModalOpen(false);
    },
    [data, onChange]
  );

  return (
    <StepCard title={t("origin.title")} hint={t("origin.hint")}>
      <div className="space-y-4">
        <div className="card p-4">
          <label className="field-label-light">{t("origin.characterNameRequired")}</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="input w-full text-lg font-semibold mt-1"
            placeholder={t("origin.enterCharacterName")}
          />
        </div>

        <NewPlayerTips
          tips={[
            {
              title: t("origin.tip.class"),
              content: t("origin.tip.classContent"),
              icon: SwordIcon,
            },
            {
              title: t("origin.tip.race"),
              content: t("origin.tip.raceContent"),
              icon: PersonIcon,
            },
            {
              title: t("origin.tip.star"),
              content: t("origin.tip.starContent"),
              icon: Star,
            },
          ]}
        />

        <button
          type="button"
          onClick={() => setClassModalOpen(true)}
          className={`w-full p-5 sm:p-6 text-left rounded-[var(--radius-md)] transition-all border-2 ${
            data.class
              ? "bg-[var(--color-surface)] border-[var(--color-border-active)]"
              : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-active)]"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center w-14 h-14 rounded-[var(--radius-md)] shrink-0 ${data.class ? "bg-[var(--color-border-active)] text-[var(--color-nav-icon)]" : "bg-[var(--color-bg)] text-[var(--color-text-muted)]"}`}>
              {data.class ? (() => { const Icon = CLASS_ICONS[data.class] || SwordIcon; return <Icon className="h-7 w-7" />; })() : <SwordIcon className="h-7 w-7" />}
            </div>
            <div className="flex-1 min-w-0">
               <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{t("origin.classLabel")}</div>
               <div className="text-base sm:text-lg font-bold text-[var(--color-text-primary)] mt-1 truncate">
                 {data.class || t("origin.selectClass")}
               </div>
            </div>
            <div className="text-2xl text-[var(--color-text-muted)] shrink-0">→</div>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setRaceModalOpen(true)}
          className={`w-full p-5 sm:p-6 text-left rounded-[var(--radius-md)] transition-all border-2 ${
            data.race
              ? "bg-[var(--color-surface)] border-[var(--color-border-active)]"
              : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-active)]"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`flex items-center justify-center w-14 h-14 rounded-[var(--radius-md)] shrink-0 ${data.race ? "bg-[var(--color-border-active)] text-[var(--color-nav-icon)]" : "bg-[var(--color-bg)] text-[var(--color-text-muted)]"}`}>
              {data.race ? <RaceIconRenderer raceName={data.race} isVariant={data.race === "Human" && data.raceVariant === "variant"} className="h-7 w-7" /> : <Users className="h-7 w-7" />}
            </div>
            <div className="flex-1 min-w-0">
               <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{t("origin.raceLabel")}</div>
                <div className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)] mt-1 break-words truncate whitespace-nowrap">
                 {data.race ? (data.race === "Human" && data.raceVariant === "variant" ? t("origin.variantHuman") : data.race) : t("origin.selectRace")}
               </div>
            </div>
            <div className="text-2xl text-[var(--color-text-muted)] shrink-0">→</div>
          </div>
        </button>
      </div>

      {classModalOpen && (
        <ClassSelectionModal
          isOpen={true}
          onClose={() => setClassModalOpen(false)}
          onConfirm={handleClassSelect}
          characterSources={data.sources}
          currentCharacter={data}
        />
      )}

      {raceModalOpen && (
        <RaceSelectionModal
          isOpen={true}
          onClose={() => setRaceModalOpen(false)}
          onConfirm={handleRaceSelect}
          characterSources={data.sources}
          currentCharacter={data}
        />
      )}
    </StepCard>
  );
}