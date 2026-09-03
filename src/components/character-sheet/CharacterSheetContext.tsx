"use client";

import { createContext, useContext, ReactNode } from "react";

interface CharacterSheetContextValue {
  onFieldBlur: () => void;
  showDescriptions: boolean;
  setShowDescriptions: (value: boolean) => void;
}

export const CharacterSheetContext = createContext<CharacterSheetContextValue>({
  onFieldBlur: () => {},
  showDescriptions: false,
  setShowDescriptions: () => {},
});

export function useCharacterSheet() {
  return useContext(CharacterSheetContext);
}

export function CharacterSheetProvider({
  children,
  onFieldBlur,
  showDescriptions,
  onShowDescriptionsChange,
}: {
  children: ReactNode;
  onFieldBlur: () => void;
  showDescriptions: boolean;
  onShowDescriptionsChange: (value: boolean) => void;
}) {
  return (
    <CharacterSheetContext.Provider value={{ onFieldBlur, showDescriptions, setShowDescriptions: onShowDescriptionsChange }}>
      {children}
    </CharacterSheetContext.Provider>
  );
}
