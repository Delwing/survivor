import Phaser from 'phaser';

/**
 * Generates all placeholder textures procedurally.
 * Each entity type gets a recognizable silhouette rather than a colored rectangle.
 */
export function generateAllTextures(scene: Phaser.Scene): void {
  generateTileTextures(scene);
  generatePlayerTexture(scene);
  generateMobTextures(scene);
  generateResourceTextures(scene);
}

// ─── TILES ──────────────────────────────────────────────

function generateTileTextures(scene: Phaser.Scene): void {
  // Base isometric diamond tile — one per biome
  const biomes: [string, number, number][] = [
    ['tile_forest', 0x2d8a4e, 0x1a6b35],
    ['tile_rocky_highlands', 0x7a7a7a, 0x5c5c5c],
    ['tile_swamp', 0x3d6b3d, 0x2a4f2a],
    ['tile_volcanic_wastes', 0x6b2020, 0x4a1515],
    ['tile_corrupted_lands', 0x3d1a5c, 0x2a0e42],
  ];

  for (const [key, fillColor, edgeColor] of biomes) {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    // Fill
    g.fillStyle(fillColor);
    g.beginPath();
    g.moveTo(24, 1);
    g.lineTo(47, 12);
    g.lineTo(24, 23);
    g.lineTo(1, 12);
    g.closePath();
    g.fillPath();
    // Edge highlight top
    g.lineStyle(1, edgeColor, 0.6);
    g.beginPath();
    g.moveTo(24, 1);
    g.lineTo(47, 12);
    g.lineTo(24, 23);
    g.lineTo(1, 12);
    g.closePath();
    g.strokePath();
    // Inner detail — slight highlight on top half
    g.fillStyle(0xffffff, 0.06);
    g.beginPath();
    g.moveTo(24, 3);
    g.lineTo(44, 12);
    g.lineTo(24, 12);
    g.lineTo(4, 12);
    g.closePath();
    g.fillPath();
    g.generateTexture(key, 48, 24);
    g.destroy();
  }

  // Fallback generic tile
  const gf = scene.make.graphics({ x: 0, y: 0 }, false);
  gf.fillStyle(0x228b22);
  gf.beginPath();
  gf.moveTo(24, 0);
  gf.lineTo(48, 12);
  gf.lineTo(24, 24);
  gf.lineTo(0, 12);
  gf.closePath();
  gf.fillPath();
  gf.generateTexture('tile', 48, 24);
  gf.destroy();
}

// ─── PLAYER ─────────────────────────────────────────────

function generatePlayerTexture(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const w = 24, h = 36;

  // Shadow
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(12, 34, 18, 6);

  // Body
  g.fillStyle(0x2563eb);
  g.fillRoundedRect(6, 14, 12, 14, 2);

  // Head
  g.fillStyle(0xf0c8a0);
  g.fillCircle(12, 10, 6);

  // Eyes
  g.fillStyle(0x1e3a5f);
  g.fillCircle(10, 9, 1.5);
  g.fillCircle(14, 9, 1.5);

  // Hair
  g.fillStyle(0x5c3317);
  g.fillRoundedRect(6, 4, 12, 5, 2);

  // Arms
  g.fillStyle(0x1d4ed8);
  g.fillRect(3, 15, 3, 10);
  g.fillRect(18, 15, 3, 10);

  // Legs
  g.fillStyle(0x4a3728);
  g.fillRect(7, 28, 4, 6);
  g.fillRect(13, 28, 4, 6);

  // Belt / detail
  g.fillStyle(0x92400e);
  g.fillRect(6, 26, 12, 2);

  g.generateTexture('player', w, h);
  g.destroy();
}

// ─── MOBS ───────────────────────────────────────────────

function generateMobTextures(scene: Phaser.Scene): void {
  // Each mob gets its own texture key: 'mob_<id>'
  generateSlimeTexture(scene);
  generateRabbitTexture(scene);
  generateDeerTexture(scene);
  generateGolemTexture(scene, 'mob_rock_golem', 0x696969, 0x4a4a4a, 28);
  generateGolemTexture(scene, 'mob_ancient_golem', 0xa9a9a9, 0x787878, 36);
  generateBatTexture(scene);
  generateFrogTexture(scene);
  generateLurkerTexture(scene);
  generateElementalTexture(scene, 'mob_fire_elemental', 0xff4500, 0xff8c00);
  generateElementalTexture(scene, 'mob_wisp', 0x00ffff, 0x88ffff);
  generateBeastTexture(scene, 'mob_shadow_beast', 0x2f0047, 0x6b21a8);
  generateBeastTexture(scene, 'mob_lava_crawler', 0xff6600, 0xff3300);
  generateCorruptedNPCTexture(scene);

  // Fallback generic mob
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xff0000);
  g.fillCircle(10, 10, 8);
  g.fillStyle(0xffffff);
  g.fillCircle(7, 8, 2);
  g.fillCircle(13, 8, 2);
  g.fillStyle(0x000000);
  g.fillCircle(7, 8, 1);
  g.fillCircle(13, 8, 1);
  g.generateTexture('mob', 20, 20);
  g.destroy();
}

