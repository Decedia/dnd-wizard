"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getCharacter, saveCharacter, computeDerivedStats, type Character } from "@/lib/storage";
import { useLanguage } from "@/contexts/LanguageContext";
import { LevelUpWizard } from "@/components/LevelUpWizard";
import { ABILITY_KEYS, changeLevelPicks, choicesOf, isUnknownAsi, levelRewind, type AbilityKey, type AsiPick, type LevelPicks } from "@/lib/level-choices";

/**
 * An ability increase from before the app kept a log: which abilities it
 * raised, so it can be taken off before the player picks again.
 */
function OldAsiQuestion({ level, onAnswer, onCancel }: { level: number; onAnswer: (asi: AsiPick) => void; onCancel: () => void }) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<"single" | "double">("single");
  const [picked, setPicked] = useState<AbilityKey[]>([]);
  const need = mode === "single" ? 1 : 2;
  const toggle = (k: AbilityKey) =>
    setPicked((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : need === 1 ? [k] : prev.length < 2 ? [...prev, k] : prev));
  const done = picked.length === need;
  const pill = (active: boolean) => `btn ${active ? "btn-primary" : "btn-secondary"} flex-1 px-3 py-2 text-sm`;

  return (
    <div className="min-h-screen bg-paper px-4 py-6">
      <div className="mx-auto max-w-lg space-y-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{t("choices.oldAsiTitle", { level }, "Level {level}: which abilities went up?")}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            {t("choices.oldAsiHint", "This level-up happened before the app kept a record of picks. Tell it what you took, so it can take that off before you choose again.")}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" aria-pressed={mode === "single"} onClick={() => { setMode("single"); setPicked([]); }} className={pill(mode === "single")}>
            {t("choices.oldAsiSingle", "+2 to one")}
          </button>
          <button type="button" aria-pressed={mode === "double"} onClick={() => { setMode("double"); setPicked([]); }} className={pill(mode === "double")}>
            {t("choices.oldAsiDouble", "+1 to two")}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {ABILITY_KEYS.map((k) => (
            <button key={k} type="button" aria-pressed={picked.includes(k)} onClick={() => toggle(k)} className={pill(picked.includes(k))}>
              {k.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onCancel} className="btn btn-secondary flex-1">{t("common.cancel", "Cancel")}</button>
          <button
            type="button"
            disabled={!done}
            onClick={() => onAnswer(mode === "single" ? { mode, single: picked[0] } : { mode, d1: picked[0], d2: picked[1] })}
            className="btn btn-primary flex-1 disabled:opacity-40"
          >
            {t("choices.oldAsiNext", "Next")}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Picking one past level again: the level-up wizard for that level only, HP left alone. */
function ChoicesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const id = searchParams.get("id") ?? "";
  const level = Number(searchParams.get("level") ?? "0");
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [oldAsi, setOldAsi] = useState<AsiPick | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = id ? (await getCharacter(id)) ?? null : null;
      if (!cancelled && loaded) setCharacter({ ...loaded, ...computeDerivedStats(loaded) });
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const back = () => router.replace(`/character?id=${character?.id || id}`);
  const recorded = useMemo(() => (character ? choicesOf(character)[level] : undefined), [character, level]);
  // The picks as they are now, with an old ability increase answered.
  const picks = useMemo<LevelPicks | undefined>(() => {
    if (!recorded) return undefined;
    return isUnknownAsi(recorded.asi) ? (oldAsi ? { ...recorded, asi: oldAsi } : undefined) : recorded;
  }, [recorded, oldAsi]);
  const rewound = useMemo(() => (character && picks ? levelRewind(character, level, picks) : null), [character, picks, level]);

  if (loading || !character || !recorded || level < 1 || level > (character.level || 1)) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-ink-muted font-semibold text-sm">{loading ? t("common.loading") : t("common.noData", "Character not found.")}</div>
      </div>
    );
  }
  if (!picks || !rewound) return <OldAsiQuestion level={level} onAnswer={setOldAsi} onCancel={back} />;

  return (
    <LevelUpWizard
      character={rewound}
      onCancel={back}
      onComplete={async (result) => {
        const fresh = result.levelChoices?.[level] ?? {};
        await saveCharacter(changeLevelPicks(character, level, picks, fresh, language));
        back();
      }}
      minLevel={level}
      maxLevel={level}
      initialLevel={level}
      startFromLevelOne={level === 1}
      title={t("choices.wizardTitle", { level }, "Change level {level} picks")}
      redo={picks}
      suggestAll
    />
  );
}

export default function ChoicesPageShell() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper flex items-center justify-center"><span className="text-ink-muted font-semibold text-sm">{t("common.loading")}</span></div>}>
      <ChoicesPage />
    </Suspense>
  );
}
