import { describe, it, expect } from 'vitest';
import { WorldSystem } from '@/systems/WorldSystem';
import { CHUNK_SIZE } from '@/config/game-config';

describe('WorldSystem', () => {
  it('generates a chunk with correct dimensions', () => {
    const world = new WorldSystem('test-seed');
    const chunk = world.getChunk(0, 0);
    expect(chunk.tiles.length).toBe(CHUNK_SIZE);
    expect(chunk.tiles[0].length).toBe(CHUNK_SIZE);
  });
  it('returns the same chunk for the same coordinates', () => {
    const world = new WorldSystem('test-seed');
    const chunk1 = world.getChunk(3, 5);
    const chunk2 = world.getChunk(3, 5);
    expect(chunk1).toBe(chunk2);
  });
  it('produces deterministic chunks for same seed', () => {
    const world1 = new WorldSystem('det-seed');
    const world2 = new WorldSystem('det-seed');
    const chunk1 = world1.getChunk(2, 3);
    const chunk2 = world2.getChunk(2, 3);
    expect(chunk1.tiles[0][0].biomeId).toBe(chunk2.tiles[0][0].biomeId);
    expect(chunk1.tiles[0][0].elevation).toBe(chunk2.tiles[0][0].elevation);
  });
  it('assigns a valid biome to every tile', () => {
    const world = new WorldSystem('biome-test');
    const chunk = world.getChunk(0, 0);
    const validBiomes = ['forest', 'rocky_highlands', 'swamp', 'volcanic_wastes', 'corrupted_lands'];
    for (const row of chunk.tiles) {
      for (const tile of row) {
        expect(validBiomes).toContain(tile.biomeId);
      }
    }
  });
  it('spawn chunk is always forest biome', () => {
    const world = new WorldSystem('spawn-test');
    const spawn = world.getChunk(0, 0);
    const centerTile = spawn.tiles[Math.floor(CHUNK_SIZE / 2)][Math.floor(CHUNK_SIZE / 2)];
    expect(centerTile.biomeId).toBe('forest');
  });
  it('places resource nodes according to biome config', () => {
    const world = new WorldSystem('resource-test');
    const chunk = world.getChunk(0, 0);
    let hasResource = false;
    for (const row of chunk.tiles) {
      for (const tile of row) {
        if (tile.resourceNodeId !== null) hasResource = true;
      }
    }
    expect(hasResource).toBe(true);
  });
  it('getActiveChunks returns correct number of chunks', () => {
    const world = new WorldSystem('active-test');
    const active = world.getActiveChunks(0, 0);
    expect(active.length).toBeGreaterThan(0);
    expect(active.some(c => c.x === 0 && c.y === 0)).toBe(true);
  });
});
