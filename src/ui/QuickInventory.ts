import Phaser from 'phaser';
import { InventorySlot } from '@/types/entities';
import { getItemDef } from '@/config/items';
import { EventBus } from '@/systems/EventBus';

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
  private keyTexts: Phaser.GameObjects.Text[] = [];
  private hitZones: Phaser.GameObjects.Zone[] = [];
  private _inventory: InventorySlot[] = [];
  private _equippedWeapon: string | null = null;

  constructor(private scene: Phaser.Scene, private eventBus: EventBus, private isUIBlocked?: () => boolean) {
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

      // Number key hint (top-left)
      const keyText = scene.add.text(
        x + 2, bottom + 1,
        `${i + 1}`,
        { fontSize: '7px', color: '#475569', stroke: '#000000', strokeThickness: 1 }
      );
      this.container.add(keyText);
      this.keyTexts.push(keyText);

      const countText = scene.add.text(
        x + SLOT_SIZE - 1, bottom + 1,
        '',
        { fontSize: '8px', color: '#ffffff', stroke: '#000000', strokeThickness: 2, fontStyle: 'bold' }
      ).setOrigin(1, 0);
      this.container.add(countText);
      this.countTexts.push(countText);

      const nameText = scene.add.text(
        x + SLOT_SIZE / 2, bottom + SLOT_SIZE + 2,
        '',
        { fontSize: '8px', color: '#94a3b8' }
      ).setOrigin(0.5, 0);
      this.container.add(nameText);
      this.nameTexts.push(nameText);

      // Interactive hit zone for clicking
      const hitZone = scene.add.zone(x + SLOT_SIZE / 2, bottom + SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true })
        .setDepth(10001);
      hitZone.on('pointerdown', () => this.onSlotClick(i));
      this.container.add(hitZone);
      this.hitZones.push(hitZone);
    }

    // Number key hotkeys (1-8)
    const numKeys = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT'];
    for (let i = 0; i < MAX_SLOTS; i++) {
      scene.input.keyboard!.on(`keydown-${numKeys[i]}`, () => {
        this.onSlotClick(i);
      });
    }
  }

  private onSlotClick(slotIdx: number): void {
    if (this.isUIBlocked?.()) return;
    // Sort same as display
    const sorted = this.getSortedInventory();
    const slot = sorted[slotIdx];
    if (!slot) return;
    const def = getItemDef(slot.itemId);
    if (!def) return;

    if (def.type === 'weapon' || def.type === 'tool') {
      this.eventBus.emit('equipment-changed', { slot: 'weapon', itemId: slot.itemId });
    } else if (def.type === 'armor') {
      this.eventBus.emit('equipment-changed', { slot: 'armor', itemId: slot.itemId });
    } else if (def.type === 'consumable') {
      this.eventBus.emit('consumable-used', { itemId: slot.itemId });
    }
  }

  private getSortedInventory(): InventorySlot[] {
    return [...this._inventory].sort((a, b) => {
      const defA = getItemDef(a.itemId);
      const defB = getItemDef(b.itemId);
      const typeOrder = (type: string) => {
        if (type === 'consumable') return 0;
        if (type === 'tool' || type === 'weapon' || type === 'armor') return 1;
        if (type === 'resource') return 2;
        return 3;
      };
      const orderA = typeOrder(defA?.type ?? 'misc');
      const orderB = typeOrder(defB?.type ?? 'misc');
      return orderA - orderB;
    });
  }

  update(inventory: InventorySlot[], equippedWeapon?: string | null): void {
    this._inventory = inventory;
    if (equippedWeapon !== undefined) this._equippedWeapon = equippedWeapon;

    const sorted = this.getSortedInventory();

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

      const isEquipped = slot && this._equippedWeapon === slot.itemId;

      if (isEquipped) {
        bg.fillStyle(0x1e3a5f, 0.9);
        bg.fillRect(x, bottom, SLOT_SIZE, SLOT_SIZE);
        bg.lineStyle(1, 0x60a5fa, 1);
        bg.strokeRect(x, bottom, SLOT_SIZE, SLOT_SIZE);
      } else {
        bg.fillStyle(0x1e293b, 0.85);
        bg.fillRect(x, bottom, SLOT_SIZE, SLOT_SIZE);
        bg.lineStyle(1, 0x475569, 0.8);
        bg.strokeRect(x, bottom, SLOT_SIZE, SLOT_SIZE);
      }

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

        // Update text positions — count overlays top-right of slot
        this.countTexts[i].setPosition(x + SLOT_SIZE - 1, bottom + 1);
        this.nameTexts[i].setPosition(x + SLOT_SIZE / 2, bottom + SLOT_SIZE + 2);
      } else {
        this.countTexts[i].setText('');
        this.nameTexts[i].setText('');
      }
    }
  }
}
