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
        className="card p-4 mb-3"
        data-pdf-section
      >
      {title && (
        <div className="section-title-light">
          {icon && <span className="inline-flex items-center flex-shrink-0 opacity-70">{icon}</span>}
          {title}
        </div>
      )}
      {children}
    </section>
  );
}
