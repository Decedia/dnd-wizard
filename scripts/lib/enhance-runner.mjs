import fs from "fs";
import path from "path";
import { callNimWithRetry, model } from "./nim.mjs";

const MAX_TOKENS = Number(process.env.MAX_TOKENS || 8192);
const TEMPERATURE = Number(process.env.TEMPERATURE ?? 0.3);
// A batch's generation is slow (a 7k-character class description takes minutes), so
// the run is latency-bound. Overlapping a handful of requests cuts wall time far
// more than shortening any single one.
const CONCURRENCY = Number(process.env.CONCURRENCY || 5);
// A unit's rewritten text is usually a little longer than the source, so a batch
// that fits 12k input characters comfortably fits 8k output tokens.
const BATCH_INPUT_CHAR_BUDGET = Number(process.env.BATCH_INPUT_CHAR_BUDGET || 12000);

export function parseArgs(argv = process.argv.slice(2)) {
  const flags = new Set(argv.filter((arg) => !arg.includes("=")));
  const values = Object.fromEntries(
    argv
      .filter((arg) => arg.includes("="))
      .map((arg) => {
        const [key, ...rest] = arg.replace(/^--/, "").split("=");
        return [key, rest.join("=")];
      }),
  );
  return {
    reset: flags.has("--reset"),
    dryRun: flags.has("--dry-run"),
    showPrompt: flags.has("--print-prompt"),
    limit: values.limit ? Number(values.limit) : Infinity,
    only: values.only,
  };
}

function acquireLock(lockFile) {
  if (fs.existsSync(lockFile)) {
    const pid = Number(fs.readFileSync(lockFile, "utf-8").trim());
    if (pid && pid !== process.pid) {
      try {
        process.kill(pid, 0);
        console.error(`Another enhancement run is active (pid ${pid}). Stop it first, or delete ${lockFile}.`);
        process.exit(1);
      } catch {
        console.warn(`Reclaiming stale lock from pid ${pid}.`);
      }
    }
  }
  fs.writeFileSync(lockFile, String(process.pid), "utf-8");
}

function releaseLock(lockFile) {
  try {
    if (Number(fs.readFileSync(lockFile, "utf-8").trim()) === process.pid) fs.unlinkSync(lockFile);
  } catch {
    // Nothing to clean up.
  }
}

function loadProgress(progressFile) {
  try {
    if (fs.existsSync(progressFile)) {
      const progress = JSON.parse(fs.readFileSync(progressFile, "utf-8"));
      if (Array.isArray(progress.completed)) return new Set(progress.completed);
    }
  } catch (err) {
    console.warn("Could not load progress file:", err.message);
  }
  return new Set();
}

function saveProgress(progressFile, completed) {
  fs.mkdirSync(path.dirname(progressFile), { recursive: true });
  fs.writeFileSync(progressFile, JSON.stringify({ completed: [...completed] }, null, 2) + "\n", "utf-8");
}

// A unit whose own text is long gets a batch to itself. The NIM gateway times out
// (524) once a request has to generate several thousand words, and a class
// description rewritten alongside two other features trips it every time.
const LONE_UNIT_CHARS = Number(process.env.LONE_UNIT_CHARS || 3500);

/** Batches by unit count *and* by total source characters, so one huge subclass
 *  feature cannot blow the context window on its own. */
export function batchUnits(units, maxUnits = Number(process.env.BATCH_SIZE || 6)) {
  const batches = [];
  let current = [];
  let currentChars = 0;

  const flush = () => {
    if (current.length) batches.push(current);
    current = [];
    currentChars = 0;
  };

  for (const unit of units) {
    const chars = unit.fields.reduce((sum, field) => sum + (unit.text[field]?.length || 0), 0);
    if (chars > LONE_UNIT_CHARS) {
      flush();
      batches.push([unit]);
      continue;
    }
    const wouldOverflow = current.length >= maxUnits || (current.length > 0 && currentChars + chars > BATCH_INPUT_CHAR_BUDGET);
    if (wouldOverflow) flush();
    current.push(unit);
    currentChars += chars;
  }
  flush();
  return batches;
}

function describe(unit) {
  return {
    id: unit.id,
    name: unit.name,
    group: unit.group,
    fields: unit.fields,
    context: unit.context,
    source: Object.fromEntries(unit.fields.map((field) => [field, unit.text[field]])),
  };
}

