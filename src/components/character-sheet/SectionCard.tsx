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
        className="card p-4 mb-4"
      >
      {title && (
        <div className="section-title-light text-paper">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {title}
        </div>
      )}
      {children}
    </section>
  );
}
