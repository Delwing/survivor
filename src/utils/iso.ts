import { TILE_WIDTH, TILE_HEIGHT } from '@/config/game-config';

export function worldToScreen(wx: number, wy: number): { sx: number; sy: number } {
  return {
    sx: wx - wy,
    sy: (wx + wy) / 2,
  };
}

export function screenToWorld(sx: number, sy: number): { wx: number; wy: number } {
  return {
    wx: (sx + 2 * sy) / 2,
    wy: (2 * sy - sx) / 2,
  };
}

export function tileToWorld(tx: number, ty: number): { wx: number; wy: number } {
  return {
    wx: tx * TILE_WIDTH / 2,
    wy: ty * TILE_HEIGHT,
  };
}

export function worldToTile(wx: number, wy: number): { tx: number; ty: number } {
  return {
    tx: Math.round(wx / (TILE_WIDTH / 2)),
    ty: Math.round(wy / TILE_HEIGHT),
  };
}
