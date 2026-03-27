import Phaser from 'phaser';

export interface AbilitySlot {
  id: string;
  label: string;
  cooldown: number;
  maxCooldown: number;
  onActivate: () => void;
}

export class AbilityBar {
  private container: Phaser.GameObjects.Container;
  private slots: { bg: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text }[] = [];

  constructor(private scene: Phaser.Scene, abilities: AbilitySlot[]) {
    const cx = scene.cameras.main.width / 2;
    const bottom = scene.cameras.main.height - 70;
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(10000);

    const slotSize = 50;
    const gap = 8;
    const totalWidth = abilities.length * slotSize + (abilities.length - 1) * gap;
    let x = cx - totalWidth / 2;

    for (const ability of abilities) {
      const bg = scene.add.graphics();
      bg.fillStyle(0x1e293b, 0.9);
      bg.fillRect(x, bottom, slotSize, slotSize);
      bg.lineStyle(2, 0x3b82f6);
      bg.strokeRect(x, bottom, slotSize, slotSize);
      this.container.add(bg);

      const text = scene.add.text(x + slotSize / 2, bottom + slotSize / 2, ability.label, { fontSize: '20px', color: '#ffffff' }).setOrigin(0.5);
      this.container.add(text);

      const hitZone = scene.add.zone(x + slotSize / 2, bottom + slotSize / 2, slotSize, slotSize).setScrollFactor(0).setInteractive({ useHandCursor: true });
      hitZone.on('pointerdown', ability.onActivate);
      hitZone.setDepth(10001);

      this.slots.push({ bg, text });
      x += slotSize + gap;
    }
  }

  update(abilities: AbilitySlot[]): void {
    for (let i = 0; i < abilities.length && i < this.slots.length; i++) {
      this.slots[i].text.setAlpha(abilities[i].cooldown > 0 ? 0.3 : 1);
    }
  }
}
