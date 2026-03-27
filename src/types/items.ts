export type ItemType = 'resource' | 'tool' | 'weapon' | 'armor' | 'consumable' | 'ability' | 'misc';
export type ItemQuality = 'normal' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type CraftingStation = 'hand' | 'campfire' | 'workbench' | 'forge' | 'alchemy_table' | 'magma_forge' | 'void_altar';
export type DiscoveryMethod = 'known' | 'material' | 'scroll' | 'experiment' | 'meta';

export interface ItemModifier {
  type: string;
  value: number;
}

export interface ItemDefinition {
  id: string;
  name: string;
  type: ItemType;
  tier: 1 | 2 | 3 | 4 | 5;
  stackable: boolean;
  maxStack: number;
  quality: ItemQuality;
  modifiers: ItemModifier[];
  stats?: Partial<{
    health: number;
    maxHealth: number;
    attack: number;
    defense: number;
    speed: number;
    attackSpeed: number;
  }>;
  color: number;
}

export interface RecipeDefinition {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4 | 5;
  station: CraftingStation;
  ingredients: { item: string; count: number }[];
  output: { item: string; count: number };
  discovery: DiscoveryMethod;
  metaRequired: string | null;
  materialTrigger?: string;
}
