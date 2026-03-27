import Phaser from 'phaser';

/**
 * Sort game-world sprites by Y position for isometric depth.
 * Skips UI elements (scrollFactor 0) and tile layer (negative depth).
 */
export function depthSort(scene: Phaser.Scene): void {
  const children = scene.children.getAll() as Phaser.GameObjects.GameObject[];
  for (const child of children) {
    if (!('y' in child && 'setDepth' in child && 'scrollFactorX' in child)) continue;
    const obj = child as Phaser.GameObjects.Sprite;
    // Skip UI elements (fixed to camera) and tile layer (negative depth)
    if (obj.scrollFactorX === 0 || obj.depth < -5000) continue;
    obj.setDepth(obj.y);
  }
}
