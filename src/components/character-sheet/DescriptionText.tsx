"use client";

interface DescriptionTextProps {
  children: React.ReactNode;
  className?: string;
}

export function DescriptionText({ children, className }: DescriptionTextProps) {
  return (
    <p className={`text-sm text-[var(--color-text-secondary)] leading-relaxed font-medium ${className || ""}`}>
      {children}
    </p>
  );
}
