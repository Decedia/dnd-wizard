// "Pick 1 of 3" suggestions for the level-up flow. Each card names one option
// and says in one line, in plain words, why a new player might take it.
// The full pickers stay one tap away; these only make a good first choice easy.

export type Why = { en: string; id: string };
export type Pick = { name: string; why: Why };
export type AbilityKey = "str" | "dex" | "con" | "int" | "wis" | "cha";

/** Subclasses in order of preference for a new player. Names match the subclass data. */
export const SUBCLASS_PICKS: Record<string, Pick[]> = {
  Barbarian: [
    { name: "Totem Warrior", why: { en: "Bear totem makes you shrug off almost any damage while raging.", id: "Totem beruang membuatmu tahan hampir semua damage saat rage." } },
    { name: "Berserker", why: { en: "Simple: rage and get an extra attack every turn.", id: "Sederhana: rage dan dapat serangan tambahan tiap giliran." } },
    { name: "Zealot", why: { en: "Extra damage on hits and very hard to kill.", id: "Damage tambahan saat kena dan sangat sulit dibunuh." } },
    { name: "Path of the Beast", why: { en: "Grow claws or a bite when you rage. Fun and strong.", id: "Tumbuh cakar atau taring saat rage. Seru dan kuat." } },
  ],
  Bard: [
    { name: "Lore", why: { en: "More skills and spells from any class later on.", id: "Lebih banyak skill, dan nanti spell dari class mana pun." } },
    { name: "Valor", why: { en: "Wear medium armor and a shield, and fight up close.", id: "Pakai armor medium dan perisai, bisa bertarung jarak dekat." } },
    { name: "College of Eloquence", why: { en: "The best talker. Your inspiration is never wasted.", id: "Jago bicara. Inspirasi darimu tidak pernah terbuang." } },
    { name: "College of Swords", why: { en: "A stylish fighter who mixes blade tricks with music.", id: "Petarung bergaya yang memadukan trik pedang dan musik." } },
  ],
  Cleric: [
    { name: "Life", why: { en: "The best healer. Every healing spell heals more.", id: "Penyembuh terbaik. Setiap spell penyembuh memulihkan lebih banyak." } },
    { name: "War", why: { en: "Heavy armor and extra attacks. A holy warrior.", id: "Armor berat dan serangan tambahan. Prajurit suci." } },
    { name: "Light", why: { en: "Fire spells and a flash that protects you from hits.", id: "Spell api dan kilatan cahaya yang melindungimu dari serangan." } },
    { name: "Twilight Domain", why: { en: "Gives the whole party temporary HP every turn.", id: "Memberi HP sementara ke seluruh party tiap giliran." } },
    { name: "Tempest", why: { en: "Heavy armor and big thunder and lightning damage.", id: "Armor berat dan damage petir yang besar." } },
  ],
  Druid: [
    { name: "Moon", why: { en: "Turn into tough beasts and fight up front.", id: "Berubah jadi binatang kuat dan bertarung di depan." } },
    { name: "Land", why: { en: "More spells and you get spell slots back on a short rest.", id: "Lebih banyak spell, dan slot spell kembali saat short rest." } },
    { name: "Circle of Stars", why: { en: "Easy and strong: pick a star form for healing or attacks.", id: "Mudah dan kuat: pilih wujud bintang untuk menyembuhkan atau menyerang." } },
    { name: "Circle of the Shepherd", why: { en: "Summons get stronger. Great support for the party.", id: "Makhluk panggilan jadi lebih kuat. Pendukung hebat untuk party." } },
  ],
  Fighter: [
    { name: "Champion", why: { en: "The simplest choice: you land critical hits more often.", id: "Pilihan paling sederhana: kamu lebih sering dapat critical hit." } },
    { name: "Battle Master", why: { en: "Special moves like trip, disarm and push. More choices in a fight.", id: "Gerakan khusus seperti menjatuhkan, melucuti, mendorong. Lebih banyak pilihan saat bertarung." } },
    { name: "Eldritch Knight", why: { en: "A fighter who also casts a few wizard spells.", id: "Fighter yang juga bisa beberapa spell wizard." } },
    { name: "Rune Knight", why: { en: "Grow giant-sized and use magic runes.", id: "Membesar seperti raksasa dan memakai rune sihir." } },
  ],
  Monk: [
    { name: "Open Hand", why: { en: "Your punches can knock enemies down or push them away.", id: "Pukulanmu bisa menjatuhkan atau mendorong musuh." } },
    { name: "Shadow", why: { en: "Teleport between shadows and sneak around.", id: "Teleport antar bayangan dan menyelinap." } },
    { name: "Way of Mercy", why: { en: "Heal friends and hurt enemies with the same hands.", id: "Menyembuhkan teman dan melukai musuh dengan tangan yang sama." } },
    { name: "Way of the Kensei", why: { en: "Master a favorite weapon, like a sword or bow.", id: "Kuasai satu senjata favorit, seperti pedang atau busur." } },
  ],
  Paladin: [
    { name: "Devotion", why: { en: "The classic holy knight. Strong defense against charm.", id: "Ksatria suci klasik. Pertahanan kuat terhadap charm." } },
    { name: "Vengeance", why: { en: "Lock onto one enemy and hit it hard.", id: "Kunci satu musuh dan serang dengan keras." } },
    { name: "Ancients", why: { en: "Protects the whole party from spells.", id: "Melindungi seluruh party dari spell." } },
    { name: "Oath of Glory", why: { en: "A heroic athlete: faster and stronger.", id: "Atlet heroik: lebih cepat dan lebih kuat." } },
  ],
  Ranger: [
    { name: "Hunter", why: { en: "Simple extra damage. Good with a bow.", id: "Damage tambahan yang sederhana. Cocok dengan busur." } },
    { name: "Gloom Stalker", why: { en: "Strike first in every fight and hide in darkness.", id: "Menyerang duluan di setiap pertarungan dan bersembunyi di kegelapan." } },
    { name: "Fey Wanderer", why: { en: "Extra damage and great at talking to people.", id: "Damage tambahan dan pandai bicara dengan orang." } },
    { name: "Beast Master", why: { en: "A loyal animal companion fights beside you.", id: "Hewan setia bertarung di sampingmu." } },
  ],
  Rogue: [
    { name: "Thief", why: { en: "Use items fast and climb like a cat.", id: "Pakai item dengan cepat dan memanjat seperti kucing." } },
    { name: "Swashbuckler", why: { en: "Fight one-on-one and slip away without getting hit.", id: "Bertarung satu lawan satu dan kabur tanpa terkena serangan." } },
    { name: "Assassin", why: { en: "Huge damage on the first turn of a fight.", id: "Damage besar di giliran pertama pertarungan." } },
    { name: "Arcane Trickster", why: { en: "A rogue who also casts a few wizard spells.", id: "Rogue yang juga bisa beberapa spell wizard." } },
  ],
  Sorcerer: [
    { name: "Draconic", why: { en: "More HP and natural armor. Good for a first caster.", id: "HP lebih banyak dan armor alami. Cocok untuk caster pertama." } },
    { name: "Divine Soul", why: { en: "Learn healing spells too, not only attacks.", id: "Bisa belajar spell penyembuh juga, bukan hanya serangan." } },
    { name: "Wild Magic", why: { en: "Random magic surprises. Fun but unpredictable.", id: "Kejutan sihir acak. Seru tapi sulit ditebak." } },
    { name: "Clockwork Soul", why: { en: "Steady and safe, with extra protective spells.", id: "Stabil dan aman, dengan spell perlindungan tambahan." } },
  ],
  Warlock: [
    { name: "Fiend", why: { en: "Gain temporary HP each time you drop an enemy.", id: "Dapat HP sementara setiap kali menjatuhkan musuh." } },
    { name: "Archfey", why: { en: "Charm or scare enemies near you.", id: "Pesona atau takut-takuti musuh di dekatmu." } },
    { name: "Hexblade", why: { en: "Fight with a weapon using Charisma. Strong and simple.", id: "Bertarung dengan senjata memakai Charisma. Kuat dan sederhana." } },
    { name: "The Celestial", why: { en: "Adds healing to the warlock's attacks.", id: "Menambah penyembuhan pada serangan warlock." } },
    { name: "Great Old One", why: { en: "Talk mind to mind with anyone.", id: "Bicara lewat pikiran dengan siapa pun." } },
  ],
  Wizard: [
    { name: "Evocation", why: { en: "Blast spells without hurting your friends.", id: "Spell ledakan tanpa melukai temanmu." } },
    { name: "Abjuration", why: { en: "A magic shield that soaks up damage.", id: "Perisai sihir yang menyerap damage." } },
    { name: "Divination", why: { en: "Roll two dice each day and use them later. Very strong.", id: "Lempar dua dadu tiap hari dan pakai nanti. Sangat kuat." } },
    { name: "Bladesinging", why: { en: "A fast, hard-to-hit wizard who also uses a sword.", id: "Wizard cepat dan sulit diserang yang juga memakai pedang." } },
  ],
  Artificer: [
    { name: "Battle Smith", why: { en: "A robot dog companion protects you.", id: "Anjing robot pendamping melindungimu." } },
    { name: "Armorer", why: { en: "Magic power armor. Tough and simple.", id: "Armor sihir bertenaga. Kuat dan sederhana." } },
    { name: "Artillerist", why: { en: "Build a magic cannon that blasts or shields.", id: "Bangun meriam sihir untuk menyerang atau melindungi." } },
    { name: "Alchemist", why: { en: "Make healing potions and support the party.", id: "Buat ramuan penyembuh dan dukung party." } },
  ],
};

