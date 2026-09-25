"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { XIcon as X, CheckIcon as Check, InfoIcon } from "@/components/icons";
import type { ChoiceGroup, EquipmentOption } from "@/lib/character-creation";

interface WeaponOption {
  name: string;
  description?: string;
  icon?: string;
  statSummary?: string | null;
  data?: any;
}

interface WeaponChoiceSection {
  id: string;
  label: string;
  bonusItems?: Array<{ name: string; quantity: number }>;
  selectionCount: number;
  weaponOptions: WeaponOption[];
  selectedWeaponNames: string[];
  onWeaponSelect: (name: string) => void;
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
  weaponChoiceOptions: WeaponChoiceSection[];
  selectedWeaponChoiceIndex: number | null;
  onWeaponChoiceSelect: (index: number) => void;
  confirmDisabled: boolean;
  renderRightContent?: (option: any, isSelected: boolean) => React.ReactNode;
  getItemInfo?: (name: string) => { icon: string; description: string } | null;
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
  weaponChoiceOptions,
  selectedWeaponChoiceIndex,
  onWeaponChoiceSelect,
  confirmDisabled,
  renderRightContent,
  getItemInfo,
}: EquipmentChoiceModalProps) {
  const [mounted, setMounted] = useState(false);
  const [infoIndex, setInfoIndex] = useState<number | null>(null);

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
  const hasWeaponChoices = weaponChoiceOptions.length > 0;

  return createPortal(
    <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50" onClick={onClose}>
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
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-bg)] transition-colors"
          >
            <X className="h-5 w-5 text-[var(--color-text-muted)]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {hasConcrete && (
            <div className="space-y-2 mb-2">
              {concreteOptions.map((opt) => {
                const globalIdx = group.options.indexOf(opt);
                const isSelected = selectedConcreteIndex === globalIdx;
                const itemNames = (opt.items || [])
                  .map((i) => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}`)
                  .join(", ");
                const itemIcons = (opt.items || []).map((i) => {
                  const info = getItemInfo?.(i.name);
                  return info?.icon || "📦";
                });
                const itemDescriptions = (opt.items || [])
                  .map((i) => getItemInfo?.(i.name)?.description)
                  .filter(Boolean) as string[];
                const infoDescription = itemDescriptions.join("\n\n") || itemNames;

                return (
                  <button
                    key={globalIdx}
                    type="button"
                    onClick={() => onConcreteSelect(globalIdx)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                      isSelected
                        ? "border-[var(--color-ink)] bg-[var(--color-bg)]"
                        : "border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 shrink-0">
                      {itemIcons.map((icon, i) => (
                        <div
                          key={i}
                          className="w-10 h-10 rounded-[10px] flex items-center justify-center"
                          style={{ backgroundColor: "var(--color-bg)" }}
                        >
                          <span className="text-[20px] leading-none">{icon}</span>
                        </div>
                      ))}
                    </div>
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
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setInfoIndex(globalIdx); }}
                          className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-2 hover:border-[var(--color-text-primary)] active:bg-[var(--color-bg)] transition-all shrink-0"
                          aria-label={`Info: ${opt.description}`}
                        >
                          <InfoIcon className="h-4 w-4" />
                        </button>
                      )}
                      {infoIndex === globalIdx && (
                        <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setInfoIndex(null)}>
                          <div className="relative w-full max-w-sm mx-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-2xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{opt.description}</h3>
                              <button type="button" onClick={() => setInfoIndex(null)} className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">{infoDescription || ""}</p>
                            <button type="button" onClick={() => setInfoIndex(null)} className="mt-3 w-full py-2 rounded-lg bg-[var(--color-ink)] text-[var(--color-surface)] text-sm font-semibold">Got it</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {hasConcrete && hasWeaponChoices && (
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-[var(--color-border)]" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">or</span>
              <div className="flex-1 h-px bg-[var(--color-border)]" />
            </div>
          )}

          {hasWeaponChoices && (
            <div className="space-y-4">
              {weaponChoiceOptions.map((wc, idx) => {
                const isSelected = selectedWeaponChoiceIndex === idx;
                const selectionCount = wc.selectionCount || 1;
                const selectedNames = wc.selectedWeaponNames || [];

                return (
                  <div
                    key={wc.id}
                    className={`rounded-lg border-2 p-3 transition-all ${
                      isSelected
                        ? "border-[var(--color-ink)] bg-[var(--color-bg)]"
                        : "border-[var(--color-border)]"
                    }`}
                  >
                    <div className="text-[14px] font-medium text-[var(--color-text-primary)] mb-2">
                      {wc.label}
                      {selectionCount > 1 && (
                        <span className="text-[12px] text-[var(--color-text-secondary)] ml-2">
                          ({selectedNames.length}/{selectionCount} selected)
                        </span>
                      )}
                    </div>

                    {wc.bonusItems && wc.bonusItems.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {wc.bonusItems.map((item, i) => {
                          const itemInfo = getItemInfo?.(item.name);
                          const icon = itemInfo?.icon || "📦";

                          return (
                            <div
                              key={i}
                              className="flex items-center gap-3 p-3 rounded-lg border-2 border-dashed border-[var(--color-border)] opacity-60"
                            >
                              <div
                                className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
                                style={{ backgroundColor: "var(--color-bg)" }}
                              >
                                <span className="text-[22px] leading-none">{icon}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-[14px] font-medium text-[var(--color-text-muted)] truncate">
                                  {item.name}
                                </div>
                                <div className="text-[12px] text-[var(--color-text-muted)]">
                                  Included
                                </div>
                              </div>
                              {itemInfo?.description && (
                                <div className="shrink-0">
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setInfoIndex(i); }}
                                    className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-2 hover:border-[var(--color-text-primary)] active:bg-[var(--color-bg)] transition-all shrink-0"
                                    aria-label={`Info: ${item.name}`}
                                  >
                                    <InfoIcon className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                              {infoIndex === i && (
                                <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setInfoIndex(null)}>
                                  <div className="relative w-full max-w-sm mx-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-2xl p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{item.name}</h3>
                                      <button type="button" onClick={() => setInfoIndex(null)} className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">{itemInfo?.description || ""}</p>
                                    <button type="button" onClick={() => setInfoIndex(null)} className="mt-3 w-full py-2 rounded-lg bg-[var(--color-ink)] text-[var(--color-surface)] text-sm font-semibold">Got it</button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="max-h-[40vh] overflow-y-auto space-y-1.5">
                      {wc.weaponOptions.map((weapon, wIdx) => {
                        const isWeaponSelected = selectedNames.includes(weapon.name);
                        const weaponInfo = getItemInfo?.(weapon.name);

                        return (
                          <button
                            key={wIdx}
                            type="button"
                            onClick={() => {
                              wc.onWeaponSelect(weapon.name);
                            }}
                            className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                              isWeaponSelected
                                ? "border-[var(--color-ink)] bg-[var(--color-bg)]"
                                : "border-[var(--color-border)] hover:border-[var(--color-border-active)]"
                            }`}
                          >
                            <div
                              className="w-11 h-11 rounded-[10px] flex items-center justify-center shrink-0"
                              style={{ backgroundColor: "var(--color-bg)" }}
                            >
                              <span className="text-[22px] leading-none">{weapon.icon || "📦"}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[14px] font-medium text-[var(--color-text-primary)] truncate">
                                {weapon.name}
                              </div>
                              {weapon.description && (
                                <div className="text-[12px] text-[var(--color-text-secondary)] truncate">
                                  {weapon.description}
                                </div>
                              )}
                            </div>
                            {isWeaponSelected ? (
                              <Check className="h-4 w-4 text-[var(--color-text-primary)] shrink-0" />
                            ) : (
                              weaponInfo?.description ? (
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setInfoIndex(wIdx); }}
                                  className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-2 hover:border-[var(--color-text-primary)] active:bg-[var(--color-bg)] transition-all shrink-0"
                                  aria-label={`Info: ${weapon.name}`}
                                >
                                  <InfoIcon className="h-4 w-4" />
                                </button>
                              ) : null
                            )}
                            {infoIndex === wIdx && (
                              <div className="fixed inset-0 z-[1000000] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setInfoIndex(null)}>
                                <div className="relative w-full max-w-sm mx-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] shadow-2xl p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{weapon.name}</h3>
                                    <button type="button" onClick={() => setInfoIndex(null)} className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">{weaponInfo?.description || ""}</p>
                                  <button type="button" onClick={() => setInfoIndex(null)} className="mt-3 w-full py-2 rounded-lg bg-[var(--color-ink)] text-[var(--color-surface)] text-sm font-semibold">Got it</button>
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
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
