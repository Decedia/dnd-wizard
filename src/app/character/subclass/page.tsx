"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getCharacter, saveCharacter, computeDerivedStats, type Character } from "@/lib/storage";
import { useLanguage } from "@/contexts/LanguageContext";
import { LevelUpWizard } from "@/components/LevelUpWizard";
import { applySubclassRebuild, subclassLevelOf, subclassRewind } from "@/lib/rebuild";

/** Picking the subclass again: the level-up wizard from the subclass level, subclass screens only. */
function SubclassPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, language } = useLanguage();
  const id = searchParams.get("id") ?? "";
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const loaded = id ? (await getCharacter(id)) ?? null : null;
      if (!cancelled && loaded) setCharacter({ ...loaded, ...computeDerivedStats(loaded) });
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const rewound = useMemo(() => (character ? subclassRewind(character) : null), [character]);
  const back = () => router.replace(`/character?id=${character?.id || id}`);

  if (loading || !character || !rewound) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-ink-muted font-semibold text-sm">{loading ? t("common.loading") : t("common.noData", "Character not found.")}</div>
      </div>
    );
  }

  const level = character.level || 1;
  return (
    <LevelUpWizard
      character={rewound}
      onCancel={back}
      onComplete={async (result) => {
        await saveCharacter(applySubclassRebuild(character, result, language));
        back();
      }}
      minLevel={level}
      maxLevel={level}
      initialLevel={level}
      startFromLevelOne={subclassLevelOf(character) === 1}
      title={t("rebuild.subclassTitle", "Change subclass")}
      subclassOnly
      suggestAll
    />
  );
}

export default function SubclassPageShell() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper flex items-center justify-center"><span className="text-ink-muted font-semibold text-sm">{t("common.loading")}</span></div>}>
      <SubclassPage />
    </Suspense>
  );
}
