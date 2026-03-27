# Survivor — Isometric Roguelike Survival Crafter

## Overview

An isometric roguelike survival-crafter with mid-res pixel art aesthetics, built for browser with mobile port potential. Each run drops the player into a procedurally generated world where they gather resources, discover crafting recipes, hire NPC workers, and fight increasingly dangerous mobs across 5 biomes. Death resets the run, but recipe knowledge and NPC unlocks persist via meta-progression — making each attempt richer. The end goal: reach the Corrupted Lands and defeat the boss.

**Target session length:** 30-60 minutes per run initially, expanding to 2+ hours as meta-progression unlocks more content.

## Tech Stack

| Component | Choice |
|-----------|--------|
| Engine | Phaser 3 |
| Language | TypeScript |
| Bundler | Vite |
| Mobile wrapper | Capacitor (iOS/Android) |
| Art style | Mid-res pixel art (~48×48 isometric tiles) |
| World generation | Simplex noise, chunk-based, deterministic from seed |
| Game data | TypeScript config files (items, recipes, biomes, mobs) |
| Persistence | localStorage (browser) / Capacitor Preferences (mobile) |

## Architecture

### System Layout

Six main systems, loosely coupled via an event bus:

1. **World System** — procedural generation, biome management, chunk loading/unloading
2. **Entity System** — player, mobs, NPCs; movement, combat, AI state machines
3. **Item System** — inventory management, crafting engine, resource node interaction
4. **UI System** — HUD, inventory/crafting/map panels, dialogs
5. **Progression System** — meta-unlocks, recipe discovery tracking, run statistics
6. **NPC System** — hiring, task assignment, passive resource generation

### Phaser Scenes

- **Boot** — load assets, show loading bar
- **MainMenu** — start new run, view meta-progression
- **Game** — the main gameplay scene
- **GameOver** — death screen, show what was unlocked this run
- **MetaHub** — between-run screen to review unlocks, recipe book, NPC roster

### Design Patterns

- **ECS-lite** — entities are typed TypeScript objects with component properties. No formal ECS library. Systems are functions that operate on entity arrays each frame.
- **Data-driven** — all game content defined in typed config files. Adding content means adding data entries, not writing new code.
- **Event bus** — decoupled communication between systems (e.g., `player-died`, `item-crafted`, `recipe-discovered`).
- **Chunk-based world** — only nearby chunks are loaded and rendered for performance.

### Game Loop

Each frame: Input → Update Entities → Combat Resolution → World Update → NPC Tick → Render

## World Generation & Biomes

### Generation Pipeline

1. **Seed** — random per run, deterministic from that point
2. **Simplex noise** — two layers: elevation and moisture (plus heat for volcanic, corruption for endgame)
3. **Biome assignment** — each tile mapped to a biome based on noise values
4. **Feature placement** — resource nodes, structures, and chests placed per biome rules
5. **Mob spawning** — biome-specific mob tables, density increases with distance from spawn

### Chunk System

- **Chunk size:** 16×16 tiles (tunable — flagged for playtesting adjustment)
- **Active radius:** 3×3 chunks around player (loaded and simulated)
- **Render radius:** 5×5 chunks (rendered but entities not simulated)
- **Generated on demand** — chunks created as player explores, cached in memory
- **Deterministic** — same seed + chunk coordinate = same terrain, no need to persist terrain data

### World Scale

A configurable `worldScale` parameter controls noise frequency. Higher frequency = biomes are closer together. During development, crank this up so all 5 biomes are reachable quickly. For release, dial it back for exploration depth. Debug build includes a biome-hop teleport key.

### Biomes (v1 — 5 biomes)

Player always spawns in Forest. Difficulty increases with distance from spawn.

#### Forest (Starting Biome)
- **Difficulty:** ★☆☆☆☆
- **Resources:** Wood, berries, herbs, stone
- **Mobs:** Passive wildlife, weak slimes
- **Purpose:** Survive first few minutes, establish base, learn systems

