import Phaser from 'phaser';

/**
 * Pixel-art texture generator.
 * All sprites are drawn pixel-by-pixel on small canvases for a crisp,
 * Graveyard Keeper-inspired look. Phaser's pixelArt:true handles upscaling.
 */
export function generateAllTextures(scene: Phaser.Scene): void {
  generateTileTextures(scene);
  generatePlayerTexture(scene);
  generateMobTextures(scene);
  generateResourceTextures(scene);
}

// ─── HELPERS ────────────────────────────────────────────

/** Create a canvas texture and return its 2D context for pixel drawing. */
function makeCanvas(scene: Phaser.Scene, key: string, w: number, h: number): CanvasRenderingContext2D {
  const ct = scene.textures.createCanvas(key, w, h);
  const ctx = ct!.getContext();
  ctx.imageSmoothingEnabled = false;
  return ctx;
}

/** Finalize a canvas texture after drawing. */
function finalize(scene: Phaser.Scene, key: string): void {
  (scene.textures.get(key) as Phaser.Textures.CanvasTexture).refresh();
}

function px(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);
}

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function outline(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, 1);
  ctx.fillRect(x, y + h - 1, w, 1);
  ctx.fillRect(x, y, 1, h);
  ctx.fillRect(x + w - 1, y, 1, h);
}

// Palette — earthy, muted tones inspired by Graveyard Keeper
const P = {
  // Skin
  skin: '#e8b796',
  skinShade: '#c8946e',
  // Hair
  hair: '#4a3728',
  hairLight: '#6b5040',
  // Blues (player clothing)
  blue: '#3b5dc9',
  blueLight: '#5b7ee5',
  blueDark: '#2a3f80',
  // Greens (forest)
  green: '#3e8948',
  greenLight: '#63c74d',
  greenDark: '#265c42',
  greenDeep: '#193c2c',
  // Browns (wood, earth)
  brown: '#8a503e',
  brownLight: '#b8704a',
  brownDark: '#5c3a28',
  // Grays (stone, metal)
  gray: '#8b8b8b',
  grayLight: '#b0b0b0',
  grayDark: '#5a5a5a',
  grayDeep: '#3a3a3a',
  // Swamp
  swampGreen: '#3d6b3d',
  swampDark: '#2a4a2a',
  swampMud: '#5e4a30',
  // Volcanic
  lava: '#d62b2b',
  lavaLight: '#ff6633',
  lavaDark: '#8b1a1a',
  magma: '#ff9933',
  // Corrupted
  purple: '#6b21a8',
  purpleLight: '#9b4dca',
  purpleDark: '#3d0066',
  // Outline
  outline: '#1a1a2e',
  outlineLight: '#2a2a3e',
  // UI
  white: '#ffffff',
  offWhite: '#e0dace',
  black: '#0a0a0a',
  yellow: '#f0c040',
  red: '#c83030',
  redLight: '#e05050',
  // Slime
  slimeGreen: '#55cc44',
  slimeLight: '#88ee66',
  slimeDark: '#338822',
};

// ─── TILES ──────────────────────────────────────────────

function generateTileTextures(scene: Phaser.Scene): void {
  // Isometric diamond: 48x24. Draw pixel by pixel.
  drawIsoDiamond(scene, 'tile', P.green, P.greenLight, P.greenDark);
  drawIsoDiamond(scene, 'tile_forest', P.green, P.greenLight, P.greenDark);
  drawIsoDiamond(scene, 'tile_rocky_highlands', P.gray, P.grayLight, P.grayDark);
  drawIsoDiamond(scene, 'tile_swamp', P.swampGreen, P.swampDark, P.swampMud);
  drawIsoDiamond(scene, 'tile_volcanic_wastes', P.lavaDark, P.lava, P.grayDeep);
  drawIsoDiamond(scene, 'tile_corrupted_lands', P.purpleDark, P.purple, '#1a0033');
}

