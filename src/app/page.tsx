"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { getCharacters, saveCharacter, deleteCharacter, type Character } from "@/lib/storage";
import { importCharacterFromJson } from "@/lib/character-io";
import { useDebug } from "@/lib/debug/DebugContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { UploadIcon as Upload, CaretRightIcon as CaretRight, UserPlusIcon as UserPlus, UserIcon as User, TrashIcon as Trash, FileJsonIcon as FileJson, DownloadIcon as Download, GearIcon as Gear } from "@/components/icons";

export default function Home() {
  const debug = useDebug();
  const { t } = useLanguage();
  const isAdmin = debug.enabled && debug.unlocked;
  const [characters, setCharacters] = useState<Character[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
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
      setImportSuccess(t("import.success", { name: imported.name || "Unnamed" } as any));
      await loadCharacters();
    } catch (err) {
      setImportError(t("import.pdfError"));
    } finally {
      e.target.value = "";
    }
  }, [loadCharacters, t]);

  const handleImportJsonFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportSuccess(null);
    try {
      const imported = await importCharacterFromJson(file);
      await saveCharacter(imported);
      setImportSuccess(t("import.success", { name: imported.name || "Unnamed" } as any));
      await loadCharacters();
    } catch (err) {
      setImportError(t("import.jsonError"));
    } finally {
      e.target.value = "";
    }
  }, [loadCharacters, t]);

  const handleDelete = useCallback(async (char: Character) => {
    if (window.confirm(t("delete.confirm", { "char.name": char.name || t("home.unnamedHero") } as any))) {
      await deleteCharacter(char.id);
      await loadCharacters();
    }
  }, [loadCharacters, t]);

  const handleExportJson = useCallback((char: Character) => {
    const { exportCharacterToJson } = require("@/lib/character-io");
    exportCharacterToJson(char);
  }, []);

  const handleBackupAll = useCallback(async () => {
    const chars = await getCharacters();
    const { exportAllCharactersToJson } = require("@/lib/character-io");
    exportAllCharactersToJson(chars);
  }, []);


  return (
    <div className="min-h-screen bg-paper">
      <AppHeader title={t("app.name")} subtitle={t("nav.myCharacters")} showThemeToggle />

      <main className="px-4 py-4 pb-32">
        <div className="mb-5 space-y-2">
          <div className="flex gap-2">
            <button
              onClick={handleImportClick}
              className="btn btn-secondary flex-1"
            >
              <Upload className="h-4 w-4 mr-2 inline" />
              {t("home.importPdf")}
            </button>
            <button
              onClick={handleImportJsonClick}
              className="btn btn-secondary flex-1"
            >
              <FileJson className="h-4 w-4 mr-2 inline" />
              {t("home.importJson")}
            </button>
          </div>
          <button
            onClick={handleBackupAll}
            className="btn btn-secondary w-full"
          >
            <Download className="h-4 w-4 mr-2 inline" />
            {t("home.backupAll")}
          </button>
          {isAdmin && (
            <Link
              href="/admin"
              className="btn btn-secondary w-full opacity-70 hover:opacity-100"
            >
              <Gear className="h-4 w-4 mr-2 inline" />
              {t("home.adminLab")}
            </Link>
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
            {t("home.myCharacters")}
          </h2>

          {characters.length === 0 ? (
               <div className="flex flex-col items-center justify-center card border-dashed border-border-muted bg-paper py-10 text-center">
                <UserPlus size={48} color="var(--color-text-muted)" className="mb-2.5 opacity-40" />
              <p className="text-muted">
                {t("home.noCharacters")}
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
                            {char.name || t("home.unnamedHero")}
                          </h3>
                          <p className="text-muted">
                            {t("home.created")} {formatDate(char.createdAt)}
                          </p>
                        </div>
                      </div>
                      <CaretRight size={16} className="text-ink-muted" />
                    </div>
                  </Link>
                  <button
                    onClick={(e) => { e.preventDefault(); handleExportJson(char); }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-all"
                    aria-label={t("export.json", { "char.name": char.name || t("home.unnamedHero") } as any)}
                  >
                    <FileJson size={18} />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); handleDelete(char); }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-error-600)] transition-all"
                    aria-label={t("delete.confirm", { "char.name": char.name || t("home.unnamedHero") } as any)}
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
