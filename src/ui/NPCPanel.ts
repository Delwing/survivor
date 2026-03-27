import Phaser from 'phaser';
import { InventorySlot, NPCState } from '@/types/entities';
import { NPC_DEFINITIONS, getNPCDef } from '@/config/npcs';
import { getItemDef } from '@/config/items';
import { NPCSystem } from '@/systems/NPCSystem';
import { ItemSystem } from '@/systems/ItemSystem';
import { EventBus } from '@/systems/EventBus';

const PANEL_X = 60;
const PANEL_Y = 30;
const PANEL_W = 840;
const PANEL_H = 480;

export class NPCPanel {
  private container: Phaser.GameObjects.Container;
  private dynamicContainer: Phaser.GameObjects.Container;

  private _inventory: InventorySlot[] = [];
  private _npcs: NPCState[] = [];
  private _unlockedTypes: string[] = [];

  constructor(
    private scene: Phaser.Scene,
    private npcSystem: NPCSystem,
    private itemSystem: ItemSystem,
    private eventBus: EventBus,
  ) {
    this.container = scene.add.container(0, 0);
    this.dynamicContainer = scene.add.container(0, 0);
    this.buildStaticUI();
    this.container.add(this.dynamicContainer);
  }

  private buildStaticUI(): void {
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
    const title = scene.add.text(PANEL_X + 16, PANEL_Y + 12, 'WORKERS', {
      fontSize: '14px', color: '#e2e8f0', fontStyle: 'bold',
    });
    this.container.add(title);

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

    // Hint at bottom
    const hint = scene.add.text(PANEL_X + 16, PANEL_Y + PANEL_H - 22, '[N] to close', {
      fontSize: '9px', color: '#475569',
    });
    this.container.add(hint);
  }

  update(inventory: InventorySlot[], npcs: NPCState[], unlockedTypes: string[]): void {
    this._inventory = inventory;
    this._npcs = npcs;
    this._unlockedTypes = unlockedTypes;
    this.rebuildDynamic();
  }

