"use client";

import { PencilSimple, Sword } from "@phosphor-icons/react";
import type { Character } from "@/lib/storage";
import type { CreationStep } from "@/lib/creation-types";
import { useLanguage } from "@/contexts/LanguageContext";

const CONCEPT_TYPES = new Set<CreationStep["type"]>(["look", "personality"]);

interface CreationOrderPickerProps {
  order: NonNullable<Character["creationOrder"]>;
  steps: CreationStep[];
  onChange: (order: NonNullable<Character["creationOrder"]>) => void;
}

/** Concept-first or gameplay-first toggle, with a live list of the resulting steps. */
export function CreationOrderPicker({ order, steps, onChange }: CreationOrderPickerProps) {
  const { t } = useLanguage();
  const modes = [
    {
      id: "concept" as const,
      icon: <PencilSimple size={20} weight="bold" />,
      label: t("creationOrder.concept", "Konsep dulu"),
      desc: t("creationOrder.conceptDesc", "Penampilan dan kepribadian, lalu aturan."),
    },
    {
      id: "gameplay" as const,
      icon: <Sword size={20} weight="bold" />,
      label: t("creationOrder.gameplay", "Gameplay dulu"),
      desc: t("creationOrder.gameplayDesc", "Kelas, stat, dan perlengkapan, lalu cerita."),
    },
  ];

  return (
    <section className="mb-8 space-y-4">
      <div>
        <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-ink">{t("creationOrder.title", "Urutan Pembuatan")}</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {modes.map((mode) => {
            const isSelected = order === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onChange(mode.id)}
                aria-pressed={isSelected}
                className={`rounded-2xl border-2 p-3.5 text-left transition-all active:scale-[0.98] ${
                  isSelected ? "border-ink bg-ink/5" : "border-border-strong bg-surface"
                }`}
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    isSelected ? "bg-ink text-surface" : "bg-ink/10 text-ink"
                  }`}
                >
                  {mode.icon}
                </span>
                <span className="mt-2.5 block text-[15px] font-bold text-ink">{mode.label}</span>
                <span className="mt-1 block text-[11px] leading-relaxed text-ink-muted">{mode.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-2.5 text-xs font-bold uppercase tracking-widest text-ink">{t("creationOrder.yourSteps", "Langkahmu")}</h2>
        <ol className="rounded-2xl border-2 border-border-strong bg-surface px-3 py-1.5">
          {steps.map((step, idx) => {
            const isConcept = CONCEPT_TYPES.has(step.type);
            const tag =
              step.type === "source-selection"
                ? t("creationOrder.tagSetup", "Persiapan")
                : isConcept
                  ? t("creationOrder.tagConcept", "Konsep")
                  : t("creationOrder.tagGameplay", "Gameplay");
            return (
              <li key={step.id} className="flex items-center gap-3 border-b border-border-muted py-2 last:border-b-0">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    isConcept ? "bg-ink text-surface" : "bg-paper-muted text-ink"
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="flex-1 text-[13px] font-semibold text-ink">{t(`creationOrder.step.${step.id}`, step.title)}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isConcept ? "text-ink" : "text-ink-muted"}`}>{tag}</span>
              </li>
            );
          })}
        </ol>
        {!steps.some((s) => s.type === "level") && (
          <p className="mt-2 text-[11px] leading-relaxed text-ink-muted">
            {t("creationOrder.levelHint", "Langkah Level Awal muncul di akhir setelah kamu memilih kelas.")}
          </p>
        )}
      </div>
    </section>
  );
}
