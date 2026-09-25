"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { XIcon as X, CheckIcon as Check, InfoIcon } from "@/components/icons";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { SplitSelectionCard } from "@/components/ui/SplitSelectionCard";
import type { ChoiceGroup, EquipmentOption } from "@/lib/character-creation";

interface EquipmentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  group: ChoiceGroup;
  selectedOptionIndex: number | null;
  onSelect: (index: number) => void;
  renderRightContent?: (option: any, isSelected: boolean) => React.ReactNode;
  getItemInfo?: (name: string) => { icon: string; description: string } | null;
  getStatSummary?: (item: any) => string | null;
}

export function EquipmentSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  group,
  selectedOptionIndex,
  onSelect,
  renderRightContent,
  getItemInfo,
  getStatSummary,
}: EquipmentSelectionModalProps) {
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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

  const options = group.options || [];
  const filteredOptions = options.filter((opt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (opt.description || "").toLowerCase().includes(q) || (opt.items || []).some((i: any) => i.name.toLowerCase().includes(q));
  });

  const stickyFooter = (
    <div className="sticky bottom-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] px-4 py-3">
      <button
        type="button"
        onClick={onConfirm}
        disabled={selectedOptionIndex === null}
        className={`w-full py-3 rounded-full font-bold text-sm transition-colors ${
          selectedOptionIndex !== null
            ? "bg-[var(--color-ink)] text-[var(--color-surface)] hover:opacity-90"
            : "bg-[var(--color-border)] text-[var(--color-text-muted)] cursor-not-allowed"
        }`}
      >
        Confirm selection
      </button>
    </div>
  );

  return createPortal(
    <BottomSheet isOpen={isOpen} onClose={onClose} title={title} footer={stickyFooter} showHeader={false}>
      <div className="px-4 pt-4 pb-2 space-y-3">
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-[var(--color-text-muted)]">🔍</span>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search options..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--color-bg)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-indigo-500)] focus:border-transparent"
          />
        </div>
        {filteredOptions.length === 0 && (
          <p className="text-sm text-[var(--color-text-muted)] text-center py-6">No options match your search.</p>
        )}
        {filteredOptions.map((option, index) => {
          const isSelected = selectedOptionIndex === index;
          const name = option.description || `Option ${index + 1}`;
          const itemNames = (option.items || [])
            .map((i: any) => `${i.name}${i.quantity > 1 ? ` x${i.quantity}` : ""}`)
            .join(", ");
          const itemIcons = (option.items || []).map((i: any) => {
            const info = getItemInfo?.(i.name);
            return info?.icon || "📦";
          });
          const statSummary = getStatSummary?.(option);
          const iconNode = itemIcons.length > 0 ? (
            <div className="flex -space-x-1">
              {itemIcons.slice(0, 4).map((icon, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-[8px] flex items-center justify-center border-2 border-[var(--color-surface)]"
                  style={{ backgroundColor: "var(--color-bg)" }}
                >
                  <span className="text-[16px] leading-none">{icon}</span>
                </div>
              ))}
            </div>
          ) : undefined;
          return (
            <SplitSelectionCard
              key={index}
              title={name}
              subtitle={itemNames || undefined}
              icon={iconNode}
              isSelected={isSelected}
              onSelect={() => onSelect(index)}
              infoType="modal"
              modalContent={
                <div className="space-y-2">
                  {itemNames && <p className="text-xs text-[var(--color-text-secondary)]">{itemNames}</p>}
                  {statSummary && <p className="text-xs text-[var(--color-text-primary)] font-medium">{statSummary}</p>}
                </div>
              }
            />
          );
        })}
      </div>
    </BottomSheet>,
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
