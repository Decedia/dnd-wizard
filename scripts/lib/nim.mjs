import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

export const invokeUrl = "https://integrate.api.nvidia.com/v1/chat/completions";
export const model = process.env.GEMMA_MODEL || "google/gemma-4-31b-it";
export const apiKey = process.env.NIM_API_KEY;

export const MAX_RETRIES = Number(process.env.MAX_RETRIES || 3);
export const RETRY_BASE_DELAY_MS = Number(process.env.RETRY_BASE_DELAY_MS || 2000);

export function requireApiKey() {
  if (!apiKey) {
    console.error("Missing NIM_API_KEY in environment (add it to .env).");
    process.exit(1);
  }
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// Retry 429, 5xx and the 524 the NIM gateway returns when a request has to
// generate too much text for its timeout. A 400 means the payload itself is
// wrong and retrying it just burns the whole run.
export function isRetryable(err) {
  const status = err.response?.status;
  return (
    status === 429 ||
    status === 524 ||
    (typeof status === "number" && status >= 500) ||
    err.code === "ECONNABORTED" ||
    err.code === "ETIMEDOUT" ||
    err.code === "ECONNRESET"
  );
}

/**
 * Extracts the first balanced JSON value from a response. A greedy /\{[\s\S]*\}/ is
 * wrong here: when the model returns an array of objects, that match starts at the
 * first inner brace and yields `{...}, {...}` which will not parse. This walks the
 * string instead, tracking nesting and ignoring braces inside string literals.
 */
function extractJsonValue(content) {
  const cleaned = String(content).replace(/```json/g, "").replace(/```/g, "");
  const start = cleaned.search(/[[{]/);
  if (start === -1) return null;

  const open = cleaned[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === open) depth++;
    else if (char === close) {
      depth--;
      if (depth === 0) return cleaned.slice(start, i + 1);
    }
  }
  return null;
}

function parseJsonContent(content) {
  const value = extractJsonValue(content);
  if (!value) throw new Error(`No JSON object found in response: ${String(content).slice(0, 500)}`);
  let parsed;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error(`Failed to parse JSON from response: ${value.slice(0, 500)}`);
  }
  return normalizeResult(parsed);
}

const TEXT_KEYS = new Set(["flavorText", "description", "fullDescription", "summary", "effectSummary"]);

/**
 * The model is asked for an object keyed by id but has two habits that both cost a
 * whole batch if not handled: it answers with an array of {id, ...} objects, and it
 * echoes the input shape and drops its rewrite inside the `source` field it was
 * given. Both are accepted so a formatting difference never costs a batch.
 */
function normalizeResult(parsed) {
  if (!Array.isArray(parsed)) return parsed;
  const byId = {};
  for (const entry of parsed) {
    if (entry && typeof entry === "object" && typeof entry.id === "string") {
      const { id, ...rest } = entry;
      byId[id] = liftNestedText(rest);
    }
  }
  return byId;
}

function liftNestedText(entry) {
  if (!entry.source || typeof entry.source !== "object" || Array.isArray(entry.source)) return entry;
  const lifted = {};
  for (const [key, value] of Object.entries(entry.source)) {
    if (TEXT_KEYS.has(key)) lifted[key] = value;
  }
  for (const [key, value] of Object.entries(entry)) {
    if (TEXT_KEYS.has(key) && typeof value === "string") lifted[key] = value;
  }
  return Object.keys(lifted).length ? lifted : entry;
}

async function callNimOnce({ system, user, maxTokens, temperature }) {
  const response = await axios.post(
    invokeUrl,
    {
      model,
      temperature,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: 300000,
    },
  );

  const choice = response.data.choices?.[0];
  const content = choice?.message?.content;
  if (!content) throw new Error("Empty response from NVIDIA NIM");

  // NIM_DEBUG=1 dumps every raw response so a prompt that the model is silently
  // ignoring can be inspected instead of guessed at.
  if (process.env.NIM_DEBUG) {
    const dir = process.env.NIM_DEBUG_DIR || ".";
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `nim-${Date.now()}.txt`), `finish_reason=${choice?.finish_reason}\n\n${content}`);
  }

  return parseJsonContent(content);
}

export async function callNimWithRetry(request) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await callNimOnce(request);
    } catch (err) {
      const isLastAttempt = attempt === MAX_RETRIES;
      if (!isLastAttempt && isRetryable(err)) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.warn(`  Retry ${attempt}/${MAX_RETRIES} after ${delay}ms due to: ${err.message}`);
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }
  throw new Error("unreachable");
}
