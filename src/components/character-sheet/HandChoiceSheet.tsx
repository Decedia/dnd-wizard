"use client";

import { BottomSheet } from "@/components/modals/BottomSheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { handChoices, heldInHands, type Hand, type InventoryRow } from "@/lib/inventory";

interface HandChoiceSheetProps {
  item: InventoryRow;
  inventory: InventoryRow[];
  onPick: (hand: Hand) => void;
  onClose: () => void;
}

/** "Which hand?" for a one-handed or versatile weapon, with what each choice pushes out. */
export function HandChoiceSheet({ item, inventory, onPick, onClose }: HandChoiceSheetProps) {
  const { t } = useLanguage();
  const held = heldInHands(inventory);
  const replaced = (hand: Hand): string[] => {
    const out: (InventoryRow | undefined)[] = [];
    if (hand === "both") out.push(held.main, held.off);
    else if (hand === "main") out.push(held.main);
    else out.push(held.off, held.twoHanded ? held.main : undefined);
    return out.filter((r): r is InventoryRow => !!r && r.id !== item.id).map((r) => r.name);
  };

  return (
    <BottomSheet isOpen onClose={onClose} title={t("hands.which", { item: item.name }, "{item}: which hand?")}>
      <div className="space-y-2 px-4 py-4">
        {handChoices(item).map((hand) => {
          const out = replaced(hand);
          return (
            <button
              key={hand}
              type="button"
              onClick={() => onPick(hand)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2.5 text-left hover:border-[var(--color-border-active)]"
            >
              <span className="block text-sm font-bold text-[var(--color-text-primary)]">
                {t(`hands.${hand}`)}
                {hand === "both" && item.versatileDice && <span className="ml-2 text-xs font-semibold text-[var(--color-text-secondary)]">{item.versatileDice}</span>}
                {hand !== "both" && item.damageDice && <span className="ml-2 text-xs font-semibold text-[var(--color-text-secondary)]">{item.damageDice}</span>}
              </span>
              <span className="block text-[11px] text-[var(--color-text-muted)]">
                {out.length > 0 ? t("hands.replaces", { names: out.join(", ") }, "Puts away {names}") : t(`hands.${hand}.hint`)}
              </span>
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}
