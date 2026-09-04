"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { HomeIcon, PlusCircleIcon } from "@/components/icons";
import { WizardHatIcon } from "@/components/icons";

const navItems = [
  {
    name: "Home",
    href: "/",
    icon: HomeIcon,
  },
  {
    name: "New",
    href: "/character/create",
    icon: PlusCircleIcon,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  const activeIndex = navItems.findIndex((item) => {
    return pathname === item.href;
  });

  return (
    <nav className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[99999] w-[92%] max-w-sm">
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
                <Icon className={`h-5 w-5`} />
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
