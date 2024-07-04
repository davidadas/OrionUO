// Runtime Configurations.
const Configs = {
	looting: {
		lootWhenHidden: false, // If true, looter will loot even while hidden.
		lootFromGround: false, // If true, looter will loot items from ground in addition to corpses. NOTE: May degrade performance.
		useMaxOpenAttempts: true, // Set true to ignore a corpse after a certain number of attempts have been made.
		maxOpenAttempts: 5, // Number of attempts to open corpse before it is ignored.
	},
	backpack: {
		useLootContainer: true, // Set true if you wish to store loot in a specific container.
		lootContainerSerial: 0x459A24FE // Provide the container for which to store loot.
	},
	// Existing Orion "Find List".
	orionFindLists: [
		'reagents' // example
	],
	// Prefab lists. Optoins are 'StygianAbyssArtifacts', 'ImbuingIngredients', and 'Jewels'.
	prefabLists: [
		'Jewels',
		'StygianAbyssArtifacts',
		'ImbuingIngredients',
	],
	// Custom list of user-configured loot preferences.
	customLootList: [
		[
			[
				{ property: 'energy damage', minimum: 100 },
				{ property: 'fire damage', minimum: 100 },
				{ property: 'poison damage', minimum: 100 },
				{ property: 'cold damage', minimum: 100 },
			],
			'major',
		],
		[{ property: 'magery', minimum: 15 }, { property: 'meditation', minimum: 15 }],
		[{ property: 'bushido', minimum: 15 }, { property: 'swordsmanship', minimum: 15 }],
		[{ property: 'animal taming', minimum: 15}, { property: 'animal lore', minimum: 15 }],
		[{ property: 'luck', minimum: 150 }],
		{ property: 'Splintering Weapon', minimum: 30, minimumProperties: 1, maximumProperties: 3 },
		[{ property: 'Splintering Weapon', minimum: 20 }, 'bokuto'],
		[['ring', 'bracelet'], 'major artifact'],
		['double axe', 'luck', 'repair'],
		'legendary',
		'treasure map',
		'paragon',
		'parrot',
	],
	propertyIgnoreList: [
		'cursed',
		'unwieldy'
	],
	corpseIgnoreList: [
		'headless',
		'mongbat',
		'horde minion'
	]
};

// Configuration for item properties to ignore.
// Provide name of properties to ignore as strings (note: casing does not matter).
Configs.propertyIgnoreList = [
	'cursed',
	'unwieldy'
];

// Configuration for corpses to ignore.
// Provide either a string or the graphic of the corpse to ignore (note: casing does not matter).
Configs.corpseIgnoreList = [
	'headless',
	'mongbat',
	'horde minion'
];

const attemptList = {};

// Function for looting all corpses.
// eslint-disable-next-line no-unused-vars
function autoLootCorpses() {
	Orion.UseIgnoreList('IgnoredCorpses');

	try {
		while(Player.Hits()) {
			lootGround();
			const corpses = getAllCorpses();
			corpses.forEach(lootCorpse);
			Orion.Wait(250);
		}
	} catch (error) {
		Logger.error(error);
	}
}

// Function for looting one specific container.
// eslint-disable-next-line no-unused-vars
function autoLootContainer() {
	Orion.UseIgnoreList('IgnoredCorpses');
	Logger.info('Select Container to Loot.');
	Orion.WaitForAddObject('target');
	const target = Orion.FindObject('target');
	openContainer(target);
	lootContainer(target);
}

function checkMaxAttempts(corpse) {
	if (Configs.hasPropertyMatch && hasMaxAttempts(corpse)) {
		// Max limit reached. Ignoring corpse.
		Orion.AddIgnoreListObject('IgnoredCorpses', corpse.Serial());
	} else {
		addOpenCorpseAttempt(corpse);
		Logger.warn('Could not open corpse.');
	}
}

function hasMaxAttempts(corpse) {
	return attemptList[corpse.Serial()] && attemptList[corpse.Serial()] > Configs.maxOpenAttempts;
}

function openContainer(container) {
	// If player is hidden and configured not to loot while hidden, skip.
	if (Player.Hidden() && Configs.looting.lootWhenHidden) return;

	const opened = Orion.OpenContainer(container.Serial(), '600', 'reach that|right to loot');

	// If corpse not opened, add attempt and move to next.
	if (!opened) {
		checkMaxAttempts(container);
	}

	// Wait some time for container objects to register.
	// Without this, Orion sometimes thinks the container is empty.
	Orion.Wait(250);

	return opened;
}

function addOpenCorpseAttempt(corpse) {
	// Add an attempt to loot the corpse to the attempt list.
	if (!attemptList[corpse.Serial()]) {
		attemptList[corpse.Serial()] === 1;
	} else {
		attemptList[corpse.Serial()] += 1;
	}
}

