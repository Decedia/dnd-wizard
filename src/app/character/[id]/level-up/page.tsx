"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCharacter, saveCharacter, computeDerivedStats, type Character } from "@/lib/storage";
import { LevelUpWizard } from "@/components/LevelUpWizard";

export default function LevelUpPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

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
    router.replace(`/character/${updated.id}`);
  };

  const handleCancel = () => {
    router.replace(`/character/${character?.id || id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-ink-muted font-semibold text-sm">Loading...</div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <div className="text-ink-muted font-semibold text-sm">Character not found.</div>
      </div>
    );
  }

  return <LevelUpWizard character={character} onCancel={handleCancel} onComplete={handleComplete} />;
}