function drawIsoDiamond(scene: Phaser.Scene, key: string, fill: string, highlight: string, shade: string): void {
  const w = 48, h = 24;
  const ctx = makeCanvas(scene, key, w, h);

  // Draw isometric diamond pixel by pixel
  for (let y = 0; y < h; y++) {
    // Diamond shape: width expands then contracts
    let halfWidth: number;
    if (y < h / 2) {
      halfWidth = Math.floor((y / (h / 2)) * (w / 2));
    } else {
      halfWidth = Math.floor(((h - 1 - y) / (h / 2)) * (w / 2));
    }
    const startX = w / 2 - halfWidth;
    const endX = w / 2 + halfWidth;

    for (let x = startX; x < endX; x++) {
      // Top half is lighter (highlight), bottom half is shade
      if (y < h / 2 - 1) {
        px(ctx, x, y, highlight);
      } else if (y > h / 2 + 1) {
        px(ctx, x, y, shade);
      } else {
        px(ctx, x, y, fill);
      }
    }
    // Outline pixels at edges
    if (halfWidth > 0) {
      px(ctx, startX, y, P.outline);
      px(ctx, endX - 1, y, P.outline);
    }
  }
  // Top and bottom point
  px(ctx, w / 2, 0, P.outline);
  px(ctx, w / 2 - 1, 0, P.outline);
  px(ctx, w / 2, h - 1, P.outline);
  px(ctx, w / 2 - 1, h - 1, P.outline);

  finalize(scene, key);
}

// ─── PLAYER ─────────────────────────────────────────────

function generatePlayerTexture(scene: Phaser.Scene): void {
  // 12x18 pixel art character, will be scaled by the game
  const w = 12, h = 18;
  const ctx = makeCanvas(scene, 'player', w, h);

  // Shadow
  rect(ctx, 3, 16, 6, 2, '#00000040');

  // Boots
  rect(ctx, 3, 14, 2, 2, P.brownDark);
  rect(ctx, 7, 14, 2, 2, P.brownDark);

  // Legs (pants)
  rect(ctx, 3, 12, 2, 2, P.brownLight);
  rect(ctx, 7, 12, 2, 2, P.brownLight);

  // Body
  rect(ctx, 3, 7, 6, 5, P.blue);
  // Body shade
  rect(ctx, 3, 10, 6, 2, P.blueDark);
  // Belt
  rect(ctx, 3, 11, 6, 1, P.brown);

  // Arms
  rect(ctx, 2, 7, 1, 4, P.blue);
  rect(ctx, 9, 7, 1, 4, P.blue);
  // Hands
  px(ctx, 2, 11, P.skin);
  px(ctx, 9, 11, P.skin);

  // Head
  rect(ctx, 4, 2, 4, 5, P.skin);
  // Head shade
  rect(ctx, 4, 5, 4, 2, P.skinShade);

  // Eyes
  px(ctx, 5, 4, P.outline);
  px(ctx, 7, 4, P.outline);

  // Hair
  rect(ctx, 4, 1, 4, 2, P.hair);
  px(ctx, 3, 2, P.hair);
  px(ctx, 8, 2, P.hair);
  rect(ctx, 4, 0, 4, 1, P.hairLight);

  // Outline the whole character
  drawSpriteOutline(ctx, w, h, P.outline);

  finalize(scene, 'player');
}

// ─── MOBS ───────────────────────────────────────────────

function generateMobTextures(scene: Phaser.Scene): void {
  drawSlime(scene);
  drawRabbit(scene);
  drawDeer(scene);
  drawGolem(scene, 'mob_rock_golem', P.gray, P.grayDark, P.grayLight);
  drawGolem(scene, 'mob_ancient_golem', P.grayLight, P.gray, P.white);
  drawBat(scene);
  drawFrog(scene);
  drawLurker(scene);
  drawElemental(scene, 'mob_fire_elemental', P.lava, P.lavaLight, P.magma);
  drawElemental(scene, 'mob_wisp', '#40e0d0', '#80ffff', '#ffffff');
  drawBeast(scene, 'mob_shadow_beast', P.purpleDark, P.purple);
  drawBeast(scene, 'mob_lava_crawler', P.lavaDark, P.lavaLight);
  drawCorruptedNPC(scene);

  // Generic fallback mob
  const ctx = makeCanvas(scene, 'mob', 10, 10);
  rect(ctx, 2, 2, 6, 6, P.red);
  px(ctx, 3, 4, P.white);
  px(ctx, 6, 4, P.white);
  drawSpriteOutline(ctx, 10, 10, P.outline);
  finalize(scene, 'mob');
}

