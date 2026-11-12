# Credits

Item icons and many UI icons come from [Game Icons](https://game-icons.net) by Lorc, Delapouite and contributors, licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). They are bundled through `react-icons/gi`. The item-to-icon list lives in `src/components/item-icon-map.ts` and each item's `icon` field in `src/data/en/2014_item_catalog.json`.

Rules content includes material from the [System Reference Document 5.1](https://dnd.wizards.com/resources/systems-reference-document) by Wizards of the Coast LLC, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode). The home screen shows both credits.

The 2024 rules data (`src/data/en/2024_*.json`) includes material from the [System Reference Document 5.2](https://www.dndbeyond.com/srd) ("SRD 5.2") by Wizards of the Coast LLC, licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/legalcode). It was built by `scripts/import-srd52.py` from the JSON files of [5e-bits/5e-database](https://github.com/5e-bits/5e-database) (MIT), then checked and corrected by hand. The home screen shows this credit too. Indonesian text for the 2024 data lives in `src/data/id/2024_text.json` (English text to Indonesian, own translation), and `src/tests/locale-2024.test.ts` fails if any 2024 text lacks it.

The interface font is [Inter](https://rsms.me/inter/) by Rasmus Andersson, licensed under the [SIL Open Font License 1.1](https://openfontlicense.org). The Latin subset ships in `src/app/fonts/inter-latin.woff2` so builds do not download it.