function generateSlimeTexture(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  // Body — blobby shape
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(12, 22, 20, 6);
  g.fillStyle(0x22c55e);
  g.fillEllipse(12, 14, 20, 16);
  // Highlight
  g.fillStyle(0xffffff, 0.3);
  g.fillEllipse(9, 10, 6, 4);
  // Eyes
  g.fillStyle(0xffffff);
  g.fillCircle(8, 12, 3);
  g.fillCircle(16, 12, 3);
  g.fillStyle(0x000000);
  g.fillCircle(9, 12, 1.5);
  g.fillCircle(17, 12, 1.5);
  g.generateTexture('mob_slime', 24, 24);
  g.destroy();
}

function generateRabbitTexture(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(10, 21, 14, 4);
  // Body
  g.fillStyle(0xc0c0c0);
  g.fillEllipse(10, 14, 12, 10);
  // Head
  g.fillStyle(0xd4d4d4);
  g.fillCircle(10, 7, 5);
  // Ears
  g.fillStyle(0xc0c0c0);
  g.fillEllipse(7, 1, 3, 6);
  g.fillEllipse(13, 1, 3, 6);
  g.fillStyle(0xffb6c1, 0.6);
  g.fillEllipse(7, 1, 1.5, 4);
  g.fillEllipse(13, 1, 1.5, 4);
  // Eye
  g.fillStyle(0x000000);
  g.fillCircle(8, 6, 1);
  g.fillCircle(12, 6, 1);
  // Tail
  g.fillStyle(0xffffff);
  g.fillCircle(10, 19, 2);
  g.generateTexture('mob_rabbit', 20, 24);
  g.destroy();
}

function generateDeerTexture(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(14, 33, 16, 4);
  // Body
  g.fillStyle(0x8b6914);
  g.fillEllipse(14, 22, 16, 12);
  // Head
  g.fillStyle(0xa0772e);
  g.fillCircle(14, 11, 6);
  // Antlers
  g.lineStyle(2, 0x5c3317);
  g.lineBetween(10, 6, 6, 0);
  g.lineBetween(6, 0, 3, 2);
  g.lineBetween(18, 6, 22, 0);
  g.lineBetween(22, 0, 25, 2);
  // Eyes
  g.fillStyle(0x000000);
  g.fillCircle(12, 10, 1);
  g.fillCircle(16, 10, 1);
  // Legs
  g.fillStyle(0x6b4c12);
  g.fillRect(8, 28, 3, 6);
  g.fillRect(17, 28, 3, 6);
  g.generateTexture('mob_deer', 28, 36);
  g.destroy();
}

function generateGolemTexture(scene: Phaser.Scene, key: string, bodyColor: number, darkColor: number, size: number): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const cx = size / 2;
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(cx, size - 2, size * 0.8, 6);
  // Body — blocky
  g.fillStyle(bodyColor);
  g.fillRoundedRect(cx - size * 0.35, size * 0.3, size * 0.7, size * 0.5, 3);
  // Head
  g.fillStyle(darkColor);
  g.fillRoundedRect(cx - size * 0.22, size * 0.12, size * 0.44, size * 0.25, 2);
  // Eyes — glowing
  g.fillStyle(0xffff00);
  g.fillCircle(cx - size * 0.08, size * 0.22, 2);
  g.fillCircle(cx + size * 0.08, size * 0.22, 2);
  // Arms
  g.fillStyle(bodyColor);
  g.fillRoundedRect(cx - size * 0.48, size * 0.35, size * 0.12, size * 0.35, 2);
  g.fillRoundedRect(cx + size * 0.36, size * 0.35, size * 0.12, size * 0.35, 2);
  // Cracks detail
  g.lineStyle(1, darkColor, 0.5);
  g.lineBetween(cx - 3, size * 0.4, cx + 2, size * 0.55);
  g.lineBetween(cx + 1, size * 0.45, cx + 5, size * 0.35);
  g.generateTexture(key, size, size);
  g.destroy();
}

