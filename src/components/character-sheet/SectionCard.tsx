import { ReactNode } from "react";

interface SectionCardProps {
  id: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

export function SectionCard({ id, title, icon, children }: SectionCardProps) {
  return (
    <section
      id={id}
      className="scroll-mt-20 rounded-lg border border-border bg-charcoal-light p-4 mb-4"
    >
      <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
        <span className="text-burgundy">{icon}</span>
        <h2 className="font-display text-sm font-semibold text-parchment uppercase tracking-wider">{title}</h2>
      </div>
      {children}
    </section>
  );
}
