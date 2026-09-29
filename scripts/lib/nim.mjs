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

// Only 429 and 5xx are worth retrying; a 400 means the payload itself is wrong and
// retrying it just burns the whole run.
export function isRetryable(err) {
  const status = err.response?.status;
  return (
    status === 429 ||
    (typeof status === "number" && status >= 500) ||
    err.code === "ECONNABORTED" ||
    err.code === "ETIMETRIEDOUT" ||
    err.code === "ETIMEDOUT"
  );
}

function parseJsonContent(content) {
  const cleaned = String(content).replace(/```json/g, "").replace(/```/g, "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error(`No JSON object found in response: ${cleaned.slice(0, 500)}`);
  }
  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error(`Failed to parse JSON from response: ${jsonMatch[0].slice(0, 500)}`);
  }
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

  const content = response.data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from NVIDIA NIM");
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
