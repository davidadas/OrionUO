//-----------------------------------------------------------
// Script Name: Adas Runebook Lumber Miner
// Author: DavidAdas
// Version: 0.1.0
// Shard OSI / FS: OSI
// Revision Date: 6/21/24
// Purpose: Runebook harvest lumber and ore.
//-------------------------------------------------------------
//
// Instructions: Read the config carefully below and set the values accordingly.
//
const Config = {
	type: 'mining', // Options: mining, lumberjacking.
	runebookConfigs: {
		travelSpell: 'Recall', // Options: Recall, Gate (not implemented), Sacred Journey
		home: { serial: '<SET ME>', rune: 1 },
		lumberjacking: [{ serial: '<SET ME>', runes: 16 }],
		mining: [{ serial: '<SET ME>', runes: 16 }]
	},
	packAnimalConfigs: {
		waitForPackAnimal: true,
		mountWhenTraveling: true,
		mountSerial: '<SET ME>', // If set, this pet will be mounted when traveling (if traveling is set).
		packAnimalSerial: '<SET ME>', // If set, resources will automatically be put in pack animal.
		fireBeetleSerial: '<SET ME>' // If set, ore will automatically be refined to ingots.
	},
	craftingConfigs: {
		craftShovels: true, // Set true to automatically craft shovels and axes.
		maxShovels: 15, // Maximum number of shovels to craft at a time.
		shovelReturnCount: 4 // The point at which player should return to get more shovels.
	},
	homeConfigs: {
		secureContainerSerial: '<SET ME>',
		castCureIfDamaged: false // Note: Not implemented.
	},
	escapeConfigs: {
		escapeWhenDamaged: true,
		escapeWhenPackAnimalDamaged: true,
		escapeWhenPackAnimalLeaves: true,
		escapeWhenRedSeen: true
	},
	// Adding a graphic here will drop that item when inventory is full.
	// The format below is [graphicId, colorId], where "colorId" may be 'any'.
	droppedResources: [
		//[0x1BDD, 0x0000], // Logs.
		//[0x1BD7, 0x0000], // Boards.
		//[0x19B9, 0x0000], // Normal Ore.
		//[0x19B7, 0x0000], // Normal Ore.
		//[0x19B8, 0x0000], // Normal Ore.
		//[0x19B9, 0x0000], // Normal Ore.
	]
};

// Initialize global variables.
const runebookManager = new RunebookManager(Config.runebookConfigs, Config.type);

// eslint-disable-next-line no-unused-vars
function autoMine() {
	try {
		while (Player.Hits()) {
			// Refresh any lingering Orion hooks waiting for an event.
			clearStates();
			// Travel to next location.
			travelNextLocation();
			harvestResources();

			Orion.Wait(500);
		}
	} catch (error) {
		mount();
		clearStates();
		Logger.error(error);
	}
}

function clearStates() {
	Orion.CancelWaitGump();
	Orion.CancelWaitTarget();
	Orion.CancelTarget();
	Orion.ClearJournal();
}

function getSecureContainer() {
	const containerId = Config.homeConfigs.secureContainerSerial;
	return Orion.FindObject(containerId);
}

function getPackAnimal() {
	const packAnimalConfigs = Config.packAnimalConfigs;
	return Orion.FindObject(packAnimalConfigs.packAnimalSerial, any, ground);
}

function getMount() {
	const packAnimalConfigs = Config.packAnimalConfigs;
	return Orion.FindObject(packAnimalConfigs.mountSerial, any, ground);
}

function getFireBeetle() {
	const packAnimalConfigs = Config.packAnimalConfigs;
	return Orion.FindObject(packAnimalConfigs.fireBeetleSerial, any, ground);
}

function mount() {
	const mountWhenTraveling = Config.packAnimalConfigs.mountWhenTraveling;
	const mount = getMount();
	if (mountWhenTraveling && mount && !Orion.ObjAtLayer('mount')) {
		Orion.UseObject(mount.Serial());
		Orion.Wait(500);
	}
}

