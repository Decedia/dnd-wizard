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
      <div className="flex items-center justify-around rounded-full border border-gold/20 bg-charcoal-light/90 px-4 py-2.5 shadow-2xl backdrop-blur-xl">
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
                flex flex-col items-center gap-1 rounded-full transition-all duration-200
                ${item.isHero
                  ? "relative -top-2 bg-burgundy px-4 py-2 shadow-lg shadow-burgundy/30"
                  : "px-4 py-1.5"
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
