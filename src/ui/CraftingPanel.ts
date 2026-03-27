import Phaser from 'phaser';
import { InventorySlot } from '@/types/entities';
import { getItemDef } from '@/config/items';
import { CraftingSystem } from '@/systems/CraftingSystem';
import { ItemSystem } from '@/systems/ItemSystem';
import { EventBus } from '@/systems/EventBus';
import { CraftingStation, RecipeDefinition } from '@/types/items';

const PANEL_X = 60;
const PANEL_Y = 30;
const PANEL_W = 840;
const PANEL_H = 480;
const ROW_H = 72;
const VISIBLE_ROWS = 6;

const STATION_NAMES: Record<CraftingStation, string> = {
  hand: 'Hand',
  campfire: 'Campfire',
  workbench: 'Workbench',
  forge: 'Forge',
  alchemy_table: 'Alchemy Table',
  magma_forge: 'Magma Forge',
  void_altar: 'Void Altar',
};

export class CraftingPanel {
  private container: Phaser.GameObjects.Container;
  private stationTitle!: Phaser.GameObjects.Text;
  private recipeRows: Phaser.GameObjects.Container[] = [];
  private scrollOffset = 0;
  private _recipes: RecipeDefinition[] = [];
  private _inventory: InventorySlot[] = [];
  private _knownRecipes = new Set<string>();
  private _station: CraftingStation = 'hand';

  constructor(
    private scene: Phaser.Scene,
    private craftingSystem: CraftingSystem,
    private itemSystem: ItemSystem,
    private eventBus: EventBus,
    private onCrafted: (itemId: string, count: number) => void,
  ) {
    this.container = scene.add.container(0, 0);
    this.buildStaticUI();
  }