function dismount() {
	if (!!Orion.ObjAtLayer('mount')) {
		Orion.UseObject(Player.Serial());
		Orion.Wait(500);
	}
}

function travelNextLocation() {
	var hasTraveled = false;
	while (!hasTraveled) {
		mount();
		runebookManager.travelNext();
		if (Orion.InJournal('fizzles')) {
			Orion.ClearJournal();
			Orion.Wait(500);
			continue;
		}
		hasTraveled = true;
	}
	Orion.Wait(1000);
}

function harvestResources() {
	const type = Config.type;

	// Attempt to walk to closest tile.
	if (closestTile) {
		Orion.WalkTo(
			closestTile.X(),
			closestTile.Y(),
			closestTile.Z()
		);
	}

	while (
		!Orion.InJournal('no metal here') &&
		!Orion.InJournal('too far away') &&
		!Orion.InJournal('see that location') &&
		!Orion.InJournal('can\'t use an axe') &&
		!Orion.InJournal('not enough wood') &&
		!Orion.InJournal('can\'t mine')
	) {
		// Dismount the pet before mining.
		dismount();
		// Escape if conditions are present.
		checkEscape();
		// Store resources in pack animal if nearing weight limit.
		checkWeight();
		// Replace any missing shovels or check for axe.
		checkTools(type);

		const closestTile = findClosestResourceNode(type);
		if (!closestTile) {
			Orion.Wait(1000);
			break;
		}

		// Get the next tool.
		const toolSerial = findToolSerial(type);
		// Harvest the nearest resource.
		Orion.UseObject(toolSerial);

		// Click the closest resource node.
		targetTile(type, closestTile);
		Orion.Wait(1000);
	}
}

function isPlayerOverweight() {
	const playerWeight = Player.Weight();
	const playerIsOverweight = playerWeight > Player.MaxWeight() * 0.80;

	return playerIsOverweight;
}

function checkWeight() {
	if (isPlayerOverweight()) {
		// Drop any resource that was set in the config.
		dropResources();
		// Attempt to smelt ore.
		// Then, attempt to store in pack animal.
		refineResources();
		storeInPackAnimal();

		if (isPlayerOverweight()) {
			// Travel back to house, then store items.
			escape();
			dismount();
			// Player is still overweight, deposit materials at home.
			storeInSecure();
			// Return to the last location.
			returnToLast();
		}
	}
}

function storeInPackAnimal() {
	const packAnimal = getPackAnimal();
	const storedResources = getStoredResources(backpack);

	if (packAnimal) {
		storedResources.forEach(function (serial) {
			Orion.MoveItem(serial, 0, packAnimal.Serial());
			Orion.Wait(1000);
		});
	}
}

function getPackAnimalBackpack() {
	const packAnimal = getPackAnimal();

	if (packAnimal) {
		// Go through items listed in the pack animal.
		const packAnimalInventory = Orion.FindType(any, any, packAnimal.Serial());
		// Find the item named 'backpack' and return it.
		for (var i = 0; i < packAnimalInventory.length; i++) {
			const item = Orion.FindObject(packAnimalInventory[i]);
			if (item.Name().toLowerCase() === 'backpack') {
				return item;
			}
		}
	}
	return null;
}

function dropResources() {
	const droppedResources = Config.droppedResources;
	const sortedLandTiles = getTilesWithinRadius('land', 2);
	// As these are sorted, the first tile will be the one below player.
	// Dropped here will just return item to inventory, so we want the next nearest.
	const dropTile = sortedLandTiles[1];

	if (!droppedResources.length || !dropTile) return;

	Orion.Wait(1000);

	droppedResources.forEach(function (resource) {
		const resourceGraphic = resource[0];
		const resourceColor = resource[1];
		const resourceSerials = Orion.FindType(resourceGraphic, resourceColor);
		const groundResourceSerials = Orion.FindType(resourceGraphic, resourceColor, ground, 2);

		resourceSerials.forEach(function (resourceSerial) {
			// If there's a similar item nearby, add to stack.
			if (groundResourceSerials[0]) {
				Orion.MoveItem(resourceSerial, -1, groundResourceSerials[0]);
			} else {
				Orion.MoveItem(resourceSerial, -1, 'ground', dropTile.X(), dropTile.Y(), dropTile.Z());
			}
			Orion.Wait(1000);
		});
	});
}

