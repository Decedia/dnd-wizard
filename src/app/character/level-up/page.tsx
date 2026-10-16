"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getCharacter, saveCharacter, computeDerivedStats, type Character } from "@/lib/storage";
import { useLanguage } from "@/contexts/LanguageContext";
import { LevelUpWizard } from "@/components/LevelUpWizard";

export function LevelUpPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLanguage();
  const id = searchParams.get("id") ?? "";

  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window !== "undefined" && id) {
        const loaded = await getCharacter(id) ?? null;
        if (!cancelled && loaded) {
          setCharacter({ ...loaded, ...computeDerivedStats(loaded) });
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleComplete = async (updated: Character) => {
    await saveCharacter(updated);
    router.replace(`/character?id=${updated.id}`);
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
