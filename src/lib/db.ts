import Dexie, { type Table } from "dexie";
import type { Character } from "@/lib/storage";

export interface CharacterRecord extends Character {
  updatedAt: number;
}

class CharacterDatabase extends Dexie {
  characters!: Table<CharacterRecord, string>;

  constructor() {
    super("dnd-wizard-db");
    this.version(1).stores({
      characters: "id, name, class, level, updatedAt",
    });
  }
}

export const db = new CharacterDatabase();

export async function dbGetCharacters(): Promise<Character[]> {
  const records = await db.characters.toArray();
  return records.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function dbGetCharacter(id: string): Promise<Character | undefined> {
  return await db.characters.get(id);
}

export async function dbSaveCharacter(character: Character): Promise<void> {
  const now = Date.now();
  const record: CharacterRecord = { ...character, updatedAt: now };
  await db.characters.put(record);
}

export async function dbDeleteCharacter(id: string): Promise<void> {
  await db.characters.delete(id);
}

export async function dbClearAll(): Promise<void> {
  await db.characters.clear();
}
