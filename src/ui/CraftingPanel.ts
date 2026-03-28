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
const ROW_H = 88;
const VISIBLE_ROWS = 4;
const TAB_H = 26;
const CONTENT_Y = PANEL_Y + 38 + TAB_H + 6;

type Category = 'all' | 'weapons' | 'armor' | 'tools' | 'consumables' | 'materials';

const CATEGORIES: { id: Category; label: string; types: string[] }[] = [
  { id: 'all', label: 'All', types: [] },
  { id: 'weapons', label: 'Weapons', types: ['weapon'] },
  { id: 'armor', label: 'Armor', types: ['armor'] },
  { id: 'tools', label: 'Tools', types: ['tool'] },
  { id: 'consumables', label: 'Food & Potions', types: ['consumable'] },
  { id: 'materials', label: 'Materials', types: ['resource', 'misc'] },
];

export class CraftingPanel {
  private container: Phaser.GameObjects.Container;
  private stationTitle!: Phaser.GameObjects.Text;
  private scrollIndicator!: Phaser.GameObjects.Text;
  private recipeRows: Phaser.GameObjects.Container[] = [];
  private tabElements: Phaser.GameObjects.GameObject[] = [];
  private scrollOffset = 0;
  private _allRecipes: RecipeDefinition[] = [];
  private _filteredRecipes: RecipeDefinition[] = [];
  private _inventory: InventorySlot[] = [];
  private _knownRecipes = new Set<string>();
  private _station: CraftingStation = 'hand';
  private _category: Category = 'all';
  private _crafting = false;
  private _craftTween: Phaser.Tweens.Tween | null = null;
  private _craftProgressBar: Phaser.GameObjects.Graphics | null = null;

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

    // Title
    this.stationTitle = scene.add.text(PANEL_X + 16, PANEL_Y + 12, 'CRAFTING', {
      fontSize: '14px', color: '#e2e8f0', fontStyle: 'bold',
    });
    this.container.add(this.stationTitle);

