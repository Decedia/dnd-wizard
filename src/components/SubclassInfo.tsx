"use client";

import { getStaticSubclassDetails } from "@/lib/srd-client";
import { useLanguage } from "@/contexts/LanguageContext";
import { RichText } from "@/components/RichText";
import { toPlainText } from "@/lib/rich-text";

const slug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Subclass description plus one card per feature, in level order. */
export function SubclassInfo({ characterClass, subclass, description }: { characterClass: string; subclass: string; description?: unknown }) {
  const { t, tDesc, language } = useLanguage();
  const details = getStaticSubclassDetails(characterClass, subclass, language);
  const key = `${characterClass.toLowerCase()}-${slug(subclass)}`;
  const intro = tDesc(`subclass.desc.${key}`, toPlainText(description ?? details?.description));
  const features = [...(details?.features || [])].sort((a: any, b: any) => (a.level || 0) - (b.level || 0));

  return (
    <div className="space-y-4">
      <RichText text={intro} className="text-xs text-[var(--color-text-secondary)]" />
      {features.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{t("section.featuresTraits", "Features & Traits")}</div>
          {features.map((f: any, i: number) => (
            <div key={`${f.name}-${i}`} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="mb-1.5 flex items-center gap-2">
                {f.level && (
                  <span className="shrink-0 rounded-full bg-[var(--color-ink)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-paper)]">
                    {t("levelUp.flow.levelN", { level: f.level }, "Level {level}")}
                  </span>
                )}
                <span className="min-w-0 text-sm font-bold text-[var(--color-text-primary)]">{f.name}</span>
              </div>
              <RichText text={tDesc(`subclass.feature.desc.${key}-${slug(f.name)}`, toPlainText(f.description))} className="text-xs text-[var(--color-text-secondary)]" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
