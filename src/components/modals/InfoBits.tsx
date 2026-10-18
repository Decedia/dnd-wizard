"use client";

import { ReactNode } from "react";
import { DiceText } from "@/components/DiceText";
import { useLanguage } from "@/contexts/LanguageContext";

interface InfoSectionLabelProps {
  children: ReactNode;
  className?: string;
}

export function InfoSectionLabel({ children, className = "" }: InfoSectionLabelProps) {
  return (
    <span
      className={`block text-[10px] font-bold uppercase tracking-wider text-ink-muted ${className}`}
    >
      {children}
    </span>
  );
}

interface InfoCardProps {
  label?: ReactNode;
  labelClassName?: string;
  children: ReactNode;
  className?: string;
}

export function InfoCard({ label, labelClassName, children, className = "" }: InfoCardProps) {
  return (
    <div className={`rounded-2xl border-2 border-border-strong bg-surface p-4 ${className}`}>
      {label && <InfoSectionLabel className={labelClassName}>{label}</InfoSectionLabel>}
      <div className={label ? "mt-1.5" : ""}>{children}</div>
    </div>
  );
}

export function InfoCallout({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-ink/5 p-4">
      <InfoSectionLabel>{label}</InfoSectionLabel>
      <p className="mt-1 text-sm font-bold leading-relaxed text-ink">{children}</p>
    </div>
  );
}

interface InfoStatTileProps {
  label: ReactNode;
  value: ReactNode;
  emptyText?: string;
}

export function InfoStatTile({ label, value, emptyText = "—" }: InfoStatTileProps) {
  return (
    <div className="rounded-xl border-2 border-border-strong bg-surface p-3">
      <InfoSectionLabel>{label}</InfoSectionLabel>
      <p className="mt-0.5 text-sm font-bold text-ink">{value || emptyText}</p>
    </div>
  );
}

