"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sword, Users, Scroll, DiceFive, Info } from "@phosphor-icons/react";
import { AppHeader } from "@/components/AppHeader";
import { WizardNav, WIZARD_NAV_SPACE } from "@/components/WizardNav";
import { LevelUpWizard } from "@/components/LevelUpWizard";
import { PickRow } from "@/components/character-creator/StepOrigin";
import { RaceSelectionModal } from "@/components/modals/RaceSelectionModal";
import { BackgroundSelectionModal, backgroundStatLine } from "@/components/modals/BackgroundSelectionModal";
import { CLASS_ICONS } from "@/components/modals/UnifiedSelectionModal";
import { RACE_ICONS } from "@/components/race-icons";
import { QuickBuildAnimation } from "@/components/character-creator/QuickBuildAnimation";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStaticClasses, getStaticSubclasses } from "@/lib/srd-client";
import { applyBackground, finalizeCreation, racePatch, type Character } from "@/lib/character-creation";
import { QUICK_LEVEL, QUICK_ORIGINS, QUICK_SOURCES, completeQuickDraft, setQuickSubclass, startQuickDraft } from "@/lib/quick-create";
import { SUBCLASS_PICKS } from "@/lib/level-up-picks";
import { randomName } from "@/lib/random-name";
import { randomLook, type LookField } from "@/lib/random-look";
import { alignmentOptions, getBackgroundData } from "@/data/backgrounds";

const ALIGNMENT_CODES = ["LG", "NG", "CG", "LN", "N", "CN", "LE", "NE", "CE"];
const TRAITS = [
  { field: "personalityTrait1", list: "personalityTraits", key: "creator.personalityTrait", fallback: "Personality trait" },
  { field: "ideal", list: "ideals", key: "creator.ideal", fallback: "Ideal" },
  { field: "bond", list: "bonds", key: "creator.bond", fallback: "Bond" },
  { field: "flaw", list: "flaws", key: "creator.flaw", fallback: "Flaw" },
] as const;
type TraitField = (typeof TRAITS)[number]["field"];
const LOOK_FIELDS: { id: LookField; key: string; fallback: string }[] = [
  { id: "age", key: "look.age", fallback: "Age" },
  { id: "height", key: "form.height", fallback: "Height" },
  { id: "weight", key: "form.weight", fallback: "Weight" },
  { id: "eyes", key: "form.eyes", fallback: "Eyes" },
  { id: "hair", key: "form.hair", fallback: "Hair" },
  { id: "skin", key: "form.skin", fallback: "Skin" },
];
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

const inputClass =
  "h-11 w-full min-w-0 rounded-xl border-2 border-border-strong bg-surface px-3 text-sm font-semibold text-ink placeholder:font-normal placeholder:text-ink-subtle outline-none transition-colors focus:border-ink";
const labelClass = "text-[10px] font-bold uppercase tracking-wider text-ink-muted";

function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="text-xs font-bold uppercase tracking-widest text-ink">{children}</h2>
      {aside}
    </div>
  );
}

