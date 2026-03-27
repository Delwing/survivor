# Survivor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a playable isometric roguelike survival-crafter in the browser with Phaser 3, TypeScript, and Vite.

**Architecture:** Six loosely-coupled systems (World, Entity, Item, UI, Progression, NPC) communicating via an event bus. Data-driven design — all game content in typed config files. Chunk-based procedural world generation with simplex noise. ECS-lite pattern with typed objects and system functions.

**Tech Stack:** Phaser 3.90, TypeScript, Vite, simplex-noise v4, alea (seeded RNG), Vitest for testing.

**Spec:** `docs/superpowers/specs/2026-03-27-survivor-game-design.md`

---

## File Structure

```
src/
├── main.ts                          # Phaser game config & launch
├── config/
│   ├── game-config.ts               # Phaser config, world scale, tuning knobs
│   ├── items.ts                     # All item definitions
│   ├── recipes.ts                   # All recipe definitions
│   ├── biomes.ts                    # Biome definitions (noise thresholds, resources, mobs)
│   └── mobs.ts                      # Mob type definitions (stats, AI, drops)
├── types/
│   ├── entities.ts                  # EntityStats, Player, Mob, NPC interfaces
│   ├── items.ts                     # Item, ItemModifier, Recipe interfaces
│   ├── world.ts                     # Chunk, Tile, Biome interfaces
│   └── events.ts                    # Event bus event types
├── scenes/
│   ├── BootScene.ts                 # Asset loading
│   ├── MainMenuScene.ts             # Title screen, start run
│   ├── GameScene.ts                 # Main gameplay scene (orchestrator)
│   ├── GameOverScene.ts             # Death screen, run summary
│   └── MetaHubScene.ts             # Between-run progression review
├── systems/
│   ├── EventBus.ts                  # Typed event emitter
│   ├── WorldSystem.ts               # Chunk generation, loading, biome assignment
│   ├── NoiseGenerator.ts            # Simplex noise wrapper, seeded
│   ├── EntitySystem.ts              # Entity management, movement, collision
│   ├── CombatSystem.ts              # Damage calc, auto-attack, abilities
│   ├── MobAI.ts                     # AI state machine for mobs
│   ├── ItemSystem.ts                # Inventory management, item pickup
│   ├── CraftingSystem.ts            # Recipe checking, crafting execution
│   ├── NPCSystem.ts                 # NPC hiring, passive resource generation
│   ├── ProgressionSystem.ts         # Meta-progression, persistence
│   └── DepthSortSystem.ts           # Isometric depth sorting for sprites
├── entities/
│   ├── Player.ts                    # Player entity creation & update
│   ├── Mob.ts                       # Mob entity creation & update
│   └── ResourceNode.ts             # Harvestable resource node
├── ui/
│   ├── HUD.ts                       # Health, hunger bars, biome indicator
│   ├── AbilityBar.ts                # 3 ability buttons
│   ├── QuickInventory.ts            # Bottom inventory bar
│   ├── InventoryPanel.ts            # Full inventory overlay
│   ├── CraftingPanel.ts             # Recipe list + experimentation
│   ├── MapPanel.ts                  # Fog-of-war minimap
│   ├── NPCPanel.ts                  # NPC manager overlay
│   └── UIManager.ts                 # Panel open/close management
├── utils/
│   ├── iso.ts                       # Isometric math helpers (world↔screen coords)
│   └── math.ts                      # Random variance, clamping, distance
tests/
├── systems/
│   ├── EventBus.test.ts
│   ├── NoiseGenerator.test.ts
│   ├── WorldSystem.test.ts
│   ├── CombatSystem.test.ts
│   ├── MobAI.test.ts
│   ├── ItemSystem.test.ts
│   ├── CraftingSystem.test.ts
│   ├── NPCSystem.test.ts
│   └── ProgressionSystem.test.ts
├── utils/
│   ├── iso.test.ts
│   └── math.test.ts
└── config/
    └── data-validation.test.ts
```

---

## Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`
- Create: `src/main.ts`, `src/config/game-config.ts`
- Create: `vitest.config.ts`

- [ ] **Step 1: Initialize the project**

```bash
cd E:/Code/survivor
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install phaser@3
npm install -D typescript vite vitest @types/node
npm install simplex-noise alea
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "outDir": "dist",
    "rootDir": ".",
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Create vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
});
```

- [ ] **Step 5: Create vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
```

- [ ] **Step 6: Create index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
  <title>Survivor</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0a0a0a; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <div id="game-container"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 7: Create src/config/game-config.ts**

```typescript
export const TILE_WIDTH = 48;
export const TILE_HEIGHT = 24;
export const CHUNK_SIZE = 16;
export const ACTIVE_RADIUS = 3;
export const RENDER_RADIUS = 5;

// Controls how close biomes are. Higher = biomes closer together.
// Crank up during development for faster testing.
export const WORLD_SCALE = 0.02;

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;
```

- [ ] **Step 8: Create src/main.ts**

```typescript
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/game-config';
import { BootScene } from '@/scenes/BootScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene],
};

new Phaser.Game(config);
```

- [ ] **Step 9: Create a minimal BootScene**

Create `src/scenes/BootScene.ts`:

```typescript
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  create(): void {
    const text = this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'Survivor - Loading...',
      { fontSize: '24px', color: '#ffffff' }
    );
    text.setOrigin(0.5);
  }
}
```

- [ ] **Step 10: Add npm scripts to package.json**

Add to `package.json` scripts:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run"
  }
}
```

- [ ] **Step 11: Verify the dev server starts**

```bash
npm run dev
```

Expected: Vite dev server starts. Opening `http://localhost:5173` shows a dark screen with "Survivor - Loading..." text.

- [ ] **Step 12: Verify tests run**

```bash
npm run test:run
```

Expected: Vitest runs with 0 tests found (no test files yet). No errors.

- [ ] **Step 13: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts vitest.config.ts index.html src/
git commit -m "feat: scaffold project with Phaser 3, TypeScript, Vite"
```

---

## Task 2: Type Definitions & Event Bus

**Files:**
- Create: `src/types/entities.ts`, `src/types/items.ts`, `src/types/world.ts`, `src/types/events.ts`
- Create: `src/systems/EventBus.ts`
- Create: `tests/systems/EventBus.test.ts`

- [ ] **Step 1: Create entity type definitions**

Create `src/types/entities.ts`:

```typescript
export interface EntityStats {
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;        // pixels per second
  attackSpeed: number;  // attacks per second
}

export interface PlayerState {
  id: 'player';
  stats: EntityStats & { hunger: number; maxHunger: number };
  position: { x: number; y: number };
  equipment: {
    weapon: string | null;
    armor: string | null;
    ability1: string | null; // power strike or similar
    ability2: string | null; // consumable slot
  };
  inventory: InventorySlot[];
  autoAttackTarget: string | null;
  abilityCooldowns: Record<string, number>;
}

export interface InventorySlot {
  itemId: string;
  count: number;
}

export interface MobState {
  id: string;
  typeId: string;
  stats: EntityStats;
  position: { x: number; y: number };
  aiState: 'idle' | 'patrol' | 'alert' | 'chase' | 'attack' | 'flee' | 'returning';
  homePosition: { x: number; y: number };
  target: string | null;
  leashDistance: number;
  alertRange: number;
  attackRange: number;
  lastAttackTime: number;
}

export type MobCategory = 'passive' | 'aggressive' | 'elite' | 'boss';

export interface MobDefinition {
  id: string;
  name: string;
  category: MobCategory;
  stats: EntityStats;
  alertRange: number;
  attackRange: number;
  leashDistance: number;
  drops: { itemId: string; count: number; chance: number }[];
  biomes: string[];
  spawnWeight: number;
  color: number; // placeholder tint color for v1
}

export interface NPCState {
  id: string;
  typeId: string;
  assignedResource: string | null;
  storedAmount: number;
  lastGatherTime: number;
}

export interface NPCDefinition {
  id: string;
  name: string;
  hireCost: { item: string; count: number }[];
  gatherType: string;
  gatherRate: number;     // items per minute
  maxStorage: number;
  metaRequired: string | null;
  stats: EntityStats | null;
}
```

- [ ] **Step 2: Create item type definitions**

Create `src/types/items.ts`:

```typescript
export type ItemType = 'resource' | 'tool' | 'weapon' | 'armor' | 'consumable' | 'ability' | 'misc';
export type ItemQuality = 'normal' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type CraftingStation = 'hand' | 'campfire' | 'workbench' | 'forge' | 'alchemy_table' | 'magma_forge' | 'void_altar';
export type DiscoveryMethod = 'known' | 'material' | 'scroll' | 'experiment' | 'meta';

export interface ItemModifier {
  type: string;
  value: number;
}

export interface ItemDefinition {
  id: string;
  name: string;
  type: ItemType;
  tier: 1 | 2 | 3 | 4 | 5;
  stackable: boolean;
  maxStack: number;
  quality: ItemQuality;
  modifiers: ItemModifier[];
  stats?: Partial<{
    health: number;
    maxHealth: number;
    attack: number;
    defense: number;
    speed: number;
    attackSpeed: number;
  }>;
  color: number; // placeholder display color for v1
}

export interface RecipeDefinition {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4 | 5;
  station: CraftingStation;
  ingredients: { item: string; count: number }[];
  output: { item: string; count: number };
  discovery: DiscoveryMethod;
  metaRequired: string | null;
  materialTrigger?: string; // if discovery is "material", which item ID triggers unlock
}
```

- [ ] **Step 3: Create world type definitions**

Create `src/types/world.ts`:

```typescript
export interface BiomeDefinition {
  id: string;
  name: string;
  color: number;          // placeholder tile tint color
  elevationRange: [number, number];   // [min, max] normalized 0-1
  moistureRange: [number, number];
  heatRange?: [number, number];
  requiresCorruption?: boolean;
  metaRequired?: string | null;
  resources: { itemId: string; density: number }[];
  mobs: string[];         // mob definition IDs
  mobDensity: number;     // mobs per chunk
}

export interface Tile {
  biomeId: string;
  elevation: number;
  resourceNodeId: string | null;
  walkable: boolean;
}

export interface Chunk {
  x: number;              // chunk coordinate (not pixel)
  y: number;
  tiles: Tile[][];        // [row][col], CHUNK_SIZE × CHUNK_SIZE
  entities: string[];     // entity IDs in this chunk
  generated: boolean;
}

export interface WorldState {
  seed: string;
  chunks: Map<string, Chunk>;
  spawnChunk: { x: number; y: number };
}
```

- [ ] **Step 4: Create event type definitions**

Create `src/types/events.ts`:

```typescript
export interface GameEvents {
  'player-moved': { x: number; y: number };
  'player-died': { cause: string };
  'mob-killed': { mobId: string; mobTypeId: string };
  'item-picked-up': { itemId: string; count: number };
  'item-crafted': { recipeId: string };
  'recipe-discovered': { recipeId: string; method: string };
  'chunk-entered': { chunkX: number; chunkY: number; biomeId: string };
  'npc-hired': { npcTypeId: string };
  'npc-collected': { npcId: string; itemId: string; count: number };
  'ability-used': { abilityId: string };
  'damage-dealt': { attackerId: string; defenderId: string; damage: number };
  'run-started': { seed: string };
  'run-ended': { survived: number; recipesFound: number };
}
```

- [ ] **Step 5: Write EventBus test**

Create `tests/systems/EventBus.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '@/systems/EventBus';

