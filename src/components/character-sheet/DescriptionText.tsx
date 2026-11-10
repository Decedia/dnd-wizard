"use client";

import { RichText } from "@/components/RichText";

interface DescriptionTextProps {
  children: React.ReactNode;
  className?: string;
}

export function DescriptionText({ children, className }: DescriptionTextProps) {
  if (typeof children === "string") {
    return (
      <RichText text={children} className={`text-xs text-[var(--color-text-secondary)] ${className || ""}`} />
    );
  }

  return (
    <p className={`text-sm text-[var(--color-text-secondary)] leading-relaxed font-medium ${className || ""}`}>
      {children}
    </p>
  );
}