function refineResources() {
	smeltOre();
	splitLogs();
}

function splitLogs() {
	const logs = Orion.FindType(0x1BDD);
	if (!logs || !logs.length) return;

	const axeGraphics = toolTypes.lumberjacking.join('|');
	const axes = Orion.FindType(axeGraphics);
	const mainHandObject = Orion.ObjAtLayer('LeftHand');
	const axeSerial = axes.length ? axes[0] : mainHandObject.Serial();

	Orion.Wait(1000);

	logs.forEach(function (log) {
		Orion.UseObject(axeSerial);
		Orion.WaitForTarget(2000);
		Orion.Wait(250);
		Orion.TargetObject(log);
		Orion.Wait(1000);
	});
}

function smeltOre() {
	const fireBeetle = getFireBeetle();

	if (!fireBeetle) return;

	var storedOre = getStoredResourcesByType('ore', backpack);

	Orion.Wait(1000);

	while(storedOre.length) {

		storedOre.forEach(function (ore) {
			Orion.UseObject(ore);
			Orion.WaitForTarget(2000);
			Orion.Wait(250);
			Orion.TargetObject(fireBeetle.Serial());
			Orion.Wait(1000);
		});
		storedOre = getStoredResourcesByType('ore', backpack);
	}
}

function storeInSecure() {
	const secureContainer = getSecureContainer();
	const animalBackpack = getPackAnimalBackpack();
	const playerBackpack = Orion.FindObject(backpack);

	[animalBackpack, playerBackpack].forEach(function (container) {
		if (!container) return;
		Orion.Wait(1000);
		Orion.OpenContainer(container.Serial());
		Orion.Wait(1000);
		const storedResources = getStoredResources(container.Serial());
		for (var i = 0; i < storedResources.length; i++) {
			Orion.MoveItem(storedResources[i], 0, secureContainer.Serial());
			Orion.Wait(1500);
		}
	});
}

function getStoredResources(serial) {
	const flattenedResources = Object
		.keys(resourceTypes)
		.reduce(function (acc, key) {
			resourceTypes[key].forEach(function (type) {
				acc.push(type);
			});
			return acc;
		}, []);

	const resourceTypesStr = flattenedResources.join('|');
	return Orion.FindType(resourceTypesStr, any, serial, ' ', 'finddistance', ' ', true);
}

function getStoredResourcesByType(type, serial) {
	const resources = resourceTypes[type];
	const resourceTypesStr = resources.join('|');
	return Orion.FindType(resourceTypesStr, any, serial, ' ', 'finddistance', ' ', true);
}

function returnToLast() {
	// Return to the previous location.
	if (runebookManager.hasLast()) {
		runebookManager.travelLast();
		// If no previous location, travel next.
	} else {
		travelNextLocation();
	}
}

function checkEscape() {
	if (shouldEscape()) {
		escape();
		Orion.PauseScript();
	}
}

function shouldEscape() {
	const configs = Config;
	const packAnimal = getPackAnimal();

	if (packAnimal) {
		// Check if pack animal's health is below maximum or if it has wandered off
		if (configs.escapeWhenPackAnimalDamaged && packAnimal.Hits() < packAnimal.MaxHits()) {
			Logger.debug('Pack animal damaged. Escaping.');
			return true;
		}
		if (configs.escapeWhenPackAnimalLeaves && packAnimal.Distance() > 2) {
			Logger.debug('Pack animal left. Escaping.');
			return true;
		}
	} else if (configs.usePackAnimal) {
		Logger.warn('Could not find pack animal when checking escape parameters.'); // Log a warning if pack animal is missing
	}
	// Check if player's health is below maximum or if a red (criminal) is seen nearby
	if (configs.escapeWhenDamaged && Player.Hits() < Player.MaxHits()) {
		Logger.debug('Player damaged. Escaping.');
		return true;
	}
	if (configs.escapeWhenRedSeen && Orion.FindType(any, any, 'ground', 'injured|live|ignoreself|ignorefriends', 50, 'criminal').length > 0) {
		Logger.debug('Red seen. Escaping.');
		return true;
	}

	return false;
}

