/**
 * Runs an enhancement pass in chunks, committing and pushing after each one.
 *
 * The pass writes straight into the data files and only persists its progress at
 * the end of a batch, so a workspace that gets reset mid-run loses everything since
 * the last commit. Chunking bounds that loss to a single chunk and lets the next
 * run pick up from the committed progress file instead of starting over.
 *
 *   node scripts/run-class-race-enhancement.mjs en
 *   node scripts/run-class-race-enhancement.mjs id
 */
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const locale = process.argv[2];
if (!["en", "id"].includes(locale)) {
  console.error("Usage: node scripts/run-class-race-enhancement.mjs <en|id>");
  process.exit(1);
}

const CHUNK = Number(process.env.CHUNK || 120);
const PUSH = process.env.PUSH !== "0";
const SCRIPT = locale === "en" ? "scripts/enhance-classes-races-en.mjs" : "scripts/enhance-classes-races-id.mjs";
const PROGRESS = path.join(ROOT, "src", "locales", "parts", locale, ".enhance-classes-races-progress.json");
const gitignore = path.join(ROOT, ".gitignore");

const run = (cmd, args, opts = {}) =>
  execFileSync(cmd, args, { cwd: ROOT, stdio: "inherit", env: process.env, ...opts });

function completedCount() {
  try {
    return JSON.parse(fs.readFileSync(PROGRESS, "utf-8")).completed.length;
  } catch {
    return 0;
  }
}

// The progress file is the only record of which units are done, so it has to be
// committed for a chunked run to be resumable after a reset.
function unignoreProgress() {
  const contents = fs.readFileSync(gitignore, "utf-8");
  const line = `!src/locales/parts/${locale}/.enhance-classes-races-progress.json`;
  if (!contents.includes(line)) {
    fs.appendFileSync(gitignore, `\n# committed so a chunked enhancement run survives a workspace reset\n${line}\n`);
  }
}

let chunk = 0;
const { units } = await import("./lib/srd-text.mjs").then((m) => m.buildUnits());
console.log(`${units.length} units in the ${locale} pass.`);

for (;;) {
  chunk++;
  const already = completedCount();
  if (already >= units.length) {
    console.log(`\nAll ${units.length} units already complete.`);
    break;
  }

  console.log(`\n${"=".repeat(70)}\nCHUNK ${chunk} — ${units.length - already} units left, taking ${CHUNK}\n${"=".repeat(70)}`);
  run("node", [SCRIPT, `--limit=${CHUNK}`]);

  const done = completedCount();
  console.log(`\nchunk ${chunk}: ${done}/${units.length} units complete overall`);

  unignoreProgress();
  const status = execFileSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf-8" }).trim();
  if (!status) {
    console.log("nothing changed this chunk; stopping to avoid looping.");
    break;
  }

  run("git", ["add", "-A"]);
  run("git", [
    "commit",
    "-q",
    "-m",
    `chore(data): enhance ${locale} class and race text (chunk ${chunk}, ${done}/${units.length})\n\nPart of a chunked enhancement run. Each chunk is committed and pushed so a\nworkspace reset resumes from the last one instead of restarting the pass.`,
  ]);
  console.log("committed.");
  if (PUSH) {
    // A 429 from GitHub must not kill a multi-hour run: the commit is already
    // durable locally, and the next chunk pushes again.
    try {
      run("git", ["push"], { stdio: ["ignore", "pipe", "pipe"] });
      console.log("pushed.");
    } catch (err) {
      console.log(`push failed (${String(err.stderr || err.message).trim().split("\n").pop()}); will retry on the next chunk.`);
    }
  }
}
