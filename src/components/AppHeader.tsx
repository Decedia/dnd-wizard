"use client";

import Link from "next/link";
import { ViewEditToggle } from "@/components/character-sheet/ViewEditToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WizardHatIcon, EyeIcon as Eye, EyeSlashIcon as EyeSlash } from "@/components/icons";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  editMode?: boolean;
  onEditModeChange?: (mode: boolean) => void;
  onSave?: () => void;
  showThemeToggle?: boolean;
  showDescriptions?: boolean;
  onShowDescriptionsChange?: (value: boolean) => void;
}

export function AppHeader({ title, subtitle, editMode, onEditModeChange, onSave, showThemeToggle, showDescriptions, onShowDescriptionsChange }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border-strong bg-paper/90 backdrop-blur-sm">
      <div className="mx-auto max-w-lg px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink/5 text-ink">
              <WizardHatIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              {title && (
                <h1 className="font-display text-base font-semibold tracking-tight text-ink">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-[11px] text-ink-muted font-body">{subtitle}</p>
              )}
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {editMode !== undefined && onEditModeChange && (
              <ViewEditToggle mode={editMode ? "edit" : "view"} onModeChange={(m) => onEditModeChange(m === "edit")} onSave={onSave} />
            )}
            {showDescriptions !== undefined && onShowDescriptionsChange !== undefined && (
              <button
                type="button"
                onClick={() => onShowDescriptionsChange(!showDescriptions)}
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all ${
                  showDescriptions
                    ? "border-[var(--color-border-active)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
                    : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]"
                }`}
                aria-label={showDescriptions ? "Hide descriptions" : "Show descriptions"}
                title={showDescriptions ? "Hide descriptions" : "Show descriptions"}
              >
                {showDescriptions ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeSlash className="h-4 w-4" />
                )}
              </button>
            )}
            {showThemeToggle && <ThemeToggle />}
          </div>
        </div>
      </div>
    </header>
  );
}
