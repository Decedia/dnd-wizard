"use client";

import { useState, useCallback } from "react";
import { Sword, Users, CaretRight, Scroll, Info, Star } from "@phosphor-icons/react";
import { getStaticClasses, getStaticRaces, type SRDClass, type SRDRace } from "@/lib/srd-client";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Character } from "@/lib/storage";
import { ClassSelectionModal } from "../modals/ClassSelectionModal";
import { RaceSelectionModal } from "../modals/RaceSelectionModal";
import { CLASS_ICONS } from "../modals/UnifiedSelectionModal";
import { RACE_ICONS } from "@/components/race-icons";
import { BackgroundSelectionModal, backgroundStatLine, background2024StatLine } from "../modals/BackgroundSelectionModal";
import { applyBackground2024, chosenLineage, getBackground2024, is2024 } from "@/lib/origin-2024";
import { BackgroundToolPick2024, OriginFeats2024, SpeciesPicks2024 } from "./Origin2024Picks";
import { LanguagePicker } from "./LanguagePicker";
import { getBackgroundData } from "@/data/backgrounds";
import { applyBackground, racePatch } from "@/lib/character-creation";

function SectionHeader({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {icon}
      <h3 className="text-xs font-bold uppercase tracking-widest text-ink">{children}</h3>
    </div>
  );
}

/** One tap-to-choose row, styled like the other creator panels. */
export function PickRow({ label, title, subtitle, icon, chosen, onClick }: { label: string; title: string; subtitle: string; icon: React.ReactNode; chosen: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border-2 bg-surface p-4 text-left transition active:scale-[0.98] ${chosen ? "border-ink" : "border-border-strong hover:border-ink/40"}`}
    >
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${chosen ? "bg-ink text-surface" : "bg-ink/10 text-ink"}`}>{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">{label}</p>
        <h4 className={`text-lg font-bold leading-tight ${chosen ? "text-ink" : "text-ink-muted"}`}>{title}</h4>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-muted">{subtitle}</p>
      </div>
      <CaretRight size={20} weight="bold" className="shrink-0 text-ink-muted" />
    </button>
  );
}

interface StepOriginProps {
  data: Character;
  onChange: (patch: Partial<Character>) => void;
}

