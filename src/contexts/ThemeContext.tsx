"use client";

import { createContext, useContext, useEffect, useMemo, useCallback, useSyncExternalStore, type ReactNode } from "react";
import { useStored, writeStored } from "@/lib/use-stored";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "light", toggleTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribeScheme(onChange: () => void) {
  const query = matchMedia(DARK_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const saved = useStored("dnd-theme");
  const systemDark = useSyncExternalStore(subscribeScheme, () => matchMedia(DARK_QUERY).matches, () => false);
  // No saved pick: follow the device's light or dark setting.
  const theme: Theme = saved === "dark" || saved === "light" ? saved : systemDark ? "dark" : "light";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    writeStored("dnd-theme", theme === "light" ? "dark" : "light");
  }, [theme]);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
