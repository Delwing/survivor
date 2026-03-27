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
import { MobAI } from '@/systems/MobAI';
import { MOB_DEFINITIONS } from '@/config/mobs';
import { createMobState, createMobSprite } from '@/entities/Mob';
import { ResourceNodeState } from '@/entities/ResourceNode';
import { getItemDef } from '@/config/items';

const GATHER_RANGE = 40; // must be this close to gather

// A rendered chunk: one graphics object for tiles + individual sprites for resources
interface RenderedChunk {
  tileGraphics: Phaser.GameObjects.Graphics;
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

  private mobs: { state: MobState; sprite: Phaser.GameObjects.Sprite }[] = [];
  private resourceNodes: { state: ResourceNodeState; sprite: Phaser.GameObjects.Sprite }[] = [];
  private spawnedChunks = new Set<string>();
  private lastPlayerAttack = 0;
  private gatherTarget: { state: ResourceNodeState; sprite: Phaser.GameObjects.Sprite } | null = null;
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

    // Clear old HP bars
    this.mobHpBars = new Map();

    // Render initial chunks
    this.updateChunks();

    // Input — click to move or gather
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Ignore clicks on the UI area (bottom 80px of screen)
      if (pointer.y > this.cameras.main.height - 80) return;
      if (this.uiManager.isOpen()) return;

      // Check if clicking a resource — walk to it first, then gather
      for (const res of this.resourceNodes) {
        const d = distance(pointer.worldX, pointer.worldY, res.sprite.x, res.sprite.y);
        if (d < 30 && res.state.remaining > 0) {
          this.gatherTarget = res;
          this.moveTarget = { x: res.sprite.x, y: res.sprite.y };
          this.showMoveMarker(res.sprite.x, res.sprite.y, true);
          return;
        }
      }

      // Normal movement
      this.gatherTarget = null;
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