function generateBatTexture(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  // Wings
  g.fillStyle(0x3d3d3d);
  g.beginPath();
  g.moveTo(12, 8);
  g.lineTo(0, 2);
  g.lineTo(2, 10);
  g.lineTo(6, 12);
  g.closePath();
  g.fillPath();
  g.beginPath();
  g.moveTo(12, 8);
  g.lineTo(24, 2);
  g.lineTo(22, 10);
  g.lineTo(18, 12);
  g.closePath();
  g.fillPath();
  // Body
  g.fillStyle(0x4a4a4a);
  g.fillEllipse(12, 10, 8, 10);
  // Eyes — red
  g.fillStyle(0xff0000);
  g.fillCircle(10, 8, 1.5);
  g.fillCircle(14, 8, 1.5);
  g.generateTexture('mob_cave_bat', 24, 18);
  g.destroy();
}

function generateFrogTexture(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(10, 19, 16, 4);
  // Body
  g.fillStyle(0x32cd32);
  g.fillEllipse(10, 13, 16, 12);
  // Spots
  g.fillStyle(0x228b22, 0.5);
  g.fillCircle(6, 12, 2);
  g.fillCircle(14, 14, 2);
  g.fillCircle(10, 10, 1.5);
  // Eyes — big and bulgy
  g.fillStyle(0xffff00);
  g.fillCircle(5, 6, 3);
  g.fillCircle(15, 6, 3);
  g.fillStyle(0x000000);
  g.fillCircle(5, 6, 1.5);
  g.fillCircle(15, 6, 1.5);
  g.generateTexture('mob_poison_frog', 20, 22);
  g.destroy();
}

function generateLurkerTexture(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(14, 30, 20, 6);
  // Body — tall, hunched
  g.fillStyle(0x556b2f);
  g.fillEllipse(14, 18, 18, 20);
  // Tendrils from top
  g.lineStyle(2, 0x3d5a1e);
  g.lineBetween(10, 8, 7, 2);
  g.lineBetween(14, 7, 16, 1);
  g.lineBetween(18, 8, 21, 3);
  // Eyes — eerie
  g.fillStyle(0xadff2f);
  g.fillCircle(10, 16, 2);
  g.fillCircle(18, 16, 2);
  g.fillStyle(0x000000);
  g.fillCircle(10, 16, 1);
  g.fillCircle(18, 16, 1);
  g.generateTexture('mob_bog_lurker', 28, 32);
  g.destroy();
}

function generateElementalTexture(scene: Phaser.Scene, key: string, coreColor: number, glowColor: number): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  // Glow
  g.fillStyle(glowColor, 0.2);
  g.fillCircle(14, 14, 14);
  // Core
  g.fillStyle(coreColor);
  g.fillCircle(14, 14, 9);
  // Inner glow
  g.fillStyle(glowColor, 0.5);
  g.fillCircle(14, 12, 5);
  // Highlight
  g.fillStyle(0xffffff, 0.4);
  g.fillCircle(11, 10, 3);
  // Flame tips / particles
  g.fillStyle(coreColor, 0.6);
  g.fillCircle(7, 6, 3);
  g.fillCircle(20, 8, 2);
  g.fillCircle(14, 3, 2);
  g.generateTexture(key, 28, 28);
  g.destroy();
}

function generateBeastTexture(scene: Phaser.Scene, key: string, bodyColor: number, accentColor: number): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(14, 28, 20, 6);
  // Body — quadruped
  g.fillStyle(bodyColor);
  g.fillEllipse(14, 18, 22, 14);
  // Head
  g.fillStyle(accentColor);
  g.fillCircle(14, 9, 7);
  // Ears/horns
  g.fillStyle(bodyColor);
  g.beginPath();
  g.moveTo(8, 5);
  g.lineTo(5, 0);
  g.lineTo(10, 4);
  g.closePath();
  g.fillPath();
  g.beginPath();
  g.moveTo(20, 5);
  g.lineTo(23, 0);
  g.lineTo(18, 4);
  g.closePath();
  g.fillPath();
  // Eyes
  g.fillStyle(0xff0000);
  g.fillCircle(11, 8, 2);
  g.fillCircle(17, 8, 2);
  g.fillStyle(0xffffff);
  g.fillCircle(11, 7, 0.8);
  g.fillCircle(17, 7, 0.8);
  // Legs
  g.fillStyle(bodyColor);
  g.fillRect(6, 24, 3, 6);
  g.fillRect(19, 24, 3, 6);
  g.generateTexture(key, 28, 32);
  g.destroy();
}

