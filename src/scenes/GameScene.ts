import Phaser from 'phaser';
import { EventBus } from '@/systems/EventBus';
import { WorldSystem } from '@/systems/WorldSystem';
import { CombatSystem } from '@/systems/CombatSystem';
import { ItemSystem } from '@/systems/ItemSystem';
import { CraftingSystem } from '@/systems/CraftingSystem';
import { NPCSystem } from '@/systems/NPCSystem';
import { ProgressionSystem } from '@/systems/ProgressionSystem';
import { createPlayerState, createPlayerSprite } from '@/entities/Player';
import { depthSort } from '@/systems/DepthSortSystem';
import { TILE_WIDTH, TILE_HEIGHT, CHUNK_SIZE, RENDER_RADIUS } from '@/config/game-config';
import { BIOME_DEFINITIONS } from '@/config/biomes';
import { worldToScreen } from '@/utils/iso';
import { chunkKey } from '@/utils/math';
import { PlayerState } from '@/types/entities';
import { HUD } from '@/ui/HUD';
import { AbilityBar, AbilitySlot } from '@/ui/AbilityBar';
import { UIManager } from '@/ui/UIManager';

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

  private tileSprites = new Map<string, Phaser.GameObjects.Sprite[]>();
  private currentChunkX = 0;
  private currentChunkY = 0;

  private runStartTime = 0;
  private knownRecipes = new Set<string>();
  private currentBiomeName = 'Forest';

  constructor() { super({ key: 'Game' }); }

  create(data: { seed: string }): void {
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

    // Load starting recipes
    this.knownRecipes = new Set(this.progression.getStartingRecipeIds());

    // Reset chunk tracking
    this.tileSprites = new Map();
    this.currentChunkX = 0;
    this.currentChunkY = 0;
    this.moveTarget = null;

    // Render initial chunks
    this.updateChunks();

    // Input — click to move
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.moveTarget = { x: pointer.worldX, y: pointer.worldY };
    });

    // ESC — debug die
    this.input.keyboard!.on('keydown-ESC', () => {
      this.endRun('Debug exit');
    });

    // Listen for biome changes
    this.eventBus.on('chunk-entered', (eventData) => {
      const biome = BIOME_DEFINITIONS.find(b => b.id === eventData.biomeId);
      this.currentBiomeName = biome?.name ?? 'Unknown';
    });

    this.runStartTime = this.time.now;
    this.eventBus.emit('run-started', { seed: data.seed });
  }

  update(_time: number, delta: number): void {
    this.updatePlayerMovement(delta);
    this.updateChunkTracking();
    depthSort(this);
    this.hud.update(this.player, this.currentBiomeName);
  }

  private updatePlayerMovement(delta: number): void {
    if (!this.moveTarget) return;
    const dx = this.moveTarget.x - this.playerSprite.x;
    const dy = this.moveTarget.y - this.playerSprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 3) { this.moveTarget = null; return; }
    const speed = this.player.stats.speed * (delta / 1000);
    this.playerSprite.x += (dx / dist) * speed;
    this.playerSprite.y += (dy / dist) * speed;
    this.player.position.x = this.playerSprite.x;
    this.player.position.y = this.playerSprite.y;
  }

  private updateChunkTracking(): void {
    const approxChunkX = Math.floor(this.playerSprite.x / (CHUNK_SIZE * TILE_WIDTH / 2));
    const approxChunkY = Math.floor(this.playerSprite.y / (CHUNK_SIZE * TILE_HEIGHT));
    if (approxChunkX !== this.currentChunkX || approxChunkY !== this.currentChunkY) {
      this.currentChunkX = approxChunkX;
      this.currentChunkY = approxChunkY;
      this.updateChunks();
      const chunk = this.worldSystem.getChunk(this.currentChunkX, this.currentChunkY);
      const centerTile = chunk.tiles[Math.floor(CHUNK_SIZE / 2)][Math.floor(CHUNK_SIZE / 2)];
      this.eventBus.emit('chunk-entered', { chunkX: this.currentChunkX, chunkY: this.currentChunkY, biomeId: centerTile.biomeId });
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
    for (const [key, sprites] of this.tileSprites) {
      if (!neededKeys.has(key)) {
        sprites.forEach(s => s.destroy());
        this.tileSprites.delete(key);
      }
    }
    // Add new chunks
    for (const key of neededKeys) {
      if (!this.tileSprites.has(key)) {
        const [cx, cy] = key.split(',').map(Number);
        this.renderChunk(cx, cy);
      }
    }
  }

  private renderChunk(cx: number, cy: number): void {
    const chunk = this.worldSystem.getChunk(cx, cy);
    const sprites: Phaser.GameObjects.Sprite[] = [];
    for (let row = 0; row < CHUNK_SIZE; row++) {
      for (let col = 0; col < CHUNK_SIZE; col++) {
        const tile = chunk.tiles[row][col];
        const worldX = (cx * CHUNK_SIZE + col) * TILE_WIDTH / 2;
        const worldY = (cy * CHUNK_SIZE + row) * TILE_HEIGHT;
        const { sx, sy } = worldToScreen(worldX, worldY);
        const biome = BIOME_DEFINITIONS.find(b => b.id === tile.biomeId);
        const tileSprite = this.add.sprite(sx, sy, 'tile');
        tileSprite.setTint(biome?.color ?? 0x228b22);
        tileSprite.setDepth(-10000 + sy);
        sprites.push(tileSprite);
        if (tile.resourceNodeId) {
          const resSprite = this.add.sprite(sx, sy - 4, 'resource_node');
          resSprite.setDepth(sy);
          sprites.push(resSprite);
        }
      }
    }
    this.tileSprites.set(chunkKey(cx, cy), sprites);
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

  private endRun(cause: string): void {
    const survived = this.time.now - this.runStartTime;
    this.progression.recordRunEnd();
    this.progression.save();
    this.scene.start('GameOver', { survived, recipesFound: this.knownRecipes.size, cause });
  }
}
