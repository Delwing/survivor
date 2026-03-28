import { BiomeDefinition } from '@/types/world';

export const BIOME_DEFINITIONS: BiomeDefinition[] = [
  {
    id: 'forest', name: 'Forest', color: 0x228b22,
    elevationRange: [0.3, 0.6], moistureRange: [0.3, 0.7],
    resources: [
      { itemId: 'wood', density: 0.08 }, { itemId: 'stone', density: 0.03 },
      { itemId: 'berries', density: 0.03 }, { itemId: 'herbs', density: 0.025 },
    ],
    mobs: ['slime', 'rabbit', 'deer'], mobDensity: 2,
  },
  {
    id: 'rocky_highlands', name: 'Rocky Highlands', color: 0x808080,
    elevationRange: [0.6, 1.0], moistureRange: [0.0, 0.4],
    resources: [
      { itemId: 'iron_ore', density: 0.06 }, { itemId: 'copper_ore', density: 0.04 },
      { itemId: 'coal', density: 0.025 }, { itemId: 'crystal', density: 0.015 },
    ],
    mobs: ['rock_golem', 'cave_bat'], mobDensity: 3,
  },
  {
    id: 'swamp', name: 'Swamp', color: 0x2e4a2e,
    elevationRange: [0.0, 0.3], moistureRange: [0.6, 1.0],
    resources: [
      { itemId: 'rare_mushroom', density: 0.05 }, { itemId: 'swamp_reed', density: 0.04 },
      { itemId: 'slime_gel', density: 0.025 },
    ],
    mobs: ['poison_frog', 'bog_lurker', 'wisp'], mobDensity: 4,
  },
  {
    id: 'volcanic_wastes', name: 'Volcanic Wastes', color: 0x8b0000,
    elevationRange: [0.6, 1.0], moistureRange: [0.0, 0.3], heatRange: [0.7, 1.0],
    resources: [
      { itemId: 'obsidian', density: 0.04 }, { itemId: 'fire_crystal', density: 0.025 },
      { itemId: 'rare_ore', density: 0.012 },
    ],
    mobs: ['fire_elemental', 'lava_crawler'], mobDensity: 5,
  },
  {
    id: 'corrupted_lands', name: 'Corrupted Lands', color: 0x4b0082,
    elevationRange: [0.0, 1.0], moistureRange: [0.0, 1.0],
    requiresCorruption: true, metaRequired: 'reach_volcanic_3',
    resources: [
      { itemId: 'shadow_essence', density: 0.04 }, { itemId: 'void_crystal', density: 0.02 },
      { itemId: 'corrupted_wood', density: 0.03 },
    ],
    mobs: ['shadow_beast', 'corrupted_npc'], mobDensity: 6,
  },
];
