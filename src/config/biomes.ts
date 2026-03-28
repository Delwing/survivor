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

  // ── Forest variants ──────────────────────────────────────────────────────
  {
    id: 'dark_forest', name: 'Dark Forest', color: 0x145214,
    elevationRange: [0.3, 0.6], moistureRange: [0.3, 0.7],
    resources: [
      { itemId: 'wood', density: 0.09 }, { itemId: 'stone', density: 0.03 },
      { itemId: 'herbs', density: 0.04 }, { itemId: 'berries', density: 0.01 },
    ],
    mobs: ['slime', 'rabbit', 'deer'], mobDensity: 2,
  },
  {
    id: 'pine_forest', name: 'Pine Forest', color: 0x2a7a3a,
    elevationRange: [0.3, 0.6], moistureRange: [0.3, 0.7],
    resources: [
      { itemId: 'wood', density: 0.09 }, { itemId: 'stone', density: 0.04 },
      { itemId: 'berries', density: 0.02 }, { itemId: 'herbs', density: 0.02 },
    ],
    mobs: ['slime', 'rabbit', 'deer'], mobDensity: 2,
  },

  // ── Rocky Highlands variants ─────────────────────────────────────────────
  {
    id: 'granite_peaks', name: 'Granite Peaks', color: 0x918070,
    elevationRange: [0.6, 1.0], moistureRange: [0.0, 0.4],
    resources: [
      { itemId: 'iron_ore', density: 0.07 }, { itemId: 'copper_ore', density: 0.03 },
      { itemId: 'coal', density: 0.03 }, { itemId: 'crystal', density: 0.013 },
    ],
    mobs: ['rock_golem', 'cave_bat'], mobDensity: 3,
  },
  {
    id: 'crystal_caverns', name: 'Crystal Caverns', color: 0x607090,
    elevationRange: [0.6, 1.0], moistureRange: [0.0, 0.4],
    resources: [
      { itemId: 'iron_ore', density: 0.05 }, { itemId: 'copper_ore', density: 0.04 },
      { itemId: 'coal', density: 0.02 }, { itemId: 'crystal', density: 0.025 },
    ],
    mobs: ['rock_golem', 'cave_bat'], mobDensity: 3,
  },

  // ── Swamp variants ───────────────────────────────────────────────────────
  {
    id: 'bog', name: 'Bog', color: 0x1e3a1e,
    elevationRange: [0.0, 0.3], moistureRange: [0.6, 1.0],
    resources: [
      { itemId: 'rare_mushroom', density: 0.06 }, { itemId: 'swamp_reed', density: 0.03 },
      { itemId: 'slime_gel', density: 0.03 },
    ],
    mobs: ['poison_frog', 'bog_lurker', 'wisp'], mobDensity: 4,
  },
  {
    id: 'marshland', name: 'Marshland', color: 0x3a6645,
    elevationRange: [0.0, 0.3], moistureRange: [0.6, 1.0],
    resources: [
      { itemId: 'rare_mushroom', density: 0.04 }, { itemId: 'swamp_reed', density: 0.05 },
      { itemId: 'slime_gel', density: 0.02 },
    ],
    mobs: ['poison_frog', 'bog_lurker', 'wisp'], mobDensity: 4,
  },

  // ── Volcanic Wastes variants ─────────────────────────────────────────────
  {
    id: 'ash_fields', name: 'Ash Fields', color: 0x555555,
    elevationRange: [0.6, 1.0], moistureRange: [0.0, 0.3], heatRange: [0.7, 1.0],
    resources: [
      { itemId: 'obsidian', density: 0.05 }, { itemId: 'fire_crystal', density: 0.02 },
      { itemId: 'rare_ore', density: 0.013 },
    ],
    mobs: ['fire_elemental', 'lava_crawler'], mobDensity: 5,
  },
  {
    id: 'lava_flows', name: 'Lava Flows', color: 0xaa3300,
    elevationRange: [0.6, 1.0], moistureRange: [0.0, 0.3], heatRange: [0.7, 1.0],
    resources: [
      { itemId: 'obsidian', density: 0.03 }, { itemId: 'fire_crystal', density: 0.035 },
      { itemId: 'rare_ore', density: 0.011 },
    ],
    mobs: ['fire_elemental', 'lava_crawler'], mobDensity: 5,
  },

  // ── Corrupted Lands variants ─────────────────────────────────────────────
  {
    id: 'shadow_realm', name: 'Shadow Realm', color: 0x380066,
    elevationRange: [0.0, 1.0], moistureRange: [0.0, 1.0],
    requiresCorruption: true, metaRequired: 'reach_volcanic_3',
    resources: [
      { itemId: 'shadow_essence', density: 0.05 }, { itemId: 'void_crystal', density: 0.018 },
      { itemId: 'corrupted_wood', density: 0.03 },
    ],
    mobs: ['shadow_beast', 'corrupted_npc'], mobDensity: 6,
  },
  {
    id: 'void_wastes', name: 'Void Wastes', color: 0x220055,
    elevationRange: [0.0, 1.0], moistureRange: [0.0, 1.0],
    requiresCorruption: true, metaRequired: 'reach_volcanic_3',
    resources: [
      { itemId: 'shadow_essence', density: 0.03 }, { itemId: 'void_crystal', density: 0.03 },
      { itemId: 'corrupted_wood', density: 0.025 },
    ],
    mobs: ['shadow_beast', 'corrupted_npc'], mobDensity: 7,
  },
];
