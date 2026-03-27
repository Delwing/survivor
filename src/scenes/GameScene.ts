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
import { worldToScreen } from '@/utils/iso';
import { chunkKey, distance } from '@/utils/math';
import { PlayerState, MobState } from '@/types/entities';
import { HUD } from '@/ui/HUD';
import { AbilityBar, AbilitySlot } from '@/ui/AbilityBar';
import { UIManager } from '@/ui/UIManager';
import { MobAI } from '@/systems/MobAI';
import { MOB_DEFINITIONS } from '@/config/mobs';
import { createMobState, createMobSprite } from '@/entities/Mob';
import { ResourceNodeState } from '@/entities/ResourceNode';

const GATHER_RANGE = 40; // must be this close to gather

// A rendered chunk: tile sprites + resource node sprites
interface RenderedChunk {
  sprites: Phaser.GameObjects.Sprite[];
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

    // Hover detection for resources
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      // Reset previous hover
      if (this.hoveredResource) {
        this.hoveredResource.clearTint();
        this.hoveredResource = null;
      }
      this.input.setDefaultCursor('default');

      // Check resource hover
      for (const res of this.resourceNodes) {
        if (res.state.remaining <= 0) continue;
        const d = distance(pointer.worldX, pointer.worldY, res.sprite.x, res.sprite.y);
        if (d < 30) {
          res.sprite.setTint(0xffffff);
          this.hoveredResource = res.sprite;
          this.input.setDefaultCursor('pointer');
          break;
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

  private showFloatingText(x: number, y: number, text: string): void {
    const floatText = this.add.text(x, y, text, {
      fontSize: '10px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5).setDepth(9999);

    this.tweens.add({
      targets: floatText,
      y: y - 20,
      alpha: 0,
      duration: 800,
      onComplete: () => floatText.destroy(),
    });
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
    const approxChunkX = Math.floor(this.playerSprite.x / (CHUNK_SIZE * TILE_WIDTH / 2));
    const approxChunkY = Math.floor(this.playerSprite.y / (CHUNK_SIZE * TILE_HEIGHT));
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
        rendered.sprites.forEach(s => s.destroy());
        this.renderedChunks.delete(key);
      }
    }

    // Remove resource nodes from unloaded chunks
    this.resourceNodes = this.resourceNodes.filter(r => {
      if (r.sprite.active) return true;
      return false;
    });

    // Add new chunks
    for (const key of neededKeys) {
      if (!this.renderedChunks.has(key)) {
        const [cx, cy] = key.split(',').map(Number);
        this.renderChunk(cx, cy);
        this.spawnEntitiesForChunk(cx, cy);
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

        // Tile sprite
        const tileKey = `tile_${tile.biomeId}`;
        const useKey = this.textures.exists(tileKey) ? tileKey : 'tile';
        const tileSprite = this.add.sprite(sx, sy, useKey);
        tileSprite.setDepth(-10000 + sy);
        sprites.push(tileSprite);

        // Resource node
        if (tile.resourceNodeId) {
          const resKey = `res_${tile.resourceNodeId}`;
          const resUseKey = this.textures.exists(resKey) ? resKey : 'resource_node';
          const resSprite = this.add.sprite(sx, sy - 8, resUseKey);
          resSprite.setOrigin(0.5, 1);
          resSprite.setDepth(sy);
          sprites.push(resSprite);

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

    this.renderedChunks.set(chunkKey(cx, cy), { sprites });
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
      mob.sprite.x += dir.dx * speed;
      mob.sprite.y += dir.dy * speed;
      mob.state.position.x = mob.sprite.x;
      mob.state.position.y = mob.sprite.y;

      // Flip sprite based on horizontal direction
      if (dir.dx < -0.1) mob.sprite.setFlipX(true);
      else if (dir.dx > 0.1) mob.sprite.setFlipX(false);

      // Bob animation when moving (squash/stretch using scaleY)
      if (isMoving) {
        const bobPhase = Math.sin(this.time.now * 0.01 + mob.state.position.x) * 0.08;
        mob.sprite.setScale(1 - bobPhase * 0.5, 1 + bobPhase);
      } else {
        // Gentle idle breathing
        const breathe = Math.sin(this.time.now * 0.003 + mob.state.position.x) * 0.03;
        mob.sprite.setScale(1, 1 + breathe);
      }

      // Update depth for entity sorting
      mob.sprite.setDepth(mob.sprite.y);

      // Mob auto-attack player
      if (mob.state.aiState === 'attack') {
        const now = this.time.now;
        if (this.combatSystem.canAttack(mob.state.stats.attackSpeed, mob.state.lastAttackTime, now)) {
          this.combatSystem.applyDamage(mob.state.id, 'player', mob.state.stats, this.player.stats);
          mob.state.lastAttackTime = now;
          if (this.player.stats.health <= 0) {
            this.endRun('Killed by ' + (def.name ?? 'a mob'));
          }
        }
      }

      // Player auto-attack nearest mob in range
      if (distToPlayer < 40) {
        const now = this.time.now;
        if (this.combatSystem.canAttack(this.player.stats.attackSpeed, this.lastPlayerAttack, now)) {
          this.combatSystem.applyDamage('player', mob.state.id, this.player.stats, mob.state.stats);
          this.lastPlayerAttack = now;
          if (mob.state.stats.health <= 0) {
            mob.sprite.setAlpha(0.3);
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
