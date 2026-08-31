const https = require('https');
const fs = require('fs');

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { 
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        }
        catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  // Known SCAG spells (Sword Coast Adventurer's Guide)
  const SCAG_SPELLS = [
    'Booming Blade', 'Green-Flame Blade', 'Lightning Lure', 'Sword Burst',
    'Blade Ward', 'Chill Touch', 'Fire Bolt', 'Friends', 'Guidance',
    'Mage Hand', 'Mending', 'Message', 'Minor Illusion', 'Poison Spray',
    'Prestidigitation', 'Ray of Frost', 'Resistance', 'Shocking Grasp',
    'Spare the Dying', 'True Strike', 'Vicious Mockery',
    'Animal Friendship', 'Bane', 'Bless', 'Burning Hands', 'Charm Person',
    'Color Spray', 'Command', 'Comprehend Languages', 'Create or Destroy Water',
    'Cure Wounds', 'Detect Evil and Good', 'Detect Magic', 'Detect Poison and Disease',
    'Disguise Self', 'Entangle', 'Faerie Fire', 'False Life', 'Feather Fall',
    'Find Familiar', 'Fog Cloud', 'Goodberry', 'Grease', 'Guiding Bolt',
    'Healing Word', 'Heroism', 'Identify', 'Illusory Script', 'Inflict Wounds',
    'Jump', 'Longstrider', 'Mage Armor', 'Magic Missile', 'Protection from Evil and Good',
    'Purify Food and Drink', 'Ray of Enfeeblement', 'Sanctuary', 'Shield',
    'Shield of Faith', 'Silent Image', 'Sleep', 'Speak with Animals', 'Tasha\'s Hideous Laughter',
    'Tenser\'s Floating Disk', 'Thunderwave', 'Unseen Servant', 'Warding Bond',
    'Aid', 'Alter Self', 'Animal Messenger', 'Arcane Lock', 'Arcanist\'s Magic Aura',
    'Augury', 'Barkskin', 'Beacon of Hope', 'Blindness/Deafness', 'Blur',
    'Calm Emotions', 'Cloud of Daggers', 'Continual Flame', 'Cordon of Arrows',
    'Darkness', 'Darkvision', 'Detect Thoughts', 'Enhance Ability', 'Enlarge/Reduce',
    'Enthrall', 'Find Steed', 'Find Traps', 'Flaming Sphere', 'Gentle Repose',
    'Gust of Wind', 'Heat Metal', 'Hold Person', 'Invisibility', 'Knock',
    'Levitate', 'Locate Animals or Plants', 'Locate Object', 'Magic Mouth',
    'Magic Weapon', 'Melf\'s Acid Arrow', 'Mirror Image', 'Misty Step',
    'Moonbeam', 'Nystul\'s Magic Aura', 'Pass without Trace', 'Phantasmal Force',
    'Prayer of Healing', 'Protection from Energy', 'Ray of Enfeeblement',
    'Rope Trick', 'Scorching Ray', 'See Invisibility', 'Shatter', 'Silence',
    'Spider Climb', 'Spike Growth', 'Spirit Guardians', 'Spiritual Weapon',
    'Suggestion', 'Web', 'Wind Wall', 'Zone of Truth'
  ];
  
  // SCAG feats
  const SCAG_FEATS = [
    'Blade Master', 'Bountiful Luck', 'Diplomat', 'Divinely Favored',
    'Drow High Magic', 'Dwarven Fortitude', 'Elven Accuracy', 'Everybody\'s Friend',
    'Fade Away', 'Favored by the Gods', 'Flames of Phlegethos',
    'Gift of the Chromatic Dragon', 'Gift of the Dragon Champion',
    'Gift of the Metallic Dragon', 'Infernal Constitution',
    'Orcish Fury', 'Second Chance', 'Squat Nimbleness', 'Svirfneblin Magic',
    'Wood Elf Magic'
  ];
  
  // Check which SCAG spells already exist in our data
  const spellsData = JSON.parse(fs.readFileSync('src/data/2014_spells.json', 'utf8'));
  const featsData = JSON.parse(fs.readFileSync('src/data/2014_feats.json', 'utf8'));
  
  const existingSpellNames = new Set(spellsData.spells.map(s => s.name?.toLowerCase()));
  const existingFeatNames = new Set(featsData.feats.map(f => f.name?.toLowerCase()));
  
  const missingSpells = SCAG_SPELLS.filter(name => !existingSpellNames.has(name.toLowerCase()));
  const missingFeats = SCAG_FEATS.filter(name => !existingFeatNames.has(name.toLowerCase()));
  
  console.log('SCAG spells already in database:', SCAG_SPELLS.length - missingSpells.length);
  console.log('SCAG spells missing:', missingSpells.length);
  missingSpells.forEach(s => console.log('  ' + s));
  
  console.log('\nSCAG feats already in database:', SCAG_FEATS.length - missingFeats.length);
  console.log('SCAG feats missing:', missingFeats.length);
  missingFeats.forEach(f => console.log('  ' + f));
}

main().catch(console.error);
