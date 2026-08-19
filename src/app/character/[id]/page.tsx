"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { getCharacter, saveCharacter, deleteCharacter, type Character } from "@/lib/storage";
import { StickyMiniHeader } from "@/components/character-sheet/StickyMiniHeader";
import { SectionNav } from "@/components/character-sheet/SectionNav";
import { CharacterSheetProvider } from "@/components/character-sheet/CharacterSheetContext";
import { IdentitySection } from "@/components/character-sheet/IdentitySection";
import { StatsSection } from "@/components/character-sheet/StatsSection";
import { SkillsSection } from "@/components/character-sheet/SkillsSection";
import { FeaturesTraitsSection } from "@/components/character-sheet/FeaturesTraitsSection";
import { AttacksAndSpellcastingSection } from "@/components/character-sheet/AttacksAndSpellcastingSection";
import { InventorySection } from "@/components/character-sheet/InventorySection";
import { OtherProficienciesSection } from "@/components/character-sheet/OtherProficienciesSection";
import { SpellsSection } from "@/components/character-sheet/SpellsSection";
import { SpellcastingStatsSection } from "@/components/character-sheet/SpellcastingStatsSection";
import { AppearanceBioSection } from "@/components/character-sheet/AppearanceBioSection";
import { LevelUpModal } from "@/components/level-up/LevelUpModal";
import { computeLevelUp, type LevelUpResult } from "@/lib/level-up";
import { getClassData } from "@/data/srd";
import { Trash2, Download, Upload } from "lucide-react";
import { exportCharacterToPdf, importCharacterFromPdf } from "@/lib/pdf";

