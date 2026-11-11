"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Character } from "@/lib/storage";
import { overrideOf } from "@/lib/overrides";
import { canAddTo, overridePatch, ruleValueOf } from "@/lib/override-rules";
import type { OverrideRequest } from "./CharacterSheetContext";

const fmt = (n: number, signed?: boolean) => (signed && n >= 0 ? `+${n}` : String(n));

/**
 * Set a number by hand: use the rules' number, set your own, or add to the
 * rules' number (a magic item, a DM's ruling). Your number stays after level-ups.
 */
export function OverrideSheet({ character, request, onChange, onClose }: { character: Character; request: OverrideRequest; onChange: (patch: Partial<Character>) => void; onClose: () => void }) {
  const { t } = useLanguage();
  const rule = ruleValueOf(character, request.key);
  const current = overrideOf(character, request.key);
  const addable = canAddTo(character, request.key);
  const [mode, setMode] = useState<"rules" | "set" | "add">(current ? (current.mode === "add" && addable ? "add" : "set") : "rules");
  const [setValue, setSetValue] = useState(current?.mode === "set" ? current.value : rule);
  const [addValue, setAddValue] = useState(current?.mode === "add" ? current.value : 1);
  const result = mode === "rules" ? rule : mode === "set" ? setValue : rule + addValue;

  const save = () => {
    onChange(overridePatch(character, request.key, mode === "rules" ? null : mode === "set" ? { mode: "set", value: setValue } : { mode: "add", value: addValue }));
    onClose();
  };

  const chip = (active: boolean) => `btn ${active ? "btn-primary" : "btn-secondary"} min-h-[36px] flex-1 px-2 text-[13px]`;
  const stepper = (value: number, set: (n: number) => void, signed: boolean) => (
    <div className="flex items-center justify-center gap-3">
      <button type="button" aria-label={t("featureEdit.fewer", "Fewer")} onClick={() => set(value - 1)} className="btn btn-secondary">−</button>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        onChange={(e) => set(Number(e.target.value) || 0)}
        className="input w-20 text-center text-lg font-bold"
        aria-label={request.label}
      />
      <button type="button" aria-label={t("featureEdit.more", "More")} onClick={() => set(value + 1)} className="btn btn-secondary">+</button>
      {signed && <span className="sr-only">{fmt(value, true)}</span>}
    </div>
  );

  return (
    <BottomSheet
      isOpen
      onClose={onClose}
      title={request.label}
      className="!mb-4 !max-h-[86vh]"
      footer={
        <div className="flex items-center gap-2 px-4 py-3">
          <button type="button" onClick={onClose} className="btn btn-secondary flex-1">{t("common.cancel", "Cancel")}</button>
          <button type="button" onClick={save} className="btn btn-primary flex-1">{t("featureEdit.save", "Save")}</button>
        </div>
      }
    >
      <div className="space-y-4 px-4 py-4">
        <div className="text-center">
          <div className="text-4xl font-black text-[var(--color-text-primary)]">{fmt(result, request.signed)}</div>
          <div className="mt-1 text-xs text-[var(--color-text-muted)]">{t("override.rules", { value: fmt(rule, request.signed) }, "The rules say {value}")}</div>
        </div>
        <div className="flex gap-1.5">
          <button type="button" aria-pressed={mode === "rules"} onClick={() => setMode("rules")} className={chip(mode === "rules")}>{t("override.useRules", "Use the rules")}</button>
          <button type="button" aria-pressed={mode === "set"} onClick={() => setMode("set")} className={chip(mode === "set")}>{t("override.setTo", "Set my own")}</button>
          {addable && <button type="button" aria-pressed={mode === "add"} onClick={() => setMode("add")} className={chip(mode === "add")}>{t("override.addTo", "Add to it")}</button>}
        </div>
        {mode === "set" && stepper(setValue, setSetValue, !!request.signed)}
        {mode === "add" && stepper(addValue, setAddValue, true)}
        <p className="text-xs text-[var(--color-text-muted)]">
          {mode === "rules"
            ? t("override.rulesHint", "The app works this number out for you, and it updates when you level up.")
            : mode === "set"
              ? t("override.setHint", "Your number always wins, even after a level-up. A dot marks it on the sheet.")
              : t("override.addHint", "Good for a magic item or a DM's bonus: it stays on top of the rules' number as that changes.")}
        </p>
      </div>
    </BottomSheet>
  );
}