/** The ability each class wants most, then its second. */
export const MAIN_ABILITIES: Record<string, [AbilityKey, AbilityKey]> = {
  Barbarian: ["str", "con"],
  Bard: ["cha", "dex"],
  Cleric: ["wis", "con"],
  Druid: ["wis", "con"],
  Fighter: ["str", "con"],
  Monk: ["dex", "wis"],
  Paladin: ["str", "cha"],
  Ranger: ["dex", "wis"],
  Rogue: ["dex", "con"],
  Sorcerer: ["cha", "con"],
  Warlock: ["cha", "con"],
  Wizard: ["int", "con"],
  Artificer: ["int", "con"],
};

/** A feat each class gets a lot out of, with a fallback that suits anyone. */
const CLASS_FEATS: Record<string, string[]> = {
  Barbarian: ["Great Weapon Master", "Tough"],
  Bard: ["War Caster", "Lucky"],
  Cleric: ["War Caster", "Lucky"],
  Druid: ["War Caster", "Lucky"],
  Fighter: ["Great Weapon Master", "Sentinel", "Tough"],
  Monk: ["Mobile", "Alert"],
  Paladin: ["Great Weapon Master", "Sentinel", "Tough"],
  Ranger: ["Sharpshooter", "Alert"],
  Rogue: ["Alert", "Lucky"],
  Sorcerer: ["War Caster", "Lucky"],
  Warlock: ["War Caster", "Lucky"],
  Wizard: ["War Caster", "Lucky"],
  Artificer: ["War Caster", "Lucky"],
};

