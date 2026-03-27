import { NPCState, InventorySlot } from '@/types/entities';
import { EventBus } from './EventBus';
import { ItemSystem } from './ItemSystem';
import { getNPCDef } from '@/config/npcs';

export class NPCSystem {
  constructor(private eventBus: EventBus, private itemSystem: ItemSystem) {}

  hire(npcTypeId: string, inventory: InventorySlot[], npcs: NPCState[], unlockedTypes: Set<string>): boolean {
    if (!unlockedTypes.has(npcTypeId)) return false;
    const def = getNPCDef(npcTypeId);
    if (!def) return false;
    if (!this.itemSystem.hasItems(inventory, def.hireCost)) return false;
    for (const cost of def.hireCost) this.itemSystem.removeItem(inventory, cost.item, cost.count);
    npcs.push({ id: `npc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, typeId: npcTypeId, assignedResource: null, storedAmount: 0, lastGatherTime: Date.now() });
    this.eventBus.emit('npc-hired', { npcTypeId });
    return true;
  }

  assignResource(npc: NPCState, resourceId: string): void { npc.assignedResource = resourceId; npc.lastGatherTime = Date.now(); }

  updateGathering(npc: NPCState, elapsedMs: number): void {
    if (!npc.assignedResource) return;
    const def = getNPCDef(npc.typeId);
    if (!def) return;
    const gathered = Math.floor((elapsedMs / 60000) * def.gatherRate);
    if (gathered > 0) { npc.storedAmount = Math.min(def.maxStorage, npc.storedAmount + gathered); npc.lastGatherTime += elapsedMs; }
  }

  collect(npc: NPCState, inventory: InventorySlot[]): void {
    if (npc.storedAmount <= 0 || !npc.assignedResource) return;
    const amount = npc.storedAmount;
    const itemId = npc.assignedResource;
    this.itemSystem.addItem(inventory, itemId, amount);
    npc.storedAmount = 0;
    this.eventBus.emit('npc-collected', { npcId: npc.id, itemId, count: amount });
  }
}