function drawSlime(scene: Phaser.Scene): void {
  const w = 12, h = 10;
  const ctx = makeCanvas(scene, 'mob_slime', w, h);
  // Body blob
  rect(ctx, 2, 4, 8, 5, P.slimeGreen);
  rect(ctx, 3, 3, 6, 1, P.slimeGreen);
  rect(ctx, 4, 2, 4, 1, P.slimeLight);
  // Highlight
  px(ctx, 4, 3, P.slimeLight);
  px(ctx, 5, 3, P.slimeLight);
  // Eyes
  px(ctx, 4, 5, P.white);
  px(ctx, 7, 5, P.white);
  px(ctx, 4, 6, P.outline);
  px(ctx, 7, 6, P.outline);
  // Shadow
  rect(ctx, 3, 9, 6, 1, '#00000030');
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, 'mob_slime');
}

function drawRabbit(scene: Phaser.Scene): void {
  const w = 10, h = 12;
  const ctx = makeCanvas(scene, 'mob_rabbit', w, h);
  // Ears
  rect(ctx, 3, 0, 1, 4, P.grayLight);
  rect(ctx, 6, 0, 1, 4, P.grayLight);
  // Head
  rect(ctx, 3, 3, 4, 3, P.offWhite);
  // Eyes
  px(ctx, 4, 4, P.outline);
  px(ctx, 6, 4, P.outline);
  // Body
  rect(ctx, 2, 6, 6, 4, P.offWhite);
  rect(ctx, 3, 6, 4, 4, P.grayLight);
  // Tail
  px(ctx, 5, 10, P.white);
  // Shadow
  rect(ctx, 2, 11, 6, 1, '#00000020');
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, 'mob_rabbit');
}

function drawDeer(scene: Phaser.Scene): void {
  const w = 14, h = 16;
  const ctx = makeCanvas(scene, 'mob_deer', w, h);
  // Antlers
  px(ctx, 4, 0, P.brownDark);
  px(ctx, 3, 1, P.brownDark);
  px(ctx, 9, 0, P.brownDark);
  px(ctx, 10, 1, P.brownDark);
  // Head
  rect(ctx, 5, 2, 4, 3, P.brownLight);
  // Eyes
  px(ctx, 6, 3, P.outline);
  px(ctx, 8, 3, P.outline);
  // Body
  rect(ctx, 3, 5, 8, 6, P.brownLight);
  rect(ctx, 4, 5, 6, 6, P.brown);
  // Belly
  rect(ctx, 5, 9, 4, 2, P.offWhite);
  // Legs
  rect(ctx, 4, 11, 2, 3, P.brownDark);
  rect(ctx, 8, 11, 2, 3, P.brownDark);
  // Hooves
  rect(ctx, 4, 14, 2, 1, P.grayDark);
  rect(ctx, 8, 14, 2, 1, P.grayDark);
  // Shadow
  rect(ctx, 3, 15, 8, 1, '#00000020');
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, 'mob_deer');
}

function drawGolem(scene: Phaser.Scene, key: string, body: string, shade: string, eyes: string): void {
  const w = 14, h = 16;
  const ctx = makeCanvas(scene, key, w, h);
  // Head
  rect(ctx, 4, 1, 6, 4, shade);
  // Eyes
  px(ctx, 5, 3, eyes);
  px(ctx, 8, 3, eyes);
  // Body
  rect(ctx, 3, 5, 8, 6, body);
  rect(ctx, 4, 5, 6, 6, shade);
  // Arms
  rect(ctx, 1, 5, 2, 7, body);
  rect(ctx, 11, 5, 2, 7, body);
  // Legs
  rect(ctx, 4, 11, 2, 4, body);
  rect(ctx, 8, 11, 2, 4, body);
  // Cracks
  px(ctx, 6, 7, shade);
  px(ctx, 7, 8, shade);
  px(ctx, 5, 9, shade);
  // Shadow
  rect(ctx, 3, 15, 8, 1, '#00000030');
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, key);
}

