import { RecipeDefinition } from '@/types/items';

export const RECIPE_DEFINITIONS: RecipeDefinition[] = [
  { id: 'wood_plank', name: 'Wood Plank', tier: 1, station: 'hand', ingredients: [{ item: 'wood', count: 2 }], output: { item: 'wood_plank', count: 3 }, discovery: 'known', metaRequired: null },
  { id: 'wooden_sword', name: 'Wooden Sword', tier: 1, station: 'workbench', ingredients: [{ item: 'wood_plank', count: 3 }, { item: 'wood', count: 1 }], output: { item: 'wooden_sword', count: 1 }, discovery: 'known', metaRequired: null },
  { id: 'wooden_axe', name: 'Wooden Axe', tier: 1, station: 'workbench', ingredients: [{ item: 'wood_plank', count: 2 }, { item: 'wood', count: 2 }], output: { item: 'wooden_axe', count: 1 }, discovery: 'known', metaRequired: null },
  { id: 'wooden_pickaxe', name: 'Wooden Pickaxe', tier: 1, station: 'workbench', ingredients: [{ item: 'wood_plank', count: 2 }, { item: 'wood', count: 2 }], output: { item: 'wooden_pickaxe', count: 1 }, discovery: 'known', metaRequired: null },
  { id: 'bandage', name: 'Bandage', tier: 1, station: 'hand', ingredients: [{ item: 'herbs', count: 2 }], output: { item: 'bandage', count: 2 }, discovery: 'known', metaRequired: null },
  { id: 'cooked_meat', name: 'Cooked Meat', tier: 1, station: 'campfire', ingredients: [{ item: 'meat', count: 1 }], output: { item: 'cooked_meat', count: 1 }, discovery: 'known', metaRequired: null },
  { id: 'iron_ingot', name: 'Iron Ingot', tier: 2, station: 'forge', ingredients: [{ item: 'iron_ore', count: 2 }, { item: 'coal', count: 1 }], output: { item: 'iron_ingot', count: 1 }, discovery: 'material', materialTrigger: 'iron_ore', metaRequired: null },
  { id: 'iron_sword', name: 'Iron Sword', tier: 2, station: 'forge', ingredients: [{ item: 'iron_ingot', count: 3 }, { item: 'wood_plank', count: 1 }], output: { item: 'iron_sword', count: 1 }, discovery: 'material', materialTrigger: 'iron_ingot', metaRequired: null },
  { id: 'iron_armor', name: 'Iron Armor', tier: 2, station: 'forge', ingredients: [{ item: 'iron_ingot', count: 5 }, { item: 'hide', count: 3 }], output: { item: 'iron_armor', count: 1 }, discovery: 'material', materialTrigger: 'iron_ingot', metaRequired: null },
  { id: 'health_potion', name: 'Health Potion', tier: 3, station: 'alchemy_table', ingredients: [{ item: 'rare_mushroom', count: 2 }, { item: 'herbs', count: 3 }, { item: 'slime_gel', count: 1 }], output: { item: 'health_potion', count: 1 }, discovery: 'scroll', metaRequired: null },

  // ── Hand (known) ──
  { id: 'berry_jam', name: 'Berry Jam', tier: 1, station: 'hand', ingredients: [{ item: 'berries', count: 5 }], output: { item: 'berry_jam', count: 1 }, discovery: 'known', metaRequired: null },
  { id: 'herbal_wrap', name: 'Herbal Wrap', tier: 1, station: 'hand', ingredients: [{ item: 'herbs', count: 2 }, { item: 'slime_gel', count: 1 }], output: { item: 'herbal_wrap', count: 2 }, discovery: 'known', metaRequired: null },

  // ── Workbench (known) ──
  { id: 'stone_axe', name: 'Stone Axe', tier: 1, station: 'workbench', ingredients: [{ item: 'stone', count: 3 }, { item: 'wood', count: 2 }], output: { item: 'stone_axe', count: 1 }, discovery: 'known', metaRequired: null },
  { id: 'bone_club', name: 'Bone Club', tier: 1, station: 'workbench', ingredients: [{ item: 'bone', count: 4 }, { item: 'wood_plank', count: 1 }], output: { item: 'bone_club', count: 1 }, discovery: 'known', metaRequired: null },
  { id: 'leather_armor', name: 'Leather Armor', tier: 1, station: 'workbench', ingredients: [{ item: 'hide', count: 5 }, { item: 'bone', count: 2 }], output: { item: 'leather_armor', count: 1 }, discovery: 'known', metaRequired: null },
  { id: 'bone_arrow', name: 'Bone Arrow', tier: 1, station: 'workbench', ingredients: [{ item: 'bone', count: 2 }, { item: 'wood', count: 1 }], output: { item: 'bone_arrow', count: 5 }, discovery: 'known', metaRequired: null },

  // ── Forge (material-triggered) ──
  { id: 'copper_ingot', name: 'Copper Ingot', tier: 2, station: 'forge', ingredients: [{ item: 'copper_ore', count: 2 }, { item: 'coal', count: 1 }], output: { item: 'copper_ingot', count: 1 }, discovery: 'material', materialTrigger: 'copper_ore', metaRequired: null },
  { id: 'copper_sword', name: 'Copper Sword', tier: 2, station: 'forge', ingredients: [{ item: 'copper_ingot', count: 3 }, { item: 'wood_plank', count: 1 }], output: { item: 'copper_sword', count: 1 }, discovery: 'material', materialTrigger: 'copper_ingot', metaRequired: null },
  { id: 'copper_armor', name: 'Copper Armor', tier: 2, station: 'forge', ingredients: [{ item: 'copper_ingot', count: 4 }, { item: 'hide', count: 2 }], output: { item: 'copper_armor', count: 1 }, discovery: 'material', materialTrigger: 'copper_ingot', metaRequired: null },
  { id: 'iron_pickaxe', name: 'Iron Pickaxe', tier: 2, station: 'forge', ingredients: [{ item: 'iron_ingot', count: 2 }, { item: 'wood_plank', count: 2 }], output: { item: 'iron_pickaxe', count: 1 }, discovery: 'material', materialTrigger: 'iron_ingot', metaRequired: null },
  { id: 'iron_axe', name: 'Iron Axe', tier: 2, station: 'forge', ingredients: [{ item: 'iron_ingot', count: 2 }, { item: 'wood_plank', count: 2 }], output: { item: 'iron_axe', count: 1 }, discovery: 'material', materialTrigger: 'iron_ingot', metaRequired: null },
  { id: 'reinforced_armor', name: 'Reinforced Armor', tier: 2, station: 'forge', ingredients: [{ item: 'iron_ingot', count: 3 }, { item: 'copper_ingot', count: 2 }, { item: 'hide', count: 2 }], output: { item: 'reinforced_armor', count: 1 }, discovery: 'material', materialTrigger: 'iron_ingot', metaRequired: null },
  { id: 'lantern', name: 'Lantern', tier: 2, station: 'forge', ingredients: [{ item: 'iron_ingot', count: 1 }, { item: 'crystal', count: 1 }, { item: 'coal', count: 1 }], output: { item: 'lantern', count: 1 }, discovery: 'material', materialTrigger: 'crystal', metaRequired: null },
  { id: 'crystal_lens', name: 'Crystal Lens', tier: 2, station: 'forge', ingredients: [{ item: 'crystal', count: 3 }, { item: 'iron_ingot', count: 1 }], output: { item: 'crystal_lens', count: 1 }, discovery: 'material', materialTrigger: 'crystal', metaRequired: null },

  // ── Alchemy Table (scroll) ──
  { id: 'poison_vial', name: 'Poison Vial', tier: 3, station: 'alchemy_table', ingredients: [{ item: 'rare_mushroom', count: 2 }, { item: 'slime_gel', count: 1 }, { item: 'bone', count: 1 }], output: { item: 'poison_vial', count: 1 }, discovery: 'scroll', metaRequired: null },
  { id: 'antidote', name: 'Antidote', tier: 3, station: 'alchemy_table', ingredients: [{ item: 'herbs', count: 3 }, { item: 'rare_mushroom', count: 2 }, { item: 'crystal', count: 1 }], output: { item: 'antidote', count: 1 }, discovery: 'scroll', metaRequired: null },
  { id: 'swamp_boots', name: 'Swamp Boots', tier: 3, station: 'alchemy_table', ingredients: [{ item: 'swamp_reed', count: 4 }, { item: 'hide', count: 2 }, { item: 'slime_gel', count: 1 }], output: { item: 'swamp_boots', count: 1 }, discovery: 'scroll', metaRequired: null },
  { id: 'reed_bow', name: 'Reed Bow', tier: 3, station: 'alchemy_table', ingredients: [{ item: 'swamp_reed', count: 5 }, { item: 'bone', count: 2 }, { item: 'crystal_lens', count: 1 }], output: { item: 'reed_bow', count: 1 }, discovery: 'scroll', metaRequired: null },
  { id: 'enchanted_sword', name: 'Enchanted Sword', tier: 3, station: 'alchemy_table', ingredients: [{ item: 'iron_sword', count: 1 }, { item: 'crystal_lens', count: 2 }, { item: 'rare_mushroom', count: 1 }], output: { item: 'enchanted_sword', count: 1 }, discovery: 'scroll', metaRequired: null },

  // ── Magma Forge (material-triggered) ──
  { id: 'obsidian_blade', name: 'Obsidian Blade', tier: 4, station: 'magma_forge', ingredients: [{ item: 'obsidian', count: 5 }, { item: 'fire_crystal', count: 2 }, { item: 'iron_ingot', count: 1 }], output: { item: 'obsidian_blade', count: 1 }, discovery: 'material', materialTrigger: 'obsidian', metaRequired: null },
  { id: 'obsidian_armor', name: 'Obsidian Armor', tier: 4, station: 'magma_forge', ingredients: [{ item: 'obsidian', count: 6 }, { item: 'fire_crystal', count: 3 }, { item: 'iron_ingot', count: 2 }], output: { item: 'obsidian_armor', count: 1 }, discovery: 'material', materialTrigger: 'obsidian', metaRequired: null },
  { id: 'fire_potion', name: 'Fire Potion', tier: 4, station: 'magma_forge', ingredients: [{ item: 'fire_crystal', count: 2 }, { item: 'rare_mushroom', count: 1 }, { item: 'slime_gel', count: 1 }], output: { item: 'fire_potion', count: 1 }, discovery: 'material', materialTrigger: 'fire_crystal', metaRequired: null },
  { id: 'magma_pickaxe', name: 'Magma Pickaxe', tier: 4, station: 'magma_forge', ingredients: [{ item: 'obsidian', count: 3 }, { item: 'fire_crystal', count: 1 }, { item: 'wood_plank', count: 2 }], output: { item: 'magma_pickaxe', count: 1 }, discovery: 'material', materialTrigger: 'obsidian', metaRequired: null },
  { id: 'golden_armor', name: 'Golden Armor', tier: 4, station: 'magma_forge', ingredients: [{ item: 'rare_ore', count: 5 }, { item: 'iron_ingot', count: 3 }, { item: 'hide', count: 2 }], output: { item: 'golden_armor', count: 1 }, discovery: 'material', materialTrigger: 'rare_ore', metaRequired: null },

  // ── Void Altar (scroll) ──
  { id: 'void_blade', name: 'Void Blade', tier: 5, station: 'void_altar', ingredients: [{ item: 'void_crystal', count: 3 }, { item: 'shadow_essence', count: 3 }, { item: 'obsidian_blade', count: 1 }], output: { item: 'void_blade', count: 1 }, discovery: 'scroll', metaRequired: null },
  { id: 'shadow_cloak', name: 'Shadow Cloak', tier: 5, station: 'void_altar', ingredients: [{ item: 'shadow_essence', count: 5 }, { item: 'void_crystal', count: 2 }, { item: 'corrupted_wood', count: 3 }], output: { item: 'shadow_cloak', count: 1 }, discovery: 'scroll', metaRequired: null },
  { id: 'purification_potion', name: 'Purification Potion', tier: 5, station: 'void_altar', ingredients: [{ item: 'void_crystal', count: 2 }, { item: 'rare_mushroom', count: 3 }, { item: 'crystal_lens', count: 1 }], output: { item: 'purification_potion', count: 1 }, discovery: 'scroll', metaRequired: null },
];

export function getRecipeDef(id: string): RecipeDefinition | undefined {
  return RECIPE_DEFINITIONS.find(r => r.id === id);
}
