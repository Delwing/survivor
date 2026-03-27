import Phaser from 'phaser';
import { PlayerState } from '@/types/entities';

export class HUD {
  private healthBar: Phaser.GameObjects.Graphics;
  private hungerBar: Phaser.GameObjects.Graphics;
  private healthText: Phaser.GameObjects.Text;
  private biomeText: Phaser.GameObjects.Text;
  private container: Phaser.GameObjects.Container;

  constructor(private scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(10000);

    this.healthBar = scene.add.graphics();
    this.container.add(this.healthBar);
    this.hungerBar = scene.add.graphics();
    this.container.add(this.hungerBar);
    this.healthText = scene.add.text(120, 8, '100/100', { fontSize: '12px', color: '#fca5a5' });
    this.container.add(this.healthText);
    this.biomeText = scene.add.text(scene.cameras.main.width / 2, 8, 'Forest', { fontSize: '12px', color: '#86efac' }).setOrigin(0.5, 0);
    this.container.add(this.biomeText);
  }

  update(player: PlayerState, currentBiome: string): void {
    const healthPct = player.stats.health / player.stats.maxHealth;
    const hungerPct = player.stats.hunger / player.stats.maxHunger;

    this.healthBar.clear();
    this.healthBar.fillStyle(0x1e293b, 0.8);
    this.healthBar.fillRect(10, 10, 104, 14);
    this.healthBar.fillStyle(0xef4444);
    this.healthBar.fillRect(12, 12, 100 * healthPct, 10);

    this.hungerBar.clear();
    this.hungerBar.fillStyle(0x1e293b, 0.8);
    this.hungerBar.fillRect(10, 28, 84, 10);
    this.hungerBar.fillStyle(0xf59e0b);
    this.hungerBar.fillRect(12, 30, 80 * hungerPct, 6);

    this.healthText.setText(`${Math.ceil(player.stats.health)}/${player.stats.maxHealth}`);
    this.biomeText.setText(currentBiome);
  }
}
