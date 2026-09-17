"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { getCharacters, saveCharacter, deleteCharacter, type Character } from "@/lib/storage";
import { importCharacterFromJson } from "@/lib/character-io";
import { useDebug } from "@/lib/debug/DebugContext";
import { UploadIcon as Upload, CaretRightIcon as CaretRight, UserPlusIcon as UserPlus, UserIcon as User, TrashIcon as Trash, FileJsonIcon as FileJson, DownloadIcon as Download, GearIcon as Gear } from "@/components/icons";
import { generateTestCharacters, getTestCharacterCount, removeTestCharacters, type GenerationResult } from "@/lib/test-character-generator";

export default function Home() {
  const debug = useDebug();
  const isAdmin = debug.enabled && debug.unlocked;
  const [characters, setCharacters] = useState<Character[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number; currentName: string } | null>(null);
  const [generationResults, setGenerationResults] = useState<GenerationResult[] | null>(null);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const jsonImportInputRef = useRef<HTMLInputElement | null>(null);

  const loadCharacters = useCallback(async () => {
    const chars = await getCharacters();
    setCharacters(chars);
  }, []);

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportJsonClick = () => {
    jsonImportInputRef.current?.click();
  };

  const handleImportFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportSuccess(null);
    try {
      const { importCharacterFromPdf } = await import("@/lib/pdf");
      const imported = await importCharacterFromPdf(file);
      await saveCharacter(imported);
      setImportSuccess(`Imported "${imported.name || "Unnamed"}" successfully.`);
      await loadCharacters();
    } catch (err) {
      setImportError("This PDF doesn't contain DND Wizard character data.");
    } finally {
      e.target.value = "";
    }
  }, [loadCharacters]);

  const handleImportJsonFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportSuccess(null);
    try {
      const imported = await importCharacterFromJson(file);
      await saveCharacter(imported);
      setImportSuccess(`Imported "${imported.name || "Unnamed"}" successfully.`);
      await loadCharacters();
    } catch (err) {
      setImportError("Failed to import character JSON.");
    } finally {
      e.target.value = "";
    }
  }, [loadCharacters]);

  const handleDelete = useCallback(async (char: Character) => {
    if (window.confirm(`Are you sure you want to delete ${char.name || "this character"}? This action cannot be undone.`)) {
      await deleteCharacter(char.id);
      await loadCharacters();
    }
  }, [loadCharacters]);

  const handleExportJson = useCallback((char: Character) => {
    const { exportCharacterToJson } = require("@/lib/character-io");
    exportCharacterToJson(char);
  }, []);

  const handleBackupAll = useCallback(async () => {
    const chars = await getCharacters();
    const { exportAllCharactersToJson } = require("@/lib/character-io");
    exportAllCharactersToJson(chars);
  }, []);

  const handleGenerateClick = useCallback(() => {
    setShowGenerateConfirm(true);
  }, []);

  const handleGenerateConfirm = useCallback(async () => {
    setShowGenerateConfirm(false);
    setIsGenerating(true);
    setGenerationResults(null);
    setGenerationProgress(null);
    try {
      const results = await generateTestCharacters((current, total, currentName) => {
        setGenerationProgress({ current, total, currentName });
      });
      setGenerationResults(results);
      await loadCharacters();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to generate test characters.");
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  }, [loadCharacters]);

  const handleRemoveClick = useCallback(async () => {
    const count = await getTestCharacterCount();
    if (count === 0) {
      alert("No test characters found.");
      return;
    }
    setShowRemoveConfirm(true);
  }, []);

  const handleRemoveConfirm = useCallback(async () => {
    setShowRemoveConfirm(false);
    try {
      const removed = await removeTestCharacters();
      setImportSuccess(`Removed ${removed} test character${removed !== 1 ? "s" : ""}.`);
      await loadCharacters();
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Failed to remove test characters.");
    }
  }, [loadCharacters]);


  return (
    <div className="min-h-screen bg-paper">
      <AppHeader title="DND Wizard" subtitle="My Characters" showThemeToggle />

      <main className="px-4 py-4 pb-32">
        <div className="mb-5 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={handleImportClick}
              className="btn btn-secondary flex-1"
            >
              <Upload className="h-4 w-4 mr-2 inline" />
              Import PDF
            </button>
            <button
              onClick={handleImportJsonClick}
              className="btn btn-secondary flex-1"
            >
              <FileJson className="h-4 w-4 mr-2 inline" />
              Import JSON
            </button>
          </div>
          <button
            onClick={handleBackupAll}
            className="btn btn-secondary w-full"
          >
            <Download className="h-4 w-4 mr-2 inline" />
            Backup All Characters
          </button>
          <Link
            href="/test-3d"
            className="btn btn-secondary w-full"
          >
            Test 3D
          </Link>
          {isAdmin && (
            <>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                Admin Tools
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateClick}
                  disabled={isGenerating}
                  className="btn btn-secondary flex-1 opacity-70 hover:opacity-100"
                >
                  <Gear className="h-4 w-4 mr-2 inline" />
                  {isGenerating ? "Generating..." : "Generate Test Characters"}
                </button>
                <button
                  onClick={handleRemoveClick}
                  disabled={isGenerating}
                  className="btn btn-secondary flex-1 opacity-70 hover:opacity-100"
                >
                  <Trash className="h-4 w-4 mr-2 inline" />
                  Remove Test Characters
                </button>
              </div>
              {isGenerating && generationProgress && (
                <div className="mt-2.5 surface bg-paper px-3 py-2.5 text-body">
                  <div className="flex items-center justify-between mb-1">
                    <span>Generating test characters...</span>
                    <span className="text-xs text-[var(--color-text-muted)]">{generationProgress.current} / {generationProgress.total}</span>
                  </div>
                  <div className="w-full bg-[var(--color-border)] rounded-full h-2 mb-1">
                    <div
                      className="bg-[var(--color-ink)] h-2 rounded-full transition-all"
                      style={{ width: `${(generationProgress.current / generationProgress.total) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">{generationProgress.currentName}</p>
                </div>
              )}
              {generationResults && (
                <div className="mt-2.5 surface bg-paper px-3 py-2.5 text-body">
                  <div className="font-semibold mb-1">
                    Generated {generationResults.length} characters — {generationResults.filter((r) => r.success).length} succeeded, {generationResults.filter((r) => !r.success).length} failed
                  </div>
                  {generationResults.filter((r) => !r.success).length > 0 && (
                    <div className="mt-2 space-y-1">
                      {generationResults.filter((r) => !r.success).map((r, i) => (
                        <div key={i} className="text-xs text-[var(--color-error-600)]">
                          {r.name} — {r.error}
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => setGenerationResults(null)}
                    className="mt-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  >
                    Dismiss
                  </button>
                </div>
              )}
              {showGenerateConfirm && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50" onClick={() => setShowGenerateConfirm(false)}>
                  <div className="mx-auto w-full max-w-sm bg-[var(--color-surface)] rounded-t-[20px] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Generate Test Characters</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                      This will generate {getTestCharacterCount()} test characters covering all class/subclass combinations. Continue?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowGenerateConfirm(false)}
                        className="btn btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleGenerateConfirm}
                        className="btn btn-primary flex-1"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {showRemoveConfirm && (
                <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50" onClick={() => setShowRemoveConfirm(false)}>
                  <div className="mx-auto w-full max-w-sm bg-[var(--color-surface)] rounded-t-[20px] p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-2">Remove Test Characters</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                      This will permanently delete all test characters. Continue?
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowRemoveConfirm(false)}
                        className="btn btn-secondary flex-1"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRemoveConfirm}
                        className="btn btn-primary flex-1"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <input
            ref={importInputRef}
            type="file"
            accept="application/pdf"
            onChange={handleImportFile}
            className="hidden"
          />
          <input
            ref={jsonImportInputRef}
            type="file"
            accept="application/json"
            onChange={handleImportJsonFile}
            className="hidden"
          />
          {importError && (
            <div className="mt-2.5 surface border-[var(--color-error-200)] bg-[var(--color-error-50)] px-3 py-2.5 text-xs font-medium text-[var(--color-error-600)]">
              {importError}
            </div>
          )}
          {importSuccess && (
            <div className="mt-2.5 surface bg-paper px-3 py-2.5 text-body">
              {importSuccess}
            </div>
          )}
        </div>

        <section>
          <h2 className="text-card-title mb-3">
            My Characters
          </h2>

          {characters.length === 0 ? (
               <div className="flex flex-col items-center justify-center card border-dashed border-border-muted bg-paper py-10 text-center">
                <UserPlus size={48} color="var(--color-text-muted)" className="mb-2.5 opacity-40" />
              <p className="text-muted">
                No characters yet. Create your first hero to begin your adventure.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {characters.map((char) => (
                <li key={char.id} className="flex items-center gap-2">
                  <Link
                    href={`/character/${char.id}`}
                    className="card block flex-1 p-3.5 transition-all active:scale-[0.98] hover:bg-paper-muted"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink/5">
                          <User size={20} />
                        </div>
                        <div>
                          <h3 className="text-card-title">
                            {char.name || "Unnamed Hero"}
                          </h3>
                          <p className="text-muted">
                            Created {formatDate(char.createdAt)}
                          </p>
                        </div>
                      </div>
                      <CaretRight size={16} className="text-ink-muted" />
                    </div>
                  </Link>
                  <button
                    onClick={(e) => { e.preventDefault(); handleExportJson(char); }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-all"
                    aria-label={`Export ${char.name || "character"} as JSON`}
                  >
                    <FileJson size={18} />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); handleDelete(char); }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-error-600)] transition-all"
                    aria-label={`Delete ${char.name || "character"}`}
                  >
                    <Trash size={18} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
    </main>
  </div>
);
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
