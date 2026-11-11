"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { useLanguage } from "@/contexts/LanguageContext";
import type { CustomFeatureTurn } from "@/lib/storage";
import type { FeatureDraft } from "@/lib/feature-edit";

type SlotChoice = "none" | CustomFeatureTurn["slot"];

interface Props {
  /** The feature being changed; absent when adding a new one. */
  initial?: FeatureDraft;
  /** It comes from the rules, so saving makes the player's own copy. */
  fromRules?: boolean;
  onSave: (draft: FeatureDraft) => void;
  onClose: () => void;
}

/** Add or change a feature: its name, its text, and how it is used on a turn. */
export function FeatureEditSheet({ initial, fromRules, onSave, onClose }: Props) {
  const { t } = useLanguage();
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [slot, setSlot] = useState<SlotChoice>(initial?.turn?.slot ?? "none");
  const [uses, setUses] = useState(initial?.turn?.uses?.max ?? 0);
  const [per, setPer] = useState<"short" | "long">(initial?.turn?.uses?.per ?? "long");

  const slots: { id: SlotChoice; label: string }[] = [
    { id: "none", label: t("featureEdit.slot.none", "Always on") },
    { id: "action", label: t("turn.slot.action", "Action") },
    { id: "bonus", label: t("turn.slot.bonus", "Bonus action") },
    { id: "reaction", label: t("turn.slot.reaction", "Reaction") },
    { id: "free", label: t("turn.slot.free", "No action needed") },
  ];

  const save = () => {
    const turn: CustomFeatureTurn | null = slot === "none" ? null : { slot, ...(uses > 0 ? { uses: { max: uses, per } } : {}) };
    onSave({ name, description, turn });
  };

  const chip = (active: boolean) =>
    `min-h-[36px] px-3 rounded-full border text-[13px] font-semibold transition-colors ${
      active
        ? "border-[var(--color-accent-indigo-500)] bg-[var(--color-accent-indigo-500)] text-white"
        : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)]"
    }`;

  const footer = (
    <div className="flex items-center gap-2 px-4 py-3">
      <button type="button" onClick={onClose} className="btn btn-secondary flex-1">
        {t("common.cancel", "Cancel")}
      </button>
      <button type="button" onClick={save} disabled={!name.trim()} className="btn btn-primary flex-1">
        {t("featureEdit.save", "Save")}
      </button>
    </div>
  );

  return (
    <BottomSheet
      isOpen
      onClose={onClose}
      title={initial ? t("featureEdit.editTitle", "Change feature") : t("featureEdit.addTitle", "New feature")}
      footer={footer}
      className="!mb-4 !max-h-[86vh]"
    >
      <div className="space-y-4 px-4 py-4">
        {fromRules && (
          <p className="text-xs text-[var(--color-text-muted)]">
            {t("featureEdit.fromRules", "This feature comes from the rules. Saving keeps your version, and level-ups won't change it back.")}
          </p>
        )}
        <label className="block">
          <span className="field-label-light">{t("featureEdit.name", "Name")}</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input mt-1 w-full" placeholder={t("featureEdit.namePlaceholder", "e.g. Blessing of the Forge")} />
        </label>
        <label className="block">
          <span className="field-label-light">{t("featureEdit.description", "What it does")}</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className="input mt-1 min-h-[120px] w-full" />
        </label>
        <div>
          <span className="field-label-light">{t("featureEdit.howUsed", "How you use it")}</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {slots.map((s) => (
              <button key={s.id} type="button" aria-pressed={slot === s.id} onClick={() => setSlot(s.id)} className={chip(slot === s.id)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
        {slot !== "none" && (
          <div>
            <span className="field-label-light">{t("featureEdit.uses", "Uses")}</span>
            <div className="mt-1.5 flex items-center gap-2">
              <button type="button" aria-label={t("featureEdit.fewer", "Fewer")} disabled={uses <= 0} onClick={() => setUses((n) => Math.max(0, n - 1))} className="btn btn-secondary">−</button>
              <span className="min-w-[88px] text-center text-sm font-semibold text-[var(--color-text-primary)]">
                {uses === 1 ? t("featureEdit.usesOne", "1 use") : uses > 1 ? t("featureEdit.usesN", { n: uses }, "{n} uses") : t("featureEdit.noLimit", "No limit")}
              </span>
              <button type="button" aria-label={t("featureEdit.more", "More")} disabled={uses >= 20} onClick={() => setUses((n) => Math.min(20, n + 1))} className="btn btn-secondary">+</button>
            </div>
            {uses > 0 && (
              <div className="mt-2 flex gap-1.5">
                <button type="button" aria-pressed={per === "short"} onClick={() => setPer("short")} className={chip(per === "short")}>
                  {t("featureEdit.perShort", "Back on a short rest")}
                </button>
                <button type="button" aria-pressed={per === "long"} onClick={() => setPer("long")} className={chip(per === "long")}>
                  {t("featureEdit.perLong", "Back on a long rest")}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
