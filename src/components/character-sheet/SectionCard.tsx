import { ReactNode } from "react";

interface SectionCardProps {
  id: string;
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function SectionCard({ id, title, icon, children }: SectionCardProps) {
  return (
    <section
      id={id}
      className="rounded-xl border border-border bg-charcoal-light p-4 mb-4"
    >
      {title && (
        <div className="flex items-center gap-2 mb-3">
          {icon && <span className="text-text-muted flex-shrink-0">{icon}</span>}
          <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{title}</span>
        </div>
      )}
      {children}
    </section>
  );
}