describe('EventBus', () => {
  it('calls listener when event is emitted', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('player-died', handler);
    bus.emit('player-died', { cause: 'slime' });
    expect(handler).toHaveBeenCalledWith({ cause: 'slime' });
  });

  it('supports multiple listeners for same event', () => {
    const bus = new EventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    bus.on('mob-killed', handler1);
    bus.on('mob-killed', handler2);
    bus.emit('mob-killed', { mobId: 'm1', mobTypeId: 'slime' });
    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it('removes listener with off()', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('player-died', handler);
    bus.off('player-died', handler);
    bus.emit('player-died', { cause: 'slime' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('once() fires handler only once', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.once('item-picked-up', handler);
    bus.emit('item-picked-up', { itemId: 'wood', count: 1 });
    bus.emit('item-picked-up', { itemId: 'stone', count: 1 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not throw when emitting event with no listeners', () => {
    const bus = new EventBus();
    expect(() => bus.emit('player-died', { cause: 'lava' })).not.toThrow();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

```bash
npm run test:run
```

Expected: FAIL — cannot resolve `@/systems/EventBus`.

- [ ] **Step 7: Implement EventBus**

Create `src/systems/EventBus.ts`:

```typescript
import { GameEvents } from '@/types/events';

type EventHandler<T> = (data: T) => void;

export class EventBus {
  private listeners = new Map<string, Set<EventHandler<any>>>();

  on<K extends keyof GameEvents>(event: K, handler: EventHandler<GameEvents[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off<K extends keyof GameEvents>(event: K, handler: EventHandler<GameEvents[K]>): void {
    this.listeners.get(event)?.delete(handler);
  }

  once<K extends keyof GameEvents>(event: K, handler: EventHandler<GameEvents[K]>): void {
    const wrapper: EventHandler<GameEvents[K]> = (data) => {
      this.off(event, wrapper);
      handler(data);
    };
    this.on(event, wrapper);
  }

  emit<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void {
    this.listeners.get(event)?.forEach((handler) => handler(data));
  }
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npm run test:run
```

Expected: All 5 EventBus tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/types/ src/systems/EventBus.ts tests/systems/EventBus.test.ts
git commit -m "feat: add type definitions and typed EventBus"
```

---

## Task 3: Utility Functions & Isometric Math

**Files:**
- Create: `src/utils/math.ts`, `src/utils/iso.ts`
- Create: `tests/utils/math.test.ts`, `tests/utils/iso.test.ts`

- [ ] **Step 1: Write math utility tests**

Create `tests/utils/math.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { clamp, distance, damageVariance, chunkKey } from '@/utils/math';

describe('clamp', () => {
  it('clamps value below min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });
  it('clamps value above max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
  it('returns value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
});

describe('distance', () => {
  it('calculates distance between two points', () => {
    expect(distance(0, 0, 3, 4)).toBe(5);
  });
  it('returns 0 for same point', () => {
    expect(distance(5, 5, 5, 5)).toBe(0);
  });
});

describe('damageVariance', () => {
  it('returns value between 0.8 and 1.2 times base', () => {
    for (let i = 0; i < 100; i++) {
      const result = damageVariance(10);
      expect(result).toBeGreaterThanOrEqual(8);
      expect(result).toBeLessThanOrEqual(12);
    }
  });
  it('returns at least 1 even with 0 base', () => {
    expect(damageVariance(0)).toBeGreaterThanOrEqual(1);
  });
});

describe('chunkKey', () => {
  it('creates unique string key from chunk coordinates', () => {
    expect(chunkKey(3, -7)).toBe('3,-7');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run
```

Expected: FAIL — cannot resolve `@/utils/math`.

- [ ] **Step 3: Implement math utilities**

Create `src/utils/math.ts`:

```typescript
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function damageVariance(baseDamage: number): number {
  const variance = 0.8 + Math.random() * 0.4; // 0.8 to 1.2
  return Math.max(1, Math.round(baseDamage * variance));
}

export function chunkKey(x: number, y: number): string {
  return `${x},${y}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run
```

Expected: All math tests PASS.

- [ ] **Step 5: Write isometric math tests**

Create `tests/utils/iso.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { worldToScreen, screenToWorld, tileToWorld, worldToTile } from '@/utils/iso';

describe('worldToScreen', () => {
  it('converts world origin to screen origin', () => {
    const { sx, sy } = worldToScreen(0, 0);
    expect(sx).toBe(0);
    expect(sy).toBe(0);
  });
  it('converts positive world coords to isometric screen coords', () => {
    // Isometric projection: sx = (wx - wy), sy = (wx + wy) / 2
    const { sx, sy } = worldToScreen(1, 0);
    expect(sx).toBe(1);
    expect(sy).toBe(0.5);
  });
});

describe('screenToWorld', () => {
  it('is inverse of worldToScreen', () => {
    const wx = 5, wy = 3;
    const { sx, sy } = worldToScreen(wx, wy);
    const { wx: rwx, wy: rwy } = screenToWorld(sx, sy);
    expect(rwx).toBeCloseTo(wx, 5);
    expect(rwy).toBeCloseTo(wy, 5);
  });
});

describe('tileToWorld / worldToTile', () => {
  it('converts tile 0,0 to world origin', () => {
    const { wx, wy } = tileToWorld(0, 0);
    expect(wx).toBe(0);
    expect(wy).toBe(0);
  });
  it('worldToTile is inverse of tileToWorld', () => {
    const tx = 3, ty = 7;
    const { wx, wy } = tileToWorld(tx, ty);
    const { tx: rtx, ty: rty } = worldToTile(wx, wy);
    expect(rtx).toBe(tx);
    expect(rty).toBe(ty);
  });
});
```

- [ ] **Step 6: Run tests to verify they fail**

```bash
npm run test:run
```

Expected: FAIL — cannot resolve `@/utils/iso`.

- [ ] **Step 7: Implement isometric math**

Create `src/utils/iso.ts`:

```typescript
import { TILE_WIDTH, TILE_HEIGHT } from '@/config/game-config';

/**
 * Convert world coordinates to isometric screen coordinates.
 * Isometric projection: sx = (wx - wy), sy = (wx + wy) / 2
 */
export function worldToScreen(wx: number, wy: number): { sx: number; sy: number } {
  return {
    sx: wx - wy,
    sy: (wx + wy) / 2,
  };
}

/**
 * Convert isometric screen coordinates back to world coordinates.
 * Inverse of worldToScreen.
 */
export function screenToWorld(sx: number, sy: number): { wx: number; wy: number } {
  return {
    wx: (sx + 2 * sy) / 2,
    wy: (2 * sy - sx) / 2,
  };
}

/**
 * Convert tile coordinates to world pixel coordinates (center of tile).
 */
export function tileToWorld(tx: number, ty: number): { wx: number; wy: number } {
  return {
    wx: tx * TILE_WIDTH / 2,
    wy: ty * TILE_HEIGHT,
  };
}

/**
 * Convert world pixel coordinates to tile coordinates.
 */
export function worldToTile(wx: number, wy: number): { tx: number; ty: number } {
  return {
    tx: Math.round(wx / (TILE_WIDTH / 2)),
    ty: Math.round(wy / TILE_HEIGHT),
  };
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npm run test:run
```

Expected: All iso and math tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/utils/ tests/utils/
git commit -m "feat: add math utilities and isometric coordinate helpers"
```

---

## Task 4: Noise Generator & World System Core

**Files:**
- Create: `src/systems/NoiseGenerator.ts`, `src/systems/WorldSystem.ts`
- Create: `tests/systems/NoiseGenerator.test.ts`, `tests/systems/WorldSystem.test.ts`

- [ ] **Step 1: Write NoiseGenerator tests**

Create `tests/systems/NoiseGenerator.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { NoiseGenerator } from '@/systems/NoiseGenerator';

describe('NoiseGenerator', () => {
  it('produces deterministic output for same seed', () => {
    const gen1 = new NoiseGenerator('test-seed');
    const gen2 = new NoiseGenerator('test-seed');
    expect(gen1.get(10, 20)).toBe(gen2.get(10, 20));
  });

  it('produces different output for different seeds', () => {
    const gen1 = new NoiseGenerator('seed-a');
    const gen2 = new NoiseGenerator('seed-b');
    // Extremely unlikely to be equal at arbitrary point
    expect(gen1.get(10, 20)).not.toBe(gen2.get(10, 20));
  });

  it('returns values in [-1, 1] range', () => {
    const gen = new NoiseGenerator('range-test');
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        const val = gen.get(x, y);
        expect(val).toBeGreaterThanOrEqual(-1);
        expect(val).toBeLessThanOrEqual(1);
      }
    }
  });

  it('getNormalized returns values in [0, 1] range', () => {
    const gen = new NoiseGenerator('norm-test');
    for (let x = 0; x < 50; x++) {
      for (let y = 0; y < 50; y++) {
        const val = gen.getNormalized(x, y);
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThanOrEqual(1);
      }
    }
  });

  it('respects scale parameter', () => {
    const gen = new NoiseGenerator('scale-test');
    const v1 = gen.get(10, 10);
    const v2 = gen.getScaled(10, 10, 0.5);
    // Different scale should produce different value at same coords
    // (because effective coords differ)
    expect(v1).not.toBe(v2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- tests/systems/NoiseGenerator.test.ts
```

Expected: FAIL — cannot resolve `@/systems/NoiseGenerator`.

- [ ] **Step 3: Implement NoiseGenerator**

Create `src/systems/NoiseGenerator.ts`:

```typescript
import { createNoise2D } from 'simplex-noise';
import alea from 'alea';

export class NoiseGenerator {
  private noise2D: (x: number, y: number) => number;

  constructor(seed: string) {
    const prng = alea(seed);
    this.noise2D = createNoise2D(prng);
  }

  /** Returns raw noise value in [-1, 1]. */
  get(x: number, y: number): number {
    return this.noise2D(x, y);
  }

  /** Returns noise value normalized to [0, 1]. */
  getNormalized(x: number, y: number): number {
    return (this.noise2D(x, y) + 1) / 2;
  }

  /** Returns raw noise value at scaled coordinates. */
  getScaled(x: number, y: number, scale: number): number {
    return this.noise2D(x * scale, y * scale);
  }

  /** Returns normalized noise value at scaled coordinates. */
  getScaledNormalized(x: number, y: number, scale: number): number {
    return (this.noise2D(x * scale, y * scale) + 1) / 2;
  }
}
```

- [ ] **Step 4: Run NoiseGenerator tests to verify they pass**

```bash
npm run test:run -- tests/systems/NoiseGenerator.test.ts
```

Expected: All 5 NoiseGenerator tests PASS.

- [ ] **Step 5: Create biome config data**

Create `src/config/biomes.ts`:

```typescript
import { BiomeDefinition } from '@/types/world';

export const BIOME_DEFINITIONS: BiomeDefinition[] = [
  {
    id: 'forest',
    name: 'Forest',
    color: 0x228b22,
    elevationRange: [0.3, 0.6],
    moistureRange: [0.3, 0.7],
    resources: [
      { itemId: 'wood', density: 0.3 },
      { itemId: 'stone', density: 0.1 },
      { itemId: 'berries', density: 0.15 },
      { itemId: 'herbs', density: 0.1 },
    ],
    mobs: ['slime', 'rabbit', 'deer'],
    mobDensity: 2,
  },
  {
    id: 'rocky_highlands',
    name: 'Rocky Highlands',
    color: 0x808080,
    elevationRange: [0.6, 1.0],
    moistureRange: [0.0, 0.4],
    resources: [
      { itemId: 'iron_ore', density: 0.25 },
      { itemId: 'copper_ore', density: 0.15 },
      { itemId: 'coal', density: 0.1 },
      { itemId: 'crystal', density: 0.05 },
    ],
    mobs: ['rock_golem', 'cave_bat'],
    mobDensity: 3,
  },
  {
    id: 'swamp',
    name: 'Swamp',
    color: 0x2e4a2e,
    elevationRange: [0.0, 0.3],
    moistureRange: [0.6, 1.0],
    resources: [
      { itemId: 'rare_mushroom', density: 0.2 },
      { itemId: 'swamp_reed', density: 0.15 },
      { itemId: 'slime_gel', density: 0.1 },
    ],
    mobs: ['poison_frog', 'bog_lurker', 'wisp'],
    mobDensity: 4,
  },
  {
    id: 'volcanic_wastes',
    name: 'Volcanic Wastes',
    color: 0x8b0000,
    elevationRange: [0.6, 1.0],
    moistureRange: [0.0, 0.3],
    heatRange: [0.7, 1.0],
    resources: [
      { itemId: 'obsidian', density: 0.2 },
      { itemId: 'fire_crystal', density: 0.1 },
      { itemId: 'rare_ore', density: 0.05 },
    ],
    mobs: ['fire_elemental', 'lava_crawler'],
    mobDensity: 5,
  },
  {
    id: 'corrupted_lands',
    name: 'Corrupted Lands',
    color: 0x4b0082,
    elevationRange: [0.0, 1.0],
    moistureRange: [0.0, 1.0],
    requiresCorruption: true,
    metaRequired: 'reach_volcanic_3',
    resources: [
      { itemId: 'shadow_essence', density: 0.2 },
      { itemId: 'void_crystal', density: 0.1 },
      { itemId: 'corrupted_wood', density: 0.15 },
    ],
    mobs: ['shadow_beast', 'corrupted_npc'],
    mobDensity: 6,
  },
];
```

- [ ] **Step 6: Write WorldSystem tests**

Create `tests/systems/WorldSystem.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { WorldSystem } from '@/systems/WorldSystem';
import { CHUNK_SIZE } from '@/config/game-config';

describe('WorldSystem', () => {
  it('generates a chunk with correct dimensions', () => {
    const world = new WorldSystem('test-seed');
    const chunk = world.getChunk(0, 0);
    expect(chunk.tiles.length).toBe(CHUNK_SIZE);
    expect(chunk.tiles[0].length).toBe(CHUNK_SIZE);
  });

  it('returns the same chunk for the same coordinates', () => {
    const world = new WorldSystem('test-seed');
    const chunk1 = world.getChunk(3, 5);
    const chunk2 = world.getChunk(3, 5);
    expect(chunk1).toBe(chunk2); // same reference (cached)
  });

  it('produces deterministic chunks for same seed', () => {
    const world1 = new WorldSystem('det-seed');
    const world2 = new WorldSystem('det-seed');
    const chunk1 = world1.getChunk(2, 3);
    const chunk2 = world2.getChunk(2, 3);
    expect(chunk1.tiles[0][0].biomeId).toBe(chunk2.tiles[0][0].biomeId);
    expect(chunk1.tiles[0][0].elevation).toBe(chunk2.tiles[0][0].elevation);
  });

  it('assigns a valid biome to every tile', () => {
    const world = new WorldSystem('biome-test');
    const chunk = world.getChunk(0, 0);
    const validBiomes = ['forest', 'rocky_highlands', 'swamp', 'volcanic_wastes', 'corrupted_lands'];
    for (const row of chunk.tiles) {
      for (const tile of row) {
        expect(validBiomes).toContain(tile.biomeId);
      }
    }
  });

  it('spawn chunk is always forest biome', () => {
    const world = new WorldSystem('spawn-test');
    const spawn = world.getChunk(0, 0);
    // At least the center tiles of spawn chunk should be forest
    const centerTile = spawn.tiles[Math.floor(CHUNK_SIZE / 2)][Math.floor(CHUNK_SIZE / 2)];
    expect(centerTile.biomeId).toBe('forest');
  });

  it('places resource nodes according to biome config', () => {
    const world = new WorldSystem('resource-test');
    const chunk = world.getChunk(0, 0);
    let hasResource = false;
    for (const row of chunk.tiles) {
      for (const tile of row) {
        if (tile.resourceNodeId !== null) {
          hasResource = true;
        }
      }
    }
    // With reasonable density, at least some tiles should have resources
    expect(hasResource).toBe(true);
  });

  it('getActiveChunks returns correct number of chunks', () => {
    const world = new WorldSystem('active-test');
    const active = world.getActiveChunks(0, 0);
    // ACTIVE_RADIUS = 3, so 3*2+1 = 7, 7*7 = 49... but we use a circle-ish shape
    // At minimum, should return some chunks centered on 0,0
    expect(active.length).toBeGreaterThan(0);
    expect(active.some(c => c.x === 0 && c.y === 0)).toBe(true);
  });
});
```

- [ ] **Step 7: Run tests to verify they fail**

```bash
npm run test:run -- tests/systems/WorldSystem.test.ts
```

Expected: FAIL — cannot resolve `@/systems/WorldSystem`.

- [ ] **Step 8: Implement WorldSystem**

Create `src/systems/WorldSystem.ts`:

```typescript
import { Chunk, Tile } from '@/types/world';
import { CHUNK_SIZE, WORLD_SCALE, ACTIVE_RADIUS } from '@/config/game-config';
import { BIOME_DEFINITIONS } from '@/config/biomes';
import { NoiseGenerator } from './NoiseGenerator';
import { chunkKey } from '@/utils/math';

export class WorldSystem {
  private chunks = new Map<string, Chunk>();
  private elevationNoise: NoiseGenerator;
  private moistureNoise: NoiseGenerator;
  private heatNoise: NoiseGenerator;
  private corruptionNoise: NoiseGenerator;
  private resourceNoise: NoiseGenerator;
  readonly seed: string;

  constructor(seed: string) {
    this.seed = seed;
    this.elevationNoise = new NoiseGenerator(seed + '-elevation');
    this.moistureNoise = new NoiseGenerator(seed + '-moisture');
    this.heatNoise = new NoiseGenerator(seed + '-heat');
    this.corruptionNoise = new NoiseGenerator(seed + '-corruption');
    this.resourceNoise = new NoiseGenerator(seed + '-resource');
  }

  getChunk(cx: number, cy: number): Chunk {
    const key = chunkKey(cx, cy);
    if (this.chunks.has(key)) {
      return this.chunks.get(key)!;
    }
    const chunk = this.generateChunk(cx, cy);
    this.chunks.set(key, chunk);
    return chunk;
  }

  getActiveChunks(centerCx: number, centerCy: number): Chunk[] {
    const chunks: Chunk[] = [];
    for (let dy = -ACTIVE_RADIUS; dy <= ACTIVE_RADIUS; dy++) {
      for (let dx = -ACTIVE_RADIUS; dx <= ACTIVE_RADIUS; dx++) {
        chunks.push(this.getChunk(centerCx + dx, centerCy + dy));
      }
    }
    return chunks;
  }

  private generateChunk(cx: number, cy: number): Chunk {
    const tiles: Tile[][] = [];

    for (let row = 0; row < CHUNK_SIZE; row++) {
      const tileRow: Tile[] = [];
      for (let col = 0; col < CHUNK_SIZE; col++) {
        const worldX = cx * CHUNK_SIZE + col;
        const worldY = cy * CHUNK_SIZE + row;

        const elevation = this.elevationNoise.getScaledNormalized(worldX, worldY, WORLD_SCALE);
        const moisture = this.moistureNoise.getScaledNormalized(worldX, worldY, WORLD_SCALE);
        const heat = this.heatNoise.getScaledNormalized(worldX, worldY, WORLD_SCALE);
        const corruption = this.corruptionNoise.getScaledNormalized(worldX, worldY, WORLD_SCALE * 0.5);

        const biomeId = this.assignBiome(cx, cy, elevation, moisture, heat, corruption);
        const resourceNodeId = this.placeResource(worldX, worldY, biomeId);

        tileRow.push({
          biomeId,
          elevation,
          resourceNodeId,
          walkable: true,
        });
      }
      tiles.push(tileRow);
    }

    return {
      x: cx,
      y: cy,
      tiles,
      entities: [],
      generated: true,
    };
  }

  private assignBiome(
    cx: number,
    cy: number,
    elevation: number,
    moisture: number,
    heat: number,
    corruption: number
  ): string {
    // Spawn chunk is always forest
    if (cx === 0 && cy === 0) {
      return 'forest';
    }

    // Corrupted lands require high corruption value
    if (corruption > 0.85) {
      return 'corrupted_lands';
    }

    // Volcanic: high elevation, low moisture, high heat
    if (elevation > 0.6 && moisture < 0.3 && heat > 0.7) {
      return 'volcanic_wastes';
    }

    // Rocky highlands: high elevation, low moisture
    if (elevation > 0.6 && moisture < 0.4) {
      return 'rocky_highlands';
    }

    // Swamp: low elevation, high moisture
    if (elevation < 0.3 && moisture > 0.6) {
      return 'swamp';
    }

    // Default: forest
    return 'forest';
  }

  private placeResource(worldX: number, worldY: number, biomeId: string): string | null {
    const biome = BIOME_DEFINITIONS.find(b => b.id === biomeId);
    if (!biome) return null;

    const noiseVal = this.resourceNoise.getNormalized(worldX * 7.3, worldY * 7.3);

    let cumDensity = 0;
    for (const resource of biome.resources) {
      cumDensity += resource.density;
      if (noiseVal < cumDensity) {
        return resource.itemId;
      }
    }

    return null;
  }
}
```

- [ ] **Step 9: Run tests to verify they pass**

```bash
npm run test:run -- tests/systems/WorldSystem.test.ts
```

Expected: All 7 WorldSystem tests PASS.

- [ ] **Step 10: Commit**

```bash
git add src/systems/NoiseGenerator.ts src/systems/WorldSystem.ts src/config/biomes.ts tests/systems/
git commit -m "feat: add noise generator and chunk-based world generation"
```

---

## Task 5: Combat System

**Files:**
- Create: `src/systems/CombatSystem.ts`
- Create: `tests/systems/CombatSystem.test.ts`

- [ ] **Step 1: Write CombatSystem tests**

Create `tests/systems/CombatSystem.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { CombatSystem } from '@/systems/CombatSystem';
import { EventBus } from '@/systems/EventBus';
import { EntityStats } from '@/types/entities';

function makeStats(overrides: Partial<EntityStats> = {}): EntityStats {
  return {
    health: 100,
    maxHealth: 100,
    attack: 10,
    defense: 3,
    speed: 100,
    attackSpeed: 1,
    ...overrides,
  };
}

describe('CombatSystem', () => {
  it('calculates damage as attack - defense with variance', () => {
    const combat = new CombatSystem(new EventBus());
    const attacker = makeStats({ attack: 15 });
    const defender = makeStats({ defense: 5 });
    const damage = combat.calculateDamage(attacker, defender);
    // 15 - 5 = 10, variance 0.8-1.2, so 8-12
    expect(damage).toBeGreaterThanOrEqual(8);
    expect(damage).toBeLessThanOrEqual(12);
  });

  it('deals minimum 1 damage when defense >= attack', () => {
    const combat = new CombatSystem(new EventBus());
    const attacker = makeStats({ attack: 3 });
    const defender = makeStats({ defense: 20 });
    const damage = combat.calculateDamage(attacker, defender);
    expect(damage).toBeGreaterThanOrEqual(1);
  });

  it('applies damage and reduces defender health', () => {
    const bus = new EventBus();
    const combat = new CombatSystem(bus);
    const defender = makeStats({ health: 50, defense: 0 });
    const attacker = makeStats({ attack: 10 });
    combat.applyDamage('attacker1', 'defender1', attacker, defender);
    expect(defender.health).toBeLessThan(50);
    expect(defender.health).toBeGreaterThanOrEqual(38); // 50 - 12 = 38 at most damage
  });

  it('emits damage-dealt event', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('damage-dealt', handler);
    const combat = new CombatSystem(bus);
    const attacker = makeStats({ attack: 10 });
    const defender = makeStats({ defense: 0 });
    combat.applyDamage('a', 'd', attacker, defender);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ attackerId: 'a', defenderId: 'd' })
    );
  });

  it('health does not go below 0', () => {
    const combat = new CombatSystem(new EventBus());
    const attacker = makeStats({ attack: 200 });
    const defender = makeStats({ health: 5, defense: 0 });
    combat.applyDamage('a', 'd', attacker, defender);
    expect(defender.health).toBe(0);
  });

  it('canAttack respects attack speed cooldown', () => {
    const combat = new CombatSystem(new EventBus());
    // attackSpeed = 2 means 2 attacks/sec = 500ms interval
    expect(combat.canAttack(2, 0, 600)).toBe(true);   // 600ms since last, 500ms needed
    expect(combat.canAttack(2, 0, 400)).toBe(false);  // 400ms since last, 500ms needed
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- tests/systems/CombatSystem.test.ts
```

Expected: FAIL — cannot resolve `@/systems/CombatSystem`.

- [ ] **Step 3: Implement CombatSystem**

Create `src/systems/CombatSystem.ts`:

```typescript
import { EntityStats } from '@/types/entities';
import { EventBus } from './EventBus';
import { damageVariance } from '@/utils/math';

export class CombatSystem {
  constructor(private eventBus: EventBus) {}

  calculateDamage(attacker: EntityStats, defender: EntityStats): number {
    const baseDamage = Math.max(0, attacker.attack - defender.defense);
    return damageVariance(baseDamage);
  }

  applyDamage(
    attackerId: string,
    defenderId: string,
    attacker: EntityStats,
    defender: EntityStats
  ): number {
    const damage = this.calculateDamage(attacker, defender);
    defender.health = Math.max(0, defender.health - damage);
    this.eventBus.emit('damage-dealt', { attackerId, defenderId, damage });
    return damage;
  }

  canAttack(attackSpeed: number, lastAttackTime: number, currentTime: number): boolean {
    const interval = 1000 / attackSpeed; // ms between attacks
    return (currentTime - lastAttackTime) >= interval;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- tests/systems/CombatSystem.test.ts
```

Expected: All 6 CombatSystem tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/systems/CombatSystem.ts tests/systems/CombatSystem.test.ts
git commit -m "feat: add combat system with damage calculation and attack speed"
```

---

## Task 6: Mob AI State Machine

**Files:**
- Create: `src/systems/MobAI.ts`, `src/config/mobs.ts`
- Create: `tests/systems/MobAI.test.ts`

- [ ] **Step 1: Create mob config data**

Create `src/config/mobs.ts`:

```typescript
import { MobDefinition } from '@/types/entities';

export const MOB_DEFINITIONS: MobDefinition[] = [
  // Passive
  {
    id: 'rabbit',
    name: 'Rabbit',
    category: 'passive',
    stats: { health: 5, maxHealth: 5, attack: 0, defense: 0, speed: 120, attackSpeed: 0 },
    alertRange: 80,
    attackRange: 0,
    leashDistance: 200,
    drops: [{ itemId: 'meat', count: 1, chance: 1.0 }],
    biomes: ['forest'],
    spawnWeight: 3,
    color: 0xc0c0c0,
  },
  {
    id: 'deer',
    name: 'Deer',
    category: 'passive',
    stats: { health: 10, maxHealth: 10, attack: 0, defense: 1, speed: 130, attackSpeed: 0 },
    alertRange: 100,
    attackRange: 0,
    leashDistance: 250,
    drops: [
      { itemId: 'meat', count: 2, chance: 1.0 },
      { itemId: 'hide', count: 1, chance: 0.5 },
    ],
    biomes: ['forest'],
    spawnWeight: 2,
    color: 0x8b6914,
  },
  // Aggressive
  {
    id: 'slime',
    name: 'Slime',
    category: 'aggressive',
    stats: { health: 20, maxHealth: 20, attack: 5, defense: 1, speed: 60, attackSpeed: 1 },
    alertRange: 100,
    attackRange: 30,
    leashDistance: 200,
    drops: [
      { itemId: 'slime_gel', count: 1, chance: 0.8 },
    ],
    biomes: ['forest'],
    spawnWeight: 2,
    color: 0x00ff00,
  },
  {
    id: 'rock_golem',
    name: 'Rock Golem',
    category: 'aggressive',
    stats: { health: 60, maxHealth: 60, attack: 12, defense: 8, speed: 40, attackSpeed: 0.5 },
    alertRange: 80,
    attackRange: 35,
    leashDistance: 150,
    drops: [
      { itemId: 'stone', count: 3, chance: 1.0 },
      { itemId: 'iron_ore', count: 1, chance: 0.3 },
    ],
    biomes: ['rocky_highlands'],
    spawnWeight: 2,
    color: 0x696969,
  },
  {
    id: 'cave_bat',
    name: 'Cave Bat',
    category: 'aggressive',
    stats: { health: 15, maxHealth: 15, attack: 7, defense: 1, speed: 150, attackSpeed: 2 },
    alertRange: 120,
    attackRange: 25,
    leashDistance: 200,
    drops: [
      { itemId: 'bone', count: 1, chance: 0.5 },
    ],
    biomes: ['rocky_highlands'],
    spawnWeight: 3,
    color: 0x3d3d3d,
  },
  {
    id: 'poison_frog',
    name: 'Poison Frog',
    category: 'aggressive',
    stats: { health: 12, maxHealth: 12, attack: 8, defense: 2, speed: 90, attackSpeed: 1.5 },
    alertRange: 70,
    attackRange: 25,
    leashDistance: 150,
    drops: [
      { itemId: 'slime_gel', count: 1, chance: 0.6 },
    ],
    biomes: ['swamp'],
    spawnWeight: 3,
    color: 0x32cd32,
  },
  {
    id: 'bog_lurker',
    name: 'Bog Lurker',
    category: 'aggressive',
    stats: { health: 45, maxHealth: 45, attack: 14, defense: 5, speed: 50, attackSpeed: 0.8 },
    alertRange: 90,
    attackRange: 35,
    leashDistance: 180,
    drops: [
      { itemId: 'rare_mushroom', count: 1, chance: 0.4 },
      { itemId: 'swamp_reed', count: 2, chance: 0.7 },
    ],
    biomes: ['swamp'],
    spawnWeight: 1,
    color: 0x556b2f,
  },
  {
    id: 'fire_elemental',
    name: 'Fire Elemental',
    category: 'aggressive',
    stats: { health: 80, maxHealth: 80, attack: 20, defense: 10, speed: 70, attackSpeed: 1 },
    alertRange: 120,
    attackRange: 40,
    leashDistance: 200,
    drops: [
      { itemId: 'fire_crystal', count: 1, chance: 0.5 },
    ],
    biomes: ['volcanic_wastes'],
    spawnWeight: 2,
    color: 0xff4500,
  },
  {
    id: 'shadow_beast',
    name: 'Shadow Beast',
    category: 'aggressive',
    stats: { health: 100, maxHealth: 100, attack: 25, defense: 12, speed: 100, attackSpeed: 1.5 },
    alertRange: 150,
    attackRange: 35,
    leashDistance: 300,
    drops: [
      { itemId: 'shadow_essence', count: 1, chance: 0.6 },
      { itemId: 'void_crystal', count: 1, chance: 0.2 },
    ],
    biomes: ['corrupted_lands'],
    spawnWeight: 2,
    color: 0x2f0047,
  },
  // Elite
  {
    id: 'ancient_golem',
    name: 'Ancient Golem',
    category: 'elite',
    stats: { health: 150, maxHealth: 150, attack: 20, defense: 15, speed: 35, attackSpeed: 0.4 },
    alertRange: 100,
    attackRange: 40,
    leashDistance: 250,
    drops: [
      { itemId: 'iron_ore', count: 5, chance: 1.0 },
      { itemId: 'crystal', count: 2, chance: 1.0 },
    ],
    biomes: ['rocky_highlands'],
    spawnWeight: 0.1,
    color: 0xa9a9a9,
  },
];
```

- [ ] **Step 2: Write MobAI tests**

Create `tests/systems/MobAI.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { MobAI } from '@/systems/MobAI';
import { MobState } from '@/types/entities';

function makeMob(overrides: Partial<MobState> = {}): MobState {
  return {
    id: 'mob1',
    typeId: 'slime',
    stats: { health: 20, maxHealth: 20, attack: 5, defense: 1, speed: 60, attackSpeed: 1 },
    position: { x: 100, y: 100 },
    aiState: 'idle',
    homePosition: { x: 100, y: 100 },
    target: null,
    leashDistance: 200,
    alertRange: 100,
    attackRange: 30,
    lastAttackTime: 0,
    ...overrides,
  };
}

describe('MobAI', () => {
  it('stays idle when player is out of alert range', () => {
    const mob = makeMob({ alertRange: 100 });
    const playerPos = { x: 300, y: 300 }; // ~283 away
    const result = MobAI.update(mob, playerPos, 'aggressive');
    expect(result.aiState).toBe('idle');
  });

  it('transitions to alert when player enters alert range', () => {
    const mob = makeMob({ alertRange: 100, aiState: 'idle' });
    const playerPos = { x: 150, y: 150 }; // ~71 away
    const result = MobAI.update(mob, playerPos, 'aggressive');
    expect(result.aiState).toBe('alert');
  });

  it('transitions from alert to chase when close enough', () => {
    const mob = makeMob({ alertRange: 100, aiState: 'alert' });
    const playerPos = { x: 150, y: 150 };
    // After alert, next tick should chase
    const alerted = MobAI.update(mob, playerPos, 'aggressive');
    const chasing = MobAI.update(alerted, playerPos, 'aggressive');
    expect(chasing.aiState).toBe('chase');
  });

  it('transitions to attack when in attack range', () => {
    const mob = makeMob({ attackRange: 30, aiState: 'chase' });
    const playerPos = { x: 120, y: 110 }; // ~22 away
    const result = MobAI.update(mob, playerPos, 'aggressive');
    expect(result.aiState).toBe('attack');
  });

  it('returns to idle when player exceeds leash distance', () => {
    const mob = makeMob({ aiState: 'chase', leashDistance: 200 });
    const playerPos = { x: 500, y: 500 }; // ~566 away from home
    const result = MobAI.update(mob, playerPos, 'aggressive');
    expect(result.aiState).toBe('returning');
  });

  it('passive mobs flee when damaged', () => {
    const mob = makeMob({ aiState: 'idle' });
    const playerPos = { x: 120, y: 120 };
    const result = MobAI.update(mob, playerPos, 'passive');
    // Passive mob should flee when player is in alert range
    expect(result.aiState).toBe('flee');
  });

  it('passive mobs stay idle when player is far', () => {
    const mob = makeMob({ aiState: 'idle', alertRange: 100 });
    const playerPos = { x: 500, y: 500 };
    const result = MobAI.update(mob, playerPos, 'passive');
    expect(result.aiState).toBe('idle');
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm run test:run -- tests/systems/MobAI.test.ts
```

Expected: FAIL — cannot resolve `@/systems/MobAI`.

- [ ] **Step 4: Implement MobAI**

Create `src/systems/MobAI.ts`:

```typescript
import { MobState, MobCategory } from '@/types/entities';
import { distance } from '@/utils/math';

export class MobAI {
  static update(mob: MobState, playerPos: { x: number; y: number }, category: MobCategory): MobState {
    if (category === 'passive') {
      return MobAI.updatePassive(mob, playerPos);
    }
    return MobAI.updateAggressive(mob, playerPos);
  }

  private static updatePassive(mob: MobState, playerPos: { x: number; y: number }): MobState {
    const distToPlayer = distance(mob.position.x, mob.position.y, playerPos.x, playerPos.y);

    if (distToPlayer < mob.alertRange) {
      return { ...mob, aiState: 'flee' };
    }

    // If fleeing and far enough, return to idle
    if (mob.aiState === 'flee' && distToPlayer >= mob.alertRange) {
      return { ...mob, aiState: 'idle' };
    }

    return { ...mob, aiState: 'idle' };
  }

  private static updateAggressive(mob: MobState, playerPos: { x: number; y: number }): MobState {
    const distToPlayer = distance(mob.position.x, mob.position.y, playerPos.x, playerPos.y);
    const distToHome = distance(mob.position.x, mob.position.y, mob.homePosition.x, mob.homePosition.y);

    // Check leash — return home if too far (except when idle/returning)
    if (mob.aiState !== 'idle' && mob.aiState !== 'returning' && distToHome > mob.leashDistance) {
      return { ...mob, aiState: 'returning', target: null };
    }

    // Returning state — go back to home, resume idle when close
    if (mob.aiState === 'returning') {
      const distHome = distance(mob.position.x, mob.position.y, mob.homePosition.x, mob.homePosition.y);
      if (distHome < 10) {
        return { ...mob, aiState: 'idle', target: null };
      }
      return mob;
    }

    // Idle — check if player is in alert range
    if (mob.aiState === 'idle' || mob.aiState === 'patrol') {
      if (distToPlayer < mob.alertRange) {
        return { ...mob, aiState: 'alert', target: 'player' };
      }
      return mob;
    }

    // Alert — transition to chase
    if (mob.aiState === 'alert') {
      if (distToPlayer < mob.alertRange) {
        return { ...mob, aiState: 'chase' };
      }
      return { ...mob, aiState: 'idle', target: null };
    }

    // Chase — move toward player, switch to attack if close enough
    if (mob.aiState === 'chase') {
      if (distToPlayer <= mob.attackRange) {
        return { ...mob, aiState: 'attack' };
      }
      if (distToPlayer >= mob.alertRange * 1.5) {
        return { ...mob, aiState: 'returning', target: null };
      }
      return mob;
    }

    // Attack — stay in attack state while in range, chase if player moves away
    if (mob.aiState === 'attack') {
      if (distToPlayer > mob.attackRange * 1.5) {
        return { ...mob, aiState: 'chase' };
      }
      return mob;
    }

    return mob;
  }

  /** Calculate movement vector for mob based on its AI state. */
  static getMovementDirection(
    mob: MobState,
    playerPos: { x: number; y: number }
  ): { dx: number; dy: number } {
    switch (mob.aiState) {
      case 'chase':
      case 'alert':
      case 'attack': {
        const dx = playerPos.x - mob.position.x;
        const dy = playerPos.y - mob.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return { dx: 0, dy: 0 };
        return { dx: dx / dist, dy: dy / dist };
      }
      case 'flee': {
        const dx = mob.position.x - playerPos.x;
        const dy = mob.position.y - playerPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return { dx: 0, dy: 0 };
        return { dx: dx / dist, dy: dy / dist };
      }
      case 'returning': {
        const dx = mob.homePosition.x - mob.position.x;
        const dy = mob.homePosition.y - mob.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return { dx: 0, dy: 0 };
        return { dx: dx / dist, dy: dy / dist };
      }
      default:
        return { dx: 0, dy: 0 };
    }
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm run test:run -- tests/systems/MobAI.test.ts
```

Expected: All 7 MobAI tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/systems/MobAI.ts src/config/mobs.ts tests/systems/MobAI.test.ts
git commit -m "feat: add mob AI state machine and mob definitions"
```

---

## Task 7: Item System & Inventory

**Files:**
- Create: `src/systems/ItemSystem.ts`, `src/config/items.ts`
- Create: `tests/systems/ItemSystem.test.ts`

- [ ] **Step 1: Create item config data**

Create `src/config/items.ts`:

```typescript
import { ItemDefinition } from '@/types/items';

export const ITEM_DEFINITIONS: ItemDefinition[] = [
  // Tier 1 Resources
  { id: 'wood', name: 'Wood', type: 'resource', tier: 1, stackable: true, maxStack: 99, quality: 'normal', modifiers: [], color: 0x8b4513 },
  { id: 'stone', name: 'Stone', type: 'resource', tier: 1, stackable: true, maxStack: 99, quality: 'normal', modifiers: [], color: 0x808080 },
  { id: 'berries', name: 'Berries', type: 'resource', tier: 1, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0xff6347 },
  { id: 'herbs', name: 'Herbs', type: 'resource', tier: 1, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0x32cd32 },
  { id: 'meat', name: 'Meat', type: 'resource', tier: 1, stackable: true, maxStack: 20, quality: 'normal', modifiers: [], color: 0xcd5c5c },
  { id: 'hide', name: 'Hide', type: 'resource', tier: 1, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0xdeb887 },
  { id: 'bone', name: 'Bone', type: 'resource', tier: 1, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0xfffacd },
  { id: 'slime_gel', name: 'Slime Gel', type: 'resource', tier: 1, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0x7fff00 },

  // Tier 2 Resources
  { id: 'iron_ore', name: 'Iron Ore', type: 'resource', tier: 2, stackable: true, maxStack: 50, quality: 'normal', modifiers: [], color: 0xa0522d },
  { id: 'copper_ore', name: 'Copper Ore', type: 'resource', tier: 2, stackable: true, maxStack: 50, quality: 'normal', modifiers: [], color: 0xb87333 },
  { id: 'coal', name: 'Coal', type: 'resource', tier: 2, stackable: true, maxStack: 50, quality: 'normal', modifiers: [], color: 0x2f2f2f },
  { id: 'crystal', name: 'Crystal', type: 'resource', tier: 2, stackable: true, maxStack: 20, quality: 'normal', modifiers: [], color: 0x87ceeb },
  { id: 'iron_ingot', name: 'Iron Ingot', type: 'resource', tier: 2, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0xb0c4de },
  { id: 'wood_plank', name: 'Wood Plank', type: 'resource', tier: 1, stackable: true, maxStack: 50, quality: 'normal', modifiers: [], color: 0xdeb887 },

  // Tier 3 Resources
  { id: 'rare_mushroom', name: 'Rare Mushroom', type: 'resource', tier: 3, stackable: true, maxStack: 20, quality: 'normal', modifiers: [], color: 0x9932cc },
  { id: 'swamp_reed', name: 'Swamp Reed', type: 'resource', tier: 3, stackable: true, maxStack: 30, quality: 'normal', modifiers: [], color: 0x6b8e23 },

  // Tier 4 Resources
  { id: 'obsidian', name: 'Obsidian', type: 'resource', tier: 4, stackable: true, maxStack: 20, quality: 'normal', modifiers: [], color: 0x1a1a2e },
  { id: 'fire_crystal', name: 'Fire Crystal', type: 'resource', tier: 4, stackable: true, maxStack: 10, quality: 'normal', modifiers: [], color: 0xff4500 },
  { id: 'rare_ore', name: 'Rare Ore', type: 'resource', tier: 4, stackable: true, maxStack: 15, quality: 'normal', modifiers: [], color: 0xffd700 },

  // Tier 5 Resources
  { id: 'shadow_essence', name: 'Shadow Essence', type: 'resource', tier: 5, stackable: true, maxStack: 10, quality: 'normal', modifiers: [], color: 0x2f0047 },
  { id: 'void_crystal', name: 'Void Crystal', type: 'resource', tier: 5, stackable: true, maxStack: 5, quality: 'normal', modifiers: [], color: 0x4b0082 },
  { id: 'corrupted_wood', name: 'Corrupted Wood', type: 'resource', tier: 5, stackable: true, maxStack: 20, quality: 'normal', modifiers: [], color: 0x3d003d },

  // Tier 1 Tools & Weapons
  { id: 'wooden_axe', name: 'Wooden Axe', type: 'tool', tier: 1, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 3 }, color: 0x8b4513 },
  { id: 'wooden_pickaxe', name: 'Wooden Pickaxe', type: 'tool', tier: 1, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 2 }, color: 0x8b4513 },
  { id: 'wooden_sword', name: 'Wooden Sword', type: 'weapon', tier: 1, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 5, attackSpeed: 1.2 }, color: 0xa0522d },

  // Tier 2 Weapons
  { id: 'iron_sword', name: 'Iron Sword', type: 'weapon', tier: 2, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { attack: 12, attackSpeed: 1.0 }, color: 0xb0c4de },
  { id: 'iron_armor', name: 'Iron Armor', type: 'armor', tier: 2, stackable: false, maxStack: 1, quality: 'normal', modifiers: [], stats: { defense: 8 }, color: 0xb0c4de },

  // Consumables
  { id: 'bandage', name: 'Bandage', type: 'consumable', tier: 1, stackable: true, maxStack: 10, quality: 'normal', modifiers: [], color: 0xffffff },
  { id: 'cooked_meat', name: 'Cooked Meat', type: 'consumable', tier: 1, stackable: true, maxStack: 10, quality: 'normal', modifiers: [], color: 0xcd853f },
  { id: 'health_potion', name: 'Health Potion', type: 'consumable', tier: 3, stackable: true, maxStack: 5, quality: 'normal', modifiers: [], color: 0xff0000 },

  // Misc
  { id: 'gold_coin', name: 'Gold Coin', type: 'misc', tier: 1, stackable: true, maxStack: 999, quality: 'normal', modifiers: [], color: 0xffd700 },
];

export function getItemDef(id: string): ItemDefinition | undefined {
  return ITEM_DEFINITIONS.find(item => item.id === id);
}
```

- [ ] **Step 2: Write ItemSystem tests**

Create `tests/systems/ItemSystem.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ItemSystem } from '@/systems/ItemSystem';
import { EventBus } from '@/systems/EventBus';
import { InventorySlot } from '@/types/entities';

describe('ItemSystem', () => {
  function makeInventory(): InventorySlot[] {
    return [];
  }

  it('adds a new item to empty inventory', () => {
    const system = new ItemSystem(new EventBus());
    const inv = makeInventory();
    const result = system.addItem(inv, 'wood', 5);
    expect(result.success).toBe(true);
    expect(inv).toContainEqual({ itemId: 'wood', count: 5 });
  });

  it('stacks items in existing slot', () => {
    const system = new ItemSystem(new EventBus());
    const inv: InventorySlot[] = [{ itemId: 'wood', count: 10 }];
    system.addItem(inv, 'wood', 5);
    expect(inv[0].count).toBe(15);
  });

  it('respects max stack size', () => {
    const system = new ItemSystem(new EventBus());
    const inv: InventorySlot[] = [{ itemId: 'wood', count: 95 }];
    const result = system.addItem(inv, 'wood', 10);
    expect(inv[0].count).toBe(99); // maxStack for wood is 99
    expect(result.overflow).toBe(6);
  });

  it('removes items from inventory', () => {
    const system = new ItemSystem(new EventBus());
    const inv: InventorySlot[] = [{ itemId: 'wood', count: 10 }];
    const result = system.removeItem(inv, 'wood', 3);
    expect(result).toBe(true);
    expect(inv[0].count).toBe(7);
  });

  it('removes slot when count reaches 0', () => {
    const system = new ItemSystem(new EventBus());
    const inv: InventorySlot[] = [{ itemId: 'wood', count: 5 }];
    system.removeItem(inv, 'wood', 5);
    expect(inv.length).toBe(0);
  });

  it('returns false when removing more than available', () => {
    const system = new ItemSystem(new EventBus());
    const inv: InventorySlot[] = [{ itemId: 'wood', count: 3 }];
    const result = system.removeItem(inv, 'wood', 5);
    expect(result).toBe(false);
    expect(inv[0].count).toBe(3); // unchanged
  });

  it('checks if inventory has enough items', () => {
    const system = new ItemSystem(new EventBus());
    const inv: InventorySlot[] = [
      { itemId: 'wood', count: 10 },
      { itemId: 'stone', count: 5 },
    ];
    expect(system.hasItems(inv, [{ item: 'wood', count: 5 }])).toBe(true);
    expect(system.hasItems(inv, [{ item: 'wood', count: 15 }])).toBe(false);
    expect(system.hasItems(inv, [{ item: 'iron_ore', count: 1 }])).toBe(false);
  });

  it('emits item-picked-up event on addItem', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('item-picked-up', handler);
    const system = new ItemSystem(bus);
    system.addItem([], 'wood', 3);
    expect(handler).toHaveBeenCalledWith({ itemId: 'wood', count: 3 });
  });

  it('getItemCount returns total count across slots', () => {
    const system = new ItemSystem(new EventBus());
    const inv: InventorySlot[] = [
      { itemId: 'wood', count: 10 },
      { itemId: 'stone', count: 5 },
    ];
    expect(system.getItemCount(inv, 'wood')).toBe(10);
    expect(system.getItemCount(inv, 'iron_ore')).toBe(0);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm run test:run -- tests/systems/ItemSystem.test.ts
```

Expected: FAIL — cannot resolve `@/systems/ItemSystem`.

- [ ] **Step 4: Implement ItemSystem**

Create `src/systems/ItemSystem.ts`:

```typescript
import { InventorySlot } from '@/types/entities';
import { EventBus } from './EventBus';
import { getItemDef } from '@/config/items';

export class ItemSystem {
  constructor(private eventBus: EventBus) {}

  addItem(
    inventory: InventorySlot[],
    itemId: string,
    count: number
  ): { success: boolean; overflow: number } {
    const def = getItemDef(itemId);
    const maxStack = def?.maxStack ?? 99;
    let remaining = count;

    // Try to stack into existing slot
    const existing = inventory.find(slot => slot.itemId === itemId);
    if (existing) {
      const canAdd = maxStack - existing.count;
      const toAdd = Math.min(remaining, canAdd);
      existing.count += toAdd;
      remaining -= toAdd;
    }

    // If still remaining, add new slot
    if (remaining > 0 && !existing) {
      const toAdd = Math.min(remaining, maxStack);
      inventory.push({ itemId, count: toAdd });
      remaining -= toAdd;
    }

    this.eventBus.emit('item-picked-up', { itemId, count: count - remaining });

    return {
      success: remaining < count,
      overflow: remaining,
    };
  }

  removeItem(inventory: InventorySlot[], itemId: string, count: number): boolean {
    const slot = inventory.find(s => s.itemId === itemId);
    if (!slot || slot.count < count) {
      return false;
    }

    slot.count -= count;
    if (slot.count === 0) {
      const index = inventory.indexOf(slot);
      inventory.splice(index, 1);
    }

    return true;
  }

  hasItems(inventory: InventorySlot[], requirements: { item: string; count: number }[]): boolean {
    return requirements.every(req => {
      const total = this.getItemCount(inventory, req.item);
      return total >= req.count;
    });
  }

  getItemCount(inventory: InventorySlot[], itemId: string): number {
    return inventory
      .filter(s => s.itemId === itemId)
      .reduce((sum, s) => sum + s.count, 0);
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm run test:run -- tests/systems/ItemSystem.test.ts
```

Expected: All 9 ItemSystem tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/systems/ItemSystem.ts src/config/items.ts tests/systems/ItemSystem.test.ts
git commit -m "feat: add inventory/item system and item definitions"
```

---

## Task 8: Crafting System

**Files:**
- Create: `src/systems/CraftingSystem.ts`, `src/config/recipes.ts`
- Create: `tests/systems/CraftingSystem.test.ts`

- [ ] **Step 1: Create recipe config data**

Create `src/config/recipes.ts`:

```typescript
import { RecipeDefinition } from '@/types/items';

export const RECIPE_DEFINITIONS: RecipeDefinition[] = [
  // Tier 1 — Known from start
  {
    id: 'wood_plank',
    name: 'Wood Plank',
    tier: 1,
    station: 'hand',
    ingredients: [{ item: 'wood', count: 2 }],
    output: { item: 'wood_plank', count: 3 },
    discovery: 'known',
    metaRequired: null,
  },
  {
    id: 'wooden_sword',
    name: 'Wooden Sword',
    tier: 1,
    station: 'workbench',
    ingredients: [
      { item: 'wood_plank', count: 3 },
      { item: 'wood', count: 1 },
    ],
    output: { item: 'wooden_sword', count: 1 },
    discovery: 'known',
    metaRequired: null,
  },
  {
    id: 'wooden_axe',
    name: 'Wooden Axe',
    tier: 1,
    station: 'workbench',
    ingredients: [
      { item: 'wood_plank', count: 2 },
      { item: 'wood', count: 2 },
    ],
    output: { item: 'wooden_axe', count: 1 },
    discovery: 'known',
    metaRequired: null,
  },
  {
    id: 'wooden_pickaxe',
    name: 'Wooden Pickaxe',
    tier: 1,
    station: 'workbench',
    ingredients: [
      { item: 'wood_plank', count: 2 },
      { item: 'wood', count: 2 },
    ],
    output: { item: 'wooden_pickaxe', count: 1 },
    discovery: 'known',
    metaRequired: null,
  },
  {
    id: 'bandage',
    name: 'Bandage',
    tier: 1,
    station: 'hand',
    ingredients: [{ item: 'herbs', count: 2 }],
    output: { item: 'bandage', count: 2 },
    discovery: 'known',
    metaRequired: null,
  },
  {
    id: 'cooked_meat',
    name: 'Cooked Meat',
    tier: 1,
    station: 'campfire',
    ingredients: [{ item: 'meat', count: 1 }],
    output: { item: 'cooked_meat', count: 1 },
    discovery: 'known',
    metaRequired: null,
  },

  // Tier 2 — Material discovery
  {
    id: 'iron_ingot',
    name: 'Iron Ingot',
    tier: 2,
    station: 'forge',
    ingredients: [
      { item: 'iron_ore', count: 2 },
      { item: 'coal', count: 1 },
    ],
    output: { item: 'iron_ingot', count: 1 },
    discovery: 'material',
    materialTrigger: 'iron_ore',
    metaRequired: null,
  },
  {
    id: 'iron_sword',
    name: 'Iron Sword',
    tier: 2,
    station: 'forge',
    ingredients: [
      { item: 'iron_ingot', count: 3 },
      { item: 'wood_plank', count: 1 },
    ],
    output: { item: 'iron_sword', count: 1 },
    discovery: 'material',
    materialTrigger: 'iron_ingot',
    metaRequired: null,
  },
  {
    id: 'iron_armor',
    name: 'Iron Armor',
    tier: 2,
    station: 'forge',
    ingredients: [
      { item: 'iron_ingot', count: 5 },
      { item: 'hide', count: 3 },
    ],
    output: { item: 'iron_armor', count: 1 },
    discovery: 'material',
    materialTrigger: 'iron_ingot',
    metaRequired: null,
  },

  // Tier 3 — Scroll / experiment
  {
    id: 'health_potion',
    name: 'Health Potion',
    tier: 3,
    station: 'alchemy_table',
    ingredients: [
      { item: 'rare_mushroom', count: 2 },
      { item: 'herbs', count: 3 },
      { item: 'slime_gel', count: 1 },
    ],
    output: { item: 'health_potion', count: 1 },
    discovery: 'scroll',
    metaRequired: null,
  },
];

export function getRecipeDef(id: string): RecipeDefinition | undefined {
  return RECIPE_DEFINITIONS.find(r => r.id === id);
}
```

- [ ] **Step 2: Write CraftingSystem tests**

Create `tests/systems/CraftingSystem.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { CraftingSystem } from '@/systems/CraftingSystem';
import { ItemSystem } from '@/systems/ItemSystem';
import { EventBus } from '@/systems/EventBus';
import { InventorySlot } from '@/types/entities';

describe('CraftingSystem', () => {
  function setup() {
    const bus = new EventBus();
    const itemSystem = new ItemSystem(bus);
    const crafting = new CraftingSystem(bus, itemSystem);
    return { bus, itemSystem, crafting };
  }

  it('canCraft returns true when player has all ingredients', () => {
    const { crafting } = setup();
    const inv: InventorySlot[] = [
      { itemId: 'wood', count: 10 },
    ];
    const known = new Set(['wood_plank']);
    expect(crafting.canCraft('wood_plank', inv, known, 'hand')).toBe(true);
  });

  it('canCraft returns false when missing ingredients', () => {
    const { crafting } = setup();
    const inv: InventorySlot[] = [{ itemId: 'wood', count: 1 }]; // need 2
    const known = new Set(['wood_plank']);
    expect(crafting.canCraft('wood_plank', inv, known, 'hand')).toBe(false);
  });

  it('canCraft returns false when recipe is not discovered', () => {
    const { crafting } = setup();
    const inv: InventorySlot[] = [{ itemId: 'wood', count: 10 }];
    const known = new Set<string>(); // empty — nothing discovered
    expect(crafting.canCraft('wood_plank', inv, known, 'hand')).toBe(false);
  });

  it('canCraft returns false when at wrong station', () => {
    const { crafting } = setup();
    const inv: InventorySlot[] = [
      { itemId: 'wood_plank', count: 5 },
      { itemId: 'wood', count: 5 },
    ];
    const known = new Set(['wooden_sword']);
    // wooden_sword needs workbench, not hand
    expect(crafting.canCraft('wooden_sword', inv, known, 'hand')).toBe(false);
    expect(crafting.canCraft('wooden_sword', inv, known, 'workbench')).toBe(true);
  });

  it('craft removes ingredients and adds output', () => {
    const { crafting } = setup();
    const inv: InventorySlot[] = [{ itemId: 'wood', count: 10 }];
    const known = new Set(['wood_plank']);
    const result = crafting.craft('wood_plank', inv, known, 'hand');
    expect(result).toBe(true);
    expect(inv.find(s => s.itemId === 'wood')?.count).toBe(8); // 10 - 2
    expect(inv.find(s => s.itemId === 'wood_plank')?.count).toBe(3); // output
  });

  it('craft emits item-crafted event', () => {
    const { bus, crafting } = setup();
    const handler = vi.fn();
    bus.on('item-crafted', handler);
    const inv: InventorySlot[] = [{ itemId: 'wood', count: 10 }];
    const known = new Set(['wood_plank']);
    crafting.craft('wood_plank', inv, known, 'hand');
    expect(handler).toHaveBeenCalledWith({ recipeId: 'wood_plank' });
  });

  it('getKnownRecipes returns only known recipes', () => {
    const { crafting } = setup();
    const known = new Set(['wood_plank', 'bandage']);
    const recipes = crafting.getKnownRecipes(known);
    expect(recipes.length).toBe(2);
    expect(recipes.map(r => r.id)).toContain('wood_plank');
    expect(recipes.map(r => r.id)).toContain('bandage');
  });

  it('getStartingRecipes returns all "known" discovery recipes', () => {
    const { crafting } = setup();
    const starting = crafting.getStartingRecipes();
    expect(starting.length).toBeGreaterThan(0);
    expect(starting.every(r => r.discovery === 'known')).toBe(true);
  });

  it('checkMaterialDiscovery returns recipes triggered by a material', () => {
    const { crafting } = setup();
    const discovered = crafting.checkMaterialDiscovery('iron_ore');
    expect(discovered.some(r => r.id === 'iron_ingot')).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm run test:run -- tests/systems/CraftingSystem.test.ts
```

Expected: FAIL — cannot resolve `@/systems/CraftingSystem`.

- [ ] **Step 4: Implement CraftingSystem**

Create `src/systems/CraftingSystem.ts`:

```typescript
import { RecipeDefinition } from '@/types/items';
import { InventorySlot } from '@/types/entities';
import { EventBus } from './EventBus';
import { ItemSystem } from './ItemSystem';
import { RECIPE_DEFINITIONS, getRecipeDef } from '@/config/recipes';
import { CraftingStation } from '@/types/items';

export class CraftingSystem {
  constructor(
    private eventBus: EventBus,
    private itemSystem: ItemSystem
  ) {}

  canCraft(
    recipeId: string,
    inventory: InventorySlot[],
    knownRecipes: Set<string>,
    currentStation: CraftingStation
  ): boolean {
    if (!knownRecipes.has(recipeId)) return false;

    const recipe = getRecipeDef(recipeId);
    if (!recipe) return false;

    if (recipe.station !== currentStation) return false;

    return this.itemSystem.hasItems(inventory, recipe.ingredients);
  }

  craft(
    recipeId: string,
    inventory: InventorySlot[],
    knownRecipes: Set<string>,
    currentStation: CraftingStation
  ): boolean {
    if (!this.canCraft(recipeId, inventory, knownRecipes, currentStation)) {
      return false;
    }

    const recipe = getRecipeDef(recipeId)!;

    // Remove ingredients
    for (const ingredient of recipe.ingredients) {
      this.itemSystem.removeItem(inventory, ingredient.item, ingredient.count);
    }

    // Add output
    this.itemSystem.addItem(inventory, recipe.output.item, recipe.output.count);

    this.eventBus.emit('item-crafted', { recipeId });
    return true;
  }

  getKnownRecipes(knownRecipes: Set<string>): RecipeDefinition[] {
    return RECIPE_DEFINITIONS.filter(r => knownRecipes.has(r.id));
  }

  getStartingRecipes(): RecipeDefinition[] {
    return RECIPE_DEFINITIONS.filter(r => r.discovery === 'known');
  }

  checkMaterialDiscovery(materialId: string): RecipeDefinition[] {
    return RECIPE_DEFINITIONS.filter(
      r => r.discovery === 'material' && r.materialTrigger === materialId
    );
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm run test:run -- tests/systems/CraftingSystem.test.ts
```

Expected: All 9 CraftingSystem tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/systems/CraftingSystem.ts src/config/recipes.ts tests/systems/CraftingSystem.test.ts
git commit -m "feat: add crafting system with recipe discovery mechanics"
```

---

## Task 9: NPC System

**Files:**
- Create: `src/systems/NPCSystem.ts`, `src/config/npcs.ts`
- Create: `tests/systems/NPCSystem.test.ts`

- [ ] **Step 1: Create NPC config data**

Create `src/config/npcs.ts`:

```typescript
import { NPCDefinition } from '@/types/entities';

export const NPC_DEFINITIONS: NPCDefinition[] = [
  {
    id: 'woodcutter',
    name: 'Woodcutter',
    hireCost: [{ item: 'gold_coin', count: 5 }],
    gatherType: 'wood',
    gatherRate: 2,
    maxStorage: 20,
    metaRequired: null,
    stats: null,
  },
  {
    id: 'miner',
    name: 'Miner',
    hireCost: [{ item: 'gold_coin', count: 8 }],
    gatherType: 'stone',
    gatherRate: 1.5,
    maxStorage: 15,
    metaRequired: 'unlock_miner',
    stats: null,
  },
  {
    id: 'herbalist',
    name: 'Herbalist',
    hireCost: [{ item: 'gold_coin', count: 10 }],
    gatherType: 'herbs',
    gatherRate: 1,
    maxStorage: 10,
    metaRequired: 'unlock_herbalist',
    stats: null,
  },
];

export function getNPCDef(id: string): NPCDefinition | undefined {
  return NPC_DEFINITIONS.find(n => n.id === id);
}
```

- [ ] **Step 2: Write NPCSystem tests**

Create `tests/systems/NPCSystem.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { NPCSystem } from '@/systems/NPCSystem';
import { ItemSystem } from '@/systems/ItemSystem';
import { EventBus } from '@/systems/EventBus';
import { InventorySlot, NPCState } from '@/types/entities';

describe('NPCSystem', () => {
  function setup() {
    const bus = new EventBus();
    const itemSystem = new ItemSystem(bus);
    const npcSystem = new NPCSystem(bus, itemSystem);
    return { bus, itemSystem, npcSystem };
  }

  it('hires an NPC when player has enough resources', () => {
    const { npcSystem } = setup();
    const inv: InventorySlot[] = [{ itemId: 'gold_coin', count: 10 }];
    const npcs: NPCState[] = [];
    const unlockedTypes = new Set(['woodcutter']);
    const result = npcSystem.hire('woodcutter', inv, npcs, unlockedTypes);
    expect(result).toBe(true);
    expect(npcs.length).toBe(1);
    expect(npcs[0].typeId).toBe('woodcutter');
    expect(inv[0].count).toBe(5); // 10 - 5
  });

  it('refuses to hire when player cannot afford', () => {
    const { npcSystem } = setup();
    const inv: InventorySlot[] = [{ itemId: 'gold_coin', count: 2 }];
    const npcs: NPCState[] = [];
    const unlockedTypes = new Set(['woodcutter']);
    const result = npcSystem.hire('woodcutter', inv, npcs, unlockedTypes);
    expect(result).toBe(false);
    expect(npcs.length).toBe(0);
  });

  it('refuses to hire NPC type not yet unlocked', () => {
    const { npcSystem } = setup();
    const inv: InventorySlot[] = [{ itemId: 'gold_coin', count: 20 }];
    const npcs: NPCState[] = [];
    const unlockedTypes = new Set<string>(); // nothing unlocked
    const result = npcSystem.hire('woodcutter', inv, npcs, unlockedTypes);
    expect(result).toBe(false);
  });

  it('assigns resource to NPC', () => {
    const { npcSystem } = setup();
    const npc: NPCState = {
      id: 'npc1',
      typeId: 'woodcutter',
      assignedResource: null,
      storedAmount: 0,
      lastGatherTime: 0,
    };
    npcSystem.assignResource(npc, 'wood');
    expect(npc.assignedResource).toBe('wood');
  });

  it('gathers resources over time', () => {
    const { npcSystem } = setup();
    const npc: NPCState = {
      id: 'npc1',
      typeId: 'woodcutter',
      assignedResource: 'wood',
      storedAmount: 0,
      lastGatherTime: 0,
    };
    // woodcutter gatherRate = 2/min, so after 60 seconds should have 2
    npcSystem.updateGathering(npc, 60000);
    expect(npc.storedAmount).toBe(2);
  });

  it('respects max storage', () => {
    const { npcSystem } = setup();
    const npc: NPCState = {
      id: 'npc1',
      typeId: 'woodcutter',
      assignedResource: 'wood',
      storedAmount: 19,
      lastGatherTime: 0,
    };
    // woodcutter maxStorage = 20, so only 1 more should be added
    npcSystem.updateGathering(npc, 60000);
    expect(npc.storedAmount).toBe(20);
  });

  it('collects resources from NPC into inventory', () => {
    const { bus, npcSystem } = setup();
    const handler = vi.fn();
    bus.on('npc-collected', handler);
    const npc: NPCState = {
      id: 'npc1',
      typeId: 'woodcutter',
      assignedResource: 'wood',
      storedAmount: 10,
      lastGatherTime: 0,
    };
    const inv: InventorySlot[] = [];
    npcSystem.collect(npc, inv);
    expect(npc.storedAmount).toBe(0);
    expect(inv[0]).toEqual({ itemId: 'wood', count: 10 });
    expect(handler).toHaveBeenCalledWith({ npcId: 'npc1', itemId: 'wood', count: 10 });
  });

  it('does not gather if no resource assigned', () => {
    const { npcSystem } = setup();
    const npc: NPCState = {
      id: 'npc1',
      typeId: 'woodcutter',
      assignedResource: null,
      storedAmount: 0,
      lastGatherTime: 0,
    };
    npcSystem.updateGathering(npc, 60000);
    expect(npc.storedAmount).toBe(0);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm run test:run -- tests/systems/NPCSystem.test.ts
```

Expected: FAIL — cannot resolve `@/systems/NPCSystem`.

- [ ] **Step 4: Implement NPCSystem**

Create `src/systems/NPCSystem.ts`:

```typescript
import { NPCState, InventorySlot } from '@/types/entities';
import { EventBus } from './EventBus';
import { ItemSystem } from './ItemSystem';
import { getNPCDef } from '@/config/npcs';

export class NPCSystem {
  constructor(
    private eventBus: EventBus,
    private itemSystem: ItemSystem
  ) {}

  hire(
    npcTypeId: string,
    inventory: InventorySlot[],
    npcs: NPCState[],
    unlockedTypes: Set<string>
  ): boolean {
    if (!unlockedTypes.has(npcTypeId)) return false;

    const def = getNPCDef(npcTypeId);
    if (!def) return false;

    if (!this.itemSystem.hasItems(inventory, def.hireCost)) return false;

    // Deduct cost
    for (const cost of def.hireCost) {
      this.itemSystem.removeItem(inventory, cost.item, cost.count);
    }

    const npc: NPCState = {
      id: `npc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      typeId: npcTypeId,
      assignedResource: null,
      storedAmount: 0,
      lastGatherTime: Date.now(),
    };

    npcs.push(npc);
    this.eventBus.emit('npc-hired', { npcTypeId });
    return true;
  }

  assignResource(npc: NPCState, resourceId: string): void {
    npc.assignedResource = resourceId;
    npc.lastGatherTime = Date.now();
  }

  updateGathering(npc: NPCState, elapsedMs: number): void {
    if (!npc.assignedResource) return;

    const def = getNPCDef(npc.typeId);
    if (!def) return;

    const minutesElapsed = elapsedMs / 60000;
    const gathered = Math.floor(minutesElapsed * def.gatherRate);

    if (gathered > 0) {
      npc.storedAmount = Math.min(def.maxStorage, npc.storedAmount + gathered);
      npc.lastGatherTime += elapsedMs;
    }
  }

  collect(npc: NPCState, inventory: InventorySlot[]): void {
    if (npc.storedAmount <= 0 || !npc.assignedResource) return;

    const amount = npc.storedAmount;
    const itemId = npc.assignedResource;

    this.itemSystem.addItem(inventory, itemId, amount);
    npc.storedAmount = 0;

    this.eventBus.emit('npc-collected', { npcId: npc.id, itemId, count: amount });
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm run test:run -- tests/systems/NPCSystem.test.ts
```

Expected: All 7 NPCSystem tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/systems/NPCSystem.ts src/config/npcs.ts tests/systems/NPCSystem.test.ts
git commit -m "feat: add NPC hiring and passive resource gathering system"
```

---

## Task 10: Progression System

**Files:**
- Create: `src/systems/ProgressionSystem.ts`
- Create: `tests/systems/ProgressionSystem.test.ts`

- [ ] **Step 1: Write ProgressionSystem tests**

Create `tests/systems/ProgressionSystem.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProgressionSystem, MetaSave } from '@/systems/ProgressionSystem';

// Mock localStorage
const mockStorage = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => mockStorage.set(key, value)),
  removeItem: vi.fn((key: string) => mockStorage.delete(key)),
  clear: vi.fn(() => mockStorage.clear()),
};

describe('ProgressionSystem', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  it('creates a fresh save when none exists', () => {
    const prog = new ProgressionSystem(localStorageMock as any);
    const save = prog.load();
    expect(save.knownRecipes).toEqual([]);
    expect(save.unlockedNPCTypes).toEqual([]);
    expect(save.milestones).toEqual({});
    expect(save.totalRuns).toBe(0);
  });

  it('saves and loads recipe knowledge', () => {
    const prog = new ProgressionSystem(localStorageMock as any);
    prog.addRecipe('iron_sword');
    prog.addRecipe('health_potion');
    prog.save();

    const prog2 = new ProgressionSystem(localStorageMock as any);
    const save = prog2.load();
    expect(save.knownRecipes).toContain('iron_sword');
    expect(save.knownRecipes).toContain('health_potion');
  });

  it('does not duplicate recipes', () => {
    const prog = new ProgressionSystem(localStorageMock as any);
    prog.addRecipe('iron_sword');
    prog.addRecipe('iron_sword');
    const save = prog.getSave();
    expect(save.knownRecipes.filter(r => r === 'iron_sword').length).toBe(1);
  });

  it('tracks milestones', () => {
    const prog = new ProgressionSystem(localStorageMock as any);
    prog.incrementMilestone('reach_volcanic');
    prog.incrementMilestone('reach_volcanic');
    prog.incrementMilestone('reach_volcanic');
    const save = prog.getSave();
    expect(save.milestones['reach_volcanic']).toBe(3);
  });

  it('unlocks NPC types', () => {
    const prog = new ProgressionSystem(localStorageMock as any);
    prog.unlockNPCType('woodcutter');
    const save = prog.getSave();
    expect(save.unlockedNPCTypes).toContain('woodcutter');
  });

  it('increments total runs', () => {
    const prog = new ProgressionSystem(localStorageMock as any);
    prog.recordRunEnd();
    prog.recordRunEnd();
    const save = prog.getSave();
    expect(save.totalRuns).toBe(2);
  });

  it('getStartingRecipeIds returns known + meta-persisted recipes', () => {
    const prog = new ProgressionSystem(localStorageMock as any);
    prog.addRecipe('iron_sword');
    // Starting recipes (discovery: "known") should always be included
    const ids = prog.getStartingRecipeIds();
    expect(ids).toContain('iron_sword');
    // All "known" discovery recipes from config should be present
    expect(ids).toContain('wood_plank');
    expect(ids).toContain('bandage');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm run test:run -- tests/systems/ProgressionSystem.test.ts
```

Expected: FAIL — cannot resolve `@/systems/ProgressionSystem`.

- [ ] **Step 3: Implement ProgressionSystem**

Create `src/systems/ProgressionSystem.ts`:

```typescript
import { RECIPE_DEFINITIONS } from '@/config/recipes';

const SAVE_KEY = 'survivor_meta';

export interface MetaSave {
  knownRecipes: string[];
  unlockedNPCTypes: string[];
  milestones: Record<string, number>;
  totalRuns: number;
  startingBonuses: string[];
}

function defaultSave(): MetaSave {
  return {
    knownRecipes: [],
    unlockedNPCTypes: [],
    milestones: {},
    totalRuns: 0,
    startingBonuses: [],
  };
}

export class ProgressionSystem {
  private data: MetaSave;

  constructor(private storage: Storage) {
    this.data = this.load();
  }

  load(): MetaSave {
    const raw = this.storage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    try {
      return JSON.parse(raw) as MetaSave;
    } catch {
      return defaultSave();
    }
  }

  save(): void {
    this.storage.setItem(SAVE_KEY, JSON.stringify(this.data));
  }

  getSave(): MetaSave {
    return this.data;
  }

  addRecipe(recipeId: string): void {
    if (!this.data.knownRecipes.includes(recipeId)) {
      this.data.knownRecipes.push(recipeId);
    }
  }

  incrementMilestone(milestoneId: string): void {
    this.data.milestones[milestoneId] = (this.data.milestones[milestoneId] ?? 0) + 1;
  }

  unlockNPCType(npcTypeId: string): void {
    if (!this.data.unlockedNPCTypes.includes(npcTypeId)) {
      this.data.unlockedNPCTypes.push(npcTypeId);
    }
  }

  recordRunEnd(): void {
    this.data.totalRuns += 1;
    this.save();
  }

  /** Returns all recipe IDs the player should know at the start of a run. */
  getStartingRecipeIds(): string[] {
    const knownDiscovery = RECIPE_DEFINITIONS
      .filter(r => r.discovery === 'known')
      .map(r => r.id);

    const metaPersisted = this.data.knownRecipes;

    const combined = new Set([...knownDiscovery, ...metaPersisted]);
    return Array.from(combined);
  }

  getMilestoneCount(milestoneId: string): number {
    return this.data.milestones[milestoneId] ?? 0;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm run test:run -- tests/systems/ProgressionSystem.test.ts
```

Expected: All 7 ProgressionSystem tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/systems/ProgressionSystem.ts tests/systems/ProgressionSystem.test.ts
git commit -m "feat: add meta-progression system with localStorage persistence"
```

---

## Task 11: Data Validation Tests

**Files:**
- Create: `tests/config/data-validation.test.ts`

- [ ] **Step 1: Write data validation tests**

These tests ensure all config data is internally consistent (recipes reference existing items, biomes reference existing mobs, etc.).

Create `tests/config/data-validation.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { ITEM_DEFINITIONS, getItemDef } from '@/config/items';
import { RECIPE_DEFINITIONS } from '@/config/recipes';
import { BIOME_DEFINITIONS } from '@/config/biomes';
import { MOB_DEFINITIONS } from '@/config/mobs';
import { NPC_DEFINITIONS } from '@/config/npcs';

describe('Data validation', () => {
  it('all item IDs are unique', () => {
    const ids = ITEM_DEFINITIONS.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all recipe IDs are unique', () => {
    const ids = RECIPE_DEFINITIONS.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all recipe ingredients reference existing items', () => {
    for (const recipe of RECIPE_DEFINITIONS) {
      for (const ingredient of recipe.ingredients) {
        expect(
          getItemDef(ingredient.item),
          `Recipe "${recipe.id}" ingredient "${ingredient.item}" not found in items`
        ).toBeDefined();
      }
    }
  });

  it('all recipe outputs reference existing items', () => {
    for (const recipe of RECIPE_DEFINITIONS) {
      expect(
        getItemDef(recipe.output.item),
        `Recipe "${recipe.id}" output "${recipe.output.item}" not found in items`
      ).toBeDefined();
    }
  });

  it('all biome resource items exist', () => {
    for (const biome of BIOME_DEFINITIONS) {
      for (const resource of biome.resources) {
        expect(
          getItemDef(resource.itemId),
          `Biome "${biome.id}" resource "${resource.itemId}" not found in items`
        ).toBeDefined();
      }
    }
  });

  it('all biome mob references exist', () => {
    const mobIds = new Set(MOB_DEFINITIONS.map(m => m.id));
    for (const biome of BIOME_DEFINITIONS) {
      for (const mobId of biome.mobs) {
        expect(
          mobIds.has(mobId),
          `Biome "${biome.id}" mob "${mobId}" not found in mob definitions`
        ).toBe(true);
      }
    }
  });

  it('all mob drop items exist', () => {
    for (const mob of MOB_DEFINITIONS) {
      for (const drop of mob.drops) {
        expect(
          getItemDef(drop.itemId),
          `Mob "${mob.id}" drop "${drop.itemId}" not found in items`
        ).toBeDefined();
      }
    }
  });

  it('all NPC hire costs reference existing items', () => {
    for (const npc of NPC_DEFINITIONS) {
      for (const cost of npc.hireCost) {
        expect(
          getItemDef(cost.item),
          `NPC "${npc.id}" hire cost "${cost.item}" not found in items`
        ).toBeDefined();
      }
    }
  });

  it('all NPC gather types reference existing items', () => {
    for (const npc of NPC_DEFINITIONS) {
      expect(
        getItemDef(npc.gatherType),
        `NPC "${npc.id}" gatherType "${npc.gatherType}" not found in items`
      ).toBeDefined();
    }
  });
});
```

- [ ] **Step 2: Run the data validation tests**

```bash
npm run test:run -- tests/config/data-validation.test.ts
```

Expected: All tests PASS. If any fail, fix the config data in the relevant `src/config/*.ts` file.

- [ ] **Step 3: Commit**

```bash
git add tests/config/data-validation.test.ts
git commit -m "test: add data validation tests for config cross-references"
```

---

## Task 12: Phaser Scenes (Boot, MainMenu, GameOver, MetaHub)

**Files:**
- Modify: `src/scenes/BootScene.ts`
- Create: `src/scenes/MainMenuScene.ts`, `src/scenes/GameOverScene.ts`, `src/scenes/MetaHubScene.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Update BootScene to transition to MainMenu**

Replace `src/scenes/BootScene.ts`:

```typescript
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Boot' });
  }

  preload(): void {
    // Create a loading bar
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 15, 320, 30);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x3b82f6, 1);
      progressBar.fillRect(width / 2 - 150, height / 2 - 10, 300 * value, 20);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
    });

    // Generate placeholder textures
    this.createPlaceholderTextures();
  }

  create(): void {
    this.scene.start('MainMenu');
  }

  private createPlaceholderTextures(): void {
    // Player placeholder
    const playerGfx = this.make.graphics({ x: 0, y: 0 }, false);
    playerGfx.fillStyle(0x3b82f6);
    playerGfx.fillRect(0, 0, 24, 32);
    playerGfx.generateTexture('player', 24, 32);
    playerGfx.destroy();

    // Generic mob placeholder
    const mobGfx = this.make.graphics({ x: 0, y: 0 }, false);
    mobGfx.fillStyle(0xff0000);
    mobGfx.fillRect(0, 0, 20, 20);
    mobGfx.generateTexture('mob', 20, 20);
    mobGfx.destroy();

    // Resource node placeholder
    const resGfx = this.make.graphics({ x: 0, y: 0 }, false);
    resGfx.fillStyle(0xffd700);
    resGfx.fillRect(0, 0, 16, 16);
    resGfx.generateTexture('resource_node', 16, 16);
    resGfx.destroy();

    // Tile placeholder (isometric diamond)
    const tileGfx = this.make.graphics({ x: 0, y: 0 }, false);
    tileGfx.fillStyle(0x228b22);
    tileGfx.beginPath();
    tileGfx.moveTo(24, 0);
    tileGfx.lineTo(48, 12);
    tileGfx.lineTo(24, 24);
    tileGfx.lineTo(0, 12);
    tileGfx.closePath();
    tileGfx.fillPath();
    tileGfx.generateTexture('tile', 48, 24);
    tileGfx.destroy();
  }
}
```

- [ ] **Step 2: Create MainMenuScene**

Create `src/scenes/MainMenuScene.ts`:

```typescript
import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenu' });
  }

  create(): void {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    this.add.text(cx, cy - 80, 'SURVIVOR', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 30, 'Isometric Roguelike Survival Crafter', {
      fontSize: '14px',
      color: '#94a3b8',
    }).setOrigin(0.5);

    const startButton = this.add.text(cx, cy + 40, '[ New Run ]', {
      fontSize: '24px',
      color: '#3b82f6',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    startButton.on('pointerover', () => startButton.setColor('#60a5fa'));
    startButton.on('pointerout', () => startButton.setColor('#3b82f6'));
    startButton.on('pointerdown', () => {
      const seed = Date.now().toString(36);
      this.scene.start('Game', { seed });
    });

    const metaButton = this.add.text(cx, cy + 90, '[ Progression ]', {
      fontSize: '18px',
      color: '#94a3b8',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    metaButton.on('pointerover', () => metaButton.setColor('#cbd5e1'));
    metaButton.on('pointerout', () => metaButton.setColor('#94a3b8'));
    metaButton.on('pointerdown', () => {
      this.scene.start('MetaHub');
    });
  }
}
```

- [ ] **Step 3: Create GameOverScene**

Create `src/scenes/GameOverScene.ts`:

```typescript
import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOver' });
  }

  create(data: { survived: number; recipesFound: number; cause: string }): void {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    this.add.text(cx, cy - 80, 'YOU DIED', {
      fontSize: '48px',
      color: '#ef4444',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(cx, cy - 20, `Cause: ${data.cause ?? 'Unknown'}`, {
      fontSize: '16px',
      color: '#94a3b8',
    }).setOrigin(0.5);

    this.add.text(cx, cy + 20, `Survived: ${Math.floor((data.survived ?? 0) / 1000)}s | Recipes: ${data.recipesFound ?? 0}`, {
      fontSize: '16px',
      color: '#cbd5e1',
    }).setOrigin(0.5);

    const retryButton = this.add.text(cx, cy + 80, '[ Try Again ]', {
      fontSize: '24px',
      color: '#3b82f6',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    retryButton.on('pointerdown', () => {
      const seed = Date.now().toString(36);
      this.scene.start('Game', { seed });
    });

    const menuButton = this.add.text(cx, cy + 120, '[ Main Menu ]', {
      fontSize: '18px',
      color: '#94a3b8',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    menuButton.on('pointerdown', () => {
      this.scene.start('MainMenu');
    });
  }
}
```

- [ ] **Step 4: Create MetaHubScene**

Create `src/scenes/MetaHubScene.ts`:

```typescript
import Phaser from 'phaser';
import { ProgressionSystem } from '@/systems/ProgressionSystem';

export class MetaHubScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MetaHub' });
  }

  create(): void {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;
    const prog = new ProgressionSystem(localStorage);
    const save = prog.getSave();

    this.add.text(cx, 40, 'PROGRESSION', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    let y = 100;

    this.add.text(cx, y, `Total Runs: ${save.totalRuns}`, {
      fontSize: '18px',
      color: '#cbd5e1',
    }).setOrigin(0.5);
    y += 40;

    this.add.text(cx, y, `Recipes Discovered: ${save.knownRecipes.length}`, {
      fontSize: '18px',
      color: '#fde68a',
    }).setOrigin(0.5);
    y += 30;

    this.add.text(cx, y, `NPC Types Unlocked: ${save.unlockedNPCTypes.length}`, {
      fontSize: '18px',
      color: '#6ee7b7',
    }).setOrigin(0.5);
    y += 30;

    const milestoneCount = Object.keys(save.milestones).length;
    this.add.text(cx, y, `Milestones: ${milestoneCount}`, {
      fontSize: '18px',
      color: '#c4b5fd',
    }).setOrigin(0.5);
    y += 60;

    const backButton = this.add.text(cx, y, '[ Back to Menu ]', {
      fontSize: '20px',
      color: '#3b82f6',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    backButton.on('pointerdown', () => {
      this.scene.start('MainMenu');
    });
  }
}
```

- [ ] **Step 5: Update main.ts to register all scenes**

Replace `src/main.ts`:

```typescript
import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/game-config';
import { BootScene } from '@/scenes/BootScene';
import { MainMenuScene } from '@/scenes/MainMenuScene';
import { GameScene } from '@/scenes/GameScene';
import { GameOverScene } from '@/scenes/GameOverScene';
import { MetaHubScene } from '@/scenes/MetaHubScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MainMenuScene, GameScene, GameOverScene, MetaHubScene],
};

new Phaser.Game(config);
```

- [ ] **Step 6: Create a stub GameScene**

Create `src/scenes/GameScene.ts` (stub — will be expanded in Task 13):

```typescript
import Phaser from 'phaser';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'Game' });
  }

  create(data: { seed: string }): void {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    this.add.text(cx, cy, `Game Scene - Seed: ${data.seed}`, {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(cx, cy + 30, '(Press ESC to die)', {
      fontSize: '14px',
      color: '#94a3b8',
    }).setOrigin(0.5);

    this.input.keyboard!.on('keydown-ESC', () => {
      this.scene.start('GameOver', {
        survived: 0,
        recipesFound: 0,
        cause: 'Debug exit',
      });
    });
  }
}
```

- [ ] **Step 7: Verify in browser**

```bash
npm run dev
```

Expected: Browser shows title screen with "SURVIVOR" title, "New Run" button starts game scene, "Progression" shows meta-hub, ESC from game scene goes to game over, all navigation works.

- [ ] **Step 8: Commit**

```bash
git add src/scenes/ src/main.ts
git commit -m "feat: add all Phaser scenes with navigation flow"
```

---

## Task 13: GameScene — World Rendering & Player Movement

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Create: `src/entities/Player.ts`, `src/systems/DepthSortSystem.ts`

- [ ] **Step 1: Create Player entity**

Create `src/entities/Player.ts`:

```typescript
import Phaser from 'phaser';
import { PlayerState, InventorySlot } from '@/types/entities';

export function createPlayerState(): PlayerState {
  return {
    id: 'player',
    stats: {
      health: 100,
      maxHealth: 100,
      attack: 5,
      defense: 0,
      speed: 120,
      attackSpeed: 1,
      hunger: 100,
      maxHunger: 100,
    },
    position: { x: 0, y: 0 },
    equipment: {
      weapon: null,
      armor: null,
      ability1: null,
      ability2: null,
    },
    inventory: [],
    autoAttackTarget: null,
    abilityCooldowns: {},
  };
}

export function createPlayerSprite(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Sprite {
  const sprite = scene.add.sprite(x, y, 'player');
  sprite.setOrigin(0.5, 1); // anchor at feet for depth sorting
  return sprite;
}
```

- [ ] **Step 2: Create DepthSortSystem**

Create `src/systems/DepthSortSystem.ts`:

```typescript
import Phaser from 'phaser';

/** Sort all sprites in the display list by their Y position for isometric depth. */
export function depthSort(scene: Phaser.Scene): void {
  const children = scene.children.getAll() as Phaser.GameObjects.GameObject[];
  for (const child of children) {
    if ('y' in child && 'setDepth' in child) {
      const gameObj = child as Phaser.GameObjects.Sprite;
      gameObj.setDepth(gameObj.y);
    }
  }
}
```

- [ ] **Step 3: Implement the full GameScene**

Replace `src/scenes/GameScene.ts`:

```typescript
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

  private tileSprites = new Map<string, Phaser.GameObjects.Sprite[]>();
  private currentChunkX = 0;
  private currentChunkY = 0;

  private runStartTime = 0;
  private knownRecipes = new Set<string>();

  constructor() {
    super({ key: 'Game' });
  }

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

    // Load starting recipes
    const startingIds = this.progression.getStartingRecipeIds();
    this.knownRecipes = new Set(startingIds);

    // Render initial chunks
    this.updateChunks();

    // Input — click to move
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const worldX = pointer.worldX;
      const worldY = pointer.worldY;
      this.moveTarget = { x: worldX, y: worldY };
    });

    // ESC — pause/debug die
    this.input.keyboard!.on('keydown-ESC', () => {
      this.endRun('Debug exit');
    });

    this.runStartTime = this.time.now;
    this.eventBus.emit('run-started', { seed: data.seed });
  }

  update(_time: number, delta: number): void {
    this.updatePlayerMovement(delta);
    this.updateChunkTracking();
    depthSort(this);
  }

  private updatePlayerMovement(delta: number): void {
    if (!this.moveTarget) return;

    const dx = this.moveTarget.x - this.playerSprite.x;
    const dy = this.moveTarget.y - this.playerSprite.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 3) {
      this.moveTarget = null;
      return;
    }

    const speed = this.player.stats.speed * (delta / 1000);
    const nx = dx / dist;
    const ny = dy / dist;

    this.playerSprite.x += nx * speed;
    this.playerSprite.y += ny * speed;
    this.player.position.x = this.playerSprite.x;
    this.player.position.y = this.playerSprite.y;
  }

  private updateChunkTracking(): void {
    // Determine which chunk the player is in based on screen position
    // For simplicity, map screen position back to rough chunk coords
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
    // Determine which chunks should be visible
    const neededKeys = new Set<string>();
    for (let dy = -RENDER_RADIUS; dy <= RENDER_RADIUS; dy++) {
      for (let dx = -RENDER_RADIUS; dx <= RENDER_RADIUS; dx++) {
        neededKeys.add(chunkKey(this.currentChunkX + dx, this.currentChunkY + dy));
      }
    }

    // Remove chunks no longer needed
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
        tileSprite.setDepth(-10000 + sy); // tiles behind entities
        sprites.push(tileSprite);

        // Resource node
        if (tile.resourceNodeId) {
          const resSprite = this.add.sprite(sx, sy - 4, 'resource_node');
          resSprite.setDepth(sy);
          sprites.push(resSprite);
        }
      }
    }

    this.tileSprites.set(chunkKey(cx, cy), sprites);
  }

  private endRun(cause: string): void {
    const survived = this.time.now - this.runStartTime;
    this.progression.recordRunEnd();
    this.progression.save();

    this.scene.start('GameOver', {
      survived,
      recipesFound: this.knownRecipes.size,
      cause,
    });
  }
}
```

- [ ] **Step 4: Verify in browser**

```bash
npm run dev
```

Expected: Starting a new run shows an isometric tile grid with different colored biomes. Click to move the player (blue rectangle). Camera follows player. Tiles load/unload as player moves between chunks. ESC ends the run.

- [ ] **Step 5: Commit**

```bash
git add src/scenes/GameScene.ts src/entities/Player.ts src/systems/DepthSortSystem.ts
git commit -m "feat: add world rendering, player movement, and chunk streaming"
```

---

## Task 14: HUD & Basic UI

**Files:**
- Create: `src/ui/HUD.ts`, `src/ui/AbilityBar.ts`, `src/ui/UIManager.ts`

- [ ] **Step 1: Create HUD**

Create `src/ui/HUD.ts`:

```typescript
import Phaser from 'phaser';
import { PlayerState } from '@/types/entities';

export class HUD {
  private healthBar: Phaser.GameObjects.Graphics;
  private hungerBar: Phaser.GameObjects.Graphics;
  private healthText: Phaser.GameObjects.Text;
  private biomeText: Phaser.GameObjects.Text;
  private container: Phaser.GameObjects.Container;

  constructor(private scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(10000);

    // Health bar background
    this.healthBar = scene.add.graphics();
    this.container.add(this.healthBar);

    // Hunger bar
    this.hungerBar = scene.add.graphics();
    this.container.add(this.hungerBar);

    // Health text
    this.healthText = scene.add.text(120, 8, '100/100', {
      fontSize: '12px',
      color: '#fca5a5',
    });
    this.container.add(this.healthText);

    // Biome indicator
    this.biomeText = scene.add.text(
      scene.cameras.main.width / 2,
      8,
      'Forest',
      { fontSize: '12px', color: '#86efac' }
    ).setOrigin(0.5, 0);
    this.container.add(this.biomeText);
  }

  update(player: PlayerState, currentBiome: string): void {
    const healthPct = player.stats.health / player.stats.maxHealth;
    const hungerPct = player.stats.hunger / player.stats.maxHunger;

    this.healthBar.clear();
    // Background
    this.healthBar.fillStyle(0x1e293b, 0.8);
    this.healthBar.fillRect(10, 10, 104, 14);
    // Health fill
    this.healthBar.fillStyle(0xef4444);
    this.healthBar.fillRect(12, 12, 100 * healthPct, 10);

    this.hungerBar.clear();
    this.hungerBar.fillStyle(0x1e293b, 0.8);
    this.hungerBar.fillRect(10, 28, 84, 10);
    this.hungerBar.fillStyle(0xf59e0b);
    this.hungerBar.fillRect(12, 30, 80 * hungerPct, 6);

    this.healthText.setText(`${Math.ceil(player.stats.health)}/${player.stats.maxHealth}`);
    this.biomeText.setText(currentBiome);
  }
}
```

- [ ] **Step 2: Create AbilityBar**

Create `src/ui/AbilityBar.ts`:

```typescript
import Phaser from 'phaser';

export interface AbilitySlot {
  id: string;
  label: string;
  cooldown: number;
  maxCooldown: number;
  onActivate: () => void;
}

export class AbilityBar {
  private container: Phaser.GameObjects.Container;
  private slots: { bg: Phaser.GameObjects.Graphics; text: Phaser.GameObjects.Text }[] = [];

  constructor(private scene: Phaser.Scene, abilities: AbilitySlot[]) {
    const cx = scene.cameras.main.width / 2;
    const bottom = scene.cameras.main.height - 70;

    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(10000);

    const slotSize = 50;
    const gap = 8;
    const totalWidth = abilities.length * slotSize + (abilities.length - 1) * gap;
    let x = cx - totalWidth / 2;

    for (const ability of abilities) {
      const bg = scene.add.graphics();
      bg.fillStyle(0x1e293b, 0.9);
      bg.fillRect(x, bottom, slotSize, slotSize);
      bg.lineStyle(2, 0x3b82f6);
      bg.strokeRect(x, bottom, slotSize, slotSize);
      this.container.add(bg);

      const text = scene.add.text(x + slotSize / 2, bottom + slotSize / 2, ability.label, {
        fontSize: '20px',
        color: '#ffffff',
      }).setOrigin(0.5);
      this.container.add(text);

      // Make interactive
      const hitZone = scene.add.zone(x + slotSize / 2, bottom + slotSize / 2, slotSize, slotSize)
        .setScrollFactor(0)
        .setInteractive({ useHandCursor: true });
      hitZone.on('pointerdown', ability.onActivate);
      hitZone.setDepth(10001);

      this.slots.push({ bg, text });
      x += slotSize + gap;
    }
  }

  update(abilities: AbilitySlot[]): void {
    for (let i = 0; i < abilities.length && i < this.slots.length; i++) {
      const ability = abilities[i];
      const slot = this.slots[i];
      if (ability.cooldown > 0) {
        slot.text.setAlpha(0.3);
      } else {
        slot.text.setAlpha(1);
      }
    }
  }
}
```

- [ ] **Step 3: Create UIManager**

Create `src/ui/UIManager.ts`:

```typescript
import Phaser from 'phaser';

export class UIManager {
  private panels = new Map<string, Phaser.GameObjects.Container>();
  private activePanel: string | null = null;

  constructor(private scene: Phaser.Scene) {}

  registerPanel(name: string, container: Phaser.GameObjects.Container): void {
    container.setVisible(false);
    container.setScrollFactor(0);
    container.setDepth(20000);
    this.panels.set(name, container);
  }

  togglePanel(name: string): void {
    if (this.activePanel === name) {
      this.closePanel();
      return;
    }
    this.closePanel();
    const panel = this.panels.get(name);
    if (panel) {
      panel.setVisible(true);
      this.activePanel = name;
    }
  }

  closePanel(): void {
    if (this.activePanel) {
      const panel = this.panels.get(this.activePanel);
      if (panel) panel.setVisible(false);
      this.activePanel = null;
    }
  }

  isOpen(): boolean {
    return this.activePanel !== null;
  }
}
```

- [ ] **Step 4: Integrate HUD into GameScene**

Add to `GameScene.ts` — import and initialize the HUD. In `create()`, after systems init, add:

```typescript
// At top of file, add imports:
import { HUD } from '@/ui/HUD';
import { AbilityBar, AbilitySlot } from '@/ui/AbilityBar';
import { UIManager } from '@/ui/UIManager';

// New class properties:
private hud!: HUD;
private abilityBar!: AbilityBar;
private uiManager!: UIManager;
private currentBiomeName = 'Forest';

// In create(), after camera follow:
this.hud = new HUD(this);
this.uiManager = new UIManager(this);

const abilities: AbilitySlot[] = [
  { id: 'dash', label: '💨', cooldown: 0, maxCooldown: 3000, onActivate: () => this.useDash() },
  { id: 'power_strike', label: '⚔️', cooldown: 0, maxCooldown: 5000, onActivate: () => {} },
  { id: 'consumable', label: '🧪', cooldown: 0, maxCooldown: 1000, onActivate: () => {} },
];
this.abilityBar = new AbilityBar(this, abilities);

// Listen for biome changes:
this.eventBus.on('chunk-entered', (data) => {
  const biome = BIOME_DEFINITIONS.find(b => b.id === data.biomeId);
  this.currentBiomeName = biome?.name ?? 'Unknown';
});

// In update():
this.hud.update(this.player, this.currentBiomeName);
```

Add a simple dash method to GameScene:

```typescript
private useDash(): void {
  if (!this.moveTarget) return;
  const dx = this.moveTarget.x - this.playerSprite.x;
  const dy = this.moveTarget.y - this.playerSprite.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return;
  this.playerSprite.x += (dx / dist) * 80;
  this.playerSprite.y += (dy / dist) * 80;
}
```

- [ ] **Step 5: Verify in browser**

```bash
npm run dev
```

Expected: Health bar, hunger bar, biome indicator visible on HUD. Ability buttons at bottom center. Clicking dash button jumps player forward. Biome name updates as player moves between biomes.

- [ ] **Step 6: Commit**

```bash
git add src/ui/ src/scenes/GameScene.ts
git commit -m "feat: add HUD, ability bar, and UI management system"
```

---

## Task 15: Mob Spawning & Entity Interaction

**Files:**
- Create: `src/entities/Mob.ts`, `src/entities/ResourceNode.ts`
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Create Mob entity**

Create `src/entities/Mob.ts`:

```typescript
import Phaser from 'phaser';
import { MobState, MobDefinition } from '@/types/entities';
import { MOB_DEFINITIONS } from '@/config/mobs';

export function createMobState(typeId: string, x: number, y: number): MobState | null {
  const def = MOB_DEFINITIONS.find(m => m.id === typeId);
  if (!def) return null;

  return {
    id: `mob-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    typeId,
    stats: { ...def.stats },
    position: { x, y },
    aiState: 'idle',
    homePosition: { x, y },
    target: null,
    leashDistance: def.leashDistance,
    alertRange: def.alertRange,
    attackRange: def.attackRange,
    lastAttackTime: 0,
  };
}

export function createMobSprite(
  scene: Phaser.Scene,
  x: number,
  y: number,
  def: MobDefinition
): Phaser.GameObjects.Sprite {
  const sprite = scene.add.sprite(x, y, 'mob');
  sprite.setTint(def.color);
  sprite.setOrigin(0.5, 1);
  return sprite;
}
```

- [ ] **Step 2: Create ResourceNode entity**

Create `src/entities/ResourceNode.ts`:

```typescript
import Phaser from 'phaser';
import { getItemDef } from '@/config/items';

export interface ResourceNodeState {
  id: string;
  itemId: string;
  position: { x: number; y: number };
  remaining: number;
}

export function createResourceNode(itemId: string, x: number, y: number): ResourceNodeState {
  return {
    id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    itemId,
    position: { x, y },
    remaining: 3 + Math.floor(Math.random() * 5),
  };
}

export function createResourceSprite(
  scene: Phaser.Scene,
  x: number,
  y: number,
  itemId: string
): Phaser.GameObjects.Sprite {
  const def = getItemDef(itemId);
  const sprite = scene.add.sprite(x, y, 'resource_node');
  sprite.setTint(def?.color ?? 0xffd700);
  sprite.setOrigin(0.5, 1);
  return sprite;
}
```

- [ ] **Step 3: Add mob spawning and interaction to GameScene**

Add to `GameScene.ts`:

```typescript
// Additional imports at top:
import { MobState } from '@/types/entities';
import { MobAI } from '@/systems/MobAI';
import { MOB_DEFINITIONS } from '@/config/mobs';
import { createMobState, createMobSprite } from '@/entities/Mob';
import { ResourceNodeState, createResourceNode, createResourceSprite } from '@/entities/ResourceNode';
import { distance } from '@/utils/math';

// New class properties:
private mobs: { state: MobState; sprite: Phaser.GameObjects.Sprite }[] = [];
private resourceNodes: { state: ResourceNodeState; sprite: Phaser.GameObjects.Sprite }[] = [];
private spawnedChunks = new Set<string>();

// New method — call in updateChunks() after rendering a new chunk:
private spawnEntitiesForChunk(cx: number, cy: number): void {
  const key = chunkKey(cx, cy);
  if (this.spawnedChunks.has(key)) return;
  this.spawnedChunks.add(key);

  const chunk = this.worldSystem.getChunk(cx, cy);
  const centerTile = chunk.tiles[Math.floor(CHUNK_SIZE / 2)][Math.floor(CHUNK_SIZE / 2)];
  const biome = BIOME_DEFINITIONS.find(b => b.id === centerTile.biomeId);
  if (!biome) return;

  // Spawn mobs
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

// New method for mob AI update — call in update():
private updateMobs(delta: number): void {
  const playerPos = { x: this.playerSprite.x, y: this.playerSprite.y };

  for (const mob of this.mobs) {
    if (mob.state.stats.health <= 0) continue;

    const def = MOB_DEFINITIONS.find(m => m.id === mob.state.typeId);
    if (!def) continue;

    // Update AI
    mob.state = MobAI.update(mob.state, playerPos, def.category);

    // Movement
    const dir = MobAI.getMovementDirection(mob.state, playerPos);
    const speed = mob.state.stats.speed * (delta / 1000);
    mob.sprite.x += dir.dx * speed;
    mob.sprite.y += dir.dy * speed;
    mob.state.position.x = mob.sprite.x;
    mob.state.position.y = mob.sprite.y;

    // Auto-attack player
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
    const distToPlayer = distance(mob.sprite.x, mob.sprite.y, this.playerSprite.x, this.playerSprite.y);
    if (distToPlayer < 40 && mob.state.stats.health > 0) {
      const now = this.time.now;
      const lastPlayerAttack = (this as any)._lastPlayerAttack ?? 0;
      if (this.combatSystem.canAttack(this.player.stats.attackSpeed, lastPlayerAttack, now)) {
        this.combatSystem.applyDamage('player', mob.state.id, this.player.stats, mob.state.stats);
        (this as any)._lastPlayerAttack = now;

        if (mob.state.stats.health <= 0) {
          mob.sprite.setAlpha(0.3);
          this.eventBus.emit('mob-killed', { mobId: mob.state.id, mobTypeId: mob.state.typeId });
          // Drop items
          for (const drop of def.drops) {
            if (Math.random() <= drop.chance) {
              this.itemSystem.addItem(this.player.inventory, drop.itemId, drop.count);
            }
          }
        }
      }
    }
  }
}
```

In the `update()` method, add `this.updateMobs(delta);` call.

In `updateChunks()`, after `this.renderChunk(cx, cy)`, add `this.spawnEntitiesForChunk(cx, cy)`.

- [ ] **Step 4: Add resource harvesting to GameScene**

Add to GameScene — in the click handler, check for nearby resource nodes:

```typescript
// In the pointerdown handler, before setting moveTarget:
// Check if clicking near a resource node
for (const res of this.resourceNodes) {
  const d = distance(pointer.worldX, pointer.worldY, res.sprite.x, res.sprite.y);
  if (d < 20 && res.state.remaining > 0) {
    res.state.remaining--;
    this.itemSystem.addItem(this.player.inventory, res.state.itemId, 1);
    if (res.state.remaining <= 0) {
      res.sprite.setAlpha(0.2);
    }
    return; // Don't move, harvest instead
  }
}
```

- [ ] **Step 5: Verify in browser**

```bash
npm run dev
```

Expected: Mobs appear in the world with different colors per type. Aggressive mobs chase the player. Auto-attack happens when player is near a mob. Player can die and see game over. Resource nodes can be harvested by clicking.

- [ ] **Step 6: Commit**

```bash
git add src/entities/ src/scenes/GameScene.ts
git commit -m "feat: add mob spawning, AI movement, combat, and resource harvesting"
```

---

## Task 16: Run Full Test Suite & Final Integration Verification

**Files:** None new — verification only.

- [ ] **Step 1: Run the complete test suite**

```bash
npm run test:run
```

Expected: All tests pass (EventBus, NoiseGenerator, WorldSystem, CombatSystem, MobAI, ItemSystem, CraftingSystem, NPCSystem, ProgressionSystem, math, iso, data-validation).

- [ ] **Step 2: Fix any failing tests**

If any tests fail, fix the issues. Common causes:
- Import path mismatches
- Config data cross-reference errors (caught by data validation tests)
- Type mismatches between interfaces and implementations

- [ ] **Step 3: Verify full game loop in browser**

```bash
npm run dev
```

Test the full loop:
1. Start screen → click "New Run"
2. World renders with colored biome tiles
3. Click to move player
4. Walk to different biomes — HUD biome name updates
5. Mobs spawn and chase (aggressive) or flee (passive)
6. Auto-attack kills mobs, items drop
7. Die to a mob → GameOver screen
8. "Try Again" → new run with new seed
9. "Progression" from main menu shows run stats

- [ ] **Step 4: Verify build succeeds**

```bash
npm run build
```

Expected: Vite build completes with no TypeScript errors. Output in `dist/`.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve integration issues from full test run"
```

(Skip this step if no fixes were needed.)

---

## Follow-Up Tasks (not in this plan)

These are part of the v1 spec but can be added incrementally after the core game loop is working:

- **Inventory Panel** (`src/ui/InventoryPanel.ts`) — full grid overlay, equip/use items
- **Crafting Panel** (`src/ui/CraftingPanel.ts`) — recipe list, experimentation tab
- **NPC Panel** (`src/ui/NPCPanel.ts`) — hire, assign, collect UI
- **Map Panel** (`src/ui/MapPanel.ts`) — fog-of-war minimap
- **Quick Inventory Bar** (`src/ui/QuickInventory.ts`) — bottom hotbar
- **Hunger system** — hunger depletion over time, debuffs at low hunger
- **Recipe discovery events** — material-trigger auto-unlock, scroll drops from mobs
- **Boss encounter** — The Corrupted One in Corrupted Lands
- **Workstation placement** — campfire, workbench, forge as buildable structures

Each of these is a self-contained addition once the core loop from this plan is complete.
