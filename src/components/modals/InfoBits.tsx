"use client";

import { ReactNode } from "react";
import { DiceText } from "@/components/DiceText";

interface InfoSectionLabelProps {
  children: ReactNode;
  className?: string;
}

export function InfoSectionLabel({ children, className = "" }: InfoSectionLabelProps) {
  return (
    <span
      className={`block text-[10px] font-bold uppercase tracking-wider text-ink-muted ${className}`}
    >
      {children}
    </span>
  );
}

interface InfoCardProps {
  label?: ReactNode;
  labelClassName?: string;
  children: ReactNode;
  className?: string;
}

export function InfoCard({ label, labelClassName, children, className = "" }: InfoCardProps) {
  return (
    <div className={`rounded-2xl border-2 border-border-strong bg-surface p-4 ${className}`}>
      {label && <InfoSectionLabel className={labelClassName}>{label}</InfoSectionLabel>}
      <div className={label ? "mt-1.5" : ""}>{children}</div>
    </div>
  );
}

export function InfoCallout({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-ink/5 p-4">
      <InfoSectionLabel>{label}</InfoSectionLabel>
      <p className="mt-1 text-sm font-bold leading-relaxed text-ink">{children}</p>
    </div>
  );
}

interface InfoStatTileProps {
  label: ReactNode;
  value: ReactNode;
  emptyText?: string;
}

export function InfoStatTile({ label, value, emptyText = "—" }: InfoStatTileProps) {
  return (
    <div className="rounded-xl border-2 border-border-strong bg-surface p-3">
      <InfoSectionLabel>{label}</InfoSectionLabel>
      <p className="mt-0.5 text-sm font-bold text-ink">{value || emptyText}</p>
    </div>
  );
}

export function InfoChip({ children, emphasis = false }: { children: ReactNode; emphasis?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border-2 px-2 py-1 text-xs font-bold text-ink ${
        emphasis ? "border-ink bg-ink/10" : "border-border-strong bg-paper-muted"
      }`}
    >
      {children}
    </span>
  );
}

export function InfoBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-paper-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
      {children}
    </span>
  );
}

interface InfoProseProps {
  text: string;
  className?: string;
}

export function InfoProse({ text, className = "" }: InfoProseProps) {
  return (
    <div className={className}>
      <DiceText text={text} />
    </div>
  );
}

export function InfoTraitList({
  traits,
  emptyText,
}: {
  traits: { name: string; summary?: string; description?: string }[];
  emptyText: string;
}) {
  if (traits.length === 0) {
    return <p className="mt-1.5 text-xs text-ink-muted">{emptyText}</p>;
  }
  return (
    <div className="mt-1.5 space-y-2">
      {traits.map((trait, index) => (
        <div
          key={`${trait.name}-${index}`}
          className="rounded-xl border-2 border-border-strong bg-surface p-3"
        >
          <h4 className="text-sm font-bold text-ink">{trait.name}</h4>
          <div className="mt-1">
            <DiceText text={trait.summary || trait.description || ""} />
          </div>
        </div>
      ))}
    </div>
  );
}
