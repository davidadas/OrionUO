# Adas Auto Looter

This script is designed to automate looting in OrionUO. It includes features such as managing loot lists, ignoring specific corpses and properties, and handling loot containers.

## Prerequisites

1. Ensure you have OrionUO installed and set up.
2. Make sure the Orion Assistant is running.

s## Configuration

### Setting Up the Configurations

The configuration for the script is stored in the `Config` object. You need to set up various parameters before running the script.

### Loot Configuration
`masterLootList`

The masterLootList is where you define what items the script should loot. Here are various ways to configure it:

**Single Graphic ID**
```js
Configs.masterLootList = [
    0x572C // Loots items with the graphic ID 0x572C (e.g., Goblin Blood).
];
```
**Single Property Name**
```js
Configs.masterLootList = [
    'Luck' // Loots items with the property "Luck" (case insensitive).
];
```
**Array of Graphic IDs or Property Names**
```js
Configs.masterLootList = [
    [0x572C, 0x5722] // Loots items with either graphic ID 0x572C or 0x5722.
];
```
**Object with Minimum Value**
```js
Configs.masterLootList = [
    { property: 'Luck', minimum: 150 } // Loots items with "Luck" property minimum value of 150.
];
```
**Object with Minimum and Maximum Values**
```js
Configs.masterLootList = [
    { property: 'Damage Increase', minimum: 10, maximum: 20 } // Loots items with "Damage Increase" property value between 10 and 20.
];
```
**Object with Minimum Properties Count**
```js
Configs.masterLootList = [
    { property: 'Splintering Weapon', minimumProperties: 2 } // Loots items with "Splintering Weapon" property having at least 2 sub-properties.
];
```
**Object with Multiple Properties**
```js
Configs.masterLootList = [
    { property: 'energy damage', minimum: 100 },
    { property: 'fire damage', minimum: 100 }
];
```
**Array of Mixed Types**
```js
Configs.masterLootList = [
    [0x572C, 'Luck', { property: 'Damage Increase', minimum: 10 }],
    'legendary'
];
```

### Ignored Properties and Corpses

`propertyIgnoreList`

Contains properties that the script will ignore when looting.

`corpseIgnoreList`

Contains names or graphics of corpses that the script will ignore.

### Loot Container

`useLootContainer` and `lootContainerSerial`

Set `useLootContainer` to true if you want to store loot in a specific container defined by `lootContainerSerial`.

#### Runtime Configurations

Various runtime configurations are available in the Configs object to control specific behaviors of the script, such as `lootWhenHidden`, `useMaxOpenAttempts`, and more.


## License

This script is licensed under the MIT License.