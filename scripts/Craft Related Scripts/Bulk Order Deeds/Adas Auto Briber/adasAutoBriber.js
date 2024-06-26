//-----------------------------------------------------------
// Script Name: Adas Auto Briber.
// Author: DavidAdas
// Version: 0.1.0
// Shard OSI / FS: OSI
// Revision Date: 6/21/24
// Purpose: Bribe officials to improve low value bulk order deeds.
//-------------------------------------------------------------
//
// Instructions: Read the config carefully below and set the values accordingly.
//
const Config = {
	// Runebook configurations.
	// Each runebook should be dedicated to one profession (e.g. smiths, carpenters, etc).
	// Supported options are: blacksmithy, fletching, carpentry, tailoring, tinkering.
	runebookConfigs: {
		blacksmithy: [
			{ serial: '<SET ME>', runes: 16 },
			{ serial: '<SET ME>', runes: 16 }
		],
		fletching: [
			{ serial: '<SET ME>', runes: 16 },
			{ serial: '<SET ME>', runes: 16 }
		],
		carpentry: [
			{ serial: '<SET ME>', runes: 16 },
			{ serial: '<SET ME>', runes: 16 }
		],
		tailoring: [
			{ serial: '<SET ME>', runes: 16 },
			{ serial: '<SET ME>', runes: 16 }
		],
		tinkering: [
			{ serial: '<SET ME>', runes: 16 },
			{ serial: '<SET ME>', runes: 16 }
		]
	},
	// List of items to ignore.
	// Option values are: target (name of item), quality (normal/exceptional), material (iron, wood, shadow iron, etc).
	// An asterix (*) should be used for all options in a given category.
	ignoreList: [
		{ target: 'Kindling', quality: '*', material: '*'  },
		{ target: 'Shaft', quality: '*', material: '*'  },
		{ target: 'Elven Fletching', quality: '*', material: '*'  },
		{ target: 'Arrow', quality: '*', material: '*'  },
		{ target: 'Crossbow Bolt', quality: '*', material: '*'  },
		{ target: 'Barbed Longbow', quality: '*', material: '*'  },
		{ target: 'Slayer Longbow', quality: '*', material: '*'  },
		{ target: 'Frozen Longbow', quality: '*', material: '*'  },
		{ target: 'Longbow Of Might', quality: '*', material: '*'  },
		{ target: 'Ranger\'s Shortbow', quality: '*', material: '*'  },
		{ target: 'Lightweight Shortbow', quality: '*', material: '*'  },
		{ target: 'Mystical Shortbow', quality: '*', material: '*'  },
		{ target: 'Magical Shortbow', quality: '*', material: '*'  },
		{ target: 'Assassin\'s Shortbow', quality: '*', material: '*'  }
	],
	// List of BODs to automatically improve.
	bodTargets: [
		{ material: 'Wood', quality: 'Normal', quantities: [10, 15, 20] },
		{ material: 'Oak', quality: 'Normal', quantities: [10, 15, 20] },
		{ material: 'Ash', quality: 'Normal', quantities: [10, 15, 20] },
		{ material: 'Yew', quality: 'Normal', quantities: [10] },
		{ material: 'Iron', quality: 'Normal', quantities: [10, 15, 20] },
		{ material: 'Shadow Iron', quality: 'Normal', quantities: [10, 15, 20] },
		{ material: 'Gold', quality: 'Normal', quantities: [10, 15] }
	]
};

const bodManager = new BodManager(Config.bodTargets, Config.ignoreList);
const runebookManager = new RunebookManager(Config.runebookConfigs);

