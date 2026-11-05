"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { HomeIcon, PlusCircleIcon, BookIcon } from "@/components/icons";
import { useLanguage } from "@/contexts/LanguageContext";

const navItems = [
  {
    nameKey: "nav.home",
    href: "/",
    icon: HomeIcon,
  },
  {
    nameKey: "nav.glossary",
    href: "/glossary",
    icon: BookIcon,
  },
  {
    nameKey: "nav.new",
    href: "/character/create",
    icon: PlusCircleIcon,
  },
];

const WIZARD_PATHS = ["/character/create", "/character/level-up"];

/** Height the docked nav takes, for content and floating buttons to clear it. */
export const BOTTOM_NAV_SPACE = "calc(4.25rem + env(safe-area-inset-bottom))";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLanguage();

  // Creation and level-up have their own footer and no way out mid-flow.
  if (WIZARD_PATHS.some((p) => pathname?.startsWith(p))) return null;

  const activeIndex = navItems.findIndex((item) => pathname === item.href);

  return (
    <>
    {/* Keeps the end of every page clear of the docked nav. */}
    <div aria-hidden="true" style={{ height: BOTTOM_NAV_SPACE }} />
    <nav
      aria-label={t("nav.main", "Main")}
      className="fixed inset-x-0 bottom-0 z-40 bg-[var(--color-nav-bg)]"
      style={{ paddingBottom: "max(6px, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-3 gap-1 px-2 pt-1.5">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = index === activeIndex;
          return (
            <Link
              key={item.nameKey}
              href={item.href}
              className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl transition-colors ${
                isActive
                  ? "bg-[var(--color-nav-active-bg)] text-[var(--color-nav-active-icon)]"
                  : "text-[var(--color-nav-icon)]/75 hover:text-[var(--color-nav-icon)]"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-semibold">{t(item.nameKey)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
    </>
  );
}
