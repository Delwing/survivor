export interface EntityStats {
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;        // pixels per second
  attackSpeed: number;  // attacks per second
}

export interface PlayerState {
  id: 'player';
  stats: EntityStats & { hunger: number; maxHunger: number };
  position: { x: number; y: number };
  equipment: {
    weapon: string | null;
    armor: string | null;
    ability1: string | null;
    ability2: string | null;
  };
  inventory: InventorySlot[];
  autoAttackTarget: string | null;
  abilityCooldowns: Record<string, number>;
}

export interface InventorySlot {
  itemId: string;
  count: number;
}

export interface MobState {
  id: string;
  typeId: string;
  stats: EntityStats;
  position: { x: number; y: number };
  aiState: 'idle' | 'patrol' | 'alert' | 'chase' | 'attack' | 'flee' | 'returning';
  homePosition: { x: number; y: number };
  target: string | null;
  leashDistance: number;
  alertRange: number;
  attackRange: number;
  lastAttackTime: number;
  wanderTarget: { x: number; y: number } | null;
  wanderCooldown: number;
}

export type MobCategory = 'passive' | 'aggressive' | 'elite' | 'boss';

export interface MobDefinition {
  id: string;
  name: string;
  category: MobCategory;
  stats: EntityStats;
  alertRange: number;
  attackRange: number;
  leashDistance: number;
  drops: { itemId: string; count: number; chance: number }[];
  biomes: string[];
  spawnWeight: number;
  color: number;
}

export interface NPCState {
  id: string;
  typeId: string;
  assignedResource: string | null;
  storedAmount: number;
  lastGatherTime: number;
}

export interface NPCDefinition {
  id: string;
  name: string;
  hireCost: { item: string; count: number }[];
  gatherType: string;
  gatherRate: number;
  maxStorage: number;
  metaRequired: string | null;
  stats: EntityStats | null;
}
