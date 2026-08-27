"use client";

import { useState, useEffect, useRef } from "react";
import { Info, X } from "phosphor-react";

interface InfoPopupProps {
  title: string;
  description: string;
  onClose: () => void;
}

function InfoPopup({ title, description, onClose }: InfoPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={popupRef}
      className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-[280px] p-3 bg-white border border-[var(--color-border)] rounded-[var(--radius-md)] shadow-lg"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">{title}</span>
        <button
          type="button"
          onClick={onClose}
          className="h-5 w-5 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="text-[13px] text-[#666666] leading-[1.6] whitespace-pre-line">{description}</p>
    </div>
  );
}

interface InfoButtonProps {
  title: string;
  description: string | string[];
}

export function InfoButton({ title, description }: InfoButtonProps) {
  const [show, setShow] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!description) return null;

  const descText = Array.isArray(description) ? description.join("\n") : description;

  return (
    <div ref={containerRef} className="relative inline-flex items-center shrink-0">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setShow(!show);
        }}
        className="h-7 w-7 flex items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-white text-[var(--color-text-primary)] hover:border-2 hover:border-[var(--color-text-primary)] active:bg-[#f5f5f5] transition-all"
      >
        <Info weight="regular" className="h-4 w-4" />
      </button>
      {show && (
        <InfoPopup
          title={title}
          description={descText}
          onClose={() => setShow(false)}
        />
      )}
    </div>
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
