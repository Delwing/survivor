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
    // Distance from world center in chunks — gates harder biomes behind exploration
    const dist = Math.sqrt(cx * cx + cy * cy);

    // Spawn chunk is always forest
    if (cx === 0 && cy === 0) return 'forest';

    // Noise value used to pick sub-variant deterministically
    const v = this.resourceNoise.getNormalized(cx * 3.7, cy * 3.7);

    // T5: Corrupted — only 20+ chunks out
    if (dist >= 20 && corruption > 0.85) {
      if (v < 0.33) return 'corrupted_lands';
      if (v < 0.66) return 'shadow_realm';
      return 'void_wastes';
    }

    // T4: Volcanic — only 14+ chunks out
    if (dist >= 14 && elevation > 0.6 && moisture < 0.3 && heat > 0.7) {
      if (v < 0.33) return 'volcanic_wastes';
      if (v < 0.66) return 'ash_fields';
      return 'lava_flows';
    }

    // T3: Swamp — only 8+ chunks out
    if (dist >= 8 && elevation < 0.3 && moisture > 0.6) {
      if (v < 0.33) return 'swamp';
      if (v < 0.66) return 'bog';
      return 'marshland';
    }

    // T2: Rocky Highlands — only 4+ chunks out
    if (dist >= 4 && elevation > 0.6 && moisture < 0.4) {
      if (v < 0.33) return 'rocky_highlands';
      if (v < 0.66) return 'granite_peaks';
      return 'crystal_caverns';
    }

    // T1: Forest (with variants)
    if (v < 0.33) return 'forest';
    if (v < 0.66) return 'dark_forest';
    return 'pine_forest';
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
