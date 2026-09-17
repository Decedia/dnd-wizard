"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LockIcon, XIcon, GearIcon } from "@/components/icons";
import { useDebug } from "@/lib/debug/DebugContext";

export function DebugButton() {
  const { enabled, unlocked, password, setPassword, login, logout } = useDebug();
  const [showTerminal, setShowTerminal] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [localLogs, setLocalLogs] = useState<{ time: string; message: string }[]>([]);

  useEffect(() => {
    if (!showTerminal) return;

    const handleLog = (e: Event) => {
      const custom = e as CustomEvent<{ detail: string }>;
      const message = custom.detail;
      if (typeof message === "string") {
        const time = new Date().toLocaleTimeString("en-US", { hour12: false });
        setLocalLogs((prev) => [...prev.slice(-499), { time, message }]);
      }
    };

    const handleClear = () => {
      setLocalLogs([]);
    };

    window.addEventListener("debug-log", handleLog);
    window.addEventListener("debug-log-clear", handleClear);
    return () => {
      window.removeEventListener("debug-log", handleLog);
      window.removeEventListener("debug-log-clear", handleClear);
    };
  }, [showTerminal]);

  const handleButtonClick = () => {
    if (!enabled) {
      setShowAuth(true);
    } else if (!unlocked) {
      setShowAuth(true);
    } else {
      setShowTerminal(true);
      setLocalLogs([]);
    }
  };

  if (!enabled) {
    return (
      <div className="fixed bottom-4 left-4 z-[9999999]">
        <button
          type="button"
          onClick={handleButtonClick}
          className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg flex items-center justify-center hover:border-[var(--color-border-active)] transition-colors"
          title="Debug login"
        >
          <LockIcon className="h-5 w-5 text-[var(--color-text-muted)]" />
        </button>
        {showAuth && (
          <div className="absolute bottom-14 left-0 w-80 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl p-4 space-y-3">
            <div className="text-sm font-bold text-[var(--color-text-primary)]">Admin Debug Login</div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const success = login();
                  if (success) {
                    setShowAuth(false);
                    setShowTerminal(true);
                  }
                }
              }}
              placeholder="Enter password"
              className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-border-active)]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const success = login();
                  if (success) {
                    setShowAuth(false);
                    setShowTerminal(true);
                  }
                }}
                className="flex-1 py-1.5 rounded-lg bg-[var(--color-ink)] text-[var(--color-surface)] text-xs font-bold hover:opacity-90"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAuth(false);
                  setPassword("");
                }}
                className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] text-xs font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  const isAdmin = enabled && unlocked;

  return (
    <>
      <div className="fixed bottom-4 left-4 z-[9999999] flex items-center gap-2">
        <button
          type="button"
          onClick={handleButtonClick}
          className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg flex items-center justify-center hover:border-[var(--color-border-active)] transition-colors"
          title="Open debug terminal"
        >
          <span className="text-[var(--color-text-primary)] font-mono text-xs font-bold">$</span>
        </button>
        {isAdmin && (
          <Link
            href="/admin"
            className="w-10 h-10 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg flex items-center justify-center hover:border-[var(--color-border-active)] transition-colors"
            title="Admin Test Lab"
          >
            <GearIcon className="h-5 w-5 text-[var(--color-text-primary)]" />
          </Link>
        )}
      </div>
      {showTerminal && (
        <DebugTerminal
          logs={localLogs}
          onClose={() => setShowTerminal(false)}
          onClear={() => setLocalLogs([])}
          onLogout={logout}
        />
      )}
    </>
  );
}

function DebugTerminal({ logs, onClose, onClear, onLogout }: { logs: { time: string; message: string }[]; onClose: () => void; onClear: () => void; onLogout: () => void }) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-3xl h-[70vh] bg-[#0c0c0c] border border-[#333] rounded-xl shadow-2xl flex flex-col font-mono text-[13px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#333] bg-[#111]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
            <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
            <span className="ml-3 text-[#888] text-xs">Debug Terminal</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClear}
              className="px-3 py-1 rounded-md bg-[#1f1f1f] border border-[#333] text-[#aaa] text-xs hover:text-white hover:border-[#555]"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-1 rounded-md bg-[#1f1f1f] border border-[#333] text-[#aaa] text-xs hover:text-white hover:border-[#555] flex items-center gap-1"
            >
              Logout
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-[#222] text-[#888] hover:text-white"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1 text-[#cccccc]">
          {logs.length === 0 && <div className="text-[#555]">No logs yet. Interact with the app to generate debug output.</div>}
          {logs.map((entry, idx) => (
            <div key={idx} className="flex gap-3">
              <span className="text-[#555] shrink-0 select-none">{entry.time}</span>
              <span className="text-[#cccccc] break-all">{entry.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
