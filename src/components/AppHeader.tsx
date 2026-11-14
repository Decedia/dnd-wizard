"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { House } from "@phosphor-icons/react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { ViewEditToggle } from "@/components/character-sheet/ViewEditToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  editMode?: boolean;
  onEditModeChange?: (mode: boolean) => void;
  onSave?: () => void;
  showThemeToggle?: boolean;
  /** Ask before going home, for pages whose progress is not saved yet. */
  leaveWarning?: string;
}

export function AppHeader({ title, subtitle, editMode, onEditModeChange, onSave, showThemeToggle, leaveWarning }: AppHeaderProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  return (
    <>
    <header className="sticky top-0 z-40 border-b border-border-strong bg-paper">
      <div className="mx-auto max-w-lg px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              onClick={(e) => { if (leaveWarning) { e.preventDefault(); setAsking(true); } }}
              aria-label={t("nav.home", "Home")}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-control-border)] text-ink"
            >
              <House size={20} weight="bold" />
            </Link>
            <div className="flex min-w-0 flex-col">
              {title && (
                <h1 className="truncate font-heading text-base font-semibold text-ink">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-[11px] text-ink-muted font-body">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editMode !== undefined && onEditModeChange && (
              <ViewEditToggle mode={editMode ? "edit" : "view"} onModeChange={(m) => onEditModeChange(m === "edit")} onSave={onSave} />
            )}
            {showThemeToggle && <ThemeToggle />}
            <LanguageToggle />
          </div>
        </div>
      </div>
    </header>
    {leaveWarning && (
      <BottomSheet isOpen={asking} onClose={() => setAsking(false)} title={t("leave.title", "Go back home?")}>
        <div className="space-y-4 p-4">
          <p className="text-sm text-[var(--color-text-secondary)]">{leaveWarning}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setAsking(false)} className="btn btn-secondary flex-1">{t("leave.stay", "Stay")}</button>
            <button type="button" onClick={() => router.push("/")} className="btn btn-primary flex-1">{t("leave.go", "Go home")}</button>
          </div>
        </div>
      </BottomSheet>
    )}
    </>
  );
}
