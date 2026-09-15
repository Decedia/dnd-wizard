"use client";

import { CheckIcon as Check, LockIcon } from "@/components/icons";

interface BookCardProps {
  id: string;
  abbr: string;
  name: string;
  tags: string[];
  locked: boolean;
  selected: boolean;
  onToggle: () => void;
  color: string;
  stripColor: string;
  icon: string;
  patternSvg: React.ReactNode;
}

export function BookCard({
  id,
  abbr,
  name,
  tags,
  locked,
  selected,
  onToggle,
  color,
  stripColor,
  icon,
  patternSvg,
}: BookCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={locked}
      className="w-full text-left rounded-[14px] overflow-hidden bg-white"
      style={{
        boxShadow: selected ? "0 2px 8px rgba(0,0,0,0.12)" : "0 1px 3px rgba(0,0,0,0.06)",
        border: selected ? "2px solid #111111" : "2px solid transparent",
        transition: "all 0.18s ease",
        cursor: locked ? "default" : "pointer",
        pointerEvents: locked ? "none" : "auto",
        opacity: locked ? 0.9 : 1,
      }}
    >
      {/* Top section */}
      <div
        style={{
          position: "relative",
          height: 72,
          overflow: "hidden",
          backgroundColor: color,
        }}
      >
        {/* Pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.12,
            pointerEvents: "none",
          }}
        >
          {patternSvg}
        </div>

        {/* Icon */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            fontSize: 28,
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
          }}
        >
          {icon}
        </div>

        {/* Checkmark / Lock badge */}
        <div
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 20,
            height: 20,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: locked ? "rgba(0,0,0,0.3)" : selected ? "#111111" : "rgba(0,0,0,0.3)",
            transition: "background 0.18s ease",
          }}
        >
          {locked ? (
            <span style={{ fontSize: 10 }}>🔒</span>
          ) : (
            <span style={{ fontSize: 10, color: selected ? "#ffffff" : "rgba(255,255,255,0.4)", transition: "color 0.18s ease" }}>
              {selected ? "✓" : "○"}
            </span>
          )}
        </div>

        {/* Accent strip */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            backgroundColor: stripColor,
            opacity: selected ? 1 : 0,
            transition: "opacity 0.18s ease",
          }}
        />
      </div>

      {/* Body */}
      <div style={{ padding: "8px 8px 10px" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#111", letterSpacing: "0.02em", marginBottom: 1 }}>
          {abbr}
        </div>
        <div style={{ fontSize: 9, color: "#888", lineHeight: 1.3, marginBottom: 6 }}>{name}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 8,
                fontWeight: 500,
                padding: "2px 5px",
                borderRadius: 4,
                background: "#f0f0f0",
                color: "#666",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
