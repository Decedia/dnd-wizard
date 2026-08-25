import { getStaticSpells } from "./lib/srd-client";
const spells = getStaticSpells();
console.log("count", spells.length);
console.log("sample", spells[0]?.name, spells[0]?.level, spells[0]?.classes);