export const FEAT_WHY: Record<string, Why> = {
  "Great Weapon Master": { en: "Trade accuracy for +10 damage with big two-handed weapons.", id: "Tukar akurasi dengan +10 damage memakai senjata dua tangan besar." },
  "Sentinel": { en: "Enemies next to you can't just walk away.", id: "Musuh di dekatmu tidak bisa begitu saja pergi." },
  "Tough": { en: "+2 HP for every level you have. Simple and safe.", id: "+2 HP untuk setiap levelmu. Sederhana dan aman." },
  "War Caster": { en: "Keep your spells going when you get hit.", id: "Spellmu tetap jalan saat kamu terkena serangan." },
  "Lucky": { en: "Reroll a bad die 3 times a day. Good for anyone.", id: "Lempar ulang dadu buruk 3 kali sehari. Cocok untuk siapa pun." },
  "Mobile": { en: "Move faster and run past enemies safely.", id: "Bergerak lebih cepat dan lewati musuh dengan aman." },
  "Alert": { en: "+5 to initiative so you act first, and you can't be surprised.", id: "+5 initiative agar kamu bergerak duluan, dan tidak bisa dikejutkan." },
  "Sharpshooter": { en: "Shoot far and trade accuracy for +10 damage with bows.", id: "Menembak jauh dan tukar akurasi dengan +10 damage memakai busur." },
};

