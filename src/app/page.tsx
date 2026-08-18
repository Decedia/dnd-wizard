"use client";

import { useState } from "react";

const navItems = [
  { name: "Home", href: "#home", icon: HomeIcon },
  { name: "Search", href: "#search", icon: SearchIcon },
  { name: "Explore", href: "#explore", icon: ExploreIcon },
  { name: "Profile", href: "#profile", icon: ProfileIcon },
];

function TopNav() {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-4xl">
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-6 py-3 shadow-2xl backdrop-blur-xl">
        <a href="#home" className="text-xl font-bold tracking-tight text-white">
          MySite
        </a>
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-neutral-300 transition-colors hover:text-white"
            >
              {item.name}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}

function BottomNav() {
  const [active, setActive] = useState("Home");

  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-md">
      <div className="flex items-center justify-around rounded-2xl border border-white/10 bg-white/10 px-4 py-3 shadow-2xl backdrop-blur-xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.name;
          return (
            <a
              key={item.name}
              href={item.href}
              onClick={() => setActive(item.name)}
              className={`flex flex-col items-center gap-1 transition-colors ${
                isActive ? "text-white" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] font-medium">{item.name}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 text-white">
      <TopNav />

      <main className="px-4 pt-24 pb-32">
        <section id="home" className="max-w-4xl mx-auto py-20">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Welcome
          </h1>
          <p className="text-xl text-neutral-300 leading-relaxed">
            A simple website with floating top and bottom navigation, built with Next.js and Tailwind CSS.
          </p>
        </section>

        <section id="search" className="max-w-4xl mx-auto py-20">
          <h2 className="text-3xl font-bold mb-4">Search</h2>
          <p className="text-neutral-300 leading-relaxed">
            Find what you are looking for quickly and easily.
          </p>
        </section>

        <section id="explore" className="max-w-4xl mx-auto py-20">
          <h2 className="text-3xl font-bold mb-4">Explore</h2>
          <p className="text-neutral-300 leading-relaxed">
            Discover new content and ideas.
          </p>
        </section>

        <section id="profile" className="max-w-4xl mx-auto py-20">
          <h2 className="text-3xl font-bold mb-4">Profile</h2>
          <p className="text-neutral-300 leading-relaxed">
            Manage your account and preferences.
          </p>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function ExploreIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
