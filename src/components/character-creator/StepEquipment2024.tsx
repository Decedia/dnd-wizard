"use client";

import { Backpack, Coins } from "@phosphor-icons/react";
import type { Character } from "@/lib/storage";
import { useLanguage } from "@/contexts/LanguageContext";
import { findLocalizedItem } from "@/data/item-catalog";
import { backgroundGearLabel } from "@/lib/inventory";
import { gearPackages, pickGearPatch, pickedGear, type GearKind } from "@/lib/origin-2024";
import type { GearPackage } from "@/data/starting-gear-2024";

/** One package card: its items and gold, or gold only. */
function PackageCard({ pkg, picked, onPick }: { pkg: GearPackage; picked: boolean; onPick: () => void }) {
  const { t, language } = useLanguage();
  const goldOnly = pkg.items.length === 0;
  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={picked}
      className={`flex w-full gap-3 rounded-2xl border-2 bg-surface p-4 text-left transition active:scale-[0.98] ${picked ? "border-ink" : "border-border-strong hover:border-ink/40"}`}
    >
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black ${picked ? "bg-ink text-surface" : "bg-ink/10 text-ink"}`}>{pkg.letter}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
          {goldOnly ? <Coins size={16} weight="bold" /> : <Backpack size={16} weight="bold" />}
          {goldOnly ? t("gear2024.goldOnly", { gold: pkg.gold }, "{gold} GP to buy your own gear") : t("gear2024.package", "Gear package")}
        </span>
        {!goldOnly && (
          <span className="mt-1.5 flex flex-wrap gap-1.5">
            {pkg.items.map((line, i) => (
              <span key={i} className="rounded-full border border-border-strong px-2 py-0.5 text-[11px] font-semibold text-ink">
                {backgroundGearLabel(line, (id) => findLocalizedItem(id, language)?.name ?? id)}
              </span>
            ))}
            {pkg.gold > 0 && <span className="rounded-full border border-border-strong px-2 py-0.5 text-[11px] font-semibold text-ink">{pkg.gold} GP</span>}
          </span>
        )}
      </span>
    </button>
  );
}

function GearSection({ data, onChange, kind }: { data: Character; onChange: (patch: Partial<Character>) => void; kind: GearKind }) {
  const { t } = useLanguage();
  const name = kind === "class" ? data.class : data.background;
  const packages = gearPackages(kind, name);
  if (packages.length === 0) return null;
  const picked = pickedGear(data, kind);
  return (
    <section>
      <h3 className="mb-1 text-xs font-bold uppercase tracking-widest text-ink">
        {kind === "class" ? t("gear2024.fromClass", { name }, "From your class ({name})") : t("gear2024.fromBackground", { name }, "From your background ({name})")}
      </h3>
      <p className="mb-3 text-xs text-ink-muted">{t("gear2024.pickOne", "Pick one.")}</p>
      <div className="space-y-2">
        {packages.map((pkg) => (
          <PackageCard key={pkg.letter} pkg={pkg} picked={picked === pkg.letter} onPick={() => onChange(pickGearPatch(data, kind, pkg.letter))} />
        ))}
      </div>
    </section>
  );
}

/** 2024 starting gear: the class package and the background package, each with a gold-only choice. */
export function StepEquipment2024({ data, onChange }: { data: Character; onChange: (patch: Partial<Character>) => void }) {
  const { t } = useLanguage();
  return (
    <section className="w-full">
      <div className="mb-6">
        <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">{t("origin.kicker", "Gameplay")}</p>
        <h1 className="text-2xl font-black tracking-tight text-ink">{t("gear2024.title", "Starting gear")}</h1>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">
          {t("gear2024.hint", "Take a ready package, or gold to shop for your own. New players: the package has everything you need.")}
        </p>
      </div>
      <div className="space-y-6">
        <GearSection data={data} onChange={onChange} kind="class" />
        <GearSection data={data} onChange={onChange} kind="background" />
      </div>
    </section>
  );
}
