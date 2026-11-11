"use client";

import { useEffect, useRef, useState } from "react";
import { Sword, Check } from "@phosphor-icons/react";
import { CLASS_ICONS } from "@/components/modals/UnifiedSelectionModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { castsSpells } from "@/lib/storage";
import { QUICK_LEVEL } from "@/lib/quick-create";
import type { Character } from "@/lib/storage";

interface Props {
  character: Character;
  /** The character is saved; the animation may end. */
  ready: boolean;
  onDone: () => void;
}

/** The "creating your character" screen of quick create: steps tick off while the level counts up. */
export function QuickBuildAnimation({ character, ready, onDone }: Props) {
  const { t } = useLanguage();
  const Icon = CLASS_ICONS[character.class] || Sword;
  const steps: { text: string; level?: number }[] = [
    { text: t("quick.step.stats", "Setting ability scores") },
    { text: t("quick.step.race", { race: character.race }, "Race: {race}") },
    { text: t("quick.step.background", { background: character.background }, "Background: {background}") },
    ...Array.from({ length: QUICK_LEVEL }, (_, i) => ({
      text: i + 1 === QUICK_LEVEL && character.subclass
        ? t("quick.step.levelSub", { level: i + 1, subclass: character.subclass }, "Level {level}: {subclass}")
        : t("quick.step.level", { level: i + 1 }, "Level {level}: new features"),
      level: i + 1,
    })),
    {
      text: castsSpells(character)
        ? t("quick.step.spells", "Picking spells and options")
        : t("quick.step.options", "Picking options"),
    },
    { text: t("quick.step.gear", "Packing and equipping gear") },
  ];
  const [shown, setShown] = useState(0);
  const doneRef = useRef(false);
  const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (shown < steps.length) {
      const timer = setTimeout(() => setShown((n) => n + 1), reduced ? 80 : 380);
      return () => clearTimeout(timer);
    }
    if (ready && !doneRef.current) {
      doneRef.current = true;
      const timer = setTimeout(onDone, reduced ? 100 : 650);
      return () => clearTimeout(timer);
    }
  }, [shown, steps.length, ready, onDone, reduced]);

  const finished = shown >= steps.length && ready;
  const level = steps.slice(0, shown).reduce((lvl, s) => s.level ?? lvl, 0);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-7 bg-paper px-6 py-10 text-center" role="status" aria-live="polite">
      <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-[3px] border-ink text-ink">
        <span
          aria-hidden="true"
          className={`absolute -inset-2.5 rounded-full border-[3px] ${finished ? "border-ink" : "border-dashed border-ink-subtle motion-safe:animate-[spin_3s_linear_infinite]"}`}
        />
        <Icon className="h-12 w-12" />
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">
          {finished ? t("quick.ready", "Ready to play") : t("quick.creating", "Creating")}
        </p>
        <h1 className="mt-0.5 text-2xl font-black tracking-tight text-ink">{character.name}</h1>
        <span key={level} className="mt-2 inline-block rounded-full border-2 border-ink px-3 py-0.5 text-[11px] font-black uppercase tracking-widest text-ink motion-safe:animate-[pulse_0.4s_ease-out_1]">
          {t("quick.levelBadge", { level }, "Level {level}")}
        </span>
      </div>
      <ol className="flex w-full max-w-xs flex-col gap-2 text-left">
        {steps.map((s, i) => {
          const state = i < shown - 1 || (i === shown - 1 && (i < steps.length - 1 || ready)) ? "done" : i === shown - 1 ? "now" : "todo";
          return (
            <li key={i} className={`flex items-center gap-2.5 text-sm transition-colors ${state === "todo" ? "text-ink-subtle" : "text-ink"}`}>
              <span className="flex h-4 w-4 shrink-0 items-center justify-center">
                {state === "done" ? <Check size={14} weight="bold" /> : state === "now" ? <span className="h-1.5 w-1.5 rounded-full bg-ink" /> : null}
              </span>
              <span className={state === "now" ? "font-bold" : "font-medium"}>{s.text}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