function isIgnoredCorpse(corpse) {
	const corpseIgnoreList = Configs.corpseIgnoreList;

	// Check if the corpse is ignored or not.
	for (var i = 0; i < corpseIgnoreList.length; i++) {
		if (typeof corpseIgnoreList[i] === 'number' && corpseIgnoreList[i] === parseInt(corpse.Graphic(), 10)) {
			return true;
		}
		if (typeof corpseIgnoreList[i] === 'string' && corpse.Properties().toLowerCase().indexOf(corpseIgnoreList[i].toLowerCase()) > -1) {
			return true;
		}
	}
	return false;
}

function getAllCorpses() {
	// Get only corpses that are within the loot range.
	const corpseSerials = Orion.FindType(0x2006, 0xFFFFF, 'any', 'ground', 2);
	const corpses = corpseSerials.map(function (serial) {
		return Orion.FindObject(serial);
	});

	return corpses;
}

function filterIgnoredItems(items) {
	const propertyIgnoreList = Configs.propertyIgnoreList;

	// Remove items that have properties in the ignore list.
	return items.filter(function(item) {
		for (var i = 0; i < propertyIgnoreList.length; i++) {
			if (item.Properties().toLowerCase().indexOf(propertyIgnoreList[i].toLowerCase()) > -1) {
				return false;
			}
		}

		return true;
	});
}

function getPrefabListProperties() {
	const userPrefabs = Configs.prefabLists;
	const prefabListNames = Object.keys(PrefabList);
	const results = [];

	for (var i = 0; i < prefabListNames.length; i++) {
		for (var j = 0; j < userPrefabs.length; j++) {
			if (prefabListNames[i].toLowerCase() === userPrefabs[j].toLowerCase()) {
				results.concat(PrefabList[prefabListNames[i]]);
			} else {
				Logger.warn('No such prefab list: ' + userPrefabs[j]);
			}
		}
	}

	return results;
}

// Verifies that the provided item contains the specified property.
function hasPropertyMatch(item, itemProperty) {
	if (typeof itemProperty === 'number') {
		// Check number types (these will largely be Graphic IDs).
		return parseInt(item.Graphic()) === itemProperty;
	} else if (typeof itemProperty === 'string') {
		// Check string types.
		// For this, we are just performing a flat, case insensitive check for the provided string.
		return item.Properties().toLowerCase().indexOf(itemProperty) > -1;
	} else if (typeof itemProperty === 'object' && !Array.isArray(itemProperty)) {
		// Check object types.
		// For this, we are checking that a given property exists and that it has a specific value (or greater).
		const regex = new RegExp(itemProperty.property + ':?\\s*(\\d+)', 'i');
		const properties = item.Properties().toLowerCase();
		const match = properties.match(regex);

		if (match) {
			const extractedValue = parseInt(match[1], 10);
			const propertyCount = getPropertyCount(item, ItemProperties);
			const hasMinimum = itemProperty.minimum ? extractedValue >= itemProperty.minimum : true;
			const hasMaximum = itemProperty.maximum ? extractedValue <= itemProperty.maximum : true;
			const minimumProperties = itemProperty.minimumProperties ? propertyCount >= itemProperty.minimumProperties : true;
			const maxProperties = itemProperty.maximumProperties ? propertyCount <= itemProperty.maximumProperties : true;
			return hasMinimum && hasMaximum && minProperties && maxProperties;
		}
	}

	return false;
}

// Verifies that an item matches at least property in the provided array.
function hasOneOfProperty(item, itemProperties) {
	for (var i = 0; i < itemProperties.length; i++) {
		const itemProperty = itemProperties[i];
		if (hasPropertyMatch(item, itemProperty)) {
			return true;
		}
	}

	return false;
}

// Verifies that an item matches all properties in the provided array.
function matchesAllProperties(item, itemProperties) {
	return itemProperties.every(function(itemProperty) {
		if (Array.isArray(itemProperty)) {
			return hasOneOfProperty(item, itemProperty);
		}
		return hasPropertyMatch(item, itemProperty);
	});
}

function getLootableItems(container) {
	const lootList = [].concat(Configs.customLootList, getPrefabListProperties());
	const containerSerial = container.Serial ? container.Serial() : container;

	const lootSerials = Orion.FindType('any', 'any', containerSerial, ' ', 'finddistance', ' ', true);
	const containerItems = lootSerials.map(function (serial) {
		return Orion.FindObject(serial);
	});

	const lootFromLists = getLootableItemsFromOrionLists(containerSerial);

	const lootList = containerItems.reduce(function (acc, item) {
		for (var i = 0; i < lootList.length; i++) {
			const lootListItem = customLootList[i];

			if (
				(Array.isArray(lootListItem) && matchesAllProperties(item, lootListItem)) ||
				(!Array.isArray(lootListItem) && hasPropertyMatch(item, lootListItem))
			) {
				acc.push(item);
				break;
			}
		}

		return acc;
	}, lootFromLists);

	// Filter out any item with ignored properties.
	return filterIgnoredItems(loot);
}

