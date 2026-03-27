import { InventorySlot } from '@/types/entities';
import { EventBus } from './EventBus';
import { getItemDef } from '@/config/items';

export class ItemSystem {
  constructor(private eventBus: EventBus) {}

  addItem(inventory: InventorySlot[], itemId: string, count: number): { success: boolean; overflow: number } {
    const def = getItemDef(itemId);
    const maxStack = def?.maxStack ?? 99;
    let remaining = count;
    const existing = inventory.find(slot => slot.itemId === itemId);
    if (existing) {
      const canAdd = maxStack - existing.count;
      const toAdd = Math.min(remaining, canAdd);
      existing.count += toAdd;
      remaining -= toAdd;
    }
    if (remaining > 0 && !existing) {
      const toAdd = Math.min(remaining, maxStack);
      inventory.push({ itemId, count: toAdd });
      remaining -= toAdd;
    }
    this.eventBus.emit('item-picked-up', { itemId, count: count - remaining });
    return { success: remaining < count, overflow: remaining };
  }

  removeItem(inventory: InventorySlot[], itemId: string, count: number): boolean {
    const slot = inventory.find(s => s.itemId === itemId);
    if (!slot || slot.count < count) return false;
    slot.count -= count;
    if (slot.count === 0) inventory.splice(inventory.indexOf(slot), 1);
    return true;
  }

  hasItems(inventory: InventorySlot[], requirements: { item: string; count: number }[]): boolean {
    return requirements.every(req => this.getItemCount(inventory, req.item) >= req.count);
  }

  getItemCount(inventory: InventorySlot[], itemId: string): number {
    return inventory.filter(s => s.itemId === itemId).reduce((sum, s) => sum + s.count, 0);
  }
}
