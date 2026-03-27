import { describe, it, expect } from 'vitest';
import { clamp, distance, damageVariance, chunkKey } from '@/utils/math';

describe('clamp', () => {
  it('clamps value below min', () => { expect(clamp(-5, 0, 10)).toBe(0); });
  it('clamps value above max', () => { expect(clamp(15, 0, 10)).toBe(10); });
  it('returns value within range', () => { expect(clamp(5, 0, 10)).toBe(5); });
});

describe('distance', () => {
  it('calculates distance between two points', () => { expect(distance(0, 0, 3, 4)).toBe(5); });
  it('returns 0 for same point', () => { expect(distance(5, 5, 5, 5)).toBe(0); });
});

describe('damageVariance', () => {
  it('returns value between 0.8 and 1.2 times base', () => {
    for (let i = 0; i < 100; i++) {
      const result = damageVariance(10);
      expect(result).toBeGreaterThanOrEqual(8);
      expect(result).toBeLessThanOrEqual(12);
    }
  });
  it('returns at least 1 even with 0 base', () => {
    expect(damageVariance(0)).toBeGreaterThanOrEqual(1);
  });
});

describe('chunkKey', () => {
  it('creates unique string key from chunk coordinates', () => {
    expect(chunkKey(3, -7)).toBe('3,-7');
  });
});
