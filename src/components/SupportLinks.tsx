"use client";

import { useState } from "react";
import { ChatCircleText, Coffee } from "@phosphor-icons/react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BottomSheet } from "@/components/modals/BottomSheet";

/** Where feedback goes. */
export const FEEDBACK_EMAIL = "auryanmail@gmail.com";
/** The tip page (Trakteer, Saweria, Ko-fi...). Empty until the owner picks one: the button then says it is coming soon. */
export const COFFEE_URL = "";

/** A mailto link with a subject and a short template, so feedback arrives sorted. */
export function feedbackHref(page: string, language: string): string {
  const subject = "DND Wizard feedback";
  const body = language === "id"
    ? `Halaman: ${page}\n\nApa yang terjadi:\n\nApa yang kamu harapkan:\n`
    : `Page: ${page}\n\nWhat happened:\n\nWhat you expected:\n`;
  return `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/** "Send feedback" and "Buy me a coffee" pills for the home screen. */
export function SupportLinks() {
  const { t, language } = useLanguage();
  const [soon, setSoon] = useState(false);
  // Same look as the Data management buttons above it.
  const pill = "flex items-center justify-center gap-2 rounded-full border border-border-muted bg-paper py-2.5 text-sm text-ink transition-colors hover:bg-paper-muted";
  return (
    <>
      <div className="mt-8">
        <h3 className="mb-3 text-xs font-bold tracking-widest text-ink-muted">{t("support.title", "SUPPORT")}</h3>
        <div className="grid grid-cols-2 gap-3">
          <a
            href={feedbackHref("", language)}
            // The page address is added on tap, so the server-rendered link matches the first client render.
            onClick={(e) => { e.currentTarget.href = feedbackHref(window.location.href, language); }}
            className={pill}
          >
            <ChatCircleText size={16} />
            {t("support.feedback", "Send feedback")}
          </a>
          {COFFEE_URL ? (
            <a href={COFFEE_URL} target="_blank" rel="noopener noreferrer" className={pill}>
              <Coffee size={16} />
              {t("support.coffee", "Buy me a coffee")}
            </a>
          ) : (
            <button type="button" onClick={() => setSoon(true)} className={pill}>
              <Coffee size={16} />
              {t("support.coffee", "Buy me a coffee")}
            </button>
          )}
        </div>
      </div>
      <BottomSheet isOpen={soon} onClose={() => setSoon(false)} title={t("support.coffee", "Buy me a coffee")}>
        <div className="space-y-4 p-4">
          <p className="text-sm text-[var(--color-text-secondary)]">{t("support.coffeeSoon", "Thank you! The tip link is coming soon.")}</p>
          <button type="button" onClick={() => setSoon(false)} className="btn btn-primary w-full">
            {t("common.close", "Close")}
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
