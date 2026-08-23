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
      {children}
    </section>
  );
}
