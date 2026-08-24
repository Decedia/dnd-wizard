import { useState, useCallback } from "react";

export function useToggleArray<T>(initial: Record<number, T[]> = {}) {
  const [state, setState] = useState<Record<number, T[]>>(initial);

  const toggle = useCallback((key: number, value: T, maxCount?: number) => {
    setState((prev) => {
      const current = prev[key] || [];
      const index = current.indexOf(value);
      let next: T[];

      if (index >= 0) {
        next = current.filter((_, i) => i !== index);
      } else {
        if (maxCount !== undefined && current.length >= maxCount) {
          return prev;
        }
        next = [...current, value];
      }

      if (next.length === 0) {
        const nextState = { ...prev };
        delete nextState[key];
        return nextState;
      }

      return { ...prev, [key]: next };
    });
  }, []);

  return [state, toggle] as const;
}
