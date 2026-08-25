"use client";

type Mode = "view" | "edit";

interface ViewEditToggleProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

export function ViewEditToggle({ mode, onModeChange }: ViewEditToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border-2 border-paper bg-ink p-1 shrink-0">
      <button
        type="button"
        onClick={() => onModeChange("view")}
        className={`rounded-md px-3 py-1 text-xs font-bold transition-all ${
          mode === "view"
            ? "bg-paper text-ink border-2 border-paper"
            : "text-paper-muted hover:text-paper border-2 border-transparent"
        }`}
      >
        View
      </button>
      <button
        type="button"
        onClick={() => onModeChange("edit")}
        className={`rounded-md px-3 py-1 text-xs font-bold transition-all ${
          mode === "edit"
            ? "bg-paper text-ink border-2 border-paper"
            : "text-paper-muted hover:text-paper border-2 border-transparent"
        }`}
      >
        Edit
      </button>
    </div>
  );
}