function drawBat(scene: Phaser.Scene): void {
  const w = 16, h = 10;
  const ctx = makeCanvas(scene, 'mob_cave_bat', w, h);
  // Wings
  rect(ctx, 0, 3, 4, 3, P.grayDark);
  rect(ctx, 12, 3, 4, 3, P.grayDark);
  rect(ctx, 2, 2, 3, 2, P.grayDark);
  rect(ctx, 11, 2, 3, 2, P.grayDark);
  // Body
  rect(ctx, 6, 2, 4, 5, P.grayDeep);
  // Head
  rect(ctx, 6, 1, 4, 2, P.grayDark);
  // Eyes
  px(ctx, 7, 2, P.red);
  px(ctx, 9, 2, P.red);
  // Ears
  px(ctx, 6, 0, P.grayDark);
  px(ctx, 9, 0, P.grayDark);
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, 'mob_cave_bat');
}

function drawFrog(scene: Phaser.Scene): void {
  const w = 12, h = 10;
  const ctx = makeCanvas(scene, 'mob_poison_frog', w, h);
  // Body
  rect(ctx, 2, 4, 8, 4, P.greenLight);
  rect(ctx, 3, 3, 6, 1, P.greenLight);
  // Spots
  px(ctx, 4, 5, P.yellow);
  px(ctx, 7, 6, P.yellow);
  px(ctx, 5, 7, P.yellow);
  // Eyes (big, bulgy)
  rect(ctx, 2, 2, 2, 2, P.yellow);
  rect(ctx, 8, 2, 2, 2, P.yellow);
  px(ctx, 3, 3, P.outline);
  px(ctx, 9, 3, P.outline);
  // Front legs
  px(ctx, 1, 7, P.greenDark);
  px(ctx, 10, 7, P.greenDark);
  // Shadow
  rect(ctx, 2, 9, 8, 1, '#00000020');
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, 'mob_poison_frog');
}

function drawLurker(scene: Phaser.Scene): void {
  const w = 12, h = 16;
  const ctx = makeCanvas(scene, 'mob_bog_lurker', w, h);
  // Tendrils
  px(ctx, 4, 0, P.swampDark);
  px(ctx, 7, 0, P.swampDark);
  px(ctx, 3, 1, P.swampDark);
  px(ctx, 8, 1, P.swampDark);
  // Head
  rect(ctx, 3, 2, 6, 4, P.swampGreen);
  // Eyes
  px(ctx, 4, 4, P.slimeLight);
  px(ctx, 7, 4, P.slimeLight);
  // Body
  rect(ctx, 2, 6, 8, 6, P.swampGreen);
  rect(ctx, 3, 6, 6, 6, P.swampDark);
  // Dripping bits
  px(ctx, 3, 12, P.swampDark);
  px(ctx, 8, 12, P.swampDark);
  // Legs
  rect(ctx, 3, 12, 2, 3, P.swampGreen);
  rect(ctx, 7, 12, 2, 3, P.swampGreen);
  // Shadow
  rect(ctx, 2, 15, 8, 1, '#00000030');
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, 'mob_bog_lurker');
}

function drawElemental(scene: Phaser.Scene, key: string, core: string, glow: string, bright: string): void {
  const w = 12, h = 14;
  const ctx = makeCanvas(scene, key, w, h);
  // Outer glow
  rect(ctx, 3, 3, 6, 8, glow);
  // Core
  rect(ctx, 4, 4, 4, 6, core);
  // Bright center
  px(ctx, 5, 5, bright);
  px(ctx, 6, 5, bright);
  px(ctx, 5, 6, bright);
  // Top flame
  px(ctx, 5, 1, glow);
  px(ctx, 6, 1, glow);
  px(ctx, 5, 2, core);
  px(ctx, 6, 2, core);
  // Side wisps
  px(ctx, 2, 5, glow);
  px(ctx, 9, 6, glow);
  px(ctx, 3, 8, glow);
  px(ctx, 8, 4, glow);
  // Eyes
  px(ctx, 5, 7, P.outline);
  px(ctx, 7, 7, P.outline);
  // Shadow
  rect(ctx, 4, 12, 4, 1, '#00000020');
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, key);
}

