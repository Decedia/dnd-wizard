"use client";

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
        className={`btn rounded-md px-2.5 py-1 text-[11px] ${
          mode === "view"
            ? "btn btn-primary"
            : "btn btn-secondary"
        }`}
      >
        View
      </button>
      <button
        type="button"
        onClick={() => onModeChange("edit")}
        className={`btn rounded-md px-2.5 py-1 text-[11px] ${
          mode === "edit"
            ? "btn btn-primary"
            : "btn btn-secondary"
        }`}
      >
        Edit
      </button>
    </div>
  );
}