#### Rocky Highlands
- **Difficulty:** ★★☆☆☆
- **Resources:** Iron, copper, coal, crystals
- **Mobs:** Rock golems, cave bats
- **Purpose:** Access metal-tier crafting

#### Swamp
- **Difficulty:** ★★★☆☆
- **Resources:** Rare mushrooms, swamp reeds, slime gel
- **Mobs:** Poison frogs, bog lurkers, wisps
- **Purpose:** Alchemy ingredients, rare recipes

#### Volcanic Wastes
- **Difficulty:** ★★★★☆
- **Resources:** Obsidian, fire crystals, rare ores
- **Mobs:** Fire elementals, lava crawlers
- **Purpose:** Endgame metals, fire-resistant gear

#### Corrupted Lands (Meta-unlocked)
- **Difficulty:** ★★★★★
- **Resources:** Shadow essence, void crystals, corrupted wood
- **Mobs:** Shadow beasts, corrupted NPCs, boss spawn
- **Purpose:** Endgame content, final boss encounter

### Biome Assignment

| Elevation | Moisture | Heat | Special | Biome |
|-----------|----------|------|---------|-------|
| Mid | Mid | — | — | Forest |
| High | Low | — | — | Rocky Highlands |
| Low | High | — | — | Swamp |
| High | Low | High | — | Volcanic Wastes |
| — | — | — | Corruption layer | Corrupted Lands (meta-unlocked only) |

## Crafting & Progression

### Crafting Tiers

#### Tier 1 — Basic (Known from start)
- **Recipes:** Wooden tools, campfire, basic shelter, bandages
- **Materials:** Wood, stone, herbs, berries
- **Purpose:** Survive the first few minutes, establish a base

#### Tier 2 — Metal (Discovered in-run)
- **Recipes:** Iron tools, forge, metal armor, lantern
- **Materials:** Iron, copper, coal + Tier 1 components
- **Purpose:** Explore dangerous biomes, fight medium mobs

#### Tier 3 — Alchemy (Discovered in-run)
- **Recipes:** Potions, enchanted tools, alchemical grenades
- **Materials:** Rare mushrooms, crystals, slime gel + Tier 2 outputs
- **Purpose:** Prepare for endgame biomes, buff NPCs

#### Tier 4 — Volcanic (Meta-unlock required)
- **Recipes:** Obsidian weapons, fire-resistant gear, magma forge
- **Materials:** Obsidian, fire crystals + Tier 3 outputs
- **Purpose:** Survive Volcanic Wastes, approach Corrupted Lands

#### Tier 5 — Void (Meta-unlock required)
- **Recipes:** Void weapons, shadow armor, purification tools
- **Materials:** Shadow essence, void crystals + Tier 4 outputs
- **Purpose:** Endgame content, boss encounters

### Recipe Discovery Mechanics

1. **Found recipes** — loot scrolls/tablets from structures, chests, or mob drops. Each scroll teaches one recipe permanently (persists via meta-progression).
2. **Experimentation** — combine materials at a workstation. Valid combos discover the recipe. Failed combos consume a fraction of materials. Found notes narrow the search.
3. **Auto-unlock** — Tier 1 recipes known from start. Some Tier 2 recipes auto-unlock when picking up a new material type for the first time.
4. **Meta-unlock** — certain recipes require meta-progression milestones (e.g., "Reach Volcanic Wastes 3 times").

### Recipe Data Structure

```typescript
interface Recipe {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4 | 5;
  station: "hand" | "campfire" | "workbench" | "forge" | "alchemy_table" | "magma_forge" | "void_altar";
  ingredients: { item: string; count: number }[];
  output: { item: string; count: number };
  discovery: "known" | "material" | "scroll" | "experiment" | "meta";
  metaRequired: string | null; // milestone ID, or null
}
```

### Item Data Structure

