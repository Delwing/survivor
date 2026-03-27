import Phaser from 'phaser';
import { InventorySlot } from '@/types/entities';
import { getItemDef } from '@/config/items';

const SLOT_SIZE = 28;
const SLOT_GAP = 4;
const MAX_SLOTS = 8;
const BOTTOM_PADDING = 80; // above ability bar

export class QuickInventory {
  private container: Phaser.GameObjects.Container;
  private slotGraphics: Phaser.GameObjects.Graphics[] = [];
  private itemImages: (Phaser.GameObjects.Image | null)[] = [];
  private countTexts: Phaser.GameObjects.Text[] = [];
  private nameTexts: Phaser.GameObjects.Text[] = [];

  constructor(private scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(10000);

    const cx = scene.cameras.main.width / 2;
    const bottom = scene.cameras.main.height - BOTTOM_PADDING - SLOT_SIZE - 8;

    const totalWidth = MAX_SLOTS * SLOT_SIZE + (MAX_SLOTS - 1) * SLOT_GAP;
    const startX = cx - totalWidth / 2;

    for (let i = 0; i < MAX_SLOTS; i++) {
      const x = startX + i * (SLOT_SIZE + SLOT_GAP);

      const bg = scene.add.graphics();
      bg.fillStyle(0x1e293b, 0.85);
      bg.fillRect(x, bottom, SLOT_SIZE, SLOT_SIZE);
      bg.lineStyle(1, 0x475569, 0.8);
      bg.strokeRect(x, bottom, SLOT_SIZE, SLOT_SIZE);
      this.container.add(bg);
      this.slotGraphics.push(bg);

      this.itemImages.push(null);

      const countText = scene.add.text(
        x + SLOT_SIZE - 2, bottom + SLOT_SIZE - 2,
        '',
        { fontSize: '9px', color: '#ffffff', stroke: '#000000', strokeThickness: 2 }
      ).setOrigin(1, 1);
      this.container.add(countText);
      this.countTexts.push(countText);

      const nameText = scene.add.text(
        x + SLOT_SIZE / 2, bottom + SLOT_SIZE + 2,
        '',
        { fontSize: '8px', color: '#94a3b8' }
      ).setOrigin(0.5, 0);
      this.container.add(nameText);
      this.nameTexts.push(nameText);
    }
  }

  update(inventory: InventorySlot[]): void {
    // Sort: resources first, then tools/weapons/armor, then others
    const sorted = [...inventory].sort((a, b) => {
      const defA = getItemDef(a.itemId);
      const defB = getItemDef(b.itemId);
      const typeOrder = (type: string) => {
        if (type === 'resource') return 0;
        if (type === 'tool' || type === 'weapon' || type === 'armor') return 1;
        return 2;
      };
      const orderA = typeOrder(defA?.type ?? 'misc');
      const orderB = typeOrder(defB?.type ?? 'misc');
      return orderA - orderB;
    });

    const cx = this.scene.cameras.main.width / 2;
    const bottom = this.scene.cameras.main.height - BOTTOM_PADDING - SLOT_SIZE - 8;
    const totalWidth = MAX_SLOTS * SLOT_SIZE + (MAX_SLOTS - 1) * SLOT_GAP;
    const startX = cx - totalWidth / 2;

    for (let i = 0; i < MAX_SLOTS; i++) {
      const slot = sorted[i];
      const x = startX + i * (SLOT_SIZE + SLOT_GAP);

      // Redraw bg
      const bg = this.slotGraphics[i];
      bg.clear();
      bg.fillStyle(0x1e293b, 0.85);
      bg.fillRect(x, bottom, SLOT_SIZE, SLOT_SIZE);
      bg.lineStyle(1, 0x475569, 0.8);
      bg.strokeRect(x, bottom, SLOT_SIZE, SLOT_SIZE);

      // Remove old item image if present
      if (this.itemImages[i]) {
        this.itemImages[i]!.destroy();
        this.itemImages[i] = null;
      }

      if (slot) {
        const def = getItemDef(slot.itemId);
        const color = def?.color ?? 0x888888;
        const iconKey = `item_${slot.itemId}`;
        const iconSize = SLOT_SIZE - 8;
        const iconX = x + 4;
        const iconY = bottom + 4;

        if (this.scene.textures.exists(iconKey)) {
          // Use pixel-art icon, scaled to fit the icon area
          const img = this.scene.add.image(
            iconX + iconSize / 2,
            iconY + iconSize / 2,
            iconKey,
          );
          img.setDisplaySize(iconSize, iconSize);
          this.container.add(img);
          this.itemImages[i] = img;
        } else {
          // Fallback: colored square
          bg.fillStyle(color, 1);
          bg.fillRect(iconX, iconY, iconSize, iconSize);
        }

        this.countTexts[i].setText(slot.count > 1 ? String(slot.count) : '');
        this.nameTexts[i].setText(def?.name?.slice(0, 6) ?? slot.itemId.slice(0, 6));

        // Update text positions
        this.countTexts[i].setPosition(x + SLOT_SIZE - 2, bottom + SLOT_SIZE - 2);
        this.nameTexts[i].setPosition(x + SLOT_SIZE / 2, bottom + SLOT_SIZE + 2);
      } else {
        this.countTexts[i].setText('');
        this.nameTexts[i].setText('');
      }
    }
  }
}
