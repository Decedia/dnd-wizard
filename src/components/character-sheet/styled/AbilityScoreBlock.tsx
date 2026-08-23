"use client";

import { useState } from "react";

interface AbilityScoreBlockProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  editMode?: boolean;
}

export function AbilityScoreBlock({ label, value, onChange, onBlur, editMode }: AbilityScoreBlockProps) {
  const [editing, setEditing] = useState(false);
  const mod = Math.floor((value - 10) / 2);

  if (!editMode) {
    return (
      <div className="flex flex-col items-center rounded-lg border border-border bg-charcoal p-3">
        <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{label}</span>
        <span className={`text-lg font-bold ${mod >= 0 ? "text-accent" : "text-red-300"}`}>
          {mod >= 0 ? `+${mod}` : mod}
        </span>
        <span className="text-[10px] font-semibold text-text-muted mt-1">{value}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-charcoal p-3">
      <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">{label}</span>
      {editing ? (
        <input
          type="number"
          autoFocus
          value={value}
          onChange={(e) => onChange(Math.max(1, parseInt(e.target.value || "10", 10)))}
          onBlur={() => {
            setEditing(false);
            onBlur?.();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setEditing(false);
              onBlur?.();
            }
          }}
          className="w-10 bg-transparent text-center text-lg font-bold text-parchment outline-none"
        />
      ) : (
        <>
          <span className={`text-lg font-bold ${mod >= 0 ? "text-accent" : "text-red-300"}`}>
            {mod >= 0 ? `+${mod}` : mod}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[10px] font-semibold text-text-muted mt-1 hover:text-parchment"
          >
            {value}
          </button>
        </>
      )}
    </div>
  );
}