// eslint-disable-next-line no-unused-vars
function bribeOfficials() {
	clearStates();

	var hasBods = true;

	while (hasBods) {
		const nextBod = bodManager.getNextBod();

		if (!nextBod) {
			hasBods = false;
			continue;
		}

		const parsedBod = bodManager.parseBod(nextBod);
		runebookManager.travelNext(parsedBod.skillName);

		if(!Orion.InJournal('You cannot teleport into that area')) {
			const npcs = getNpcs();
			npcs.forEach(function (npc) {
				bribeNpc(npc, nextBod);
			});
		}
		Orion.Wait(1000);
		Orion.ClearJournal();
	}

	Logger.info('Script Complete.');
	clearStates();
}

function clearStates() {
	Orion.CancelWaitGump();
	Orion.CancelWaitTarget();
	Orion.CloseGump('contextmenu');
	Orion.CancelTarget();
	Orion.ClearJournal();
}

function findClosestObject(object, objects) {
	const x = object.X();
	const y = object.Y();
	var closestObject = null;
	var minDistance = Infinity;

	for (var i = 0; i < objects.length; i++) {
		const obj = objects[i];
		const distance = Math.sqrt(Math.pow((x - obj.X()), 2) + Math.pow((y - obj.Y()), 2));
		if (distance < minDistance) {
			minDistance = distance;
			closestObject = obj;
		}
	}

	return closestObject;
}

function RunebookManager(runebookConfigs) {
	const runebookMap = Object
		.keys(runebookConfigs)
		.reduce(function (acc, key) {
			acc[key] = {
				runebooks: runebookConfigs[key],
				currentRunebookIndex: 0,
				currentRuneIndex: 0,
				lastRunebook: 0,
				lastIndex: 0
			};
			return acc;
		}, {});

	function _travelToLocation(runebook, index) {
		Orion.CancelWaitGump();
		Orion.UseObject(runebook);

		if (!Orion.WaitForGump(2000)) {
			Logger.warn('Runebook gump not opened.');
			return _travelToLocation(runebook, index);
		}

		const gump = Orion.GetLastGump();
		const hook = Orion.CreateGumpHook(50 + index);
		gump.Select(hook);
		Orion.WaitGump(hook);

		Orion.Wait(4000);

		lastRunebook = runebook;
		lastIndex = index;
	}

	function travelNext(skillName) {
		const skillRunebook = runebookMap[skillName];
		const runebooks = skillRunebook.runebooks;
		const currentRunebookIndex = skillRunebook.currentRunebookIndex;
		const currentRuneIndex = skillRunebook.currentRuneIndex;

		_travelToLocation(runebooks[currentRunebookIndex].serial, currentRuneIndex);

		// Increment the current rune and runebook.
		if (currentRuneIndex === runebooks[currentRunebookIndex].runes - 1) {
			runebookMap[skillName].currentRuneIndex = 0;
			if (currentRunebookIndex === runebooks.length - 1) {
				runebookMap[skillName].currentRunebookIndex = 0;
			} else {
				// Go ahead and increment anyway though as sometimes Orion just struggles to find things.
				runebookMap[skillName].currentRunebookIndex += 1;
			}
		} else {
			runebookMap[skillName].currentRuneIndex += 1;
		}
	}

	function hasLast(skillName) {
		const lastRunebook = runebookMap[skillName].lastRunebook;
		const lastIndex = runebookMap[skil].lastIndex;
		return lastRunebook[0] && lastIndex;
	}

	function travelLast(skillName) {
		const lastRunebook = runebookMap[skillName].lastRunebook;
		const lastIndex = runebookMap[skil].lastIndex;
		_travelToLocation(lastRunebook[0], lastIndex);
	}

	return {
		travelNext: travelNext,
		hasLast: hasLast,
		travelLast: travelLast
	};
}

