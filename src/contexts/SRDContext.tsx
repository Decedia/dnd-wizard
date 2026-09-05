"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback, type ReactNode } from "react";
import { fetchSRDData, clearSRDCache, type SRDData } from "@/lib/srd-client";

interface SRDContextValue {
  data: SRDData | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  ruleset: "2014" | "2024";
  setRuleset: (ruleset: "2014" | "2024") => void;
}

const SRDContext = createContext<SRDContextValue | null>(null);

export function SRDProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SRDData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [ruleset, setRuleset] = useState<"2014" | "2024">("2014");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const srd = await fetchSRDData(ruleset);
      setData(srd);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load SRD data"));
    } finally {
      setLoading(false);
    }
  }, [ruleset]);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(() => ({ data, loading, error, refresh: load, ruleset, setRuleset }), [data, loading, error, load, ruleset]);

  return (
    <SRDContext.Provider value={value}>
      {children}
    </SRDContext.Provider>
  );
}

export function useSRD() {
  const ctx = useContext(SRDContext);
  if (!ctx) {
    throw new Error("useSRD must be used within SRDProvider");
  }
  return ctx;
}

export { clearSRDCache };
