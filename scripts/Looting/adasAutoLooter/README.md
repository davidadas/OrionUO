# Adas Auto Looter

This script is designed to automate looting in OrionUO. It includes features such as managing loot lists, ignoring specific corpses and properties, and handling loot containers.

## Prerequisites

1. Ensure you have OrionUO installed and set up.
2. Make sure the Orion Assistant is running.

## Configuration

### Setting Up the Configurations

The configuration for the script is stored in the `Config` object. You need to set up various parameters before running the script.

#### Example Configuration

```javascript
// Runtime Configs.
// Use these to manage the behavior of the script.
const Configs = {
    lootWhenHidden: false, // If true, looter will loot even while hidden.

    // Max Attempts Configuration.
    useMaxOpenAttempts: false, // Set true to ignore a corpse after a certain number of attempts have been made.
    maxOpenAttempts: 5, // Number of attempts to open corpse before it is ignored.

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
    'lockpick',
    'legendary',
    'map',
    'paragon',
    'major artifact',
    'parrot'
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
```

## License

This script is licensed under the MIT License.