      // Check mob hover first (higher priority)
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
          this.tooltip.setText(`${name}  (${res.state.remaining} left)`);
          this.tooltip.setPosition(pointer.x + 12, pointer.y - 8);
          this.tooltip.setVisible(true);
          this.input.setDefaultCursor('pointer');
          return;
        }
      }
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
    this.hud.update(this.player, this.currentBiomeName);
    this.updateMobs(delta);
  }

  private updatePlayerMovement(delta: number): void {
    if (!this.moveTarget) {
      // No target — play idle if not already
      if (this.playerSprite.anims?.currentAnim?.key !== 'player_idle') {
        this.playerSprite.play('player_idle', true);
      }
      return;
    }

    const dx = this.moveTarget.x - this.playerSprite.x;
    const dy = this.moveTarget.y - this.playerSprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Check if we've arrived at a gather target
    if (this.gatherTarget && dist < GATHER_RANGE) {
      this.playerSprite.play('player_gather', true);
      this.doGather(this.gatherTarget);
      this.gatherTarget = null;
      this.moveTarget = null;
      this.moveMarker.setVisible(false);
      // Stay in gather anim briefly, then idle
      this.time.delayedCall(500, () => {
        if (!this.moveTarget) this.playerSprite.play('player_idle', true);
      });
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

    const speed = this.player.stats.speed * (delta / 1000);
    this.playerSprite.x += (dx / dist) * speed;
    this.playerSprite.y += (dy / dist) * speed;
    this.player.position.x = this.playerSprite.x;
    this.player.position.y = this.playerSprite.y;
  }

  private doGather(res: { state: ResourceNodeState; sprite: Phaser.GameObjects.Sprite }): void {
    if (res.state.remaining <= 0) return;
    res.state.remaining--;
    this.itemSystem.addItem(this.player.inventory, res.state.itemId, 1);

    // Floating text feedback
    this.showFloatingText(res.sprite.x, res.sprite.y - 16, `+1`);

    // Shake the resource slightly
    this.tweens.add({
      targets: res.sprite,
      x: res.sprite.x + 2,
      duration: 50,
      yoyo: true,
      repeat: 1,
    });

    if (res.state.remaining <= 0) {
      res.sprite.setAlpha(0.2);
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
    if (isGather) {
      // Yellow ring for gather
      this.moveMarker.lineStyle(1, 0xf0c040, 0.8);
      this.moveMarker.strokeCircle(x, y, 6);
    } else {
      // White dot for movement
      this.moveMarker.fillStyle(0xffffff, 0.5);
      this.moveMarker.fillCircle(x, y, 3);
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
        rendered.tileGraphics.destroy();
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
  private static readonly BIOME_GROUNDS: Record<string, { bases: number[]; edge: number; details: number[] }> = {
    forest: {
      bases: [0x3e8948, 0x448e4c, 0x3a8244, 0x4a9a52, 0x408a48, 0x368040],
      edge: 0x2c6e36,
      details: [0x56b050, 0x4a9a52, 0xf0c040, 0xe06060],
    },
    rocky_highlands: {
      bases: [0x787878, 0x828282, 0x6e6e6e, 0x8a8a8a, 0x747474, 0x808080],
      edge: 0x585858,
      details: [0x606060, 0x959595, 0x505050],
    },
    swamp: {
      bases: [0x3a5c3a, 0x3d5a30, 0x354e35, 0x425838, 0x384f2e, 0x3e5535],
      edge: 0x2a3f2a,
      details: [0x2a3a2a, 0x50a050, 0x4a5a2a],
    },
    volcanic_wastes: {
      bases: [0x4a2020, 0x522828, 0x442020, 0x3c1a1a, 0x4e2424, 0x401c1c],
      edge: 0x2e1414,
      details: [0xff4400, 0xff6600, 0x6b2a2a],
    },
    corrupted_lands: {
      bases: [0x2a0048, 0x300055, 0x250040, 0x350060, 0x2d004d, 0x320058],
      edge: 0x1a0030,
      details: [0x8b00ff, 0xcc44ff, 0x500080],
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
   * Draw all tiles in a chunk as a single Graphics object.
   * Each tile is a full filled diamond with edge shading and detail variety.
   */
  private renderChunk(cx: number, cy: number): void {
    const chunk = this.worldSystem.getChunk(cx, cy);
    const gfx = this.add.graphics();
    gfx.setDepth(-10000);

    const resourceSprites: Phaser.GameObjects.Sprite[] = [];
    const hw = TILE_WIDTH / 2;
    const hh = TILE_HEIGHT / 2;

    for (let row = 0; row < CHUNK_SIZE; row++) {
      for (let col = 0; col < CHUNK_SIZE; col++) {
        const tile = chunk.tiles[row][col];
        const absX = cx * CHUNK_SIZE + col;
        const absY = cy * CHUNK_SIZE + row;
        const worldX = absX * TILE_WIDTH / 2;
        const worldY = absY * TILE_HEIGHT;
        const { sx, sy } = worldToScreen(worldX, worldY);

        const ground = GameScene.BIOME_GROUNDS[tile.biomeId] ?? GameScene.BIOME_GROUNDS.forest;
        const h = GameScene.tileHash(absX, absY);
        const h2 = GameScene.tileHash(absX + 997, absY + 1013);
        const h3 = GameScene.tileHash(absX + 2003, absY + 2017);

        // Pick base color from palette using hash
        const baseColor = ground.bases[Math.floor(h * ground.bases.length)];

        // Full diamond fill — single solid color
        gfx.fillStyle(baseColor);
        gfx.beginPath();
        gfx.moveTo(sx, sy - hh);
        gfx.lineTo(sx + hw, sy);
        gfx.lineTo(sx, sy + hh);
        gfx.lineTo(sx - hw, sy);
        gfx.closePath();
        gfx.fillPath();

        // Thin bottom edge for subtle depth separation
        gfx.lineStyle(1, ground.edge, 0.35);
        gfx.lineBetween(sx + hw, sy, sx, sy + hh);
        gfx.lineBetween(sx, sy + hh, sx - hw, sy);

        // Per-biome detail decorations on ~35% of tiles
        if (h2 < 0.35) {
          this.drawTileDetails(gfx, sx, sy, hw, hh, tile.biomeId, ground.details, h, h2, h3);
        }

        // Resource node sprite
        if (tile.resourceNodeId) {
          const resKey = `res_${tile.resourceNodeId}`;
          const resUseKey = this.textures.exists(resKey) ? resKey : 'resource_node';
          const resSprite = this.add.sprite(sx, sy - 8, resUseKey);
          resSprite.setOrigin(0.5, 1);
          resSprite.setDepth(sy);
          resourceSprites.push(resSprite);

          this.resourceNodes.push({
            state: {
              id: `res-${cx}-${row}-${col}`,
              itemId: tile.resourceNodeId,
              position: { x: sx, y: sy - 8 },
              remaining: 3 + Math.floor(Math.random() * 5),
            },
            sprite: resSprite,
          });
        }
      }
    }

    this.renderedChunks.set(chunkKey(cx, cy), { tileGraphics: gfx, resourceSprites });
  }

  /** Draw small detail marks on tiles */
  private drawTileDetails(
    gfx: Phaser.GameObjects.Graphics,
    sx: number, sy: number,
    hw: number, hh: number,
    biome: string,
    detailColors: number[],
    h: number, h2: number, h3: number,
  ): void {
    // Position offsets within diamond (kept well inside to avoid edge bleed)
    const dx1 = (h - 0.5) * hw * 0.5;
    const dy1 = (h3 - 0.5) * hh * 0.4;

    switch (biome) {
      case 'forest': {
        // Grass tufts
        gfx.lineStyle(1, detailColors[0], 0.5);
        gfx.lineBetween(sx + dx1 - 1, sy + dy1, sx + dx1, sy + dy1 - 2);
        gfx.lineBetween(sx + dx1, sy + dy1 - 2, sx + dx1 + 1, sy + dy1);
        if (h2 < 0.12) {
          // Rare flower
          gfx.fillStyle(h3 < 0.5 ? detailColors[2] : detailColors[3], 0.7);
          gfx.fillRect(sx + dx1, sy + dy1 - 1, 1, 1);
        }
        break;
      }
      case 'rocky_highlands': {
        // Pebble
        gfx.fillStyle(detailColors[0], 0.4);
        gfx.fillRect(sx + dx1, sy + dy1, 2, 1);
        if (h2 < 0.15) {
          // Crack
          gfx.lineStyle(1, detailColors[2], 0.3);
          gfx.lineBetween(sx + dx1, sy + dy1, sx + dx1 + 3, sy + dy1 + 1);
        }
        break;
      }
      case 'swamp': {
        // Dark water patch
        gfx.fillStyle(detailColors[0], 0.35);
        gfx.fillRect(sx + dx1 - 1, sy + dy1, 3, 1);
        break;
      }
      case 'volcanic_wastes': {
        // Lava crack
        gfx.lineStyle(1, detailColors[0], 0.25);
        gfx.lineBetween(sx + dx1, sy + dy1, sx + dx1 + 3, sy + dy1 + 1);
        if (h2 < 0.1) {
          gfx.fillStyle(detailColors[1], 0.4);
          gfx.fillRect(sx + dx1 + 1, sy + dy1, 1, 1);
        }
        break;
      }
      case 'corrupted_lands': {
        // Vein
        gfx.lineStyle(1, detailColors[0], 0.2);
        gfx.lineBetween(sx + dx1, sy + dy1, sx + dx1 + 3, sy + dy1 + 1);
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
      mob.state = MobAI.update(mob.state, playerPos, def.category);

      // Movement
      const dir = MobAI.getMovementDirection(mob.state, playerPos);
      const speed = mob.state.stats.speed * (delta / 1000);
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
      if (isMoving && mob.state.aiState !== 'attack') {
        const bobPhase = Math.sin(this.time.now * 0.01 + mob.state.position.x) * 0.08;
        mob.sprite.setScale(1 - bobPhase * 0.5, 1 + bobPhase);
      } else {
        const breathe = Math.sin(this.time.now * 0.003 + mob.state.position.x) * 0.03;
        mob.sprite.setScale(1, 1 + breathe);
      }

      // Update depth for entity sorting
      mob.sprite.setDepth(mob.sprite.y);

      // Draw HP bar above mob (only if damaged)
      this.updateMobHpBar(mob);

      // Mob auto-attack player
      if (mob.state.aiState === 'attack') {
        const now = this.time.now;
        if (this.combatSystem.canAttack(mob.state.stats.attackSpeed, mob.state.lastAttackTime, now)) {
          this.combatSystem.applyDamage(mob.state.id, 'player', mob.state.stats, this.player.stats);
          mob.state.lastAttackTime = now;
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
          // Show damage number
          this.showFloatingText(mob.sprite.x, mob.sprite.y - 20, `-${dmg}`, '#ff6666');
          mob.sprite.setTint(0xff4444);
          this.time.delayedCall(100, () => {
            if (mob.state.stats.health > 0) mob.sprite.clearTint();
          });
          if (mob.state.stats.health <= 0) {
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

  private endRun(cause: string): void {
    const survived = this.time.now - this.runStartTime;
    this.progression.recordRunEnd();
    this.progression.save();
    this.scene.start('GameOver', { survived, recipesFound: this.knownRecipes.size, cause });
  }
}