export function InfoChip({ children, emphasis = false }: { children: ReactNode; emphasis?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-lg border-2 px-2 py-1 text-xs font-bold text-ink ${
        emphasis ? "border-ink bg-ink/10" : "border-border-strong bg-paper-muted"
      }`}
    >
      {children}
    </span>
  );
}

export function InfoBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded bg-paper-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
      {children}
    </span>
  );
}

interface InfoProseProps {
  text: string;
  className?: string;
}

export function InfoProse({ text, className = "" }: InfoProseProps) {
  return (
    <div className={className}>
      <DiceText text={text} />
    </div>
  );
}

export function InfoTraitList({
  traits,
  emptyText,
}: {
  traits: { name: string; summary?: string; description?: string }[];
  emptyText: string;
}) {
  if (traits.length === 0) {
    return <p className="mt-1.5 text-xs text-ink-muted">{emptyText}</p>;
  }
  return (
    <div className="mt-1.5 space-y-2">
      {traits.map((trait, index) => (
        <div
          key={`${trait.name}-${index}`}
          className="rounded-xl border-2 border-border-strong bg-surface p-3"
        >
          <h4 className="text-sm font-bold text-ink">{trait.name}</h4>
          <div className="mt-1">
            <DiceText text={trait.summary || trait.description || ""} />
          </div>
        </div>
      ))}
    </div>
  );
}

interface EquipmentInfoPanelProps {
  option: {
    name: string;
    description: string;
    type: string;
    icon: ReactNode;
    source?: string;
    damageDice?: string;
    damageType?: string;
    properties?: string[];
    baseAC?: number;
    armorType?: "light" | "medium" | "heavy" | "shield";
    maxDexBonus?: number | null;
    contents?: string;
    cost?: { quantity: number; unit: string };
    weight?: number;
    category?: "melee" | "ranged";
    items?: Array<{ name: string; quantity: number; info?: any }>;
    weaponOptions?: Array<{ name: string; description: string; icon: ReactNode }>;
    bonusItems?: Array<{ name: string; quantity: number; info?: any }>;
    selectionCount?: number;
    selectedCount?: number;
    equipmentOption?: any;
  };
  t: ReturnType<typeof useLanguage>["t"];
  language: string;
}

export function EquipmentInfoPanel({ option, t, language }: EquipmentInfoPanelProps) {
  const isPackage = option.type === "item" && option.items && option.items.length > 0;
  const isWeapon = option.type === "weapon";
  const isArmor = option.type === "armor";
  const itemCount = option.selectionCount || 1;
  const selectedCount = option.selectedCount || 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border-2 border-border-strong bg-surface p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-paper-muted">
            <span className="text-[18px] leading-none">{option.icon}</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-ink">{option.name}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              {option.source && <InfoBadge>{option.source}</InfoBadge>}
              <InfoBadge>{isWeapon ? t("items.weapon", "Weapon") : isArmor ? t("items.armor", "Armor") : t("items.item", "Item")}</InfoBadge>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {option.description && (
        <InfoCallout label={t("modal.whyPlay", "Why choose this")}>
          {option.description}
        </InfoCallout>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        {isWeapon && option.damageDice && (
          <InfoStatTile label={t("items.damage", "Damage")} value={`${option.damageDice} ${option.damageType || ""}`} />
        )}
        {!isWeapon && option.baseAC !== undefined && (
          <InfoStatTile
            label={t("items.armorClass", "Armor Class")}
            value={
              (option.armorType ? `${option.armorType.charAt(0).toUpperCase() + option.armorType.slice(1)} AC ${option.baseAC}` : `AC ${option.baseAC}`) +
              (option.maxDexBonus === 0 ? ` (${t("items.noDex", "No DEX")})` : option.maxDexBonus !== null && option.maxDexBonus !== undefined ? ` (+${option.maxDexBonus} DEX)` : ` (${t("items.fullDex", "Full DEX")})`)
            }
          />
        )}
        {!isWeapon && !isArmor && !option.baseAC && !option.damageDice && (
          <InfoStatTile label={t("items.quantity", "Quantity")} value={`${itemCount}`} />
        )}
        {option.cost && (
          <InfoStatTile label={t("items.cost", "Cost")} value={`${option.cost.quantity} ${option.cost.unit}`} />
        )}
        {option.weight && (
          <InfoStatTile label={t("items.weight", "Weight")} value={`${option.weight} lb`} />
        )}
        {isWeapon && option.properties && option.properties.length > 0 && (
          <div className="col-span-2">
            <InfoSectionLabel>{t("items.properties", "Properties")}</InfoSectionLabel>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {option.properties?.map((p) => (
                <InfoChip key={p}>{p}</InfoChip>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contains (for packages only, shown once) */}
      {isPackage && option.items && option.items.length > 0 && (
        <div>
          <InfoSectionLabel>{t("equipment.contains", "Contains:")}</InfoSectionLabel>
          <div className="mt-1.5 space-y-2">
            {option.items.map((item) => (
              <div key={`${item.name}-${item.quantity}`} className="rounded-xl border-2 border-border-strong bg-surface p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper-muted">
                      <span className="text-[16px] leading-none">{item.info?.icon || "📦"}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-ink">{item.name}</h4>
                      <p className="text-xs text-ink-muted">{item.info?.description}</p>
                    </div>
                  </div>
                  {item.quantity > 1 && (
                    <span className="rounded-md bg-paper-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                      ×{item.quantity}
                    </span>
                  )}
                </div>
                {item.info?.type === "weapon" && item.info.damageDice && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <InfoChip emphasis>{item.info.damageDice} {item.info.damageType || ""}</InfoChip>
                    {item.info.properties?.map((p: string) => (
                      <InfoChip key={p}>{p}</InfoChip>
                    ))}
                  </div>
                )}
                {item.info?.type === "armor" && item.info.baseAC !== undefined && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <InfoChip emphasis>{item.info.armorType ? `${item.info.armorType.charAt(0).toUpperCase() + item.info.armorType.slice(1)} ` : ""}AC ${item.info.baseAC}</InfoChip>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
