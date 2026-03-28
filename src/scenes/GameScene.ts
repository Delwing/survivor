import Phaser from 'phaser';
import { EventBus } from '@/systems/EventBus';
import { WorldSystem } from '@/systems/WorldSystem';
import { CombatSystem } from '@/systems/CombatSystem';
import { ItemSystem } from '@/systems/ItemSystem';
import { CraftingSystem } from '@/systems/CraftingSystem';
import { NPCSystem } from '@/systems/NPCSystem';
import { ProgressionSystem } from '@/systems/ProgressionSystem';
import { createPlayerState, createPlayerSprite } from '@/entities/Player';
import { TILE_WIDTH, TILE_HEIGHT, CHUNK_SIZE, RENDER_RADIUS } from '@/config/game-config';
import { BIOME_DEFINITIONS } from '@/config/biomes';
import { worldToScreen, screenToWorld } from '@/utils/iso';
import { chunkKey, distance } from '@/utils/math';
import { PlayerState, MobState } from '@/types/entities';
import { HUD } from '@/ui/HUD';
import { AbilityBar, AbilitySlot } from '@/ui/AbilityBar';
import { UIManager } from '@/ui/UIManager';
import { QuickInventory } from '@/ui/QuickInventory';
import { InventoryPanel } from '@/ui/InventoryPanel';
import { CraftingPanel } from '@/ui/CraftingPanel';
import { NPCPanel } from '@/ui/NPCPanel';
import { MapPanel } from '@/ui/MapPanel';
import { NPCState } from '@/types/entities';
import { MobAI } from '@/systems/MobAI';
import { MOB_DEFINITIONS } from '@/config/mobs';
import { createMobState, createMobSprite } from '@/entities/Mob';
import { ResourceNodeState } from '@/entities/ResourceNode';
import { getItemDef } from '@/config/items';
import { getGatherResult } from '@/config/gathering';
import { CraftingStation } from '@/types/items';
import { RECIPE_DEFINITIONS } from '@/config/recipes';
import { MusicSystem } from '@/audio/MusicSystem';
import { SFXSystem } from '@/audio/SFXSystem';

const GATHER_RANGE = 40; // must be this close to gather

// A rendered chunk: one baked sprite for tiles + individual sprites for resources
interface RenderedChunk {
  tileSprite: Phaser.GameObjects.Sprite;
  textureKey: string;
  resourceSprites: Phaser.GameObjects.Sprite[];
}

export class GameScene extends Phaser.Scene {
  private eventBus!: EventBus;
  private worldSystem!: WorldSystem;
  private combatSystem!: CombatSystem;
  private itemSystem!: ItemSystem;
  private craftingSystem!: CraftingSystem;
  private npcSystem!: NPCSystem;
  private progression!: ProgressionSystem;

  private player!: PlayerState;
  private playerSprite!: Phaser.GameObjects.Sprite;
  private moveTarget: { x: number; y: number } | null = null;

  private hud!: HUD;
  private abilityBar!: AbilityBar;
  private uiManager!: UIManager;
  private quickInventory!: QuickInventory;
  private inventoryPanel!: InventoryPanel;
  private craftingPanel!: CraftingPanel;
  private npcPanel!: NPCPanel;
  private mapPanel!: MapPanel;

  private activeNPCs: NPCState[] = [];

  private mobs: { state: MobState; sprite: Phaser.GameObjects.Sprite }[] = [];
  private resourceNodes: { state: ResourceNodeState; sprite: Phaser.GameObjects.Sprite }[] = [];
  private spawnedChunks = new Set<string>();
  private lastPlayerAttack = 0;
  private gatherTarget: { state: ResourceNodeState; sprite: Phaser.GameObjects.Sprite } | null = null;
  private stationTarget: { type: CraftingStation; x: number; y: number } | null = null;
  private mobTarget: { state: MobState; sprite: Phaser.GameObjects.Sprite } | null = null;
  private moveMarker!: Phaser.GameObjects.Graphics;
  private hoveredResource: Phaser.GameObjects.Sprite | null = null;
  private tooltip!: Phaser.GameObjects.Text;
  private mobHpBars = new Map<string, Phaser.GameObjects.Graphics>();

  private renderedChunks = new Map<string, RenderedChunk>();
  private currentChunkX = 0;
  private currentChunkY = 0;

  private runStartTime = 0;
  private knownRecipes = new Set<string>();
  private currentBiomeName = 'Forest';
  private currentBiomeId = 'forest';

  private lastStarveDamage = 0;
  private warnedHungry = false;
  private warnedStarving = false;

  private discoveredMaterials = new Set<string>();

  private placedStations: { type: CraftingStation; x: number; y: number; sprite: Phaser.GameObjects.Sprite }[] = [];
  private buildMenuOpen = false;
  private buildMenuContainer: Phaser.GameObjects.Container | null = null;
  private pendingBuild: CraftingStation | null = null;
  /** Set to true by any UI click handler; cleared at start of each frame */
  inputConsumed = false;
  /** True when the pointer is hovering over any fixed UI element */
  private pointerOverUI = false;

  private musicSystem!: MusicSystem;
  private sfx!: SFXSystem;
  private fpsText!: Phaser.GameObjects.Text;

  constructor() { super({ key: 'Game' }); }

