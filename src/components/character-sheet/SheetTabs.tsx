"use client";

import { SwordIcon as Sword, StarIcon as Star, BackpackIcon as Backpack, LightningIcon as Lightning, UserIcon as User } from "@/components/icons";
import { BOTTOM_NAV_SPACE } from "@/components/BottomNav";
import { useLanguage } from "@/contexts/LanguageContext";

export type TabId = "combat" | "features" | "gear" | "spells" | "bio";

interface SheetTabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  /** Tabs to leave out, such as Spells for a character who can't cast. */
  hidden?: TabId[];
}

const TABS: { id: TabId; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "combat", label: "Combat", Icon: Sword },
  { id: "features", label: "Features", Icon: Star },
  { id: "gear", label: "Gear", Icon: Backpack },
  { id: "spells", label: "Spells", Icon: Lightning },
  { id: "bio", label: "Bio", Icon: User },
];

/** The sheet's tabs, docked at the bottom in place of the main nav (the header's back button goes home). */
export function SheetTabs({ activeTab, onTabChange, hidden = [] }: SheetTabsProps) {
  const { t } = useLanguage();
  const tabs = TABS.filter((tab) => !hidden.includes(tab.id));
  return (
    <>
      <div aria-hidden="true" style={{ height: BOTTOM_NAV_SPACE }} />
      <nav
        aria-label={t("sheet.tabs", "Sheet tabs")}
        className="fixed inset-x-0 bottom-0 z-40 bg-[var(--color-nav-bg)]"
        style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto grid max-w-lg gap-1 px-2 pt-1.5" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.Icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
                  isActive ? "bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active-icon)]" : "text-[var(--color-nav-icon)]/75 hover:text-[var(--color-nav-icon)]"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[11px] font-semibold">{t(`sheet.tab.${tab.id}`, tab.label)}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
