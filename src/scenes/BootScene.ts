import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create(): void {
    const text = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'Survivor - Loading...',
      { fontSize: '24px', color: '#ffffff' }
    );
    text.setOrigin(0.5);
  }
}
