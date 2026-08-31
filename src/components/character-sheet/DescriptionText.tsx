"use client";

import { FormattedDescription } from "@/components/FormattedDescription";

interface DescriptionTextProps {
  children: React.ReactNode;
  className?: string;
}

export function DescriptionText({ children, className }: DescriptionTextProps) {
  if (typeof children === "string") {
    return (
      <FormattedDescription className={className}>{children}</FormattedDescription>
    );
  }

  return (
    <p className={`text-sm text-[var(--color-text-secondary)] leading-relaxed font-medium ${className || ""}`}>
      {children}
    </p>
  );
}
