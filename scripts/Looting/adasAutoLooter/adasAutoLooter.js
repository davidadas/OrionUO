// Runtime Configs.
// Use these to manage the behavior of the script.
const Configs = {
	lootWhenHidden: false, // If true, looter will loot even while hidden.

	// Max Attempts Configuraiton.
	useMaxOpenAttempts: false, // Set true to ignore a corpse after a certain number of attempts have been made.
	maxOpenAttempts: 5, // Number of attempts to open coprse before it is ignored.

	// Loot Container Configuration.
	useLootContainer: false, // Set true if you wish to store loot in a specific container.
	lootContainerSerial: null // Provide the container for which to store loot.
};

// Master Loot Configs.
// Set the items you wish to loot. Options are:
//    1. Graphic ID (integer or hex integer).
//    2. String (used to match with a property name).
//    3. Object (e.g. { property: 'Luck', value: 150 }).
//    4. Array of objects (e.g. [{ property: 'Luck', value: 150 }).
// NOTE: String matches are not case sensitive.
Configs.masterLootList = [
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
	// 0x0F13, // Ruby.
	// 0x0F15, // Citrines.
	// 0x0F18, // Tourmaline.
	// 0x0F26, // Diamond.
	// 0x0F10, // Emerald.
	// 0x0F16, // Amethist.
	// 0x0F11, // Sapphire.
	// 0x0F25, // Amber.
	{ property: 'luck', value: 150 },
	[{ property: 'magery', value: 15}, { property: 'meditation', value: 15 }],
	'legendary',
	'map',
];

// Configuration for lists set in the Orion client.
// Just provide the name of the list as a string.
Configs.orionFindLists = [
	'reagents'
];

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

// eslint-disable-next-line no-unused-vars
function autoLoot() {
	Orion.UseIgnoreList('IgnoredCorpses');

	try {
		while(Player.Hits()) {
			const corpses = getAllCorpses();

			corpses.forEach(function (corpse) {
				if (isIgnoredCorpse(corpse) || lootCorpse(corpse)) {
					Orion.AddIgnoreListObject('IgnoredCorpses', corpse.Serial());
					Orion.ClearJournal();
					Logger.info('All Looted!');
				}
			});
			Orion.Wait(1000);
		}
	} catch (error) {
		Logger.error(error);
	}
}

function checkMaxAttempts(corpse) {
	if (hasMaxAttempts(corpse)) {
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

function addOpenCorpseAttempt(corpse) {
	// Add an attempt to loot the corpse to the attempt list.
	if (!attemptList[corpse.Serial()]) {
		attemptList[corpse.Serial()] === 1;
	} else {
		attemptList[corpse.Serial()] += 1;
	}
}

function isIgnoredCorpse(corpse) {
	// Ensure Configs and corpseIgnoreList are defined
	if (typeof Configs === 'undefined' || !Array.isArray(Configs.corpseIgnoreList)) {
		throw new Error('Configs.corpseIgnoreList is not defined or is not an array');
	}

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
	const corpseSerials = Orion.FindType('any', 0xFFFFF, 'any', 'ground', 2);
	const corpses = corpseSerials
		.map(function (serial) {
			return Orion.FindObject(serial);
		})
		.filter(function (object) {
			// Filter out any item that does not have the word 'corpse' within it.
			return object && object.Properties().toLowerCase().indexOf('corpse') > -1;
		});

	return corpses;
}

function filterIgnoredItems(items) {
	const propertyIgnoreList = Configs.propertyIgnoreList;

	// Remove items that have properties in the ignore list.
	return items.filter(function(item) {
		for (var i = 0; i < propertyIgnoreList; i++) {
			if (item.Properties().toLowerCase().indexOf(propertyIgnoreList[i].toLowerCase()) > -1) {
				return false;
			}
		}

		return true;
	});
}

function getLootableItemsFromLists(corpse) {
	// Collect all the loot specified in an Orion Find List.
	return Configs.orionFindLists.reduce(function (acc, listName) {
		const lootSerials = Orion.FindList(listName, any, corpse.Serial(), ' ', 'finddistance', ' ', true);

		for (var i = 0; i < lootSerials; i++) {
			acc.push(lootSerials[i]);
		}

		return acc;
	}, []);
}

function hasPropertyMatch(item, itemProperty) {
	const regex = new RegExp(itemProperty.property + ':?\\s*(\\d+)', 'i');
	const properties = item.Properties().toLowerCase();
	const match = properties.match(regex);

	if (match) {
		const extractedValue = parseInt(match[1], 10);
		return extractedValue >= itemProperty.value;
	}

	return false;
}

function matchesAllProperties(item, itemProperties) {
	return itemProperties.every(function(itemProperty) {
		return hasPropertyMatch(item, itemProperty);
	});
}

function getLootableItems(corpse) {
	const masterLootList = Configs.masterLootList;

	const lootSerials = Orion.FindType('any', 'any', corpse.Serial(), ' ', 'finddistance', ' ', true);
	const corpseItems = lootSerials.map(function (serial) {
		return Orion.FindObject(serial);
	});

	const lootFromLists = getLootableItemsFromLists(corpse);

	const loot = corpseItems.reduce(function (acc, val) {
		for (var i = 0; i < masterLootList.length; i++) {
			const lootListItem = masterLootList[i];
			if (
				(typeof lootListItem === 'number' && lootListItem === parseInt(val.Graphic())) ||
                (typeof lootListItem === 'string' && val.Properties().toLowerCase().indexOf(lootListItem) > -1) ||
                (typeof lootListItem === 'object' && !Array.isArray(lootListItem) && hasPropertyMatch(val, lootListItem)) ||
                (Array.isArray(lootListItem) && matchesAllProperties(val, lootListItem))
			) {
				acc.push(val);
				break;
			}
		}

		return acc;
	}, lootFromLists);

	// Filter out any item with ignored properties.
	return filterIgnoredItems(loot);
}

function lootCorpse(corpse) {
	// If player is hidden and configured not to loot while hidden, skip.
	if (Player.Hidden() && Configs.lootWhenHidden) return;

	const opened = Orion.OpenContainer(corpse.Serial(), '600', 'reach that|right to loot');

	// If corpse not opened, add attempt and move to next.
	if (!opened) {
		checkMaxAttempts(corpse);
		return;
	}

	// Wait some time for container objects to register.
	// Without this, Orion sometimes thinks the container is empty.
	Orion.Wait(250);

	const loot = getLootableItems(corpse);
	const allLooted = loot.every(lootItem);

	return allLooted;
}

function lootItem(item) {
	const originalContainerSerial = item.Container();
	const storageContainerSerial = Configs.useLootContainer && Configs.lootContainerSerial ? Configs.lootContainerSerial : Orion.FindObject(backpack).Serial();

	Orion.Wait(750);
	Orion.MoveItem(item.Serial(), storageContainerSerial);
	Orion.Wait(750);

	// Return true if the item was removed from the inventory; false otherwise.
	return originalContainerSerial !== item.Container();
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
