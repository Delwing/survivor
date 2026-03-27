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
  { id: 'recipe_scroll', name: 'Recipe Scroll', type: 'misc', tier: 1, stackable: true, maxStack: 10, quality: 'normal', modifiers: [], color: 0xf5e6c8 },

  // ── Tier 1 Crafted (forest resources) ──
  { id: 'bone_club', name: 'Bone Club', type: 'weapon', tier: 1, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 7, attackSpeed: 0.8 }, color: 0xfffacd },
  { id: 'leather_armor', name: 'Leather Armor', type: 'armor', tier: 1, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { defense: 3 }, color: 0xdeb887 },
  { id: 'stone_axe', name: 'Stone Axe', type: 'tool', tier: 1, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 5 }, color: 0x808080 },
  { id: 'bone_arrow', name: 'Bone Arrow', type: 'consumable', tier: 1, stackable: true, maxStack: 20, quality: 'normal', modifiers: [], color: 0xfffacd },
  { id: 'herbal_wrap', name: 'Herbal Wrap', type: 'consumable', tier: 1, stackable: true, maxStack: 10, quality: 'normal', modifiers: [], color: 0x32cd32 },
  { id: 'berry_jam', name: 'Berry Jam', type: 'consumable', tier: 1, stackable: true, maxStack: 10, quality: 'normal', modifiers: [], color: 0xff6347 },

  // ── Tier 2 Crafted (highlands resources) ──
  { id: 'copper_ingot', name: 'Copper Ingot', type: 'resource', tier: 2, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0xb87333 },
  { id: 'copper_sword', name: 'Copper Sword', type: 'weapon', tier: 2, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 8, attackSpeed: 1.4 }, color: 0xb87333 },
  { id: 'copper_armor', name: 'Copper Armor', type: 'armor', tier: 2, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { defense: 5 }, color: 0xb87333 },
  { id: 'crystal_lens', name: 'Crystal Lens', type: 'misc', tier: 2, stackable: true, maxStack: 5, quality: 'normal', modifiers: [], color: 0x87ceeb },
  { id: 'iron_pickaxe', name: 'Iron Pickaxe', type: 'tool', tier: 2, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 4 }, color: 0xb0c4de },
  { id: 'iron_axe', name: 'Iron Axe', type: 'tool', tier: 2, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 6 }, color: 0xb0c4de },
  { id: 'reinforced_armor', name: 'Reinforced Armor', type: 'armor', tier: 2, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { defense: 12 }, color: 0xb0c4de },
  { id: 'lantern', name: 'Lantern', type: 'tool', tier: 2, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], color: 0xf0c040 },

  // ── Tier 3 Crafted (swamp resources) ──
  { id: 'poison_vial', name: 'Poison Vial', type: 'consumable', tier: 3, stackable: true, maxStack: 5, quality: 'normal', modifiers: [], color: 0x7fff00 },
  { id: 'reed_bow', name: 'Reed Bow', type: 'weapon', tier: 3, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 10, attackSpeed: 1.8 }, color: 0x6b8e23 },
  { id: 'antidote', name: 'Antidote', type: 'consumable', tier: 3, stackable: true, maxStack: 5, quality: 'normal', modifiers: [], color: 0x32cd32 },
  { id: 'swamp_boots', name: 'Swamp Boots', type: 'armor', tier: 3, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { defense: 2, speed: 20 }, color: 0x3d6b3d },
  { id: 'enchanted_sword', name: 'Enchanted Sword', type: 'weapon', tier: 3, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 16, attackSpeed: 1.1 }, color: 0x87ceeb },

  // ── Tier 4 Crafted (volcanic resources) ──
  { id: 'obsidian_blade', name: 'Obsidian Blade', type: 'weapon', tier: 4, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 22, attackSpeed: 0.9 }, color: 0x1a1a2e },
  { id: 'obsidian_armor', name: 'Obsidian Armor', type: 'armor', tier: 4, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { defense: 15 }, color: 0x1a1a2e },
  { id: 'fire_potion', name: 'Fire Potion', type: 'consumable', tier: 4, stackable: true, maxStack: 3, quality: 'normal', modifiers: [], color: 0xff4500 },
  { id: 'magma_pickaxe', name: 'Magma Pickaxe', type: 'tool', tier: 4, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 8 }, color: 0xff4500 },
  { id: 'golden_armor', name: 'Golden Armor', type: 'armor', tier: 4, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { defense: 10, speed: 10 }, color: 0xffd700 },

  // ── Tier 5 Crafted (corrupted resources) ──
  { id: 'void_blade', name: 'Void Blade', type: 'weapon', tier: 5, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 30, attackSpeed: 1.2 }, color: 0x4b0082 },
  { id: 'shadow_cloak', name: 'Shadow Cloak', type: 'armor', tier: 5, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { defense: 18, speed: 15 }, color: 0x2f0047 },
  { id: 'purification_potion', name: 'Purification Potion', type: 'consumable', tier: 5, stackable: true, maxStack: 3, quality: 'normal', modifiers: [], color: 0xc070f0 },
];

export function getItemDef(id: string): ItemDefinition | undefined {
  return ITEM_DEFINITIONS.find(item => item.id === id);
}
