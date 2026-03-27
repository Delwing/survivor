import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() { super({ key: 'Game' }); }

  create(data: { seed: string }): void {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;
    this.add.text(cx, cy, `Game Scene - Seed: ${data.seed}`, { fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);
    this.add.text(cx, cy + 30, '(Press ESC to die)', { fontSize: '14px', color: '#94a3b8' }).setOrigin(0.5);
    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.start('GameOver', { survived: 0, recipesFound: 0, cause: 'Debug exit' });
    });
  }
}
