export const NVIDIA_NIM_API_KEY = process.env.NVIDIA_NIM_API_KEY;
export const NVIDIA_NIM_TRANSLATE_MODEL = process.env.NVIDIA_NIM_TRANSLATE_MODEL || "riva-translate-4b-instruct-v2";
export const NVIDIA_NIM_BASE_URL = process.env.NVIDIA_NIM_BASE_URL || "https://integrate.api.nvidia.com/v1";

export type NimTranslateInput = {
  text: string;
  sourceLanguage?: string;
  targetLanguage?: string;
};

export type NimTranslateResult = {
  translatedText: string;
  model: string;
};

export async function translateWithNim({ text, sourceLanguage = "en", targetLanguage = "id" }: NimTranslateInput): Promise<NimTranslateResult> {
  if (!NVIDIA_NIM_API_KEY) {
    throw new Error("Missing NVIDIA_NIM_API_KEY");
  }

  const response = await fetch(`${NVIDIA_NIM_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${NVIDIA_NIM_API_KEY}`,
    },
    body: JSON.stringify({
      model: NVIDIA_NIM_TRANSLATE_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a translation assistant. Translate the user text from ${sourceLanguage} to ${targetLanguage}. Preserve game terms, names, and mechanics exactly. Return only the translated text.`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NIM translation failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  const translatedText = data?.choices?.[0]?.message?.content?.trim() || text;

  return {
    translatedText,
    model: NVIDIA_NIM_TRANSLATE_MODEL,
  };
}
