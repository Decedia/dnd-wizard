"use client";

interface SourceBadgeProps {
  source: string;
  size?: "sm" | "md";
}

const SOURCE_COLORS: Record<string, { bg: string; text: string }> = {
  PHB: { bg: "#dbeafe", text: "#1d4ed8" },
  SCAG: { bg: "#dcfce7", text: "#15803d" },
  XGE: { bg: "#ffedd5", text: "#c2410c" },
  TCE: { bg: "#f3e8ff", text: "#7e22ce" },
  MTF: { bg: "#fee2e2", text: "#b91c1c" },
  EGW: { bg: "#ccfbf1", text: "#0f766e" },
  FTD: { bg: "#fce7f3", text: "#be185d" },
  VRGR: { bg: "#e0e7ff", text: "#4338ca" },
};

const SOURCE_NAMES: Record<string, string> = {
  PHB: "Player's Handbook",
  SCAG: "Sword Coast Adventurer's Guide",
  XGE: "Xanathar's Guide to Everything",
  TCE: "Tasha's Cauldron of Everything",
  MTF: "Mordenkainen's Tome of Foes",
  EGW: "Explorer's Guide to Wildemount",
  FTD: "Fizban's Treasury of Dragons",
  VRGR: "Van Richten's Guide to Ravenloft",
};

export function SourceBadge({ source, size = "sm" }: SourceBadgeProps) {
  const colors = SOURCE_COLORS[source] || { bg: "#f3f4f6", text: "#374151" };

  return (
    <span
      className="inline-flex items-center font-semibold"
      style={{
        fontSize: size === "sm" ? "9px" : "11px",
        padding: size === "sm" ? "1px 5px" : "3px 8px",
        borderRadius: "4px",
        backgroundColor: colors.bg,
        color: colors.text,
        letterSpacing: "0.02em",
      }}
      title={SOURCE_NAMES[source] || source}
    >
      {source}
    </span>
  );
}

export const SOURCE_OPTIONS = [
  { id: "PHB", name: "Player's Handbook" },
  { id: "SCAG", name: "Sword Coast Adventurer's Guide" },
  { id: "XGE", name: "Xanathar's Guide to Everything" },
  { id: "TCE", name: "Tasha's Cauldron of Everything" },
  { id: "MTF", name: "Mordenkainen's Tome of Foes" },
  { id: "EGW", name: "Explorer's Guide to Wildemount" },
  { id: "FTD", name: "Fizban's Treasury of Dragons" },
  { id: "VRGR", name: "Van Richten's Guide to Ravenloft" },
];

export function getSourceName(source: string): string {
  return SOURCE_NAMES[source] || source;
}