  create(data: { seed: string }): void {
    // Init music system
    this.musicSystem = new MusicSystem();
    this.sfx = new SFXSystem();

    // Init systems
    this.eventBus = new EventBus();
    this.worldSystem = new WorldSystem(data.seed);
    this.combatSystem = new CombatSystem(this.eventBus);
    this.itemSystem = new ItemSystem(this.eventBus);
    this.craftingSystem = new CraftingSystem(this.eventBus, this.itemSystem);
    this.npcSystem = new NPCSystem(this.eventBus, this.itemSystem);
    this.progression = new ProgressionSystem(localStorage);

    // Init player
    this.player = createPlayerState();
    const spawnScreen = worldToScreen(0, 0);
    this.playerSprite = createPlayerSprite(this, spawnScreen.sx, spawnScreen.sy);
    this.cameras.main.startFollow(this.playerSprite, true, 0.1, 0.1);

    this.hud = new HUD(this);
    this.uiManager = new UIManager(this);
    const abilities: AbilitySlot[] = [
      { id: 'dash', label: '💨', cooldown: 0, maxCooldown: 3000, onActivate: () => this.useDash() },
      { id: 'power_strike', label: '⚔️', cooldown: 0, maxCooldown: 5000, onActivate: () => {} },
      { id: 'consumable', label: '🧪', cooldown: 0, maxCooldown: 1000, onActivate: () => {} },
    ];
    this.abilityBar = new AbilityBar(this, abilities);
    this.quickInventory = new QuickInventory(this, this.eventBus, () => this.uiManager.isOpen() || this.buildMenuOpen);

    // Inventory panel
    this.inventoryPanel = new InventoryPanel(this, this.itemSystem, this.eventBus);
    this.uiManager.registerPanel('inventory', this.inventoryPanel.getContainer());

    // I key — toggle inventory
    this.input.keyboard!.on('keydown-I', () => {
      this.uiManager.togglePanel('inventory');
      if (this.uiManager.isOpen()) {
        this.inventoryPanel.update(this.player.inventory, this.player.equipment);
      }
    });

    // Equipment-changed event
    this.eventBus.on('equipment-changed', (data: { slot: string; itemId: string }) => {
      if (data.slot === 'weapon') {
        this.player.equipment.weapon = data.itemId;
        this.recalcStats();
      } else if (data.slot === 'armor') {
        this.player.equipment.armor = data.itemId;
        this.recalcStats();
      }
    });

    // Consumable-used event
    this.eventBus.on('consumable-used', (data: { itemId: string }) => {
      const { itemId } = data;
      if (itemId === 'bandage') {
        this.player.stats.health = Math.min(this.player.stats.maxHealth, this.player.stats.health + 20);
        this.itemSystem.removeItem(this.player.inventory, itemId, 1);
        this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, '+20 HP', '#86efac');
      } else if (itemId === 'cooked_meat') {
        this.player.stats.health = Math.min(this.player.stats.maxHealth, this.player.stats.health + 15);
        this.player.stats.hunger = Math.min(this.player.stats.maxHunger, this.player.stats.hunger + 30);
        this.itemSystem.removeItem(this.player.inventory, itemId, 1);
        this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, '+15 HP +30 Food', '#fbbf24');
      } else if (itemId === 'berries') {
        this.player.stats.hunger = Math.min(this.player.stats.maxHunger, this.player.stats.hunger + 15);
        this.itemSystem.removeItem(this.player.inventory, itemId, 1);
        this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, '+15 Food', '#fbbf24');
      } else if (itemId === 'berry_jam') {
        this.player.stats.hunger = Math.min(this.player.stats.maxHunger, this.player.stats.hunger + 40);
        this.itemSystem.removeItem(this.player.inventory, itemId, 1);
        this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, '+40 Food', '#fbbf24');
      } else if (itemId === 'herbal_wrap') {
        this.player.stats.health = Math.min(this.player.stats.maxHealth, this.player.stats.health + 30);
        this.itemSystem.removeItem(this.player.inventory, itemId, 1);
        this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, '+30 HP', '#86efac');
      } else if (itemId === 'antidote') {
        this.player.stats.health = Math.min(this.player.stats.maxHealth, this.player.stats.health + 30);
        this.itemSystem.removeItem(this.player.inventory, itemId, 1);
        this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, '+30 HP', '#86efac');
      } else if (itemId === 'poison_vial') {
        this.itemSystem.removeItem(this.player.inventory, itemId, 1);
        this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, 'Poison Ready', '#7fff00');
      } else if (itemId === 'fire_potion') {
        this.itemSystem.removeItem(this.player.inventory, itemId, 1);
        this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, 'Fire Blast!', '#ff4500');
      } else if (itemId === 'purification_potion') {
        this.player.stats.health = this.player.stats.maxHealth;
        this.itemSystem.removeItem(this.player.inventory, itemId, 1);
        this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, 'Full Heal!', '#c070f0');
      }
      this.inventoryPanel.update(this.player.inventory, this.player.equipment);
    });

    // Crafting panel
    this.craftingPanel = new CraftingPanel(
      this, this.craftingSystem, this.itemSystem, this.eventBus,
      (itemId: string, count: number) => {
        const def = getItemDef(itemId);
        const name = def?.name ?? itemId;
        this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 24, `+${count} ${name}`, '#fbbf24');
        this.quickInventory.update(this.player.inventory, this.player.equipment.weapon);
      },
    );
    this.uiManager.registerPanel('crafting', this.craftingPanel.getContainer());

    // C key — toggle crafting panel
    this.input.keyboard!.on('keydown-C', () => {
      const station = this.getNearbyStation();
      this.uiManager.togglePanel('crafting');
      if (this.uiManager.isOpen()) {
        this.craftingPanel.show(station);
        this.craftingPanel.update(this.player.inventory, this.knownRecipes, station);
      }
    });

    // NPC panel
    this.npcPanel = new NPCPanel(this, this.npcSystem, this.itemSystem, this.eventBus);
    this.uiManager.registerPanel('npc', this.npcPanel.getContainer());

    // N key — toggle NPC panel
    this.input.keyboard!.on('keydown-N', () => {
      this.uiManager.togglePanel('npc');
      if (this.uiManager.isOpen()) {
        this.npcPanel.update(
          this.player.inventory,
          this.activeNPCs,
          this.progression.getSave().unlockedNPCTypes,
        );
      }
    });

    // Auto-unlock woodcutter on first run
    if (this.progression.getSave().unlockedNPCTypes.length === 0) {
      this.progression.unlockNPCType('woodcutter');
      this.progression.save();
    }

    // Map panel
    this.mapPanel = new MapPanel(this);
    this.uiManager.registerPanel('map', this.mapPanel.getContainer());

    // M key — toggle map panel
    this.input.keyboard!.on('keydown-M', () => {
      this.uiManager.togglePanel('map');
      if (this.uiManager.isOpen()) {
        this.mapPanel.update(this.currentChunkX, this.currentChunkY);
      }
    });

    // Load starting recipes
    this.knownRecipes = new Set(this.progression.getStartingRecipeIds());

    // Reset state
    this.renderedChunks = new Map();
    this.currentChunkX = 0;
    this.currentChunkY = 0;
    this.moveTarget = null;
    this.gatherTarget = null;
    this.hoveredResource = null;
    this.mobs = [];
    this.resourceNodes = [];
    this.spawnedChunks = new Set();
    this.lastPlayerAttack = 0;
    this.activeNPCs = [];

    // Move marker (small circle where you clicked)
    this.moveMarker = this.add.graphics();
    this.moveMarker.setDepth(9000);
    this.moveMarker.setVisible(false);

    // Hover tooltip
    this.tooltip = this.add.text(0, 0, '', {
      fontSize: '10px',
      color: '#ffffff',
      backgroundColor: '#000000aa',
      padding: { x: 4, y: 2 },
      stroke: '#000000',
      strokeThickness: 1,
    }).setDepth(9999).setVisible(false).setScrollFactor(0);

    // FPS counter (top-right corner)
    this.fpsText = this.add.text(this.cameras.main.width - 4, 4, '', {
      fontSize: '10px',
      color: '#88ff88',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(1, 0).setDepth(10000).setScrollFactor(0);

    // Clear old HP bars
    this.mobHpBars = new Map();

    // Render initial chunks
    this.updateChunks();

    // Track when pointer is over any fixed UI element (scrollFactor 0, high depth)
    this.input.on('gameobjectover', (_pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
      if ((obj as any).scrollFactorX === 0 || (obj as any).depth >= 10000) {
        this.pointerOverUI = true;
      }
    });
    this.input.on('gameobjectout', (_pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) => {
      if ((obj as any).scrollFactorX === 0 || (obj as any).depth >= 10000) {
        this.pointerOverUI = false;
      }
    });
    // Safety: if the object that set pointerOverUI was destroyed, the out event
    // never fires. Re-derive each frame from what's actually under the pointer.
    this.input.on('pointermove', () => {
      if (!this.pointerOverUI) return;
      const hitList = this.input.hitTestPointer(this.input.activePointer);
      this.pointerOverUI = hitList.some(
        (o: Phaser.GameObjects.GameObject) => (o as any).scrollFactorX === 0 || (o as any).depth >= 10000,
      );
    });

    // Any interactive game object clicked = consume input (don't walk)
    this.input.on('gameobjectdown', () => {
      this.inputConsumed = true;
    });

    // Input — click to move or gather
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Bootstrap audio on first user interaction (browser autoplay policy)
      this.musicSystem.init();
      this.musicSystem.start();
      const ctx = this.musicSystem.getAudioContext();
      if (ctx) this.sfx.init(ctx);

      // Ignore clicks when pointer is over any UI
      if (this.isInputBlockedByUI()) return;
      if (this.inputConsumed) return;

      // Check if clicking a station — walk to it, then open crafting
      for (const station of this.placedStations) {
        const d = distance(pointer.worldX, pointer.worldY, station.x, station.y);
        if (d < 35) {
          this.stationTarget = station;
          this.gatherTarget = null;
          this.mobTarget = null;
          this.moveTarget = { x: station.x, y: station.y };
          this.showMoveMarker(station.x, station.y, true);
          return;
        }
      }

      // Check if clicking a mob — follow and attack it
      let closestMob: typeof this.mobs[0] | null = null;
      let closestMobDist = 35;
      for (const mob of this.mobs) {
        if (mob.state.stats.health <= 0) continue;
        const d = distance(pointer.worldX, pointer.worldY, mob.sprite.x, mob.sprite.y);
        if (d < closestMobDist) {
          closestMobDist = d;
          closestMob = mob;
        }
      }
      if (closestMob) {
        this.mobTarget = closestMob;
        this.gatherTarget = null;
        this.stationTarget = null;
        this.moveTarget = { x: closestMob.sprite.x, y: closestMob.sprite.y };
        this.showMoveMarker(closestMob.sprite.x, closestMob.sprite.y, true);
        return;
      }

      // Check if clicking a resource — find closest one to click, walk to it, then gather
      let closestRes: typeof this.resourceNodes[0] | null = null;
      let closestDist = 30;
      for (const res of this.resourceNodes) {
        const d = distance(pointer.worldX, pointer.worldY, res.sprite.x, res.sprite.y);
        if (d < closestDist && res.state.remaining > 0) {
          closestDist = d;
          closestRes = res;
        }
      }
      if (closestRes) {
        // If already gathering this resource, ignore the click
        if (this.gatherTarget === closestRes) return;
        this.gatherTarget = closestRes;
        this.stationTarget = null;
        this.mobTarget = null;
        this.moveTarget = { x: closestRes.sprite.x, y: closestRes.sprite.y };
        this.showMoveMarker(closestRes.sprite.x, closestRes.sprite.y, true);
        return;
      }

      // Normal movement
      this.gatherTarget = null;
      this.stationTarget = null;
      this.mobTarget = null;
      this.moveTarget = { x: pointer.worldX, y: pointer.worldY };
      this.showMoveMarker(pointer.worldX, pointer.worldY, false);
    });

    // Hover detection for resources and mobs
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      // Reset previous hover
      if (this.hoveredResource) {
        this.hoveredResource.clearTint();
        this.hoveredResource = null;
      }
      this.input.setDefaultCursor('default');
      this.tooltip.setVisible(false);

      // Block hovers when pointer is over any UI element
      if (this.isInputBlockedByUI()) return;

      // Check station hover
      for (const station of this.placedStations) {
        const d = distance(pointer.worldX, pointer.worldY, station.x, station.y);
        if (d < 35) {
          const stationName = station.type.replace(/_/g, ' ');
          this.tooltip.setText(`${stationName}  (click to craft)`);
          this.tooltip.setPosition(pointer.x + 12, pointer.y - 8);
          this.tooltip.setVisible(true);
          this.input.setDefaultCursor('pointer');
          return;
        }
      }

      // Check mob hover
      for (const mob of this.mobs) {
        if (mob.state.stats.health <= 0) continue;
        const d = distance(pointer.worldX, pointer.worldY, mob.sprite.x, mob.sprite.y - 10);
        if (d < 25) {
          const def = MOB_DEFINITIONS.find(m => m.id === mob.state.typeId);
          const name = def?.name ?? 'Unknown';
          const hp = `${Math.ceil(mob.state.stats.health)}/${mob.state.stats.maxHealth}`;
          this.tooltip.setText(`${name}  HP: ${hp}`);
          this.tooltip.setPosition(pointer.x + 12, pointer.y - 8);
          this.tooltip.setVisible(true);
          this.input.setDefaultCursor('crosshair');
          return;
        }
      }

      // Check resource hover
      for (const res of this.resourceNodes) {
        if (res.state.remaining <= 0) continue;
        const d = distance(pointer.worldX, pointer.worldY, res.sprite.x, res.sprite.y);
        if (d < 30) {
          res.sprite.setTint(0xffffff);
          this.hoveredResource = res.sprite;
          const itemDef = getItemDef(res.state.itemId);
          const name = itemDef?.name ?? res.state.itemId;
          const gResult = getGatherResult(res.state.itemId, this.player.equipment.weapon);
          let info = `${name}  (${res.state.remaining} left)`;
          if (!gResult.canGather) {
            info += `  [${gResult.reason}]`;
          } else if (gResult.hitsNeeded > 1) {
            info += `  ${gResult.hitsNeeded} hits, +${gResult.yield}`;
          }
          this.tooltip.setText(info);
          this.tooltip.setPosition(pointer.x + 12, pointer.y - 8);
          this.tooltip.setVisible(true);
          this.input.setDefaultCursor(gResult.canGather ? 'pointer' : 'not-allowed');
          return;
        }
      }
    });

    // ESC — debug die
    this.input.keyboard!.on('keydown-ESC', () => {
      this.endRun('Debug exit');
    });

    // Listen for biome changes and map exploration
    this.eventBus.on('chunk-entered', (eventData) => {
      const biome = BIOME_DEFINITIONS.find(b => b.id === eventData.biomeId);
      this.currentBiomeName = biome?.name ?? 'Unknown';
      this.currentBiomeId = eventData.biomeId;
      this.mapPanel?.addExploredChunk(eventData.chunkX, eventData.chunkY, eventData.biomeId);
      this.musicSystem.setBiome(eventData.biomeId);
    });

    // Listen for item pickups — trigger recipe discovery
    this.eventBus.on('item-picked-up', (data: { itemId: string; count: number }) => {
      this.handleItemPickedUp(data.itemId);
    });

    this.runStartTime = this.time.now;
    this.eventBus.emit('run-started', { seed: data.seed });
  }

  update(time: number, delta: number): void {
    this.inputConsumed = false;
    // FPS counter
    this.fpsText.setText(`${Math.round(this.game.loop.actualFps)} FPS`);
    this.updateHunger(delta, time);
    this.updatePlayerMovement(delta);
    this.updateChunkTracking();
    this.hud.update(this.player, this.currentBiomeName);
    this.quickInventory.update(this.player.inventory, this.player.equipment.weapon);
    this.updateMobs(delta);

    // Update NPC gathering
    for (const npc of this.activeNPCs) {
      this.npcSystem.updateGathering(npc, delta);
    }

    if (this.inventoryPanel?.getContainer().visible) {
      this.inventoryPanel.update(this.player.inventory, this.player.equipment);
    }

    if (this.npcPanel?.getContainer().visible) {
      this.npcPanel.update(
        this.player.inventory,
        this.activeNPCs,
        this.progression.getSave().unlockedNPCTypes,
      );
    }

    if (this.mapPanel?.getContainer().visible) {
      this.mapPanel.update(this.currentChunkX, this.currentChunkY);
    }
  }

  // Max recipe tier discoverable via scroll per biome
  private static readonly BIOME_SCROLL_TIER: Record<string, number> = {
    forest: 3, rocky_highlands: 3, swamp: 3,
    volcanic_wastes: 4, corrupted_lands: 5,
  };

  private handleItemPickedUp(itemId: string): void {
    // Handle recipe scroll — tier-gated by current biome
    if (itemId === 'recipe_scroll') {
      const maxTier = GameScene.BIOME_SCROLL_TIER[this.currentBiomeId] ?? 3;
      const undiscovered = RECIPE_DEFINITIONS.filter(r => r.discovery === 'scroll' && r.tier <= maxTier && !this.knownRecipes.has(r.id));
      if (undiscovered.length > 0) {
        const recipe = undiscovered[Math.floor(Math.random() * undiscovered.length)];
        this.knownRecipes.add(recipe.id);
        this.progression.addRecipe(recipe.id);
        this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 30, `Learned: ${recipe.name}!`, '#ffd700');
      }
      this.itemSystem.removeItem(this.player.inventory, 'recipe_scroll', 1);
      return;
    }

    // Material-triggered discovery (only once per material type)
    if (!this.discoveredMaterials.has(itemId)) {
      this.discoveredMaterials.add(itemId);
      const triggered = this.craftingSystem.checkMaterialDiscovery(itemId);
      let recipeIdx = 0;
      for (const recipe of triggered) {
        if (!this.knownRecipes.has(recipe.id)) {
          this.knownRecipes.add(recipe.id);
          this.progression.addRecipe(recipe.id);
          const delay = recipeIdx * 600;
          this.time.delayedCall(delay, () => {
            this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 30, `New recipe: ${recipe.name}!`, '#fbbf24');
          });
          recipeIdx++;
        }
      }
    }
  }

  private updateHunger(delta: number, time: number): void {
    const { stats } = this.player;

    // Deplete hunger over time (~1 per second)
    stats.hunger = Math.max(0, Math.min(stats.maxHunger, stats.hunger - delta * 0.0002));

    // One-time threshold warnings
    if (stats.hunger < 30 && !this.warnedHungry) {
      this.warnedHungry = true;
      this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 30, 'Hungry!', '#fbbf24');
    }
    if (stats.hunger < 10 && !this.warnedStarving) {
      this.warnedStarving = true;
      this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 30, 'Starving!', '#ef4444');
    }
    // Reset warnings when hunger recovers above threshold
    if (stats.hunger >= 30) this.warnedHungry = false;
    if (stats.hunger >= 10) this.warnedStarving = false;

    // Starvation damage
    if (stats.hunger <= 0) {
      if (time - this.lastStarveDamage > 2000) {
        this.lastStarveDamage = time;
        stats.health = Math.max(0, stats.health - 2);
        this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, '-2 HP', '#ef4444');
        if (stats.health <= 0) this.endRun('Starvation');
      }
    } else if (stats.hunger < 10) {
      if (time - this.lastStarveDamage > 3000) {
        this.lastStarveDamage = time;
        stats.health = Math.max(0, stats.health - 1);
        this.showFloatingText(this.playerSprite.x, this.playerSprite.y - 20, '-1 HP', '#ef4444');
        if (stats.health <= 0) this.endRun('Starvation');
      }
    }
  }

  /** Recalculate player stats from base + equipment bonuses */
  private recalcStats(): void {
    const BASE_ATK = 3;
    const BASE_DEF = 0;
    const BASE_SPD = 1.0;

    const weaponDef = this.player.equipment.weapon ? getItemDef(this.player.equipment.weapon) : null;
    const armorDef = this.player.equipment.armor ? getItemDef(this.player.equipment.armor) : null;

    this.player.stats.attack = BASE_ATK + (weaponDef?.stats?.attack ?? 0);
    this.player.stats.defense = BASE_DEF + (armorDef?.stats?.defense ?? 0);
    this.player.stats.attackSpeed = BASE_SPD + (weaponDef?.stats?.attackSpeed ? weaponDef.stats.attackSpeed - 1.0 : 0);
    if (armorDef?.stats?.speed) {
      this.player.stats.speed = 120 + armorDef.stats.speed;
    } else {
      this.player.stats.speed = 120;
    }
  }

  private updatePlayerMovement(delta: number): void {
    // Follow mob target — always runs, even when moveTarget is null
    if (this.mobTarget) {
      if (this.mobTarget.state.stats.health <= 0) {
        this.mobTarget = null;
        this.moveTarget = null;
        this.moveMarker.setVisible(false);
        this.playerSprite.play('player_idle', true);
        return;
      }
      const mobDx = this.mobTarget.sprite.x - this.playerSprite.x;
      const mobDy = this.mobTarget.sprite.y - this.playerSprite.y;
      const mobDist = Math.sqrt(mobDx * mobDx + mobDy * mobDy);
      this.moveMarker.setPosition(this.mobTarget.sprite.x, this.mobTarget.sprite.y);
      // Hysteresis: stop at 36px, only resume chasing at 46px+
      const alreadyStopped = this.moveTarget === null;
      const stopThreshold = alreadyStopped ? 46 : 36;
      if (mobDist < stopThreshold) {
        // In attack range — stop and face mob
        this.moveTarget = null;
        this.playerSprite.setFlipX(mobDx < 0);
        const curAnim = this.playerSprite.anims?.currentAnim?.key;
        if (curAnim !== 'player_attack' && curAnim !== 'player_idle') {
          this.playerSprite.play('player_idle', true);
        }
        return;
      }
      // Out of range — chase
      this.moveTarget = { x: this.mobTarget.sprite.x, y: this.mobTarget.sprite.y };
    }

    if (!this.moveTarget) {
      // No target — play idle if not already (but don't interrupt attack or gather anim)
      const curAnim = this.playerSprite.anims?.currentAnim?.key;
      if (curAnim !== 'player_idle' && curAnim !== 'player_attack' && curAnim !== 'player_gather') {
        this.playerSprite.play('player_idle', true);
      }
      return;
    }

    const dx = this.moveTarget.x - this.playerSprite.x;
    const dy = this.moveTarget.y - this.playerSprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Check if we've arrived at a station target
    if (this.stationTarget && dist < GATHER_RANGE) {
      const stationType = this.stationTarget.type;
      this.stationTarget = null;
      this.moveTarget = null;
      this.moveMarker.setVisible(false);
      this.playerSprite.play('player_idle', true);
      // Open crafting for this station
      this.craftingPanel.show(stationType);
      this.craftingPanel.update(this.player.inventory, this.knownRecipes, stationType);
      this.uiManager.togglePanel('crafting');
      return;
    }

    // Check if we've arrived at a gather target
    if (this.gatherTarget && dist < GATHER_RANGE) {
      this.moveTarget = null;
      this.moveMarker.setVisible(false);
      this.doGatherHit(this.gatherTarget);
      return;
    }

    // Arrived at move target
    if (dist < 3) {
      this.moveTarget = null;
      this.moveMarker.setVisible(false);
      this.playerSprite.play('player_idle', true);
      return;
    }

    // Walking — play walk anim and flip based on direction
    if (this.playerSprite.anims?.currentAnim?.key !== 'player_walk') {
      this.playerSprite.play('player_walk', true);
    }
    this.playerSprite.setFlipX(dx < 0);

    const hungerMult = this.player.stats.hunger < 30 ? 0.75 : 1.0;
    const speed = this.player.stats.speed * hungerMult * (delta / 1000);
    this.playerSprite.x += (dx / dist) * speed;
    this.playerSprite.y += (dy / dist) * speed;
    this.player.position.x = this.playerSprite.x;
    this.player.position.y = this.playerSprite.y;
  }

  private doGatherHit(res: { state: ResourceNodeState; sprite: Phaser.GameObjects.Sprite }): void {
    if (res.state.remaining <= 0) {
      this.gatherTarget = null;
      this.playerSprite.play('player_idle', true);
      return;
    }

    const result = getGatherResult(res.state.itemId, this.player.equipment.weapon);

    // Can't gather without proper tool
    if (!result.canGather) {
      this.showFloatingText(res.sprite.x, res.sprite.y - 20, result.reason ?? 'Cannot gather', '#f87171');
      this.gatherTarget = null;
      this.playerSprite.play('player_idle', true);
      return;
    }

    // Face the resource and play gather animation (loops while gathering)
    this.playerSprite.setFlipX(res.sprite.x < this.playerSprite.x);
    const curAnim = this.playerSprite.anims?.currentAnim?.key;
    if (curAnim !== 'player_gather') {
      this.playerSprite.play('player_gather', true);
    }

    // Apply one hit
    res.state.hitProgress++;
    this.sfx.gatherHit();

    // Shake resource
    this.tweens.add({
      targets: res.sprite,
      x: res.sprite.x + 2,
      duration: 50,
      yoyo: true,
      repeat: 1,
    });

    // Show hit progress
    if (res.state.hitProgress < result.hitsNeeded) {
      this.showFloatingText(
        res.sprite.x, res.sprite.y - 16,
        `${res.state.hitProgress}/${result.hitsNeeded}`,
        '#94a3b8',
      );
      // Schedule next hit
      this.time.delayedCall(700, () => {
        if (this.gatherTarget === res && res.state.remaining > 0) {
          this.doGatherHit(res);
        }
      });
      return;
    }

    // Harvest complete — collect items
    this.sfx.gatherComplete();
    res.state.hitProgress = 0;
    res.state.remaining--;

    const itemDef = getItemDef(res.state.itemId);
    const name = itemDef?.name ?? res.state.itemId;
    this.itemSystem.addItem(this.player.inventory, res.state.itemId, result.yield);
    this.showFloatingText(res.sprite.x, res.sprite.y - 16, `+${result.yield} ${name}`, '#86efac');

    if (res.state.remaining <= 0) {
      res.sprite.setAlpha(0.2);
      this.gatherTarget = null;
      this.playerSprite.play('player_idle', true);
    } else {
      // Auto-continue gathering next unit
      this.time.delayedCall(700, () => {
        if (this.gatherTarget === res && res.state.remaining > 0) {
          this.doGatherHit(res);
        } else if (!this.gatherTarget) {
          this.playerSprite.play('player_idle', true);
        }
      });
    }
  }

  private showFloatingText(x: number, y: number, text: string, color = '#ffffff'): void {
    const floatText = this.add.text(x, y, text, {
      fontSize: '10px',
      color,
      stroke: '#000000',
      strokeThickness: 2,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(9999);

    this.tweens.add({
      targets: floatText,
      y: y - 20,
      alpha: 0,
      duration: 800,
      onComplete: () => floatText.destroy(),
    });
  }

  /** Draw/update a small HP bar above a mob (only shown when damaged) */
  private updateMobHpBar(mob: { state: MobState; sprite: Phaser.GameObjects.Sprite }): void {
    const { stats } = mob.state;
    const hpPct = stats.health / stats.maxHealth;

    // Don't show HP bar at full health
    if (hpPct >= 1) {
      const existing = this.mobHpBars.get(mob.state.id);
      if (existing) { existing.destroy(); this.mobHpBars.delete(mob.state.id); }
      return;
    }

    let bar = this.mobHpBars.get(mob.state.id);
    if (!bar) {
      bar = this.add.graphics();
      this.mobHpBars.set(mob.state.id, bar);
    }

    const barW = 20;
    const barH = 3;
    const bx = mob.sprite.x - barW / 2;
    const by = mob.sprite.y - mob.sprite.height - 6;

    bar.clear();
    bar.setDepth(mob.sprite.y + 1);

    // Background
    bar.fillStyle(0x000000, 0.6);
    bar.fillRect(bx - 1, by - 1, barW + 2, barH + 2);

    // Health fill — green to red
    const color = hpPct > 0.5 ? 0x44cc44 : hpPct > 0.25 ? 0xccaa22 : 0xcc3333;
    bar.fillStyle(color);
    bar.fillRect(bx, by, barW * hpPct, barH);
  }

  private showMoveMarker(x: number, y: number, isGather: boolean): void {
    this.moveMarker.clear();
    this.moveMarker.setPosition(x, y);
    if (isGather) {
      // Yellow ring for gather/target
      this.moveMarker.lineStyle(1, 0xf0c040, 0.8);
      this.moveMarker.strokeCircle(0, 0, 6);
    } else {
      // White dot for movement
      this.moveMarker.fillStyle(0xffffff, 0.5);
      this.moveMarker.fillCircle(0, 0, 3);
    }
    this.moveMarker.setVisible(true);
  }

  private updateChunkTracking(): void {
    // Player sprite is in screen space — convert back to world space for chunk lookup
    const { wx, wy } = screenToWorld(this.playerSprite.x, this.playerSprite.y);
    const approxChunkX = Math.floor(wx / (CHUNK_SIZE * TILE_WIDTH / 2));
    const approxChunkY = Math.floor(wy / (CHUNK_SIZE * TILE_HEIGHT));
    if (approxChunkX !== this.currentChunkX || approxChunkY !== this.currentChunkY) {
      this.currentChunkX = approxChunkX;
      this.currentChunkY = approxChunkY;
      this.updateChunks();
      const chunk = this.worldSystem.getChunk(this.currentChunkX, this.currentChunkY);
      const centerTile = chunk.tiles[Math.floor(CHUNK_SIZE / 2)][Math.floor(CHUNK_SIZE / 2)];
      this.eventBus.emit('chunk-entered', {
        chunkX: this.currentChunkX,
        chunkY: this.currentChunkY,
        biomeId: centerTile.biomeId,
      });
    }
  }

  private updateChunks(): void {
    const neededKeys = new Set<string>();
    for (let dy = -RENDER_RADIUS; dy <= RENDER_RADIUS; dy++) {
      for (let dx = -RENDER_RADIUS; dx <= RENDER_RADIUS; dx++) {
        neededKeys.add(chunkKey(this.currentChunkX + dx, this.currentChunkY + dy));
      }
    }

    // Remove old chunks
    for (const [key, rendered] of this.renderedChunks) {
      if (!neededKeys.has(key)) {
        rendered.tileSprite.destroy();
        this.textures.remove(rendered.textureKey);
        rendered.resourceSprites.forEach(s => s.destroy());
        this.renderedChunks.delete(key);
      }
    }

    // Remove resource nodes from unloaded chunks
    this.resourceNodes = this.resourceNodes.filter(r => r.sprite.active);

    // Add new chunks
    for (const key of neededKeys) {
      if (!this.renderedChunks.has(key)) {
        const [cx, cy] = key.split(',').map(Number);
        this.renderChunk(cx, cy);
        this.spawnEntitiesForChunk(cx, cy);
      }
    }
  }

  /**
   * Biome ground palettes. Each biome has a set of base colors that tiles
   * randomly pick from, plus a subtle edge shade color.
   */
  private static readonly BIOME_GROUNDS: Record<string, {
    bases: number[]; edge: number; details: number[];
    subA: number; subB: number;
  }> = {
    forest: {
      bases: [0x3e8948, 0x448e4c, 0x3a8244, 0x4a9a52, 0x408a48, 0x368040],
      edge: 0x2c6e36,
      details: [0x56b050, 0x4a9a52, 0xf0c040, 0xe08040, 0x6b4226, 0x5a3a1a],
      subA: 0x346e3c,   // darker shadow patch
      subB: 0x52a858,   // lighter highlight patch
    },
    rocky_highlands: {
      bases: [0x787878, 0x828282, 0x6e6e6e, 0x8a8a8a, 0x747474, 0x808080],
      edge: 0x585858,
      details: [0x505050, 0x959595, 0x404040, 0xaaaaaa, 0x686868, 0x303030],
      subA: 0x606060,
      subB: 0x949494,
    },
    swamp: {
      bases: [0x3a5c3a, 0x3d5a30, 0x354e35, 0x425838, 0x384f2e, 0x3e5535],
      edge: 0x2a3f2a,
      details: [0x1a2e2e, 0x2a6e30, 0x4a5a2a, 0x1c3c1c, 0x8b7340, 0x6b5830],
      subA: 0x2a4020,
      subB: 0x486840,
    },
    volcanic_wastes: {
      bases: [0x4a2020, 0x522828, 0x442020, 0x3c1a1a, 0x4e2424, 0x401c1c],
      edge: 0x2e1414,
      details: [0xff4400, 0xff6600, 0xff8800, 0xffaa00, 0x282828, 0x1a1a1a],
      subA: 0x2e1010,
      subB: 0x602020,
    },
    corrupted_lands: {
      bases: [0x2a0048, 0x300055, 0x250040, 0x350060, 0x2d004d, 0x320058],
      edge: 0x1a0030,
      details: [0x8b00ff, 0xcc44ff, 0xff00ff, 0xaa00cc, 0x080008, 0x100020],
      subA: 0x180030,
      subB: 0x440070,
    },
  };

  /** Simple deterministic hash for tile variation */
  private static tileHash(x: number, y: number): number {
    let h = (x * 374761393 + y * 668265263) | 0;
    h = (h ^ (h >> 13)) * 1274126177;
    h = h ^ (h >> 16);
    return (h >>> 0) / 4294967296; // 0..1
  }

  /**
   * Draw all tiles in a chunk, bake to a static texture, and display as a single sprite.
   * This avoids Phaser re-executing thousands of Graphics draw calls every frame.
   */
  private renderChunk(cx: number, cy: number): void {
    const chunk = this.worldSystem.getChunk(cx, cy);
    const hw = TILE_WIDTH / 2;
    const hh = TILE_HEIGHT / 2;
    const pad = 4; // small padding for detail overflow (grass blades etc.)

    // Compute the screen-space bounding box of this chunk's isometric tiles.
    // sx = (absX - absY) * 24,  sy = (absX + absY) * 12
    const ax0 = cx * CHUNK_SIZE, ay0 = cy * CHUNK_SIZE;
    const ax1 = ax0 + CHUNK_SIZE - 1, ay1 = ay0 + CHUNK_SIZE - 1;
    const originX = (ax0 - ay1) * (TILE_WIDTH / 2) - hw - pad;
    const originY = (ax0 + ay0) * (TILE_HEIGHT / 2) - hh - pad;
    const maxX = (ax1 - ay0) * (TILE_WIDTH / 2) + hw + pad;
    const maxY = (ax1 + ay1) * (TILE_HEIGHT / 2) + hh + pad;
    const texW = maxX - originX;
    const texH = maxY - originY;

    // Draw on an off-screen Graphics using local coordinates (offset by originX/Y)
    const gfx = this.make.graphics({});
    const resourceSprites: Phaser.GameObjects.Sprite[] = [];

    for (let row = 0; row < CHUNK_SIZE; row++) {
      for (let col = 0; col < CHUNK_SIZE; col++) {
        const tile = chunk.tiles[row][col];
        const absX = ax0 + col;
        const absY = ay0 + row;
        const worldX = absX * TILE_WIDTH / 2;
        const worldY = absY * TILE_HEIGHT;
        const { sx: absSx, sy: absSy } = worldToScreen(worldX, worldY);
        // Local coordinates for the baked texture
        const sx = absSx - originX;
        const sy = absSy - originY;

        const ground = GameScene.BIOME_GROUNDS[tile.biomeId] ?? GameScene.BIOME_GROUNDS.forest;
        const h = GameScene.tileHash(absX, absY);
        const h2 = GameScene.tileHash(absX + 997, absY + 1013);
        const h3 = GameScene.tileHash(absX + 2003, absY + 2017);

        const baseColor = ground.bases[Math.floor(h * ground.bases.length)];

        // Full diamond fill
        gfx.fillStyle(baseColor);
        gfx.beginPath();
        gfx.moveTo(sx, sy - hh);
        gfx.lineTo(sx + hw, sy);
        gfx.lineTo(sx, sy + hh);
        gfx.lineTo(sx - hw, sy);
        gfx.closePath();
        gfx.fillPath();

        // Sub-region texture
        const h4 = GameScene.tileHash(absX + 3001, absY + 3011);
        const h5 = GameScene.tileHash(absX + 4007, absY + 4003);

        const q1x = hw * (0.25 + h * 0.35);        const q1y = -hh * (0.15 + h2 * 0.4);
        const q2x = hw * (0.15 + h3 * 0.35);       const q2y = hh * (0.2 + h4 * 0.35);
        const q3x = -hw * (0.2 + h5 * 0.35);       const q3y = hh * (0.15 + h * 0.35);
        const q4x = -hw * (0.25 + h4 * 0.3);       const q4y = -hh * (0.2 + h3 * 0.3);
        const ccx = (h2 - 0.5) * hw * 0.25;        const ccy = (h5 - 0.5) * hh * 0.25;

        gfx.fillStyle(ground.subA, 0.3);
        gfx.fillRect(sx + q1x, sy + q1y, 2, 1);
        gfx.fillRect(sx + q2x, sy + q2y, 1, 1);
        gfx.fillRect(sx + q3x, sy + q3y, 1, 2);
        gfx.fillRect(sx + q4x, sy + q4y, 2, 1);

        gfx.fillStyle(ground.subB, 0.22);
        gfx.fillRect(sx + q2x + 2, sy + q2y - 1, 2, 1);
        gfx.fillRect(sx + q4x - 1, sy + q4y + 1, 1, 1);
        gfx.fillRect(sx + ccx, sy + ccy, 1, 1);

        const altBase = ground.bases[Math.floor(h3 * ground.bases.length)];
        gfx.fillStyle(altBase, 0.35);
        gfx.fillRect(sx + q1x - 3, sy + q1y + 1, 1, 1);
        gfx.fillRect(sx + q3x + 2, sy + q3y - 1, 1, 1);

        gfx.lineStyle(1, ground.edge, 0.45);
        gfx.lineBetween(sx + hw, sy, sx, sy + hh);
        gfx.lineBetween(sx, sy + hh, sx - hw, sy);

        // Biome details
        this.drawTileDetails(gfx, sx, sy, hw, hh, tile.biomeId, ground.details, h, h2, h3, h4, h5);

        // Resource node sprite (uses absolute world positions, not local)
        if (tile.resourceNodeId) {
          const resKey = `res_${tile.resourceNodeId}`;
          const resUseKey = this.textures.exists(resKey) ? resKey : 'resource_node';
          const resSprite = this.add.sprite(absSx, absSy - 8, resUseKey);
          resSprite.setOrigin(0.5, 1);
          resSprite.setDepth(absSy);
          resourceSprites.push(resSprite);

          this.resourceNodes.push({
            state: {
              id: `res-${cx}-${row}-${col}`,
              itemId: tile.resourceNodeId,
              position: { x: absSx, y: absSy - 8 },
              remaining: 1 + Math.floor(Math.random() * 3),
              hitProgress: 0,
            },
            sprite: resSprite,
          });
        }
      }
    }

    // Bake Graphics to a static texture, then display as a single sprite
    const texKey = `chunk_${cx}_${cy}`;
    gfx.generateTexture(texKey, texW, texH);
    gfx.destroy();

    const tileSprite = this.add.sprite(originX + texW / 2, originY + texH / 2, texKey);
    tileSprite.setDepth(-10000);

    this.renderedChunks.set(chunkKey(cx, cy), { tileSprite, textureKey: texKey, resourceSprites });
  }

  /** Draw scattered detail marks on tiles — dots, short lines, and small rectangles.
   *  Uses quadrant-based placement so details cover the full diamond area.
   *  Every tile gets base details; h2 < 0.55 tiles get bonus extras. */
  private drawTileDetails(
    gfx: Phaser.GameObjects.Graphics,
    sx: number, sy: number,
    hw: number, hh: number,
    biome: string,
    detailColors: number[],
    h: number, h2: number, h3: number, h4: number, h5: number,
  ): void {
    // 5 anchor points spread across the diamond via quadrant placement.
    // Diamond rule: |x|/hw + |y|/hh <= 1. Each anchor sits at 50-85% radius.
    const tr_x = hw * (0.3 + h * 0.4);       const tr_y = -hh * (0.2 + h2 * 0.45);
    const br_x = hw * (0.2 + h3 * 0.4);      const br_y = hh * (0.25 + h4 * 0.4);
    const bl_x = -hw * (0.25 + h5 * 0.4);    const bl_y = hh * (0.2 + h * 0.4);
    const tl_x = -hw * (0.3 + h4 * 0.35);    const tl_y = -hh * (0.25 + h3 * 0.35);
    const cn_x = (h2 - 0.5) * hw * 0.3;      const cn_y = (h5 - 0.5) * hh * 0.3;
    // Mid-points between quadrants for extra fill
    const mt_x = (tr_x + tl_x) * 0.5;        const mt_y = (tr_y + tl_y) * 0.5;  // mid-top
    const mb_x = (br_x + bl_x) * 0.5;        const mb_y = (br_y + bl_y) * 0.5;  // mid-bottom
    const rich = h2 < 0.55; // ~55% of tiles get richer detail

    switch (biome) {
      case 'forest': {
        // Grass blades — always 2 tufts in opposite quadrants
        gfx.lineStyle(1, detailColors[h2 < 0.3 ? 0 : 1], 0.5);
        gfx.lineBetween(sx + tr_x, sy + tr_y, sx + tr_x - 1, sy + tr_y - 2);
        gfx.lineBetween(sx + tr_x + 2, sy + tr_y, sx + tr_x + 3, sy + tr_y - 2);
        gfx.lineStyle(1, detailColors[0], 0.4);
        gfx.lineBetween(sx + bl_x, sy + bl_y, sx + bl_x - 1, sy + bl_y - 2);
        gfx.lineBetween(sx + bl_x + 2, sy + bl_y, sx + bl_x + 1, sy + bl_y - 2);
        // Always a leaf dot and dirt patch
        gfx.fillStyle(detailColors[2], 0.55);
        gfx.fillRect(sx + br_x, sy + br_y, 1, 1);
        gfx.fillStyle(detailColors[4], 0.35);
        gfx.fillRect(sx + cn_x, sy + cn_y, 2, 1);
        // Rich tiles: extra grass tuft + leaf + dirt
        if (rich) {
          gfx.lineStyle(1, detailColors[1], 0.45);
          gfx.lineBetween(sx + tl_x, sy + tl_y, sx + tl_x + 1, sy + tl_y - 2);
          gfx.lineBetween(sx + mt_x, sy + mt_y, sx + mt_x - 1, sy + mt_y - 2);
          gfx.fillStyle(detailColors[3], 0.55);
          gfx.fillRect(sx + tl_x + 2, sy + tl_y + 1, 1, 1);
          gfx.fillRect(sx + mb_x, sy + mb_y, 1, 1);
          gfx.fillStyle(detailColors[4], 0.3);
          gfx.fillRect(sx + br_x - 2, sy + br_y - 1, 1, 1);
        }
        break;
      }
      case 'rocky_highlands': {
        // Gravel dots — always in all 4 quadrants + center
        gfx.fillStyle(detailColors[1], 0.4);
        gfx.fillRect(sx + tr_x, sy + tr_y, 1, 1);
        gfx.fillRect(sx + bl_x, sy + bl_y, 1, 1);
        gfx.fillStyle(detailColors[3], 0.35);
        gfx.fillRect(sx + br_x, sy + br_y, 1, 1);
        gfx.fillRect(sx + tl_x, sy + tl_y, 1, 1);
        gfx.fillRect(sx + cn_x, sy + cn_y, 1, 1);
        // Always one crack
        gfx.lineStyle(1, detailColors[5], 0.4);
        gfx.lineBetween(sx + tr_x, sy + tr_y, sx + tr_x + 4, sy + tr_y + 2);
        // Shadow rectangle
        gfx.fillStyle(detailColors[2], 0.25);
        gfx.fillRect(sx + br_x - 1, sy + br_y, 2, 1);
        // Rich: extra gravel, second crack, highlight
        if (rich) {
          gfx.fillStyle(detailColors[0], 0.35);
          gfx.fillRect(sx + mt_x, sy + mt_y, 1, 1);
          gfx.fillRect(sx + mb_x, sy + mb_y, 1, 1);
          gfx.lineStyle(1, detailColors[2], 0.35);
          gfx.lineBetween(sx + bl_x, sy + bl_y, sx + bl_x + 3, sy + bl_y + 1);
          gfx.fillStyle(detailColors[3], 0.2);
          gfx.fillRect(sx + tl_x + 2, sy + tl_y + 1, 2, 1);
        }
        break;
      }
      case 'swamp': {
        // Water dots — always in all 4 quadrants
        gfx.fillStyle(detailColors[0], 0.45);
        gfx.fillRect(sx + tr_x, sy + tr_y, 1, 1);
        gfx.fillRect(sx + bl_x, sy + bl_y, 2, 1);
        gfx.fillStyle(detailColors[3], 0.4);
        gfx.fillRect(sx + tl_x, sy + tl_y, 1, 1);
        gfx.fillRect(sx + br_x, sy + br_y, 1, 1);
        // Mud patch always
        gfx.fillStyle(detailColors[4], 0.4);
        gfx.fillRect(sx + cn_x, sy + cn_y, 2, 1);
        // Bubble dot
        gfx.fillStyle(0x8ecece, 0.45);
        gfx.fillRect(sx + tr_x + 1, sy + tr_y - 1, 1, 1);
        // Rich: extra water, bubbles, moss line
        if (rich) {
          gfx.fillStyle(detailColors[0], 0.35);
          gfx.fillRect(sx + mt_x, sy + mt_y, 1, 1);
          gfx.fillRect(sx + mb_x, sy + mb_y, 2, 1);
          gfx.fillStyle(0x8ecece, 0.4);
          gfx.fillRect(sx + bl_x + 1, sy + bl_y - 1, 1, 1);
          gfx.lineStyle(1, detailColors[1], 0.4);
          gfx.lineBetween(sx + br_x, sy + br_y, sx + br_x + 3, sy + br_y + 1);
        }
        break;
      }
      case 'volcanic_wastes': {
        // Lava vein always
        gfx.lineStyle(1, detailColors[0], 0.5);
        gfx.lineBetween(sx + tr_x - 2, sy + tr_y, sx + tr_x + 3, sy + tr_y + 1);
        // Ember dots always in 3 quadrants
        gfx.fillStyle(detailColors[2], 0.65);
        gfx.fillRect(sx + br_x, sy + br_y, 1, 1);
        gfx.fillStyle(detailColors[3], 0.55);
        gfx.fillRect(sx + tl_x, sy + tl_y, 1, 1);
        gfx.fillRect(sx + cn_x, sy + cn_y, 1, 1);
        // Ash patch always
        gfx.fillStyle(detailColors[4], 0.3);
        gfx.fillRect(sx + bl_x, sy + bl_y, 2, 1);
        // Rich: second vein, more embers, cooled crack
        if (rich) {
          gfx.lineStyle(1, detailColors[1], 0.45);
          gfx.lineBetween(sx + bl_x - 1, sy + bl_y, sx + bl_x + 3, sy + bl_y + 1);
          gfx.fillStyle(detailColors[2], 0.6);
          gfx.fillRect(sx + mt_x, sy + mt_y, 1, 1);
          gfx.fillRect(sx + mb_x, sy + mb_y, 1, 1);
          gfx.lineStyle(1, detailColors[5], 0.45);
          gfx.lineBetween(sx + br_x, sy + br_y, sx + br_x + 4, sy + br_y + 2);
        }
        break;
      }
      case 'corrupted_lands': {
        // Energy vein always
        gfx.lineStyle(1, detailColors[0], 0.5);
        gfx.lineBetween(sx + tr_x - 2, sy + tr_y, sx + tr_x + 3, sy + tr_y + 1);
        // Rune dots always in 3 quadrants
        gfx.fillStyle(detailColors[2], 0.8);
        gfx.fillRect(sx + bl_x + 2, sy + bl_y + 1, 1, 1);
        gfx.fillRect(sx + tl_x, sy + tl_y, 1, 1);
        // Void patches always
        gfx.fillStyle(detailColors[4], 0.5);
        gfx.fillRect(sx + br_x, sy + br_y, 2, 1);
        gfx.fillRect(sx + cn_x, sy + cn_y, 1, 1);
        // Rich: second vein, more rune dots, corruption speckle
        if (rich) {
          gfx.lineStyle(1, detailColors[1], 0.45);
          gfx.lineBetween(sx + bl_x - 3, sy + bl_y, sx + bl_x + 2, sy + bl_y + 1);
          gfx.fillStyle(detailColors[2], 0.75);
          gfx.fillRect(sx + tr_x, sy + tr_y - 2, 1, 1);
          gfx.fillRect(sx + mt_x, sy + mt_y, 1, 1);
          gfx.fillStyle(detailColors[5], 0.35);
          gfx.fillRect(sx + mb_x, sy + mb_y, 1, 2);
        }
        break;
      }
    }
  }

  private spawnEntitiesForChunk(cx: number, cy: number): void {
    const key = chunkKey(cx, cy);
    if (this.spawnedChunks.has(key)) return;
    this.spawnedChunks.add(key);

    const chunk = this.worldSystem.getChunk(cx, cy);
    const centerTile = chunk.tiles[Math.floor(CHUNK_SIZE / 2)][Math.floor(CHUNK_SIZE / 2)];
    const biome = BIOME_DEFINITIONS.find(b => b.id === centerTile.biomeId);
    if (!biome) return;

    const mobCount = Math.floor(Math.random() * biome.mobDensity);
    for (let i = 0; i < mobCount; i++) {
      const validMobs = MOB_DEFINITIONS.filter(m => biome.mobs.includes(m.id));
      if (validMobs.length === 0) continue;
      const mobDef = validMobs[Math.floor(Math.random() * validMobs.length)];
      const tileX = Math.floor(Math.random() * CHUNK_SIZE);
      const tileY = Math.floor(Math.random() * CHUNK_SIZE);
      const worldX = (cx * CHUNK_SIZE + tileX) * TILE_WIDTH / 2;
      const worldY = (cy * CHUNK_SIZE + tileY) * TILE_HEIGHT;
      const { sx, sy } = worldToScreen(worldX, worldY);
      const state = createMobState(mobDef.id, sx, sy);
      if (!state) continue;
      const sprite = createMobSprite(this, sx, sy, mobDef);
      if (mobDef.id === 'cave_bat') {
        sprite.play('bat_fly');
      }
      this.mobs.push({ state, sprite });
    }
  }

  private updateMobs(delta: number): void {
    const playerPos = { x: this.playerSprite.x, y: this.playerSprite.y };

    for (const mob of this.mobs) {
      if (mob.state.stats.health <= 0) continue;

      const def = MOB_DEFINITIONS.find(m => m.id === mob.state.typeId);
      if (!def) continue;

      // Only update mobs near the player (skip distant ones)
      const distToPlayer = distance(
        mob.state.position.x, mob.state.position.y,
        playerPos.x, playerPos.y
      );
      if (distToPlayer > 600) continue;

      // Update AI
      mob.state = MobAI.update(mob.state, playerPos, def.category, delta);

      // Movement
      const dir = MobAI.getMovementDirection(mob.state, playerPos);
      const speed = mob.state.stats.speed * dir.speedMult * (delta / 1000);
      const isMoving = dir.dx !== 0 || dir.dy !== 0;

      // When attacking, maintain offset from player instead of overlapping
      if (mob.state.aiState === 'attack') {
        const dx = mob.sprite.x - this.playerSprite.x;
        const dy = mob.sprite.y - this.playerSprite.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const desiredDist = mob.state.attackRange * 0.7;
        if (dist < desiredDist && dist > 0) {
          // Push mob outward to maintain spacing
          const pushX = (dx / dist) * desiredDist;
          const pushY = (dy / dist) * desiredDist;
          mob.sprite.x = this.playerSprite.x + pushX;
          mob.sprite.y = this.playerSprite.y + pushY;
        }
      } else {
        mob.sprite.x += dir.dx * speed;
        mob.sprite.y += dir.dy * speed;
      }
      mob.state.position.x = mob.sprite.x;
      mob.state.position.y = mob.sprite.y;

      // Flip sprite based on horizontal direction
      if (dir.dx < -0.1) mob.sprite.setFlipX(true);
      else if (dir.dx > 0.1) mob.sprite.setFlipX(false);

      // Bob animation when moving (squash/stretch using scaleY)
      // Use mob id hash for phase offset instead of position (avoids jitter when moving)
      const phaseOffset = mob.state.id.charCodeAt(4) * 0.7;
      if (isMoving && mob.state.aiState !== 'attack') {
        const bobPhase = Math.sin(this.time.now * 0.01 + phaseOffset) * 0.08;
        mob.sprite.setScale(1 - bobPhase * 0.5, 1 + bobPhase);
      } else {
        const breathe = Math.sin(this.time.now * 0.003 + phaseOffset) * 0.03;
        mob.sprite.setScale(1, 1 + breathe);
      }

      // Update depth for entity sorting
      mob.sprite.setDepth(mob.sprite.y);

      // Draw HP bar above mob (only if damaged)
      this.updateMobHpBar(mob);

      // Mob auto-attack player
      if (mob.state.aiState === 'attack') {
        // Combat interrupts gathering
        if (this.gatherTarget) {
          this.gatherTarget = null;
          if (this.playerSprite.anims?.currentAnim?.key === 'player_gather') {
            this.playerSprite.play('player_idle', true);
          }
        }
        const now = this.time.now;
        if (this.combatSystem.canAttack(mob.state.stats.attackSpeed, mob.state.lastAttackTime, now)) {
          this.combatSystem.applyDamage(mob.state.id, 'player', mob.state.stats, this.player.stats);
          mob.state.lastAttackTime = now;
          this.sfx.playerHurt();
          // Flash mob red on hit
          mob.sprite.setTint(0xff4444);
          this.time.delayedCall(100, () => mob.sprite.clearTint());
          // Flash player red
          this.playerSprite.setTint(0xff4444);
          this.time.delayedCall(100, () => this.playerSprite.clearTint());
          if (this.player.stats.health <= 0) {
            this.endRun('Killed by ' + (def.name ?? 'a mob'));
          }
        }
      }

      // Player auto-attack nearest mob in range
      if (distToPlayer < 40) {
        const now = this.time.now;
        if (this.combatSystem.canAttack(this.player.stats.attackSpeed, this.lastPlayerAttack, now)) {
          const dmg = this.combatSystem.applyDamage('player', mob.state.id, this.player.stats, mob.state.stats);
          this.lastPlayerAttack = now;
          this.sfx.playerHit();

          // Flip sprite to face the mob and play attack animation
          const atkDx = mob.sprite.x - this.playerSprite.x;
          this.playerSprite.setFlipX(atkDx < 0);
          this.playerSprite.play('player_attack', true);
          this.playerSprite.once('animationcomplete', () => {
            const curAnim = this.playerSprite.anims?.currentAnim?.key;
            if (curAnim === 'player_attack') {
              this.playerSprite.play(this.moveTarget ? 'player_walk' : 'player_idle', true);
            }
          });

          // Show damage number
          this.showFloatingText(mob.sprite.x, mob.sprite.y - 20, `-${dmg}`, '#ff6666');
          mob.sprite.setTint(0xff4444);
          this.time.delayedCall(100, () => {
            if (mob.state.stats.health > 0) mob.sprite.clearTint();
          });
          if (mob.state.stats.health <= 0) {
            this.sfx.mobDeath();
            if (this.mobTarget?.state === mob.state) {
              this.mobTarget = null;
              this.moveTarget = null;
            }
            mob.sprite.setAlpha(0.3);
            mob.sprite.clearTint();
            // Remove HP bar
            const hpBar = this.mobHpBars.get(mob.state.id);
            if (hpBar) { hpBar.destroy(); this.mobHpBars.delete(mob.state.id); }
            this.eventBus.emit('mob-killed', { mobId: mob.state.id, mobTypeId: mob.state.typeId });
            for (const drop of def.drops) {
              if (Math.random() <= drop.chance) {
                this.itemSystem.addItem(this.player.inventory, drop.itemId, drop.count);
              }
            }
          }
        }
      }
    }

    // Update player depth
    this.playerSprite.setDepth(this.playerSprite.y);
  }

  private useDash(): void {
    if (!this.moveTarget) return;
    const dx = this.moveTarget.x - this.playerSprite.x;
    const dy = this.moveTarget.y - this.playerSprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;
    this.playerSprite.x += (dx / dist) * 80;
    this.playerSprite.y += (dy / dist) * 80;
  }

  /** Unified check: is the pointer over any UI element that should block world interaction? */
  private isInputBlockedByUI(): boolean {
    return this.pointerOverUI || this.uiManager.isOpen() || this.buildMenuOpen;
  }

  getNearbyStation(): CraftingStation {
    const px = this.playerSprite.x;
    const py = this.playerSprite.y;
    for (const s of this.placedStations) {
      const dx = s.x - px;
      const dy = s.y - py;
      if (Math.sqrt(dx * dx + dy * dy) < 80) return s.type;
    }
    return 'hand';
  }

  private toggleBuildMenu(): void {
    if (this.buildMenuOpen) {
      this.closeBuildMenu();
    } else {
      this.openBuildMenu();
    }
  }

  private openBuildMenu(): void {
    if (this.buildMenuOpen) return;
    this.buildMenuOpen = true;

    const scene = this;
    const container = this.add.container(0, 0);
    container.setScrollFactor(0);
    container.setDepth(25000);

    const menuW = 220;
    const menuH = 150;
    const menuX = 20;
    const menuY = this.cameras.main.height - 240;

    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 0.95);
    bg.fillRect(menuX, menuY, menuW, menuH);
    bg.lineStyle(1, 0x475569);
    bg.strokeRect(menuX, menuY, menuW, menuH);
    container.add(bg);

    const title = this.add.text(menuX + 10, menuY + 8, 'BUILD  [B to close]', {
      fontSize: '11px', color: '#e2e8f0', fontStyle: 'bold',
    });
    container.add(title);

    type BuildOption = { type: CraftingStation; label: string; cost: string; items: { item: string; count: number }[] };
    const options: BuildOption[] = [
      { type: 'campfire', label: 'Campfire', cost: '5 Wood + 3 Stone', items: [{ item: 'wood', count: 5 }, { item: 'stone', count: 3 }] },
      { type: 'workbench', label: 'Workbench', cost: '8 Wood + 5 Stone', items: [{ item: 'wood', count: 8 }, { item: 'stone', count: 5 }] },
      { type: 'forge', label: 'Forge', cost: '10 Stone + 5 Iron + 3 Coal', items: [{ item: 'stone', count: 10 }, { item: 'iron_ore', count: 5 }, { item: 'coal', count: 3 }] },
    ];

    options.forEach((opt, i) => {
      const rowY = menuY + 32 + i * 36;
      const canBuild = this.itemSystem.hasItems(this.player.inventory, opt.items);
      const color = canBuild ? '#e2e8f0' : '#94a3b8';

      const rowBg = this.add.graphics();
      rowBg.fillStyle(canBuild ? 0x1e3a5f : 0x1e293b, 0.7);
      rowBg.fillRect(menuX + 8, rowY, menuW - 16, 30);
      container.add(rowBg);

      const nameText = this.add.text(menuX + 14, rowY + 5, opt.label, {
        fontSize: '11px', color, fontStyle: 'bold',
      });
      container.add(nameText);

      const costText = this.add.text(menuX + 14, rowY + 18, opt.cost, {
        fontSize: '8px', color: canBuild ? '#86efac' : '#f87171',
      });
      container.add(costText);

      if (canBuild) {
        const hitZone = this.add.zone(menuX + menuW / 2, rowY + 15, menuW - 16, 30)
          .setScrollFactor(0).setInteractive({ useHandCursor: true });
        hitZone.setDepth(25001);
        hitZone.on('pointerdown', () => {
          // Deduct resources
          for (const ingredient of opt.items) {
            scene.itemSystem.removeItem(scene.player.inventory, ingredient.item, ingredient.count);
          }
          // Place immediately next to the player
          const placeX = scene.playerSprite.x + 30;
          const placeY = scene.playerSprite.y + 5;
          scene.placeStation(opt.type, placeX, placeY);
          scene.closeBuildMenu();
          scene.inputConsumed = true;
        });
        container.add(hitZone);
      }
    });

    this.buildMenuContainer = container;
  }

  private closeBuildMenu(): void {
    if (this.buildMenuContainer) {
      this.buildMenuContainer.destroy();
      this.buildMenuContainer = null;
    }
    this.buildMenuOpen = false;
    this.pointerOverUI = false;
    this.inputConsumed = true;
  }

  private placeStation(type: CraftingStation, worldX: number, worldY: number): void {
    const textureKey = `station_${type}`;
    const sprite = this.add.sprite(worldX, worldY, textureKey);
    sprite.setDepth(worldY + 1);
    this.placedStations.push({ type, x: worldX, y: worldY, sprite });
    this.showFloatingText(worldX, worldY - 20, `${type} placed!`, '#86efac');
    this.eventBus.emit('station-placed', { type, x: worldX, y: worldY });
  }

  private endRun(cause: string): void {
    this.musicSystem.stop();
    const survived = this.time.now - this.runStartTime;
    this.progression.recordRunEnd();
    this.progression.save();
    this.scene.start('GameOver', { survived, recipesFound: this.knownRecipes.size, cause });
  }
}