export default function CharacterView() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [character, setCharacter] = useState<Character | null>(() => {
    if (typeof window !== "undefined" && id) {
      return getCharacter(id) ?? null;
    }
    return null;
  });

  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [spellsCollapsed, setSpellsCollapsed] = useState(true);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [pendingLevelUp, setPendingLevelUp] = useState<LevelUpResult | null>(null);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSave = useCallback(() => {
    clearTimeout(timeoutRef.current ?? undefined);
    timeoutRef.current = setTimeout(() => {
      if (character) {
        saveCharacter(character);
      }
    }, 400);
  }, [character]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current ?? undefined);
  }, []);

  useEffect(() => {
    if (importSuccess) {
      timeoutRef.current = setTimeout(() => setImportSuccess(null), 4000);
      return () => clearTimeout(timeoutRef.current ?? undefined);
    }
  }, [importSuccess]);

  const handleSave = () => {
    if (character) {
      saveCharacter(character);
      setSavedAt(Date.now());
      setTimeout(() => setSavedAt(null), 2000);
    }
  };

  const handleDelete = () => {
    if (character && window.confirm(`Are you sure you want to delete ${character.name || "this character"}? This action cannot be undone.`)) {
      deleteCharacter(character.id);
      router.push("/");
    }
  };

  const handleExport = () => {
    if (character) {
      exportCharacterToPdf(character);
    }
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportSuccess(null);
    try {
      const imported = await importCharacterFromPdf(file);
      saveCharacter(imported);
      setImportSuccess(`Imported "${imported.name || "Unnamed"}" successfully.`);
      router.push(`/character/${imported.id}`);
    } catch (err) {
      setImportError("This PDF doesn't contain DND Wizard character data.");
    } finally {
      e.target.value = "";
    }
  };

  const handleLevelUpClick = () => {
    if (!character || character.level >= 20) return;
    const result = computeLevelUp(character.level, character.level + 1, character.class);
    setPendingLevelUp(result);
    setShowLevelUpModal(true);
  };

  const handleLevelUpConfirm = useCallback((asiChoices: { ability: string; delta: number }[]) => {
    if (!character || !pendingLevelUp) return;

    let newChar = { ...character, level: pendingLevelUp.newLevel };
    for (const choice of asiChoices) {
      const abilityValue = newChar[choice.ability as keyof Character];
      if (typeof abilityValue === "number") {
        newChar = {
          ...newChar,
          [choice.ability]: abilityValue + choice.delta,
        } as Character;
      }
    }

    const { computeDerivedStats } = require("@/lib/storage");
    const derived = computeDerivedStats(newChar);
    const finalChar = { ...newChar, ...derived };

    if (finalChar.class === "Rogue" && pendingLevelUp.newLevel === 6) {
      const currentExpertise = finalChar.expertise || [];
      if (currentExpertise.length < 4) {
        setCharacter(finalChar);
        setShowLevelUpModal(false);
        setPendingLevelUp(null);
        return;
      }
    }

    saveCharacter(finalChar);
    setCharacter(finalChar);
    setShowLevelUpModal(false);
    setPendingLevelUp(null);
  }, [character, pendingLevelUp]);

  const handleExpertiseFromLevelUp = useCallback((selections: string[]) => {
    if (!character) return;
    const updated = { ...character, expertise: selections };
    saveCharacter(updated);
    setCharacter(updated);
    setShowLevelUpModal(false);
    setPendingLevelUp(null);
  }, [character]);

  const handleLevelUpCancel = useCallback(() => {
    setShowLevelUpModal(false);
    setPendingLevelUp(null);
  }, []);

  const handleChange = useCallback((patch: Partial<Character>) => {
    setCharacter((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      const { computeDerivedStats } = require("@/lib/storage");
      const derived = computeDerivedStats(next);
      return { ...next, ...derived };
    });
  }, []);

  if (!character) {
    return (
      <div className="min-h-screen bg-charcoal">
        <AppHeader title="Character" subtitle="Character Sheet" />
        <main className="px-4 py-6 pb-28">
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-parchment/20 bg-charcoal-light/50 py-20 text-center">
            <div className="mb-4 text-5xl opacity-40">🐉</div>
            <h2 className="font-display text-xl font-semibold text-parchment mb-2">
              Character Not Found
            </h2>
            <p className="text-sm text-parchment/50 max-w-xs mb-6">
              This character could not be found. It may have been deleted.
            </p>
            <Link
              href="/"
              className="rounded-lg bg-burgundy px-6 py-3 text-sm font-semibold text-parchment transition-colors hover:bg-burgundy-light"
            >
              Return Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const classData = character.class ? getClassData(character.class) : null;
  const hpGainDescription = pendingLevelUp && classData
    ? `You gained ${pendingLevelUp.hpGain} level${pendingLevelUp.hpGain > 1 ? "s" : ""}. Max HP increased by ${pendingLevelUp.hpGain * classData.hpPerLevel} + ${pendingLevelUp.hpGain} × Constitution modifier.`
    : undefined;

  const needsExpertiseAtLevel6 = character.class === "Rogue" && character.level === 6 && (character.expertise || []).length < 4;
  const expertiseOptionsForLevelUp = needsExpertiseAtLevel6 && character
    ? [
        ...Object.entries(character.skills)
          .filter(([, proficient]) => proficient)
          .map(([name]) => ({ name, isSkill: true })),
        { name: "Thieves' Tools", isSkill: false },
      ]
    : undefined;

  return (
    <div className="min-h-screen bg-charcoal">
      <AppHeader title={character.name || "Character"} subtitle="Character Sheet" />
      <StickyMiniHeader character={character} />
      <SectionNav />

      <CharacterSheetProvider onFieldBlur={debouncedSave}>
        <main className="px-4 py-6 pb-28">
          <div className="mx-auto max-w-lg space-y-4">
            <IdentitySection character={character} onChange={handleChange} />
            <StatsSection character={character} onChange={handleChange} />
            <SkillsSection character={character} onChange={handleChange} />
            <FeaturesTraitsSection character={character} onChange={handleChange} />
            <AttacksAndSpellcastingSection character={character} onChange={handleChange} />
            <InventorySection character={character} onChange={handleChange} />
            <OtherProficienciesSection otherProficiencies={character.otherProficiencies} onChange={(value) => handleChange({ otherProficiencies: value })} />
            <SpellsSection
              character={character}
              onChange={handleChange}
              collapsed={spellsCollapsed}
              onToggleCollapse={() => setSpellsCollapsed((c) => !c)}
            />
            <SpellcastingStatsSection character={character} onChange={handleChange} />
            <AppearanceBioSection character={character} onChange={handleChange} />
          </div>

          <div className="mx-auto max-w-lg mt-6 mb-4 flex items-center gap-3">
            <button
              onClick={handleLevelUpClick}
              disabled={character.level >= 20}
              className="flex-1 rounded-xl border border-gold/30 bg-gold/10 px-6 py-3 text-sm font-semibold text-gold transition-all hover:border-gold/50 hover:bg-gold/20 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
            >
              Level Up
            </button>
            <button
              onClick={handleSave}
              className="flex-1 rounded-xl bg-burgundy px-6 py-3 text-sm font-semibold text-parchment shadow-lg shadow-burgundy/20 transition-all active:scale-[0.98]"
            >
              Save Character
            </button>
            {savedAt && (
              <div className="flex items-center gap-1.5 text-sm font-medium text-green-400">
                <CheckIcon className="h-4 w-4" />
                Saved
              </div>
            )}
          </div>
          <div className="mx-auto max-w-lg mb-4 flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex-1 rounded-xl border border-gold/30 bg-gold/10 px-6 py-3 text-sm font-semibold text-gold transition-all hover:border-gold/50 hover:bg-gold/20 active:scale-[0.98]"
            >
              <Download className="h-4 w-4 mr-2 inline" />
              Export to PDF
            </button>
            <button
              onClick={handleImportClick}
              className="flex-1 rounded-xl border border-parchment/20 bg-parchment/5 px-6 py-3 text-sm font-semibold text-parchment transition-all hover:border-parchment/40 hover:bg-parchment/10 active:scale-[0.98]"
            >
              <Upload className="h-4 w-4 mr-2 inline" />
              Import from PDF
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
          {importError && (
            <div className="mx-auto max-w-lg mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {importError}
            </div>
          )}
          {importSuccess && (
            <div className="mx-auto max-w-lg mb-4 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
              {importSuccess}
            </div>
          )}
          <div className="mx-auto max-w-lg mb-4">
            <button
              onClick={handleDelete}
              className="w-full rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-3 text-sm font-semibold text-red-400 transition-all hover:border-red-500/50 hover:bg-red-500/20 active:scale-[0.98]"
            >
              <Trash2 className="h-4 w-4 mr-2 inline" />
              Delete Character
            </button>
          </div>
        </main>
      </CharacterSheetProvider>

      <LevelUpModal
        open={showLevelUpModal && !!pendingLevelUp}
        levelUpResult={pendingLevelUp}
        currentAbilityScores={{
          str: character.str,
          dex: character.dex,
          con: character.con,
          int: character.int,
          wis: character.wis,
          cha: character.cha,
        }}
        onConfirm={handleLevelUpConfirm}
        onCancel={handleLevelUpCancel}
        hpGainDescription={hpGainDescription}
        expertiseOptions={expertiseOptionsForLevelUp}
        expertiseCount={needsExpertiseAtLevel6 ? 4 - (character.expertise || []).length : undefined}
        onExpertiseConfirm={handleExpertiseFromLevelUp}
        characterClass={character.class}
        currentExpertise={character.expertise}
        currentSkills={character.skills}
      />
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
