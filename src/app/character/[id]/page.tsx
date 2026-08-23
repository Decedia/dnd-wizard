"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { getCharacter, saveCharacter, deleteCharacter, computeDerivedStats, type Character } from "@/lib/storage";
import { StickyMiniHeader } from "@/components/character-sheet/StickyMiniHeader";
import { CharacterSheetProvider } from "@/components/character-sheet/CharacterSheetContext";
import { SheetTabs } from "@/components/character-sheet/SheetTabs";
import { ViewEditToggle } from "@/components/character-sheet/ViewEditToggle";
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
import { Trash2, Download, Upload, ArrowUp, Save } from "lucide-react";
import { exportCharacterToPdf } from "@/lib/pdf-visual";
import { importCharacterFromPdf } from "@/lib/pdf";

type TabId = "combat" | "character" | "gear" | "bio";

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
  const [spellsCollapsed, setSpellsCollapsed] = useState(true);
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

  const handleLevelUpClick = () => {
    if (!character || character.level >= 20) return;
    router.push(`/character/${id}/level-up`);
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

  return (
    <div className="min-h-screen bg-charcoal">
      <AppHeader title={character.name || "Character"} subtitle="Character Sheet" />
      <StickyMiniHeader character={character} />

      <div className="mx-auto max-w-lg px-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 overflow-x-auto">
            <SheetTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>
          <ViewEditToggle mode={editMode ? "edit" : "view"} onModeChange={(m) => setEditMode(m === "edit")} />
        </div>
      </div>

      <CharacterSheetProvider onFieldBlur={debouncedSave}>
        <main className="px-4 py-4 pb-28 md:px-4 md:pr-4 pr-12">
          <div className="mx-auto max-w-lg space-y-4">
            {activeTab === "combat" && (
              <>
                <StatsSection character={character} onChange={handleChange} editMode={editMode} />
                <CombatStatsSection character={character} onChange={handleChange} editMode={editMode} />
                <DeathSavesSection character={character} onChange={handleChange} editMode={editMode} />
                <HitDiceSection character={character} onChange={handleChange} editMode={editMode} />
                <AttacksAndSpellcastingSection character={character} onChange={handleChange} editMode={editMode} />
                <SpellcastingStatsSection character={character} onChange={handleChange} editMode={editMode} />
              </>
            )}
            {activeTab === "character" && (
              <>
                <IdentitySection character={character} onChange={handleChange} editMode={editMode} />
                <SkillsSection character={character} onChange={handleChange} editMode={editMode} />
                <FeaturesTraitsSection character={character} onChange={handleChange} editMode={editMode} />
                <OtherProficienciesSection otherProficiencies={character.otherProficiencies} onChange={(value) => handleChange({ otherProficiencies: value })} editMode={editMode} />
              </>
            )}
            {activeTab === "gear" && (
              <>
                <InventorySection character={character} onChange={handleChange} editMode={editMode} />
                <SpellsSection
                  character={character}
                  onChange={handleChange}
                  collapsed={spellsCollapsed}
                  onToggleCollapse={() => setSpellsCollapsed((c) => !c)}
                  editMode={editMode}
                />
              </>
            )}
            {activeTab === "bio" && (
              <>
                <AppearanceBioSection character={character} onChange={handleChange} editMode={editMode} />
                <LevelXpSection character={character} onChange={handleChange} editMode={editMode} />
              </>
            )}
          </div>

          <div className="mx-auto max-w-lg mt-6 mb-4 rounded-xl border border-parchment/10 bg-charcoal-light/60 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleLevelUpClick}
                disabled={character.level >= 20}
                className="flex items-center justify-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold transition-all hover:border-gold/50 hover:bg-gold/20 active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100"
              >
                <ArrowUp className="h-4 w-4" />
                Level Up
              </button>
              <button
                onClick={handleSave}
                className="flex items-center justify-center gap-2 rounded-full bg-burgundy px-4 py-3 text-sm font-semibold text-parchment shadow-lg shadow-burgundy/20 transition-all hover:bg-burgundy-light active:scale-[0.98]"
              >
                <Save className="h-4 w-4" />
                Save
              </button>
              <button
                onClick={handleExport}
                disabled={exportingPdf}
                className="flex items-center justify-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold transition-all hover:border-gold/50 hover:bg-gold/20 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
              >
                {exportingPdf ? (
                  <>
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
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
                className="flex items-center justify-center gap-2 rounded-full border border-parchment/20 bg-parchment/5 px-4 py-3 text-sm font-semibold text-parchment transition-all hover:border-parchment/40 hover:bg-parchment/10 active:scale-[0.98]"
              >
                <Upload className="h-4 w-4" />
                Import PDF
              </button>
            </div>
            <button
              onClick={handleDelete}
              className="flex items-center justify-center gap-2 w-full rounded-full border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 transition-all hover:border-red-500/50 hover:bg-red-500/20 active:scale-[0.98]"
            >
              <Trash2 className="h-4 w-4" />
              Delete Character
            </button>
            {savedAt && (
              <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-green-400">
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
