"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { GiRollingDices } from "react-icons/gi";
import { useLanguage } from "@/contexts/LanguageContext";
import { DiceTray, type RollRequest, type RollResult } from "@/components/dice/DiceTray";
import type { RollGroup } from "@/lib/dice-roll";

interface DiceApi {
  /**
   * Opens the tray and throws these groups ("To hit" 1d20+7, "Damage" 1d8+4).
   * `onDone` gets each group's total and die values when the dice land.
   */
  roll: (title: string, groups: RollGroup[], onDone?: (result: RollResult) => void) => void;
}

const DiceContext = createContext<DiceApi | null>(null);

/** The dice tray, or null outside a page that has one. */
export const useDice = () => useContext(DiceContext);

/** Dice tray on the right edge of the page, with a tab to open it. */
export function DiceProvider({ children }: { children: ReactNode }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState<RollRequest | null>(null);
  const roll = useCallback((title: string, groups: RollGroup[], onDone?: (result: RollResult) => void) => {
    if (!groups.length) return;
    setOpen(true);
    setRequest((prev) => ({ seq: (prev?.seq ?? 0) + 1, title, groups, onDone }));
  }, []);
  const api = useMemo(() => ({ roll }), [roll]);

  return (
    <DiceContext.Provider value={api}>
      {children}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("dice.open", "Open dice tray")}
        className={`fixed right-0 top-1/2 z-[45] flex h-14 w-9 -translate-y-1/2 items-center justify-center rounded-l-xl border border-r-0 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-md transition-opacity hover:border-[var(--color-border-active)] ${open ? "pointer-events-none opacity-0" : "opacity-90"}`}
        style={{ marginRight: "env(safe-area-inset-right, 0px)" }}
      >
        <GiRollingDices className="h-5 w-5" aria-hidden="true" />
      </button>
      <DiceTray open={open} onClose={() => setOpen(false)} request={request} />
    </DiceContext.Provider>
  );
}
