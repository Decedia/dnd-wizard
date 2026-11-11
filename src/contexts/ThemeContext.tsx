"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const saved = useStored("dnd-theme");
  const theme: Theme = saved === "dark" ? "dark" : "light";

  useEffect(() => {
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  }, [saved]);

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
