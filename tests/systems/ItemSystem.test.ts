import { describe, it, expect, vi } from 'vitest';
import { ItemSystem } from '@/systems/ItemSystem';
import { EventBus } from '@/systems/EventBus';
import { InventorySlot } from '@/types/entities';

describe('ItemSystem', () => {
  function makeInventory(): InventorySlot[] { return []; }

  it('adds a new item to empty inventory', () => {
    const system = new ItemSystem(new EventBus());
    const inv = makeInventory();
    const result = system.addItem(inv, 'wood', 5);
    expect(result.success).toBe(true);
    expect(inv).toContainEqual({ itemId: 'wood', count: 5 });
  });
  it('stacks items in existing slot', () => {
    const system = new ItemSystem(new EventBus());
    const inv: InventorySlot[] = [{ itemId: 'wood', count: 10 }];
    system.addItem(inv, 'wood', 5);
    expect(inv[0].count).toBe(15);
  });
  it('respects max stack size', () => {
    const system = new ItemSystem(new EventBus());
    const inv: InventorySlot[] = [{ itemId: 'wood', count: 95 }];
    const result = system.addItem(inv, 'wood', 10);
    expect(inv[0].count).toBe(99);
    expect(result.overflow).toBe(6);
  });
  it('removes items from inventory', () => {
    const system = new ItemSystem(new EventBus());
    const inv: InventorySlot[] = [{ itemId: 'wood', count: 10 }];
    expect(system.removeItem(inv, 'wood', 3)).toBe(true);
    expect(inv[0].count).toBe(7);
  });
  it('removes slot when count reaches 0', () => {
    const system = new ItemSystem(new EventBus());
    const inv: InventorySlot[] = [{ itemId: 'wood', count: 5 }];
    system.removeItem(inv, 'wood', 5);
    expect(inv.length).toBe(0);
  });
  it('returns false when removing more than available', () => {
    const system = new ItemSystem(new EventBus());
    const inv: InventorySlot[] = [{ itemId: 'wood', count: 3 }];
    expect(system.removeItem(inv, 'wood', 5)).toBe(false);
    expect(inv[0].count).toBe(3);
  });
  it('checks if inventory has enough items', () => {
    const system = new ItemSystem(new EventBus());
    const inv: InventorySlot[] = [{ itemId: 'wood', count: 10 }, { itemId: 'stone', count: 5 }];
    expect(system.hasItems(inv, [{ item: 'wood', count: 5 }])).toBe(true);
    expect(system.hasItems(inv, [{ item: 'wood', count: 15 }])).toBe(false);
    expect(system.hasItems(inv, [{ item: 'iron_ore', count: 1 }])).toBe(false);
  });
  it('emits item-picked-up event on addItem', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('item-picked-up', handler);
    new ItemSystem(bus).addItem([], 'wood', 3);
    expect(handler).toHaveBeenCalledWith({ itemId: 'wood', count: 3 });
  });
  it('getItemCount returns total count across slots', () => {
    const system = new ItemSystem(new EventBus());
    const inv: InventorySlot[] = [{ itemId: 'wood', count: 10 }, { itemId: 'stone', count: 5 }];
    expect(system.getItemCount(inv, 'wood')).toBe(10);
    expect(system.getItemCount(inv, 'iron_ore')).toBe(0);
  });
});
