"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getCharacter, saveCharacter, computeDerivedStats, type Character } from "@/lib/storage";
import { useLanguage } from "@/contexts/LanguageContext";
import { LevelUpWizard } from "@/components/LevelUpWizard";
import { useSRD } from "@/contexts/SRDContext";
import { withLevelSnapshot } from "@/lib/level-snapshot";
import { cloneStart, finishClone, type CloneStart } from "@/lib/clone";

export function LevelUpPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const id = searchParams.get("id") ?? "";
  // ?clone=1: a copy of this hero back at level 1, levelled up again with the old picks filled in.
  const isClone = searchParams.get("clone") === "1";
  const [clone, setClone] = useState<CloneStart | null>(null);

  const [character, setCharacter] = useState<Character | null>(null);
  const { setRuleset: setSrdRuleset } = useSRD();
  // The shared SRD data (spell cards, level-up pickers) follows the open character's rule set.
  const characterRuleset = character?.ruleset === "2024" ? "2024" : "2014";
  useEffect(() => { setSrdRuleset(characterRuleset); }, [characterRuleset, setSrdRuleset]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window !== "undefined" && id) {
        const loaded = await getCharacter(id) ?? null;
        if (!cancelled && loaded) {
          const derived = { ...loaded, ...computeDerivedStats(loaded) };
          setCharacter(derived);
          if (isClone) setClone(cloneStart(derived, language));
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
    // The clone is worked out once, from the hero as loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isClone]);

  const handleComplete = async (updated: Character) => {
    // The character from before, so the sheet can undo this level-up.
    await saveCharacter(character ? withLevelSnapshot(character, updated) : updated);
    router.replace(`/character?id=${updated.id}`);
  };

  const handleCloneComplete = async (leveled: Character) => {
    const copy = finishClone(leveled, t("clone.name", { name: character?.name || "" }, "{name} (copy)"));
    await saveCharacter(copy);
    router.replace(`/character?id=${copy.id}`);
  };

  const handleCancel = () => {
    router.replace(`/character?id=${character?.id || id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-ink-muted font-semibold text-sm">{t("common.loading")}</div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-ink-muted font-semibold text-sm">{t("common.noData", "Character not found.")}</div>
      </div>
    );
  }

  if (isClone && clone) {
    return (
      <LevelUpWizard
        character={clone.base}
        prefill={clone.prefill}
        minLevel={clone.level}
        maxLevel={clone.level}
        initialLevel={clone.level}
        subtitle={t("clone.subtitle", { name: character.name || "" }, "Copy of {name}: the old picks are filled in, change any you like.")}
        onCancel={handleCancel}
        onComplete={handleCloneComplete}
      />
    );
  }

  return <LevelUpWizard character={character} onCancel={handleCancel} onComplete={handleComplete} />;
}

export default function LevelUpPageShell() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <span className="text-ink-muted font-semibold text-sm">{t("common.loading")}</span>
      </div>
    }>
      <LevelUpPage />
    </Suspense>
  );
}
