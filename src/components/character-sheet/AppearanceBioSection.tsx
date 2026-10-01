"use client";

import { useState } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { SectionCard } from "./SectionCard";
import { DescriptionText } from "./DescriptionText";
import { SunIcon as Sun } from "@/components/icons";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Character } from "@/lib/storage";
import { rebuildDerived } from "@/lib/character-creation";
import { saveCharacter } from "@/lib/storage";
import { RefreshIcon as Refresh } from "@/components/icons";

interface AppearanceBioSectionProps {
  character: Character & {
    appearance: {
      age: string;
      height: string;
      weight: string;
      eyes: string;
      skin: string;
      hair: string;
      characterAppearance: string;
      personality: string;
      backstory: string;
      alliesOrganizations: string;
      additionalFeaturesTraits: string;
      treasure: string;
    };
  };
  onChange: (patch: Partial<Character & { appearance: Character["appearance"] }>) => void;
  editMode?: boolean;
}

export function AppearanceBioSection({ character, onChange, editMode = true }: AppearanceBioSectionProps) {
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildStatus, setRebuildStatus] = useState<"idle" | "done" | "failed">("idle");

  /**
   * Re-derives everything that follows from class, race, subclass and level, and
   * saves it. Player choices and anything in play are preserved, so this is safe
   * to press mid-combat and safe to press twice.
   */
  const handleRebuild = async () => {
    if (rebuilding) return;
    setRebuilding(true);
    try {
      // The sheet's own language, so rebuilt feature text is not English on an
      // Indonesian character.
      const rebuilt = rebuildDerived(character, language);
      onChange(rebuilt);
      await saveCharacter(rebuilt);
      setRebuildStatus("done");
    } catch (error) {
      // Previously a bare finally, so a throw looked exactly like a no-op.
      setRebuildStatus("failed");
      console.error("rebuild failed", error);
    } finally {
      setRebuilding(false);
    }
  };

  const { onFieldBlur } = useCharacterSheet();
  const { t, language } = useLanguage();
  const updateField = (field: keyof Character["appearance"], value: string) => {
    onChange({
      appearance: { ...character.appearance, [field]: value },
    });
  };

  return (
    <SectionCard id="appearance" title={t("section.appearanceBio")} icon={<Sun className="h-5 w-5" />}>
      {editMode ? (
        <>
          <div className="grid grid-cols-2 divide-x-2 divide-paper/20">
            <Field label={t("appearance.age")}>
              <input
                type="text"
                value={character.appearance.age}
                onChange={(e) => updateField("age", e.target.value)}
                onBlur={onFieldBlur}
                className="input"
                placeholder={t("placeholder.e.g27")}
              />
            </Field>
            <Field label={t("appearance.height")} className="pl-4">
              <input
                type="text"
                value={character.appearance.height}
                onChange={(e) => updateField("height", e.target.value)}
                onBlur={onFieldBlur}
                className="input"
                placeholder={t("placeholder.e.g6ft2")}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 divide-x-2 divide-paper/20">
            <Field label={t("appearance.weight")}>
              <input
                type="text"
                value={character.appearance.weight}
                onChange={(e) => updateField("weight", e.target.value)}
                onBlur={onFieldBlur}
                className="input"
                placeholder={t("placeholder.e.g180lbs")}
              />
            </Field>
            <Field label={t("appearance.eyes")} className="pl-4">
              <input
                type="text"
                value={character.appearance.eyes}
                onChange={(e) => updateField("eyes", e.target.value)}
                onBlur={onFieldBlur}
                className="input"
                placeholder={t("placeholder.e.gBlue")}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 divide-x-2 divide-paper/20">
            <Field label={t("appearance.skin")}>
              <input
                type="text"
                value={character.appearance.skin}
                onChange={(e) => updateField("skin", e.target.value)}
                onBlur={onFieldBlur}
                className="input"
                placeholder={t("placeholder.e.gFair")}
              />
            </Field>
            <Field label={t("appearance.hair")} className="pl-4">
              <input
                type="text"
                value={character.appearance.hair}
                onChange={(e) => updateField("hair", e.target.value)}
                onBlur={onFieldBlur}
                className="input"
                placeholder={t("placeholder.e.gBrown")}
              />
            </Field>
          </div>

          <div className="mt-4 space-y-4">
            <Field label={t("appearance.characterAppearance")}>
              <textarea
                value={character.appearance.characterAppearance}
                onChange={(e) => updateField("characterAppearance", e.target.value)}
                onBlur={onFieldBlur}
                className="textarea min-h-[80px]"
                placeholder={t("placeholder.describeAppearance")}
              />
            </Field>
            <Field label={t("appearance.personality")}>
              <textarea
                value={character.appearance.personality}
                onChange={(e) => updateField("personality", e.target.value)}
                onBlur={onFieldBlur}
                className="textarea min-h-[80px]"
                placeholder={t("placeholder.describePersonality")}
              />
            </Field>
            <Field label={t("appearance.backstory")}>
              <textarea
                value={character.appearance.backstory}
                onChange={(e) => updateField("backstory", e.target.value)}
                onBlur={onFieldBlur}
                className="textarea min-h-[120px]"
                placeholder={t("placeholder.whereFrom")}
              />
            </Field>
            <Field label={t("appearance.allies")}>
              <textarea
                value={character.appearance.alliesOrganizations}
                onChange={(e) => updateField("alliesOrganizations", e.target.value)}
                onBlur={onFieldBlur}
                className="textarea min-h-[80px]"
                placeholder={t("placeholder.listAllies")}
              />
            </Field>
            <Field label={t("appearance.additionalFeatures")}>
              <textarea
                value={character.appearance.additionalFeaturesTraits}
                onChange={(e) => updateField("additionalFeaturesTraits", e.target.value)}
                onBlur={onFieldBlur}
                className="textarea min-h-[80px]"
                placeholder={t("placeholder.additionalFeatures")}
              />
            </Field>
            <Field label={t("appearance.treasure")}>
              <textarea
                value={character.appearance.treasure}
                onChange={(e) => updateField("treasure", e.target.value)}
                onBlur={onFieldBlur}
                className="textarea min-h-[80px]"
                placeholder={t("placeholder.notableTreasure")}
              />
            </Field>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 divide-x-2 divide-paper/20">
            <ViewField label={t("appearance.age")} value={character.appearance.age} />
            <ViewField label={t("appearance.height")} value={character.appearance.height} className="pl-4" />
          </div>
          <div className="grid grid-cols-2 divide-x-2 divide-paper/20">
            <ViewField label={t("appearance.weight")} value={character.appearance.weight} />
            <ViewField label={t("appearance.eyes")} value={character.appearance.eyes} className="pl-4" />
          </div>
          <div className="grid grid-cols-2 divide-x-2 divide-paper/20">
            <ViewField label={t("appearance.skin")} value={character.appearance.skin} />
            <ViewField label={t("appearance.hair")} value={character.appearance.hair} className="pl-4" />
          </div>

          <div className="mt-4 space-y-3">
             {character.appearance.characterAppearance && (
              <ViewField label={t("appearance.characterAppearance")} value={character.appearance.characterAppearance} />
            )}
            {character.appearance.personality && (
              <ViewField label={t("appearance.personality")} value={character.appearance.personality} />
            )}
            {character.appearance.backstory && (
              <ViewField label={t("appearance.backstory")} value={character.appearance.backstory} />
            )}
            {character.appearance.alliesOrganizations && (
              <ViewField label={t("appearance.allies")} value={character.appearance.alliesOrganizations} />
            )}
            {character.appearance.additionalFeaturesTraits && (
              <ViewField label={t("appearance.additionalFeatures")} value={character.appearance.additionalFeaturesTraits} />
            )}
            {character.appearance.treasure && (
              <ViewField label={t("appearance.treasure")} value={character.appearance.treasure} />
            )}
          </div>
        </>
      )}

      {/* Rebuild sits under everything else: it is a maintenance action, not
          part of the character. */}
      <div className="mt-4 border-t border-[var(--color-border)] pt-3">
        <button
          type="button"
          onClick={() => { setRebuildStatus("idle"); void handleRebuild(); }}
          disabled={rebuilding}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-active)] hover:text-[var(--color-text-primary)] disabled:opacity-60"
        >
          <Refresh className="h-3.5 w-3.5" />
          {rebuilding ? t("features.syncing") : t("appearance.rebuild", "Rebuild from class, race and level")}
        </button>
        <p
          className={`mt-1.5 text-[10px] leading-snug ${
            rebuildStatus === "failed"
              ? "text-[var(--color-danger-600)]"
              : rebuildStatus === "done"
                ? "text-[var(--color-success-600)]"
                : "text-[var(--color-text-muted)]"
          }`}
        >
          {rebuildStatus === "failed"
            ? t("appearance.rebuildFailed", "Rebuild failed. See the console for details.")
            : rebuildStatus === "done"
              ? t("appearance.rebuildDone", "Rebuilt from class, race and level.")
              : t(
                  "appearance.rebuildHint",
                  "Re-derives features, spells and stats. Keeps your choices, hit points, spent slots and active effects."
                )}
        </p>
      </div>
    </SectionCard>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className || ""}`}>
      <span className="field-label-light">{label}</span>
      {children}
    </div>
  );
}

function ViewField({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className || ""}`}>
      <span className="field-label-light">{label}</span>
      <span className="text-sm font-bold text-[var(--color-text-primary)]">{value || "—"}</span>
    </div>
  );
}
