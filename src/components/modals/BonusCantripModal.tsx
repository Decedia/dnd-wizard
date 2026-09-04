"use client";

import { getStaticSpells } from "@/lib/srd-client";
import { XIcon as X } from "@/components/icons";
import { BasePopup } from "@/components/BasePopup";

interface BonusCantripModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCantrip: string;
  onCantripChange: (cantrip: string) => void;
}

export function BonusCantripModal({
  isOpen,
  onClose,
  selectedCantrip,
  onCantripChange,
}: BonusCantripModalProps) {
  return (
    <BasePopup
      isOpen={isOpen}
      onClose={onClose}
      title="Choose Bonus Cantrip"
      confirmLabel={undefined}
      cancelLabel={undefined}
      showFooter={false}
    >
      <p className="text-xs text-[var(--color-text-secondary)] mb-4">
        Choose one additional druid cantrip. This cantrip does not count against your cantrip limit.
      </p>
      <div className="space-y-2">
        {getStaticSpells()
          .filter((s) => s.level === 0 && s.classes?.includes("Druid"))
          .map((sp) => {
            const isSelected = selectedCantrip === sp.name;
            const desc = Array.isArray(sp.description) ? sp.description.join(" ") : sp.description;
            return (
              <div key={sp.name} className="flex gap-1.5">
              <button
                type="button"
                onClick={() => { onCantripChange(sp.name); onClose(); }}
                className={`flex-1 p-3 text-left rounded-[var(--radius-sm)] border transition-all ${
                  isSelected
                    ? "bg-[var(--color-text-primary)] text-[var(--color-surface)] border-[var(--color-text-primary)]"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                }`}
              >
                <div className="font-semibold text-sm">{sp.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] text-[var(--color-text-muted)]">{sp.school}</span>
                </div>
              </button>
            </div>
            );
          })}
      </div>
    </BasePopup>
  );
}
