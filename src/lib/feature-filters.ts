export function determineDefaultVisibility(feature: Record<string, unknown>): boolean {
  const name = feature.name as string | undefined;

  if (!name) return true;

  const actionType = (feature as any).actionType as string | null | undefined;

  if (actionType === "Action" || actionType === "Bonus Action" || actionType === "Reaction") {
    return true;
  }

  if (name === "Ability Score Improvement" || name === "Ability Score Increase") {
    return false;
  }

  if (name === "Bonus Cantrip") {
    return false;
  }

  const exactSpellGranters = [
    "Oath Spells",
    "Domain Spells",
    "Circle Spells",
    "Expanded Spell List",
  ];

  if (exactSpellGranters.includes(name)) {
    return false;
  }

  const exactChoiceContainers = [
    "Fighting Style",
    "Pact Boon",
    "Metamagic",
    "Eldritch Invocations",
    "Hunter's Prey",
  ];

  if (exactChoiceContainers.includes(name)) {
    return false;
  }

  const exactProficiencyGranters = [
    "Bonus Proficiencies",
    "Tool Proficiency",
  ];

  if (exactProficiencyGranters.includes(name)) {
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
