/**
 * Shared text hygiene applied to model output before it is written.
 *
 * The enhancement passes deliberately do not reject a unit over formatting: the
 * official SRD text itself mixes `*` and `-` list markers, and DiceText renders
 * both. Normalising is cheaper and safer than throwing the unit away, and it keeps
 * the enhanced corpus internally consistent.
 */

/** Rewrites `* item` list markers as `- item` and collapses blank-line runs. */
export function normalizeMarkdown(text) {
  return String(text)
    .replace(/\r\n/g, "\n")
    .replace(/^(\s*)\*(?!\s*\*)(\s+)/gm, "$1-$2")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Converts `1. item` to `- item`. DiceText treats an ordered list as ordered
 * markup, so a numbered list in a rules text renders as a numbered list where
 * every other block is bulleted; dashes keep the whole corpus uniform.
 */
export function normalizeNumberedLists(text) {
  return String(text).replace(/^(\s*)\d+\.(\s+)\S/gm, "$1-$2");
}

export function tidy(text) {
  return normalizeNumberedLists(normalizeMarkdown(text));
}

const NUMBER_RE = /\b\d+(?:d\d+)?\b/g;
const LIST_RE = /^\s*[-*]\s+\S/gm;

const numbers = (text) => new Set(String(text).match(NUMBER_RE) || []);
const countMatches = (text, re) => (String(text).match(re) || []).length;

/**
 * The failures that matter when a model rewrites rules text are all structural, and
 * all of them pass a plain length check. A rewrite that turns '+2 to the damage
 * roll' into 'as per the Barbarian table', or folds a bulleted list into a paragraph,
 * is shorter but has quietly deleted the rules. These checks catch that class of
 * regression, and every one of them fails safe: the original text is kept.
 */
export function structuralProblems(source, output, field) {
  const problems = [];

  // Every number in the source has to survive somewhere in the output. Not for
  // summaries: a one-line card summary is expected to drop detail that the
  // description still carries, and "Domain Spells" listing levels 1/3/5/7/9 is
  // exactly the case where the summary rightly says less.
  if (field !== "summary") {
    const missing = [...numbers(source)].filter((n) => !new RegExp(`\\b${n}\\b`).test(output));
    if (missing.length) problems.push(`lost numbers: ${missing.slice(0, 8).join(", ")}`);
  }

  // A bulleted list that becomes a paragraph loses its per-item rules.
  const sourceLists = countMatches(source, LIST_RE);
  if (sourceLists >= 2 && countMatches(output, LIST_RE) < Math.ceil(sourceLists / 2)) {
    problems.push(`list collapsed: ${sourceLists} bullets -> ${countMatches(output, LIST_RE)}`);
  }

  // Deliberately no paragraph-count check. The SRD hard-wraps class descriptions
  // at one line per clause with a whitespace-only line between each, so its
  // "paragraph" count measures line wrapping, not structure, and comparing it
  // against a properly rewrapped rewrite rejected correct work. The number and
  // list checks above are what actually detect lost rules.

  return problems;
}