function BodManager(targets, ignoreList) {
	const _ProfessionMap = {
		0x044E: 'blacksmithy',
		0x05E8: 'carpentry',
		0x058D: 'fletching',
		0x0483: 'tailoring'
	};
	const _MaterialsList = [
		// Ingots.
		'Iron',
		'Dull Copper',
		'Shadow Iron',
		'Copper',
		'Bronze',
		'Gold',
		'Golden',
		'Agapite',
		'Verite',
		'Valorite',
		// Boards.
		'Wood',
		'Oak',
		'Ash',
		'Yew',
		'Heartwood',
		'Bloodwood',
		'Frostwood',
		// Tailoring.
		'Cloth',
		'Horned',
		'Spined',
		'Barbed',
		'Leather',
		// Misc.
		'Blank Scroll'
	];

	const _MaterialsRegex = new RegExp('(' + _MaterialsList.join('|') + ')');
	const _QualityRegex = new RegExp(/(Normal|Exceptional)/);

	function parseBod(bod) {
		const properties = bod.Properties();
		const propArray = properties.split('\n');
		const targets = _getTargetNames(properties);
		const material = properties.match(_MaterialsRegex)[0];
		const quality = properties.match(_QualityRegex)[0];
		const quantity = parseInt(propArray[6].split(': ')[1].trim());
		const skillName = _ProfessionMap[parseInt(bod.Color())];

		return {
			targets: targets,
			material: material,
			quality: quality,
			quantity: quantity,
			skillName: skillName
		};
	}

	function _getTargetNames(inputString) {
		const regex = /Amount To Make: \d+([\s\S]*)/;
		const match = inputString.match(regex);

		if (match) {
			const targetPart = match[1].trim();
			const targetLines = targetPart.split('\n');
			const nonEmptyTargetLines = targetLines
				.filter(function(line) {
					return line.trim() !== '';
				})
				.map(function(line) {
					return line.split(':')[0].trim().toLowerCase();
				});

			return nonEmptyTargetLines;
		} else {
			return [];
		}
	}

	function _isNotIgnored(bod) {
		const parsedBod = parseBod(bod);
		const categories = ['material', 'quality', 'target'];
		const keys = Object.keys(ignoreList);

		for (var i = 0; i < keys.length; i++) {
			const ignoreListItem = ignoreList[keys[i]];
			const isIgnored = categories.every(function(category) {
				if(ignoreListItem[category] === '*') {
					return true;
				} else if (category === 'target') {
					return parsedBod.targets.indexOf(ignoreListItem[category].toLowerCase()) > -1;
				} else {
					ignoreListItem[category] === parsedBod[category];
				}
			});
			if (isIgnored) {
				return false;
			}
		}
		return true;
	}

	function _isMatch(bod) {
		const parsedBod = parseBod(bod);
		for (var i = 0; i < targets.length; i++) {
			const hasQuantities = !!(targets[i].quantities && targets[i].quantities.filter(function (targetQuantity) {
				return targetQuantity === parsedBod.quantity;
			}).length);
			if (
				(targets[i] && parsedBod.material === targets[i].material) &&
				(targets[i] && parsedBod.quality === targets[i].quality) &&
				hasQuantities
			){
				return true;
			}
		}
		return false;
	}

	function getNextBod() {
		const bodSerials = Orion.FindType(0x2258);
		const bodObjects = bodSerials.map(Orion.FindObject);

		const filteredBods = bodObjects
			.filter(_isMatch)
			.filter(_isNotIgnored);

		return filteredBods[0];
	}


	return {
		getNextBod: getNextBod,
		parseBod: parseBod
	};
}

function hasBribeOption(npc) {
	Orion.CancelContextMenu();
	Orion.RequestContextMenu(npc.Serial());
	if (!Orion.WaitForContextMenu()) {
		Logger.warn('Could not get context menu from: ' + npc.Properties().trim());
	}
	const npcMenu = Orion.GetContextMenu();
	for (var i = 0; i < npcMenu.ItemsCount(); i++) {
		if (npcMenu.ItemText(i) === 'Bribe') {
			Orion.CloseGump('contextmenu');
			return true;
		}
	}
	Orion.CloseGump('contextmenu');
	return false;
}