export const ABILITY_WHY: Record<AbilityKey, Why> = {
  str: { en: "Hit harder and more often with melee weapons.", id: "Serangan jarak dekat lebih kuat dan lebih sering kena." },
  dex: { en: "Better AC, initiative and finesse or ranged attacks.", id: "AC, initiative, dan serangan finesse atau jarak jauh lebih baik." },
  con: { en: "More HP every level, and spells hold better when hit.", id: "HP lebih banyak tiap level, dan spell lebih tahan saat terkena serangan." },
  int: { en: "Your spells hit more often and are harder to resist.", id: "Spellmu lebih sering kena dan lebih sulit dilawan." },
  wis: { en: "Your spells hit more often and are harder to resist.", id: "Spellmu lebih sering kena dan lebih sulit dilawan." },
  cha: { en: "Your spells hit more often and are harder to resist.", id: "Spellmu lebih sering kena dan lebih sulit dilawan." },
};

export type AsiPick =
  | { kind: "single"; ability: AbilityKey; why: Why }
  | { kind: "double"; d1: AbilityKey; d2: AbilityKey; why: Why }
  | { kind: "feat"; feat: string; why: Why };

const ORDER: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];

/**
 * Three ability score suggestions: +2 to the main ability, +1 to the main two,
 * and a feat. Abilities at 20 are skipped; `feats` lists the feats the
 * character may still take.
 */
export function asiPicks(className: string, scores: Record<AbilityKey, number>, feats: string[]): AsiPick[] {
  const [main, second] = MAIN_ABILITIES[className] || ["con", "dex"];
  const room = (k: AbilityKey, n: number) => (scores[k] ?? 10) + n <= 20;
  const ranked = [main, second, "con" as AbilityKey, "dex" as AbilityKey, ...ORDER].filter((k, i, a) => a.indexOf(k) === i);
  const picks: AsiPick[] = [];
  const single = ranked.find((k) => room(k, 2));
  if (single) picks.push({ kind: "single", ability: single, why: ABILITY_WHY[single] });
  const ones = ranked.filter((k) => room(k, 1));
  // +1/+1 is best when it turns two odd scores even (modifiers go up at even scores).
  const odd = ones.filter((k) => (scores[k] ?? 10) % 2 === 1);
  const pair = (odd.length >= 2 ? odd : ones).slice(0, 2);
  if (pair.length === 2) {
    picks.push({
      kind: "double",
      d1: pair[0],
      d2: pair[1],
      why: { en: "A little of both. Best when both scores are odd numbers.", id: "Sedikit untuk keduanya. Paling baik saat kedua skor ganjil." },
    });
  }
  const featOrder = [...(CLASS_FEATS[className] || []), "Lucky", "Tough", "Alert"];
  const feat = featOrder.find((f) => feats.includes(f));
  if (feat) picks.push({ kind: "feat", feat, why: FEAT_WHY[feat] || { en: "A strong feat for your class.", id: "Feat yang kuat untuk class-mu." } });
  return picks.slice(0, 3);
}

/** Fighting styles that are easy to use well, per class. */
export const FIGHTING_STYLE_PICKS: Record<string, Pick[]> = {
  Fighter: [
    { name: "Defense", why: { en: "+1 AC all the time, with any weapon.", id: "+1 AC sepanjang waktu, dengan senjata apa pun." } },
    { name: "Great Weapon Fighting", why: { en: "Reroll 1s and 2s on damage with two-handed weapons.", id: "Lempar ulang angka 1 dan 2 untuk damage senjata dua tangan." } },
    { name: "Archery", why: { en: "+2 to hit with bows and crossbows.", id: "+2 untuk mengenai dengan busur dan crossbow." } },
    { name: "Dueling", why: { en: "+2 damage with a one-handed weapon and a free hand or shield.", id: "+2 damage dengan senjata satu tangan, tangan lain kosong atau perisai." } },
  ],
  Paladin: [
    { name: "Defense", why: { en: "+1 AC all the time, with any weapon.", id: "+1 AC sepanjang waktu, dengan senjata apa pun." } },
    { name: "Dueling", why: { en: "+2 damage with a one-handed weapon and a shield.", id: "+2 damage dengan senjata satu tangan dan perisai." } },
    { name: "Great Weapon Fighting", why: { en: "Reroll 1s and 2s on damage with two-handed weapons.", id: "Lempar ulang angka 1 dan 2 untuk damage senjata dua tangan." } },
  ],
  Ranger: [
    { name: "Archery", why: { en: "+2 to hit with bows. The usual ranger choice.", id: "+2 untuk mengenai dengan busur. Pilihan ranger yang umum." } },
    { name: "Defense", why: { en: "+1 AC all the time, with any weapon.", id: "+1 AC sepanjang waktu, dengan senjata apa pun." } },
    { name: "Two-Weapon Fighting", why: { en: "Add your modifier to the off-hand attack's damage.", id: "Tambahkan modifier ke damage serangan tangan kedua." } },
  ],
};

