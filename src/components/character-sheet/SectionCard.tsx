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
      className="scroll-mt-20 rounded-full border border-parchment/10 bg-charcoal-light/60 p-4 mb-4"
    >
      <div className="mb-3 flex items-center gap-2 border-b border-parchment/10 pb-3">
        <span className="text-gold">{icon}</span>
        <h2 className="font-display text-lg font-semibold text-parchment">{title}</h2>
      </div>
      {children}
    </section>
  );
}
