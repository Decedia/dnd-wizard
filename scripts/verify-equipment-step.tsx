import { renderToString } from "react-dom/server";
import { StepEquipment } from "@/components/character-creator/StepEquipment";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { DebugProvider } from "@/lib/debug/DebugContext";
import { buildChoiceGroups } from "@/lib/character-creation";
import { getStaticClass } from "@/lib/srd-client";

// Tag the simulated weapon pick with the group the class actually asks for, so
// the verification exercises the same index mapping the modal writes.
const fighter: any = getStaticClass("Fighter", "2014", undefined, "en");
const groups = buildChoiceGroups(JSON.parse(JSON.stringify(fighter?.startingEquipment || [])), "2014");
const weaponGroupIndex = groups.findIndex((g) =>
  g.options.some((o) => o.isWeaponChoice || o.isInstrumentChoice || o.isArcaneFocusChoice || o.isHolySymbolChoice || o.isDruidicFocusChoice),
);
if (weaponGroupIndex < 0) throw new Error("no choice group found for Fighter");

const character: any = {
  name: "Verifier",
  class: "Fighter",
  race: "Human",
  background: "Soldier",
  level: 1,
  sources: ["PHB"],
  ruleset: "2014",
  str: 15,
  dex: 13,
  con: 14,
  int: 10,
  wis: 12,
  cha: 8,
  skills: {},
  inventory: [
    {
      id: "g1",
      name: "Explorer's Pack",
      quantity: 1,
      equipped: false,
      source: "srd",
      description: JSON.stringify({
        type: "item",
        icon: "📦",
        contents: "a backpack, a bedroll, a mess kit, a tinderbox, 10 torches, 10 days of rations, a waterskin, 50 feet of hempen rope",
      }),
      isGranted: true,
    },
    {
      id: "g2",
      name: "Chain mail",
      quantity: 1,
      equipped: false,
      source: "srd",
      description: JSON.stringify({ type: "armor", icon: "🛡️", baseAC: 16, maxDex: 0, armorType: "heavy", description: "Chain mail." }),
      isGranted: true,
    },
    {
      id: "c1",
      name: "Javelin",
      quantity: 4,
      equipped: false,
      source: "srd",
      description: JSON.stringify({
        type: "weapon",
        icon: "🔱",
        damageDice: "1d6",
        damageType: "piercing",
        properties: ["Thrown", "Range 30/120"],
        category: "Simple",
      }),
      itemType: "weapon",
      choiceGroupIndex: weaponGroupIndex,
      choiceOptionIndex: 0,
    },
  ],
};

const html = renderToString(
  <LanguageProvider>
    <DebugProvider>
      <StepEquipment data={character} onChange={() => {}} />
    </DebugProvider>
  </LanguageProvider>,
);

const strip = (s: string) =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
const text = strip(html);

const checks: Array<[string, boolean]> = [
  ["granted section label renders", /Peralatan Diberikan/i.test(text) || /Granted Equipment/i.test(text)],
  ["locked badge renders", /TERKUNCI|Locked/i.test(text)],
  ["choices section label renders", /PILIHANMU|Your Choices/i.test(text)],
  ["granted item name renders", text.includes("Explorer's Pack")],
  ["granted armor renders", text.includes("Chain mail")],
  ["armor AC chip renders", /AC 16/i.test(text)],
  ["chosen weapon renders", text.includes("Javelin")],
  ["quantity badge renders", /x4/.test(text.replace(/\s+/g, ""))],
  ["damage badge renders", /piercing/i.test(text)],
  ["dice badge renders", text.includes("1d6")],
  ["weapon properties render", text.includes("Thrown")],
  // The damage library owns its --color-damage-* tokens; what must be gone are
  // the legacy text/border/bg tokens this step used to hard-code.
  ["no legacy text/border/bg color vars", !/var\(--color-(text|border|bg|surface|ink)/.test(html)],
  ["no emoji tiles", !/[📦🛡️🔱⚔️🗡️🏹]/u.test(text)],
  ["no 4-column square slot grid", !/grid-cols-4/.test(html)],
];

let failed = 0;
for (const [label, ok] of checks) {
  if (!ok) failed++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}`);
}

console.log("\n--- visible text ---");
console.log(text.slice(0, 900));

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}