  private rebuildDynamic(): void {
    // Destroy and recreate all dynamic children
    this.dynamicContainer.removeAll(true);

    const scene = this.scene;
    const inv = this._inventory;
    const npcs = this._npcs;
    const unlocked = this._unlockedTypes;

    // ---- HIRE SECTION ----
    const hireHeaderY = PANEL_Y + 48;
    const hireHeader = scene.add.text(PANEL_X + 16, hireHeaderY, 'HIRE WORKERS', {
      fontSize: '11px', color: '#94a3b8', fontStyle: 'bold',
    });
    this.dynamicContainer.add(hireHeader);

    const availableTypes = NPC_DEFINITIONS.filter(def => unlocked.includes(def.id));

    if (availableTypes.length === 0) {
      const emptyText = scene.add.text(PANEL_X + 16, hireHeaderY + 20, 'No worker types unlocked yet.', {
        fontSize: '10px', color: '#64748b',
      });
      this.dynamicContainer.add(emptyText);
    } else {
      availableTypes.forEach((def, i) => {
        const rowX = PANEL_X + 16 + i * 200;
        const rowY = hireHeaderY + 18;
        const canAfford = this.itemSystem.hasItems(inv, def.hireCost);

        // Card background
        const cardBg = scene.add.graphics();
        cardBg.fillStyle(canAfford ? 0x1e3a5f : 0x1e293b, 0.85);
        cardBg.fillRect(rowX, rowY, 185, 70);
        cardBg.lineStyle(1, canAfford ? 0x3b82f6 : 0x334155);
        cardBg.strokeRect(rowX, rowY, 185, 70);
        this.dynamicContainer.add(cardBg);

        // NPC name
        const nameText = scene.add.text(rowX + 8, rowY + 8, def.name, {
          fontSize: '12px', color: '#e2e8f0', fontStyle: 'bold',
        });
        this.dynamicContainer.add(nameText);

        // Gather type label
        const gatherText = scene.add.text(rowX + 8, rowY + 26, `Gathers: ${def.gatherType}`, {
          fontSize: '9px', color: '#94a3b8',
        });
        this.dynamicContainer.add(gatherText);

        // Cost label
        const costParts = def.hireCost.map(c => {
          const itemDef = getItemDef(c.item);
          return `${c.count} ${itemDef?.name ?? c.item}`;
        }).join(', ');
        const costText = scene.add.text(rowX + 8, rowY + 40, `Cost: ${costParts}`, {
          fontSize: '9px', color: canAfford ? '#86efac' : '#f87171',
        });
        this.dynamicContainer.add(costText);

        // Hire button
        const btnColor = canAfford ? 0x166534 : 0x334155;
        const btnBg = scene.add.graphics();
        btnBg.fillStyle(btnColor, 1);
        btnBg.fillRect(rowX + 110, rowY + 36, 65, 22);
        this.dynamicContainer.add(btnBg);

        const btnLabel = scene.add.text(rowX + 142, rowY + 47, 'HIRE', {
          fontSize: '10px', color: canAfford ? '#bbf7d0' : '#64748b', fontStyle: 'bold',
        }).setOrigin(0.5);
        this.dynamicContainer.add(btnLabel);

        if (canAfford) {
          const hitZone = scene.add.zone(rowX + 142, rowY + 47, 65, 22)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true });
          hitZone.setDepth(20001);
          hitZone.on('pointerdown', () => {
            const unlockedSet = new Set(this._unlockedTypes);
            const hired = this.npcSystem.hire(def.id, this._inventory, this._npcs, unlockedSet);
            if (hired) this.rebuildDynamic();
          });
          this.dynamicContainer.add(hitZone);
        }
      });
    }

    // ---- DIVIDER ----
    const hireSectionH = availableTypes.length === 0 ? 40 : 100;
    const dividerY = hireHeaderY + hireSectionH;
    const midDiv = scene.add.graphics();
    midDiv.lineStyle(1, 0x334155);
    midDiv.lineBetween(PANEL_X + 16, dividerY, PANEL_X + PANEL_W - 16, dividerY);
    this.dynamicContainer.add(midDiv);

    // ---- ACTIVE NPCS SECTION ----
    const activeHeaderY = dividerY + 8;
    const activeHeader = scene.add.text(PANEL_X + 16, activeHeaderY, 'ACTIVE WORKERS', {
      fontSize: '11px', color: '#94a3b8', fontStyle: 'bold',
    });
    this.dynamicContainer.add(activeHeader);

    if (npcs.length === 0) {
      const noNPCs = scene.add.text(PANEL_X + 16, activeHeaderY + 20, 'No workers hired yet. Hire one above!', {
        fontSize: '10px', color: '#64748b',
      });
      this.dynamicContainer.add(noNPCs);
    } else {
      const listStartY = activeHeaderY + 20;
      const rowH = 80;
      const maxVisible = Math.floor((PANEL_Y + PANEL_H - 40 - listStartY) / rowH);

      npcs.slice(0, maxVisible).forEach((npc, i) => {
        const def = getNPCDef(npc.typeId);
        if (!def) return;

        const rowY = listStartY + i * rowH;
        const rowW = PANEL_W - 32;

        // Row background
        const rowBg = scene.add.graphics();
        rowBg.fillStyle(0x0f172a, 0.7);
        rowBg.fillRect(PANEL_X + 16, rowY, rowW, rowH - 6);
        rowBg.lineStyle(1, 0x334155);
        rowBg.strokeRect(PANEL_X + 16, rowY, rowW, rowH - 6);
        this.dynamicContainer.add(rowBg);

        // NPC name & type
        const npcName = scene.add.text(PANEL_X + 24, rowY + 6, def.name, {
          fontSize: '11px', color: '#e2e8f0', fontStyle: 'bold',
        });
        this.dynamicContainer.add(npcName);

        // Assigned resource
        const assignedLabel = npc.assignedResource
          ? (() => { const d = getItemDef(npc.assignedResource!); return d?.name ?? npc.assignedResource; })()
          : 'Unassigned';
        const assignedColor = npc.assignedResource ? '#93c5fd' : '#64748b';
        const assignedText = scene.add.text(PANEL_X + 24, rowY + 22, `Resource: ${assignedLabel}`, {
          fontSize: '10px', color: assignedColor,
        });
        this.dynamicContainer.add(assignedText);

        // Stored amount
        const storedLabel = npc.assignedResource
          ? (() => { const d = getItemDef(npc.assignedResource!); return `${npc.storedAmount}/${def.maxStorage} ${d?.name ?? npc.assignedResource}`; })()
          : `${npc.storedAmount}/${def.maxStorage}`;
        const storedText = scene.add.text(PANEL_X + 24, rowY + 38, `Stored: ${storedLabel}`, {
          fontSize: '10px', color: '#fbbf24',
        });
        this.dynamicContainer.add(storedText);

        // COLLECT button
        const canCollect = npc.storedAmount > 0 && npc.assignedResource !== null;
        const collectBg = scene.add.graphics();
        collectBg.fillStyle(canCollect ? 0x065f46 : 0x1e293b, 1);
        collectBg.fillRect(PANEL_X + 16 + rowW - 80, rowY + 6, 70, 22);
        this.dynamicContainer.add(collectBg);

        const collectLabel = scene.add.text(PANEL_X + 16 + rowW - 45, rowY + 17, 'COLLECT', {
          fontSize: '9px', color: canCollect ? '#6ee7b7' : '#475569', fontStyle: 'bold',
        }).setOrigin(0.5);
        this.dynamicContainer.add(collectLabel);

        if (canCollect) {
          const collectZone = scene.add.zone(PANEL_X + 16 + rowW - 45, rowY + 17, 70, 22)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true });
          collectZone.setDepth(20001);
          collectZone.on('pointerdown', () => {
            this.npcSystem.collect(npc, this._inventory);
            this.rebuildDynamic();
          });
          this.dynamicContainer.add(collectZone);
        }

        // ASSIGN buttons — one per valid resource (based on gatherType)
        // Map gatherType to itemIds: wood -> wood, stone -> stone, herbs -> herb
        const resourceMap: Record<string, string[]> = {
          wood:  ['wood'],
          stone: ['stone'],
          herbs: ['herb'],
        };
        const validResources = resourceMap[def.gatherType] ?? [def.gatherType];

        validResources.forEach((resId, ri) => {
          const resDef = getItemDef(resId);
          const resName = resDef?.name ?? resId;
          const isAssigned = npc.assignedResource === resId;

          const btnX = PANEL_X + 24 + ri * 100;
          const btnY = rowY + 54;
          const btnBg2 = scene.add.graphics();
          btnBg2.fillStyle(isAssigned ? 0x1e3a5f : 0x1e293b, 1);
          btnBg2.fillRect(btnX, btnY, 90, 18);
          btnBg2.lineStyle(1, isAssigned ? 0x60a5fa : 0x334155);
          btnBg2.strokeRect(btnX, btnY, 90, 18);
          this.dynamicContainer.add(btnBg2);

          const assignLabel = scene.add.text(btnX + 45, btnY + 9, `ASSIGN ${resName}`, {
            fontSize: '8px', color: isAssigned ? '#93c5fd' : '#94a3b8',
          }).setOrigin(0.5);
          this.dynamicContainer.add(assignLabel);

          if (!isAssigned) {
            const assignZone = scene.add.zone(btnX + 45, btnY + 9, 90, 18)
              .setScrollFactor(0)
              .setInteractive({ useHandCursor: true });
            assignZone.setDepth(20001);
            assignZone.on('pointerdown', () => {
              this.npcSystem.assignResource(npc, resId);
              this.rebuildDynamic();
            });
            this.dynamicContainer.add(assignZone);
          }
        });
      });
    }
  }

  show(): void { this.container.setVisible(true); }
  hide(): void { this.container.setVisible(false); }

  getContainer(): Phaser.GameObjects.Container { return this.container; }
}