function escape() {
	Orion.Wait(500);
	mount();
	while (!getSecureContainer()) {
		runebookManager.travelHome();
		Orion.Wait(1000);
	}
}

function findToolSerial(type) {
	const types = toolTypes[type];
	if (type === 'mining') {
		const toolSerials = Orion.FindType(types.join('|'), any);
		return toolSerials.shift();
	} else {
		return Orion.ObjAtLayer('LeftHand').Serial();
	}
}

function calculateDistanceFromPlayer(tile) {
	const x1 = Player.X(), y1 = Player.Y(), z1 = Player.Z();
	const x2 = tile.X(), y2 = tile.Y(), z2 = tile.Z();

	const dx = x2 - x1;
	const dy = y2 - y1;
	const dz = z2 - z1;

	const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
	return distance;
}

function getTileType(type) {
	return type === 'mining' ? 'mine' : 'tree';
}

function getTilesWithinRadius(tileType, radius) {
	const tiles = Orion
		.GetTilesInRect(tileType, Player.X() - radius, Player.Y() - radius, Player.X() + radius, Player.Y() + radius)
		.sort(function (tileA, tileB) {
			return calculateDistanceFromPlayer(tileA) - calculateDistanceFromPlayer(tileB);
		});

	return tiles;
}

function findClosestResourceNode(type) {
	const tileType = getTileType(type);
	const radius = 2;

	const closestTile = getTilesWithinRadius(tileType, radius).shift();

	return closestTile;
}

function targetTile(type, tile) {
	// Below is a hack to fix a bug in Orion that has been around for some time.
	if (type === 'mining') {
		Orion.TargetTile(tile, tile.X(), tile.Y(), tile.Z());
	} else {
		Orion.TargetTile(tile.Graphic(), tile.X(), tile.Y(), tile.Z());
	}
}

function checkLumberjackingTools() {
	const mainHandObject = Orion.ObjAtLayer('LeftHand');
	const mainHandGraphic = parseInt(mainHandObject.Graphic());

	if (!mainHandObject || toolTypes.lumberjacking.indexOf(mainHandGraphic) === -1) {
		Logger.error('Axe must be in main hand. Pausing script.');
		Orion.PauseScript();
		checkLumberjackingTools();
	}
}

function checkMiningTools() {
	const craftingConfigs = Config.craftingConfigs;
	const shovelGraphic = 0x0F3A;
	const tinkerTool = ItemManager.findItemByDisplayName('Tinker\'s Tools');
	const craftingTool = ItemManager.findItemByGraphic(shovelGraphic);
	const tinkerToolCount = Orion.Count(tinkerTool.graphic, any, self, 1, true);
	const craftingToolCount = Orion.Count(shovelGraphic, any, self, 1, true);

	if (craftingToolCount < craftingConfigs.shovelReturnCount || tinkerToolCount < 2) {
		Logger.info('Returning to create more tools.');

		// Travel back to house, then store items.
		escape();
		dismount();

		// Attempt to refine ore and boards.
		// Then, store materials in container.
		refineResources();
		storeInSecure();

		// Craft the tools that are missing.
		craftingConfigs.craftShovels && craftMissingTools([
			[craftingTool, craftingConfigs.maxShovels - craftingToolCount],
			[tinkerTool, 4 - tinkerTool]
		]);

		mount();

		Orion.Wait(1000);

		// Return to the last location.
		returnToLast();
	}
}

