"use client";

import { useState } from "react";
import { CheckIcon as Check, LockIcon } from "@/components/icons";

interface BookCardProps {
  abbr: string;
  name: string;
  background: string;
  tags: string[];
  selected: boolean;
  locked?: boolean;
  onToggle: () => void;
  patternSvg: React.ReactNode;
  illustrationSvg: React.ReactNode;
}

export function BookCard({
  abbr,
  name,
  background,
  tags,
  selected,
  locked = false,
  onToggle,
  patternSvg,
  illustrationSvg,
}: BookCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={locked}
      className="w-full text-left rounded-[16px] overflow-hidden transition-all duration-150 ease-out"
      style={{
        background: "var(--surface-2)",
        border: "2px solid transparent",
        boxShadow: selected ? "0 0 0 2px #111111" : "none",
        cursor: locked ? "default" : "pointer",
        pointerEvents: locked ? "none" : "auto",
        opacity: locked ? 0.9 : 1,
      }}
    >
      <div
        className="relative h-[90px] overflow-hidden"
        style={{ background }}
      >
        <div className="absolute inset-0 opacity-[0.13] pointer-events-none">
          {patternSvg}
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-11 h-11 opacity-85">
            {illustrationSvg}
          </div>
        </div>
        <div
          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
          style={{
            background: selected ? "#111111" : "rgba(0,0,0,0.15)",
          }}
        >
          {locked ? (
            <LockIcon className="h-2.5 w-2.5 text-white opacity-90" />
          ) : (
            <Check
              className="h-2.5 w-2.5"
              style={{ color: selected ? "#ffffff" : "rgba(255,255,255,0.5)" }}
            />
          )}
        </div>
      </div>
      <div className="px-3 pb-3 pt-2">
        <div className="text-[14px] font-medium text-[var(--color-text-primary)]">{abbr}</div>
        <div className="text-[10px] text-[var(--color-text-secondary)] leading-[1.3] mt-[1px] mb-[6px]">{name}</div>
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-medium px-[5px] py-[2px] rounded border border-[var(--color-border)] bg-[var(--surface-1)] text-[var(--color-text-secondary)]"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
