"use client";

import { ReactNode } from "react";
import {
  StarIcon as Star,
  InfoIcon as Info,
  CaretDownIcon as ChevronDown,
} from "@/components/icons";

export interface SplitSelectionCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  badges?: string[];
  isRecommended?: boolean;
  onSelect: () => void;
  onInfoToggle: (e: React.MouseEvent) => void;
  infoType: "modal" | "expand";
  isExpanded?: boolean;
  expandedContent?: ReactNode;
  isSelected?: boolean;
}

export function SplitSelectionCard({
  title,
  subtitle,
  icon,
  badges = [],
  isRecommended = false,
  onSelect,
  onInfoToggle,
  infoType,
  isExpanded = false,
  expandedContent,
  isSelected = false,
}: SplitSelectionCardProps) {
  return (
    <div className="relative overflow-visible">
      {isRecommended && (
        <span className="absolute -top-3 -left-3 w-8 h-8 text-amber-400 drop-shadow-md z-10">
          <Star className="h-8 w-8 fill-amber-400" />
        </span>
      )}

      <div
        className={`flex flex-row rounded-2xl overflow-hidden ${
          isSelected
            ? "border border-[var(--color-accent-indigo-500)] bg-[var(--color-accent-indigo-50)]"
            : "border border-[var(--color-border)] bg-[var(--color-surface)]"
        }`}
      >
        <button
          type="button"
          onClick={onSelect}
          className="flex-1 p-3.5 hover:bg-[var(--color-bg)]/50 transition text-left flex items-start gap-3"
        >
          {icon && (
            <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--color-bg)]">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                {title}
              </span>
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[var(--color-bg)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                >
                  {badge}
                </span>
              ))}
            </div>
            {subtitle && (
              <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={onInfoToggle}
          className="w-14 border-l border-[var(--color-border)] flex items-center justify-center hover:bg-[var(--color-bg)]/50 transition shrink-0"
        >
          {infoType === "expand" ? (
            <ChevronDown
              className={`h-5 w-5 text-[var(--color-text-muted)] transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          ) : (
            <Info className="h-5 w-5 text-[var(--color-text-muted)]" />
          )}
        </button>
      </div>

      {infoType === "expand" && isExpanded && expandedContent && (
        <div className="mt-2 p-3 bg-[var(--color-surface)]/80 rounded-xl border border-[var(--color-border)]">
          {expandedContent}
        </div>
      )}
    </div>
  );
}
