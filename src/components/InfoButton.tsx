"use client";

import { useState, useEffect } from "react";
import { InfoIcon as Info, XIcon as X } from "@/components/icons";

interface InfoButtonProps {
  title: string;
  description: string | string[];
}

export function InfoButton({ title, description }: InfoButtonProps) {
  const [show, setShow] = useState(false);

  if (!description) return null;

  const descText = Array.isArray(description) ? description.join("\n") : description;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShow(true);
        }}
        className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:border-2 hover:border-[var(--color-text-primary)] active:bg-[var(--color-bg)] transition-all shrink-0"
      >
        <Info className="h-4 w-4" />
      </button>
      {show && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-overlay)] p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShow(false); }}
        >
          <div
            className="w-full max-w-md max-h-[70vh] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
              <div className="text-sm font-bold text-[var(--color-text-primary)]">{title}</div>
              <button
                type="button"
                onClick={() => setShow(false)}
                className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-2 hover:border-[var(--color-text-primary)] transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">{descText}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface DescriptionModalProps {
  title: string;
  content: string | string[];
  onClose: () => void;
  children?: React.ReactNode;
}

export function DescriptionModal({ title, content, onClose, children }: DescriptionModalProps) {
  const text = Array.isArray(content) ? content.join(" ") : content;

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[var(--color-overlay)] p-4 pointer-events-auto"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md max-h-[70vh] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="text-sm font-bold text-[var(--color-text-primary)]">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-2 hover:border-[var(--color-text-primary)] transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {children || (
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">{text}</p>
          )}
        </div>
      </div>
    </div>
  );
}
