import type { Character } from "@/lib/storage";

export function exportCharacterToJson(character: Character): void {
  const data = JSON.stringify(character, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${(character.name || "unnamed").replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "")}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportAllCharactersToJson(characters: Character[]): void {
  const data = JSON.stringify(characters, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `dnd-wizard-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadBackupJson(characters: Character[]): void {
  exportAllCharactersToJson(characters);
}

export async function importCharacterFromJson(file: File): Promise<Character> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const character = JSON.parse(reader.result as string) as Character;
        if (!character.id || !character.name) {
          reject(new Error("Invalid character file: missing id or name"));
          return;
        }
        resolve(character);
      } catch (e) {
        reject(new Error("Failed to parse JSON file"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