function drawBeast(scene: Phaser.Scene, key: string, body: string, accent: string): void {
  const w = 14, h = 14;
  const ctx = makeCanvas(scene, key, w, h);
  // Ears/horns
  px(ctx, 3, 0, body);
  px(ctx, 10, 0, body);
  // Head
  rect(ctx, 4, 1, 6, 4, accent);
  // Eyes (red, menacing)
  px(ctx, 5, 3, P.red);
  px(ctx, 8, 3, P.red);
  // Body
  rect(ctx, 2, 5, 10, 5, body);
  rect(ctx, 3, 5, 8, 5, accent);
  // Legs
  rect(ctx, 3, 10, 2, 3, body);
  rect(ctx, 9, 10, 2, 3, body);
  // Claws
  px(ctx, 3, 13, accent);
  px(ctx, 4, 13, accent);
  px(ctx, 9, 13, accent);
  px(ctx, 10, 13, accent);
  // Shadow
  rect(ctx, 3, 13, 8, 1, '#00000030');
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, key);
}

function drawCorruptedNPC(scene: Phaser.Scene): void {
  const w = 12, h = 18;
  const ctx = makeCanvas(scene, 'mob_corrupted_npc', w, h);
  // Hair (messy)
  rect(ctx, 3, 0, 6, 2, P.purpleDark);
  px(ctx, 2, 1, P.purpleDark);
  px(ctx, 9, 1, P.purpleDark);
  // Head
  rect(ctx, 4, 2, 4, 4, P.skinShade);
  // Corruption on face
  px(ctx, 4, 3, P.purple);
  px(ctx, 7, 4, P.purple);
  // Eyes (glowing)
  px(ctx, 5, 4, P.purpleLight);
  px(ctx, 7, 4, P.purpleLight);
  // Body
  rect(ctx, 3, 6, 6, 5, P.purpleDark);
  rect(ctx, 4, 6, 4, 5, P.purple);
  // Arms
  rect(ctx, 2, 7, 1, 4, P.purpleDark);
  rect(ctx, 9, 7, 1, 4, P.purpleDark);
  // Legs
  rect(ctx, 3, 11, 2, 4, P.grayDark);
  rect(ctx, 7, 11, 2, 4, P.grayDark);
  // Corruption drip
  px(ctx, 2, 11, P.purple);
  px(ctx, 9, 11, P.purple);
  px(ctx, 5, 15, P.purple);
  // Shadow
  rect(ctx, 3, 16, 6, 1, '#00000030');
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, 'mob_corrupted_npc');
}

// ─── RESOURCES ──────────────────────────────────────────