function checkTools(type) {
	// If lumberjacking, check that axe is in main hand.
	if (type === 'lumberjacking') {
		checkLumberjackingTools();
		// If mining, check that we have sufficient shovels.
	} else {
		checkMiningTools();
	}
}

function craftMissingTools(tools) {
	tools.forEach(function (toolInfo) {
		const tool = toolInfo[0];
		const numToBuild = toolInfo[1];
		checkResources(tool, numToBuild * 150, 0x0000);
		while (Orion.Count(tool.graphic) < numToBuild) {
			craftItem(tool);
			Orion.Wait(1000);
		}
	});
	// Return resources used to storage.
	storeInSecure();
}

function checkResources(item, count) {
	const secureContainer = getSecureContainer();
	Orion.OpenContainer(secureContainer.Serial());
	Orion.Wait(1000);
	const requiredMaterials = item.materials.map(function (materialInfo, index) {
		const graphic = parseInt(materialInfo[0]);
		const quantity = materialInfo.length === 3 ? materialInfo[2] : materialInfo[1];
		const color = materialInfo.length === 3 ? materialInfo[1] : 0x0000;
		const multiplier = index > 1 ? 1 : count;
		return {
			graphic: graphic,
			quantity: quantity * multiplier,
			originalQuantity: quantity,
			color: color
		};
	});

	requiredMaterials.forEach(function (material, index) {
		const currentCount = Orion.Count(material.graphic);

		if (currentCount > material.originalQuantity) {
			return;
		}

		const quantity = material.quantity > 400 ? 400 : material.quantity;
		if (Orion.Count(material.graphic, material.color, secureContainer.Serial()) >= count) {
			const serial = Orion.FindType(material.graphic, material.color, secureContainer.Serial())[0];
			Orion.Wait(1000);
			Orion.MoveItem(serial, quantity);
			Orion.Wait(2000);
			return;
		}
	});
}

function craftItem(item) {
	Orion.CancelWaitGump();
	const craftingGump = new CraftingGump(item.craftingType);

	// Double click crafting tool if not already open.
	const craftingTool = ToolMap[item.craftingType];
	if (!craftingGump.isOpen()) {
		Orion.UseType(craftingTool);
		Orion.WaitForGump(1000);
	}

	// Select category
	craftingGump.selectCategory(item.category);
	// Select the option to craft the item, then pause.
	craftingGump.selectOption(item.option);
}

function CraftingGump(type) {
	const MasterGumpList = {
		crafting: {
			tinkering: {
				categories: {
					jewelry: 9001,
					woodenItems: 9002,
					tools: 9003,
					parts: 9004,
					utensils: 9005,
					miscellaneous: 9006,
					assemblies: 9007,
					traps: 9008,
					magicJewelry: 9009
				}
			},
			blacksmithing: {
				categories: {
					metalArmor: 9001,
					helmets: 9002,
					shields: 9003,
					bladed: 9004,
					axes: 9005,
					polearms: 9006,
					bashing: 9007,
					throwing: 9009
				},
				resources: {
					iron: 5000,
					dullCopper: 5001,
					shadowIron: 5002,
					copper: 5003,
					bronze: 5004,
					gold: 5005,
					golden: 5005,
					agapite: 5006,
					verite: 5007,
					valorite: 5008
				},
				smeltItem: 7000,
				makeLast: 1999
			}
		}
	};
	const config = MasterGumpList.crafting[type];
	const gumpIds = [
		0x000001CC
	];

	function _getGump() {
		for (var i = 0; i < Orion.GumpCount(); i++) {
			const gump = Orion.GetGump(i);
			const gumpId = parseInt(gump.ID());
			if (gumpIds.indexOf(gumpId) > -1) {
				return gump;
			}
		}
		return null;
	}

	function _clickOption(index, warning) {
		const gump = _getGump();
		if (!gump) {
			Logger.warn(warning);
			return false;
		}
		const hook = Orion.CreateGumpHook(index);
		if (!gump.Select(hook)) {
			Logger.error('Could not select hook: ' + index);
			return false;
		}
		Orion.WaitForGump(2000);
		return true;
	}

	function isOpen() {
		return !!_getGump();
	}

	function selectCategory(category) {
		const categoryID = config.categories[category];
		return _clickOption(categoryID, 'Failed to open gump category ' + category + '.');
	}

	function selectOption(option) {
		const result = _clickOption(option, 'Failed to select gump option ' + option + '.');
		Orion.Wait(2000);
		return result;
	}

	function selectResource(resource) {
		const resourceId = resource ? config.resources[resource] : 5000;
		return _clickOption(resourceId, 'Failed to select resource ' + resourceId + '.');
	}

	function selectMakeLast() {
		return _clickOption(config.makeLast, 'Failed to \'Make Last\'.');
	}

	function selectSmeltItem() {
		return _clickOption(config.smeltItem, 'Failed to select \'Smelt item\'.');
	}

	function close() {
		const gump = _getGump();
		if (!gump) {
			return false;
		}
		_getGump().Close();

		return true;
	}

	return {
		selectCategory: selectCategory,
		selectOption: selectOption,
		selectResource: selectResource,
		selectMakeLast: selectMakeLast,
		selectSmeltItem: selectSmeltItem,
		isOpen: isOpen,
		close: close
	};
}

