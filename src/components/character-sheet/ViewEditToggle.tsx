"use client";

import { Eye, PencilSimple } from "phosphor-react";

type Mode = "view" | "edit";

interface ViewEditToggleProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

export function ViewEditToggle({ mode, onModeChange }: ViewEditToggleProps) {
  return (
    <div className="flex items-center gap-0.5 rounded-lg border border-border-strong bg-paper p-0.5 shrink-0">
      <button
        type="button"
        onClick={() => onModeChange("view")}
        className={`rounded-md px-2.5 py-1 text-[var(--font-size-xs)] inline-flex items-center justify-center ${
          mode === "view"
            ? "bg-[var(--color-ink)] text-[var(--color-surface)]"
            : "bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)]"
        }`}
      >
        <Eye className="h-4 w-4" weight={mode === "view" ? "fill" : "regular"} color={mode === "view" ? "var(--color-surface)" : "var(--color-text-primary)"} />
      </button>
      <button
        type="button"
        onClick={() => onModeChange("edit")}
        className={`rounded-md px-2.5 py-1 text-[var(--font-size-xs)] inline-flex items-center justify-center ${
          mode === "edit"
            ? "bg-[var(--color-ink)] text-[var(--color-surface)]"
            : "bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)]"
        }`}
      >
        <PencilSimple className="h-4 w-4" weight={mode === "edit" ? "fill" : "regular"} color={mode === "edit" ? "var(--color-surface)" : "var(--color-text-primary)"} />
      </button>
    </div>
  );
}
