"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchSRDData, clearSRDCache, type SRDData } from "@/lib/srd-client";

interface SRDContextValue {
  data: SRDData | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const SRDContext = createContext<SRDContextValue | null>(null);

export function SRDProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SRDData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const srd = await fetchSRDData();
      setData(srd);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load SRD data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <SRDContext.Provider value={{ data, loading, error, refresh: load }}>
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
