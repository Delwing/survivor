import { ItemDefinition } from '@/types/items';

export const ITEM_DEFINITIONS: ItemDefinition[] = [
  // Tier 1 Resources
  { id: 'wood', name: 'Wood', type: 'resource', tier: 1, stackable: true, maxStack: 99, quality: 'normal', modifiers: [], color: 0x8b4513 },
  { id: 'stone', name: 'Stone', type: 'resource', tier: 1, stackable: true, maxStack: 99, quality: 'normal', modifiers: [], color: 0x808080 },
  { id: 'berries', name: 'Berries', type: 'consumable', tier: 1, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0xff6347 },
  { id: 'herbs', name: 'Herbs', type: 'resource', tier: 1, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0x32cd32 },
  { id: 'meat', name: 'Meat', type: 'resource', tier: 1, stackable: true, maxStack: 20, quality: 'normal', modifiers: [], color: 0xcd5c5c },
  { id: 'hide', name: 'Hide', type: 'resource', tier: 1, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0xdeb887 },
  { id: 'bone', name: 'Bone', type: 'resource', tier: 1, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0xfffacd },
  { id: 'slime_gel', name: 'Slime Gel', type: 'resource', tier: 1, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0x7fff00 },
  // Tier 2
  { id: 'iron_ore', name: 'Iron Ore', type: 'resource', tier: 2, stackable: true, maxStack: 50, quality: 'normal', modifiers: [], color: 0xa0522d },
  { id: 'copper_ore', name: 'Copper Ore', type: 'resource', tier: 2, stackable: true, maxStack: 50, quality: 'normal', modifiers: [], color: 0xb87333 },
  { id: 'coal', name: 'Coal', type: 'resource', tier: 2, stackable: true, maxStack: 50, quality: 'normal', modifiers: [], color: 0x2f2f2f },
  { id: 'crystal', name: 'Crystal', type: 'resource', tier: 2, stackable: true, maxStack: 20, quality: 'normal', modifiers: [], color: 0x87ceeb },
  { id: 'iron_ingot', name: 'Iron Ingot', type: 'resource', tier: 2, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0xb0c4de },
  { id: 'wood_plank', name: 'Wood Plank', type: 'resource', tier: 1, stackable: true, maxStack: 50, quality: 'normal', modifiers: [], color: 0xdeb887 },
  // Tier 3
  { id: 'rare_mushroom', name: 'Rare Mushroom', type: 'resource', tier: 3, stackable: true, maxStack: 20, quality: 'normal', modifiers: [], color: 0x9932cc },
  { id: 'swamp_reed', name: 'Swamp Reed', type: 'resource', tier: 3, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0x6b8e23 },
  // Tier 4
  { id: 'obsidian', name: 'Obsidian', type: 'resource', tier: 4, stackable: true, maxStack: 20, quality: 'normal', modifiers: [], color: 0x1a1a2e },
  { id: 'fire_crystal', name: 'Fire Crystal', type: 'resource', tier: 4, stackable: true, maxStack: 10, quality: 'normal', modifiers: [], color: 0xff4500 },
  { id: 'rare_ore', name: 'Rare Ore', type: 'resource', tier: 4, stackable: true, maxStack: 15, quality: 'normal', modifiers: [], color: 0xffd700 },
  // Tier 5
  { id: 'shadow_essence', name: 'Shadow Essence', type: 'resource', tier: 5, stackable: true, maxStack: 10, quality: 'normal', modifiers: [], color: 0x2f0047 },
  { id: 'void_crystal', name: 'Void Crystal', type: 'resource', tier: 5, stackable: true, maxStack: 5, quality: 'normal', modifiers: [], color: 0x4b0082 },
  { id: 'corrupted_wood', name: 'Corrupted Wood', type: 'resource', tier: 5, stackable: true, maxStack: 20, quality: 'normal', modifiers: [], color: 0x3d003d },
  // Tools & Weapons
  { id: 'wooden_axe', name: 'Wooden Axe', type: 'tool', tier: 1, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 3 }, color: 0x8b4513 },
  { id: 'wooden_pickaxe', name: 'Wooden Pickaxe', type: 'tool', tier: 1, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 2 }, color: 0x8b4513 },
  { id: 'wooden_sword', name: 'Wooden Sword', type: 'weapon', tier: 1, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 5, attackSpeed: 1.2 }, color: 0xa0522d },
  { id: 'iron_sword', name: 'Iron Sword', type: 'weapon', tier: 2, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 12, attackSpeed: 1.0 }, color: 0xb0c4de },
  { id: 'iron_armor', name: 'Iron Armor', type: 'armor', tier: 2, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { defense: 8 }, color: 0xb0c4de },
  // Consumables
  { id: 'bandage', name: 'Bandage', type: 'consumable', tier: 1, stackable: true, maxStack: 10, quality: 'normal', modifiers: [], color: 0xffffff },
  { id: 'cooked_meat', name: 'Cooked Meat', type: 'consumable', tier: 1, stackable: true, maxStack: 10, quality: 'normal', modifiers: [], color: 0xcd853f },
  { id: 'health_potion', name: 'Health Potion', type: 'consumable', tier: 3, stackable: true, maxStack: 5, quality: 'normal', modifiers: [], color: 0xff0000 },
  // Misc
  { id: 'gold_coin', name: 'Gold Coin', type: 'misc', tier: 1, stackable: true, maxStack: 999, quality: 'normal', modifiers: [], color: 0xffd700 },
];

export function getItemDef(id: string): ItemDefinition | undefined {
  return ITEM_DEFINITIONS.find(item => item.id === id);
}