export default function QuickCreate() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [draft, setDraft] = useState<Character>(() => startQuickDraft("Fighter", "Champion"));
  const [name, setName] = useState("");
  const [traits, setTraits] = useState<Record<TraitField, string>>({ personalityTrait1: "", ideal: "", bond: "", flaw: "" });
  const [look, setLook] = useState<Record<LookField, string>>({ age: "", height: "", weight: "", eyes: "", hair: "", skin: "" });
  const [raceOpen, setRaceOpen] = useState(false);
  const [backgroundOpen, setBackgroundOpen] = useState(false);
  const [built, setBuilt] = useState<{ base: Character; stuck: boolean } | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  const classes = useMemo(() => getStaticClasses(QUICK_SOURCES, "2014", language).filter((c) => QUICK_ORIGINS[c.name]), [language]);
  const subclasses = useMemo(() => {
    const list = getStaticSubclasses(draft.class, QUICK_SOURCES, "2014", language).filter((s) => s.name);
    const order = (SUBCLASS_PICKS[draft.class] || []).map((p) => p.name);
    const rank = (n: string) => (order.indexOf(n) < 0 ? order.length : order.indexOf(n));
    return [...list].sort((a, b) => rank(a.name) - rank(b.name));
  }, [draft.class, language]);
  const popular = new Set((SUBCLASS_PICKS[draft.class] || []).slice(0, 2).map((p) => p.name));
  const background = getBackgroundData(draft.background);

  const chooseClass = (className: string) => {
    const first = (SUBCLASS_PICKS[className] || [])[0]?.name || getStaticSubclasses(className, QUICK_SOURCES, "2014")[0]?.name || "";
    setDraft(startQuickDraft(className, first));
  };
  const rollTraits = (only?: TraitField) => {
    if (!background) return;
    setTraits((prev) => {
      const next = { ...prev };
      for (const tr of TRAITS) if (!only || only === tr.field) next[tr.field] = pick(background[tr.list]) || "";
      return next;
    });
  };
  const rollLook = () => setLook(randomLook(draft.race, language));

  const create = () => {
    // Anything left empty is rolled, so the sheet never opens half blank.
    const rolledLook = randomLook(draft.race, language);
    const filledTraits = { ...traits };
    for (const tr of TRAITS) if (!filledTraits[tr.field].trim() && background) filledTraits[tr.field] = pick(background[tr.list]) || "";
    const base = completeQuickDraft(
      draft,
      {
        name: name.trim() || randomName(draft.race, draft.class),
        alignment: draft.alignment,
        ...filledTraits,
        appearance: Object.fromEntries(LOOK_FIELDS.map((f) => [f.id, look[f.id].trim() || rolledLook[f.id]])),
      },
      language
    );
    setBuilt({ base, stuck: false });
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  };

  if (built) {
    return (
      <LevelUpWizard
        character={built.base}
        startFromLevelOne
        minLevel={1}
        maxLevel={QUICK_LEVEL}
        initialLevel={QUICK_LEVEL}
        title={t("quick.title", "Quick create")}
        auto
        autoView={
          <QuickBuildAnimation
            character={built.base}
            ready={!!doneId}
            onDone={() => doneId && router.replace(`/character?id=${doneId}`)}
          />
        }
        onAutoStuck={() => setBuilt({ ...built, stuck: true })}
        onCancel={() => setBuilt(null)}
        onComplete={async (updated) => {
          // Prepared list built fresh: one spell per spell level in turn, most popular first,
          // instead of every level-1 pick before any level-2 one.
          const final = await finalizeCreation({ ...updated, preparedSpells: [] }, language);
          if (built.stuck) router.replace(`/character?id=${final.id}`);
          else setDoneId(final.id);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader title={t("quick.title", "Quick create")} />
      <main className="px-4 py-5" style={{ paddingBottom: WIZARD_NAV_SPACE }}>
        <div className="mx-auto max-w-lg space-y-7">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">{t("quick.kicker", "Quick create · Level 3")}</p>
            <h1 className="text-2xl font-black tracking-tight text-ink">{t("quick.heading", "Make a character fast")}</h1>
            <p className="mt-1 text-sm leading-relaxed text-ink-muted">
              {t("quick.intro", "Pick a class and subclass. Everything else uses the most popular picks. Leave any box empty and it gets rolled for you.")}
            </p>
          </div>

          <section>
            <SectionTitle>{t("form.class", "Class")}</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {classes.map((c) => {
                const Icon = CLASS_ICONS[c.name] || Sword;
                const on = draft.class === c.name;
                return (
                  <button
                    key={c.name}
                    type="button"
                    aria-pressed={on}
                    onClick={() => chooseClass(c.name)}
                    className={`flex h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 transition active:scale-[0.98] ${on ? "border-ink bg-ink text-surface" : "border-border-strong bg-surface text-ink"}`}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-bold">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <SectionTitle>{t("quick.subclass", "Subclass")}</SectionTitle>
            <div className="grid grid-cols-2 gap-2">
              {subclasses.map((s) => {
                const on = draft.subclass === s.name;
                return (
                  <button
                    key={s.index || s.name}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setDraft((d) => setQuickSubclass(d, s.name))}
                    className={`flex min-h-[56px] flex-col items-start justify-center gap-0.5 rounded-2xl border-2 px-3 py-2 text-left transition active:scale-[0.98] ${on ? "border-ink bg-ink text-surface" : "border-border-strong bg-surface text-ink"}`}
                  >
                    <span className="text-sm font-bold leading-tight">{s.name}</span>
                    {popular.has(s.name) && (
                      <span className={`text-[9px] font-black uppercase tracking-widest ${on ? "text-surface/80" : "text-ink-muted"}`}>{t("quick.popular", "Popular")}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <SectionTitle>{t("quick.origin", "Race and background")}</SectionTitle>
            <div className="space-y-3">
              <PickRow
                label={t("form.race", "Race")}
                title={draft.race === "Human" && draft.raceVariant === "variant" ? t("origin.variantHuman", "Variant Human") : draft.race}
                subtitle={t("quick.changeHint", "Picked for this class. Tap to change.")}
                icon={(() => { const Icon = RACE_ICONS[draft.race] || Users; return <Icon className="h-6 w-6" />; })()}
                chosen
                onClick={() => setRaceOpen(true)}
              />
              <PickRow
                label={t("form.background", "Background")}
                title={draft.background}
                subtitle={background ? backgroundStatLine(background, t) : ""}
                icon={<Scroll className="h-6 w-6" />}
                chosen
                onClick={() => setBackgroundOpen(true)}
              />
            </div>
            <div className="mt-3 flex gap-3 rounded-2xl border border-ink/20 bg-ink/10 p-4">
              <Info size={18} weight="bold" className="mt-0.5 shrink-0 text-ink" />
              <p className="text-xs leading-relaxed text-ink/80">
                {t("quick.pickedForYou", "Also picked for you: standard array stats, average HP, the class's usual skills, starting gear (equipped), and the suggested spells and options for each level. Change anything later on the sheet.")}
              </p>
            </div>
          </section>

          <section>
            <SectionTitle>{t("quick.name", "Character name")}</SectionTitle>
            <div className="flex gap-2">
              <input
                id="quick-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("quick.namePlaceholder", "Leave empty for a random name")}
                className={inputClass}
              />
              <button type="button" aria-label={t("origin.randomName", "Random name")} onClick={() => setName(randomName(draft.race, draft.class))} className="btn btn-secondary inline-flex h-11 w-11 shrink-0 items-center justify-center p-0">
                <DiceFive size={18} weight="bold" />
              </button>
            </div>
          </section>

          <section>
            <SectionTitle
              aside={
                <button type="button" onClick={() => rollTraits()} className="btn btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs">
                  <DiceFive size={14} weight="bold" />
                  {t("personality.rollAll", "Roll all")}
                </button>
              }
            >
              {t("personality.title", "Personality")}
            </SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {alignmentOptions.map((alignment, idx) => {
                const on = draft.alignment === alignment;
                return (
                  <button
                    key={alignment}
                    type="button"
                    aria-pressed={on}
                    aria-label={alignment}
                    onClick={() => setDraft((d) => ({ ...d, alignment }))}
                    className={`flex h-12 flex-col items-center justify-center rounded-xl border-2 transition active:scale-[0.98] ${on ? "border-ink bg-ink text-surface" : "border-border-strong bg-surface text-ink"}`}
                  >
                    <span className="text-sm font-black">{ALIGNMENT_CODES[idx]}</span>
                    <span className={`text-[9px] font-semibold leading-tight ${on ? "text-surface/80" : "text-ink-muted"}`}>{alignment}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 space-y-3">
              {TRAITS.map((tr) => (
                <div key={tr.field} className="flex flex-col gap-1.5">
                  <label htmlFor={`quick-${tr.field}`} className={labelClass}>{t(tr.key, tr.fallback)}</label>
                  <div className="flex gap-2">
                    <textarea
                      id={`quick-${tr.field}`}
                      rows={2}
                      value={traits[tr.field]}
                      onChange={(e) => setTraits((prev) => ({ ...prev, [tr.field]: e.target.value }))}
                      placeholder={t("quick.rollPlaceholder", "Leave empty to roll one")}
                      className={`${inputClass} h-auto py-2 leading-snug`}
                    />
                    <button type="button" aria-label={t("quick.roll", "Roll")} onClick={() => rollTraits(tr.field)} className="btn btn-secondary inline-flex h-11 w-11 shrink-0 items-center justify-center self-start p-0">
                      <DiceFive size={18} weight="bold" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle
              aside={
                <button type="button" onClick={rollLook} className="btn btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-xs">
                  <DiceFive size={14} weight="bold" />
                  {t("quick.rollLook", "Roll look")}
                </button>
              }
            >
              {t("look.appearance", "Appearance")}
            </SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {LOOK_FIELDS.map((f) => (
                <div key={f.id} className="flex min-w-0 flex-col gap-1.5">
                  <label htmlFor={`quick-look-${f.id}`} className={labelClass}>{t(f.key, f.fallback)}</label>
                  <input
                    id={`quick-look-${f.id}`}
                    value={look[f.id]}
                    onChange={(e) => setLook((prev) => ({ ...prev, [f.id]: e.target.value }))}
                    placeholder={t("quick.random", "Random")}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <WizardNav
        onBack={() => router.push("/character/create")}
        onNext={create}
        canProceed={!!draft.class && !!draft.subclass}
        nextLabel={t("quick.create", { className: draft.class }, "Create level 3 {className}")}
        showBack
      />

      {raceOpen && (
        <RaceSelectionModal
          isOpen
          onClose={() => setRaceOpen(false)}
          onConfirm={(payload) => {
            setDraft((d) => ({ ...d, ...racePatch(d, payload) }));
            setRaceOpen(false);
          }}
          characterSources={QUICK_SOURCES}
          currentCharacter={draft}
        />
      )}
      {backgroundOpen && (
        <BackgroundSelectionModal
          isOpen
          current={draft.background}
          onClose={() => setBackgroundOpen(false)}
          onConfirm={(bg) => {
            setDraft((d) => ({ ...d, ...applyBackground(d, bg) }));
            setTraits({ personalityTrait1: "", ideal: "", bond: "", flaw: "" });
            setBackgroundOpen(false);
          }}
        />
      )}
    </div>
  );
}
