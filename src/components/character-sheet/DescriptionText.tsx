"use client";

interface DescriptionTextProps {
  children: React.ReactNode;
  className?: string;
}

export function DescriptionText({ children, className }: DescriptionTextProps) {
  return (
    <p className={`text-sm text-parchment/70 leading-relaxed ${className || ""}`}>
      {children}
    </p>
  );
}
