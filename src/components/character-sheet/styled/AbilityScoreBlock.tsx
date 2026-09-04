"use client";

import { useState } from "react";
import { StarIcon as Star } from "@/components/icons";

interface AbilityScoreBlockProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  editMode?: boolean;
  recommended?: boolean;
}

export function AbilityScoreBlock({ label, value, onChange, onBlur, editMode, recommended }: AbilityScoreBlockProps) {
  const [editing, setEditing] = useState(false);
  const mod = Math.floor((value - 10) / 2);

  if (!editMode) {
    return (
      <div className="stat-box-light">
        <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1">
          {label}
          {recommended && <Star className="h-3 w-3 text-amber-500" />}
        </span>
        <span className={`text-lg font-bold ${mod >= 0 ? "text-ink" : "text-ink-muted"}`}>
          {mod >= 0 ? `+${mod}` : mod}
        </span>
        <span className="text-[10px] font-semibold text-ink-muted mt-0.5">{value}</span>
      </div>
    );
  }

  return (
    <div className="stat-box-light">
      <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1">
        {label}
        {recommended && <Star className="h-3 w-3 text-amber-500" />}
      </span>
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
          className="w-10 bg-transparent text-center text-lg font-bold text-ink outline-none"
        />
      ) : (
        <>
          <span className={`text-lg font-bold ${mod >= 0 ? "text-ink" : "text-ink-muted"}`}>
            {mod >= 0 ? `+${mod}` : mod}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[10px] font-semibold text-ink-muted mt-0.5 hover:text-ink transition-colors"
          >
            {value}
          </button>
        </>
      )}
    </div>
  );
}
