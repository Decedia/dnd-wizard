"use client";

import Link from "next/link";
import { ViewEditToggle } from "@/components/character-sheet/ViewEditToggle";
import { WizardHat } from "phosphor-react";

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  editMode?: boolean;
  onEditModeChange?: (mode: boolean) => void;
}

export function WizardHatIcon({ className }: { className?: string }) {
  return <WizardHat className={className} weight="fill" />;
}

export function AppHeader({ title, subtitle, editMode, onEditModeChange }: AppHeaderProps) {
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
          {editMode !== undefined && onEditModeChange && (
            <ViewEditToggle mode={editMode ? "edit" : "view"} onModeChange={(m) => onEditModeChange(m === "edit")} />
          )}
        </div>
      </div>
    </header>
  );
}
