export function determineDefaultVisibility(feature: Record<string, unknown>): boolean {
  const name = feature.name as string | undefined;

  if (!name) return true;

  if (name === "Ability Score Improvement" || name === "Ability Score Increase") {
    return false;
  }

  if ((feature as any).grantsSpells) {
    return false;
  }

  if (name === "Bonus Cantrip") {
    return false;
  }

  const choices = (feature as any).choices;

  if (choices) {
    if (Array.isArray(choices) && choices.length > 0) {
      return false;
    }
    if (choices.options && Array.isArray(choices.options) && choices.options.length > 0) {
      return false;
    }
  }

  return true;
}