function generateResourceTextures(scene: Phaser.Scene): void {
  drawTree(scene, 'res_wood', P.green, P.greenLight, P.brown, P.brownDark);
  drawRock(scene, 'res_stone', P.gray, P.grayLight, P.grayDark);
  drawBush(scene, 'res_berries', P.greenDark, P.green, P.red);
  drawBush(scene, 'res_herbs', P.greenDark, P.greenLight, P.greenLight);
  drawBush(scene, 'res_slime_gel', P.greenDark, P.slimeGreen, P.slimeLight);
  drawOre(scene, 'res_iron_ore', P.gray, P.grayDark, P.brownLight);
  drawOre(scene, 'res_copper_ore', P.gray, P.grayDark, '#cc8844');
  drawOre(scene, 'res_coal', P.grayDark, P.grayDeep, P.outline);
  drawCrystal(scene, 'res_crystal', '#6699cc', '#88bbee', '#aaddff');
  drawMushroom(scene, 'res_rare_mushroom', P.purple, P.purpleLight, P.offWhite);
  drawReeds(scene, 'res_swamp_reed', P.swampGreen, P.swampDark);
  drawOre(scene, 'res_obsidian', P.grayDeep, P.outline, P.purpleDark);
  drawCrystal(scene, 'res_fire_crystal', P.lava, P.lavaLight, P.magma);
  drawOre(scene, 'res_rare_ore', P.gray, P.grayDark, P.yellow);
  drawCrystal(scene, 'res_shadow_essence', P.purpleDark, P.purple, P.purpleLight);
  drawCrystal(scene, 'res_void_crystal', P.purple, P.purpleLight, P.white);
  drawTree(scene, 'res_corrupted_wood', P.purpleDark, P.purple, P.grayDeep, P.outline);

  // Fallback
  const ctx = makeCanvas(scene, 'resource_node', 8, 8);
  rect(ctx, 2, 2, 4, 4, P.yellow);
  drawSpriteOutline(ctx, 8, 8, P.outline);
  finalize(scene, 'resource_node');
}

function drawTree(scene: Phaser.Scene, key: string, leaf: string, leafLight: string, trunk: string, trunkDark: string): void {
  const w = 12, h = 16;
  const ctx = makeCanvas(scene, key, w, h);
  // Shadow
  rect(ctx, 3, 14, 6, 2, '#00000020');
  // Trunk
  rect(ctx, 5, 9, 2, 6, trunk);
  px(ctx, 5, 9, trunkDark);
  px(ctx, 5, 13, trunkDark);
  // Canopy - 3 layers
  rect(ctx, 3, 5, 6, 4, leaf);
  rect(ctx, 2, 6, 8, 3, leaf);
  rect(ctx, 4, 3, 4, 3, leaf);
  // Highlights on top-left
  px(ctx, 4, 4, leafLight);
  px(ctx, 5, 4, leafLight);
  px(ctx, 3, 6, leafLight);
  px(ctx, 4, 5, leafLight);
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, key);
}

function drawRock(scene: Phaser.Scene, key: string, body: string, light: string, shade: string): void {
  const w = 10, h = 10;
  const ctx = makeCanvas(scene, key, w, h);
  // Shadow
  rect(ctx, 2, 8, 7, 2, '#00000020');
  // Main rock shape
  rect(ctx, 2, 3, 6, 5, body);
  rect(ctx, 1, 4, 8, 4, body);
  rect(ctx, 3, 2, 4, 1, body);
  // Highlight top-left
  px(ctx, 3, 3, light);
  px(ctx, 4, 3, light);
  px(ctx, 2, 4, light);
  // Shade bottom-right
  px(ctx, 7, 6, shade);
  px(ctx, 7, 7, shade);
  px(ctx, 6, 7, shade);
  // Crack
  px(ctx, 4, 5, shade);
  px(ctx, 5, 6, shade);
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, key);
}

function drawBush(scene: Phaser.Scene, key: string, dark: string, light: string, fruit: string): void {
  const w = 10, h = 10;
  const ctx = makeCanvas(scene, key, w, h);
  // Shadow
  rect(ctx, 2, 8, 6, 2, '#00000015');
  // Bush shape
  rect(ctx, 2, 4, 6, 4, dark);
  rect(ctx, 1, 5, 8, 3, dark);
  rect(ctx, 3, 3, 4, 1, dark);
  // Light top
  px(ctx, 3, 4, light);
  px(ctx, 4, 4, light);
  px(ctx, 5, 3, light);
  // Fruits / flowers
  px(ctx, 3, 5, fruit);
  px(ctx, 6, 6, fruit);
  px(ctx, 4, 7, fruit);
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, key);
}

