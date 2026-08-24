"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCharacter, saveCharacter, computeDerivedStats, type Character } from "@/lib/storage";
import { LevelUpWizard } from "@/components/LevelUpWizard";

export default function LevelUpPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [character] = useState<Character | null>(() => {
    if (typeof window === "undefined" || !id) return null;
    const loaded = getCharacter(id) ?? null;
    return loaded ? { ...loaded, ...computeDerivedStats(loaded) } : null;
  });

  if (!character) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <div className="text-parchment/60">Character not found.</div>
      </div>
    );
  }

  const handleComplete = (updated: Character) => {
    saveCharacter(updated);
    router.replace(`/character/${updated.id}`);
  };

  const handleCancel = () => {
    router.replace(`/character/${character.id}`);
  };

  return <LevelUpWizard character={character} onCancel={handleCancel} onComplete={handleComplete} />;
}
