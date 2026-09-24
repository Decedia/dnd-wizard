"use client";

import { UnifiedSelectionModal, SelectionPayload } from "./UnifiedSelectionModal";

export interface ClassSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (payload: SelectionPayload<"class">) => void;
  characterSources?: string[];
  currentCharacter?: any;
}

export function ClassSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  characterSources = [],
  currentCharacter,
}: ClassSelectionModalProps) {
  return (
    <UnifiedSelectionModal<"class">
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      selectionType="class"
      characterSources={characterSources}
      currentCharacter={currentCharacter}
    />
  );
}