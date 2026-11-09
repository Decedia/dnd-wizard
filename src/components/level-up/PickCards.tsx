"use client";

import { CheckIcon as Check } from "@/components/icons";

export type PickCard = {
  key: string;
  title: string;
  tag?: string;
  why: string;
  selected: boolean;
  disabled?: boolean;
};

/** Up to three suggested options, each with a one-line reason. Tapping one picks it. */
export function PickCards({ label, cards, onPick }: { label: string; cards: PickCard[]; onPick: (key: string) => void }) {
  if (cards.length === 0) return null;
  return (
    <div className="space-y-2">
      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{label}</div>
      {cards.map((card, i) => (
        <button
          key={card.key}
          type="button"
          disabled={card.disabled && !card.selected}
          onClick={() => onPick(card.key)}
          aria-pressed={card.selected}
          className={`flex w-full items-start gap-3 rounded-[var(--radius-md)] border p-3 text-left transition-colors disabled:opacity-40 ${
            card.selected
              ? "border-[var(--color-ink)] bg-[var(--color-surface)] ring-1 ring-[var(--color-ink)]"
              : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-active)]"
          }`}
        >
          <span
            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
              card.selected ? "bg-[var(--color-ink)] text-[var(--color-paper)]" : "border border-[var(--color-border)] text-[var(--color-text-muted)]"
            }`}
          >
            {card.selected ? <Check className="h-3.5 w-3.5" /> : i + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--color-text-primary)]">{card.title}</span>
              {card.tag && <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">{card.tag}</span>}
            </span>
            <span className="mt-0.5 block text-xs text-[var(--color-text-secondary)]">{card.why}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
