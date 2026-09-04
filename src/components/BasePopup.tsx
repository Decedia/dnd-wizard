"use client";

import { useState } from "react";
import { XIcon as X, InfoIcon as Info } from "@/components/icons";

export interface BasePopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  infoTitle?: string;
  infoDescription?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  children?: React.ReactNode;
  showFooter?: boolean;
  confirmDisabled?: boolean;
}

export function BasePopup({
  isOpen,
  onClose,
  title,
  description,
  infoTitle,
  infoDescription,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  children,
  showFooter = true,
  confirmDisabled = false,
}: BasePopupProps) {
  const [showInfo, setShowInfo] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-[var(--color-overlay)] p-4" onClick={onClose}>
      <div className="w-full max-w-md max-h-[80vh] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="text-sm font-bold text-[var(--color-text-primary)]">{title}</div>
            {infoTitle && infoDescription && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowInfo(!showInfo);
                }}
                className={`h-8 w-8 flex items-center justify-center rounded-[var(--radius-sm)] border transition-all ${
                  showInfo
                    ? "border-[var(--color-border-active)] bg-[var(--color-bg)] text-[var(--color-text-primary)]"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                }`}
                aria-label={`Info: ${infoTitle}`}
              >
                <Info className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-10 w-10 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {showInfo && infoDescription && (
          <div className="px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{infoDescription}</p>
          </div>
        )}

        {description && !showInfo && (
          <div className="px-4 py-3 border-b border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{description}</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {children}
        </div>

        {showFooter && (
          <div className="border-t border-[var(--color-border)] px-4 py-3 flex gap-2">
            <button
              type="button"
              onClick={onCancel || onClose}
              className="btn btn-secondary flex-1"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={confirmDisabled}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all ${
                confirmDisabled
                  ? "bg-[var(--color-bg)] text-[var(--color-text-muted)] border border-[var(--color-border)] cursor-not-allowed"
                  : "bg-[var(--color-text-primary)] text-[var(--color-surface)] hover:opacity-90"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
