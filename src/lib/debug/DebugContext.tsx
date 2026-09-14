"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";

const ADMIN_PASSWORD = "1997a";
const STORAGE_KEY = "admin_debug_enabled";

interface DebugEntry {
  time: string;
  message: string;
}

interface DebugContextValue {
  enabled: boolean;
  unlocked: boolean;
  password: string;
  setPassword: (value: string) => void;
  login: () => boolean;
  logout: () => void;
  logs: DebugEntry[];
  addLog: (message: string) => void;
  clearLogs: () => void;
  log: (message: string, ...args: any[]) => void;
}

const DebugContext = createContext<DebugContextValue | undefined>(undefined);

export function DebugProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState<boolean>(false);
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [logs, setLogs] = useState<DebugEntry[]>([]);
  const logsEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "1") {
        setEnabled(true);
        setUnlocked(true);
      }
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, enabled ? "1" : "0");
    } catch {}
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const handleLog = (e: Event) => {
      const custom = e as CustomEvent<{ detail: string }>;
      const message = custom.detail;
      if (typeof message === "string") {
        const time = new Date().toLocaleTimeString("en-US", { hour12: false });
        setLogs((prev) => [...prev.slice(-499), { time, message }]);
      }
    };

    const handleClear = () => {
      setLogs([]);
    };

    window.addEventListener("debug-log", handleLog);
    window.addEventListener("debug-log-clear", handleClear);
    return () => {
      window.removeEventListener("debug-log", handleLog);
      window.removeEventListener("debug-log-clear", handleClear);
    };
  }, [enabled]);

  useEffect(() => {
    if (enabled && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, enabled]);

  const login = useCallback(() => {
    if (password === ADMIN_PASSWORD) {
      setUnlocked(true);
      setEnabled(true);
      setPassword("");
      return true;
    }
    return false;
  }, [password]);

  const logout = useCallback(() => {
    setUnlocked(false);
    setEnabled(false);
    setPassword("");
  }, []);

  const addLog = useCallback((message: string) => {
    if (!enabled) return;
    const time = new Date().toLocaleTimeString("en-US", { hour12: false });
    setLogs((prev) => [...prev.slice(-499), { time, message }]);
    try {
      window.dispatchEvent(new CustomEvent("debug-log", { detail: message }));
    } catch {}
  }, [enabled]);

  const log = useCallback((message: string, ...args: any[]) => {
    const text = args.length > 0 ? `${message} ${JSON.stringify(args)}` : message;
    addLog(text);
    console.log(message, ...args);
  }, [addLog]);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return (
    <DebugContext.Provider value={{ enabled, unlocked, password, setPassword, login, logout, logs, addLog, clearLogs, log }}>
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  const ctx = useContext(DebugContext);
  if (!ctx) throw new Error("useDebug must be used within a DebugProvider");
  return ctx;
}

export function useDebugLogger(prefix = "") {
  const { log } = useDebug();
  const prefixed = (message: string, ...args: any[]) => {
    const text = prefix ? `[${prefix}] ${message}` : message;
    log(text, ...args);
  };
  return Object.assign(prefixed, { log: prefixed, clear: () => {} });
}

