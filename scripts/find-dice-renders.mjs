/**
 * Finds every place a string is rendered as plain text where that string can
 * contain dice, and reports it. With --fix it rewrites the render to go through
 * DiceText, which badges the dice, damage types, statuses, abilities and skills.
 *
 *   node scripts/find-dice-renders.mjs          report
 *   node scripts/find-dice-renders.mjs --fix    rewrite the JSX
 *
 * The rewrite is mechanical and conservative: it only touches a JSX expression
 * whose sole content is one identifier, so it cannot restructure anything. Every
 * change is listed so it can be reviewed.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FIX = process.argv.includes("--fix");

// A JSX expression whose entire body is an identifier or member chain, e.g.
// {summary}, {row.value}, {selectedFeature.summary}. Deliberately narrow: an
// expression containing an operator, a call or a ternary is skipped, because the
// right rewrite there needs a human eye.
const IDENT_EXPR = /\{([A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*)\}/g;

// Identifiers that are known to carry dice, damage types, statuses or abilities.
// Derived from where such text is rendered today; extend when a new site appears.
// Suffix match, so any expression ending in one of these is treated as
// dice-bearing text: summaries, descriptions and detail-row values.
const DICE_BEARING_SUFFIX = ["summary", "description", "value", "text", "note", "notes", "flavour"];

/** Files to consider: the character sheet and the print view. */
const TARGETS = [
  "src/components/character-sheet/FeaturesTraitsSection.tsx",
  "src/components/character-sheet/SpellsSection.tsx",
  "src/components/character-sheet/InventoryGrid.tsx",
  "src/components/character-sheet/AttacksAndSpellcastingSection.tsx",
  "src/components/character-sheet/CharacterSheetPrint.tsx",
];

const findings = [];
const edits = new Map();

for (const rel of TARGETS) {
  const full = path.join(ROOT, rel);
  let source = readFileSync(full, "utf8");
  // No file-level skip: a file that already imports DiceText is exactly where
  // leftover plain-text sites hide.
  const alreadyImports = /from ["']@\/components\/DiceText["']/.test(source);

  const lines = source.split("\n");
  lines.forEach((line, i) => {
    IDENT_EXPR.lastIndex = 0;
    let m;
    while ((m = IDENT_EXPR.exec(line)) !== null) {
      const ident = m[1];
      const leaf = ident.split(".").pop();
      if (!DICE_BEARING_SUFFIX.includes(leaf)) continue;
      if (/DiceText/.test(line)) continue;

      // The expression must be a standalone JSX child, not part of a template
      // literal, a ternary or a prop. This is the difference between a safe
      // mechanical rewrite and breaking working code.
      const before = line.slice(0, m.index);
      const after = line.slice(m.index + m[0].length);
      const opensElement = />\s*$/.test(before) || /^\s*$/.test(before);
      const closesElement = /^\s*</.test(after) || /^\s*$/.test(after);
      if (!opensElement || !closesElement) return;
      // A line containing a backtick, a comparison or a ternary is code, not JSX text.
      if (/`|[?]|>=|<=|==|&&|\|\|/.test(line)) return;
      // A prop, e.g. description={x}
      if (/=\s*$/.test(before)) return;
      // DiceText renders a block element, so it cannot go inside a tight flex
      // row or the print view's inline-styled markup. Those keep plain text and
      // are listed rather than silently rewritten.
      const layoutLocked =
        rel.endsWith("InventoryGrid.tsx") || rel.endsWith("CharacterSheetPrint.tsx");
      findings.push({
        rel,
        line: i + 1,
        ident,
        text: line.trim(),
        alreadyImports,
        layoutLocked,
        index: i,
      });
      edits.set(`${rel}:${i + 1}`, { rel, index: i, ident, line });
    }
  });
}

console.log(`\nplain-text renders of dice-bearing text: ${findings.length}\n`);
for (const f of findings) {
  const mark = f.layoutLocked ? "  (layout-locked: DiceText renders a block)" : "";
  console.log(`  ${f.rel}:${f.line}  {${f.ident}}${mark}`);
  console.log(`      ${f.text}`);
}
console.log("");

if (!FIX || findings.length === 0) {
  console.log("run with --fix to wrap them in DiceText");
  console.log("");
  process.exit(0);
}

// Rewrite each line: the expression becomes <DiceText text={ident} />, keeping the
// surrounding element and its classes. Only the innermost text node is replaced,
// so an element like <p className="...">{summary}</p> becomes
// <p className="..."><DiceText text={summary} /></p>.
const byFile = new Map();
for (const f of findings) {
  if (!byFile.has(f.rel)) byFile.set(f.rel, []);
  byFile.get(f.rel).push(f);
}

for (const [rel, list] of byFile) {
  const full = path.join(ROOT, rel);
  let source = readFileSync(full, "utf8");
  const lines = source.split("\n");
  for (const f of list.filter((x) => !x.layoutLocked)) {
    // Escape the dots in a member expression, and anchor on the first
    // occurrence on the line so a second {x.value} is not rewritten twice.
    const pattern = new RegExp(`\\{\\s*${f.ident.replace(/\./g, "\\.")}\\s*\\}`);
    lines[f.index] = lines[f.index].replace(pattern, `<DiceText text={${f.ident}} />`);
  }
  source = lines.join("\n");
  // Add the import if it is missing.
  if (!/from ["']@\/components\/DiceText["']/.test(source)) {
    const importLine = `import { DiceText } from "@/components/DiceText";\n`;
    const lastImport = source.lastIndexOf("\nimport ");
    const insertAt = source.indexOf("\n", lastImport + 1);
    source = source.slice(0, insertAt + 1) + importLine + source.slice(insertAt + 1);
  }
  writeFileSync(full, source);
  console.log(`rewrote ${list.length} site(s) in ${rel}`);
}
console.log("");