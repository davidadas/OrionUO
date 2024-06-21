# Adas Auto Briber

This script automates the process of bribing NPCs to improve Bulk Order Deeds (BODs) in the game Ultima Online using the OrionUO Assistant. The script is configured to work with specific professions and handles travel to various runebook locations to find the appropriate NPCs for bribing.

## Features
- Automatically travels to runebook locations based on profession.
- Filters out unwanted BODs based on a configurable ignore list.
- Bribes NPCs to improve BODs.
- Logs the progress and completion of the script.

## Prerequisites
- OrionUO Assistant installed and configured.
- Ensure the script file is placed in the OrionUO scripts directory.

## Configuration

### Runebook Configurations
Runebooks should be dedicated to one profession (e.g., blacksmiths, carpenters, etc.). Supported options are: blacksmithy, fletching, carpentry, tailoring, tinkering.

### Ignore List
Configure the items to ignore during the script execution. Options include target (name of item), quality (normal/exceptional), and material (iron, wood, shadow iron, etc.). An asterisk (`*`) should be used for all options in a given category.

### BOD Targets
Configure the BODs to automatically improve. This includes specifying the material, quality, and quantities of BODs.

## Configuration File Example
```javascript
const Configs = {
    // Runebook configurations.
    runebookConfigs: {
        blacksmithy: [
            { serial: 0x471613D7, runes: 16 },
            { serial: 0x4716127E, runes: 16 }
        ],
        fletching: [
            { serial: 0x465229A8, runes: 11 },
            { serial: 0x46522D29, runes: 6 }
        ]
    },
    // List of items to ignore.
    ignoreList: [
        { target: 'Kindling', quality: '*', material: '*' },
        { target: 'Shaft', quality: '*', material: '*' },
        { target: 'Elven Fletching', quality: '*', material: '*' },
        { target: 'Arrow', quality: '*', material: '*' },
        { target: 'Crossbow Bolt', quality: '*', material: '*' },
        { target: 'Barbed Longbow', quality: '*', material: '*' },
        { target: 'Slayer Longbow', quality: '*', material: '*' },
        { target: 'Frozen Longbow', quality: '*', material: '*' },
        { target: 'Longbow Of Might', quality: '*', material: '*' },
        { target: 'Ranger\'s Shortbow', quality: '*', material: '*' },
        { target: 'Lightweight Shortbow', quality: '*', material: '*' },
        { target: 'Mystical Shortbow', quality: '*', material: '*' },
        { target: 'Assassin\'s Shortbow', quality: '*', material: '*' }
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
```