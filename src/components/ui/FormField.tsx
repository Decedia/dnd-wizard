"use client";

import { ReactNode, forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, useState, isValidElement, cloneElement, Children } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({
  label,
  required = false,
  error = false,
  helperText,
  children,
  className = "",
}: FormFieldProps) {
  const { t } = useLanguage();

  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, "-")}`;

  const enhancedChildren = Children.map(children, (child) => {
    if (!isValidElement(child)) return child;
    const childProps = child.props as Record<string, any>;
    return cloneElement(child as React.ReactElement<any>, {
      id: fieldId,
      className: `${childProps.className || ""} input ${error ? "border-[var(--color-error-500)] focus:border-[var(--color-error-500)]" : ""}`,
      "aria-invalid": error,
      "aria-describedby": error || helperText ? `${fieldId}-message` : undefined,
    });
  });

  return (
    <div className={`space-y-1 ${className}`}>
      <label htmlFor={fieldId} className="field-label-light">
        {label}
        {required && <span className="text-[var(--color-error-500)] ml-1" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        {enhancedChildren}
      </div>
      {(error || helperText) && (
        <div
          id={`${fieldId}-message`}
          className={`text-xs transition-colors ${
            error
              ? "text-[var(--color-error-600)]"
              : "text-[var(--color-text-muted)]"
          }`}
          role={error ? "alert" : undefined}
        >
          {error && helperText
            ? helperText
            : error
            ? t("form.fieldRequired", "This field is required")
            : helperText}
        </div>
      )}
    </div>
  );
}

export interface ValidatedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  helperText?: string;
  validate?: (value: string) => boolean;
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ label, required = false, helperText, validate, value, onChange, onBlur, ...props }, ref) => {
    const { t } = useLanguage();
    const [error, setError] = useState(false);
    const [touched, setTouched] = useState(false);

    const checkError = (val: string) => {
      if (required && (!val || val.trim() === "")) return true;
      if (validate && val && !validate(val)) return true;
      return false;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setError(checkError(val));
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      setError(checkError(e.target.value));
      onBlur?.(e);
    };

    const showError = touched && error;

    return (
      <FormField
        label={label}
        required={required}
        error={showError}
        helperText={helperText}
      >
        <input
          ref={ref}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          {...props}
        />
      </FormField>
    );
  }
);

ValidatedInput.displayName = "ValidatedInput";

export interface ValidatedSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  required?: boolean;
  helperText?: string;
  placeholder?: string;
  options: { value: string; label: string }[];
}

export const ValidatedSelect = forwardRef<HTMLSelectElement, ValidatedSelectProps>(
  ({ label, required = false, helperText, placeholder, options, value, onChange, onBlur, ...props }, ref) => {
    const { t } = useLanguage();
    const [error, setError] = useState(false);
    const [touched, setTouched] = useState(false);

    const checkError = (val: string) => {
      if (required && (!val || val.trim() === "")) return true;
      return false;
    };

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setError(checkError(val));
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setTouched(true);
      setError(checkError(e.target.value));
      onBlur?.(e);
    };

    const showError = touched && error;

    return (
      <FormField
        label={label}
        required={required}
        error={showError}
        helperText={helperText}
      >
        <select
          ref={ref}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>
    );
  }
);

ValidatedSelect.displayName = "ValidatedSelect";

export interface ValidatedTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  required?: boolean;
  helperText?: string;
  validate?: (value: string) => boolean;
}

export const ValidatedTextarea = forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({ label, required = false, helperText, validate, value, onChange, onBlur, ...props }, ref) => {
    const { t } = useLanguage();
    const [error, setError] = useState(false);
    const [touched, setTouched] = useState(false);

    const checkError = (val: string) => {
      if (required && (!val || val.trim() === "")) return true;
      if (validate && val && !validate(val)) return true;
      return false;
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setError(checkError(val));
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setTouched(true);
      setError(checkError(e.target.value));
      onBlur?.(e);
    };

    const showError = touched && error;

    return (
      <FormField
        label={label}
        required={required}
        error={showError}
        helperText={helperText}
      >
        <textarea
          ref={ref}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`${props.className || ""} textarea`}
          {...props}
        />
      </FormField>
    );
  }
);

ValidatedTextarea.displayName = "ValidatedTextarea";