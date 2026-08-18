export interface Character {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "dnd-wizard-characters";

export function getCharacters(): Character[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Character[];
  } catch {
    return [];
  }
}

export function getCharacter(id: string): Character | undefined {
  return getCharacters().find((c) => c.id === id);
}

export function saveCharacter(character: Character): void {
  const characters = getCharacters();
  const index = characters.findIndex((c) => c.id === character.id);
  const now = Date.now();
  const updated = { ...character, updatedAt: now };
  if (index >= 0) {
    characters[index] = updated;
  } else {
    characters.push(updated);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
}

export function deleteCharacter(id: string): void {
  const characters = getCharacters().filter((c) => c.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
}

export function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
