"use client";

import { useState } from "react";

interface AbilityScoreBlockProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
}

export function AbilityScoreBlock({ label, value, onChange, onBlur }: AbilityScoreBlockProps) {
  const [editing, setEditing] = useState(false);
  const mod = Math.floor((value - 10) / 2);

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex flex-col items-center">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="group flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 border-gold/40 bg-charcoal-light shadow-lg shadow-burgundy/10 transition-all hover:border-gold/60 active:scale-95"
          aria-label={`${label} score`}
        >
          <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider">{label}</span>
          <span className={`text-lg font-bold ${mod >= 0 ? "text-gold" : "text-red-300"}`}>
            {mod >= 0 ? `+${mod}` : mod}
          </span>
        </button>
        {editing && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-charcoal/90 backdrop-blur-sm">
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
          </div>
        )}
      </div>
      <div className="mt-1 rounded-full border border-parchment/20 bg-charcoal/60 px-2 py-0.5">
        <span className="text-[10px] font-semibold text-parchment/80">{value}</span>
      </div>
    </div>
  );
}