export function StepOrigin({ data, onChange }: StepOriginProps) {
  const { t, language } = useLanguage();
  const [classModalOpen, setClassModalOpen] = useState(false);
  const [raceModalOpen, setRaceModalOpen] = useState(false);
  const [backgroundModalOpen, setBackgroundModalOpen] = useState(false);
  const classes: SRDClass[] = getStaticClasses(data.sources, data.ruleset, language);
  const races: SRDRace[] = getStaticRaces(data.sources, data.ruleset, language);

  const selectedClass = classes.find((c) => c.name === data.class);
  const selectedRace = races.find((r) => r.name === data.race);
  const selectedBackground = getBackgroundData(data.background);
  const rules2024 = is2024(data);
  const background2024 = rules2024 ? getBackground2024(data.background) : undefined;

  const truncate = (text?: string, max = 140) => {
    if (!text) return "";
    const cleaned = text.replace(/\*\*/g, "").replace(/\*/g, "").replace(/\n+/g, " ").trim();
    if (cleaned.length <= max) return cleaned;
    return cleaned.slice(0, max).trimEnd() + "...";
  };

  const handleClassSelect = useCallback(
    (payload: any) => {
      const className = payload.name;
      if (className !== data.class) {
        // 2024: the background's feat, tool and gear picks don't depend on the class, so they stay.
        const keep = (key: string) => rules2024 && /^(origin-feat-|background-tool-2024|gear-2024-background)/.test(key);
        const backgroundSkills = background2024?.skills || [];
        onChange({
          class: className,
          subclass: undefined,
          inventory: rules2024 ? data.inventory.filter((r) => r.grantedFrom?.startsWith("background:")) : [],
          skills: Object.fromEntries(backgroundSkills.map((s) => [s, true])),
          spells: [],
          cantrips: [],
          features: [],
          featureSelections: Object.fromEntries(Object.entries(data.featureSelections || {}).filter(([k]) => keep(k))),
          appliedAsi: [],
          attacks: [],
          costumeSpells: [],
        });
      }
      setClassModalOpen(false);
    },
    [data.class, data.inventory, data.featureSelections, rules2024, background2024, onChange]
  );

  const handleRaceSelect = useCallback(
    (payload: any) => {
      onChange(racePatch(data, payload));
      setRaceModalOpen(false);
    },
    [data, onChange]
  );

  const isFormComplete = data.class && data.race;

  return (
    <section className="w-full">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">{t("origin.kicker", "Gameplay")}</p>
        <h1 className="text-2xl font-black tracking-tight text-ink">{t("origin.title", "Identitas & Asal")}</h1>
      </div>

      <div className="space-y-6">
        <div className="flex gap-3 rounded-2xl border border-ink/20 bg-ink/10 p-4">
          <Info size={18} weight="bold" className="mt-0.5 shrink-0 text-ink" />
          <p className="text-xs leading-relaxed text-ink/80">
            {rules2024
              ? t("origin.introHint2024", "Your class, species and background decide your stats and skills. Under the 2024 rules your background gives your ability increases and a starting feat.")
              : t("origin.introHint", "Your class, race and background decide your stats and skills. Tap a card to see the options.")}
          </p>
        </div>

        <section>
          <SectionHeader icon={<Sword size={14} weight="bold" className="text-ink" />}>{rules2024 ? t("origin.sectionClassSpecies", "Class & species") : t("origin.sectionClassRace", "Class & race")}</SectionHeader>
          <div className="space-y-3">
            <PickRow
              label={`${t("form.class", "Class")} *`}
              title={data.class || t("origin.selectClass", "Pilih Kelas")}
              subtitle={data.class ? truncate(selectedClass?.flavor || data.class) : t("origin.classExamples", "Fighter, Wizard, Rogue...")}
              icon={(() => { const Icon = (data.class && CLASS_ICONS[data.class]) || Sword; return <Icon className="h-6 w-6" />; })()}
              chosen={!!data.class}
              onClick={() => setClassModalOpen(true)}
            />
            <PickRow
              label={`${rules2024 ? t("form.species", "Species") : t("form.race", "Race")} *`}
              title={data.race ? (data.race === "Human" && data.raceVariant === "variant" ? t("origin.variantHuman", "Variant Human") : data.race) : rules2024 ? t("origin.selectSpecies", "Choose a species") : t("origin.selectRace", "Pilih Ras")}
              subtitle={data.race
                ? rules2024
                  ? [chosenLineage(data)?.name, truncate(selectedRace?.traits?.map((tr) => tr.name).join(", "))].filter(Boolean).join(" · ")
                  : data.race === "Human" && data.raceVariant === "variant"
                  ? [
                      (data.variantHumanAbilities || []).map((ab) => `+1 ${ab.toUpperCase()}`).join(", "),
                      data.variantHumanSkill,
                      data.featureSelections?.["variant-human-feat"]?.[0],
                    ].filter(Boolean).join(" · ")
                  : truncate(selectedRace?.flavor || (selectedRace as any)?.recommendation?.text || data.race)
                : t("origin.raceExamples", "Manusia, Elf, Dwarf...")}
              icon={(() => { const Icon = (data.race && RACE_ICONS[data.race]) || Users; return <Icon className="h-6 w-6" />; })()}
              chosen={!!data.race}
              onClick={() => setRaceModalOpen(true)}
            />
            {rules2024 && <SpeciesPicks2024 data={data} onChange={onChange} />}
          </div>
        </section>

        <section>
          <SectionHeader icon={<Scroll size={14} weight="bold" className="text-ink" />}>{t("origin.sectionBackground", "Background")}</SectionHeader>
          <PickRow
            label={`${t("form.background", "Background")} *`}
            title={data.background || t("origin.chooseBackground", "Pilih Latar Belakang")}
            subtitle={background2024
              ? background2024StatLine(background2024, t)
              : selectedBackground && !rules2024 ? backgroundStatLine(selectedBackground, t) : t("origin.backgroundExamples", "Acolyte, Soldier, Sage...")}
            icon={<Scroll className="h-6 w-6" />}
            chosen={rules2024 ? !!background2024 : !!data.background}
            onClick={() => setBackgroundModalOpen(true)}
          />
          {rules2024 && <div className="mt-3"><BackgroundToolPick2024 data={data} onChange={onChange} /></div>}
        </section>

        {rules2024 && (data.background || data.race === "Human") && (
          <section>
            <SectionHeader icon={<Star size={14} weight="bold" className="text-ink" />}>{t("origin.sectionFeats", "Starting feats")}</SectionHeader>
            <OriginFeats2024 data={data} onChange={onChange} />
          </section>
        )}

        <LanguagePicker data={data} onChange={onChange} />
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

      {backgroundModalOpen && (
        <BackgroundSelectionModal
          isOpen={true}
          current={data.background}
          ruleset={data.ruleset}
          onClose={() => setBackgroundModalOpen(false)}
          onConfirm={(bg) => {
            if (bg !== data.background) onChange(rules2024 ? applyBackground2024(data, bg) : applyBackground(data, bg));
          }}
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
    </section>
  );
}
