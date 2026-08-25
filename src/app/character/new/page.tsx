"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createEmptyCharacter, saveCharacter } from "@/lib/storage";

export default function NewCharacter() {
  const router = useRouter();

  useEffect(() => {
    const character = createEmptyCharacter();
    saveCharacter(character);
    router.replace(`/character/${character.id}`);
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-ink">
      <div className="text-paper-muted font-bold">Creating new character...</div>
    </div>
  );
}
