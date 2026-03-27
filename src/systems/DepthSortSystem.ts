import Phaser from 'phaser';

export function depthSort(scene: Phaser.Scene): void {
  const children = scene.children.getAll() as Phaser.GameObjects.GameObject[];
  for (const child of children) {
    if ('y' in child && 'setDepth' in child) {
      const gameObj = child as Phaser.GameObjects.Sprite;
      gameObj.setDepth(gameObj.y);
    }
  }
}