  private buildStaticUI(): void {
    const scene = this.scene;

    // Overlay
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

    // Station title
    this.stationTitle = scene.add.text(PANEL_X + 16, PANEL_Y + 12, 'CRAFTING - Hand', {
      fontSize: '14px', color: '#e2e8f0', fontStyle: 'bold',
    });
    this.container.add(this.stationTitle);

    // Close button
    const closeBtn = scene.add.text(PANEL_X + PANEL_W - 24, PANEL_Y + 12, 'X', {
      fontSize: '14px', color: '#f87171', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hide());
    this.container.add(closeBtn);

    // Divider
    const div = scene.add.graphics();
    div.lineStyle(1, 0x334155);
    div.lineBetween(PANEL_X + 16, PANEL_Y + 38, PANEL_X + PANEL_W - 16, PANEL_Y + 38);
    this.container.add(div);

    // Scroll up button
    const scrollUp = scene.add.text(PANEL_X + PANEL_W - 50, PANEL_Y + 50, '▲', {
      fontSize: '14px', color: '#94a3b8',
    }).setInteractive({ useHandCursor: true });
    scrollUp.on('pointerdown', () => {
      this.scrollOffset = Math.max(0, this.scrollOffset - 1);
      this.refreshRows();
    });
    this.container.add(scrollUp);

    // Scroll down button
    const scrollDown = scene.add.text(PANEL_X + PANEL_W - 50, PANEL_Y + PANEL_H - 30, '▼', {
      fontSize: '14px', color: '#94a3b8',
    }).setInteractive({ useHandCursor: true });
    scrollDown.on('pointerdown', () => {
      const maxOffset = Math.max(0, this._recipes.length - VISIBLE_ROWS);
      this.scrollOffset = Math.min(maxOffset, this.scrollOffset + 1);
      this.refreshRows();
    });
    this.container.add(scrollDown);

    // Hint
    const hint = scene.add.text(PANEL_X + 16, PANEL_Y + PANEL_H - 22, '[C] to close  |  Green = have materials  |  Red = missing materials', {
      fontSize: '9px', color: '#475569',
    });
    this.container.add(hint);
  }

  update(inventory: InventorySlot[], knownRecipes: Set<string>, currentStation: CraftingStation): void {
    this._inventory = inventory;
    this._knownRecipes = knownRecipes;
    this._station = currentStation;

    this.stationTitle.setText(`CRAFTING - ${STATION_NAMES[currentStation] ?? currentStation}`);

    // Get all known recipes for this station
    this._recipes = this.craftingSystem.getKnownRecipes(knownRecipes).filter(r =>
      this.craftingSystem.stationCanCraft(currentStation, r.station)
    );
    this.scrollOffset = 0;
    this.refreshRows();
  }

  private refreshRows(): void {
    // Destroy old row containers
    for (const row of this.recipeRows) {
      row.destroy();
    }
    this.recipeRows = [];

    const scene = this.scene;
    const startY = PANEL_Y + 48;
    const listX = PANEL_X + 16;
    const listW = PANEL_W - 80;

    const visibleRecipes = this._recipes.slice(this.scrollOffset, this.scrollOffset + VISIBLE_ROWS);

    for (let i = 0; i < visibleRecipes.length; i++) {
      const recipe = visibleRecipes[i];
      const rowY = startY + i * ROW_H;
      const canCraft = this.craftingSystem.canCraft(recipe.id, this._inventory, this._knownRecipes, this._station);

      const rowContainer = scene.add.container(0, 0);
      rowContainer.setScrollFactor(0);
      rowContainer.setDepth(20001);

      // Row background
      const rowBg = scene.add.graphics();
      rowBg.fillStyle(canCraft ? 0x0f2d1a : 0x1a1a2e, 0.8);
      rowBg.fillRect(listX, rowY, listW, ROW_H - 4);
      rowBg.lineStyle(1, canCraft ? 0x22c55e : 0x334155, 0.6);
      rowBg.strokeRect(listX, rowY, listW, ROW_H - 4);
      rowContainer.add(rowBg);

      // Output item icon
      const outputDef = getItemDef(recipe.output.item);
      const iconColor = outputDef?.color ?? 0x888888;
      const icon = scene.add.graphics();
      icon.fillStyle(iconColor, 1);
      icon.fillRect(listX + 6, rowY + 10, 20, 20);
      icon.lineStyle(1, 0x334155);
      icon.strokeRect(listX + 6, rowY + 10, 20, 20);
      rowContainer.add(icon);

      // Recipe name + output count
      const outputLabel = `${recipe.name}  →  x${recipe.output.count}`;
      const nameText = scene.add.text(listX + 34, rowY + 8, outputLabel, {
        fontSize: '11px', color: '#e2e8f0', fontStyle: 'bold',
      });
      rowContainer.add(nameText);

      // Ingredients list
      let ingX = listX + 34;
      const ingY = rowY + 26;
      for (const ing of recipe.ingredients) {
        const have = this.itemSystem.getItemCount(this._inventory, ing.item);
        const ingDef = getItemDef(ing.item);
        const ingName = ingDef?.name ?? ing.item;
        const enough = have >= ing.count;
        const ingColor = enough ? '#86efac' : '#f87171';
        const ingText = scene.add.text(ingX, ingY, `${ingName} ${have}/${ing.count}`, {
          fontSize: '9px', color: ingColor,
        });
        rowContainer.add(ingText);
        ingX += ingText.width + 10;
      }

      // Craft button
      const btnW = 60;
      const btnX = listX + listW - btnW - 8;
      const btnY = rowY + (ROW_H - 4) / 2 - 12;

      const btnBg = scene.add.graphics();
      if (canCraft) {
        btnBg.fillStyle(0x166534, 0.9);
        btnBg.fillRect(btnX, btnY, btnW, 24);
        btnBg.lineStyle(1, 0x22c55e);
        btnBg.strokeRect(btnX, btnY, btnW, 24);
      } else {
        btnBg.fillStyle(0x1e293b, 0.5);
        btnBg.fillRect(btnX, btnY, btnW, 24);
        btnBg.lineStyle(1, 0x334155);
        btnBg.strokeRect(btnX, btnY, btnW, 24);
      }
      rowContainer.add(btnBg);

      const btnText = scene.add.text(btnX + btnW / 2, btnY + 12, 'CRAFT', {
        fontSize: '10px', color: canCraft ? '#ffffff' : '#475569', fontStyle: 'bold',
      }).setOrigin(0.5);
      rowContainer.add(btnText);

      if (canCraft) {
        const hitZone = scene.add.zone(btnX + btnW / 2, btnY + 12, btnW, 24)
          .setScrollFactor(0).setInteractive({ useHandCursor: true });
        hitZone.setDepth(20002);
        hitZone.on('pointerdown', () => {
          const success = this.craftingSystem.craft(recipe.id, this._inventory, this._knownRecipes, this._station);
          if (success) {
            this.onCrafted(recipe.output.item, recipe.output.count);
            // Refresh the panel
            this.update(this._inventory, this._knownRecipes, this._station);
          }
        });
        rowContainer.add(hitZone);
      }

      this.container.add(rowContainer);
      this.recipeRows.push(rowContainer);
    }

    // Empty state
    if (visibleRecipes.length === 0) {
      const emptyText = scene.add.text(
        PANEL_X + PANEL_W / 2, PANEL_Y + PANEL_H / 2,
        'No recipes available at this station.\nBuild or approach a station to unlock more.',
        { fontSize: '12px', color: '#64748b', align: 'center' }
      ).setOrigin(0.5);
      const emptyContainer = scene.add.container(0, 0);
      emptyContainer.setScrollFactor(0);
      emptyContainer.setDepth(20001);
      emptyContainer.add(emptyText);
      this.container.add(emptyContainer);
      this.recipeRows.push(emptyContainer);
    }
  }

  show(station: CraftingStation): void {
    this._station = station;
    this.container.setVisible(true);
  }

  hide(): void {
    this.container.setVisible(false);
  }

  getContainer(): Phaser.GameObjects.Container { return this.container; }
}