/** Spells that are easy to use and useful in most games. */
export const SPELL_WHY: Record<string, Why> = {
  "Fire Bolt": { en: "Your go-to attack. Free to cast, long range.", id: "Serangan andalan. Gratis dipakai, jarak jauh." },
  "Eldritch Blast": { en: "The best warlock attack. Free to cast, gets stronger with levels.", id: "Serangan warlock terbaik. Gratis, makin kuat seiring level." },
  "Sacred Flame": { en: "Free attack that ignores cover.", id: "Serangan gratis yang menembus perlindungan." },
  "Toll the Dead": { en: "Free attack that hits hurt enemies extra hard.", id: "Serangan gratis yang lebih sakit untuk musuh yang terluka." },
  "Ray of Frost": { en: "Free attack that also slows the target.", id: "Serangan gratis yang juga memperlambat target." },
  "Mage Hand": { en: "A floating hand to grab things from afar.", id: "Tangan melayang untuk mengambil benda dari jauh." },
  "Minor Illusion": { en: "Make a fake sound or object. Great for tricks.", id: "Buat suara atau benda palsu. Bagus untuk trik." },
  "Prestidigitation": { en: "Small magic tricks: clean, light a candle, flavor food.", id: "Trik sihir kecil: membersihkan, menyalakan lilin, memberi rasa makanan." },
  "Guidance": { en: "Add a d4 to a friend's skill check.", id: "Tambahkan d4 ke cek skill teman." },
  "Thaumaturgy": { en: "Booming voice and spooky effects. Fun for roleplay.", id: "Suara menggelegar dan efek seram. Seru untuk roleplay." },
  "Vicious Mockery": { en: "Insult an enemy to hurt it and weaken its next attack.", id: "Hina musuh untuk melukainya dan melemahkan serangan berikutnya." },
  "Magic Missile": { en: "Never misses. Reliable damage.", id: "Tidak pernah meleset. Damage yang pasti." },
  "Shield": { en: "+5 AC when you would get hit. Saves your life.", id: "+5 AC saat akan terkena serangan. Menyelamatkan nyawamu." },
  "Sleep": { en: "Puts several weak enemies to sleep at once.", id: "Menidurkan beberapa musuh lemah sekaligus." },
  "Burning Hands": { en: "Hits a group of enemies in front of you.", id: "Mengenai sekelompok musuh di depanmu." },
  "Cure Wounds": { en: "Heal a friend you can touch.", id: "Sembuhkan teman yang bisa kamu sentuh." },
  "Healing Word": { en: "Heal from far away as a bonus action. Gets fallen friends up.", id: "Menyembuhkan dari jauh sebagai bonus action. Membangunkan teman yang jatuh." },
  "Bless": { en: "Three friends add a d4 to attacks and saves.", id: "Tiga teman menambah d4 ke serangan dan save." },
  "Guiding Bolt": { en: "Big damage, and the next attack on the target has advantage.", id: "Damage besar, dan serangan berikutnya ke target dapat advantage." },
  "Hunter's Mark": { en: "Extra damage on every hit against one target.", id: "Damage tambahan setiap kena pada satu target." },
  "Hex": { en: "Extra damage on every hit against one target.", id: "Damage tambahan setiap kena pada satu target." },
  "Faerie Fire": { en: "Lights up enemies so everyone hits them more easily.", id: "Menerangi musuh agar semua orang lebih mudah mengenainya." },
  "Thunderwave": { en: "Pushes nearby enemies away and hurts them.", id: "Mendorong musuh di dekatmu menjauh dan melukainya." },
  "Detect Magic": { en: "Find magic items and traps around you.", id: "Temukan benda sihir dan jebakan di sekitarmu." },
  "Misty Step": { en: "Teleport a short way to escape danger.", id: "Teleport jarak dekat untuk kabur dari bahaya." },
  "Hold Person": { en: "Freeze an enemy so every hit on it is a critical.", id: "Bekukan musuh agar setiap serangan padanya jadi critical." },
  "Scorching Ray": { en: "Three fire rays. Strong single-target damage.", id: "Tiga sinar api. Damage kuat untuk satu target." },
  "Spiritual Weapon": { en: "A floating weapon attacks for you every turn.", id: "Senjata melayang menyerang untukmu tiap giliran." },
  "Heat Metal": { en: "Burns an enemy in metal armor every turn.", id: "Membakar musuh berarmor logam tiap giliran." },
  "Fireball": { en: "The classic big explosion. Hits a whole group.", id: "Ledakan besar klasik. Mengenai satu kelompok." },
  "Lightning Bolt": { en: "A long line of lightning through many enemies.", id: "Garis petir panjang menembus banyak musuh." },
  "Counterspell": { en: "Stop an enemy's spell before it happens.", id: "Hentikan spell musuh sebelum terjadi." },
  "Revivify": { en: "Bring a friend back to life right after they die.", id: "Hidupkan kembali teman tepat setelah mereka mati." },
  "Spirit Guardians": { en: "Spirits around you hurt every enemy nearby each turn.", id: "Roh di sekitarmu melukai semua musuh dekat tiap giliran." },
  "Haste": { en: "Makes a friend faster, tougher and gives an extra action.", id: "Membuat teman lebih cepat, lebih kuat, dan dapat aksi tambahan." },
  "Polymorph": { en: "Turn an enemy into a harmless animal, or a friend into a big beast.", id: "Ubah musuh jadi hewan lemah, atau teman jadi binatang besar." },
  "Greater Invisibility": { en: "Stay invisible while attacking.", id: "Tetap tak terlihat sambil menyerang." },
  "Banishment": { en: "Send an enemy away for the whole fight.", id: "Kirim musuh pergi selama pertarungan." },
};

