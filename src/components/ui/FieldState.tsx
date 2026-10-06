"use client";

import { ReactNode, isValidElement, cloneElement, Children } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export interface FieldStateProps {
  value: any;
  isEmpty?: (value: any) => boolean;
  label?: string;
  required?: boolean;
  helperText?: string;
  children: ReactNode;
  className?: string;
}

export function FieldState({
  value,
  isEmpty = (v) => !v || v === "" || (Array.isArray(v) && v.length === 0),
  label,
  required = false,
  helperText,
  children,
  className = "",
}: FieldStateProps) {
  const { t } = useLanguage();
  const empty = isEmpty(value);
  const filled = !empty;

  const borderColor = empty
    ? "border-[var(--color-error-500)]"
    : filled
    ? "border-green-500"
    : "";

  const enhancedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;

    const childProps = child.props as Record<string, any>;
    const originalClass = childProps.className || "";

    // Replace existing border color classes with our validation color
    const updatedClass = originalClass
      .replace(/border-\[var\(--color-border\)\](?!\w)/g, `border-[var(--color-border)]`)
      .replace(/border-\[var\(--color-error[^\]]*\)\](?!\w)/g, "")
      .replace(/border-green-[0-9]+(?!\w)/g, "")
      .concat(` ${borderColor}`);

    return cloneElement(child as React.ReactElement<any>, {
      className: updatedClass.trim(),
    });
  });

  const fieldId = `field-${label?.toLowerCase().replace(/\s+/g, "-") || "unnamed"}`;

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label className="field-label-light">
          {label}
          {required && <span className="text-[var(--color-error-500)] ml-1" aria-hidden="true">*</span>}
        </label>
      )}
      {enhancedChildren}
      {(empty || helperText) && (
        <div
          id={`${fieldId}-message`}
          className={`text-xs ${
            empty
              ? "text-[var(--color-error-600)]"
              : "text-[var(--color-text-muted)]"
          }`}
          role={empty ? "alert" : undefined}
        >
          {empty && helperText
            ? helperText
            : empty
            ? t("form.fieldRequired", "This field is required")
            : helperText}
        </div>
      )}
    </div>
  );
}
