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
        className={`btn rounded-md px-2.5 py-1 text-[var(--font-size-xs)] ${
          mode === "view"
            ? "btn btn-primary"
            : "btn btn-secondary"
        }`}
      >
        <Eye className="h-4 w-4" weight={mode === "view" ? "fill" : "regular"} />
      </button>
      <button
        type="button"
        onClick={() => onModeChange("edit")}
        className={`btn rounded-md px-2.5 py-1 text-[var(--font-size-xs)] ${
          mode === "edit"
            ? "btn btn-primary"
            : "btn btn-secondary"
        }`}
      >
        <PencilSimple className="h-4 w-4" weight={mode === "edit" ? "fill" : "regular"} />
      </button>
    </div>
  );
}
