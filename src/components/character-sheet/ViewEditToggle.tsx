"use client";

type Mode = "view" | "edit";

interface ViewEditToggleProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

export function ViewEditToggle({ mode, onModeChange }: ViewEditToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-xl border-[3px] border-paper bg-ink p-1 shrink-0">
      <button
        type="button"
        onClick={() => onModeChange("view")}
        className={`btn rounded-xl px-3 py-1 text-xs ${
          mode === "view"
            ? "btn-primary"
            : "btn-secondary"
        }`}
      >
        View
      </button>
      <button
        type="button"
        onClick={() => onModeChange("edit")}
        className={`btn rounded-xl px-3 py-1 text-xs ${
          mode === "edit"
            ? "btn-primary"
            : "btn-secondary"
        }`}
      >
        Edit
      </button>
    </div>
  );
}
