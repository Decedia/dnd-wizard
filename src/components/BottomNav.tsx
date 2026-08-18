"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, Wand2, ScrollText } from "lucide-react";

const navItems = [
  {
    name: "Home",
    href: "/",
    icon: Home,
  },
  {
    name: "New Character",
    href: "/character/create",
    icon: Wand2,
    isHero: true,
  },
  {
    name: "Characters",
    href: "/",
    icon: ScrollText,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[96%] max-w-sm safe-bottom">
      <div className="flex items-center rounded-full border border-gold/20 bg-charcoal-light/90 shadow-2xl backdrop-blur-xl overflow-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isHero
            ? pathname === item.href
            : pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex flex-col items-center justify-center gap-1 flex-1 py-2.5 transition-all duration-200
                ${item.isHero
                  ? "bg-burgundy shadow-lg shadow-burgundy/30"
                  : ""
                }
                ${isActive && !item.isHero ? "text-gold" : "text-parchment/60 hover:text-parchment"}
              `}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={`${item.isHero ? "h-6 w-6" : "h-5 w-5"}`} />
              <span className={`font-medium ${item.isHero ? "text-xs" : "text-[10px]"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
