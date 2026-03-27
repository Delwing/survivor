export interface BiomeDefinition {
  id: string;
  name: string;
  color: number;
  elevationRange: [number, number];
  moistureRange: [number, number];
  heatRange?: [number, number];
  requiresCorruption?: boolean;
  metaRequired?: string | null;
  resources: { itemId: string; density: number }[];
  mobs: string[];
  mobDensity: number;
}

export interface Tile {
  biomeId: string;
  elevation: number;
  resourceNodeId: string | null;
  walkable: boolean;
}

export interface Chunk {
  x: number;
  y: number;
  tiles: Tile[][];
  entities: string[];
  generated: boolean;
}

export interface WorldState {
  seed: string;
  chunks: Map<string, Chunk>;
  spawnChunk: { x: number; y: number };
}