/**
 * Drives the whole pass: resume support, batching, retries, per-unit validation
 * and incremental writes. `validate` returns { ok, reason, values } so a single bad
 * unit never discards the rest of a batch.
 */
export async function runEnhancement({
  label,
  units,
  progressFile,
  systemPrompt,
  buildUserPrompt,
  validate,
  apply,
  options,
  afterUnit,
}) {
  const lockFile = progressFile.replace(/\.json$/, ".lock");
  acquireLock(lockFile);
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      releaseLock(lockFile);
      process.exit(130);
    });
  }
  process.on("exit", () => releaseLock(lockFile));

  if (options.reset) {
    saveProgress(progressFile, new Set());
    console.log("Progress reset.");
  }

  const completed = loadProgress(progressFile);
  if (completed.size) console.log(`Already completed: ${completed.size}`);

  let targets = units.filter((unit) => !completed.has(unit.id));
  if (options.only) {
    const pattern = new RegExp(options.only, "i");
    targets = targets.filter((unit) => pattern.test(unit.id));
  }
  if (Number.isFinite(options.limit)) targets = targets.slice(0, options.limit);
  console.log(`Model: ${model}`);
  console.log(`${label}: ${units.length} units, ${targets.length} to process`);

  const batches = batchUnits(targets);
  console.log(`Batches: ${batches.length} (max ${process.env.BATCH_SIZE || 6} units, ${BATCH_INPUT_CHAR_BUDGET} chars)\n`);

  if (options.dryRun) {
    for (const batch of batches) {
      console.log(`--- batch (${batch.length}) ---`);
      console.log(buildUserPrompt(batch.map(describe)).slice(0, 1200));
      console.log("");
    }
    return;
  }

  if (options.showPrompt) {
    console.log("=== SYSTEM PROMPT ===\n" + systemPrompt + "\n");
    if (batches[0]) console.log("=== SAMPLE USER PROMPT ===\n" + buildUserPrompt(batches[0].map(describe)) + "\n");
    releaseLock(lockFile);
    return;
  }

  let done = 0;
  let failed = 0;
  let nextBatch = 0;

  // Workers pull batches off a shared cursor. Batches are independent, and the
  // apply step is synchronous, so results still land in one clean write.
  const worker = async () => {
    while (nextBatch < batches.length) {
      const batchIndex = nextBatch++;
      const batch = batches[batchIndex];
      const described = batch.map(describe);
      const label = `[${batchIndex + 1}/${batches.length}] ${batch.map((u) => u.name).join(", ").slice(0, 60)}`;

      let result;
      try {
        result = await callNimWithRetry({
          system: systemPrompt,
          user: buildUserPrompt(described),
          maxTokens: MAX_TOKENS,
          temperature: TEMPERATURE,
        });
      } catch (err) {
        console.log(`${label} FAILED (${err.message.slice(0, 160)})`);
        failed += batch.length;
        continue;
      }

      const enhancements = [];
      for (const unit of batch) {
        const verdict = validate(result, unit, described);
        if (!verdict.ok) {
          console.warn(`${label} ${unit.id}: ${verdict.reason}`);
          failed++;
          continue;
        }
        // A unit can pass with only some of its fields rewritten; the rest keep
        // their original text, so this is worth surfacing but not worth a retry.
        if (verdict.reasons?.length) console.warn(`${label} ${unit.id} partial: ${verdict.reasons.join("; ")}`);
        enhancements.push({ unit, loc: unit.loc, values: verdict.values });
        if (afterUnit) afterUnit(unit, verdict.values);
      }

      if (enhancements.length) {
        const written = apply(enhancements) || "";
        for (const { unit } of enhancements) completed.add(unit.id);
        saveProgress(progressFile, completed);
        done += enhancements.length;
        console.log(`${label} ${enhancements.length}/${batch.length} ok${written ? ` — ${written}` : ""}`);
      } else {
        console.log(`${label} 0 ok`);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.max(1, Math.min(CONCURRENCY, batches.length)) }, worker));

  console.log(`\nDone. ${done} enhanced, ${failed} failed.`);
  console.log("Re-run the same command to retry only the failures.");
}
