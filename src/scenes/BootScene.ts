import Phaser from 'phaser';
import { generateAllTextures, createBatAnimation } from '@/graphics/TextureGenerator';

export class BootScene extends Phaser.Scene {
  constructor() { super({ key: 'Boot' }); }

  preload(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 15, 320, 30);
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x3b82f6, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 10, 300 * value, 20);
    });
    this.load.on('complete', () => { progressBar.destroy(); progressBox.destroy(); });

    generateAllTextures(this);
  }

  create(): void {
    createBatAnimation(this);
    this.scene.start('MainMenu');
  }
}
