import { NPCDefinition } from '@/types/entities';

export const NPC_DEFINITIONS: NPCDefinition[] = [
  { id: 'woodcutter', name: 'Woodcutter', hireCost: [{ item: 'gold_coin', count: 5 }], gatherType: 'wood', gatherRate: 2, maxStorage: 20, metaRequired: null, stats: null },
  { id: 'miner', name: 'Miner', hireCost: [{ item: 'gold_coin', count: 8 }], gatherType: 'stone', gatherRate: 1.5, maxStorage: 15, metaRequired: 'unlock_miner', stats: null },
  { id: 'herbalist', name: 'Herbalist', hireCost: [{ item: 'gold_coin', count: 10 }], gatherType: 'herbs', gatherRate: 1, maxStorage: 10, metaRequired: 'unlock_herbalist', stats: null },
];

export function getNPCDef(id: string): NPCDefinition | undefined { return NPC_DEFINITIONS.find(n => n.id === id); }
