"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { getCharacter, saveCharacter, deleteCharacter, computeDerivedStats, type Character } from "@/lib/storage";
import { CharacterSheetProvider } from "@/components/character-sheet/CharacterSheetContext";
import { SheetTabs, type TabId } from "@/components/character-sheet/SheetTabs";
import { LevelXpSection } from "@/components/character-sheet/LevelXpSection";
import { IdentitySection } from "@/components/character-sheet/IdentitySection";
import { StatsSection } from "@/components/character-sheet/StatsSection";
import { CombatStatsSection } from "@/components/character-sheet/CombatStatsSection";
import { DeathSavesSection } from "@/components/character-sheet/DeathSavesSection";
import { HitDiceSection } from "@/components/character-sheet/HitDiceSection";
import { SkillsSection } from "@/components/character-sheet/SkillsSection";
import { FeaturesTraitsSection } from "@/components/character-sheet/FeaturesTraitsSection";
import { AttacksAndSpellcastingSection } from "@/components/character-sheet/AttacksAndSpellcastingSection";
import { InventorySection } from "@/components/character-sheet/InventorySection";
import { OtherProficienciesSection } from "@/components/character-sheet/OtherProficienciesSection";
import { SpellsSection } from "@/components/character-sheet/SpellsSection";
import { SpellcastingStatsSection } from "@/components/character-sheet/SpellcastingStatsSection";
import { AppearanceBioSection } from "@/components/character-sheet/AppearanceBioSection";
import { Trash2, Download, Upload, Save } from "lucide-react";
import { exportCharacterToPdf } from "@/lib/pdf-visual";
import { importCharacterFromPdf } from "@/lib/pdf";

export default function CharacterView() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [character, setCharacter] = useState<Character | null>(() => {
    if (typeof window !== "undefined" && id) {
      const loaded = getCharacter(id) ?? null;
      if (loaded) {
        const derived = computeDerivedStats(loaded);
        return { ...loaded, ...derived };
      }
      return null;
    }
    return null;
  });

  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("combat");
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

  const handleExport = async () => {
    if (!character || exportingPdf) return;
    setExportingPdf(true);
    try {
      await exportCharacterToPdf(character);
    } finally {
      setExportingPdf(false);
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

  const handleChange = useCallback((patch: Partial<Character>) => {
    setCharacter((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      try {
        const { computeDerivedStats } = require("@/lib/storage");
        const derived = computeDerivedStats(next);
        return { ...next, ...derived };
      } catch {
        return next;
      }
    });
  }, []);

  if (!character) {
    return (
      <div className="min-h-screen bg-ink">
        <AppHeader title="Character" subtitle="Character Sheet" />
        <main className="px-4 py-6 pb-28">
          <div className="flex flex-col items-center justify-center card border-dashed border-paper/20 bg-ink py-20 text-center">
            <div className="mb-4 text-5xl opacity-40">🐉</div>
            <h2 className="font-display text-xl font-bold text-paper mb-2">
              Character Not Found
            </h2>
            <p className="text-sm text-ink-muted max-w-xs mb-6">
              This character could not be found. It may have been deleted.
            </p>
            <Link
              href="/"
              className="btn-primary"
            >
              Return Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink">
      <AppHeader title="" subtitle="Character Sheet" editMode={editMode} onEditModeChange={setEditMode} />

      <div className="sticky top-[68px] z-30 bg-ink border-b-[3px] border-paper">
        <div className="mx-auto max-w-lg px-4 py-3">
          <SheetTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </div>
      </div>

      <CharacterSheetProvider onFieldBlur={debouncedSave}>
        <main className="mx-auto max-w-lg px-4 py-4 pb-28">
          {activeTab === "combat" && (
            <>
              <CombatStatsSection character={character} onChange={handleChange} editMode={editMode} />
              <StatsSection character={character} onChange={handleChange} editMode={editMode} />
              <DeathSavesSection character={character} onChange={handleChange} editMode={editMode} />
              <HitDiceSection character={character} onChange={handleChange} editMode={editMode} />
              <AttacksAndSpellcastingSection character={character} onChange={handleChange} editMode={editMode} />
            </>
          )}
          {activeTab === "features" && (
            <>
              <SkillsSection character={character} onChange={handleChange} editMode={editMode} />
              <FeaturesTraitsSection character={character} onChange={handleChange} editMode={editMode} />
              <OtherProficienciesSection otherProficiencies={character.otherProficiencies} onChange={(value) => handleChange({ otherProficiencies: value })} editMode={editMode} />
            </>
          )}
          {activeTab === "gear" && (
            <>
              <InventorySection character={character} onChange={handleChange} editMode={editMode} />
            </>
          )}
          {activeTab === "spells" && (
            <>
              <SpellsSection
                character={character}
                onChange={handleChange}
                editMode={editMode}
              />
              <SpellcastingStatsSection character={character} onChange={handleChange} editMode={editMode} />
            </>
          )}
          {activeTab === "bio" && (
            <>
              <IdentitySection character={character} onChange={handleChange} editMode={editMode} />
              <LevelXpSection character={character} onChange={handleChange} editMode={editMode} />
              {character.level < 20 && (
                <button
                  onClick={() => router.push(`/character/${character.id}/level-up`)}
                  className="btn-secondary w-full"
                >
                  Level Up
                </button>
              )}
              <AppearanceBioSection character={character} onChange={handleChange} editMode={editMode} />
            </>
          )}

          <div className="mt-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSave}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
              <button
                onClick={handleExport}
                disabled={exportingPdf}
                className="btn-secondary flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {exportingPdf ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-paper border-t-ink" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Export PDF
                  </>
                )}
              </button>
              <button
                onClick={handleImportClick}
                className="btn-secondary flex items-center justify-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Import PDF
              </button>
            </div>
            <button
              onClick={handleDelete}
              className="btn-danger w-full flex items-center justify-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Delete Character
            </button>
            {savedAt && (
              <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-ink bg-paper py-2 surface">
                <CheckIcon className="h-4 w-4" />
                Saved
              </div>
            )}
            <input
              ref={importInputRef}
              type="file"
              accept="application/pdf"
              onChange={handleImportFile}
              className="hidden"
            />
          </div>
        </main>
      </CharacterSheetProvider>

      <BottomNav />
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
