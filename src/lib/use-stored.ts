import { useSyncExternalStore } from "react";

// Browser-only values (localStorage, the page URL) read without an effect:
// the server render and first paint use the fallback, then React switches to
// the stored value with no extra render pass.
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Saves a value (null removes it) and updates every component that reads it. */
export function writeStored(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {}
  listeners.forEach((l) => l());
}

/** A localStorage value, kept in step with writes from this tab and others. */
export function useStored(key: string): string | null {
  return useSyncExternalStore(subscribe, () => readStored(key), () => null);
}

const noSubscribe = () => () => {};

/** Whether the page was opened with this URL query flag (e.g. ?debug). */
export function useQueryFlag(name: string): boolean {
  return useSyncExternalStore(noSubscribe, () => new URLSearchParams(window.location.search).has(name), () => false);
}
