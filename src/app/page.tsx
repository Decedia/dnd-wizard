"use client";

import { useState, useRef, useCallback, useEffect, useMemo, createElement } from "react";
import Link from "next/link";
import {
  FileText,
  FileCode,
  DownloadSimple,
  Plus,
  Trash,
  Gear,
  Play,
  DotsThreeVertical,
  CaretRight,
  Coffee,
} from "@phosphor-icons/react";
import { GiCastle, GiMoon } from "react-icons/gi";
import { getClassIcon } from "@/lib/class-icon";
import { COFFEE_URL, SupportLinks } from "@/components/SupportLinks";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { getCharacters, saveCharacter, deleteCharacter, type Character } from "@/lib/storage";
import { importCharacterFromJson } from "@/lib/character-io";
import { useDebug } from "@/lib/debug/DebugContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";


type SortKey = "opened" | "newest" | "oldest" | "name";
/** Hero cards shown before "Show all". */
const FIRST_CARDS = 6;

// One look for every pill button on this page (same as the support buttons).
const pill = "flex items-center justify-center gap-2 rounded-full border border-border-muted bg-paper py-2.5 text-sm text-ink transition-colors hover:bg-paper-muted";

export default function Home() {
  const debug = useDebug();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const isAdmin = debug.enabled && debug.unlocked;
  const [characters, setCharacters] = useState<Character[] | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("opened");
  const [showAll, setShowAll] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<Character | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const jsonImportInputRef = useRef<HTMLInputElement | null>(null);

  const loadCharacters = useCallback(async () => {
    setCharacters(await getCharacters());
  }, []);

  useEffect(() => {
    loadCharacters();
  }, [loadCharacters]);

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
      setSettingsOpen(false);
      await loadCharacters();
    } catch {
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
      setSettingsOpen(false);
      await loadCharacters();
    } catch {
      setImportError(t("import.jsonError"));
    } finally {
      e.target.value = "";
    }
  }, [loadCharacters, t]);

  const handleDelete = useCallback(async (char: Character) => {
    if (window.confirm(t("delete.confirm", { "char.name": char.name || t("home.unnamedHero") } as any))) {
      setMenuFor(null);
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

  const sorted = useMemo(() => {
    const list = [...(characters || [])];
    switch (sortKey) {
      case "newest":
        return list.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
      case "oldest":
        return list.sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0));
      case "name":
        return list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      case "opened":
      default:
        return list.sort(byLastOpened);
    }
  }, [characters, sortKey]);

  // The hero played last; never-opened heroes count by when they were made.
  const last = useMemo(() => [...(characters || [])].sort(byLastOpened)[0], [characters]);
  const visible = showAll ? sorted : sorted.slice(0, FIRST_CARDS);

  const fileInputs = (
    <>
      <input ref={importInputRef} type="file" accept="application/pdf" onChange={handleImportFile} className="hidden" />
      <input ref={jsonImportInputRef} type="file" accept="application/json" onChange={handleImportJsonFile} className="hidden" />
    </>
  );

  const messages = (
    <>
      {importError && (
        <div className="surface mx-4 mt-3 border-[var(--color-error-200)] bg-[var(--color-error-50)] px-3 py-2.5 text-xs font-medium text-[var(--color-error-600)]">{importError}</div>
      )}
      {importSuccess && <div className="surface mx-4 mt-3 px-3 py-2.5 text-body">{importSuccess}</div>}
    </>
  );

  const settingsButton = (
    <button
      type="button"
      onClick={() => setSettingsOpen(true)}
      aria-label={t("home.settings", "Settings")}
      className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-border-strong bg-paper/70 text-ink backdrop-blur-sm"
    >
      <Gear size={20} />
    </button>
  );

  // The tip link, always in sight at the top of the home screen.
  const tipButton = COFFEE_URL ? (
    <a
      href={COFFEE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="absolute left-4 top-4 z-10 flex h-11 items-center gap-2 rounded-full border border-border-strong bg-paper/70 px-4 text-sm font-semibold text-ink backdrop-blur-sm"
    >
      <Coffee size={18} />
      {t("support.coffee", "Buy me a coffee")}
    </a>
  ) : null;

  // First load: nothing yet, so neither the empty screen nor the list flashes.
  if (characters === null) return <div className="min-h-screen bg-paper" />;

  const empty = characters.length === 0;

  return (
    <div className="min-h-screen bg-paper pb-28">
      <div className={`relative overflow-hidden border-b border-border-strong bg-paper-muted ${empty ? "h-[360px]" : "h-[276px]"}`}>
        <Scene tall={empty} />
        {tipButton}
        {settingsButton}
        {!empty && (
          <div className="relative z-[1] px-6 pt-20">
            <p className="text-xs font-semibold tracking-[0.2em] text-[var(--color-accent-indigo-600)]">{t("home.tagline", "YOUR ADVENTURE AWAITS")}</p>
            <h1 className="mt-1.5 text-[40px] font-extrabold leading-none tracking-wide text-ink">
              DND
              <br />
              WIZARD
            </h1>
          </div>
        )}
      </div>

      {empty ? (
        <main className="px-4">
          <div className="relative mt-6 flex flex-col items-center gap-2.5 px-4 text-center">
            <h1 className="text-[40px] font-extrabold leading-none tracking-wide text-ink">DND WIZARD</h1>
            <p className="max-w-[290px] text-[15px] leading-relaxed text-ink-muted">{t("home.firstPitch", "Make your first hero. We walk you through every step, one question at a time.")}</p>
          </div>
          <div className="mt-7 flex flex-col gap-3">
            <Link href="/character/create" className="btn btn-primary flex h-[52px] items-center justify-center text-base">
              {t("home.firstStart", "Start your first adventure")}
            </Link>
            <button type="button" onClick={() => setSettingsOpen(true)} className={pill}>
              {t("home.firstImport", "I already have a character (import)")}
            </button>
          </div>
          {messages}
        </main>
      ) : (
        <main>
          {last && <ContinueCard char={last} />}
          {messages}

          <div className="px-4 pt-3">
            <Link href="/character/create" className="flex h-12 items-center justify-center gap-2 rounded-full border border-[var(--color-accent-indigo-500)] text-[15px] font-semibold text-[var(--color-accent-indigo-600)] transition-colors hover:bg-[var(--color-accent-indigo-50)]">
              <Plus size={18} weight="bold" />
              {t("home.newHero", "New hero")}
            </Link>
          </div>

          <section className="px-4 pt-6">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold tracking-wide text-ink">{t("home.yourHeroes", "Your heroes")}</h2>
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                <span className="sr-only">{t("home.sortBy")}</span>
                <select
                  value={sortKey}
                  onChange={(e) => setSortKey(e.target.value as SortKey)}
                  className="rounded-full border border-border-strong bg-paper px-3 py-1.5 text-xs text-ink"
                >
                  <option value="opened">{t("home.sortLastOpened")}</option>
                  <option value="newest">{t("home.sortNewest")}</option>
                  <option value="oldest">{t("home.sortOldest")}</option>
                  <option value="name">{t("home.sortName")}</option>
                </select>
              </label>
            </div>
            <ul className="grid grid-cols-2 gap-2.5">
              {visible.map((char) => (
                <HeroCard key={char.id} char={char} onMenu={() => setMenuFor(char)} />
              ))}
            </ul>
            {sorted.length > FIRST_CARDS && (
              <button type="button" onClick={() => setShowAll((v) => !v)} className={`${pill} mt-3 w-full`}>
                {showAll ? t("home.showLess", "Show less") : t("home.showAll", { count: sorted.length } as any, "Show all ({count})")}
              </button>
            )}
          </section>
        </main>
      )}

      <Credits />
      {fileInputs}

      <BottomSheet isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} title={t("home.settings", "Settings")}>
        <div className="flex flex-col gap-5 px-4 pb-4 pt-4">
          <SettingGroup title={t("home.language", "LANGUAGE")}>
            <Choice selected={language === "en"} onClick={() => setLanguage("en")}>English</Choice>
            <Choice selected={language === "id"} onClick={() => setLanguage("id")}>Bahasa Indonesia</Choice>
          </SettingGroup>
          <SettingGroup title={t("home.theme", "LOOK")}>
            <Choice selected={theme === "dark"} onClick={() => setTheme("dark")}>{t("home.themeNight", "Night")}</Choice>
            <Choice selected={theme === "light"} onClick={() => setTheme("light")}>{t("home.themeParchment", "Parchment")}</Choice>
          </SettingGroup>
          <SettingGroup title={t("home.dataManagement")}>
            <button type="button" onClick={() => importInputRef.current?.click()} className={pill}>
              <FileText size={16} />
              {t("home.importPdf")}
            </button>
            <button type="button" onClick={() => jsonImportInputRef.current?.click()} className={pill}>
              <FileCode size={16} />
              {t("home.importJson")}
            </button>
            {!empty && (
              <button type="button" onClick={handleBackupAll} className={`${pill} col-span-2`}>
                <DownloadSimple size={16} />
                {t("home.backupAll")}
              </button>
            )}
          </SettingGroup>
          <SupportLinks className="" />
          {isAdmin && (
            <Link href="/admin" className={`${pill} opacity-70`}>
              <Gear size={16} />
              {t("home.adminLab")}
            </Link>
          )}
        </div>
      </BottomSheet>

      <BottomSheet isOpen={!!menuFor} onClose={() => setMenuFor(null)} title={menuFor?.name || t("home.unnamedHero")}>
        {menuFor && (
          <div className="flex flex-col gap-2.5 px-4 pb-4">
            <Link href={`/character?id=${menuFor.id}`} className={pill}>
              <CaretRight size={16} />
              {t("home.open", "Open")}
            </Link>
            <button type="button" onClick={() => handleExportJson(menuFor)} className={pill}>
              <FileCode size={16} />
              {t("home.exportJson", "Save as JSON file")}
            </button>
            <button type="button" onClick={() => handleDelete(menuFor)} className="btn btn-danger flex items-center justify-center gap-2 py-2.5 text-sm">
              <Trash size={16} />
              {t("home.delete", "Delete hero")}
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

function byLastOpened(a: Character, b: Character) {
  const av = a.lastOpenedAt ?? -1;
  const bv = b.lastOpenedAt ?? -1;
  if (av === bv) return (b.createdAt ?? 0) - (a.createdAt ?? 0);
  return bv - av;
}

/** Moon over a castle, drawn with Game Icons. */
function Scene({ tall }: { tall: boolean }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
      <GiMoon className={`absolute text-[var(--color-accent-indigo-300)] opacity-70 ${tall ? "left-1/2 top-16 -translate-x-1/2" : "right-20 top-7"}`} size={tall ? 92 : 64} />
      <GiCastle className={`absolute -bottom-3 text-paper-dark ${tall ? "left-1/2 -translate-x-1/2" : "-right-6"}`} size={tall ? 240 : 190} />
    </div>
  );
}

function hpOf(char: Character) {
  const max = char.maxHp || 0;
  return { cur: Math.max(0, Math.min(char.currentHp ?? max, max)), max };
}

function ContinueCard({ char }: { char: Character }) {
  const { t, language } = useLanguage();
  const { cur, max } = hpOf(char);
  const played = char.lastOpenedAt ? relativeTime(char.lastOpenedAt, language) : "";
  return (
    <div className="relative mx-4 -mt-9 flex flex-col gap-3.5 rounded-[20px] border border-[var(--color-accent-indigo-500)] bg-[var(--color-surface)] p-4 shadow-sm">
      <div className="flex items-center gap-3.5">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-accent-indigo-500)] bg-paper-muted text-[var(--color-accent-indigo-600)]">
          {createElement(getClassIcon(char.class), { size: 28, weight: "duotone" })}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-[0.15em] text-ink-muted">{t("home.continue", "CONTINUE")}</p>
          <p className="truncate font-heading text-xl font-semibold text-ink">{char.name || t("home.unnamedHero")}</p>
          <p className="truncate text-[13px] text-ink-muted">{heroLine(char, t)}</p>
        </div>
      </div>
      {max > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between text-xs text-ink-muted">
            <span>HP {cur} / {max}</span>
            {played && <span>{t("home.played", { when: played } as any, "Played {when}")}</span>}
          </div>
          <div className="progress-track">
            <div className="progress-fill hp-fill" style={{ width: `${Math.round((cur / max) * 100)}%` }} />
          </div>
        </div>
      )}
      <Link href={`/character?id=${char.id}`} className="btn btn-primary flex h-12 items-center justify-center gap-2 text-[15px]">
        <Play size={16} weight="fill" />
        {t("home.continueButton", "Continue adventure")}
      </Link>
    </div>
  );
}