```typescript
interface Item {
  id: string;
  name: string;
  type: "resource" | "tool" | "weapon" | "armor" | "consumable" | "ability" | "misc";
  tier: 1 | 2 | 3 | 4 | 5;
  stackable: boolean;
  maxStack: number;
  quality: "normal" | "uncommon" | "rare" | "epic" | "legendary"; // v1: always "normal"
  modifiers: ItemModifier[]; // v1: always empty, v2: magic properties
  stats?: Partial<EntityStats>; // for equippable items
}

interface ItemModifier {
  type: string;   // e.g., "fire_damage", "lifesteal", "speed_boost"
  value: number;
}
```

### Meta-Progression (Persists Across Runs)

| What persists | Description |
|---------------|-------------|
| Recipe Knowledge | All discovered recipes stay unlocked forever. Core reward loop. |
| Crafting Hints | Found notes/hints persist, narrows experimentation in future runs. |
| NPC Roster | Unlocked NPC types persist. Start with 0, unlock first after a milestone. |
| Biome Access | Corrupted Lands only appears after specific meta-milestones. |
| Starting Bonuses | Later runs can start with minor resource bundles or tool upgrades. |

**What does NOT persist:** Inventory, base/structures, world map, NPC assignments, current health — each run starts fresh.

## Combat & Entities

### Combat Model

Auto-attack with positioning control. Player controls where to stand and when to use abilities. Basic attacks fire automatically when an enemy is in range. This keeps combat engaging while being mobile-friendly (no frantic tapping).

### Entity Stats

```typescript
interface EntityStats {
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  speed: number;
  attackSpeed: number; // attacks per second
  hunger?: number;     // player-only, 0-100
}
```

All entities (player, mobs, NPCs in v2) share this stat interface. Player has hunger; mobs do not.

### Player Stats

| Stat | Description |
|------|-------------|
| Health | Die at 0. Regen from food/potions. |
| Defense | From armor. Flat damage reduction. |
| Attack | From weapon. Determines auto-attack damage. |
| Speed | Movement speed. Outrun or chase. |
| Attack Speed | Auto-attack interval. Faster = more DPS. |
| Hunger | Depletes over time. Low hunger = debuffs. |

All stats are gear-driven, no character leveling system (keeps it roguelike).

### Abilities (v1 — 3 slots)

1. **Dash** — quick burst of movement, dodge attacks or close gaps. Cooldown-based. Always available.
2. **Power Strike** — heavy hit, longer cooldown. Weapon-dependent (unlocked via crafting).
3. **Consumable Slot** — use a potion, grenade, or food item. Tied to inventory.

More abilities added in later tiers via crafted items (e.g., fire grenade from alchemy, shield bash from metal armor). Abilities are items, not a skill tree.

### Damage Formula

```
damage = max(1, attacker.attack - defender.defense) × variance(0.8 – 1.2)
```

Simple flat reduction, always at least 1 damage, small random variance for feel. Extensible for modifiers in v2: `base damage + sum(modifiers) - defense`.

### Mob Types

#### Passive Mobs
- **Behavior:** Wander, flee when hit
- **Examples:** Deer, rabbits
- **Drops:** Meat, hide, bone
- **AI:** Flee-from-player when damaged

#### Aggressive Mobs
- **Behavior:** Patrol territory, chase on sight
- **Examples:** Slimes, golems, bog lurkers
- **Drops:** Crafting materials, recipe scrolls (rare)
- **AI:** Chase → attack → leash back to territory

#### Elite Mobs
- **Behavior:** Rare spawns with enhanced stats
- **Examples:** Ancient Golem, Alpha Wolf
- **Drops:** Guaranteed recipe scroll + rare materials
- **AI:** Chase + special attack pattern (charge, AoE)

#### Bosses (v1: 1 boss)
- **Behavior:** Fixed spawn in Corrupted Lands
- **Examples:** The Corrupted One
- **Drops:** Unique items, major meta-unlock
- **AI:** Multi-phase fight, telegraphed attacks

### Mob AI State Machine

```
Idle/Patrol → [player in range] → Alert → [close enough] → Chase → [in attack range] → Attack
                                                                         ↓
                                                              [beyond leash distance]
                                                                         ↓
                                                                    Return to Idle
```

