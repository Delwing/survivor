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
];

export function getRecipeDef(id: string): RecipeDefinition | undefined {
  return RECIPE_DEFINITIONS.find(r => r.id === id);
}
