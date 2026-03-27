export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function damageVariance(baseDamage: number): number {
  const variance = 0.8 + Math.random() * 0.4;
  return Math.max(1, Math.round(baseDamage * variance));
}

export function chunkKey(x: number, y: number): string {
  return `${x},${y}`;
}
