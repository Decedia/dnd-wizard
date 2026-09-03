"use client";

interface SourceBadgeProps {
  source: string;
  size?: "sm" | "md";
}

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

const SOURCE_COLORS: Record<string, { bgVar: string; textVar: string }> = {
  PHB: { bgVar: "--color-source-phb-bg", textVar: "--color-source-phb-text" },
  SCAG: { bgVar: "--color-source-scag-bg", textVar: "--color-source-scag-text" },
  XGE: { bgVar: "--color-source-xge-bg", textVar: "--color-source-xge-text" },
  TCE: { bgVar: "--color-source-tce-bg", textVar: "--color-source-tce-text" },
  MTF: { bgVar: "--color-source-mtf-bg", textVar: "--color-source-mtf-text" },
  EGW: { bgVar: "--color-source-egw-bg", textVar: "--color-source-egw-text" },
  FTD: { bgVar: "--color-source-ftd-bg", textVar: "--color-source-ftd-text" },
  VRGR: { bgVar: "--color-source-vrgr-bg", textVar: "--color-source-vrgr-text" },
};

export function SourceBadge({ source, size = "sm" }: SourceBadgeProps) {
  const colors = SOURCE_COLORS[source] || { bgVar: "--color-bg", textVar: "--color-text-secondary" };

  return (
    <span
      className="inline-flex items-center font-semibold"
      style={{
        fontSize: size === "sm" ? "9px" : "11px",
        padding: size === "sm" ? "1px 5px" : "3px 8px",
        borderRadius: "4px",
        backgroundColor: `var(${colors.bgVar})`,
        color: `var(${colors.textVar})`,
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