/** Up to `max` suggested spells from the ones this level can still pick. */
export function spellPicks(available: { name: string; level: number }[], max = 3): (Pick & { level: number })[] {
  const byName = new Map(available.map((s) => [s.name, s]));
  return Object.keys(SPELL_WHY)
    .filter((name) => byName.has(name))
    .map((name) => ({ name, level: byName.get(name)!.level, why: SPELL_WHY[name] }))
    // Newest spell level first: that's what this level-up just unlocked.
    .sort((a, b) => b.level - a.level)
    .slice(0, max);
}

/** Up to three feats for a class (its strong picks, then ones that suit anyone), from those still open. */
export function featPicks(className: string | undefined, available: string[]): Pick[] {
  const order = [...(CLASS_FEATS[className || ""] || []), "Lucky", "Tough", "Alert"];
  const names = order.filter((f, i) => order.indexOf(f) === i);
  return topPicks(names.map((name) => ({ name, why: FEAT_WHY[name] || { en: "A strong feat for your class.", id: "Feat yang kuat untuk class-mu." } })), available);
}

/** Up to `max` suggestions from a list of names that can be picked. */
export function topPicks(list: Pick[] | undefined, available: string[], max = 3): Pick[] {
  const set = new Set(available);
  return (list || []).filter((p) => set.has(p.name)).slice(0, max);
}

/** Sorcerer Metamagic that is easy to get value from. */
export const METAMAGIC_PICKS: Pick[] = [
  { name: "Twinned Spell", why: { en: "Aim a one-target spell at two targets at once.", id: "Arahkan spell satu target ke dua target sekaligus." } },
  { name: "Quickened Spell", why: { en: "Cast a spell as a bonus action, then still use a cantrip.", id: "Pakai spell sebagai bonus action, lalu masih bisa pakai cantrip." } },
  { name: "Empowered Spell", why: { en: "Reroll low damage dice. Costs only 1 sorcery point.", id: "Lempar ulang dadu damage yang rendah. Hanya 1 sorcery point." } },
  { name: "Subtle Spell", why: { en: "Cast with no words or gestures, so nobody notices.", id: "Pakai spell tanpa kata atau gerakan, jadi tidak ada yang sadar." } },
  { name: "Heightened Spell", why: { en: "One target has a harder time resisting your spell.", id: "Satu target lebih sulit melawan spellmu." } },
];

