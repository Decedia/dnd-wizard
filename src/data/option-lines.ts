// One short line per option in the level-up pickers, in plain words, for the
// options whose own text is missing or is a long rules paragraph. The full rules
// stay behind the Info button. Keys are the option name, or "Feature|Option" when
// the same name means different things (a Bear totem at level 3, 6 and 14).

import type { Why } from "@/lib/level-up-picks";

export const OPTION_LINES: Record<string, Why> = {
  // Fighting styles
  "Protection": { en: "Use your shield to make an enemy's attack on a nearby friend harder.", id: "Pakai perisaimu untuk mempersulit serangan musuh ke teman di dekatmu." },
  "Fighting Style: Protection": { en: "Use your shield to make an enemy's attack on a nearby friend harder.", id: "Pakai perisaimu untuk mempersulit serangan musuh ke teman di dekatmu." },

  // Favored Enemy
  "Aberrations": { en: "Alien minds from beyond, like beholders and mind flayers.", id: "Makhluk asing dari luar dunia, seperti beholder dan mind flayer." },
  "Beasts": { en: "Ordinary and giant animals.", id: "Hewan biasa dan hewan raksasa." },
  "Celestials": { en: "Angels and other holy beings.", id: "Malaikat dan makhluk suci lainnya." },
  "Constructs": { en: "Golems and other living machines.", id: "Golem dan mesin hidup lainnya." },
  "Dragons": { en: "Dragons and their kin.", id: "Naga dan kerabatnya." },
  "Elementals": { en: "Living fire, water, air and earth.", id: "Api, air, udara, dan tanah yang hidup." },
  "Fey": { en: "Magical folk of the wild, like pixies and dryads.", id: "Makhluk sihir dari alam liar, seperti pixie dan dryad." },
  "Fiends": { en: "Demons and devils.", id: "Iblis dan setan." },
  "Giants": { en: "Giants, ogres and trolls.", id: "Raksasa, ogre, dan troll." },
  "Monstrosities": { en: "Strange monsters, like owlbears and manticores.", id: "Monster aneh, seperti owlbear dan manticore." },
  "Oozes": { en: "Living slime, like the gelatinous cube.", id: "Lendir hidup, seperti gelatinous cube." },
  "Plants": { en: "Walking plants and fungus monsters.", id: "Tumbuhan berjalan dan monster jamur." },
  "Undead": { en: "Zombies, skeletons, ghosts and vampires.", id: "Zombi, tengkorak, hantu, dan vampir." },
  "Humanoid (2 races)": { en: "Pick two kinds of people instead, like orcs and gnolls.", id: "Pilih dua jenis bangsa sebagai gantinya, seperti orc dan gnoll." },

  // Natural Explorer
  "Arctic": { en: "Ice, snow and frozen tundra.", id: "Es, salju, dan tundra beku." },
  "Coast": { en: "Beaches, cliffs and the edge of the sea.", id: "Pantai, tebing, dan tepi laut." },
  "Desert": { en: "Sand, dunes and dry wasteland.", id: "Pasir, bukit pasir, dan tanah gersang." },
  "Forest": { en: "Woods and jungles.", id: "Hutan dan rimba." },
  "Grassland": { en: "Open plains and meadows.", id: "Padang rumput dan dataran terbuka." },
  "Mountain": { en: "Peaks, cliffs and high passes.", id: "Puncak, tebing, dan jalur pegunungan." },
  "Swamp": { en: "Marshes, bogs and wetlands.", id: "Rawa, paya, dan lahan basah." },
  "Underdark": { en: "The huge caves deep under the ground.", id: "Gua raksasa jauh di bawah tanah." },
  "Underwater": { en: "Under the sea.", id: "Di bawah laut." },

  // Eldritch Invocations
  "Ascendant Step": { en: "Cast Levitate on yourself whenever you like.", id: "Rapalkan Levitate pada dirimu kapan saja." },
  "Aspect of the Moon": { en: "You never need sleep. Rest by doing light work instead.", id: "Kamu tidak perlu tidur. Istirahat cukup dengan kerja ringan." },
  "Beast Speech": { en: "Cast Speak with Animals whenever you like.", id: "Rapalkan Speak with Animals kapan saja." },
  "Beguiling Defenses": { en: "You can't be charmed, and you can turn a charm back on its caster.", id: "Kamu kebal charm, dan bisa membalikkan charm ke perapalnya." },
  "Beguiling Influence": { en: "Get good at Deception and Persuasion.", id: "Mahir Deception dan Persuasion." },
  "Bewitching Whispers": { en: "Cast Compulsion once per long rest.", id: "Rapalkan Compulsion sekali per long rest." },
  "Bond of the Talisman": { en: "Teleport to the talisman's wearer, or they to you.", id: "Teleport ke pemakai jimat, atau dia ke kamu." },
  "Book of Ancient Secrets": { en: "Write ritual spells from any class into your book and cast them.", id: "Tulis spell ritual dari class mana pun ke bukumu dan rapalkan." },
  "Chains of Carceri": { en: "Cast Hold Monster on angels, demons and elementals whenever you like.", id: "Rapalkan Hold Monster pada malaikat, iblis, dan elemental kapan saja." },
  "Cloak of Flies": { en: "A swarm of flies hurts enemies next to you and helps you scare people.", id: "Kawanan lalat melukai musuh di dekatmu dan membantumu menakuti orang." },
  "Dreadful Word": { en: "Cast Confusion once per long rest.", id: "Rapalkan Confusion sekali per long rest." },
  "Eldritch Mind": { en: "Advantage on CON saves to keep your concentration.", id: "Advantage pada save CON untuk menjaga konsentrasi." },
  "Eldritch Sight": { en: "Cast Detect Magic whenever you like.", id: "Rapalkan Detect Magic kapan saja." },
  "Eldritch Smite": { en: "Spend a spell slot on a weapon hit for big force damage and knock the target down.", id: "Pakai slot spell saat senjata kena untuk damage force besar dan menjatuhkan target." },
  "Eldritch Spear": { en: "Eldritch Blast reaches 300 feet.", id: "Eldritch Blast menjangkau 300 kaki." },
  "Eyes of the Rune Keeper": { en: "Read any writing.", id: "Bisa membaca tulisan apa pun." },
  "Far Scribe": { en: "Send short messages to anyone who signed your book.", id: "Kirim pesan singkat ke siapa pun yang menandatangani bukumu." },
  "Gaze of Two Minds": { en: "See and hear through a willing friend's senses.", id: "Melihat dan mendengar lewat indra teman yang mau." },
  "Ghostly Gaze": { en: "See through walls for a minute, once per short rest.", id: "Melihat menembus dinding selama satu menit, sekali per short rest." },
  "Gift of the Depths": { en: "Breathe underwater and swim fast.", id: "Bernapas di dalam air dan berenang cepat." },
  "Gift of the Ever-Living Ones": { en: "Healing always heals the most it can while your familiar is near.", id: "Penyembuhan selalu maksimal selama familiar-mu dekat." },
  "Gift of the Protectors": { en: "Friends who signed your book drop to 1 HP instead of 0, once.", id: "Teman yang menandatangani bukumu jatuh ke 1 HP, bukan 0, sekali." },
  "Grasp of Hadar": { en: "Eldritch Blast pulls the target 10 feet closer.", id: "Eldritch Blast menarik target 10 kaki lebih dekat." },
  "Improved Pact Weapon": { en: "Your pact weapon gets +1 and can be a bow.", id: "Senjata pakta dapat +1 dan bisa berupa busur." },
  "Investment of the Chain Master": { en: "Your familiar gets stronger: it flies or swims faster and its attacks are magical.", id: "Familiar-mu makin kuat: terbang atau berenang lebih cepat dan serangannya sihir." },
  "Lance of Lethargy": { en: "Eldritch Blast slows the target by 10 feet.", id: "Eldritch Blast memperlambat target 10 kaki." },
  "Lifedrinker": { en: "Your pact weapon deals extra necrotic damage.", id: "Senjata pakta memberi damage necrotic tambahan." },
  "Maddening Hex": { en: "Hurt everyone around your hexed target with a bonus action.", id: "Lukai semua di sekitar target hex-mu dengan bonus action." },
  "Master of Myriad Forms": { en: "Cast Alter Self whenever you like.", id: "Rapalkan Alter Self kapan saja." },
  "Minions of Chaos": { en: "Cast Conjure Elemental once per long rest.", id: "Rapalkan Conjure Elemental sekali per long rest." },
  "Mire the Mind": { en: "Cast Slow once per long rest.", id: "Rapalkan Slow sekali per long rest." },
  "Misty Visions": { en: "Cast Silent Image whenever you like.", id: "Rapalkan Silent Image kapan saja." },
  "One with Shadows": { en: "Turn invisible in the dark while you stand still.", id: "Menjadi tak terlihat di kegelapan selama kamu diam." },
  "Otherworldly Leap": { en: "Cast Jump on yourself whenever you like.", id: "Rapalkan Jump pada dirimu kapan saja." },
  "Protection of the Talisman": { en: "The talisman's wearer adds 1d4 to a failed save.", id: "Pemakai jimat menambah 1d4 ke save yang gagal." },
  "Rebuke of the Talisman": { en: "Hurt and push away anyone who hits the talisman's wearer.", id: "Lukai dan dorong siapa pun yang memukul pemakai jimat." },
  "Relentless Hex": { en: "Teleport next to your hexed target.", id: "Teleport ke samping target hex-mu." },
  "Sculptor of Flesh": { en: "Cast Polymorph once per long rest.", id: "Rapalkan Polymorph sekali per long rest." },
  "Shroud of Shadow": { en: "Cast Invisibility whenever you like.", id: "Rapalkan Invisibility kapan saja." },
  "Sign of Ill Omen": { en: "Cast Bestow Curse once per long rest.", id: "Rapalkan Bestow Curse sekali per long rest." },
  "Thief of Five Fates": { en: "Cast Bane once per long rest.", id: "Rapalkan Bane sekali per long rest." },
  "Tomb of Levistus": { en: "Encase yourself in ice to soak up a big hit.", id: "Bungkus dirimu dengan es untuk menahan serangan besar." },
  "Trickster's Escape": { en: "Cast Freedom of Movement on yourself once per long rest.", id: "Rapalkan Freedom of Movement pada dirimu sekali per long rest." },
  "Undying Servitude": { en: "Cast Animate Dead once per long rest.", id: "Rapalkan Animate Dead sekali per long rest." },
  "Visions of Distant Realms": { en: "Cast Arcane Eye whenever you like.", id: "Rapalkan Arcane Eye kapan saja." },
  "Voice of the Chain Master": { en: "Talk through your familiar and use its senses from far away.", id: "Bicara lewat familiar-mu dan pakai indranya dari jauh." },
  "Whispers of the Grave": { en: "Cast Speak with Dead whenever you like.", id: "Rapalkan Speak with Dead kapan saja." },
  "Witch Sight": { en: "See through disguises and shapechanges near you.", id: "Melihat menembus penyamaran dan wujud palsu di dekatmu." },

  // Skills not in the expertise suggestions
  "Animal Handling": { en: "Calm, ride and train animals.", id: "Menenangkan, menunggangi, dan melatih hewan." },
  "Arcana": { en: "Know about magic and spells.", id: "Paham tentang sihir dan spell." },
  "History": { en: "Remember old events, kingdoms and wars.", id: "Ingat peristiwa, kerajaan, dan perang masa lalu." },
  "Intimidation": { en: "Scare people into doing what you want.", id: "Menakuti orang agar menurutimu." },
  "Investigation": { en: "Find clues and work out how things fit together.", id: "Menemukan petunjuk dan memahami hubungannya." },
  "Medicine": { en: "Patch up the dying and spot illness.", id: "Merawat yang sekarat dan mengenali penyakit." },
  "Nature": { en: "Know about plants, animals and weather.", id: "Paham tentang tumbuhan, hewan, dan cuaca." },
  "Religion": { en: "Know about gods, rites and holy symbols.", id: "Paham tentang dewa, ritual, dan simbol suci." },
  "Survival": { en: "Track, hunt and find your way in the wild.", id: "Melacak, berburu, dan mencari jalan di alam liar." },

  // Rune Knight
  "Fire Rune": { en: "Your tools are better. On a hit, chain the target in burning fire.", id: "Alatmu lebih baik. Saat kena, belenggu target dengan api." },
  "Frost Rune": { en: "Better at animals and scaring. Boost your STR and CON for a while.", id: "Lebih jago dengan hewan dan menakuti. Naikkan STR dan CON sebentar." },
  "Stone Rune": { en: "See in the dark. Put a nearby enemy into a dazed trance.", id: "Melihat dalam gelap. Buat musuh di dekat terpaku linglung." },
  "Hill Rune": { en: "Resist poison. Take half damage from weapons for a minute.", id: "Tahan racun. Terima setengah damage senjata selama satu menit." },
  "Storm Rune": { en: "You can't be surprised. Give advantage or disadvantage to rolls near you.", id: "Kamu tidak bisa dikejutkan. Beri advantage atau disadvantage ke lemparan di dekatmu." },
  "Cloud Rune": { en: "Better at sneaking and lying. Move a hit from you onto someone else.", id: "Lebih jago menyelinap dan berbohong. Alihkan serangan darimu ke orang lain." },

  // Arcane Archer
  "Banishing Arrow": { en: "Send the target to another world for a moment.", id: "Kirim target ke dunia lain sebentar." },
  "Enfeebling Arrow": { en: "The target's weapon attacks do half damage.", id: "Serangan senjata target hanya setengah damage." },
  "Piercing Arrow": { en: "The arrow flies through everyone in a line.", id: "Panah menembus semua yang ada di satu garis." },
  "Seeking Arrow": { en: "The arrow curves around cover and finds a target you know.", id: "Panah berbelok melewati penghalang dan menemukan target yang kamu kenal." },

  // Hunter
  "Hunter's Prey: Colossus Slayer": { en: "Deal 1d8 extra damage to an enemy that's already hurt.", id: "Damage tambahan 1d8 ke musuh yang sudah terluka." },
  "Hunter's Prey: Giant Killer": { en: "Strike back when a big creature attacks you.", id: "Balas serang saat makhluk besar menyerangmu." },
  "Hunter's Prey: Horde Breaker": { en: "Get a free extra attack on a second enemy standing close by.", id: "Dapat serangan tambahan gratis ke musuh kedua yang berdiri dekat." },
  "Defensive Tactics: Multiattack Defense": { en: "After a monster hits you once, its next attacks on you are harder.", id: "Setelah monster mengenaimu sekali, serangan berikutnya padamu lebih sulit." },
  "Multiattack: Volley": { en: "Shoot every enemy in a small area at once.", id: "Tembak semua musuh di area kecil sekaligus." },
  "Multiattack: Whirlwind Attack": { en: "Swing at every enemy next to you at once.", id: "Serang semua musuh di sekitarmu sekaligus." },
  "Superior Hunter's Defense: Evasion": { en: "Take no damage from area attacks when you pass the DEX save.", id: "Tidak kena damage dari serangan area saat lolos save DEX." },
  "Superior Hunter's Defense: Stand Against the Tide": { en: "Make a missed attack hit another enemy instead.", id: "Buat serangan yang meleset mengenai musuh lain." },
  "Superior Hunter's Defense: Uncanny Dodge": { en: "Halve the damage of a hit you can see coming.", id: "Kurangi setengah damage serangan yang kamu lihat datang." },

  // Beast Master companions
  "Panther": { en: "Fast hunter that pounces and knocks enemies down.", id: "Pemburu cepat yang menerkam dan menjatuhkan musuh." },
  "Mastiff": { en: "Loyal dog that knocks enemies down.", id: "Anjing setia yang menjatuhkan musuh." },
  "Hawk": { en: "Flying scout with sharp eyes.", id: "Pengintai terbang bermata tajam." },
  "Boar": { en: "Tough charger that keeps going when hurt.", id: "Penyeruduk tangguh yang tetap bertahan saat terluka." },
  "Giant Wolf Spider": { en: "Climbs walls and has a poison bite.", id: "Memanjat dinding dan gigitannya beracun." },
  "Ranger's Companion|Wolf": { en: "Pack hunter that knocks enemies down. Gets advantage when friends are close.", id: "Pemburu kawanan yang menjatuhkan musuh. Dapat advantage saat teman dekat." },
  "Giant Badger": { en: "Digs through the ground and bites hard.", id: "Menggali tanah dan menggigit keras." },
  "Primal Companion: Beast of the Land": { en: "A strong land beast that charges and knocks enemies down.", id: "Hewan darat kuat yang menyeruduk dan menjatuhkan musuh." },
  "Primal Companion: Beast of the Sea": { en: "A water beast that grabs enemies and holds them.", id: "Hewan air yang mencengkeram dan menahan musuh." },
  "Primal Companion: Beast of the Sky": { en: "A flying beast that dives in and darts away.", id: "Hewan terbang yang menukik lalu melesat pergi." },

  // Totem Warrior
  "Totem Spirit|Bear": { en: "While raging, take half damage from almost everything.", id: "Saat rage, terima setengah damage dari hampir semua hal." },
  "Totem Spirit|Eagle": { en: "While raging, dash as a bonus action and enemies get disadvantage on opportunity attacks.", id: "Saat rage, dash dengan bonus action dan musuh disadvantage pada opportunity attack." },
  "Totem Spirit|Wolf": { en: "While raging, your friends get advantage on enemies next to you.", id: "Saat rage, temanmu dapat advantage ke musuh di dekatmu." },
  "Totem Spirit|Elk": { en: "While raging, you move much faster.", id: "Saat rage, kamu bergerak jauh lebih cepat." },
  "Totem Spirit|Tiger": { en: "While raging, you jump much farther.", id: "Saat rage, kamu melompat jauh lebih jauh." },
  "Aspect of the Beast|Bear": { en: "Carry and lift twice as much.", id: "Membawa dan mengangkat dua kali lebih banyak." },
  "Aspect of the Beast|Eagle": { en: "See clearly far away, even in dim light.", id: "Melihat jelas dari jauh, bahkan di cahaya redup." },
  "Aspect of the Beast|Wolf": { en: "Track creatures and sneak at a fast pace.", id: "Melacak makhluk dan menyelinap dengan cepat." },
  "Aspect of the Beast|Elk": { en: "Travel twice as fast over long distances.", id: "Bepergian dua kali lebih cepat untuk jarak jauh." },
  "Aspect of the Beast|Tiger": { en: "Learn two outdoor skills.", id: "Pelajari dua skill alam terbuka." },
  "Totemic Attunement|Bear": { en: "While raging, enemies near you struggle to attack anyone else.", id: "Saat rage, musuh di dekatmu sulit menyerang orang lain." },
  "Totemic Attunement|Eagle": { en: "While raging, you can fly for a short while.", id: "Saat rage, kamu bisa terbang sebentar." },
  "Totemic Attunement|Wolf": { en: "While raging, knock an enemy down when you hit it.", id: "Saat rage, jatuhkan musuh saat seranganmu kena." },
  "Totemic Attunement|Elk": { en: "While raging, run through enemies and knock them down.", id: "Saat rage, terobos musuh dan jatuhkan mereka." },
  "Totemic Attunement|Tiger": { en: "While raging, get a bonus attack after charging in.", id: "Saat rage, dapat serangan bonus setelah menyerbu." },

  // Path of the Beast
  "Bite": { en: "A bite that heals you a little when you're hurt.", id: "Gigitan yang sedikit menyembuhkanmu saat terluka." },
  "Claws": { en: "Claws that let you make one extra attack.", id: "Cakar yang memberi satu serangan tambahan." },
  "Tail": { en: "A long tail that can block a hit.", id: "Ekor panjang yang bisa menangkis serangan." },

  // Way of the Four Elements
  "Fangs of the Fire Snake": { en: "Your punches reach farther and burn.", id: "Pukulanmu menjangkau lebih jauh dan membakar." },
  "Fist of Unbroken Air": { en: "Blast an enemy with air, hurting it and pushing it away.", id: "Hantam musuh dengan udara, melukai dan mendorongnya." },
  "Water Whip": { en: "Whip of water that hurts and pulls an enemy or knocks it down.", id: "Cambuk air yang melukai dan menarik musuh atau menjatuhkannya." },

  // Armorer
  "Guardian": { en: "Heavy armor that keeps enemies busy fighting you.", id: "Armor berat yang membuat musuh sibuk melawanmu." },
  "Infiltrator": { en: "Light, quiet armor with a lightning blast from range.", id: "Armor ringan dan senyap dengan tembakan petir jarak jauh." },
};

/** "Dragon Ancestor: Red - Fire Damage": the damage type, in plain words. */
export function dragonAncestorLine(name: string): Why | null {
  const m = /^Dragon Ancestor: (\w+) - (\w+) Damage$/.exec(name);
  if (!m) return null;
  const type = m[2].toLowerCase();
  const idType: Record<string, string> = { acid: "asam", lightning: "petir", fire: "api", poison: "racun", cold: "dingin" };
  return {
    en: `A ${m[1].toLowerCase()} dragon. You speak Draconic, and ${type} spells hit harder later on.`,
    id: `Naga ${m[1].toLowerCase()}. Kamu bisa bahasa Draconic, dan spell ${idType[type] || type} lebih kuat nanti.`,
  };
}
