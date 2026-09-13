"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { XIcon as X, CheckIcon as Check } from "@/components/icons";
import { InfoButton } from "@/components/InfoButton";
import type { ChoiceGroup, EquipmentOption } from "@/lib/character-creation";

interface WeaponOption {
  name: string;
  description?: string;
  icon?: string;
  data?: any;
}

interface EquipmentChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  group: ChoiceGroup;
  options: EquipmentOption[];
  selectedOptionIndex: number | null;
  onOptionSelect: (index: number) => void;
  weaponOptions: WeaponOption[];
  selectedWeaponNames: string[];
  onWeaponSelect: (name: string) => void;
  weaponSelectionCount: number;
  weaponType?: string;
  confirmDisabled: boolean;
  renderRightContent?: (option: any, isSelected: boolean) => React.ReactNode;
}

export function EquipmentChoiceModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  group,
  options,
  selectedOptionIndex,
  onOptionSelect,
  weaponOptions,
  selectedWeaponNames,
  onWeaponSelect,
  weaponSelectionCount,
  weaponType,
  confirmDisabled,
  renderRightContent,
}: EquipmentChoiceModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const isChoiceOption = (opt: EquipmentOption) =>
    opt.isWeaponChoice || opt.isInstrumentChoice || opt.isArcaneFocusChoice || opt.isHolySymbolChoice || opt.isDruidicFocusChoice;

  const hasWeaponList = options.some(isChoiceOption);
  const selectedOption = selectedOptionIndex !== null ? options[selectedOptionIndex] ?? null : null;
  const selectedWeaponSet = new Set(selectedWeaponNames);

  const weaponLabel = selectedOption?.isWeaponChoice
    ? `Choose ${weaponSelectionCount} ${weaponType?.replace(/_/g, " ")} weapon${weaponSelectionCount !== 1 ? "s" : ""}`
    : selectedOption?.isInstrumentChoice
      ? "Choose a musical instrument"
      : selectedOption?.isArcaneFocusChoice
        ? "Choose an arcane focus"
        : selectedOption?.isHolySymbolChoice
          ? "Choose a holy symbol"
          : selectedOption?.isDruidicFocusChoice
            ? "Choose a druidic focus"
            : `Choose ${weaponSelectionCount} item${weaponSelectionCount !== 1 ? "s" : ""}`;

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
          <div className="pr-8">
            <div className="text-[16px] font-medium text-[var(--color-text-primary)]">{title}</div>
            {group.description && (
              <div className="text-[12px] text-[var(--color-text-muted)] mt-0.5">{group.description}</div>
            )}
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
          {options.map((opt, idx) => {
            const isSelected = selectedOptionIndex === idx;
            const isChoice = isChoiceOption(opt);
            const itemNames = (opt.items || [])
              .map((i) => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}`)
              .join(", ");
            const weaponReq = isChoice
              ? `Pick ${opt.selectionCount || 1} ${opt.weaponType?.replace(/_/g, " ") || ""} weapon${(opt.selectionCount || 1) > 1 ? "s" : ""}`
              : null;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onOptionSelect(idx)}
                className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? "border-[var(--color-ink)] bg-[var(--color-bg)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-medium text-[var(--color-text-primary)] truncate">
                    {opt.description}
                  </div>
                  {itemNames && (
                    <div className="text-[12px] text-[var(--color-text-secondary)] truncate mt-0.5">
                      {itemNames}
                    </div>
                  )}
                  {weaponReq && (
                    <div className="text-[12px] text-[var(--color-text-muted)] truncate mt-0.5">
                      {weaponReq}
                    </div>
                  )}
                </div>
                <div className="shrink-0">
                  {isSelected ? (
                    <Check className="h-4 w-4 text-[var(--color-text-primary)]" />
                  ) : (
                    <InfoButton title={opt.description} description={itemNames} />
                  )}
                </div>
              </button>
            );
          })}

          {hasWeaponList && (
            <>
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-[var(--color-border)]" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                  {selectedOption ? "choose weapons" : "or pick from list"}
                </span>
                <div className="flex-1 h-px bg-[var(--color-border)]" />
              </div>

              <div className="space-y-2">
                <div className="text-[13px] font-semibold text-[var(--color-text-primary)] px-1">
                  {weaponLabel}
                </div>
                {weaponOptions.map((weapon, idx) => {
                  const isSelected = selectedWeaponSet.has(weapon.name);
                  const icon = weapon.icon || "📦";
                  const name = weapon.name;
                  const description = weapon.description || "";
                  const statSummary = weapon.data?.damage?.damage_dice
                    ? `${weapon.data.damage.damage_dice} ${weapon.data.damage.damage_type?.name || ""}`.trim()
                    : null;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onWeaponSelect(weapon.name)}
                      className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
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
                        {renderRightContent ? renderRightContent(weapon, isSelected) : (
                          isSelected ? (
                            <Check className="h-4 w-4 text-[var(--color-text-primary)]" />
                          ) : (
                            <InfoButton title={name} description={description} />
                          )
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
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
            Confirm selection
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
