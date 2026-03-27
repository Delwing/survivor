import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() { super({ key: 'GameOver' }); }

  create(data: { survived: number; recipesFound: number; cause: string }): void {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;
    this.add.text(cx, cy - 80, 'YOU DIED', { fontSize: '48px', color: '#ef4444', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(cx, cy - 20, `Cause: ${data.cause ?? 'Unknown'}`, { fontSize: '16px', color: '#94a3b8' }).setOrigin(0.5);
    this.add.text(cx, cy + 20, `Survived: ${Math.floor((data.survived ?? 0) / 1000)}s | Recipes: ${data.recipesFound ?? 0}`, { fontSize: '16px', color: '#cbd5e1' }).setOrigin(0.5);

    const retryButton = this.add.text(cx, cy + 80, '[ Try Again ]', { fontSize: '24px', color: '#3b82f6' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    retryButton.on('pointerdown', () => { this.scene.start('Game', { seed: Date.now().toString(36) }); });

    const menuButton = this.add.text(cx, cy + 120, '[ Main Menu ]', { fontSize: '18px', color: '#94a3b8' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    menuButton.on('pointerdown', () => { this.scene.start('MainMenu'); });
  }
}
