export interface BackgroundData {
  name: string;
  skillProficiencies: string[];
  toolProficiencies: string[];
  languages: number;
  equipment: string[];
  feature: { name: string; description: string };
  personalityTraits: string[];
  ideals: string[];
  bonds: string[];
  flaws: string[];
}

export const backgroundsData: BackgroundData[] = [
  {
    name: "Acolyte",
    skillProficiencies: ["Insight", "Religion"],
    toolProficiencies: [],
    languages: 2,
    equipment: ["Holy symbol", "Prayer book", "5 sticks of incense", "vestments", "set of common clothes", "belt pouch containing 15 gp"],
    feature: {
      name: "Shelter of the Faithful",
      description: "As an acolyte, you and your companions can expect to receive healing and care at a temple of your faith. You can also gain access to shrines and altars for spellcasting purposes."
    },
    personalityTraits: [
      "I idolize a particular hero of my faith, and constantly refer to that person's deeds and example.",
      "I can find common ground between the fiercest enemies, empathizing with them and always working toward peace.",
      "I see omens in every event and action. The gods try to speak to us, we just have to listen.",
      "Nothing can shake my optimistic attitude.",
      "I quote (or misquote) sacred texts and proverbs in almost every situation.",
      "I am tolerant (or intolerant) of other faiths and respect (or condemn) the worship of other gods.",
      "I've enjoyed fine food, drink, and the high society of urban elites. I've been in the temples of my faith.",
      "I've spent so long in the temple that I have little practical experience dealing with people in the outside world."
    ],
    ideals: [
      "Charity. I always try to help those in need, no matter what the personal cost. (Good)",
      "Tradition. The ancient traditions of worship and ceremony must be preserved and upheld. (Lawful)",
      "Change. We must help bring about the changes the gods are constantly working in the world. (Chaotic)",
      "Power. I hope to one day rise to the top of my faith's religious hierarchy. (Lawful)",
      "Faith. I trust that my deity will guide my actions. I have faith that if I work hard, things will go well. (Good)",
      "Aspiration. I seek to prove myself worthy of my god's favor by matching my actions to his or her teachings. (Good)"
    ],
    bonds: [
      "I would die to recover an ancient relic of my faith that was lost long ago.",
      "I will someday get revenge on the corrupt temple hierarchy who branded me a heretic.",
      "I owe my life to the priest who took me in when my parents died.",
      "Everything I do is for the common people.",
      "I will do anything to protect the temple where I served.",
      "I seek to preserve a sacred text that my enemies consider heretical and seek to destroy."
    ],
    flaws: [
      "I judge others harshly, and myself even more severely.",
      "I trust in those who wield power within my temple's hierarchy.",
      "My piety sometimes leads me to blindly trust those who profess faith in my god.",
      "I am inflexible in my thinking.",
      "I am suspicious of strangers and expect the worst of them.",
      "I am obsessed with my life as a scholar and have little time for anything else."
    ]
  },
  {
    name: "Charlatan",
    skillProficiencies: ["Deception", "Sleight of Hand"],
    toolProficiencies: ["Disguise kit", "Forgery kit"],
    languages: 0,
    equipment: ["Set of fine clothes", "disguise kit", "tools of the con of your choice", "belt pouch containing 15 gp"],
    feature: {
      name: "False Identity",
      description: "You have created a second identity that has documentation, established acquaintances, and disguises that allow you to assume that persona."
    },
    personalityTraits: [
      "I fall in and out of love easily, and am always pursuing someone.",
      "I have a joke for every situation, especially when matters are dangerous.",
      "I'm a born gambler who can't resist taking a risk for a potential payoff.",
      "I lie about almost everything, even when there's no reason to.",
      "I'm superstitious and use omens and rituals to guide me in every decision.",
      "I'm a quick thinker who can talk my way out of any situation.",
      "I'm a smooth-talking charmer who can convince anyone to do anything.",
      "I'm a grifter who always has a scheme in the works."
    ],
    ideals: [
      "Independence. I am a free spirit — no one tells me what to do. (Chaotic)",
      "Fairness. I never target people who can't afford to lose a few coins. (Good)",
      "Charity. I distribute the money I acquire to the people who really need it. (Good)",
      "Creativity. I never run the same con twice. (Chaotic)",
      "Friendship. Material goods come and go. Bonds of friendship last forever. (Good)",
      "Aspiration. I'm determined to make something of myself. (Any)"
    ],
    bonds: [
      "I fleeced the wrong person and must work to ensure that this individual never crosses paths with me again.",
      "I owe everything to my mentor — a horrible person who's probably rotting in jail somewhere.",
      "Somewhere out there, I have a child who doesn't know me. I'm making the world better for him or her.",
      "I come from a noble family, and one day I'll reclaim my lands and title from the usurpers who stole them.",
      "A powerful person killed someone I love. Soon enough, I'll have my revenge.",
      "I swindled and ruined a person who didn't deserve it. I seek to atone for my misdeeds but might never be able to forgive myself."
    ],
    flaws: [
      "I can't resist a pretty face.",
      "I'm always in debt. I spend my ill-gotten gains on decadent vices.",
      "I'm convinced that no one could ever fool me the way I fool others.",
      "I'm too greedy for my own good. I can't resist taking a risk if money is involved.",
      "I can't resist swindling people who are more powerful than me.",
      "I hate to admit it and will hate myself for it, but I'll run and preserve my own hide if the going gets tough."
    ]
  },
  {
    name: "Criminal",
    skillProficiencies: ["Deception", "Stealth"],
    toolProficiencies: ["One type of gaming set", "thieves' tools"],
    languages: 0,
    equipment: ["Crowbar", "set of dark common clothes including a hood", "belt pouch containing 15 gp"],
    feature: {
      name: "Criminal Contact",
      description: "You have a reliable and trustworthy contact who acts as your liaison to a network of other criminals. You know how to get messages to and from your contact, even over great distances."
    },
    personalityTraits: [
      "I always have a plan for what to do when things go wrong.",
      "I am always calm, no matter the situation. I never raise my voice or let my emotions control me.",
      "The first thing I do in a new place is note the locations of everything valuable — or where such things are likely to be hidden.",
      "I would rather make a new friend than a new enemy.",
      "I am incredibly slow to trust. Those who seem the fairest often have the most to hide.",
      "I don't pay attention to the risk in a situation. Never tell me the odds.",
      "The best way to get me to do something is to tell me I can't do it.",
      "I get frustrated if I'm not the smartest person in the room."
    ],
    ideals: [
      "Honor. I don't steal from others in the trade. (Lawful)",
      "Freedom. Chains are meant to be broken, as are those who would forge them. (Chaotic)",
      "Charity. I steal from the wealthy so that I can help people in need. (Good)",
      "Greed. I will do whatever it takes to become wealthy. (Evil)",
      "People. I'm loyal to my friends, not to any ideals. Any (Good)",
      "Redemption. There's a spark of good in everyone. (Good)"
    ],
    bonds: [
      "I'm trying to pay off an old debt I owe to a generous benefactor.",
      "My ill-gotten gains go to support my family.",
      "Something important was taken from me, and I aim to steal it back.",
      "I will become the greatest thief that ever lived.",
      "I'm guilty of a terrible crime. I hope to atone for it.",
      "Someone I loved died because of a mistake I made. That will happen again."
    ],
    flaws: [
      "When I see something valuable, I can't think about anything but how to steal it.",
      "When faced with a choice between money and my friends, I usually choose the money.",
      "If there's a plan, I'll forget it. If I don't forget it, I'll ignore it.",
      "I have a 'tell' that reveals when I'm lying.",
      "I turn tail and run when things look bad.",
      "An innocent person is in prison for a crime I committed. I'm okay with that."
    ]
  },
  {
    name: "Entertainer",
    skillProficiencies: ["Acrobatics", "Performance"],
    toolProficiencies: ["Disguise kit", "one type of musical instrument"],
    languages: 0,
    equipment: ["Musical instrument", "favor of an admirer", "costume", "belt pouch containing 15 gp"],
    feature: {
      name: "By Popular Demand",
      description: "You can always find a place to perform, such as a tavern or inn. At such places, you receive free lodging and food of a modest or comfortable standard."
    },
    personalityTraits: [
      "I know a story relevant to almost every situation.",
      "I'm full of witty sayings and comebacks.",
      "I'm a hopeless romantic, always searching for that special someone.",
      "I never pass up a friendly wager.",
      "I'm always on the lookout for my next big break.",
      "I put on a show for everyone, even in the most dire situations.",
      "I'm confident in my abilities and never back down from a challenge.",
      "I'm a perfectionist who spends too much time on the details."
    ],
    ideals: [
      "Beauty. When I perform, I make the world better than it was. (Good)",
      "Tradition. The stories, legends, and songs of the past must never be forgotten. (Lawful)",
      "Creativity. The world is in need of new ideas and bold action. (Chaotic)",
      "Greed. I'm only in it for the money and fame. (Evil)",
      "People. I like seeing the smiles on people's faces when I perform. (Good)",
      "Honesty. Art should reflect the soul; it should come from within and reveal who you really are. (Any)"
    ],
    bonds: [
      "My instrument is my most treasured possession, and it reminds me of someone I love.",
      "Someone stole my precious instrument, and someday I'll get it back.",
      "I want to be famous, whatever it takes.",
      "I idolize a hero of the old tales and measure my deeds against that person's.",
      "I will do anything to prove myself superior to my rival.",
      "I would do anything for the other members of my old troupe."
    ],
    flaws: [
      "I'll do anything to win fame and renown.",
      "I'm a sucker for a pretty face.",
      "A scandal prevents me from going back home. That kind of trouble seems to follow me around.",
      "I once satirized a local noble who still wants my head. It was a costly mistake I won't soon repeat.",
      "I often keep my true feelings hidden and have a hard time opening up to people.",
      "My pride can be my downfall."
    ]
  },
  {
    name: "Folk Hero",
    skillProficiencies: ["Animal Handling", "Survival"],
    toolProficiencies: ["One type of artisan's tools", "vehicles (land)"],
    languages: 0,
    equipment: ["Set of artisan's tools", "shovel", "iron pot", "set of common clothes", "belt pouch containing 10 gp"],
    feature: {
      name: "Rustic Hospitality",
      description: "Since you are of the common folk, you can find a place to hide, rest, or hide among other commoners."
    },
    personalityTraits: [
      "I judge people by their actions, not their words.",
      "If someone is in trouble, I'm always ready to lend help.",
      "I get lost in my work and can lose track of time.",
      "I'm a firm believer in treating others with respect.",
      "I'm often lost in my own thoughts and get easily distracted.",
      "I'm a perfectionist who expects the same from others.",
      "I'm a firm believer that hard work is the key to success.",
      "I always have a kind word for those in need."
    ],
    ideals: [
      "Respect. People deserve to be treated with dignity and respect. (Good)",
      "Fairness. No one should get preferential treatment before the law. (Lawful)",
      "Freedom. Tyrants must not be allowed to oppress the people. (Chaotic)",
      "Might. If I become strong, I can take what I want — what I deserve. (Evil)",
      "Sincerity. There's no good in pretending to be something I'm not. (Good)",
      "Destiny. Nothing and no one can steer me away from my chosen path. (Any)"
    ],
    bonds: [
      "I have a family, but I have no idea where they are. One day, I hope to see them again.",
      "I worked the land, and the land is what I love.",
      "A proud noble once gave me a blackened eye, and I will take my revenge on that entire family.",
      "My tools are symbols of my past life, and I carry them so that I will never forget my roots.",
      "I protect those who cannot protect themselves.",
      "I wish my childhood sweetheart had come with me to pursue my destiny."
    ],
    flaws: [
      "The tyrant who rules my land will stop at nothing to see me killed.",
      "I'm blind to the flaws in my own beliefs and ideas.",
      "I have trouble trusting in anyone other than myself.",
      "I'm quick to anger when others don't meet my expectations.",
      "I have a weakness for the vices of the city, especially hard drink.",
      "I secretly believe that things would be better if I were a tyrant lording over everyone."
    ]
  },
  {
    name: "Guild Artisan",
    skillProficiencies: ["Insight", "Persuasion"],
    toolProficiencies: ["One type of artisan's tools"],
    languages: 1,
    equipment: ["Set of artisan's tools", "letter of introduction from your guild", "set of traveler's clothes", "belt pouch containing 15 gp"],
    feature: {
      name: "Guild Membership",
      description: "As an established and respected member of a guild, you can rely on certain benefits that membership provides."
    },
    personalityTraits: [
      "I believe that anything worth doing is worth doing right.",
      "I'm a dreamer who loves to imagine what could be.",
      "I'm always thinking of ways to improve my craft.",
      "I'm a snob who looks down on those who can't appreciate fine craftsmanship.",
      "I'm a perfectionist who spends too much time on the details.",
      "I'm always looking for ways to expand my knowledge.",
      "I'm a firm believer in the value of hard work.",
      "I'm a natural leader who likes to be in charge."
    ],
    ideals: [
      "Community. It is the duty of all civilized people to strengthen the bonds of community and the security of civilization. (Lawful)",
      "Generosity. My talents were given to me so that I could benefit the world. (Good)",
      "Freedom. Everyone should be free to pursue his or her own goals. (Chaotic)",
      "Greed. I'm only in it for the money. (Evil)",
      "People. I'm committed to the people I care about, not to abstract ideals. (Any)",
      "Aspiration. I work hard to be the best there is at my craft. (Any)"
    ],
    bonds: [
      "The workshop where I learned my trade is the most important place in the world to me.",
      "I created a great work for someone, and then found them unworthy to receive it. I'm still seeking someone worthy.",
      "I owe my guild a great debt for training me.",
      "I pursue wealth to secure someone's love.",
      "One day I will return to my guild and prove myself as its finest member.",
      "I will get revenge on the evil forces that destroyed my place of business and ruined my livelihood."
    ],
    flaws: [
      "I'll do anything to get my hands on something rare or priceless.",
      "I'm never satisfied with what I have — I always want more.",
      "I'm quick to assume that someone is trying to cheat me.",
      "I have a secret that could ruin my life if it were discovered.",
      "I'm quick to anger when others don't meet my expectations.",
      "I secretly hate myself and sometimes wonder if I'm worth anything."
    ]
  },
  {
    name: "Hermit",
    skillProficiencies: ["Medicine", "Religion"],
    toolProficiencies: ["Herbalism kit"],
    languages: 1,
    equipment: ["Scroll case stuffed full of notes", "winter blanket", "set of common clothes", "herbalism kit", "5 gp"],
    feature: {
      name: "Discovery",
      description: "The quiet seclusion of your extended hermitage gave you access to a unique and powerful discovery."
    },
    personalityTraits: [
      "I've been isolated for so long that I rarely speak, preferring gestures and the occasional grunt.",
      "I am utterly serene, even in the face of disaster.",
      "My mind wanders, and I am prone to long silences.",
      "I have an insatiable curiosity about the world around me.",
      "I find the company of others exhausting and prefer to be alone.",
      "I'm a dreamer who loves to imagine what could be.",
      "I'm always thinking of ways to improve my surroundings.",
      "I'm a perfectionist who spends too much time on the details."
    ],
    ideals: [
      "Greater Good. My gifts are meant to be shared with the world. (Good)",
      "Logical Nature. Emotions must not cloud our sense of what is right and true. (Lawful)",
      "Free Thinking. Inquiry and curiosity are the pillars of progress. (Chaotic)",
      "Power. Solitude and contemplation are paths toward mystical or magical power. (Evil)",
      "Live and Let Live. Meddling in the affairs of others only causes trouble. (Neutral)",
      "Self-Knowledge. If you know yourself, there's nothing left to know. (Any)"
    ],
    bonds: [
      "Nothing is more important than the other members of my hermitage, order, or association.",
      "I entered seclusion to hide from the ones who might still be hunting me. I must someday confront them.",
      "I'm still seeking the enlightenment I pursued in my seclusion.",
      "I entered seclusion because I loved someone I could not have.",
      "Should my discovery come to light, it might bring ruin to the world.",
      "My isolation gave me great insight into a cosmic secret that must not be shared."
    ],
    flaws: [
      "Now that I've returned to the world, I enjoy its delights a little too much.",
      "I harbor dark, bloodthirsty thoughts that my isolation and meditation failed to quell.",
      "I am dogmatic in my thinking and philosophy.",
      "I let my need to win arguments overshadow friendships and harmony.",
      "I'd risk too much to uncover a lost bit of knowledge.",
      "I like keeping secrets and won't share them with anyone."
    ]
  },
  {
    name: "Noble",
    skillProficiencies: ["History", "Persuasion"],
    toolProficiencies: ["One type of gaming set"],
    languages: 1,
    equipment: ["Set of fine clothes", "signet ring", "scroll of pedigree", "purse containing 25 gp"],
    feature: {
      name: "Position of Privilege",
      description: "Thanks to your birth, people are inclined to think the best of you. You are welcome in high society, and the common folk make every effort to accommodate you."
    },
    personalityTraits: [
      "My eloquent flattery makes everyone I talk to feel like the most important and wonderful person in the world.",
      "The common folk love me for my kindness and generosity.",
      "I have a strong sense of fair play and always try to find equitable solutions.",
      "I'm a snob who looks down on those who can't appreciate luxury.",
      "I'm always thinking of ways to improve my appearance.",
      "I'm a perfectionist who spends too much time on the details.",
      "I'm confident in my abilities and never back down from a challenge.",
      "I'm a natural leader who likes to be in charge."
    ],
    ideals: [
      "Respect. Respect is due to me because of my position, but all people regardless of station deserve to be treated with dignity. (Good)",
      "Responsibility. It is my duty to respect the authority of those above me. (Lawful)",
      "Independence. I must prove that I can handle myself without the coddling of my family. (Chaotic)",
      "Power. If I can attain more power, no one will tell me what to do. (Evil)",
      "Family. Blood runs thicker than water. (Any)",
      "Noble Obligation. It is my duty to protect and care for the people beneath me. (Good)"
    ],
    bonds: [
      "I will face any challenge to win the approval of my family.",
      "My house's alliance with another noble family must be sustained at all costs.",
      "Nothing is more important than the other members of my family.",
      "I am in love with the heir of another family.",
      "My loyalty to my sovereign is unwavering.",
      "I must prove myself worthy of my family's legacy."
    ],
    flaws: [
      "I secretly believe that I am better than everyone else.",
      "I hide a truly scandalous secret that could shatter my family forever.",
      "I too often hear veiled insults and threats in every word directed at me, and I'm quick to anger.",
      "I have an insatiable desire for carnal pleasures.",
      "In fact, the world does revolve around me.",
      "By my words and actions, I often bring shame to my family."
    ]
  },
  {
    name: "Outlander",
    skillProficiencies: ["Athletics", "Survival"],
    toolProficiencies: ["One type of musical instrument"],
    languages: 1,
    equipment: ["Staff", "hunting trap", "trophy from an animal you killed", "set of traveler's clothes", "belt pouch containing 10 gp"],
    feature: {
      name: "Wanderer",
      description: "You have an excellent memory for maps and geography, and you can always recall the general layout of terrain, settlements, and other features."
    },
    personalityTraits: [
      "I'm driven by a wanderlust that led me far from home.",
      "I watch over my friends as if they were a litter of pups.",
      "I once ran twenty-five miles without stopping to warn my clan of an approaching orc horde. I'd do it again if I had to.",
      "I have an infallible sense of direction.",
      "I find the company of others exhausting and prefer to be alone.",
      "I'm a firm believer that hard work is the key to success.",
      "I'm always thinking of ways to improve my surroundings.",
      "I'm a perfectionist who spends too much time on the details."
    ],
    ideals: [
      "Change. Life is like the seasons, in constant change, and we must change with it. (Chaotic)",
      "Greater Good. It is each person's duty to make the most of his or her gifts for the good of all. (Good)",
      "Honor. If I dishonor myself, I dishonor my whole clan. (Lawful)",
      "Might. The strongest are meant to rule. (Evil)",
      "Nature. The natural world is more important than all the works of civilization. (Neutral)",
      "Glory. I must earn glory in battle, for myself and my clan. (Any)"
    ],
    bonds: [
      "My family is the most important thing in my life, even when they are far away.",
      "I will someday reclaim my homeland from those who drove my people from it.",
      "I am the last of my clan, and its name will die with me if I do not preserve it.",
      "I have a family, but I have no idea where they are.",
      "My loyalty to my clan is unwavering.",
      "I am in love with the heir of another clan."
    ],
    flaws: [
      "I am a sucker for a pretty face.",
      "I'm always ready to believe the worst about anyone.",
      "I have trouble trusting in anyone other than myself.",
      "I'm quick to anger when others don't meet my expectations.",
      "I have a weakness for the vices of the city, especially hard drink.",
      "I secretly believe that things would be better if I were a tyrant lording over everyone."
    ]
  },
  {
    name: "Sage",
    skillProficiencies: ["Arcana", "History"],
    toolProficiencies: [],
    languages: 2,
    equipment: ["Bottle of black ink", "quill", "small knife", "letter from a dead colleague", "set of common clothes", "belt pouch containing 10 gp"],
    feature: {
      name: "Researcher",
      description: "When you attempt to learn or recall a piece of lore, if you do not know that information yourself, you often know where and from whom you can obtain it."
    },
    personalityTraits: [
      "I use polysyllabic words that convey the impression of great erudition.",
      "I've read every book in the world's greatest libraries — or I like to boast that I have.",
      "I'm used to outsmarting those who don't have my level of intellect.",
      "I'm a perfectionist who spends too much time on the details.",
      "I'm always thinking of ways to expand my knowledge.",
      "I'm a dreamer who loves to imagine what could be.",
      "I'm confident in my abilities and never back down from a challenge.",
      "I'm a natural leader who likes to be in charge."
    ],
    ideals: [
      "Knowledge. The path to power and self-improvement is through knowledge. (Neutral)",
      "Beauty. What is beautiful points us beyond itself toward what is true. (Good)",
      "Logic. Emotions must not cloud our knowledge. (Lawful)",
      "No Limits. Nothing should stand in the way of our quest for knowledge. (Chaotic)",
      "Power. Knowledge is the path to power and domination. (Evil)",
      "Self-Improvement. The goal of a life of study is the betterment of oneself. (Any)"
    ],
    bonds: [
      "It is my duty to protect my students.",
      "I have an ancient text that holds terrible secrets that must not fall into the wrong hands.",
      "I work to preserve a great library, university, scriptorium, or monastery.",
      "My life's work is a series of tomes related to a specific field of lore.",
      "I've been searching my whole life for the answer to a certain question.",
      "I sold my soul for knowledge. I hope to do great things before I have to pay the price."
    ],
    flaws: [
      "I am easily distracted by the promise of information.",
      "Most people scream and run when they see a demon. I stop and take notes on its anatomy.",
      "Unlocking an ancient mystery is worth the price of a civilization.",
      "I overlook obvious solutions in favor of complicated ones.",
      "I speak without really thinking through my words, thereby causing insult.",
      "I have an insatiable desire for secrets and knowledge."
    ]
  },
  {
    name: "Sailor",
    skillProficiencies: ["Athletics", "Perception"],
    toolProficiencies: ["Navigator's tools", "vehicles (water)"],
    languages: 0,
    equipment: ["Belaying pin", "50 feet of silk rope", "lucky charm", "set of common clothes", "belt pouch containing 10 gp"],
    feature: {
      name: "Ship's Passage",
      description: "When you need to, you can secure free passage on a sailing ship for yourself and your companions."
    },
    personalityTraits: [
      "My friends know they can rely on me, no matter what.",
      "I work hard so that I can play hard when the work's done.",
      "I'm a firm believer in treating others with respect.",
      "I'm always thinking of ways to improve my surroundings.",
      "I'm a perfectionist who spends too much time on the details.",
      "I'm confident in my abilities and never back down from a challenge.",
      "I'm a natural leader who likes to be in charge.",
      "I'm always on the lookout for my next big break."
    ],
    ideals: [
      "Respect. The thing that keeps a ship together is mutual respect between captain and crew. (Good)",
      "Fairness. We all do the work, so we all share in the rewards. (Good)",
      "Freedom. The sea is freedom — the ability to go anywhere and do anything. (Chaotic)",
      "Mastery. I'm a predator, and the other ships on the sea are my prey. (Evil)",
      "People. I'm committed to my mates more than to any ideals. (Any)",
      "Aspiration. Someday I'll own my own ship and chart my own destiny. (Any)"
    ],
    bonds: [
      "I'm loyal to my captain first, everything else second.",
      "The ship is most important — crewmates and captain come second.",
      "I'll always remember my first ship.",
      "In a harbor town, I have a paramour whose eyes nearly stole me from the sea.",
      "I was cheated out of my fair share of the profits, and I want to get my due.",
      "Ruthless pirates murdered my captain and crewmates, and I will take my revenge on them."
    ],
    flaws: [
      "I follow orders, even if I think they're wrong.",
      "I'll say anything to avoid having to do extra work.",
      "Once someone questions my courage, I never back down no matter how dangerous the situation.",
      "Once I start drinking, it's hard for me to stop.",
      "I'll pocket loose coins and other valuables I come across.",
      "My pride can be my downfall."
    ]
  },
  {
    name: "Soldier",
    skillProficiencies: ["Athletics", "Intimidation"],
    toolProficiencies: ["One type of gaming set", "vehicles (land)"],
    languages: 0,
    equipment: ["Insignia of rank", "trophy taken from a fallen enemy", "set of bone dice or deck of cards", "set of common clothes", "belt pouch containing 10 gp"],
    feature: {
      name: "Military Rank",
      description: "Soldiers loyal to your former military organization still recognize your influence and authority."
    },
    personalityTraits: [
      "I'm always polite and respectful.",
      "I'm a perfectionist who spends too much time on the details.",
      "I'm a natural leader who likes to be in charge.",
      "I'm confident in my abilities and never back down from a challenge.",
      "I'm always thinking of ways to improve my surroundings.",
      "I'm a firm believer in treating others with respect.",
      "I'm always on the lookout for my next big break.",
      "I'm a dreamer who loves to imagine what could be."
    ],
    ideals: [
      "Greater Good. Our lot is to lay down our lives in defense of others. (Good)",
      "Responsibility. I do what I must and obey just authority. (Lawful)",
      "Independence. When people obey orders blindly, they embrace a kind of slavery. (Chaotic)",
      "Might. In life as in war, the stronger force wins. (Evil)",
      "Live and Let Live. Ideals are not worth killing over or going to war for. (Neutral)",
      "Nation. My city, nation, or people are all that matter. (Any)"
    ],
    bonds: [
      "I would still lay down my life for the people I served with.",
      "Someone saved my life on the battlefield. To this day, I will never leave a friend behind.",
      "My honor is my life.",
      "I'll never forget the crushing defeat my company suffered or the enemies who dealt it.",
      "Those who fight beside me are those worth dying for.",
      "I fight for those who cannot fight for themselves."
    ],
    flaws: [
      "The monstrous enemy we faced in battle still leaves me quivering with fear.",
      "I have little respect for anyone who is not a proven warrior.",
      "I made a mistake that cost many lives — and I would do anything to keep that mistake from coming to light.",
      "My hatred of my enemies is blind and unreasoning.",
      "I obey the law, even if the law is corrupt.",
      "I'd rather eat my armor than admit when I'm wrong."
    ]
  },
  {
    name: "Urchin",
    skillProficiencies: ["Sleight of Hand", "Stealth"],
    toolProficiencies: ["Disguise kit", "thieves' tools"],
    languages: 0,
    equipment: ["Small knife", "map of the city you grew up in", "pet mouse", "token to remember your parents by", "set of common clothes", "belt pouch containing 10 gp"],
    feature: {
      name: "City Secrets",
      description: "You know the secret patterns and flow of cities, and can find passages through the urban sprawl that others would not suspect."
    },
    personalityTraits: [
      "I hide scraps of food and trinkets away in my pockets.",
      "I ask a lot of questions.",
      "I like to squeeze into small places where no one else can get to me.",
      "I sleep with my back to a wall or a tree, and everything I own wrapped in a bundle within arm's reach.",
      "I eat like a pig and have bad manners.",
      "I think anyone who's optimistic is naive.",
      "I'm always ready to bite back when someone threatens me.",
      "I'm a perfectionist who spends too much time on the details."
    ],
    ideals: [
      "Respect. All people, rich or poor, deserve respect. (Good)",
      "Community. We have to take care of each other because we have no one else. (Lawful)",
      "Change. The low are lifted up, and the high and mighty are brought down. Change is the nature of things. (Chaotic)",
      "Retribution. The rich need to be shown what life and death are really like in the gutters. (Evil)",
      "People. I help the people who help me — that's what keeps us alive. (Any)",
      "Aspiration. I'm going to prove that I'm worthy of a better life. (Any)"
    ],
    bonds: [
      "My town or city is my home, and I'll fight to defend it.",
      "I sponsor an orphanage to keep others from enduring what I had to endure.",
      "I owe my survival to another urchin who taught me how to live on the streets.",
      "I owe a debt I can never repay to the person who took pity on me.",
      "I escaped my life of poverty by robbing an important person, and I'm wanted for it.",
      "No one else should have to endure the hardships I've been through."
    ],
    flaws: [
      "If I'm outnumbered, I will run away from a fight.",
      "Gold seems like a lot of money to me, and I'll do just about anything for more of it.",
      "I will never fully trust anyone other than myself.",
      "I'd rather kill someone in their sleep than fight fair.",
      "It's not stealing if I need it more than someone else does.",
      "People who can't take care of themselves get what they deserve."
    ]
  },
];

export const alignmentOptions = [
  "Lawful Good",
  "Neutral Good",
  "Chaotic Good",
  "Lawful Neutral",
  "True Neutral",
  "Chaotic Neutral",
  "Lawful Evil",
  "Neutral Evil",
  "Chaotic Evil",
];

export function getBackgroundData(name: string): BackgroundData | undefined {
  return backgroundsData.find((b) => b.name === name);
}
