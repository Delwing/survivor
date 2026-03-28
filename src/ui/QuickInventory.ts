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

  // Manually assigned item IDs per slot (null = empty)
  private assignedSlots: (string | null)[] = new Array(MAX_SLOTS).fill(null);

  // Slot positions for hit-testing during drag
  private slotPositions: { x: number; y: number }[] = [];

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
      this.slotPositions.push({ x, y: bottom });

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

  /** Raise depth above panels (when inventory is open) or back to normal. */
  setAbovePanels(above: boolean): void {
    this.container.setDepth(above ? 25000 : 10000);
    for (const hz of this.hitZones) {
      hz.setDepth(above ? 25001 : 10001);
    }
  }

  /** Assign an item to a quick slot (called from drag-drop). */
  assignItem(slotIdx: number, itemId: string): void {
    if (slotIdx < 0 || slotIdx >= MAX_SLOTS) return;
    // Remove item from any other slot first
    for (let i = 0; i < MAX_SLOTS; i++) {
      if (this.assignedSlots[i] === itemId) this.assignedSlots[i] = null;
    }
    this.assignedSlots[slotIdx] = itemId;
  }

  /** Check if a screen position is over a quick slot. Returns slot index or -1. */
  getSlotAtPosition(screenX: number, screenY: number): number {
    for (let i = 0; i < MAX_SLOTS; i++) {
      const pos = this.slotPositions[i];
      if (screenX >= pos.x && screenX <= pos.x + SLOT_SIZE &&
          screenY >= pos.y && screenY <= pos.y + SLOT_SIZE) {
        return i;
      }
    }
    return -1;
  }

  private onSlotClick(slotIdx: number): void {
    if (this.isUIBlocked?.()) return;
    const itemId = this.assignedSlots[slotIdx];
    if (!itemId) return;

    // Check item still exists in inventory
    const slot = this._inventory.find(s => s.itemId === itemId);
    if (!slot) return;

    const def = getItemDef(itemId);
    if (!def) return;

    if (def.type === 'weapon' || def.type === 'tool') {
      this.eventBus.emit('equipment-changed', { slot: 'weapon', itemId });
    } else if (def.type === 'armor') {
      this.eventBus.emit('equipment-changed', { slot: 'armor', itemId });
    } else if (def.type === 'consumable') {
      this.eventBus.emit('consumable-used', { itemId });
    }
  }

  update(inventory: InventorySlot[], equippedWeapon?: string | null): void {
    this._inventory = inventory;
    if (equippedWeapon !== undefined) this._equippedWeapon = equippedWeapon;

    // Auto-assign new items to empty slots if they aren't assigned anywhere yet
    const assignedSet = new Set(this.assignedSlots.filter(Boolean));
    for (const slot of inventory) {
      if (!assignedSet.has(slot.itemId)) {
        const emptyIdx = this.assignedSlots.indexOf(null);
        if (emptyIdx !== -1) {
          this.assignedSlots[emptyIdx] = slot.itemId;
          assignedSet.add(slot.itemId);
        }
      }
    }

    // Clear slots for items no longer in inventory
    const inventoryIds = new Set(inventory.map(s => s.itemId));
    for (let i = 0; i < MAX_SLOTS; i++) {
      if (this.assignedSlots[i] && !inventoryIds.has(this.assignedSlots[i]!)) {
        this.assignedSlots[i] = null;
      }
    }

    const cx = this.scene.cameras.main.width / 2;
    const bottom = this.scene.cameras.main.height - BOTTOM_PADDING - SLOT_SIZE - 8;
    const totalWidth = MAX_SLOTS * SLOT_SIZE + (MAX_SLOTS - 1) * SLOT_GAP;
    const startX = cx - totalWidth / 2;

    for (let i = 0; i < MAX_SLOTS; i++) {
      const itemId = this.assignedSlots[i];
      const slot = itemId ? inventory.find(s => s.itemId === itemId) : null;
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
          const img = this.scene.add.image(
            iconX + iconSize / 2,
            iconY + iconSize / 2,
            iconKey,
          );
          img.setDisplaySize(iconSize, iconSize);
          this.container.add(img);
          this.itemImages[i] = img;
        } else {
          bg.fillStyle(color, 1);
          bg.fillRect(iconX, iconY, iconSize, iconSize);
        }

        this.countTexts[i].setText(slot.count > 1 ? String(slot.count) : '');
        this.nameTexts[i].setText(def?.name?.slice(0, 6) ?? slot.itemId.slice(0, 6));

        this.countTexts[i].setPosition(x + SLOT_SIZE - 1, bottom + 1);
        this.nameTexts[i].setPosition(x + SLOT_SIZE / 2, bottom + SLOT_SIZE + 2);
      } else {
        this.countTexts[i].setText('');
        this.nameTexts[i].setText('');
      }
    }
  }
}
