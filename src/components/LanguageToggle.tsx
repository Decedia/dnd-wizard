"use client";

import { useLanguage } from "@/contexts/LanguageContext";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const isId = language === "id";

  const toggle = () => {
    setLanguage(isId ? "en" : "id");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-9 min-w-[2.25rem] items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-[10px] font-semibold uppercase transition-all hover:border-[var(--color-border-active)]"
      aria-label={isId ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
      title={isId ? "English" : "Bahasa Indonesia"}
    >
      {isId ? "ID" : "EN"}
    </button>
  );
}
