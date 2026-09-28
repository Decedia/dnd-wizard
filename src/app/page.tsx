"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Axe,
  Guitar,
  Cross,
  Leaf,
  Sword,
  HandFist,
  Shield,
  Crosshair,
  Knife,
  Fire,
  Skull,
  MagicWand,
  User,
  UserPlus,
  FileText,
  FileCode,
  DownloadSimple,
  Plus,
  Trash,
  CaretRight,
  Gear,
} from "@phosphor-icons/react";
import { AppHeader } from "@/components/AppHeader";
import { getCharacters, saveCharacter, deleteCharacter, type Character } from "@/lib/storage";
import { importCharacterFromJson } from "@/lib/character-io";
import { useDebug } from "@/lib/debug/DebugContext";
import { useLanguage } from "@/contexts/LanguageContext";

const getClassIcon = (className = "") => {
  const c = className.toLowerCase();
  if (c.includes("barbarian")) return Axe;
  if (c.includes("bard")) return Guitar;
  if (c.includes("cleric")) return Cross;
  if (c.includes("druid")) return Leaf;
  if (c.includes("fighter")) return Sword;
  if (c.includes("monk")) return HandFist;
  if (c.includes("paladin")) return Shield;
  if (c.includes("ranger")) return Crosshair;
  if (c.includes("rogue")) return Knife;
  if (c.includes("sorcerer")) return Fire;
  if (c.includes("warlock")) return Skull;
  if (c.includes("wizard")) return MagicWand;
  return User;
};

export default function Home() {
  const debug = useDebug();
  const { t, language } = useLanguage();
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

      {/* pb-32 keeps the last row of content clear of the bottom nav and watermark. */}
      <main className="px-4 py-4 pb-32">
        <div className="relative mb-4 overflow-hidden rounded-3xl border border-border-muted bg-paper-muted p-6 shadow-sm">
          <div className="absolute -bottom-4 -right-4 text-paper-darker" aria-hidden="true">
            <svg width="140" height="140" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.5 2 7 5 7 5C7 5 8.5 4.5 9 4.5C9.5 4.5 11 6 10.5 7.5C10 9 8 10.5 5 11.5C3.5 12 2 12.5 2 12.5C2 12.5 4.5 13 6.5 12.5C8 12 10 11 11.5 12C12.5 12.5 13 14 12 15.5C11.5 16.5 9.5 17 9.5 17C9.5 17 11.5 17.5 13 17C15 16 16.5 14 17 12C17.5 10 17.5 8.5 19 7C20.5 5.5 22 5 22 5C22 5 20.5 5.5 19.5 6.5C18.5 7.5 18 9 17 10C16 11 14.5 12 13 11C11.5 10 11.5 8 12 6.5C12.5 5 14 4 14 4C14 4 13 2 12 2Z" />
            </svg>
          </div>
          <div className="relative z-10">
            <h1 className="text-page-title">{t("home.heroTitle")}</h1>
            <p className="mt-1 max-w-[200px] text-sm text-muted">{t("home.heroSubtitle")}</p>
          </div>
        </div>

        <Link
          href="/character/create"
          className="mb-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border-muted bg-paper p-4 text-sm font-semibold text-ink transition-colors hover:bg-paper-muted"
        >
          <Plus size={18} weight="bold" />
          <span>{t("home.newCharacter")}</span>
        </Link>

        <section>
          <h2 className="mb-3 text-xs font-bold tracking-widest text-ink">{t("home.myCharacters")}</h2>

          {characters.length === 0 ? (
            <div className="flex flex-col items-center justify-center card border-dashed border-border-muted bg-paper py-10 text-center">
              <UserPlus size={48} weight="duotone" className="mb-2.5 opacity-40" />
              <p className="text-muted">{t("home.noCharacters")}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {characters.map((char) => {
                const ClassIcon = getClassIcon(char.class);
                return (
                  <li
                    key={char.id}
                    className="mb-3 flex items-center justify-between rounded-2xl border border-border-muted bg-paper p-3 shadow-sm"
                  >
                    <Link
                      href={`/character/${char.id}`}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <div className="flex shrink-0 items-center justify-center rounded-xl bg-paper-muted p-2.5 text-ink">
                        <ClassIcon size={24} weight="duotone" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-card-title">
                          {char.name || t("home.unnamedHero")}
                        </h3>
                        <p className="truncate text-muted">
                          {t("home.lvl", { level: char.level || 1 } as any)} {char.class || t("home.unknown")} •{" "}
                          {formatDate(char.createdAt, language)}
                        </p>
                      </div>
                    </Link>
                    <div className="flex shrink-0 items-center gap-3 text-ink-muted">
                      <button
                        onClick={() => handleExportJson(char)}
                        className="flex h-9 w-9 items-center justify-center transition-colors hover:text-[var(--color-accent)]"
                        aria-label={t("export.json", { "char.name": char.name || t("home.unnamedHero") } as any)}
                      >
                        <FileCode size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(char)}
                        className="flex h-9 w-9 items-center justify-center transition-colors hover:text-[var(--color-error-600)]"
                        aria-label={t("delete.confirm", { "char.name": char.name || t("home.unnamedHero") } as any)}
                      >
                        <Trash size={18} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="mt-8">
          <h3 className="mb-3 text-xs font-bold tracking-widest text-ink-muted">{t("home.dataManagement")}</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleImportClick}
              className="flex items-center justify-center gap-2 rounded-full border border-border-muted bg-paper py-2.5 text-sm text-ink transition-colors hover:bg-paper-muted"
            >
              <FileText size={16} />
              {t("home.importPdf")}
            </button>
            <button
              onClick={handleImportJsonClick}
              className="flex items-center justify-center gap-2 rounded-full border border-border-muted bg-paper py-2.5 text-sm text-ink transition-colors hover:bg-paper-muted"
            >
              <FileCode size={16} />
              {t("home.importJson")}
            </button>
            <button
              onClick={handleBackupAll}
              className="col-span-2 mt-1 flex items-center justify-center gap-2 rounded-full border border-border-muted bg-paper py-2.5 text-sm text-ink transition-colors hover:bg-paper-muted"
            >
              <DownloadSimple size={16} />
              {t("home.backupAll")}
            </button>
          </div>

          {isAdmin && (
            <Link
              href="/admin"
              className="mt-3 flex items-center justify-center gap-2 rounded-full border border-border-muted bg-paper py-2.5 text-sm text-ink opacity-70 transition-opacity hover:opacity-100"
            >
              <Gear size={16} />
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
            <div className="surface mt-2.5 border-[var(--color-error-200)] bg-[var(--color-error-50)] px-3 py-2.5 text-xs font-medium text-[var(--color-error-600)]">
              {importError}
            </div>
          )}
          {importSuccess && (
            <div className="surface mt-2.5 bg-paper px-3 py-2.5 text-body">{importSuccess}</div>
          )}
        </div>
      </main>
    </div>
  );
}

function formatDate(timestamp: number, language: string): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
