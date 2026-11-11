"use client";


/** Sticky character card. A stat glows when its value changes. */
export function StatCard({ hp, ac, atk, dc, before, name, subtitle, t }: {
  hp: number; ac: number; atk?: number; dc?: number;
  before?: { hp: number; ac: number; atk: number; dc: number };
  name?: string; subtitle: string;
  t: (key: string, fb?: string, params?: Record<string, string | number>) => string;
}) {
  const stats: { key: string; label: string; value: string; diff: number }[] = [
    { key: "hp", label: t("levelUp.flow.hp", "HP"), value: String(hp), diff: before ? hp - before.hp : 0 },
    { key: "ac", label: t("levelUp.flow.ac", "AC"), value: String(ac), diff: before ? ac - before.ac : 0 },
  ];
  if (atk !== undefined) stats.push({ key: "atk", label: t("levelUp.flow.spellAttack", "Spell atk"), value: `${atk >= 0 ? "+" : ""}${atk}`, diff: before ? atk - before.atk : 0 });
  if (dc !== undefined) stats.push({ key: "dc", label: t("levelUp.flow.saveDc", "Save DC"), value: String(dc), diff: before ? dc - before.dc : 0 });
  return (
    <div className="border-t border-[var(--color-border)]">
      <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-bold text-[var(--color-text-primary)]">{name || "—"}</div>
          <div className="truncate text-[10px] text-[var(--color-text-muted)]">{subtitle}</div>
        </div>
        {stats.map((s) => (
          <div key={s.key} className="text-center">
            <div key={s.value} className="stat-glow rounded px-1 text-sm font-bold text-[var(--color-text-primary)]">{s.value}</div>
            <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-muted)]">
              {s.label}{s.diff !== 0 && <span className={s.diff > 0 ? "text-green-600" : "text-red-500"}> {s.diff > 0 ? "+" : ""}{s.diff}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
