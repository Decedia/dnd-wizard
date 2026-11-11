"use client";

import { useState, useCallback } from "react";
import { Sword, Users, CaretRight, Scroll, Info } from "@phosphor-icons/react";
import { getStaticClasses, getStaticRaces, type SRDClass, type SRDRace } from "@/lib/srd-client";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Character } from "@/lib/storage";
import { ClassSelectionModal } from "../modals/ClassSelectionModal";
import { RaceSelectionModal } from "../modals/RaceSelectionModal";
import { CLASS_ICONS } from "../modals/UnifiedSelectionModal";
import { RACE_ICONS } from "@/components/race-icons";
import { BackgroundSelectionModal, backgroundStatLine } from "../modals/BackgroundSelectionModal";
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
            {t("origin.introHint", "Your class, race and background decide your stats and skills. Tap a card to see the options.")}
          </p>
        </div>

        <section>
          <SectionHeader icon={<Sword size={14} weight="bold" className="text-ink" />}>{t("origin.sectionClassRace", "Class & race")}</SectionHeader>
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
              label={`${t("form.race", "Race")} *`}
              title={data.race ? (data.race === "Human" && data.raceVariant === "variant" ? t("origin.variantHuman", "Variant Human") : data.race) : t("origin.selectRace", "Pilih Ras")}
              subtitle={data.race
                ? data.race === "Human" && data.raceVariant === "variant"
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
          </div>
        </section>

        <section>
          <SectionHeader icon={<Scroll size={14} weight="bold" className="text-ink" />}>{t("origin.sectionBackground", "Background")}</SectionHeader>
          <PickRow
            label={`${t("form.background", "Background")} *`}
            title={data.background || t("origin.chooseBackground", "Pilih Latar Belakang")}
            subtitle={selectedBackground ? backgroundStatLine(selectedBackground, t) : t("origin.backgroundExamples", "Acolyte, Soldier, Sage...")}
            icon={<Scroll className="h-6 w-6" />}
            chosen={!!data.background}
            onClick={() => setBackgroundModalOpen(true)}
          />
        </section>

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
          onClose={() => setBackgroundModalOpen(false)}
          onConfirm={(bg) => {
            if (bg !== data.background) onChange(applyBackground(data, bg));
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