function generateCorruptedNPCTexture(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x000000, 0.3);
  g.fillEllipse(12, 34, 18, 6);
  // Body — humanoid but glitchy
  g.fillStyle(0x800080);
  g.fillRoundedRect(6, 14, 12, 14, 2);
  // Head
  g.fillStyle(0x601060);
  g.fillCircle(12, 10, 6);
  // Eyes — purple glow
  g.fillStyle(0xff00ff);
  g.fillCircle(10, 9, 2);
  g.fillCircle(14, 9, 2);
  // Corruption lines
  g.lineStyle(1, 0xff00ff, 0.5);
  g.lineBetween(6, 18, 3, 26);
  g.lineBetween(18, 18, 21, 26);
  g.lineBetween(9, 14, 7, 10);
  // Legs
  g.fillStyle(0x501050);
  g.fillRect(7, 28, 4, 6);
  g.fillRect(13, 28, 4, 6);
  g.generateTexture('mob_corrupted_npc', 24, 36);
  g.destroy();
}

// ─── RESOURCES ──────────────────────────────────────────

function generateResourceTextures(scene: Phaser.Scene): void {
  generateTreeTexture(scene);
  generateRockTexture(scene);
  generateBushTexture(scene, 'res_berries', 0xff6347, 0x228b22);
  generateBushTexture(scene, 'res_herbs', 0x32cd32, 0x1a7a1a);
  generateOreTexture(scene, 'res_iron_ore', 0xa0522d, 0xc0c0c0);
  generateOreTexture(scene, 'res_copper_ore', 0xb87333, 0xdaa520);
  generateOreTexture(scene, 'res_coal', 0x2f2f2f, 0x1a1a1a);
  generateCrystalTexture(scene, 'res_crystal', 0x87ceeb, 0xadd8e6);
  generateMushroomTexture(scene, 'res_rare_mushroom', 0x9932cc);
  generateReedTexture(scene, 'res_swamp_reed', 0x6b8e23);
  generateOreTexture(scene, 'res_obsidian', 0x1a1a2e, 0x4b0082);
  generateCrystalTexture(scene, 'res_fire_crystal', 0xff4500, 0xff8c00);
  generateOreTexture(scene, 'res_rare_ore', 0xffd700, 0xffec8b);
  generateCrystalTexture(scene, 'res_shadow_essence', 0x2f0047, 0x6b21a8);
  generateCrystalTexture(scene, 'res_void_crystal', 0x4b0082, 0x8b00ff);
  generateTreeTexture(scene, 'res_corrupted_wood', 0x3d003d, 0x1a001a);
  generateBushTexture(scene, 'res_slime_gel', 0x7fff00, 0x228b22);

  // Fallback
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0xffd700);
  g.fillRect(2, 2, 12, 12);
  g.generateTexture('resource_node', 16, 16);
  g.destroy();
}

function generateTreeTexture(scene: Phaser.Scene, key = 'res_wood', leafColor = 0x228b22, trunkColor = 0x5c3317): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  // Shadow
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(10, 27, 14, 4);
  // Trunk
  g.fillStyle(trunkColor);
  g.fillRect(8, 14, 4, 14);
  // Canopy — layered circles
  g.fillStyle(leafColor);
  g.fillCircle(10, 10, 8);
  g.fillCircle(6, 12, 5);
  g.fillCircle(14, 12, 5);
  // Highlight
  g.fillStyle(0xffffff, 0.15);
  g.fillCircle(8, 7, 4);
  g.generateTexture(key, 20, 28);
  g.destroy();
}

function generateRockTexture(scene: Phaser.Scene): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(10, 19, 16, 4);
  // Main rock
  g.fillStyle(0x808080);
  g.beginPath();
  g.moveTo(3, 18);
  g.lineTo(1, 10);
  g.lineTo(6, 4);
  g.lineTo(14, 3);
  g.lineTo(19, 8);
  g.lineTo(18, 18);
  g.closePath();
  g.fillPath();
  // Highlight
  g.fillStyle(0xffffff, 0.15);
  g.beginPath();
  g.moveTo(5, 10);
  g.lineTo(7, 5);
  g.lineTo(13, 4);
  g.lineTo(10, 10);
  g.closePath();
  g.fillPath();
  // Crack
  g.lineStyle(1, 0x4a4a4a);
  g.lineBetween(8, 8, 12, 14);
  g.lineBetween(10, 10, 14, 11);
  g.generateTexture('res_stone', 20, 20);
  g.destroy();
}

