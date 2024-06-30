// INSTRUCTIONS:
// To use this script, simply set the configuratoin below.
// Then, run the script with each character in your account.
const Config = {
	// This sets the type of bods to collect.
	// Options are 'tailoring', 'blacksmithing', 'fletching', 'tinkering', and 'carpentry'.
	bodsToCollect: [
		'blacksmithing',
		'fletching',
		'tailoring'
	],
	// Set this to true if you wish for this to log you out after all bods are collected.
	autoLogOut: true
};

const npcMap = {
	carpentry: [
		'carpenter'
	],
	blacksmithing: [
		'blacksmith',
		'armourer',
		'weaponsmith'
	],
	fletching: [
		'bowyer'
	],
	tailoring: [
		'tailor',
		'weaver'
	],
	tinkering: [
		'tinker'
	]
};

const npcGraphics = [0x0190, 0x0191];

// eslint-disable-next-line no-unused-vars
function requestBods() {
	// Wait to ensure we are fully logged in.
	Orion.Wait(4000);

	Config.bodsToCollect.forEach(function(skill) {
		const npc = getNpc(skill);
		for (var i = 0; i < 3; i++) {
			requestBod(npc.Serial());
		}
	});

	Orion.Wait(1500);
	if (Config.autoLogOut) Orion.LogOut();
}

function getNpc(skill) {
	const titlesMap = npcMap[skill];
	return npcGraphics
		.reduce(function (acc, graphic) {
			const serials = Orion.FindType(graphic, 0xFFFF, 'any', undefined, 50);
			serials.forEach(function (serial) {
				titlesMap.forEach(function(title) {
					const isProfession = Orion.FindObject(serial).Properties().toLowerCase().indexOf(title) > -1;
					const isGuild = Orion.FindObject(serial).Properties().toLowerCase().indexOf('guild') > -1;
					if (isProfession && !isGuild) {
						acc.push(serial);
					}
				});
			});
			return acc;
		}, [])
		.map(Orion.FindObject)
		.shift();
}

function requestBod(targetSerial) {
	Orion.RequestContextMenu(targetSerial);
	Orion.WaitContextMenuID(targetSerial, 403);
	if (Orion.WaitForGump(1000)) {
		const gump = Orion.GetGump('last');
		if ((gump !== null) && (!gump.Replayed()) && (gump.ID() === '0x000001C7')) {
			gump.Select(Orion.CreateGumpHook(1));
			Orion.Wait(1000);
		}
	}
}
