import Phaser from 'phaser';
import { InventorySlot, PlayerState } from '@/types/entities';
import { getItemDef } from '@/config/items';
import { ItemSystem } from '@/systems/ItemSystem';
import { EventBus } from '@/systems/EventBus';

const COLS = 6;
const ROWS = 5;
const CELL_SIZE = 44;
const CELL_GAP = 4;
const PANEL_X = 80;
const PANEL_Y = 30;
const PANEL_W = 800;
const PANEL_H = 480;

export class InventoryPanel {
  private container: Phaser.GameObjects.Container;
  private cellGraphics: Phaser.GameObjects.Graphics[] = [];
  private cellItemImages: (Phaser.GameObjects.Image | null)[] = [];
  private cellNameTexts: Phaser.GameObjects.Text[] = [];
  private cellCountTexts: Phaser.GameObjects.Text[] = [];
  private equippedWeaponText!: Phaser.GameObjects.Text;
  private equippedArmorText!: Phaser.GameObjects.Text;

  constructor(
    private scene: Phaser.Scene,
    private itemSystem: ItemSystem,
    private eventBus: EventBus,
  ) {
    this.container = scene.add.container(0, 0);
    this.buildUI();
  }

  private buildUI(): void {
    const scene = this.scene;

    // Dark overlay
    const overlay = scene.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, scene.cameras.main.width, scene.cameras.main.height);
    this.container.add(overlay);

