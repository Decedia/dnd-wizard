"use client";

import { createContext, useContext, ReactNode } from "react";

/** A number the player wants to set by hand: which one, and its name on screen. */
export interface OverrideRequest {
  key: string;
  label: string;
  /** Shown with a + sign (bonuses), not as a plain number (AC, DC). */
  signed?: boolean;
}

interface CharacterSheetContextValue {
  onFieldBlur: () => void;
  /** Opens the "set by hand" sheet for a number. */
  editOverride?: (req: OverrideRequest) => void;
  /** Keys of the numbers set by hand, for the dot. */
  overridden?: Record<string, unknown>;
}

export const CharacterSheetContext = createContext<CharacterSheetContextValue>({
  onFieldBlur: () => {},
});

export function useCharacterSheet() {
  return useContext(CharacterSheetContext);
}

export function CharacterSheetProvider({
  children,
  onFieldBlur,
  editOverride,
  overridden,
}: {
  children: ReactNode;
  onFieldBlur: () => void;
  editOverride?: (req: OverrideRequest) => void;
  overridden?: Record<string, unknown>;
}) {
  return (
    <CharacterSheetContext.Provider value={{ onFieldBlur, editOverride, overridden }}>
      {children}
    </CharacterSheetContext.Provider>
  );
}