function lootGround() {
	if (Configs.looting.lootFromGround) {
		const loot = getLootableItems(ground);
		return lootItems(loot);
	}
	return true;
}

function lootCorpse(corpse) {
	if (isIgnoredCorpse(corpse) || openContainer(corpse) && lootContainer(corpse)) {
		Orion.AddIgnoreListObject('IgnoredCorpses', corpse.Serial());
		Orion.ClearJournal();
	}
}

function lootContainer(container) {
	const loot = getLootableItems(container);

	if (!loot.length) {
		Logger.info('Nothing to loot.');
		return true;
	}

	const allLooted = lootItems(loot);

	if (!loot.length) {
		Logger.info('All looted.');
		return true;
	}

	return allLooted;
}

function lootItems(items) {
	return items.reduce(function(acc, item) {
		if (!canCarry(item) || !lootItem(item)) {
			acc = false;
		}

		return acc;
	}, true);
}

function lootItem(item) {
	const originalContainerSerial = item.Container();
	const backpackConfigs = Configs.backpack;
	const storageContainerSerial = backpackConfigs.useLootContainer && backpackConfigs.lootContainerSerial ? backpackConfigs.lootContainerSerial : Orion.FindObject(backpack).Serial();

	Orion.Wait(750);
	Orion.MoveItem(item.Serial(), -1, storageContainerSerial);
	Orion.Wait(750);

	// Return true if the item was removed from the inventory; false otherwise.
	return originalContainerSerial !== item.Container();
}

function canCarry(item) {
	const itemWeight = parseWeight(item);
	return itemWeight + Player.Weight() <= Player.MaxWeight();
}

function parseWeight(item) {
	// Define the regex pattern to match "Weight: <number> stones", case-insensitive
	const regex = /weight:\s*(\d+)\s*stones/i;

	// Use the regex to find the match in the input string
	const match = item.Properties().match(regex);

	// If a match is found, return the integer weight
	if (match) {
		return parseInt(match[1], 10);
	}

	// If no match is found, return null or any default value
	return 0;
}

function getPropertyCount(item, propertiesList) {
	// Split the item string into lines
	const lines = item.Properties().split('\n');
	// Initialize a counter for valid properties
	const count = 0;

	// Iterate over each line
	for (var i = 0; i < lines.length; i++) {
		// Trim any extra whitespace from the line
		const line = lines[i].trim();

		// Check if the line is in the properties list
		for (var j = 0; j < propertiesList.length; j++) {
			const property = propertiesList[j];
			if (line.indexOf(property) === 0) {
				count++;
				break;
			}
		}
	}

	return count;
}

const Logger = {
	error: function (text) {
		Orion.Print(0x0021, JSON.stringify(text));
	},
	info: function (text) {
		Orion.Print(0x03E9, JSON.stringify(text));
	},
	warn: function (text) {
		Orion.Print(0x035, JSON.stringify(text));
	},
	debug: function (text) {
		TextWindow.Print(JSON.stringify(text));
		if (!TextWindow.IsOpened()) {
			TextWindow.Open();
		}
	}
};

