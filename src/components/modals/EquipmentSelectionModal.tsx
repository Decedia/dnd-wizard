"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { XIcon as X, CheckIcon as Check } from "@/components/icons";
import { InfoButton } from "@/components/InfoButton";
import { useLanguage } from "@/contexts/LanguageContext";

export interface EquipmentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  subtitle?: string;
  options: Array<{
    icon?: string;
    name: string;
    description?: string;
    statSummary?: string | null;
    data?: any;
    descKey?: string;
  }>;
  selectedIndices: number[];
  onOptionSelect: (index: number) => void;
  multiple?: boolean;
  confirmDisabled?: boolean;
  renderRightContent?: (option: any, isSelected: boolean) => React.ReactNode;
  manageBodyScroll?: boolean;
}

export function EquipmentSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle,
  options,
  selectedIndices,
  onOptionSelect,
  multiple = false,
  confirmDisabled = false,
  renderRightContent,
  manageBodyScroll = true,
}: EquipmentSelectionModalProps) {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (manageBodyScroll) {
      if (isOpen) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    }
    return () => {
      if (manageBodyScroll) {
        document.body.style.overflow = "";
      }
    };
  }, [isOpen, manageBodyScroll]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="mx-auto w-full max-w-lg bg-[var(--color-surface)] rounded-t-[20px] max-h-[85vh] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center pt-3">
          <div className="w-[36px] h-1 rounded bg-[var(--color-border)]" />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <div>
            <div className="text-[16px] font-medium text-[var(--color-text-primary)]">{title}</div>
            {subtitle && <div className="text-[12px] text-[var(--color-text-muted)] mt-0.5">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-bg)] transition-colors"
          >
            <X className="h-5 w-5 text-[var(--color-text-muted)]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-20">
          {options.map((option, index) => {
            const isSelected = selectedIndices.includes(index);
            const icon = option.icon || "📦";
            const name = option.name;
            const description = option.description || "";
            const statSummary = option.statSummary || getStatSummary(option.data);

            return (
              <div
                key={index}
                onClick={() => {
                  console.log("[Modal] row tapped", index, option.name, "isSelected:", isSelected);
                  onOptionSelect(index);
                }}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  isSelected
                    ? "border-[var(--color-ink)] bg-[var(--color-bg)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                }`}
              >
                <div className="flex-1 flex items-center gap-3 text-left min-w-0">
                  <div
                    className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "var(--color-bg)" }}
                  >
                    <span className="text-[22px] leading-none">{icon}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-medium text-[var(--color-text-primary)] truncate">{name}</div>
                    {description && (
                      <div className="text-[12px] text-[var(--color-text-secondary)] truncate">{description}</div>
                    )}
                  </div>

                  {statSummary && (
                    <span className="text-[12px] font-medium text-[var(--color-text-primary)] shrink-0">{statSummary}</span>
                  )}
                </div>

                <div className="shrink-0">
                  {(() => {
                    if (renderRightContent) return renderRightContent(option, isSelected);
                    if (isSelected) return <Check className="h-4 w-4 text-[var(--color-text-primary)]" />;
                    return <InfoButton title={name} description={description} descKey={option.descKey} />;
                  })()}
                </div>
              </div>
              );
          })}
        </div>

        <div className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={`w-full py-3 rounded-full font-bold text-sm transition-colors ${
              !confirmDisabled
                ? "bg-[var(--color-ink)] text-[var(--color-surface)] hover:opacity-90"
                : "bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed"
            }`}
          >
            {t("equipment.confirmSelection", "Confirm selection")}
          </button>
        </div>
      </div>
    </div>,
    document.body
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
