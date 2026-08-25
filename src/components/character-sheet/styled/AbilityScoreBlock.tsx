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
      <div className="stat-box-light">
        <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">{label}</span>
        <span className={`text-lg font-bold ${mod >= 0 ? "text-paper" : "text-ink-muted"}`}>
          {mod >= 0 ? `+${mod}` : mod}
        </span>
        <span className="text-[10px] font-semibold text-ink-muted mt-0.5">{value}</span>
      </div>
    );
  }

  return (
    <div className="stat-box-light">
      <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">{label}</span>
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
          className="w-10 bg-transparent text-center text-lg font-bold text-paper outline-none"
        />
      ) : (
        <>
          <span className={`text-lg font-bold ${mod >= 0 ? "text-paper" : "text-ink-muted"}`}>
            {mod >= 0 ? `+${mod}` : mod}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[10px] font-semibold text-ink-muted mt-0.5 hover:text-paper transition-colors"
          >
            {value}
          </button>
        </>
      )}
    </div>
  );
}
