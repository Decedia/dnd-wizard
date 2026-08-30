"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { House, PlusCircle } from "phosphor-react";
import { WizardHatIcon } from "@/components/AppHeader";

const navItems = [
  {
    name: "Home",
    href: "/",
    icon: House,
  },
  {
    name: "New",
    href: "/character/create",
    icon: PlusCircle,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  const activeIndex = navItems.findIndex((item) => {
    return pathname === item.href;
  });

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm safe-bottom">
       <div className="flex items-center rounded-full bg-[var(--color-nav-bg)] p-1 relative">
           {navItems.map((item, index) => {
             const Icon = item.icon;
             const isActive = index === activeIndex;
             return (
               <Link
                 key={item.name}
                 href={item.href}
                 className={`
                   flex flex-col items-center justify-center gap-1 flex-1 py-2.5 transition-all duration-200 relative z-10 rounded-full
                   ${isActive ? "text-[var(--color-nav-active-icon)] font-semibold bg-[var(--color-nav-active-bg)]" : "text-[var(--color-nav-icon)]/70 hover:text-[var(--color-nav-icon)] hover:bg-[var(--color-nav-icon)]/5"}
                 `}
                 aria-current={isActive ? "page" : undefined}
               >
                <Icon className={`h-5 w-5`} weight={isActive ? "fill" : "regular"} />
                <span className={`font-medium text-[10px]`}>
                  {item.name}
                </span>
              </Link>
            );
           })}
        </div>
    </nav>
  );
}
