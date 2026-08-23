"use client";

type Mode = "view" | "edit";

interface ViewEditToggleProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

export function ViewEditToggle({ mode, onModeChange }: ViewEditToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-charcoal/80 p-1">
      <button
        type="button"
        onClick={() => onModeChange("view")}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
          mode === "view"
            ? "bg-charcoal-lighter text-parchment border border-border"
            : "text-text-muted hover:text-parchment"
        }`}
      >
        View
      </button>
      <button
        type="button"
        onClick={() => onModeChange("edit")}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
          mode === "edit"
            ? "bg-burgundy text-parchment"
            : "text-text-muted hover:text-parchment"
        }`}
      >
        Edit
      </button>
    </div>
  );
}
