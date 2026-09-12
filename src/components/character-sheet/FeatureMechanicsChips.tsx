"use client";

import React from "react";
import { SwordIcon, UserIcon, StarIcon, ClockIcon as ClockIconBase } from "@/components/icons";
import { InfoButton } from "@/components/InfoButton";

interface FeatureMechanicsSummaryProps {
  summary?: string | null;
  description?: string | null;
  featureType?: string | null;
  actionType?: string | null;
  uses?: { total: number | string; recharge: string; current: number } | null;
  requirement?: string | null;
  duration?: string | null;
  endsIf?: string | null;
  effect?: string | null;
  onUse?: string | null;
  scaling?: string | null;
  source?: { type: string; name: string; level: number | null } | null;
  book?: string | null;
  onUseClick?: () => void;
  showInSheet?: boolean;
  size?: "sm" | "md";
}

function Badge({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: "3px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: 500,
    padding: "2px 8px",
    border: "1.5px solid",
    ...style,
  };
  return <span style={base}>{children}</span>;
}

function Cell({ label, value, style }: { label: string; value: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        padding: "8px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "3px",
        ...style,
      }}
    >
      <span
        style={{
          fontSize: "10px",
          fontWeight: 600,
          color: "#aaa",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: "3px",
        }}
      >
        {label}
      </span>
      <div
        style={{
          fontSize: "13px",
          fontWeight: 500,
          color: "#111",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          flexWrap: "wrap",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function BlankCell() {
  return <div style={{ backgroundColor: "#ffffff", padding: "8px 12px" }} />;
}

const SourceIcon = ({ type }: { type?: string }) => {
  const Icon = type === "race" ? UserIcon : type === "subclass" ? StarIcon : SwordIcon;
  return <Icon className="h-3.5 w-3.5" style={{ color: "#888" }} />;
};

export function FeatureMechanicsChips({
  summary,
  description,
  featureType,
  actionType,
  uses,
  requirement,
  duration,
  endsIf,
  effect,
  onUse,
  scaling,
  source,
  book,
  onUseClick,
  showInSheet = true,
  size = "sm",
}: FeatureMechanicsSummaryProps) {
  const hasUses = !!uses;
  const hasRequirement = !!requirement;
  const hasDuration = !!duration;
  const hasEndsIf = !!endsIf && endsIf !== "Effect ends when duration expires";
  const hasOnUse = !!onUse;
  const hasScaling = !!scaling;

  const normalizedDescription = Array.isArray(description) ? description.filter(Boolean).join(" ") : (description || "");
  const resolvedSummary = summary || (normalizedDescription ? normalizedDescription.split(/[.\n]/)[0].trim().split(/\s+/).slice(0, 12).join(" ") : null);

  const effectiveFeatureType = featureType || "Passive";
  const showUseButton = effectiveFeatureType === "Active";

  const rows: (React.ReactNode | [React.ReactNode, React.ReactNode])[] = [];

  // Row 0: Source icon+name | Book tag (always shown)
  const sourceSource = (source || {}) as { type?: string; name?: string; level?: number | null };
  const sourceValue = sourceSource.type ? (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "#111", fontWeight: 500, fontSize: "13px" }}>
      <SourceIcon type={sourceSource.type} />
      {sourceSource.name}
    </span>
  ) : (
    <span style={{ color: "#aaa", fontWeight: 500, fontSize: "13px" }}>—</span>
  );

  const bookValue = book ? (
    <span
      style={{
        backgroundColor: "#111",
        color: "#fff",
        fontSize: "10px",
        fontWeight: 600,
        padding: "2px 7px",
        borderRadius: "4px",
      }}
    >
      {book}
    </span>
  ) : (
    <span style={{ color: "#aaa", fontWeight: 500, fontSize: "13px" }}>—</span>
  );

  rows.push([
    <Cell key="source" label="Source" value={sourceValue} />,
    <Cell key="book" label="Book" value={bookValue} />,
  ]);

  // Row 1: Type | Action
  const typeBadge = effectiveFeatureType === "Active" ? (
    <Badge style={{ backgroundColor: "#ebf8ff", borderColor: "#90cdf4", color: "#2b6cb0" }}>Active</Badge>
  ) : (
    <Badge style={{ backgroundColor: "#f0f0f0", borderColor: "#e0e0e0", color: "#666" }}>Passive</Badge>
  );

  const actionValue = actionType ? (
    <span style={{ color: "#111", fontWeight: 500, fontSize: "13px" }}>{actionType}</span>
  ) : (
    <span style={{ color: "#aaa", fontWeight: 500, fontSize: "13px" }}>Passive</span>
  );

  rows.push([
    <Cell key="type" label="Type" value={typeBadge} />,
    <Cell key="action" label="Action" value={actionValue} />,
  ]);

  // Row 2: Source | Uses
  const sourceDetailValue = sourceSource.type ? (
    <span style={{ color: "#111", fontWeight: 500, fontSize: "13px" }}>
      {sourceSource.name}{sourceSource.type === "race" ? " · Racial" : ` · Level ${sourceSource.level ?? "?"}`}
    </span>
  ) : (
    <span style={{ color: "#aaa", fontWeight: 500, fontSize: "13px" }}>—</span>
  );

  const usesValue = hasUses && uses ? (
    <span style={{ color: "#111", fontWeight: 500, fontSize: "13px" }}>
      {typeof uses.total === "number" ? `${uses.total}` : (uses.total || "?")} / {uses.recharge || "?"}
    </span>
  ) : (
    <span style={{ color: "#aaa", fontWeight: 500, fontSize: "13px" }}>Unlimited</span>
  );

  rows.push([
    <Cell key="source-detail" label="Source" value={sourceDetailValue} />,
    <Cell key="uses" label="Uses" value={usesValue} />,
  ]);

  // Row 3: On Use | Requires (if has onUse OR requirement)
  if (hasOnUse || hasRequirement) {
    rows.push([
      hasOnUse ? (
        <Cell key="onUse" label="On Use" value={<span style={{ color: "#111", fontWeight: 500, fontSize: "13px" }}>{onUse}</span>} />
      ) : (
        <BlankCell key="onUse-blank" />
      ),
      hasRequirement ? (
        <Cell key="requires" label="Requires" value={<span style={{ color: "#111", fontWeight: 500, fontSize: "13px" }}>{requirement}</span>} />
      ) : (
        <BlankCell key="requires-blank" />
      ),
    ]);
  }

  // Row 4: Duration | Ends If (if has duration OR endsIf)
  if (hasDuration || hasEndsIf) {
    rows.push([
      hasDuration ? (
        <Cell key="duration" label="Duration" value={<span style={{ color: "#111", fontWeight: 500, fontSize: "13px" }}>{duration}</span>} />
      ) : (
        <BlankCell key="duration-blank" />
      ),
      hasEndsIf ? (
        <Cell key="endsIf" label="Ends If" value={<span style={{ color: "#2b6cb0", fontWeight: 500, fontSize: "13px" }}>{endsIf}</span>} />
      ) : (
        <BlankCell key="endsIf-blank" />
      ),
    ]);
  }

  // Row 5: Scales | blank (if has scaling)
  if (hasScaling) {
    rows.push([
      <Cell key="scales" label="Scales" value={<span style={{ color: "#6b46c1", fontWeight: 500, fontSize: "13px" }}>{scaling}</span>} />,
      <BlankCell key="scales-blank" />,
    ]);
  }

  let gridRows: React.ReactNode;
  try {
    gridRows = rows.map((row, idx) => (
      <React.Fragment key={idx}>
        {Array.isArray(row) ? (
          <>
            {row[0]}
            {row[1]}
          </>
        ) : (
          row
        )}
      </React.Fragment>
    ));
  } catch {
    gridRows = null;
  }

  const footer = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#fafafa",
        borderTop: "1px solid #f0f0f0",
        padding: "8px 14px",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "12px", color: "#aaa" }}>
        <ClockIconBase className="h-3.5 w-3.5" />
        {duration || "Passive"}
      </span>
      <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
        {showUseButton && (
          <button
            type="button"
            onClick={onUseClick}
            style={{
              backgroundColor: "#fff",
              border: "1.5px solid #111",
              color: "#000",
              borderRadius: "999px",
              padding: "5px 14px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Use
          </button>
        )}
        {description && <InfoButton title="Feature Details" description={description} />}
      </div>
    </div>
  );

  return (
    <div
      style={{
        backgroundColor: "var(--color-bg)",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "8px 14px", background: "#fff" }}>
        <p style={{ fontSize: "15px", fontWeight: 500, color: "#111", lineHeight: 1.5 }}>
          {resolvedSummary || "\u00A0"}
        </p>
      </div>
      {showInSheet && gridRows && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1px",
            backgroundColor: "#f0f0f0",
            borderTop: "1px solid #f0f0f0",
            borderBottom: "1px solid #f0f0f0",
          }}
        >
          {gridRows}
        </div>
      )}
      {footer}
    </div>
  );
}
