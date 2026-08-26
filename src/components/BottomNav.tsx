"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { House, DiceFive, PlusCircle } from "phosphor-react";
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
  {
    name: "Dice",
    href: "/dice",
    icon: DiceFive,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  const activeIndex = navItems.findIndex((item) => {
    return pathname === item.href;
  });

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm safe-bottom">
       <div className="flex items-center rounded-full bg-ink p-1 relative">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = index === activeIndex;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex flex-col items-center justify-center gap-1 flex-1 py-2.5 transition-all duration-200 relative z-10 rounded-full
                  ${isActive ? "text-ink font-semibold bg-white" : "text-white/70 hover:text-white hover:bg-white/5"}
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
         {activeIndex >= 0 && (
           <div
             className="absolute inset-y-0 rounded-full bg-white transition-all duration-300 ease-out pointer-events-none"
             style={{
               left: `${(activeIndex / navItems.length) * 100}%`,
               width: `${(100 / navItems.length)}%`,
             }}
           />
         )}
       </div>
    </nav>
  );
}
