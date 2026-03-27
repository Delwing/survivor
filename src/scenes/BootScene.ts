import Phaser from 'phaser';

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
    this.createPlaceholderTextures();
  }

  create(): void { this.scene.start('MainMenu'); }

  private createPlaceholderTextures(): void {
    const playerGfx = this.make.graphics({ x: 0, y: 0 }, false);
    playerGfx.fillStyle(0x3b82f6);
    playerGfx.fillRect(0, 0, 24, 32);
    playerGfx.generateTexture('player', 24, 32);
    playerGfx.destroy();

    const mobGfx = this.make.graphics({ x: 0, y: 0 }, false);
    mobGfx.fillStyle(0xff0000);
    mobGfx.fillRect(0, 0, 20, 20);
    mobGfx.generateTexture('mob', 20, 20);
    mobGfx.destroy();

    const resGfx = this.make.graphics({ x: 0, y: 0 }, false);
    resGfx.fillStyle(0xffd700);
    resGfx.fillRect(0, 0, 16, 16);
    resGfx.generateTexture('resource_node', 16, 16);
    resGfx.destroy();

    const tileGfx = this.make.graphics({ x: 0, y: 0 }, false);
    tileGfx.fillStyle(0x228b22);
    tileGfx.beginPath();
    tileGfx.moveTo(24, 0);
    tileGfx.lineTo(48, 12);
    tileGfx.lineTo(24, 24);
    tileGfx.lineTo(0, 12);
    tileGfx.closePath();
    tileGfx.fillPath();
    tileGfx.generateTexture('tile', 48, 24);
    tileGfx.destroy();
  }
}
