import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() { super({ key: 'MainMenu' }); }

  create(): void {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    this.add.text(cx, cy - 80, 'SURVIVOR', { fontSize: '48px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    this.add.text(cx, cy - 30, 'Isometric Roguelike Survival Crafter', { fontSize: '14px', color: '#94a3b8' }).setOrigin(0.5);

    const startButton = this.add.text(cx, cy + 40, '[ New Run ]', { fontSize: '24px', color: '#3b82f6' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    startButton.on('pointerover', () => startButton.setColor('#60a5fa'));
    startButton.on('pointerout', () => startButton.setColor('#3b82f6'));
    startButton.on('pointerdown', () => { this.scene.start('Game', { seed: Date.now().toString(36) }); });

    const metaButton = this.add.text(cx, cy + 90, '[ Progression ]', { fontSize: '18px', color: '#94a3b8' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    metaButton.on('pointerover', () => metaButton.setColor('#cbd5e1'));
    metaButton.on('pointerout', () => metaButton.setColor('#94a3b8'));
    metaButton.on('pointerdown', () => { this.scene.start('MetaHub'); });
  }
}
