"use client";

import { UnifiedSelectionModal, SelectionPayload } from "./UnifiedSelectionModal";

export interface RaceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: SelectionPayload<"race">) => void;
  characterSources?: string[];
  currentCharacter?: any;
}

export function RaceSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  characterSources = [],
  currentCharacter,
}: RaceSelectionModalProps) {
  return (
    <UnifiedSelectionModal<"race">
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      selectionType="race"
      characterSources={characterSources}
      currentCharacter={currentCharacter}
    />
  );
}