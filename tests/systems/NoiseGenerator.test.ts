import { describe, it, expect } from 'vitest';
import { NoiseGenerator } from '@/systems/NoiseGenerator';

describe('NoiseGenerator', () => {
  it('produces deterministic output for same seed', () => {
    const gen1 = new NoiseGenerator('test-seed');
    const gen2 = new NoiseGenerator('test-seed');
    expect(gen1.get(10, 20)).toBe(gen2.get(10, 20));
  });
  it('produces different output for different seeds', () => {
    const gen1 = new NoiseGenerator('seed-a');
    const gen2 = new NoiseGenerator('seed-b');
    expect(gen1.get(10, 20)).not.toBe(gen2.get(10, 20));
  });
  it('returns values in [-1, 1] range', () => {
    const gen = new NoiseGenerator('range-test');
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        const val = gen.get(x, y);
        expect(val).toBeGreaterThanOrEqual(-1);
        expect(val).toBeLessThanOrEqual(1);
      }
    }
  });
  it('getNormalized returns values in [0, 1] range', () => {
    const gen = new NoiseGenerator('norm-test');
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        const val = gen.getNormalized(x, y);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      }
    }
  });
  it('respects scale parameter', () => {
    const gen = new NoiseGenerator('scale-test');
    const v1 = gen.get(10, 10);
    const v2 = gen.getScaled(10, 10, 0.5);
    expect(v1).not.toBe(v2);
  });
});
