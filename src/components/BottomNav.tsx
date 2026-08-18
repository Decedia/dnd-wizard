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
    href: "/character/new",
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
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-md safe-bottom">
      <div className="flex items-center justify-around rounded-full border border-gold/20 bg-charcoal-light/90 px-2 py-2 shadow-2xl backdrop-blur-xl">
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
                  ? "relative -top-2 bg-burgundy p-3 shadow-lg shadow-burgundy/30"
                  : "px-3 py-1.5"
                }
                ${isActive && !item.isHero ? "text-gold" : "text-parchment/60 hover:text-parchment"}
              `}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={`${item.isHero ? "h-7 w-7" : "h-5 w-5"}`} />
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
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function DragonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.5 2 6 4.5 6 7c0 1.5.5 2.8 1.4 3.8L4 14l2.5 1.5L6 18l3-1 3 1 3-1 3 1-1.5-2.5L20 14l-3.4-3.2C17.5 9.8 18 8.5 18 7c0-2.5-2.5-5-6-5zm-2 14a1 1 0 11-2 0 1 1 0 012 0zm4 0a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 11-2 0 1 1 0 012 0zm6 0a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
  );
}

function ScrollIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}
