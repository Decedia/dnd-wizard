"use client";

type Mode = "view" | "edit";

interface ViewEditToggleProps {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
}

export function ViewEditToggle({ mode, onModeChange }: ViewEditToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-parchment/20 bg-charcoal/80 p-1">
      <button
        type="button"
        onClick={() => onModeChange("view")}
        className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
          mode === "view"
            ? "bg-parchment/10 text-parchment"
            : "text-parchment/50 hover:text-parchment"
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
            : "text-parchment/50 hover:text-parchment"
        }`}
      >
        Edit
      </button>
    </div>
  );
}
