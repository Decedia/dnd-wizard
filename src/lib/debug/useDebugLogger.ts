"use client";

import { useDebug } from "./DebugContext";

export function useDebugLogger(prefix = "") {
  const { addLog } = useDebug();

  const log = (message: string, ...args: any[]) => {
    const text = prefix ? `[${prefix}] ${message}` : message;
    const detail = args.length > 0 ? `${text} ${JSON.stringify(args)}` : text;
    addLog(detail);
    console.log(text, ...args);
  };

  return Object.assign(log, { clear: () => {} });
}
