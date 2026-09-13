"use client";

import { useState, useEffect } from "react";
import { XIcon as X, CheckIcon as Check } from "@/components/icons";
import { InfoButton } from "@/components/InfoButton";

export interface EquipmentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (item: any) => void;
  title: string;
  subtitle?: string;
  options: any[];
  selectedOptionIndex: number | null;
  onOptionSelect: (index: number) => void;
}

export function EquipmentSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  options,
  selectedOptionIndex,
  onOptionSelect,
}: EquipmentSelectionModalProps) {
  const [selected, setSelected] = useState<number | null>(selectedOptionIndex);

  useEffect(() => {
    setSelected(selectedOptionIndex);
  }, [selectedOptionIndex]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selected !== null) {
      onConfirm(options[selected]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-[20px] max-h-[85vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center pt-3">
          <div className="w-[36px] h-1 rounded bg-[#ddd]" />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <div>
            <div className="text-[16px] font-medium text-[#111]">{title}</div>
            {subtitle && <div className="text-[12px] text-[var(--color-text-muted)] mt-0.5">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-[var(--color-text-muted)]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {options.map((option, index) => {
            const isSelected = selected === index;
            const itemInfo = option.itemInfo || option;
            const icon = itemInfo?.icon || "📦";
            const name = option.name || itemInfo?.name || "Unknown";
            const description = itemInfo?.description || "";
            const statSummary = getStatSummary(itemInfo);

            return (
              <button
                key={index}
                type="button"
                onClick={() => {
                  setSelected(index);
                  onOptionSelect(index);
                }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? "border-[#111] bg-[var(--color-bg)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                }`}
              >
                <div
                  className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#f5f5f5" }}
                >
                  <span className="text-[22px] leading-none">{icon}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-[#111] truncate">{name}</div>
                  {description && <div className="text-[12px] text-[#666] truncate">{description}</div>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {statSummary && (
                    <span className="text-[12px] font-medium text-[#111]">{statSummary}</span>
                  )}
                  <InfoButton title={name} description={description} />
                  {isSelected && <Check className="h-4 w-4 text-[#111]" />}
                </div>
              </button>
            );
          })}
        </div>

        <div className="border-t border-[var(--color-border)] px-4 py-3">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selected === null}
            className={`w-full py-3 rounded-full font-bold text-sm transition-colors ${
              selected !== null
                ? "bg-[#111] text-white hover:opacity-90"
                : "bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed"
            }`}
          >
            Confirm selection
          </button>
        </div>
      </div>
    </div>
  );
}

function getStatSummary(item: any): string | null {
  if (!item) return null;
  if (item.damageDice) return `${item.damageDice} ${item.damageType || ""}`.trim();
  if (item.baseAC) return `AC ${item.baseAC}`;
  if (item.toolUse) return item.toolUse;
  if (item.effect) return item.effect;
  return null;
}
