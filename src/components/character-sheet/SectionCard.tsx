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
      className="rounded-xl border border-border bg-charcoal-light p-4 mb-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="text-accent">{icon}</span>
        <h2 className="text-xs font-bold text-accent uppercase tracking-widest">{title}</h2>
      </div>
      {children}
    </section>
  );
}