function HeroCard({ char, onMenu }: { char: Character; onMenu: () => void }) {
  const { t } = useLanguage();
  return (
    <li className="relative">
      <Link href={`/character?id=${char.id}`} className="flex h-full flex-col gap-2 rounded-2xl border border-border-strong bg-[var(--color-surface)] p-3 transition-colors hover:border-[var(--color-accent-indigo-500)]">
        <div className="flex items-center justify-between pr-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-muted text-ink">
            {createElement(getClassIcon(char.class), { size: 22, weight: "duotone" })}
          </div>
          <span className="rounded-full border border-[var(--color-accent-indigo-200)] px-2 py-0.5 text-xs font-bold text-[var(--color-accent-indigo-600)]">
            {t("home.lvl", { level: char.level || 1 } as any)}
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-ink">{char.name || t("home.unnamedHero")}</p>
          <p className="truncate text-xs text-ink-muted">{[char.class || t("home.unknown"), char.race].filter(Boolean).join(" · ")}</p>
        </div>
      </Link>
      <button
        type="button"
        onClick={onMenu}
        aria-label={t("home.heroMenu", { name: char.name || t("home.unnamedHero") } as any, "More for {name}")}
        className="absolute right-1 top-1 flex h-11 w-9 items-center justify-center text-ink-muted"
      >
        <DotsThreeVertical size={20} weight="bold" />
      </button>
    </li>
  );
}

