"use client";

import { useState } from "react";
import { Star } from "@phosphor-icons/react";
import { activeRaceChoices, getStaticFeat, getStaticRace } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";
import { useLanguage } from "@/contexts/LanguageContext";
import { FeatSelectionModal } from "../modals/FeatSelectionModal";
import { getFeatOptionGroups } from "@/data/feat-options";
import { BACKGROUND_TOOL_KEY, getBackground2024, originFeatComplete, originFeatPatch, originFeats, type OriginFeat } from "@/lib/origin-2024";
import { PickRow } from "./StepOrigin";

/** The four gaming sets of the 2024 equipment list (the Soldier picks one). */
export const GAMING_SETS_2024 = ["Dice Set", "Dragonchess Set", "Playing Card Set", "Three-Dragon Ante Set"];

/** A labelled row of pill buttons for one small pick. */
function PillPick({ label, hint, options, value, onPick }: { label: string; hint?: string; options: { id: string; name: string }[]; value?: string; onPick: (id: string) => void }) {
  return (
    <div className={`rounded-2xl border-2 bg-surface p-4 ${value ? "border-border-strong" : "border-warning-400"}`}>
      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">{label} *</p>
      {hint && <p className="mt-0.5 text-xs leading-relaxed text-ink-muted">{hint}</p>}
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button key={o.id} type="button" onClick={() => onPick(o.id)} className={`btn ${value === o.id ? "btn-primary" : "btn-secondary"}`}>
            {o.name}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Species questions after the lineage: the spellcasting ability for its spells, and Small or Medium. */
export function SpeciesPicks2024({ data, onChange }: { data: Character; onChange: (patch: Partial<Character>) => void }) {
  const { t } = useLanguage();
  const species = data.race ? getStaticRace(data.race, "2024") : undefined;
  const choices = activeRaceChoices(species?.choices, data.raceChoices).filter((c) => !c.id.endsWith("-2024-lineage"));
  if (choices.length === 0) return null;
  return (
    <div className="space-y-3">
      {choices.map((c) => (
        <PillPick
          key={c.id}
          label={t(`origin.speciesPick.${c.id.replace(/^.*-2024-/, "")}`, c.name)}
          hint={c.description}
          options={c.options || []}
          value={data.raceChoices?.[c.id]}
          onPick={(id) => onChange({ raceChoices: { ...data.raceChoices, [c.id]: id } })}
        />
      ))}
    </div>
  );
}

/** The Soldier's gaming set, and later any other tool a 2024 background lets the player pick. */
export function BackgroundToolPick2024({ data, onChange }: { data: Character; onChange: (patch: Partial<Character>) => void }) {
  const { t } = useLanguage();
  const bg = getBackground2024(data.background);
  if (!bg?.toolChoice) return null;
  return (
    <PillPick
      label={t("origin.gamingSet", "Gaming set")}
      hint={t("origin.gamingSetHint", "You are trained with one kind of gaming set.")}
      options={GAMING_SETS_2024.map((name) => ({ id: name, name }))}
      value={data.featureSelections?.[BACKGROUND_TOOL_KEY]?.[0]}
      onPick={(name) => onChange({ featureSelections: { ...data.featureSelections, [BACKGROUND_TOOL_KEY]: [name] } })}
    />
  );
}

function featSubtitle(feat: OriginFeat, t: ReturnType<typeof useLanguage>["t"]): string {
  if (!feat.name) return t("origin.versatileHint", "Humans pick one more starting feat. Skilled is a good first pick.");
  const groups = getFeatOptionGroups(feat.name, "2024");
  const picks = groups.map((g) => {
    const v = feat.options[g.id];
    return g.choices?.find((c) => c.value === v)?.label ?? v;
  }).filter(Boolean);
  if (originFeatComplete(feat)) return picks.join(", ") || t("origin.featNoPicks", "Nothing to pick");
  return t("origin.featPicksLeft", { count: groups.filter((g) => !feat.options[g.id]).length }, "{count} picks left");
}

/** The Origin feats: the background's (set, with its own picks) and a Human's Versatile choice. */
export function OriginFeats2024({ data, onChange }: { data: Character; onChange: (patch: Partial<Character>) => void }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState<OriginFeat | null>(null);
  const feats = originFeats(data);
  if (feats.length === 0) return null;
  return (
    <div className="space-y-3">
      {feats.map((feat) => (
        <PickRow
          key={feat.key}
          label={feat.source === "background"
            ? t("origin.featFromBackground", { background: data.background }, "Feat from {background}")
            : t("origin.featFromSpecies", "Feat from Versatile (Human)")}
          title={feat.name || t("origin.chooseFeat", "Choose a feat")}
          subtitle={featSubtitle(feat, t)}
          icon={<Star className="h-6 w-6" />}
          chosen={originFeatComplete(feat)}
          onClick={() => setOpen(feat)}
        />
      ))}
      {open && (
        <FeatSelectionModal
          ruleset="2024"
          category="Origin"
          onlyFeat={open.source === "background" ? open.name : undefined}
          selectedFeat={open.name || undefined}
          fixedOptions={open.fixed}
          initialOptions={open.options}
          disabledFeats={feats.filter((f) => f.key !== open.key && f.name && !getStaticFeat(f.name, "2024")?.repeatable).map((f) => f.name)}
          character={data}
          sources={[]}
          onClose={() => setOpen(null)}
          onSelect={(feat, options) => onChange(originFeatPatch(data, open, feat.name, options || {}))}
        />
      )}
    </div>
  );
}
