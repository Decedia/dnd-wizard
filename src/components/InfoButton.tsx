"use client";

import { useState, useEffect } from "react";
import { Info, X } from "phosphor-react";

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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ pointerEvents: 'auto' }}
    >
      <div className="w-full max-w-md max-h-[70vh] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="text-sm font-bold text-[var(--color-text-primary)]">{title}</div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all"
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

interface InfoButtonProps {
  title: string;
  description: string | string[];
  size?: "sm" | "md";
}

export function InfoButton({ title, description, size = "sm" }: InfoButtonProps) {
  const [show, setShow] = useState(false);

  if (!description) return null;

  const sizeClass = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  const iconClass = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <>
      <button
        type="button"
        onClick={() => setShow(true)}
        className={`${sizeClass} flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-border-active)] hover:text-[var(--color-text-primary)] transition-all shrink-0`}
        title="View description"
      >
        <Info className={iconClass} />
      </button>
      {show && (
        <DescriptionModal
          title={title}
          content={description}
          onClose={() => setShow(false)}
        />
      )}
    </>
  );
}
