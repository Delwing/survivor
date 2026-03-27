import { Chunk, Tile } from '@/types/world';
import { CHUNK_SIZE, WORLD_SCALE, ACTIVE_RADIUS } from '@/config/game-config';
import { BIOME_DEFINITIONS } from '@/config/biomes';
import { NoiseGenerator } from './NoiseGenerator';
import { chunkKey } from '@/utils/math';

export class WorldSystem {
  private chunks = new Map<string, Chunk>();
  private elevationNoise: NoiseGenerator;
  private moistureNoise: NoiseGenerator;
  private heatNoise: NoiseGenerator;
  private corruptionNoise: NoiseGenerator;
  private resourceNoise: NoiseGenerator;
  readonly seed: string;

  constructor(seed: string) {
    this.seed = seed;
    this.elevationNoise = new NoiseGenerator(seed + '-elevation');
    this.moistureNoise = new NoiseGenerator(seed + '-moisture');
    this.heatNoise = new NoiseGenerator(seed + '-heat');
    this.corruptionNoise = new NoiseGenerator(seed + '-corruption');
    this.resourceNoise = new NoiseGenerator(seed + '-resource');
  }

  getChunk(cx: number, cy: number): Chunk {
    const key = chunkKey(cx, cy);
    if (this.chunks.has(key)) return this.chunks.get(key)!;
    const chunk = this.generateChunk(cx, cy);
    this.chunks.set(key, chunk);
    return chunk;
  }

  getActiveChunks(centerCx: number, centerCy: number): Chunk[] {
    const chunks: Chunk[] = [];
    for (let dy = -ACTIVE_RADIUS; dy <= ACTIVE_RADIUS; dy++) {
      for (let dx = -ACTIVE_RADIUS; dx <= ACTIVE_RADIUS; dx++) {
        chunks.push(this.getChunk(centerCx + dx, centerCy + dy));
      }
    }
    return chunks;
  }

  private generateChunk(cx: number, cy: number): Chunk {
    const tiles: Tile[][] = [];
    for (let row = 0; row < CHUNK_SIZE; row++) {
      const tileRow: Tile[] = [];
      for (let col = 0; col < CHUNK_SIZE; col++) {
        const worldX = cx * CHUNK_SIZE + col;
        const worldY = cy * CHUNK_SIZE + row;
        const elevation = this.elevationNoise.getScaledNormalized(worldX, worldY, WORLD_SCALE);
        const moisture = this.moistureNoise.getScaledNormalized(worldX, worldY, WORLD_SCALE);
        const heat = this.heatNoise.getScaledNormalized(worldX, worldY, WORLD_SCALE);
        const corruption = this.corruptionNoise.getScaledNormalized(worldX, worldY, WORLD_SCALE * 0.5);
        const biomeId = this.assignBiome(cx, cy, elevation, moisture, heat, corruption);
        const resourceNodeId = this.placeResource(worldX, worldY, biomeId);
        tileRow.push({ biomeId, elevation, resourceNodeId, walkable: true });
      }
      tiles.push(tileRow);
    }
    return { x: cx, y: cy, tiles, entities: [], generated: true };
  }

  private assignBiome(cx: number, cy: number, elevation: number, moisture: number, heat: number, corruption: number): string {
    if (cx === 0 && cy === 0) return 'forest';
    if (corruption > 0.85) return 'corrupted_lands';
    if (elevation > 0.6 && moisture < 0.3 && heat > 0.7) return 'volcanic_wastes';
    if (elevation > 0.6 && moisture < 0.4) return 'rocky_highlands';
    if (elevation < 0.3 && moisture > 0.6) return 'swamp';
    return 'forest';
  }

  private placeResource(worldX: number, worldY: number, biomeId: string): string | null {
    const biome = BIOME_DEFINITIONS.find(b => b.id === biomeId);
    if (!biome) return null;
    const noiseVal = this.resourceNoise.getNormalized(worldX * 7.3, worldY * 7.3);
    let cumDensity = 0;
    for (const resource of biome.resources) {
      cumDensity += resource.density;
      if (noiseVal < cumDensity) return resource.itemId;
    }
    return null;
  }
}