function selectBribe(npc, bod) {
	Orion.CloseGump('contextmenu');
	Orion.CancelContextMenu();
	Orion.RequestContextMenu(npc.Serial());
	Orion.WaitContextMenuID(npc.Serial(), 419);
	if (!Orion.WaitForContextMenu()) {
		Logger.warn('Could not get context menu from: ' + npc.Properties().trim());
	}

	if (bod) {
		Orion.WaitContextMenuID(npc.Serial(), 419);
		if (Orion.WaitForTarget(2000)){
			Orion.TargetObject(bod.Serial());
			Orion.Wait(1000);
			Orion.DragItem(bod.Serial());
			Orion.Wait(1000);
			Orion.DropDraggedItem(npc.Serial());
			Orion.Wait(1000);
			selectBribe(npc, bodManager.getNextBod());
		} else {
			Logger.info('NPC no longer accepts bribes. Moving to next NPC.');
		}
	} else {
		Logger.info('No more items left to fill.');
	}
}

function isBodProducer(npc, bod) {
	const color = parseInt(bod.Color());
	const professions = NpcMap[color];
	for (var i = 0; i < professions.length; i++) {
		if (npc.Properties().trim().toLowerCase().indexOf(professions[i].toLowerCase()) > -1) {
			return true;
		}
	}
	return false;
}

function walkToNpc(npc) {

	if (!Orion.WalkTo( npc.X(), npc.Y(), npc.Z())) {
		const doors = DoorList
			.reduce(function (acc, graphic) {
				const doorSerials = Orion.FindType(graphic, 0xFFFF, 'any', undefined, 15);
				doorSerials.forEach(function (doorSerial) {
					acc.push(doorSerial);
				});
				return acc;
			}, [])
			.map(function (doorSerial) {
				return Orion.FindObject(doorSerial);
			});
		const closestDoor = findClosestObject(npc, doors);
		if (closestDoor && Orion.WalkTo(closestDoor.X(), closestDoor.Y(), closestDoor.Z())) {
			Orion.UseObject(closestDoor.Serial());
			Orion.Wait(500);
			return Orion.WalkTo(npc.X(), npc.Y(), npc.Z());
		}
	}

	return Orion.WalkTo(npc.X(), npc.Y(), npc.Z());
}

function bribeNpc(npc, bod) {
	if (!isBodProducer(npc, bod)) {
		return;
	}

	if (hasBribeOption(npc)) {
		if (npc.Distance() < 3) {
			selectBribe(npc, bod);
		} else if (walkToNpc(npc)) {
			selectBribe(npc, bod);
		} else {
			Logger.error('Cannot walk to npc: ' + npc.Properties().trim());
		}
	} else {
		Logger.warn('No bribe option from: ' + npc.Properties().trim());
	}
}

function getNpcs() {
	return NpcGraphics
		.reduce(function (acc, graphic) {
			const serials = Orion.FindType(graphic, 0xFFFF, 'any', undefined, 15);
			serials.forEach(function (serial) {
				acc.push(serial);
			});
			return acc;
		}, [])
		.map(Orion.FindObject);
}

const Logger = {
	error: function(text) { Orion.Print(0x0021, JSON.stringify(text)); },
	info: function(text) {  Orion.Print(0x03E9, JSON.stringify(text)); },
	warn: function(text) { Orion.Print(0x035, JSON.stringify(text)); },
	debug: function(text) {
		TextWindow.Print(JSON.stringify(text));
		TextWindow.Open();
	}
};

const NpcGraphics = [0x0190, 0x0191];

const NpcMap = {
	0x05E8: [
		'carpenter'
	],
	0x044E: [
		'blacksmith',
		'armourer',
		'weaponsmith'
	],
	0x058D: [
		'bowyer'
	],
	0x0455: [
		'tinker'
	]
};

const DoorList = [
	0x06AB,
	0x06B1,
	0x06A5,
	0x06AF,
	0x06AD
];
