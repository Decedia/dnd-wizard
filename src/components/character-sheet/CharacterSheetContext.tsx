"use client";

import { createContext, useContext, ReactNode } from "react";

interface CharacterSheetContextValue {
  onFieldBlur: () => void;
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
}: {
  children: ReactNode;
  onFieldBlur: () => void;
}) {
  return (
    <CharacterSheetContext.Provider value={{ onFieldBlur }}>
      {children}
    </CharacterSheetContext.Provider>
  );
}
