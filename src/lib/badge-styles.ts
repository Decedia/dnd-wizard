import { getSpellSchoolStyle } from "./spell-schools";

export interface BadgeStyle {
  backgroundColor: string;
  color: string;
  borderColor: string;
}

const NEUTRAL_BADGE_STYLE: BadgeStyle = {
  backgroundColor: "var(--color-border-muted)",
  color: "var(--color-text-secondary)",
  borderColor: "var(--color-border)",
};

// Ordered most-specific first: "con" also matches "Constitution", "saving throw"
// style wording and "Concentration", so it has to be tested before "cold".
const ABILITY_BADGE_RULES: { keywords: string[]; style: BadgeStyle }[] = [
  {
    keywords: ["str", "athletics"],
    style: { backgroundColor: "var(--color-damage-fire-bg)", color: "var(--color-damage-fire)", borderColor: "var(--color-damage-fire)" },
  },
  {
    keywords: ["dex", "acrobatics", "stealth", "sleight"],
    style: { backgroundColor: "var(--color-damage-lightning-bg)", color: "var(--color-damage-lightning)", borderColor: "var(--color-damage-lightning)" },
  },
  {
    keywords: ["con", "concentration"],
    style: { backgroundColor: "var(--color-damage-radiant-bg)", color: "var(--color-damage-radiant)", borderColor: "var(--color-damage-radiant)" },
  },
  {
    keywords: ["int", "arcana", "history", "investigation", "nature", "religion"],
    style: { backgroundColor: "var(--color-damage-cold-bg)", color: "var(--color-damage-cold)", borderColor: "var(--color-damage-cold)" },
  },
  {
    keywords: ["wis", "perception", "insight", "survival", "medicine", "animal"],
    style: { backgroundColor: "var(--color-damage-acid-bg)", color: "var(--color-damage-acid)", borderColor: "var(--color-damage-acid)" },
  },
  {
    keywords: ["cha", "deception", "intimidation", "performance", "persuasion"],
    style: { backgroundColor: "var(--color-damage-psychic-bg)", color: "var(--color-damage-psychic)", borderColor: "var(--color-damage-psychic)" },
  },
];

/** Colour-codes a spell/feature mechanics badge by the ability or skill it references. */
export function getStatBadgeStyle(text: string): BadgeStyle {
  const t = text.toLowerCase();
  const rule = ABILITY_BADGE_RULES.find(({ keywords }) => keywords.some((keyword) => t.includes(keyword)));
  return rule ? rule.style : NEUTRAL_BADGE_STYLE;
}

/** Colour-codes a spell school pill using the school design tokens. */
export function getSchoolBadgeStyle(school: string | null | undefined): BadgeStyle | undefined {
  const style = getSpellSchoolStyle(school);
  if (!style) return undefined;
  return {
    backgroundColor: `var(${style.bgColorVar})`,
    color: `var(${style.colorVar})`,
    borderColor: `var(${style.colorVar})`,
  };
}
