import { ItemDefinition } from '@/types/items';

export const ITEM_DEFINITIONS: ItemDefinition[] = [
  // ── Tier 1 Resources ──
  { id: 'wood', name: 'Wood', description: 'Common timber. Used for planks, tools, and building.', type: 'resource', tier: 1, stackable: true, maxStack: 99, quality: 'normal', modifiers: [], color: 0x8b4513 },
  { id: 'stone', name: 'Stone', description: 'Sturdy rock. Used for axes and building stations.', type: 'resource', tier: 1, stackable: true, maxStack: 99, quality: 'normal', modifiers: [], color: 0x808080 },
  { id: 'berries', name: 'Berries', description: 'Eat to restore 3 hunger. Better as jam.', type: 'consumable', tier: 1, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0xff6347 },
  { id: 'herbs', name: 'Herbs', description: 'Medicinal plants. Used for bandages, wraps, and potions.', type: 'resource', tier: 1, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0x32cd32 },
  { id: 'meat', name: 'Meat', description: 'Raw meat from wildlife. Cook at a campfire to eat.', type: 'resource', tier: 1, stackable: true, maxStack: 20, quality: 'normal', modifiers: [], color: 0xcd5c5c },
  { id: 'hide', name: 'Hide', description: 'Animal skin. Used for leather armor and reinforced gear.', type: 'resource', tier: 1, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0xdeb887 },
  { id: 'bone', name: 'Bone', description: 'Sturdy bone. Used for clubs, arrows, and alchemy.', type: 'resource', tier: 1, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0xfffacd },
  { id: 'slime_gel', name: 'Slime Gel', description: 'Sticky substance. Used in wraps, potions, and poisons.', type: 'resource', tier: 1, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0x7fff00 },

  // ── Tier 2 Resources ──
  { id: 'iron_ore', name: 'Iron Ore', description: 'Raw iron. Smelt at a forge with coal to make ingots.', type: 'resource', tier: 2, stackable: true, maxStack: 50, quality: 'normal', modifiers: [], color: 0xa0522d },
  { id: 'copper_ore', name: 'Copper Ore', description: 'Raw copper. Smelt at a forge with coal to make ingots.', type: 'resource', tier: 2, stackable: true, maxStack: 50, quality: 'normal', modifiers: [], color: 0xb87333 },
  { id: 'coal', name: 'Coal', description: 'Fuel for smelting. Required to forge any metal ingot.', type: 'resource', tier: 2, stackable: true, maxStack: 50, quality: 'normal', modifiers: [], color: 0x2f2f2f },
  { id: 'crystal', name: 'Crystal', description: 'Shimmering mineral. Used for lenses, enchanting, and lanterns.', type: 'resource', tier: 2, stackable: true, maxStack: 20, quality: 'normal', modifiers: [], color: 0x87ceeb },
  { id: 'iron_ingot', name: 'Iron Ingot', description: 'Refined iron bar. Core material for mid-tier gear.', type: 'resource', tier: 2, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0xb0c4de },
  { id: 'wood_plank', name: 'Wood Plank', description: 'Processed timber. Used in most crafting recipes.', type: 'resource', tier: 1, stackable: true, maxStack: 50, quality: 'normal', modifiers: [], color: 0xdeb887 },

  // ── Tier 3 Resources ──
  { id: 'rare_mushroom', name: 'Rare Mushroom', description: 'Potent fungus from the swamp. Key alchemy ingredient.', type: 'resource', tier: 3, stackable: true, maxStack: 20, quality: 'normal', modifiers: [], color: 0x9932cc },
  { id: 'swamp_reed', name: 'Swamp Reed', description: 'Flexible fibrous stalk. Used for bows and boots.', type: 'resource', tier: 3, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0x6b8e23 },

  // ── Tier 4 Resources ──
  { id: 'obsidian', name: 'Obsidian', description: 'Volcanic glass. Extremely hard. Makes devastating blades.', type: 'resource', tier: 4, stackable: true, maxStack: 20, quality: 'normal', modifiers: [], color: 0x1a1a2e },
  { id: 'fire_crystal', name: 'Fire Crystal', description: 'Blazing crystal from lava. Used for fire gear and potions.', type: 'resource', tier: 4, stackable: true, maxStack: 10, quality: 'normal', modifiers: [], color: 0xff4500 },
  { id: 'rare_ore', name: 'Rare Ore', description: 'Gleaming golden mineral. Forged into lightweight armor.', type: 'resource', tier: 4, stackable: true, maxStack: 15, quality: 'normal', modifiers: [], color: 0xffd700 },

  // ── Tier 5 Resources ──
  { id: 'shadow_essence', name: 'Shadow Essence', description: 'Corrupted energy given form. Endgame crafting material.', type: 'resource', tier: 5, stackable: true, maxStack: 10, quality: 'normal', modifiers: [], color: 0x2f0047 },
  { id: 'void_crystal', name: 'Void Crystal', description: 'Crystal from beyond. The rarest material in existence.', type: 'resource', tier: 5, stackable: true, maxStack: 5, quality: 'normal', modifiers: [], color: 0x4b0082 },
  { id: 'corrupted_wood', name: 'Corrupted Wood', description: 'Twisted timber infused with dark energy.', type: 'resource', tier: 5, stackable: true, maxStack: 20, quality: 'normal', modifiers: [], color: 0x3d003d },

  // ── Tier 1 Tools & Weapons ──
  { id: 'wooden_axe', name: 'Wooden Axe', description: 'Basic axe. ATK +3. Better than bare hands.', type: 'tool', tier: 1, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 3 }, color: 0x8b4513 },
  { id: 'wooden_pickaxe', name: 'Wooden Pickaxe', description: 'Basic pickaxe. ATK +2. Gets the job done.', type: 'tool', tier: 1, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 2 }, color: 0x8b4513 },
  { id: 'wooden_sword', name: 'Wooden Sword', description: 'A light wooden blade. ATK +5, fast attacks.', type: 'weapon', tier: 1, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 5, attackSpeed: 1.2 }, color: 0xa0522d },

  // ── Tier 2 Weapons & Armor ──
  { id: 'iron_sword', name: 'Iron Sword', description: 'Reliable steel blade. ATK +12. The workhorse weapon.', type: 'weapon', tier: 2, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 12, attackSpeed: 1.0 }, color: 0xb0c4de },
  { id: 'iron_armor', name: 'Iron Armor', description: 'Heavy iron plates. DEF +8. Solid mid-tier protection.', type: 'armor', tier: 2, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { defense: 8 }, color: 0xb0c4de },

  // ── Consumables ──
  { id: 'bandage', name: 'Bandage', description: 'Heals 20 HP. Quick field medicine from herbs.', type: 'consumable', tier: 1, stackable: true, maxStack: 10, quality: 'normal', modifiers: [], color: 0xffffff },
  { id: 'cooked_meat', name: 'Cooked Meat', description: 'Heals 15 HP, restores 30 hunger. Campfire-cooked.', type: 'consumable', tier: 1, stackable: true, maxStack: 10, quality: 'normal', modifiers: [], color: 0xcd853f },
  { id: 'health_potion', name: 'Health Potion', description: 'Heals 40 HP. Brewed from rare mushrooms and herbs.', type: 'consumable', tier: 3, stackable: true, maxStack: 5, quality: 'normal', modifiers: [], color: 0xff0000 },

  // ── Misc ──
  { id: 'gold_coin', name: 'Gold Coin', description: 'Currency. Used to hire NPC workers.', type: 'misc', tier: 1, stackable: true, maxStack: 999, quality: 'normal', modifiers: [], color: 0xffd700 },
  { id: 'recipe_scroll', name: 'Recipe Scroll', description: 'Ancient knowledge. Teaches a random undiscovered recipe.', type: 'misc', tier: 1, stackable: true, maxStack: 10, quality: 'normal', modifiers: [], color: 0xf5e6c8 },

  // ── Tier 1 Crafted (forest resources) ──
  { id: 'bone_club', name: 'Bone Club', description: 'Heavy and slow but hits hard. ATK +7, slow speed.', type: 'weapon', tier: 1, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 7, attackSpeed: 0.8 }, color: 0xfffacd },
  { id: 'leather_armor', name: 'Leather Armor', description: 'Light protection from animal hide. DEF +3.', type: 'armor', tier: 1, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { defense: 3 }, color: 0xdeb887 },
  { id: 'stone_axe', name: 'Stone Axe', description: 'Sturdier than wood. ATK +5. Good for early combat.', type: 'tool', tier: 1, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 5 }, color: 0x808080 },
  { id: 'bone_arrow', name: 'Bone Arrow', description: 'Ammo for bows. Consumed on use.', type: 'consumable', tier: 1, stackable: true, maxStack: 20, quality: 'normal', modifiers: [], color: 0xfffacd },
  { id: 'herbal_wrap', name: 'Herbal Wrap', description: 'Heals 30 HP. Made from herbs and slime gel.', type: 'consumable', tier: 1, stackable: true, maxStack: 10, quality: 'normal', modifiers: [], color: 0x32cd32 },
  { id: 'berry_jam', name: 'Berry Jam', description: 'Restores 40 hunger. Sweet preserved berries.', type: 'consumable', tier: 1, stackable: true, maxStack: 10, quality: 'normal', modifiers: [], color: 0xff6347 },

  // ── Tier 2 Crafted (highlands resources) ──
  { id: 'copper_ingot', name: 'Copper Ingot', description: 'Refined copper bar. Used for fast, lightweight gear.', type: 'resource', tier: 2, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0xb87333 },
  { id: 'copper_sword', name: 'Copper Sword', description: 'Fast and light. ATK +8, very fast attacks. Outpaces iron.', type: 'weapon', tier: 2, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 8, attackSpeed: 1.4 }, color: 0xb87333 },
  { id: 'copper_armor', name: 'Copper Armor', description: 'Lighter than iron. DEF +5. Good for mobile fighters.', type: 'armor', tier: 2, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { defense: 5 }, color: 0xb87333 },
  { id: 'crystal_lens', name: 'Crystal Lens', description: 'Polished crystal component. Used for enchanting and alchemy.', type: 'misc', tier: 2, stackable: true, maxStack: 5, quality: 'normal', modifiers: [], color: 0x87ceeb },
  { id: 'iron_pickaxe', name: 'Iron Pickaxe', description: 'Sturdy mining tool. ATK +4. Mines faster.', type: 'tool', tier: 2, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 4 }, color: 0xb0c4de },
  { id: 'iron_axe', name: 'Iron Axe', description: 'Heavy-duty axe. ATK +6. Chops and fights.', type: 'tool', tier: 2, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 6 }, color: 0xb0c4de },
  { id: 'reinforced_armor', name: 'Reinforced Armor', description: 'Iron and copper layered plates. DEF +12. Best tier 2 armor.', type: 'armor', tier: 2, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { defense: 12 }, color: 0xb0c4de },
  { id: 'lantern', name: 'Lantern', description: 'Illuminates the area. Crystal-powered light source.', type: 'tool', tier: 2, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], color: 0xf0c040 },

  // ── Tier 3 Crafted (swamp resources) ──
  { id: 'poison_vial', name: 'Poison Vial', description: 'Throwable poison. Damages enemies over time.', type: 'consumable', tier: 3, stackable: true, maxStack: 5, quality: 'normal', modifiers: [], color: 0x7fff00 },
  { id: 'reed_bow', name: 'Reed Bow', description: 'Rapid-fire ranged weapon. ATK +10, very fast attacks.', type: 'weapon', tier: 3, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 10, attackSpeed: 1.8 }, color: 0x6b8e23 },
  { id: 'antidote', name: 'Antidote', description: 'Powerful remedy. Heals 30 HP instantly.', type: 'consumable', tier: 3, stackable: true, maxStack: 5, quality: 'normal', modifiers: [], color: 0x32cd32 },
  { id: 'swamp_boots', name: 'Swamp Boots', description: 'Woven reed boots. DEF +2, SPD +20. Move faster!', type: 'armor', tier: 3, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { defense: 2, speed: 20 }, color: 0x3d6b3d },
  { id: 'enchanted_sword', name: 'Enchanted Sword', description: 'Crystal-infused blade. ATK +16, fast. Best pre-volcanic weapon.', type: 'weapon', tier: 3, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 16, attackSpeed: 1.1 }, color: 0x87ceeb },

  // ── Tier 4 Crafted (volcanic resources) ──
  { id: 'obsidian_blade', name: 'Obsidian Blade', description: 'Razor-sharp volcanic glass. ATK +22. Devastatingly powerful.', type: 'weapon', tier: 4, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 22, attackSpeed: 0.9 }, color: 0x1a1a2e },
  { id: 'obsidian_armor', name: 'Obsidian Armor', description: 'Near-impenetrable volcanic plates. DEF +15.', type: 'armor', tier: 4, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { defense: 15 }, color: 0x1a1a2e },
  { id: 'fire_potion', name: 'Fire Potion', description: 'Explosive concoction. Deals burst damage to nearby enemies.', type: 'consumable', tier: 4, stackable: true, maxStack: 3, quality: 'normal', modifiers: [], color: 0xff4500 },
  { id: 'magma_pickaxe', name: 'Magma Pickaxe', description: 'Superheated pick. ATK +8. Mines anything effortlessly.', type: 'tool', tier: 4, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 8 }, color: 0xff4500 },
  { id: 'golden_armor', name: 'Golden Armor', description: 'Lightweight and gleaming. DEF +10, SPD +10. Fast and tough.', type: 'armor', tier: 4, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { defense: 10, speed: 10 }, color: 0xffd700 },

  // ── Tier 5 Crafted (corrupted resources) ──
  { id: 'void_blade', name: 'Void Blade', description: 'The ultimate weapon. ATK +30, fast attacks. Cuts through anything.', type: 'weapon', tier: 5, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 30, attackSpeed: 1.2 }, color: 0x4b0082 },
  { id: 'shadow_cloak', name: 'Shadow Cloak', description: 'Woven from shadow and void. DEF +18, SPD +15. Best armor.', type: 'armor', tier: 5, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { defense: 18, speed: 15 }, color: 0x2f0047 },
  { id: 'purification_potion', name: 'Purification Potion', description: 'Fully restores all HP. The rarest healing item.', type: 'consumable', tier: 5, stackable: true, maxStack: 3, quality: 'normal', modifiers: [], color: 0xc070f0 },
];

export function getItemDef(id: string): ItemDefinition | undefined {
  return ITEM_DEFINITIONS.find(item => item.id === id);
}