function generateBushTexture(scene: Phaser.Scene, key: string, fruitColor: number, leafColor: number): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(10, 19, 16, 4);
  // Bush body
  g.fillStyle(leafColor);
  g.fillCircle(10, 12, 7);
  g.fillCircle(6, 14, 5);
  g.fillCircle(14, 14, 5);
  // Fruits/flowers
  g.fillStyle(fruitColor);
  g.fillCircle(7, 10, 2);
  g.fillCircle(13, 11, 2);
  g.fillCircle(10, 14, 1.5);
  g.fillCircle(5, 13, 1.5);
  g.generateTexture(key, 20, 22);
  g.destroy();
}

function generateOreTexture(scene: Phaser.Scene, key: string, rockColor: number, oreColor: number): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(10, 17, 14, 4);
  // Rock base
  g.fillStyle(rockColor);
  g.beginPath();
  g.moveTo(2, 16);
  g.lineTo(1, 8);
  g.lineTo(5, 3);
  g.lineTo(15, 2);
  g.lineTo(19, 7);
  g.lineTo(18, 16);
  g.closePath();
  g.fillPath();
  // Ore veins / sparkles
  g.fillStyle(oreColor);
  g.fillCircle(6, 8, 2.5);
  g.fillCircle(13, 6, 2);
  g.fillCircle(10, 12, 2);
  // Sparkle
  g.fillStyle(0xffffff, 0.5);
  g.fillCircle(6, 7, 1);
  g.fillCircle(13, 5, 0.8);
  g.generateTexture(key, 20, 18);
  g.destroy();
}

function generateCrystalTexture(scene: Phaser.Scene, key: string, crystalColor: number, highlightColor: number): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(10, 23, 12, 4);
  // Crystal shards
  g.fillStyle(crystalColor);
  g.beginPath();
  g.moveTo(8, 22);
  g.lineTo(6, 8);
  g.lineTo(10, 2);
  g.lineTo(14, 8);
  g.lineTo(12, 22);
  g.closePath();
  g.fillPath();
  // Side crystal
  g.beginPath();
  g.moveTo(4, 20);
  g.lineTo(2, 12);
  g.lineTo(5, 7);
  g.lineTo(8, 14);
  g.closePath();
  g.fillPath();
  g.beginPath();
  g.moveTo(16, 20);
  g.lineTo(18, 10);
  g.lineTo(15, 6);
  g.lineTo(12, 14);
  g.closePath();
  g.fillPath();
  // Highlight
  g.fillStyle(highlightColor, 0.5);
  g.beginPath();
  g.moveTo(8, 18);
  g.lineTo(7, 10);
  g.lineTo(10, 4);
  g.lineTo(10, 14);
  g.closePath();
  g.fillPath();
  // Sparkle
  g.fillStyle(0xffffff, 0.7);
  g.fillCircle(9, 8, 1);
  g.generateTexture(key, 20, 24);
  g.destroy();
}

function generateMushroomTexture(scene: Phaser.Scene, key: string, capColor: number): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(10, 21, 12, 3);
  // Stem
  g.fillStyle(0xf5f5dc);
  g.fillRect(8, 12, 4, 10);
  // Cap
  g.fillStyle(capColor);
  g.fillEllipse(10, 10, 16, 10);
  // Spots
  g.fillStyle(0xffffff, 0.6);
  g.fillCircle(7, 8, 1.5);
  g.fillCircle(13, 9, 1.5);
  g.fillCircle(10, 6, 1);
  g.generateTexture(key, 20, 22);
  g.destroy();
}

function generateReedTexture(scene: Phaser.Scene, key: string, color: number): void {
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  g.fillStyle(0x000000, 0.1);
  g.fillEllipse(8, 27, 10, 3);
  // Reeds — multiple thin stalks
  g.lineStyle(2, color);
  g.lineBetween(4, 26, 3, 4);
  g.lineBetween(8, 26, 9, 2);
  g.lineBetween(12, 26, 13, 6);
  // Tops — fluffy
  g.fillStyle(color);
  g.fillEllipse(3, 3, 3, 5);
  g.fillEllipse(9, 1, 3, 5);
  g.fillEllipse(13, 5, 3, 4);
  g.generateTexture(key, 16, 28);
  g.destroy();
}