const PrefabList = {
	jewels: [
		0x0F13, // Ruby.
		0x0F15, // Citrines.
		0x0F18, // Tourmaline.
		0x0F26, // Diamond.
		0x0F10, // Emerald.
		0x0F16, // Amethist.
		0x0F11, // Sapphire.
		0x0F25, // Amber.
	],
	imbuingIngredients: [
		0x572C, // Goblin Blood.
		0x5722, // Vial of Vitriol.
		0x0E24, // Silver Serpent Venom.
		0x4077, // Dragon's Blood.
		0x5747, // Raptor's Teeth.
		0x5720, // Spider Carapace.
		0x5748, // Bottle of Ichor.
		0x5746, // Slith Tongue.
		0x572D, // Lava Serpent Crust.
		0x5744, // Silver Serpent Skin.
		0x5731, // Undying Flesh.
		0x5728, // Void Core.
		0x5721, // Daemon Claw.
		0x5726, // Fey Wings.
		0x5749, // Reflective Wolf Eye.
		0x571C, // Essence of [X].
		0x573B, // Crushed Glass.
		0x573A, // Delicate Scales.
		0x5738, // Crystal Shards.
		0x3190, // Parasitic Plant.
		0x5737, // Elven Fletching.
		0x573D, // Powdered Iron.
		0x5736, // Seed of Renewal.
		0x3191, // Luminescent Fungi.
		0x573E, // Void Orb.
		0x4007, // Void Essence.
		0x573C, // Arcanic Rune Stone.
		0x5732, // Crystalline Black Rock.
		0x0F3F, // Arrows.
		0x5738, // Crystal Shards.
		0x3197, // Fire Ruby.
		0x3193, // Turquoise.
		0x3196, // White Pearl.
		0x3199, // Brilliant Amber.
		0x3195, // Ecru Citrine.
		0x3194, // Perfect Emerald.
		0x3198, // Blue Diamond.
		0x3192, // Dark Sapphire.
		0x3196, // White Pearl.
	],
	stygianAbyssArtifacts: [
		"Abyssal Blade",
		"Animated Legs of the Insane Tinker",
		"Axe of Abandon",
		"Axes of Fury",
		"Banshee's Call",
		"Basilisk Hide Breastplate",
		"Blade of Battle",
		"Boura Tail Shield",
		"Breastplate of the Berserker",
		"Burning Amber",
		"Cast-Off Zombie Skin",
		"Cavalry's Folly",
		"Channeler's Defender",
		"Claws of the Berserker",
		"Death's Head",
		"Defender of the Magus",
		"Demon Bridle Ring",
		"Demon Hunter's Standard",
		"Dragon Hide Shield",
		"Dragon Jade Earrings",
		"Draconi's Wrath",
		"Eternal Guardian Staff",
		"Fallen Mystic's Spellbook",
		"Giant Steps",
		"Ironwood Composite Bow",
		"Jade War Axe",
		"Legacy of Despair",
		"Lavaliere",
		"Life Syphon",
		"Mangler",
		"Mantle of the Fallen",
		"Mystic's Garb",
		"Night Eyes",
		"Obsidian Earrings",
		"Petrified Snake",
		"Pillar of Strength",
		"Protector of the Battle Mage",
		"Raptor Claw",
		"Resonant Staff of Enlightenment",
		"Shroud of the Condemned",
		"Sign of Order",
		"Sign of Chaos",
		"Slither",
		"Spined Bloodworm Bracers",
		"Staff of Shattered Dreams",
		"Stone Dragon's Tooth",
		"Stone Slith Claw",
		"Storm Caller",
		"Sword of Shattered Hopes",
		"Summoner's Kilt",
		"Tangle",
		"The Impaler's Pick",
		"Torc of the Guardians",
		"Token of Holy Favor",
		"Vampiric Essence",
		"Venom",
		"Void Infused Kilt",
		"Wall of Hungry Mouths"
	]
};

const itemProperties = [
	"Dexterity Bonus",
	"Hit Point Increase",
	"Intelligence Bonus",
	"Mana Increase",
	"Stamina Increase",
	"Strength Bonus",
	"Hit Point Regeneration",
	"Mana Regeneration",
	"Stamina Regeneration",
	"Assassin Honed",
	"Blood Drinker",
	"Battle Lust",
	"Hit Cold Area",
	"Hit Curse",
	"Hit Dispel",
	"Hit Energy Area",
	"Hit Fatigue",
	"Hit Fire Area",
	"Hit Fireball",
	"Hit Harm",
	"Hit Life Leech",
	"Hit Lightning",
	"Hit Lower Attack",
	"Hit Lower Defense",
	"Hit Mana Drain",
	"Hit Mana Leech",
	"Hit Physical Area",
	"Hit Poison Area",
	"Searing Weapon",
	"Splintering Weapon",
	"Hit Stamina Leech",
	"Casting Focus",
	"Faster Casting",
	"Faster Cast Recovery",
	"Lower Mana Cost",
	"Lower Reagent Cost",
	"Mage Armor",
	"Mage Weapon",
	"Resonance",
	"Spell Channeling",
	"Spell Damage Increase",
	"Spell Focusing",
	"Spell Consumption",
	"Damage Increase",
	"Swing Speed Increase",
	"Use Best Weapon Skill",
	"Hit Chance Increase",
	"Balanced",
	"Damage Modifier",
	"Lower Ammo Cost",
	"Velocity",
	"Damage Eater",
	"Rage Focus",
	"Reactive Paralyze",
	"Reflect Physical Damage",
	"Soul Charge",
	"Defense Chance Increase",
	"Enhance Potions",
	"Lower Requirements",
	"Luck",
	"Mana Burst",
	"Mana Phase",
	"Night Sight",
	"Self Repair",
	"Skill Bonus",
];