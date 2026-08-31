const https = require('https');
const fs = require('fs');
const path = require('path');

const API_URL = 'https://api.open5e.com/v1/classes/?format=json&limit=50';
const DATA_FILE = path.join(__dirname, '..', 'src', 'data', '2014_classes.json');

function fetchJSON(url) {
	return new Promise((resolve, reject) => {
		https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
			let data = '';
			res.on('data', chunk => data += chunk);
			res.on('end', () => {
				try {
					resolve(JSON.parse(data));
				} catch (e) {
					reject(new Error(`Failed to parse JSON: ${e.message}`));
				}
			});
		}).on('error', reject);
	});
}

function cleanDescription(desc) {
	return desc
		.replace(/^###\s+.*$/gm, '')
		.replace(/^##\s+.*$/gm, '')
		.replace(/^#\s+.*$/gm, '')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

async function main() {
	console.log('Fetching class descriptions from Open5E API...');

	let apiData;
	try {
		apiData = await fetchJSON(API_URL);
	} catch (err) {
		console.error('Failed to fetch from API:', err.message);
		process.exit(1);
	}

	const apiClasses = apiData.results || [];
	console.log(`Found ${apiClasses.length} classes in API`);

	const descriptionsBySlug = {};
	for (const cls of apiClasses) {
		if (cls.desc && cls.desc.trim()) {
			descriptionsBySlug[cls.slug] = cls.desc.trim();
		}
	}

	const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
	const data = JSON.parse(rawData);

	const expectedClasses = [
		'Barbarian', 'Bard', 'Cleric', 'Druid', 'Fighter', 'Monk',
		'Paladin', 'Ranger', 'Rogue', 'Sorcerer', 'Warlock', 'Wizard'
	];

	const slugToName = {
		'barbarian': 'Barbarian',
		'bard': 'Bard',
		'cleric': 'Cleric',
		'druid': 'Druid',
		'fighter': 'Fighter',
		'monk': 'Monk',
		'paladin': 'Paladin',
		'ranger': 'Ranger',
		'rogue': 'Rogue',
		'sorcerer': 'Sorcerer',
		'warlock': 'Warlock',
		'wizard': 'Wizard'
	};

	let updated = 0;
	let skipped = 0;
	const updateLog = [];

	for (const cls of data.classes) {
		const name = cls.name;
		const slug = name.toLowerCase();

		if (descriptionsBySlug[slug]) {
			const rawDesc = descriptionsBySlug[slug];
			const cleanedDesc = cleanDescription(rawDesc);

			const hadDescription = cls.description !== undefined;
			cls.description = cleanedDesc;

			updateLog.push({
				name,
				action: hadDescription ? 'updated' : 'added',
				length: cleanedDesc.length,
				preview: cleanedDesc.substring(0, 120) + '...'
			});
			updated++;
		} else {
			updateLog.push({ name, action: 'skipped', reason: 'No description found in API' });
			skipped++;
		}
	}

	fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + '\n', 'utf-8');

	console.log('\n=== Update Statistics ===');
	console.log(`Total classes in file: ${data.classes.length}`);
	console.log(`Classes updated: ${updated}`);
	console.log(`Classes skipped: ${skipped}`);

	console.log('\n=== Update Details ===');
	for (const entry of updateLog) {
		if (entry.action === 'skipped') {
			console.log(`  ${entry.name}: SKIPPED (${entry.reason})`);
		} else {
			console.log(`  ${entry.name}: ${entry.action.toUpperCase()} (${entry.length} chars)`);
			console.log(`    Preview: ${entry.preview}`);
		}
	}

	console.log('\nDone!');
}

main().catch(err => {
	console.error('Error:', err);
	process.exit(1);
});
