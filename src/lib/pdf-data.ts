import type { Character } from "./storage";

/** Prefix of the character data the exported PDF carries in its Keywords field, so Import PDF can read it back. */
export const PDF_DATA_PREFIX = "DND_WIZARD_CHARACTER_DATA:";

const toBase64 = (text: string) => {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};

const fromBase64 = (b64: string) => {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
};

export function encodePdfCharacterData(character: Character): string {
  return PDF_DATA_PREFIX + toBase64(JSON.stringify({ version: 1, character }));
}

/** The character in a Keywords value written by encodePdfCharacterData, or null. */
export function decodePdfCharacterData(keywords: unknown): Character | null {
  if (typeof keywords !== "string") return null;
  const at = keywords.indexOf(PDF_DATA_PREFIX);
  if (at === -1) return null;
  try {
    const parsed = JSON.parse(fromBase64(keywords.slice(at + PDF_DATA_PREFIX.length).trim().split(/\s/)[0]));
    return parsed?.character ?? null;
  } catch {
    return null;
  }
}
