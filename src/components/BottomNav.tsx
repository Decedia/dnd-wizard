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
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function DragonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C9 2 7 4 7 6.5c0 .8.2 1.5.6 2.1L5.5 12l2.2 1.3-.3 2.2 2.5-.8 2.5.8-.3-2.2 2.2-1.3-2.1-1.4C12.8 9.8 13 9.1 13 8.5c0-.8-.3-1.5-.8-2C12 6.2 12 6 12 6s0 .2.2.5c.5-.5.8-1.2.8-2 0-1.1-1-2-2.5-2-.5 0-1 .1-1.5.3.2-.3.3-.7.3-1.1C9 1.2 8 0 6.5 0S4 1.2 4 2.7c0 .4.1.8.3 1.1-.5-.2-1-.3-1.5-.3C1.5 3.5.5 4.6.5 6s1 2.5 2.5 2.5c.5 0 1-.1 1.5-.3-.2.3-.3.7-.3 1.1 0 1.5 1.5 2.7 3.5 2.7s3.5-1.2 3.5-2.7c0-.4-.1-.8-.3-1.1.5.2 1 .3 1.5.3 1.5 0 2.5-1 2.5-2.5s-1-2.5-2.5-2.5zM8.5 14a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm7 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM6 7.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm12 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3z" />
    </svg>
  );
}

function ScrollIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h12a2 2 0 002-2v-2H10v2a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h12a2 2 0 012 2v2h8v-2a2 2 0 00-2-2H8z" />
      <path d="M4 5h16v12H4z" />
    </svg>
  );
}
