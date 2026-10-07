import { useState, useEffect } from "react";

export interface NameGeneratorOptions {
  race?: string;
  gender?: "male" | "female" | "any";
}

export interface NameGeneratorResult {
  name: string;
  source: "api" | "local";
}

const LOCAL_NAMES: Record<string, string[]> = {
  Human: [
    "Aldric", "Beren", "Corin", "Darian", "Eldrin", "Fendrel", "Garrick", "Halvar",
    "Ivor", "Joran", "Kaelen", "Loric", "Merek", "Niall", "Oryn", "Perrin",
    "Quill", "Ronan", "Sylas", "Theron", "Ulric", "Valerius", "Wynn", "Xander",
    "Yoren", "Zephyr", "Aria", "Brianna", "Celia", "Dara", "Elara", "Fiona",
    "Gwen", "Helena", "Isolde", "Jenna", "Kira", "Lydia", "Mara", "Nora",
    "Ophelia", "Petra", "Quinn", "Raven", "Seraphina", "Thalia", "Ursula", "Vera",
    "Willow", "Xanthe", "Yara", "Zara"
  ],
  Elf: [
    "Aelrindel", "Belthil", "Caelynn", "Daeril", "Eldrin", "Faelar", "Gaelin", "Haeril",
    "Ilyana", "Jhael", "Kaelen", "Liriel", "Mythral", "Naeril", "Olaeris", "Phaelin",
    "Quaelis", "Rhael", "Sylvar", "Thalor", "Uthral", "Valaeris", "Wynthar", "Xylia",
    "Yllana", "Zaeril"
  ],
  Dwarf: [
    "Balder", "Borin", "Dain", "Delgin", "Durin", "Fargrim", "Gimli", "Gunnar",
    "Hardin", "Kargan", "Kelden", "Morgran", "Norin", "Oskar", "Rangrim", "Thorin",
    "Torin", "Traubon", "Travok", "Ulfgar", "Veit", "Vondal", "Baern", "Bardryn",
    "Dagnal", "Diedra", "Eldeth", "Falkrunn", "Finellen", "Gundrun", "Gwenna", "Helja",
    "Hlin", "Ilde", "Kathra", "Kristryd", "Liftrasa", "Mardred", "Riswynn", "Sannl",
    "Torbera", "Torgga", "Vistra"
  ],
  Halfling: [
    "Alton", "Ander", "Cade", "Corrin", "Eldon", "Errich", "Finnan", "Garret",
    "Lindal", "Merric", "Milo", "Osborn", "Perrin", "Reed", "Roscoe", "Wellby",
    "Andry", "Bree", "Callie", "Cora", "Euphemia", "Jillian", "Kithri", "Lavinia",
    "Lidda", "Merla", "Portia", "Seraphina", "Shaena", "Trym", "Vani", "Verna"
  ],
  Dragonborn: [
    "Akra", "Biri", "Daar", "Farideh", "Harann", "Havilar", "Jheri", "Kava",
    "Korinn", "Mehen", "Nala", "Perra", "Raiann", "Sora", "Surina", "Thava",
    "Uadjit", "Arjhan", "Balasar", "Bharash", "Donaar", "Ghesh", "Heskan", "Kriv",
    "Medrash", "Mehen", "Nadarr", "Patrin", "Rhogar", "Shamash", "Shedinn", "Tarhun",
    "Torinn"
  ],
  Gnome: [
    "Alston", "Alvyn", "Boddynock", "Brocc", "Burgell", "Dimble", "Eldon", "Erky",
    "Fonkin", "Frug", "Gerbo", "Gimble", "Glim", "Jebeddo", "Kellen", "Namfoodle",
    "Orryn", "Roondar", "Seebo", "Sindri", "Warryn", "Wrenn", "Zook",
    "Bimpnottin", "Breena", "Carlin", "Donella", "Duvamil", "Ella", "Ellyjobell", "Ellywick",
    "Lilli", "Loopmottin", "Lorilla", "Mardnab", "Nissa", "Nyx", "Oda", "Orla",
    "Roywyn", "Shamil", "Syvyn", "Tana", "Zanna"
  ],
  "Half-Elf": [
    "Aldric", "Beren", "Corin", "Darian", "Eldrin", "Fendrel", "Garrick", "Halvar",
    "Ivor", "Joran", "Kaelen", "Loric", "Merek", "Niall", "Oryn", "Perrin",
    "Quill", "Ronan", "Sylas", "Theron", "Ulric", "Valerius", "Wynn", "Xander",
    "Aelrindel", "Belthil", "Caelynn", "Daeril", "Faelar", "Gaelin", "Haeril", "Ilyana"
  ],
  "Half-Orc": [
    "Deno", "Drogar", "Gell", "Gorak", "Henk", "Holg", "Imsh", "Keth",
    "Krusk", "Mhurren", "Ront", "Shump", "Thokk", "Varg", "Volen", "Zog",
    "Baggi", "Emen", "Engong", "Kansif", "Myev", "Neega", "Ovak", "Ownka",
    "Shautha", "Sutha", "Vola", "Volen", "Yevelda"
  ],
  Tiefling: [
    "Akta", "Anakis", "Bryseis", "Criella", "Damaia", "Ea", "Kallista", "Lerissa",
    "Makaria", "Nemeia", "Orianna", "Phelaia", "Rieta", "Akta", "Bryseis", "Criella",
    "Damaia", "Ea", "Kallista", "Lerissa", "Makaria", "Nemeia", "Orianna", "Phelaia",
    "Rieta", "Arannis", "Balcazar", "Barakas", "Damakos", "Ekemon", "Iados", "Kairon",
    "Leucis", "Mordai", "Morthos", "Pelaios", "Skamos", "Therai"
  ],
  default: [
    "Aldric", "Beren", "Corin", "Darian", "Eldrin", "Fendrel", "Garrick", "Halvar",
    "Ivor", "Joran", "Kaelen", "Loric", "Merek", "Niall", "Oryn", "Perrin",
    "Quill", "Ronan", "Sylas", "Theron", "Ulric", "Valerius", "Wynn", "Xander",
    "Aria", "Brianna", "Celia", "Dara", "Elara", "Fiona", "Gwen", "Helena",
    "Isolde", "Jenna", "Kira", "Lydia", "Mara", "Nora", "Ophelia", "Petra"
  ]
};

export async function generateNameFromAPI(options: NameGeneratorOptions = {}): Promise<NameGeneratorResult> {
  const { race = "Human" } = options;
  
  if (!navigator.onLine) {
    return generateLocalName(race);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(
      `https://api.namefake.com/?race=${encodeURIComponent(race)}&count=1`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`API responded with ${response.status}`);
    }

    const data = await response.json();
    const fullName = data.name;
    const firstName = fullName.split(" ")[0];

    return { name: firstName, source: "api" };
  } catch (error) {
    console.warn("Name API failed, using local fallback:", error);
    return generateLocalName(race);
  }
}

export function generateLocalName(race: string): NameGeneratorResult {
  const names = LOCAL_NAMES[race] || LOCAL_NAMES.default;
  const name = names[Math.floor(Math.random() * names.length)];
  return { name, source: "local" };
}

export function isOnline(): boolean {
  return navigator.onLine;
}

export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(typeof window !== "undefined" ? navigator.onLine : true);
  
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  
  return online;
}