Composable state machine — easy to add new states/behaviors for v2 mobs.

## NPC System

### v1 — Simple Workers

1. Build a **Hiring Post** at base (Tier 2 recipe)
2. Spend resources to hire an NPC
3. Assign NPC to a **resource type** (e.g., "gather wood")
4. NPC passively generates that resource over time
5. Collect from Hiring Post periodically

### NPC Types (v1)

| Type | Gathers | Unlock |
|------|---------|--------|
| Woodcutter | Wood | First NPC milestone |
| Miner | Stone, ores | Meta-progression |
| Herbalist | Herbs, mushrooms | Meta-progression |

### NPC Data Structure

```typescript
interface NPCType {
  id: string;
  name: string;
  hireCost: { item: string; count: number }[];
  gatherType: string;
  gatherRate: number;     // items per minute
  maxStorage: number;     // collect before overflow
  metaRequired: string | null;
  stats: EntityStats | null; // v2: health, speed, defense for physical NPCs
}
```

### v2 Path

The NPC data model includes a nullable `stats` field. In v2, NPCs become physical entities that walk around, can be attacked by mobs, and need protection. The architecture supports this without structural changes.

## UI Design

### HUD Layout

- **Top-left:** Health bar + Hunger bar
- **Top-right:** Settings + Minimap toggle buttons
- **Top-center:** Biome indicator (shows current biome name)
- **Bottom-center:** 3 ability buttons (Dash, Power Strike, Consumable)
- **Below abilities:** Quick inventory bar (6 slots for frequently used items)
- **Bottom-left:** NPC status widget (shows gathered resource counts)
- **Bottom-right:** Control hints

### UI Panels (overlay)

| Panel | Purpose |
|-------|---------|
| Inventory | Grid of items. Tap to equip/use. Color-coded quality borders in v2. |
| Crafting | List of known recipes. Greyed if missing materials. Experimentation tab. |
| NPC Manager | Hire, assign tasks, collect resources. Shows gather progress. |
| Map | Fog-of-war minimap. Explored chunks, biome colors, base marker. |
| Character | Stats, equipped gear, active buffs/debuffs. |
| Recipe Book | All discovered recipes + hints. Persists across runs via meta. |

### Mobile Considerations

- **Touch-first input:** Tap to move, tap enemies to focus, tap ability buttons. No hover states.
- **Responsive HUD:** UI scales to screen size. Ability buttons grow larger on small screens.
- **Panels as overlays:** Full-screen overlays on mobile, side panels on desktop.
- **Virtual joystick option:** Alternative to tap-to-move for direct control.
- **Pinch-to-zoom:** Adjust camera zoom on touch devices.

## v1 Scope

### In v1
- 5 biomes with unique resources and mobs
- 5 crafting tiers, ~30-40 recipes
- 4 recipe discovery mechanics
- Auto-attack combat with 3 ability slots
- Passive, aggressive, elite mobs + 1 boss
- 3 NPC worker types (passive gathering)
- Meta-progression (recipes, NPC unlocks, starting bonuses)
- Full HUD + 6 UI panels
- Placeholder pixel art (colored rectangles / simple sprites)
- Browser playable, mobile-ready architecture

### Deferred to v2+
- Item quality and magic modifiers (data model ready)
- Physical NPC workers that walk, fight, and die (data model ready)
- Additional biomes: desert, frozen tundra, underground caves, floating islands (config-driven)
- Sound and music
- Polished pixel art
- More abilities and combat depth
- More bosses and world events
- Actual Capacitor mobile build
- Multiplayer (if ever)

## v2-Ready Architecture Hooks

These are **not built in v1** but the architecture explicitly supports them:

- **Item quality/modifiers** — fields exist in item data model, always empty in v1
- **NPC stats/AI** — NPC data model has nullable stats field
- **New biomes** — adding a biome is a config entry + noise threshold
- **New mobs** — mob definitions are data-driven, AI uses composable state machine
- **Magic system** — modifier system on items can express any buff/debuff/effect