function RunebookManager(runebookConfigs, type) {
	const runebooks = runebookConfigs[type];
	const travelSpells = {
		recall: 50,
		sacredjourney: 75
	};
	const travelSpell = travelSpells[runebookConfigs.travelSpell.replace(/\s/g, '').toLowerCase()];
	var currentRuneIndex = 0;
	var currentRunebookIndex = 0;
	var lastRunebook;
	var lastIndex;

	function _travelToLocation(runebook, index) {
		Orion.CancelWaitGump();
		Orion.UseObject(runebook);

		if (!Orion.WaitForGump(2000)) {
			Logger.warn('Runebook gump not opened.');
			return _travelToLocation(runebook, index);
		}

		const gump = Orion.GetLastGump();
		const hook = Orion.CreateGumpHook(travelSpell + index);
		gump.Select(hook);
		Orion.WaitGump(hook);

		Orion.Wait(3000);

		lastRunebook = runebook;
		lastIndex = index;
	}

	function travelHome() {
		const homeConfig = runebookConfigs.home;
		return _travelToLocation(homeConfig[0], homeConfig[1]);
	}

	function travelNext() {
		_travelToLocation(runebooks[currentRunebookIndex][0], currentRuneIndex);

		// Increment the current rune and runebook.
		if (currentRuneIndex === runebooks[currentRunebookIndex][1] - 1) {
			currentRuneIndex = 0;
			if (currentRunebookIndex === runebooks.length - 1) {
				currentRunebookIndex = 0;
			} else {
				// Go ahead and increment anyway though as sometimes Orion just struggles to find things.
				currentRunebookIndex += 1;
			}
		} else {
			currentRuneIndex += 1;
		}
	}

	function hasLast() {
		return lastRunebook[0] && lastIndex;
	}

	function travelLast() {
		_travelToLocation(lastRunebook[0], lastIndex);
	}

	return {
		travelNext: travelNext,
		travelHome: travelHome,
		hasLast: hasLast,
		travelLast: travelLast
	};
}

