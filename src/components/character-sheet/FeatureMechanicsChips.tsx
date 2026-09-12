"use client";

import React from "react";

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

function Cell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        padding: "8px 12px",
        display: "flex",
        flexDirection: "column",
        gap: "3px",
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
  showInSheet = true,
  size = "sm",
}: FeatureMechanicsSummaryProps) {
  const hasUses = !!uses;
  const hasRequirement = !!requirement;
  const hasDuration = !!duration;
  const hasEndsIf = !!endsIf && endsIf !== "Effect ends when duration expires";
  const hasOnUse = !!onUse;
  const hasScaling = !!scaling;

  // Derive summary from description if missing
  const normalizedDescription = Array.isArray(description) ? description.filter(Boolean).join(" ") : (description || "");
  const resolvedSummary = summary || (normalizedDescription ? normalizedDescription.split(/[.\n]/)[0].trim().split(/\s+/).slice(0, 12).join(" ") : null);

  // Default featureType to Passive badge
  const effectiveFeatureType = featureType || "Passive";

  const rows: [React.ReactNode, React.ReactNode][] = [];

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
  let sourceValue: React.ReactNode;
  if (source) {
    if (source.type === "race") {
      sourceValue = <span style={{ color: "#111", fontWeight: 500, fontSize: "13px" }}>{source.name} · Racial</span>;
    } else {
      sourceValue = <span style={{ color: "#111", fontWeight: 500, fontSize: "13px" }}>{source.name} · Level {source.level}</span>;
    }
  } else {
    sourceValue = <span style={{ color: "#aaa", fontWeight: 500, fontSize: "13px" }}>—</span>;
  }

  const usesValue = hasUses ? (
    <span style={{ color: "#111", fontWeight: 500, fontSize: "13px" }}>
      {typeof uses.total === "number" ? `${uses.total}` : uses.total} / {uses.recharge}
    </span>
  ) : (
    <span style={{ color: "#aaa", fontWeight: 500, fontSize: "13px" }}>Unlimited</span>
  );

  rows.push([
    <Cell key="source" label="Source" value={sourceValue} />,
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

  return (
    <div
      style={{
        backgroundColor: "var(--color-bg)",
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      {resolvedSummary && (
        <div style={{ padding: "8px 14px", background: "#fff" }}>
          <p style={{ fontSize: "14px", fontWeight: 500, color: "#333", lineHeight: 1.5 }}>{resolvedSummary}</p>
        </div>
      )}
      {showInSheet && (
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
          {rows.map(([left, right], idx) => (
            <React.Fragment key={idx}>
              {left}
              {right}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
