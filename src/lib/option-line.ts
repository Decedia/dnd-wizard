import { dragonAncestorLine, OPTION_LINES } from "@/data/option-lines";
import { EXPERTISE_WHY, FIGHTING_STYLE_PICKS, INVOCATION_PICKS, MANEUVER_PICKS, METAMAGIC_PICKS, SPELL_WHY, SUBCLASS_PICKS, type Why } from "@/lib/level-up-picks";

/** Longest option text shown as is on a card; longer text gets a short line and moves behind Info. */
export const SHORT_LINE_MAX = 120;

const PICK_WHY = new Map<string, Why>();
for (const list of [...Object.values(SUBCLASS_PICKS), ...Object.values(FIGHTING_STYLE_PICKS), METAMAGIC_PICKS, MANEUVER_PICKS, INVOCATION_PICKS]) {
  for (const p of list) if (!PICK_WHY.has(p.name)) PICK_WHY.set(p.name, p.why);
}

const pickLang = (why: Why | null | undefined, language: string) => (why ? (language === "id" ? why.id : why.en) : "");

/**
 * One short line in plain words for an option card: a hand-written line, a
 * suggestion's reason, or the option's own text when it is short. Empty when none fits.
 */
export function optionLine(feature: string, option: { name: string; description?: string }, language: string): string {
  const bare = option.name.replace(/^[^:]+: /, "");
  const written =
    OPTION_LINES[`${feature}|${option.name}`] || OPTION_LINES[option.name] || dragonAncestorLine(option.name) ||
    PICK_WHY.get(option.name) || PICK_WHY.get(bare) || SPELL_WHY[option.name] || EXPERTISE_WHY[option.name];
  if (written) return pickLang(written, language);
  const text = (option.description || "").replace(/\s+/g, " ").trim();
  if (text && text.length <= SHORT_LINE_MAX) return text;
  const first = /^(.+?[.!?])(\s|$)/.exec(text)?.[1];
  return first && first.length <= SHORT_LINE_MAX ? first : "";
}