const Logger = {
	log: function (text, color) {
		Orion.Print(color, JSON.stringify(text));
	},
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

const ItemManager = {
	_MasterItemList: [
		// Blacksmithing.
		{
			displayName: 'Axe',
			graphic: 0x0F49,
			craftingType: 'blacksmithing',
			category: 'axes',
			option: 59,
			materials: [[0x1BF2, 30]]
		},
		// Tinkering
		{
			displayName: 'Tinker\'s Tools',
			graphic: 0x1EB9,
			craftingType: 'tinkering',
			category: 'tools',
			option: 11,
			materials: [[0x1BF2, 18]]
		},
		{
			displayName: 'Saw',
			graphic: 0x1034,
			craftingType: 'tinkering',
			category: 'tools',
			option: 15,
			materials: [[0x1BF2, 18]]
		},
		{
			displayName: 'Tongs',
			graphic: 0x0FBC,
			craftingType: 'tinkering',
			category: 'tools',
			option: 20,
			materials: [[0x1BF2, 18]]
		},
		{
			displayName: 'Fletcher\'s Tools',
			graphic: 0x1022,
			craftingType: 'tinkering',
			category: 'tools',
			option: 28,
			materials: [[0x1BF2, 3]]
		},
		{
			displayName: 'Shovel',
			graphic: 0x0F3A,
			craftingType: 'tinkering',
			category: 'tools',
			option: 18,
			materials: [[0x1BF2, 4]]
		},
		// Resources
		{
			displayName: 'Ingots',
			graphic: 0x1BF2,
			types: {
				iron: 0x0000,
				dullCopper: 0x0973,
				shadowIron: 0x0966,
				copper: 0x096D,
				bronze: 0x0972,
				gold: 0x08A5,
				golden: 0x08A5,
				agapite: 0x0979,
				verite: 0x089F,
				valorite: 0x08AB
			}
		},
		{
			displayName: 'Boards',
			graphic: 0x1BD7,
			types: {
				wood: 0x0000,
				oak: 0x07DA,
				ash: 0x04A7,
				yew: 0x04A8,
				heartwood: 0x04A9,
				bloodwood: 0x04AA,
				frostwood: 0x047F
			}
		},
		{displayName: 'Cloth', graphic: 0x1767, types: {}},
		{displayName: 'Blank Scroll', graphic: 0x0EF3, types: {}}
	],
	findItemByDisplayName: function (displayName) {
		for (var i = 0; i < this._MasterItemList.length; i++) {
			if (displayName.toLowerCase() === this._MasterItemList[i].displayName.toLowerCase()) {
				return this._MasterItemList[i];
			}
		}
		return null;
	},
	findItemByGraphic: function (graphic) {
		for (var i = 0; i < this._MasterItemList.length; i++) {
			if (graphic === this._MasterItemList[i].graphic) {
				return this._MasterItemList[i];
			}
		}
		return null;
	},
	findMaterialNameByGraphic: function (graphic) {
		const keys = Object.keys(MaterialColorMap);
		for (var i = 0; i < keys; i++) {
			if (MaterialColorMap[keys[i]] === parseInt(graphic)) {
				return keys[i];
			}
		}
		return null;
	}
};

const ToolMap = {
	blacksmithing: 0x0FBC,
	carpentry: 0x1034,
	tinkering: 0x1EB9,
	fletching: 0x1022
};

const resourceTypes = {
	ore: [
		0x19BA, // Small Ore.
		0x19B7, // Small Ore.
		0x19B8, // Medium Ore.
		0x19B9 // Large Ore.
	],
	logs: [
		0x1BDD // Logs.
	],
	imbuing: [
		0x5738, // Crystal Shards.
		0x3190, // Parasitic Plant.
		0x3191, // Luminescent Fungi.
		0x3197, // Fire Ruby.
		0x3193, // Turquoise.
		0x3196, // White Pearl.
		0x3199, // Brilliant Amber.
		0x3195, // Ecru Citrine.
		0x3194, // Perfect Emerald.
		0x3198, // Blue Diamond.
		0x3192, // Dark Sapphire.
		0x3196 // White Pearl.
	],
	refinedResources: [
		0x1BF2, // Ingots.
		0x1BD7 // Boards.
	]
};

const toolTypes = {
	mining: [0x0F3A], // Shovels and pickaxes.
	lumberjacking: [0x0F44, 0x0F48, 0x0F49, 0x0F47, 0x0F4B, 0x0F45, 0x13FB, 0x1443, 0x13B0] // Axes.
};
