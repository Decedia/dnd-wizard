export function determineDefaultVisibility(feature: Record<string, unknown>): boolean {
  const name = feature.name as string | undefined;

  if (!name) return true;

  const grantsSpells = (feature as any).grantsSpells === true;
  const grantsAttack = (feature as any).grantsAttack === true;
  const grantsSkills = (feature as any).grantsSkills === true;
  const grantsProficiency = (feature as any).grantsProficiency === true;

  if (name === "Ability Score Improvement" || name === "Ability Score Increase") {
    return false;
  }

  if (grantsSpells && !grantsAttack && !grantsSkills && !grantsProficiency) {
    return false;
  }

  if (name === "Bonus Cantrip") {
    return false;
  }

  if (grantsProficiency && !grantsSpells && !grantsAttack && !grantsSkills) {
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
