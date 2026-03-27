import { describe, it, expect } from 'vitest';
import { worldToScreen, screenToWorld, tileToWorld, worldToTile } from '@/utils/iso';

describe('worldToScreen', () => {
  it('converts world origin to screen origin', () => {
    const { sx, sy } = worldToScreen(0, 0);
    expect(sx).toBe(0);
    expect(sy).toBe(0);
  });
  it('converts positive world coords to isometric screen coords', () => {
    const { sx, sy } = worldToScreen(1, 0);
    expect(sx).toBe(1);
    expect(sy).toBe(0.5);
  });
});

describe('screenToWorld', () => {
  it('is inverse of worldToScreen', () => {
    const wx = 5, wy = 3;
    const { sx, sy } = worldToScreen(wx, wy);
    const { wx: rwx, wy: rwy } = screenToWorld(sx, sy);
    expect(rwx).toBeCloseTo(wx, 5);
    expect(rwy).toBeCloseTo(wy, 5);
  });
});

describe('tileToWorld / worldToTile', () => {
  it('converts tile 0,0 to world origin', () => {
    const { wx, wy } = tileToWorld(0, 0);
    expect(wx).toBe(0);
    expect(wy).toBe(0);
  });
  it('worldToTile is inverse of tileToWorld', () => {
    const tx = 3, ty = 7;
    const { wx, wy } = tileToWorld(tx, ty);
    const { tx: rtx, ty: rty } = worldToTile(wx, wy);
    expect(rtx).toBe(tx);
    expect(rty).toBe(ty);
  });
});
