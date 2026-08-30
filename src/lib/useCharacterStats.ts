"use client";

import { useMemo } from "react";
import { computeDerivedStats as computeDerivedStatsRaw, computeEquippedEffects as computeEquippedEffectsRaw, type Character } from "./storage";

export function useDerivedStats(character: Character) {
  return useMemo(() => computeDerivedStatsRaw(character), [character]);
}

export function useEquippedEffects(character: Character) {
  return useMemo(() => computeEquippedEffectsRaw(character), [character]);
}
