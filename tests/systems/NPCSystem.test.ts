import { describe, it, expect, vi } from 'vitest';
import { NPCSystem } from '@/systems/NPCSystem';
import { ItemSystem } from '@/systems/ItemSystem';
import { EventBus } from '@/systems/EventBus';
import { InventorySlot, NPCState } from '@/types/entities';

describe('NPCSystem', () => {
  function setup() { const bus = new EventBus(); return { bus, itemSystem: new ItemSystem(bus), npcSystem: new NPCSystem(bus, new ItemSystem(bus)) }; }

  it('hires an NPC when player has enough resources', () => {
    const { npcSystem } = setup();
    const inv: InventorySlot[] = [{ itemId: 'gold_coin', count: 10 }];
    const npcs: NPCState[] = [];
    expect(npcSystem.hire('woodcutter', inv, npcs, new Set(['woodcutter']))).toBe(true);
    expect(npcs.length).toBe(1);
    expect(inv[0].count).toBe(5);
  });
  it('refuses to hire when player cannot afford', () => {
    const { npcSystem } = setup();
    const inv: InventorySlot[] = [{ itemId: 'gold_coin', count: 2 }];
    expect(npcSystem.hire('woodcutter', inv, [], new Set(['woodcutter']))).toBe(false);
  });
  it('refuses to hire NPC type not yet unlocked', () => {
    const { npcSystem } = setup();
    expect(npcSystem.hire('woodcutter', [{ itemId: 'gold_coin', count: 20 }], [], new Set())).toBe(false);
  });
  it('assigns resource to NPC', () => {
    const { npcSystem } = setup();
    const npc: NPCState = { id: 'npc1', typeId: 'woodcutter', assignedResource: null, storedAmount: 0, lastGatherTime: 0 };
    npcSystem.assignResource(npc, 'wood');
    expect(npc.assignedResource).toBe('wood');
  });
  it('gathers resources over time', () => {
    const { npcSystem } = setup();
    const npc: NPCState = { id: 'npc1', typeId: 'woodcutter', assignedResource: 'wood', storedAmount: 0, lastGatherTime: 0 };
    npcSystem.updateGathering(npc, 60000);
    expect(npc.storedAmount).toBe(2);
  });
  it('respects max storage', () => {
    const { npcSystem } = setup();
    const npc: NPCState = { id: 'npc1', typeId: 'woodcutter', assignedResource: 'wood', storedAmount: 19, lastGatherTime: 0 };
    npcSystem.updateGathering(npc, 60000);
    expect(npc.storedAmount).toBe(20);
  });
  it('collects resources from NPC into inventory', () => {
    const { bus, npcSystem } = setup();
    const handler = vi.fn();
    bus.on('npc-collected', handler);
    const npc: NPCState = { id: 'npc1', typeId: 'woodcutter', assignedResource: 'wood', storedAmount: 10, lastGatherTime: 0 };
    const inv: InventorySlot[] = [];
    npcSystem.collect(npc, inv);
    expect(npc.storedAmount).toBe(0);
    expect(inv[0]).toEqual({ itemId: 'wood', count: 10 });
    expect(handler).toHaveBeenCalledWith({ npcId: 'npc1', itemId: 'wood', count: 10 });
  });
  it('does not gather if no resource assigned', () => {
    const { npcSystem } = setup();
    const npc: NPCState = { id: 'npc1', typeId: 'woodcutter', assignedResource: null, storedAmount: 0, lastGatherTime: 0 };
    npcSystem.updateGathering(npc, 60000);
    expect(npc.storedAmount).toBe(0);
  });
});