    // Close button
    const closeBtn = scene.add.text(PANEL_X + PANEL_W - 24, PANEL_Y + 12, 'X', {
      fontSize: '14px', color: '#f87171', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hide());
    this.container.add(closeBtn);

    // Divider below title
    const div = scene.add.graphics();
    div.lineStyle(1, 0x334155);
    div.lineBetween(PANEL_X + 16, PANEL_Y + 38, PANEL_X + PANEL_W - 16, PANEL_Y + 38);
    this.container.add(div);

    // Scroll buttons
    const scrollBtnW = 40;
    const scrollBtnH = 28;
    const scrollBtnX = PANEL_X + PANEL_W - 56;

    const scrollUpBg = scene.add.graphics();
    scrollUpBg.fillStyle(0x334155, 0.9);
    scrollUpBg.fillRect(scrollBtnX, CONTENT_Y, scrollBtnW, scrollBtnH);
    scrollUpBg.lineStyle(1, 0x475569);
    scrollUpBg.strokeRect(scrollBtnX, CONTENT_Y, scrollBtnW, scrollBtnH);
    this.container.add(scrollUpBg);
    const scrollUpText = scene.add.text(scrollBtnX + scrollBtnW / 2, CONTENT_Y + scrollBtnH / 2, '▲', {
      fontSize: '16px', color: '#e2e8f0',
    }).setOrigin(0.5);
    this.container.add(scrollUpText);
    const scrollUpZone = scene.add.zone(scrollBtnX + scrollBtnW / 2, CONTENT_Y + scrollBtnH / 2, scrollBtnW, scrollBtnH)
      .setScrollFactor(0).setInteractive({ useHandCursor: true }).setDepth(20003);
    scrollUpZone.on('pointerdown', () => {
      this.scrollOffset = Math.max(0, this.scrollOffset - VISIBLE_ROWS);
      this.refreshRows();
    });
    this.container.add(scrollUpZone);

    const scrollDownBg = scene.add.graphics();
    scrollDownBg.fillStyle(0x334155, 0.9);
    scrollDownBg.fillRect(scrollBtnX, PANEL_Y + PANEL_H - 50, scrollBtnW, scrollBtnH);
    scrollDownBg.lineStyle(1, 0x475569);
    scrollDownBg.strokeRect(scrollBtnX, PANEL_Y + PANEL_H - 50, scrollBtnW, scrollBtnH);
    this.container.add(scrollDownBg);
    const scrollDownText = scene.add.text(scrollBtnX + scrollBtnW / 2, PANEL_Y + PANEL_H - 50 + scrollBtnH / 2, '▼', {
      fontSize: '16px', color: '#e2e8f0',
    }).setOrigin(0.5);
    this.container.add(scrollDownText);
    const scrollDownZone = scene.add.zone(scrollBtnX + scrollBtnW / 2, PANEL_Y + PANEL_H - 50 + scrollBtnH / 2, scrollBtnW, scrollBtnH)
      .setScrollFactor(0).setInteractive({ useHandCursor: true }).setDepth(20003);
    scrollDownZone.on('pointerdown', () => {
      const maxOffset = Math.max(0, this._filteredRecipes.length - VISIBLE_ROWS);
      this.scrollOffset = Math.min(maxOffset, this.scrollOffset + VISIBLE_ROWS);
      this.refreshRows();
    });
    this.container.add(scrollDownZone);

    // Mouse wheel scrolling
    scene.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: any, _dx: number, dy: number) => {
      if (!this.container.visible) return;
      const maxOffset = Math.max(0, this._filteredRecipes.length - VISIBLE_ROWS);
      if (dy > 0) {
        this.scrollOffset = Math.min(maxOffset, this.scrollOffset + VISIBLE_ROWS);
      } else if (dy < 0) {
        this.scrollOffset = Math.max(0, this.scrollOffset - VISIBLE_ROWS);
      }
      this.refreshRows();
    });

    // Scroll indicator text
    this.scrollIndicator = scene.add.text(scrollBtnX + scrollBtnW / 2, PANEL_Y + PANEL_H / 2, '', {
      fontSize: '10px', color: '#64748b',
    }).setOrigin(0.5);
    this.container.add(this.scrollIndicator);

    // Hint
    const hint = scene.add.text(PANEL_X + 16, PANEL_Y + PANEL_H - 22, '[C] to close  |  Scroll: wheel or arrows  |  Green = craftable', {
      fontSize: '10px', color: '#475569',
    });
    this.container.add(hint);
  }

  private buildTabs(): void {
    const scene = this.scene;

    // Destroy old tabs
    for (const el of this.tabElements) el.destroy();
    this.tabElements = [];

    const tabY = PANEL_Y + 42;
    let tabX = PANEL_X + 16;

    for (const cat of CATEGORIES) {
      // Count recipes in this category
      const count = cat.id === 'all'
        ? this._allRecipes.length
        : this._allRecipes.filter(r => {
            const def = getItemDef(r.output.item);
            return def && cat.types.includes(def.type);
          }).length;

      if (count === 0 && cat.id !== 'all') continue;

      const isActive = this._category === cat.id;
      const label = `${cat.label} (${count})`;
      const padX = 10;

      // Measure text width
      const textW = label.length * 7;
      const btnW = textW + padX * 2;

      const bg = scene.add.graphics();
      if (isActive) {
        bg.fillStyle(0x3b82f6, 0.9);
        bg.fillRect(tabX, tabY, btnW, TAB_H);
      } else {
        bg.fillStyle(0x1e293b, 0.6);
        bg.fillRect(tabX, tabY, btnW, TAB_H);
        bg.lineStyle(1, 0x475569, 0.5);
        bg.strokeRect(tabX, tabY, btnW, TAB_H);
      }
      this.container.add(bg);
      this.tabElements.push(bg);

      const text = scene.add.text(tabX + btnW / 2, tabY + TAB_H / 2, label, {
        fontSize: '10px', color: isActive ? '#ffffff' : '#94a3b8', fontStyle: isActive ? 'bold' : 'normal',
      }).setOrigin(0.5);
      this.container.add(text);
      this.tabElements.push(text);

      const zone = scene.add.zone(tabX + btnW / 2, tabY + TAB_H / 2, btnW, TAB_H)
        .setScrollFactor(0).setInteractive({ useHandCursor: true }).setDepth(20003);
      zone.on('pointerdown', () => {
        this._category = cat.id;
        this.scrollOffset = 0;
        this.applyFilter();
        this.buildTabs();
        this.refreshRows();
      });
      this.container.add(zone);
      this.tabElements.push(zone);

      tabX += btnW + 4;
    }
  }

  private applyFilter(): void {
    const cat = CATEGORIES.find(c => c.id === this._category);
    if (!cat || cat.id === 'all') {
      this._filteredRecipes = this._allRecipes;
    } else {
      this._filteredRecipes = this._allRecipes.filter(r => {
        const def = getItemDef(r.output.item);
        return def && cat.types.includes(def.type);
      });
    }
  }

  update(inventory: InventorySlot[], knownRecipes: Set<string>, currentStation: CraftingStation): void {
    this._inventory = inventory;
    this._knownRecipes = knownRecipes;
    this._station = currentStation;

    this.stationTitle.setText('CRAFTING');

    this._allRecipes = this.craftingSystem.getKnownRecipes(knownRecipes).filter(r =>
      this.craftingSystem.stationCanCraft(currentStation, r.station)
    );
    this.scrollOffset = 0;
    this.applyFilter();
    this.buildTabs();
    this.refreshRows();
  }

  private refreshRows(): void {
    this.cancelCraft();

    // Destroy old row containers
    for (const row of this.recipeRows) {
      row.destroy();
    }
    this.recipeRows = [];

    const scene = this.scene;
    const startY = CONTENT_Y;
    const listX = PANEL_X + 16;
    const listW = PANEL_W - 80;

    const visibleRecipes = this._filteredRecipes.slice(this.scrollOffset, this.scrollOffset + VISIBLE_ROWS);

    // Update scroll indicator
    if (this.scrollIndicator) {
      const total = this._filteredRecipes.length;
      if (total > VISIBLE_ROWS) {
        this.scrollIndicator.setText(`${this.scrollOffset + 1}-${Math.min(this.scrollOffset + VISIBLE_ROWS, total)} / ${total}`);
      } else {
        this.scrollIndicator.setText('');
      }
    }

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
      const outputIconKey = `item_${recipe.output.item}`;
      if (scene.textures.exists(outputIconKey)) {
        const iconImg = scene.add.image(listX + 16, rowY + 20, outputIconKey);
        iconImg.setDisplaySize(20, 20);
        rowContainer.add(iconImg);
      } else {
        const outputDef = getItemDef(recipe.output.item);
        const icon = scene.add.graphics();
        icon.fillStyle(outputDef?.color ?? 0x888888, 1);
        icon.fillRect(listX + 6, rowY + 10, 20, 20);
        rowContainer.add(icon);
      }

      // Recipe name + output count
      const outputLabel = `${recipe.name}  x${recipe.output.count}`;
      const nameText = scene.add.text(listX + 34, rowY + 8, outputLabel, {
        fontSize: '12px', color: '#e2e8f0', fontStyle: 'bold',
      });
      rowContainer.add(nameText);

      // Description
      const outputDef = getItemDef(recipe.output.item);
      const desc = outputDef?.description ?? '';
      if (desc) {
        const descText = scene.add.text(listX + 34, rowY + 24, desc, {
          fontSize: '10px', color: '#94a3b8', wordWrap: { width: listW - 120 },
        });
        rowContainer.add(descText);
      }

      // Stat tags (ATK, DEF, SPD, etc.)
      const stats = outputDef?.stats;
      if (stats) {
        let tagX = listX + 34;
        const tagY = rowY + 38;
        const statEntries: [string, string, string][] = [];
        if (stats.attack) statEntries.push(['ATK', `+${stats.attack}`, '#f87171']);
        if (stats.defense) statEntries.push(['DEF', `+${stats.defense}`, '#60a5fa']);
        if (stats.attackSpeed) statEntries.push(['SPD', `${stats.attackSpeed}x`, '#fbbf24']);
        if (stats.speed) statEntries.push(['MOV', `+${stats.speed}`, '#34d399']);

        for (const [label, value, color] of statEntries) {
          const tagBg = scene.add.graphics();
          const tagW = 48;
          tagBg.fillStyle(0x0f172a, 0.8);
          tagBg.fillRect(tagX, tagY, tagW, 14);
          tagBg.lineStyle(1, Phaser.Display.Color.HexStringToColor(color).color, 0.5);
          tagBg.strokeRect(tagX, tagY, tagW, 14);
          rowContainer.add(tagBg);

          const tagText = scene.add.text(tagX + tagW / 2, tagY + 7, `${label} ${value}`, {
            fontSize: '10px', color, fontStyle: 'bold',
          }).setOrigin(0.5);
          rowContainer.add(tagText);
          tagX += tagW + 4;
        }
      }

      // Ingredients list with icons
      let ingX = listX + 34;
      const ingY = rowY + 56;
      for (const ing of recipe.ingredients) {
        const have = this.itemSystem.getItemCount(this._inventory, ing.item);
        const ingDef = getItemDef(ing.item);
        const ingName = ingDef?.name ?? ing.item;
        const enough = have >= ing.count;
        const ingColor = enough ? '#86efac' : '#f87171';

        const ingIconKey = `item_${ing.item}`;
        if (scene.textures.exists(ingIconKey)) {
          const ingIcon = scene.add.image(ingX + 5, ingY + 4, ingIconKey);
          ingIcon.setDisplaySize(10, 10);
          rowContainer.add(ingIcon);
          ingX += 14;
        }

        const ingText = scene.add.text(ingX, ingY, `${ingName} ${have}/${ing.count}`, {
          fontSize: '10px', color: ingColor,
        });
        rowContainer.add(ingText);
        ingX += ingText.width + 12;
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
          if (this._crafting) return;
          if (!this.craftingSystem.canCraft(recipe.id, this._inventory, this._knownRecipes, this._station)) return;
          this._crafting = true;

          const duration = 300 + (recipe.tier ?? 1) * 200;

          const progressBar = scene.add.graphics();
          progressBar.setDepth(20002);
          rowContainer.add(progressBar);
          this._craftProgressBar = progressBar;

          btnText.setText('...');

          const progress = { value: 0 };
          this._craftTween = scene.tweens.add({
            targets: progress,
            value: 1,
            duration,
            ease: 'Linear',
            onUpdate: () => {
              progressBar.clear();
              progressBar.fillStyle(0x22c55e, 0.5);
              progressBar.fillRect(btnX, btnY, btnW * progress.value, 24);
            },
            onComplete: () => {
              progressBar.destroy();
              this._craftProgressBar = null;
              this._craftTween = null;
              this._crafting = false;
              const success = this.craftingSystem.craft(recipe.id, this._inventory, this._knownRecipes, this._station);
              if (success) {
                this.onCrafted(recipe.output.item, recipe.output.count);
              }
              this.refreshAfterCraft();
            },
          });
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
        'No recipes discovered in this category yet.\nGather new materials to unlock recipes.',
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
    this.cancelCraft();
    this.container.setVisible(false);
  }

  private cancelCraft(): void {
    if (this._craftTween) {
      this._craftTween.stop();
      this._craftTween = null;
    }
    if (this._craftProgressBar) {
      this._craftProgressBar.destroy();
      this._craftProgressBar = null;
    }
    this._crafting = false;
  }

  private refreshAfterCraft(): void {
    this._allRecipes = this.craftingSystem.getKnownRecipes(this._knownRecipes).filter(r =>
      this.craftingSystem.stationCanCraft(this._station, r.station)
    );
    this.applyFilter();
    const maxOffset = Math.max(0, this._filteredRecipes.length - VISIBLE_ROWS);
    this.scrollOffset = Math.min(this.scrollOffset, maxOffset);
    this.buildTabs();
    this.refreshRows();
  }

  getContainer(): Phaser.GameObjects.Container { return this.container; }
}
