"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import type { Character } from "@/lib/storage";
import { endTimerPatch, RAGE_TIMER, roundsText } from "@/lib/timers";

/** Everything running on the character (spells, Rage, Wild Shape...) with time left and an End button. */
export function Timers({ character, onChange, className = "" }: { character: Character; onChange: (patch: Partial<Character>) => void; className?: string }) {
  const { t } = useLanguage();
  const timers = character.activeBuffs || [];
  if (timers.length === 0) return null;
  return (
    <div className={className}>
      <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{t("timer.title", "Running now")}</p>
      <ul className="flex flex-col gap-1.5">
        {timers.map((timer) => {
          const left = timer.turnsRemaining;
          const last = left === 1;
          const time = left === null || left === undefined ? null : roundsText(left);
          return (
            <li key={timer.spellId} className={`flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 ${last ? "border-[var(--color-warning-500)]" : "border-[var(--color-border)]"} bg-[var(--color-surface)]`}>
              <div className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">{timer.name}</span>
                  {timer.concentration && <span className="rounded-full border border-dashed border-[var(--color-border-active)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-text-secondary)]">{t("turn.concentration", "Concentration")}</span>}
                </span>
                <span className={`block text-xs ${last ? "font-semibold text-[var(--color-warning-700)]" : "text-[var(--color-text-secondary)]"}`}>
                  {last ? t("timer.lastRound", "Last round: it ends when this turn ends.") : time ? t(`timer.left.${time.unit}`, { n: time.n }) : t("timer.noEnd", "Until you end it")}
                </span>
                {timer.spellId === RAGE_TIMER && (
                  <span className="mt-0.5 block text-[11px] leading-snug text-[var(--color-text-muted)]">{t("timer.rageTip", "Rage also ends early if, since your last turn, you neither attacked nor took damage.")}</span>
                )}
              </div>
              <button type="button" onClick={() => onChange(endTimerPatch(character, timer.spellId))} className="btn btn-secondary shrink-0 px-3 py-1.5 text-xs">
                {t("timer.end", "End")}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