function heroLine(char: Character, t: (k: string, a?: any, fb?: string) => string) {
  const level = t("home.levelLong", { level: char.level || 1 } as any, "Level {level}");
  return `${level} ${char.class || t("home.unknown")}${char.race ? ` · ${char.race}` : ""}`;
}

function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-bold tracking-widest text-ink-muted">{title}</h3>
      <div className="grid grid-cols-2 gap-2.5">{children}</div>
    </div>
  );
}

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} className={selected ? "btn btn-primary py-2.5 text-sm" : pill}>
      {children}
    </button>
  );
}

function Credits() {
  const { t } = useLanguage();
  return (
    <p className="mx-4 mt-8 text-center text-[11px] leading-relaxed text-ink-muted">
      {t("home.creditsIcons", "Icons by")}{" "}
      <a href="https://game-icons.net" target="_blank" rel="noopener noreferrer" className="underline">Game Icons</a>{" "}
      (Lorc, Delapouite {t("home.creditsAnd", "and others")}),{" "}
      <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer" className="underline">CC BY 3.0</a>.{" "}
      {t("home.creditsSrd", "Includes material from the System Reference Documents 5.1 and 5.2 by Wizards of the Coast LLC,")}{" "}
      <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="underline">CC BY 4.0</a>.
    </p>
  );
}

function relativeTime(ts: number, language: string): string {
  const fmt = new Intl.RelativeTimeFormat(language === "id" ? "id" : "en", { numeric: "auto" });
  const mins = Math.round((ts - Date.now()) / 60000);
  if (Math.abs(mins) < 60) return fmt.format(mins, "minute");
  const hours = Math.round(mins / 60);
  if (Math.abs(hours) < 24) return fmt.format(hours, "hour");
  return fmt.format(Math.round(hours / 24), "day");
}
