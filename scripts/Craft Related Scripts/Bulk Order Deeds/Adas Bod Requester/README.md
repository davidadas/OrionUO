# Adas Auto Briber

This script automates the collection of Bulk Order Deeds (BODs) from NPCs in the game Ultima Online using the OrionUO Assistant. It supports multiple professions and can log out automatically after collecting BODs.

## Features
- Collects BODs for specified professions.
- Logs out automatically after BOD collection (configurable).
- Prints logs for debugging and status updates.

## Prerequisites
- OrionUO Assistant installed and configured.
- Place the script file in the OrionUO scripts directory.

## Configuration

## Configuration File Example
```javascript
const Config = {
    // Professions to collect BODs for.
    bodsToCollect: [
        'blacksmithing',
        'fletching',
        'tailoring'
    ],
    // Enable or disable automatic logout after BOD collection.
    autoLogOut: true,
};
```
