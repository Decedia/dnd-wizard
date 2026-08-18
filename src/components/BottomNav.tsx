"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const navItems = [
  {
    name: "Home",
    href: "/",
    icon: HomeIcon,
  },
  {
    name: "New Character",
    href: "/character/create",
    icon: DragonIcon,
    isHero: true,
  },
  {
    name: "Characters",
    href: "/",
    icon: ScrollIcon,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xs safe-bottom">
      <div className="flex items-center justify-around rounded-full border border-gold/20 bg-charcoal-light/90 px-2 py-1.5 shadow-2xl backdrop-blur-xl">
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
                flex flex-col items-center gap-0.5 rounded-full transition-all duration-200
                ${item.isHero
                  ? "relative -top-1.5 bg-burgundy px-3 py-1.5 shadow-lg shadow-burgundy/30"
                  : "px-2.5 py-1"
                }
                ${isActive && !item.isHero ? "text-gold" : "text-parchment/60 hover:text-parchment"}
              `}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={`${item.isHero ? "text-lg" : "text-sm"}`} />
              <span className={`font-medium ${item.isHero ? "text-[10px]" : "text-[10px]"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return <i className={`fa-solid fa-house ${className ?? ""}`} />;
}

function DragonIcon({ className }: { className?: string }) {
  return <i className={`fa-solid fa-hat-wizard ${className ?? ""}`} />;
}

function ScrollIcon({ className }: { className?: string }) {
  return <i className={`fa-solid fa-scroll ${className ?? ""}`} />;
}