function drawOre(scene: Phaser.Scene, key: string, rock: string, shade: string, ore: string): void {
  const w = 10, h = 10;
  const ctx = makeCanvas(scene, key, w, h);
  // Shadow
  rect(ctx, 2, 8, 7, 2, '#00000020');
  // Rock base
  rect(ctx, 1, 3, 8, 5, rock);
  rect(ctx, 2, 2, 6, 1, rock);
  // Shade
  px(ctx, 7, 6, shade);
  px(ctx, 7, 7, shade);
  // Ore veins (sparkly spots)
  px(ctx, 3, 4, ore);
  px(ctx, 6, 3, ore);
  px(ctx, 4, 6, ore);
  px(ctx, 7, 5, ore);
  // Sparkle
  px(ctx, 3, 3, P.white);
  px(ctx, 6, 5, P.white);
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, key);
}

function drawCrystal(scene: Phaser.Scene, key: string, body: string, light: string, bright: string): void {
  const w = 10, h = 14;
  const ctx = makeCanvas(scene, key, w, h);
  // Shadow
  rect(ctx, 2, 12, 6, 2, '#00000020');
  // Main crystal shard (center)
  rect(ctx, 4, 2, 2, 10, body);
  rect(ctx, 3, 4, 4, 6, body);
  // Left shard
  rect(ctx, 1, 6, 2, 5, body);
  px(ctx, 2, 5, body);
  // Right shard
  rect(ctx, 7, 5, 2, 6, body);
  px(ctx, 7, 4, body);
  // Highlights
  px(ctx, 4, 3, light);
  px(ctx, 4, 4, light);
  px(ctx, 2, 7, light);
  px(ctx, 7, 5, light);
  // Bright sparkle
  px(ctx, 4, 3, bright);
  px(ctx, 8, 5, bright);
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, key);
}

function drawMushroom(scene: Phaser.Scene, key: string, cap: string, capLight: string, stem: string): void {
  const w = 10, h = 12;
  const ctx = makeCanvas(scene, key, w, h);
  // Shadow
  rect(ctx, 2, 10, 6, 2, '#00000015');
  // Stem
  rect(ctx, 4, 7, 2, 4, stem);
  // Cap
  rect(ctx, 2, 3, 6, 4, cap);
  rect(ctx, 1, 4, 8, 3, cap);
  rect(ctx, 3, 2, 4, 1, cap);
  // Spots
  px(ctx, 3, 4, capLight);
  px(ctx, 6, 5, capLight);
  px(ctx, 4, 3, capLight);
  // Highlight
  px(ctx, 3, 3, capLight);
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, key);
}

function drawReeds(scene: Phaser.Scene, key: string, stalk: string, dark: string): void {
  const w = 8, h = 14;
  const ctx = makeCanvas(scene, key, w, h);
  // Shadow
  rect(ctx, 1, 12, 6, 2, '#00000010');
  // Stalks (3 thin vertical lines)
  for (let y = 3; y < 13; y++) {
    px(ctx, 2, y, stalk);
    px(ctx, 4, y, dark);
    px(ctx, 6, y, stalk);
  }
  // Tops (fluffy seed heads)
  rect(ctx, 1, 1, 2, 3, stalk);
  rect(ctx, 3, 0, 2, 4, dark);
  rect(ctx, 5, 2, 2, 2, stalk);
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, key);
}

// ─── OUTLINE HELPER ─────────────────────────────────────

/**
 * Draw a 1px dark outline around all non-transparent pixels in the canvas.
 * This gives every sprite a consistent pixel-art border.
 */
function drawSpriteOutline(ctx: CanvasRenderingContext2D, w: number, h: number, color: string): void {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  // Find all pixels that are transparent but adjacent to an opaque pixel
  const outlinePixels: [number, number][] = [];

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3];
      if (alpha > 0) continue; // Skip opaque pixels

      // Check 4 neighbors
      const neighbors = [
        [x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1],
      ];
      for (const [nx, ny] of neighbors) {
        if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
        const nAlpha = data[(ny * w + nx) * 4 + 3];
        if (nAlpha > 20) {
          outlinePixels.push([x, y]);
          break;
        }
      }
    }
  }

  ctx.fillStyle = color;
  for (const [x, y] of outlinePixels) {
    ctx.fillRect(x, y, 1, 1);
  }
}
