"use client";

import { useState } from "react";
import { InfoIcon as Info } from "@/components/icons";
import { BasePopup } from "./BasePopup";
import { FormattedDescription } from "./FormattedDescription";

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
        aria-label={`Info: ${title}`}
      >
        <Info className="h-4 w-4" />
      </button>
      <BasePopup
        isOpen={show}
        onClose={() => setShow(false)}
        title={title}
        confirmLabel="Got it"
        onConfirm={() => setShow(false)}
        showFooter={true}
      >
        <FormattedDescription>{descText}</FormattedDescription>
      </BasePopup>
    </>
  );
}

interface DescriptionModalProps {
  title: string;
  content: string | string[];
  onClose: () => void;
  children?: React.ReactNode;
  showConfirm?: boolean;
  onConfirm?: () => void;
  confirmLabel?: string;
}

export function DescriptionModal({ title, content, onClose, children, showConfirm, onConfirm, confirmLabel = "Confirm" }: DescriptionModalProps) {
  const text = Array.isArray(content) ? content.join(" ") : content;

  return (
    <BasePopup
      isOpen={true}
      onClose={onClose}
      title={title}
      confirmLabel={confirmLabel}
      onConfirm={onConfirm}
      showFooter={!!showConfirm && !!onConfirm}
    >
      {children || <FormattedDescription>{text}</FormattedDescription>}
    </BasePopup>
  );
}

