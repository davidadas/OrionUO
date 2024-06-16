# Adas Runebook LumberMiner

This script is designed to automate resource gathering in OrionUO for mining and lumberjacking. It includes features such as managing runebooks, handling pack animals, crafting tools, and escaping dangerous situations.

## Prerequisites

1. Ensure you have OrionUO installed and set up.
2. Make sure the Orion Assistant is running.

## Configuration

### Setting Up the Configurations

The configuration for the script is stored in the `Config` object. You need to set up various parameters before running the script.

#### Example Configuration

```javascript
const Config = {
  type: 'mining', // Options: 'mining', 'lumberjacking'.
  
  // Runebook configurations
  runebookConfigs: {
    travelSpell: 'Recall', // Options: 'Recall', 'Gate' (not implemented), 'Sacred Journey' (not implemented)
    home: ['<SET ME>', 2], // First option is rune serial, second is rune number within book.
    lumberjacking: [[0x4716da2e, 16]],
    mining: [[0x4716db93, 16]]
  },
  
  // Pack animal configurations
  packAnimalConfigs: {
    waitForPackAnimal: true,
    mountWhenTraveling: true,
    mountSerial: '<SET ME>', // Set this to your mount's serial number.
    packAnimalSerial: '<SET ME>', // Set this to your pack animal's serial number.
    fireBeetleSerial: '<SET ME>' // Set this to your fire beetle's serial number.
  },
  
  // Crafting configurations
  craftingConfigs: {
    craftShovels: true, // Automatically craft shovels and axes.
    maxShovels: 15, // Maximum number of shovels to craft at a time.
    shovelReturnCount: 4 // The point at which player should return to get more shovels.
  },
  
  // Home configurations
  homeConfigs: {
    secureContainerSerial: '<SET ME>', // Set this to your secure container's serial number.
    castCureIfDamaged: false // Not implemented.
  },
  
  // Escape configurations
  escapeConfigs: {
    escapeWhenDamaged: true,
    escapeWhenPackAnimalDamaged: true,
    escapeWhenPackAnimalLeaves: true,
    escapeWhenRedSeen: true
  },
  
  // Dropped resources
  droppedResources: [
    [0x1BDD, 0x0000], // Logs.
    [0x1BD7, 0x0000], // Boards.
    [0x19B9, 0x0000], // Normal Ore.
    [0x19B7, 0x0000], // Normal Ore.
    [0x19B8, 0x0000], // Normal Ore.
    [0x19B9, 0x0000], // Normal Ore.
  ]
};