/** Battle Master maneuvers that work with any weapon. */
export const MANEUVER_PICKS: Pick[] = [
  { name: "Precision Attack", why: { en: "Add a die to an attack roll to turn a miss into a hit.", id: "Tambahkan dadu ke lemparan serangan agar yang meleset jadi kena." } },
  { name: "Trip Attack", why: { en: "Extra damage, and the enemy may fall down.", id: "Damage tambahan, dan musuh bisa terjatuh." } },
  { name: "Riposte", why: { en: "When an enemy misses you, hit back right away.", id: "Saat musuh meleset, langsung balas serang." } },
  { name: "Menacing Attack", why: { en: "Extra damage, and the enemy may become frightened.", id: "Damage tambahan, dan musuh bisa jadi ketakutan." } },
  { name: "Pushing Attack", why: { en: "Extra damage, and you may push the enemy 15 feet away.", id: "Damage tambahan, dan musuh bisa terdorong 15 kaki." } },
  { name: "Parry", why: { en: "Reduce the damage of a melee hit against you.", id: "Kurangi damage serangan jarak dekat yang mengenaimu." } },
];

/** Warlock invocations in order of preference. Ones the character can't take yet are skipped. */
export const INVOCATION_PICKS: Pick[] = [
  { name: "Thirsting Blade", why: { en: "Attack twice with your pact weapon each turn.", id: "Serang dua kali dengan pact weapon tiap giliran." } },
  { name: "Agonizing Blast", why: { en: "Add your Charisma modifier to Eldritch Blast damage.", id: "Tambahkan modifier Charisma ke damage Eldritch Blast." } },
  { name: "Devil's Sight", why: { en: "See in darkness, even magical darkness, out to 120 feet.", id: "Melihat dalam gelap, bahkan gelap sihir, sampai 120 kaki." } },
  { name: "Repelling Blast", why: { en: "Eldritch Blast pushes the target 10 feet away.", id: "Eldritch Blast mendorong target 10 kaki." } },
  { name: "Armor of Shadows", why: { en: "Cast Mage Armor on yourself any time, for free.", id: "Pakai Mage Armor pada dirimu kapan saja, gratis." } },
  { name: "Fiendish Vigor", why: { en: "Give yourself temporary HP any time, for free.", id: "Beri dirimu HP sementara kapan saja, gratis." } },
  { name: "Mask of Many Faces", why: { en: "Change how you look any time, for free.", id: "Ubah penampilanmu kapan saja, gratis." } },
];

export const EXPERTISE_WHY: Record<string, Why> = {
  "Stealth": { en: "Sneak and hide much more reliably.", id: "Menyelinap dan bersembunyi jauh lebih andal." },
  "Thieves' Tools": { en: "Open locks and disarm traps much more reliably.", id: "Membuka kunci dan menjinakkan jebakan jauh lebih andal." },
  "Perception": { en: "Spot hidden enemies and traps. The most rolled skill.", id: "Melihat musuh dan jebakan tersembunyi. Skill yang paling sering dilempar." },
  "Persuasion": { en: "Talk people into helping you.", id: "Membujuk orang agar membantumu." },
  "Deception": { en: "Lie and bluff convincingly.", id: "Berbohong dan menggertak dengan meyakinkan." },
  "Acrobatics": { en: "Keep your balance and slip out of grabs.", id: "Menjaga keseimbangan dan lepas dari cengkeraman." },
  "Sleight of Hand": { en: "Pick pockets and hide small things.", id: "Mencopet dan menyembunyikan benda kecil." },
  "Performance": { en: "Impress a crowd with your art.", id: "Memukau penonton dengan senimu." },
  "Insight": { en: "Tell when someone is lying.", id: "Tahu saat seseorang berbohong." },
  "Athletics": { en: "Climb, jump, grapple and shove.", id: "Memanjat, melompat, mencengkeram, dan mendorong." },
};

const EXPERTISE_ORDER: Record<string, string[]> = {
  Rogue: ["Stealth", "Thieves' Tools", "Perception", "Acrobatics", "Sleight of Hand", "Deception", "Insight", "Athletics"],
  Bard: ["Persuasion", "Perception", "Deception", "Performance", "Stealth", "Insight", "Athletics"],
};

/** Expertise suggestions for a class; only skills the character is proficient in will show. */
export function expertisePicks(className: string): Pick[] {
  const order = EXPERTISE_ORDER[className] || ["Perception", "Stealth", "Persuasion", "Athletics", "Insight", "Deception"];
  return order.map((name) => ({ name, why: EXPERTISE_WHY[name] }));
}
