import { describe, it, expect, vi } from 'vitest';
import { CraftingSystem } from '@/systems/CraftingSystem';
import { ItemSystem } from '@/systems/ItemSystem';
import { EventBus } from '@/systems/EventBus';
import { InventorySlot } from '@/types/entities';

describe('CraftingSystem', () => {
  function setup() {
    const bus = new EventBus();
    const itemSystem = new ItemSystem(bus);
    const crafting = new CraftingSystem(bus, itemSystem);
    return { bus, itemSystem, crafting };
  }
  it('canCraft returns true when player has all ingredients', () => {
    const { crafting } = setup();
    const inv: InventorySlot[] = [{ itemId: 'wood', count: 10 }];
    expect(crafting.canCraft('wood_plank', inv, new Set(['wood_plank']), 'hand')).toBe(true);
  });
  it('canCraft returns false when missing ingredients', () => {
    const { crafting } = setup();
    const inv: InventorySlot[] = [{ itemId: 'wood', count: 1 }];
    expect(crafting.canCraft('wood_plank', inv, new Set(['wood_plank']), 'hand')).toBe(false);
  });
  it('canCraft returns false when recipe is not discovered', () => {
    const { crafting } = setup();
    const inv: InventorySlot[] = [{ itemId: 'wood', count: 10 }];
    expect(crafting.canCraft('wood_plank', inv, new Set<string>(), 'hand')).toBe(false);
  });
  it('canCraft returns false when at wrong station', () => {
    const { crafting } = setup();
    const inv: InventorySlot[] = [{ itemId: 'wood_plank', count: 5 }, { itemId: 'wood', count: 5 }];
    const known = new Set(['wooden_sword']);
    expect(crafting.canCraft('wooden_sword', inv, known, 'hand')).toBe(false);
    expect(crafting.canCraft('wooden_sword', inv, known, 'workbench')).toBe(true);
  });
  it('higher-tier stations can craft lower-tier recipes', () => {
    const { crafting } = setup();
    const inv: InventorySlot[] = [{ itemId: 'wood', count: 10 }];
    const known = new Set(['wood_plank']);
    // wood_plank requires 'hand' — workbench and forge should also work
    expect(crafting.canCraft('wood_plank', inv, known, 'hand')).toBe(true);
    expect(crafting.canCraft('wood_plank', inv, known, 'workbench')).toBe(true);
    expect(crafting.canCraft('wood_plank', inv, known, 'forge')).toBe(true);
  });
  it('craft removes ingredients and adds output', () => {
    const { crafting } = setup();
    const inv: InventorySlot[] = [{ itemId: 'wood', count: 10 }];
    expect(crafting.craft('wood_plank', inv, new Set(['wood_plank']), 'hand')).toBe(true);
    expect(inv.find(s => s.itemId === 'wood')?.count).toBe(8);
    expect(inv.find(s => s.itemId === 'wood_plank')?.count).toBe(3);
  });
  it('craft emits item-crafted event', () => {
    const { bus, crafting } = setup();
    const handler = vi.fn();
    bus.on('item-crafted', handler);
    crafting.craft('wood_plank', [{ itemId: 'wood', count: 10 }], new Set(['wood_plank']), 'hand');
    expect(handler).toHaveBeenCalledWith({ recipeId: 'wood_plank' });
  });
  it('getKnownRecipes returns only known recipes', () => {
    const { crafting } = setup();
    const recipes = crafting.getKnownRecipes(new Set(['wood_plank', 'bandage']));
    expect(recipes.length).toBe(2);
    expect(recipes.map(r => r.id)).toContain('wood_plank');
  });
  it('getStartingRecipes returns all "known" discovery recipes', () => {
    const { crafting } = setup();
    const starting = crafting.getStartingRecipes();
    expect(starting.length).toBeGreaterThan(0);
    expect(starting.every(r => r.discovery === 'known')).toBe(true);
  });
  it('checkMaterialDiscovery returns recipes triggered by a material', () => {
    const { crafting } = setup();
    const discovered = crafting.checkMaterialDiscovery('iron_ore');
    expect(discovered.some(r => r.id === 'iron_ingot')).toBe(true);
  });
});
