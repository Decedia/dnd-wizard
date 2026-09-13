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
  concreteOptions: EquipmentOption[];
  selectedConcreteIndex: number | null;
  onConcreteSelect: (index: number) => void;
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
  concreteOptions,
  selectedConcreteIndex,
  onConcreteSelect,
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

  const hasConcrete = concreteOptions.length > 0;
  const hasWeapons = weaponOptions.length > 0;

  const weaponLabel = `Choose ${weaponSelectionCount} ${weaponType?.replace(/_/g, " ") || ""} weapon${weaponSelectionCount !== 1 ? "s" : ""}`;

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50" onClick={onClose}>
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

        <div className="flex-1 overflow-hidden px-4 py-3">
          {hasConcrete && (
            <div className="space-y-2 mb-2">
              {concreteOptions.map((opt) => {
                const globalIdx = group.options.indexOf(opt);
                const isSelected = selectedConcreteIndex === globalIdx;
                const itemNames = (opt.items || [])
                  .map((i) => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}`)
                  .join(", ");

                return (
                  <button
                    key={globalIdx}
                    type="button"
                    onClick={() => onConcreteSelect(globalIdx)}
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
            </div>
          )}

          {hasConcrete && hasWeapons && (
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-[var(--color-border)]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">or</span>
              <div className="flex-1 h-px bg-[var(--color-border)]" />
            </div>
          )}

          {hasWeapons && (
            <div className="flex flex-col max-h-[40vh]">
              <div className="text-[13px] font-semibold text-[var(--color-text-primary)] px-1 mb-2">
                {weaponLabel}
              </div>
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {weaponOptions.map((weapon, idx) => {
                  const isSelected = selectedWeaponNames.includes(weapon.name);
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
            </div>
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
