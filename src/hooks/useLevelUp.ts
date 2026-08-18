"use client";

import { useState, useCallback } from "react";
import { computeLevelUp, type LevelUpResult, type AbilityScoreChange } from "@/lib/level-up";

export function useLevelUp(options: {
  currentLevel: number;
  className: string;
  onLevelChange: (newLevel: number, result: LevelUpResult | null) => void;
}) {
  const { currentLevel, className, onLevelChange } = options;
  const [pendingLevelUp, setPendingLevelUp] = useState<{ oldLevel: number; newLevel: number; result: LevelUpResult } | null>(null);

  const handleLevelChange = useCallback(
    (newLevel: number) => {
      if (pendingLevelUp) {
        if (newLevel === pendingLevelUp.newLevel) {
          return;
        }
        if (newLevel > pendingLevelUp.oldLevel) {
          const result = computeLevelUp(pendingLevelUp.oldLevel, newLevel, className);
          onLevelChange(newLevel, null);
          setPendingLevelUp({ oldLevel: pendingLevelUp.oldLevel, newLevel, result });
        } else {
          onLevelChange(newLevel, null);
          setPendingLevelUp(null);
        }
        return;
      }

      if (newLevel > currentLevel) {
        const result = computeLevelUp(currentLevel, newLevel, className);
        onLevelChange(newLevel, null);
        setPendingLevelUp({ oldLevel: currentLevel, newLevel, result });
      } else {
        onLevelChange(newLevel, null);
      }
    },
    [currentLevel, className, onLevelChange, pendingLevelUp]
  );

  const confirmLevelUp = useCallback(
    (asiChoices: AbilityScoreChange[]) => {
      if (!pendingLevelUp) return;
      const finalResult: LevelUpResult = {
        ...pendingLevelUp.result,
        abilityScoreChanges: asiChoices,
      };
      onLevelChange(pendingLevelUp.newLevel, finalResult);
      setPendingLevelUp(null);
    },
    [pendingLevelUp, onLevelChange]
  );

  const cancelLevelUp = useCallback(() => {
    if (!pendingLevelUp) return;
    onLevelChange(pendingLevelUp.oldLevel, null);
    setPendingLevelUp(null);
  }, [pendingLevelUp, onLevelChange]);

  return {
    pendingLevelUp,
    handleLevelChange,
    confirmLevelUp,
    cancelLevelUp,
  };
}