    // Panel background
    const panelBg = scene.add.graphics();
    panelBg.fillStyle(0x1e293b, 0.97);
    panelBg.fillRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H);
    panelBg.lineStyle(1, 0x475569);
    panelBg.strokeRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H);
    this.container.add(panelBg);

    // Title
    const title = scene.add.text(PANEL_X + 16, PANEL_Y + 12, 'INVENTORY', {
      fontSize: '14px', color: '#e2e8f0', fontStyle: 'bold',
    });
    this.container.add(title);

    // Close button
    const closeBtn = scene.add.text(PANEL_X + PANEL_W - 24, PANEL_Y + 12, 'X', {
      fontSize: '14px', color: '#f87171', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hide());
    this.container.add(closeBtn);

    // Equipped section header
    const eqHeader = scene.add.text(PANEL_X + 16, PANEL_Y + 40, 'EQUIPPED:', {
      fontSize: '10px', color: '#94a3b8',
    });
    this.container.add(eqHeader);

    // Weapon slot
    const wSlotBg = scene.add.graphics();
    wSlotBg.fillStyle(0x0f172a, 0.9);
    wSlotBg.fillRect(PANEL_X + 16, PANEL_Y + 56, 120, 28);
    wSlotBg.lineStyle(1, 0x3b82f6, 0.6);
    wSlotBg.strokeRect(PANEL_X + 16, PANEL_Y + 56, 120, 28);
    this.container.add(wSlotBg);

    const wLabel = scene.add.text(PANEL_X + 20, PANEL_Y + 60, 'WEAPON:', {
      fontSize: '9px', color: '#64748b',
    });
    this.container.add(wLabel);

    this.equippedWeaponText = scene.add.text(PANEL_X + 70, PANEL_Y + 60, 'None', {
      fontSize: '10px', color: '#93c5fd',
    });
    this.container.add(this.equippedWeaponText);

    // Armor slot
    const aSlotBg = scene.add.graphics();
    aSlotBg.fillStyle(0x0f172a, 0.9);
    aSlotBg.fillRect(PANEL_X + 150, PANEL_Y + 56, 120, 28);
    aSlotBg.lineStyle(1, 0x22c55e, 0.6);
    aSlotBg.strokeRect(PANEL_X + 150, PANEL_Y + 56, 120, 28);
    this.container.add(aSlotBg);

    const aLabel = scene.add.text(PANEL_X + 154, PANEL_Y + 60, 'ARMOR:', {
      fontSize: '9px', color: '#64748b',
    });
    this.container.add(aLabel);

    this.equippedArmorText = scene.add.text(PANEL_X + 200, PANEL_Y + 60, 'None', {
      fontSize: '10px', color: '#86efac',
    });
    this.container.add(this.equippedArmorText);

    // Divider
    const divider = scene.add.graphics();
    divider.lineStyle(1, 0x334155);
    divider.lineBetween(PANEL_X + 16, PANEL_Y + 94, PANEL_X + PANEL_W - 16, PANEL_Y + 94);
    this.container.add(divider);

    // Item grid (6 x 5)
    const gridStartX = PANEL_X + 16;
    const gridStartY = PANEL_Y + 104;

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const idx = row * COLS + col;
        const cx = gridStartX + col * (CELL_SIZE + CELL_GAP);
        const cy = gridStartY + row * (CELL_SIZE + CELL_GAP);

        const cellBg = scene.add.graphics();
        cellBg.fillStyle(0x0f172a, 0.9);
        cellBg.fillRect(cx, cy, CELL_SIZE, CELL_SIZE);
        cellBg.lineStyle(1, 0x334155);
        cellBg.strokeRect(cx, cy, CELL_SIZE, CELL_SIZE);
        this.container.add(cellBg);
        this.cellGraphics.push(cellBg);
        this.cellItemImages.push(null);

        const nameText = scene.add.text(cx + CELL_SIZE / 2, cy + CELL_SIZE - 2, '', {
          fontSize: '8px', color: '#94a3b8',
        }).setOrigin(0.5, 1);
        this.container.add(nameText);
        this.cellNameTexts.push(nameText);

        const countText = scene.add.text(cx + CELL_SIZE - 2, cy + 2, '', {
          fontSize: '9px', color: '#ffffff', stroke: '#000000', strokeThickness: 2,
        }).setOrigin(1, 0);
        this.container.add(countText);
        this.cellCountTexts.push(countText);

        // Make interactive (hit zone)
        const hitZone = scene.add.zone(cx + CELL_SIZE / 2, cy + CELL_SIZE / 2, CELL_SIZE, CELL_SIZE)
          .setScrollFactor(0)
          .setInteractive({ useHandCursor: true });
        hitZone.setDepth(20001);
        hitZone.setData('slotIdx', idx);
        hitZone.on('pointerdown', () => {
          this.onSlotClick(idx);
        });
        hitZone.on('pointerover', () => {
          const bg = this.cellGraphics[idx];
          bg.clear();
          bg.fillStyle(0x1e3a5f, 0.95);
          bg.fillRect(cx, cy, CELL_SIZE, CELL_SIZE);
          bg.lineStyle(1, 0x60a5fa);
          bg.strokeRect(cx, cy, CELL_SIZE, CELL_SIZE);
        });
        hitZone.on('pointerout', () => {
          // Will be re-drawn on next update, just reset look
          const bg = this.cellGraphics[idx];
          bg.clear();
          bg.fillStyle(0x0f172a, 0.9);
          bg.fillRect(cx, cy, CELL_SIZE, CELL_SIZE);
          bg.lineStyle(1, 0x334155);
          bg.strokeRect(cx, cy, CELL_SIZE, CELL_SIZE);
        });
        this.container.add(hitZone);
      }
    }

    // Instructions hint
    const hint = scene.add.text(PANEL_X + 16, PANEL_Y + PANEL_H - 22, 'Click weapon/armor to equip  |  Click consumable to use  |  [I] to close', {
      fontSize: '9px', color: '#475569',
    });
    this.container.add(hint);
  }

  private _inventory: InventorySlot[] = [];
  private _equipment: PlayerState['equipment'] = { weapon: null, armor: null, ability1: null, ability2: null };

  update(inventory: InventorySlot[], equipment: PlayerState['equipment']): void {
    this._inventory = inventory;
    this._equipment = equipment;

    // Update equipped display
    const weaponDef = equipment.weapon ? getItemDef(equipment.weapon) : null;
    const armorDef = equipment.armor ? getItemDef(equipment.armor) : null;
    this.equippedWeaponText.setText(weaponDef?.name ?? 'None');
    this.equippedArmorText.setText(armorDef?.name ?? 'None');

    const gridStartX = PANEL_X + 16;
    const gridStartY = PANEL_Y + 104;

    for (let idx = 0; idx < ROWS * COLS; idx++) {
      const slot = inventory[idx];
      const col = idx % COLS;
      const row = Math.floor(idx / COLS);
      const cx = gridStartX + col * (CELL_SIZE + CELL_GAP);
      const cy = gridStartY + row * (CELL_SIZE + CELL_GAP);

      const bg = this.cellGraphics[idx];
      bg.clear();

      // Remove stale item image
      if (this.cellItemImages[idx]) {
        this.cellItemImages[idx]!.destroy();
        this.cellItemImages[idx] = null;
      }

      if (slot) {
        const def = getItemDef(slot.itemId);
        const color = def?.color ?? 0x888888;
        const isEquipped = equipment.weapon === slot.itemId || equipment.armor === slot.itemId;

        bg.fillStyle(isEquipped ? 0x1e3a5f : 0x0f172a, 0.9);
        bg.fillRect(cx, cy, CELL_SIZE, CELL_SIZE);
        bg.lineStyle(1, isEquipped ? 0x60a5fa : 0x334155);
        bg.strokeRect(cx, cy, CELL_SIZE, CELL_SIZE);

        const iconKey = `item_${slot.itemId}`;
        const iconSize = CELL_SIZE - 16;
        const iconX = cx + 8;
        const iconY = cy + 6;

        if (this.scene.textures.exists(iconKey)) {
          const img = this.scene.add.image(
            iconX + iconSize / 2,
            iconY + iconSize / 2,
            iconKey,
          );
          img.setDisplaySize(iconSize, iconSize);
          this.container.add(img);
          this.cellItemImages[idx] = img;
        } else {
          // Fallback: colored square
          bg.fillStyle(color, 1);
          bg.fillRect(iconX, iconY, iconSize, iconSize);
        }

        this.cellNameTexts[idx].setText(def?.name?.slice(0, 7) ?? slot.itemId.slice(0, 7));
        this.cellCountTexts[idx].setText(slot.count > 1 ? String(slot.count) : '');
      } else {
        bg.fillStyle(0x0f172a, 0.9);
        bg.fillRect(cx, cy, CELL_SIZE, CELL_SIZE);
        bg.lineStyle(1, 0x1e293b);
        bg.strokeRect(cx, cy, CELL_SIZE, CELL_SIZE);
        this.cellNameTexts[idx].setText('');
        this.cellCountTexts[idx].setText('');
      }
    }
  }

  private onSlotClick(idx: number): void {
    const slot = this._inventory[idx];
    if (!slot) return;
    const def = getItemDef(slot.itemId);
    if (!def) return;

    if (def.type === 'weapon') {
      this._equipment.weapon = slot.itemId;
      this.eventBus.emit('equipment-changed', { slot: 'weapon', itemId: slot.itemId });
    } else if (def.type === 'armor') {
      this._equipment.armor = slot.itemId;
      this.eventBus.emit('equipment-changed', { slot: 'armor', itemId: slot.itemId });
    } else if (def.type === 'consumable') {
      this.eventBus.emit('consumable-used', { itemId: slot.itemId });
    }

    // Refresh display
    this.update(this._inventory, this._equipment);
  }

  show(): void { this.container.setVisible(true); }
  hide(): void { this.container.setVisible(false); }

  getContainer(): Phaser.GameObjects.Container { return this.container; }
}
