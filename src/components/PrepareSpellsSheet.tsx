"use client";

import { BottomSheet } from "@/components/modals/BottomSheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { fillPrepared, type PreparableSpell } from "@/lib/prepared-spells";
import { CheckIcon as Check } from "@/components/icons";

interface PrepareSpellsSheetProps {
  spells: PreparableSpell[];
  prepared: string[];
  limit: number;
  onChange: (prepared: string[]) => void;
  onClose: () => void;
}

/** Pick which spells are ready to cast. Used by the sheet, the turn panel and level-up. */
export function PrepareSpellsSheet({ spells, prepared, limit, onChange, onClose }: PrepareSpellsSheetProps) {
  const { t } = useLanguage();
  const valid = new Set(spells.map((s) => s.id));
  const chosen = new Set(prepared.filter((id) => valid.has(id)));
  const full = chosen.size >= limit;
  const levels = [...new Set(spells.map((s) => s.level))].sort((a, b) => a - b);
  const toggle = (id: string) => {
    if (chosen.has(id)) onChange(prepared.filter((p) => p !== id));
    else if (!full) onChange([...prepared, id]);
  };

  return (
    <BottomSheet
      isOpen
      onClose={onClose}
      title={t("prepare.title", "Prepare spells")}
      className="!mb-4 !max-h-[86vh]"
      footer={
        <div className="flex items-center gap-2 px-4 py-3">
          <button type="button" onClick={() => onChange(fillPrepared(spells, [...chosen], limit))} disabled={full || chosen.size >= spells.length} className="btn-secondary flex-1 text-xs disabled:opacity-40">
            {t("prepare.suggest", "Fill for me")}
          </button>
          <button type="button" onClick={onClose} className="btn-primary flex-1 text-xs">
            {t("prepare.done", "Done")}
          </button>
        </div>
      }
    >
      <div className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-bold text-[var(--color-text-primary)]">{t("prepare.count", { count: chosen.size, max: limit }, "{count} of {max} ready")}</span>
          {chosen.size > 0 && (
            <button type="button" onClick={() => onChange(prepared.filter((id) => !valid.has(id)))} className="text-[11px] font-semibold text-[var(--color-text-muted)] underline">
              {t("prepare.clear", "Clear")}
            </button>
          )}
        </div>
        <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">{t("prepare.hint", "You can only cast the spells you have ready. Change them after a long rest.")}</p>
      </div>
      <div className="space-y-4 px-4 py-3">
        {levels.map((level) => (
          <div key={level}>
            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{t("prepare.level", { level }, "Level {level}")}</div>
            <div className="space-y-1.5">
              {spells.filter((s) => s.level === level).map((s) => {
                const on = chosen.has(s.id);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggle(s.id)}
                    disabled={!on && full}
                    aria-pressed={on}
                    className={`flex w-full items-center gap-3 rounded-[var(--radius-md)] border px-3 py-2 text-left text-sm transition-colors ${
                      on
                        ? "border-[var(--color-ink)] bg-[var(--color-bg)] font-bold text-[var(--color-text-primary)]"
                        : "border-[var(--color-border)] text-[var(--color-text-secondary)] disabled:opacity-40"
                    }`}
                  >
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${on ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-surface)]" : "border-[var(--color-border)]"}`}>
                      {on && <Check className="h-3 w-3" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{s.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </BottomSheet>
  );
}
