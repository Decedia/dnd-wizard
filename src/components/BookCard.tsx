"use client";

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
  const visibleTags = tags.slice(0, 2);

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={locked}
      className="flex flex-col w-full text-left rounded-[14px] overflow-hidden"
      style={{
        background: "var(--color-surface)",
        boxShadow: selected ? "0 2px 8px rgba(0,0,0,0.12)" : "0 1px 3px rgba(0,0,0,0.06)",
        border: selected ? "2px solid var(--color-border-active)" : "2px solid var(--color-border)",
        transition: "all 0.18s ease",
        cursor: locked ? "default" : "pointer",
        pointerEvents: locked ? "none" : "auto",
        opacity: locked ? 0.9 : 1,
        height: "100%",
      }}
    >
      {/* Top section */}
      <div
        style={{
          position: "relative",
          height: 60,
          overflow: "hidden",
          backgroundColor: color,
          flexShrink: 0,
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
            fontSize: 22,
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
            background: locked ? "rgba(0,0,0,0.3)" : selected ? "var(--color-text-primary)" : "rgba(0,0,0,0.3)",
            transition: "background 0.18s ease",
          }}
        >
          {locked ? (
            <span style={{ fontSize: 10 }}>🔒</span>
          ) : (
            <span
              style={{
                fontSize: 10,
                color: selected ? "var(--color-surface)" : "rgba(255,255,255,0.4)",
                transition: "color 0.18s ease",
              }}
            >
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
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          padding: "6px 6px 8px",
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--color-text-primary)",
            letterSpacing: "0.02em",
            marginBottom: 1,
            lineHeight: 1.2,
          }}
        >
          {abbr}
        </div>
        <div
          style={{
            fontSize: 8,
            color: "var(--color-text-secondary)",
            lineHeight: 1.3,
            marginBottom: 4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {name}
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 3,
            marginTop: "auto",
          }}
        >
          {visibleTags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 7,
                fontWeight: 500,
                padding: "1px 4px",
                borderRadius: 4,
                background: "var(--color-bg)",
                color: "var(--color-text-muted)",
                lineHeight: 1.4,
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
