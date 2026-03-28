import Phaser from 'phaser';

/**
 * Pixel-art texture generator.
 * All sprites are drawn pixel-by-pixel on small canvases for a crisp,
 * Graveyard Keeper-inspired look. Phaser's pixelArt:true handles upscaling.
 */
export function generateAllTextures(scene: Phaser.Scene): void {
  generateTileTextures(scene);
  generatePlayerSpritesheet(scene);
  generateMobTextures(scene);
  generateResourceTextures(scene);
  generateStationTextures(scene);
  generateItemIcons(scene);
}

export function createPlayerAnimations(scene: Phaser.Scene): void {
  if (scene.anims.exists('player_idle')) return; // already created

  scene.anims.create({
    key: 'player_idle',
    frames: [
      { key: 'player_f0' },
      { key: 'player_f1' },
    ],
    frameRate: 2,
    repeat: -1,
  });
  scene.anims.create({
    key: 'player_walk',
    frames: [
      { key: 'player_f2' },
      { key: 'player_f3' },
      { key: 'player_f4' },
      { key: 'player_f5' },
    ],
    frameRate: 8,
    repeat: -1,
  });
  scene.anims.create({
    key: 'player_gather',
    frames: [
      { key: 'player_f7' },
      { key: 'player_f6' },
      { key: 'player_f12' },
      { key: 'player_f13' },
    ],
    frameRate: 6,
    repeat: -1,
  });
  scene.anims.create({
    key: 'player_attack',
    frames: [
      { key: 'player_f8' },
      { key: 'player_f9' },
      { key: 'player_f10' },
      { key: 'player_f11' },
    ],
    frameRate: 10,
    repeat: 0,
  });
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

// ─── PLAYER SPRITESHEET ─────────────────────────────────

/**
 * Generates individual frame textures for player animations:
 *   player_f0, player_f1: idle
 *   player_f2..player_f5: walk
 *   player_f6, player_f7: gather
 */
function generatePlayerSpritesheet(scene: Phaser.Scene): void {
  const fw = 16, fh = 26; // 26px tall to give headroom for upward bob
  const frameDefs: [number, PlayerFrameOpts][] = [
    [0, { legOffset: 0, bodyBob: 0, armMode: 'normal' }],
    [1, { legOffset: 0, bodyBob: -1, armMode: 'normal' }],
    [2, { legOffset: -1, bodyBob: 0, armMode: 'swing_left' }],
    [3, { legOffset: 0, bodyBob: -1, armMode: 'normal' }],
    [4, { legOffset: 1, bodyBob: 0, armMode: 'swing_right' }],
    [5, { legOffset: 0, bodyBob: -1, armMode: 'normal' }],
    [6, { legOffset: 0, bodyBob: 1, armMode: 'gather' }],
    [7, { legOffset: 0, bodyBob: 0, armMode: 'gather_up' }],
    // Attack frames (f8-f11)
    [8, { legOffset: 0, bodyBob: -1, armMode: 'attack_windup' }],
    [9, { legOffset: 1, bodyBob: 0, armMode: 'attack_swing' }],
    [10, { legOffset: 0, bodyBob: 1, armMode: 'attack_impact' }],
    [11, { legOffset: 0, bodyBob: 0, armMode: 'attack_recover' }],
    // Extra gather frames (f12-f13)
    [12, { legOffset: 0, bodyBob: 2, armMode: 'gather_deep' }],
    [13, { legOffset: 0, bodyBob: -1, armMode: 'gather_pull' }],
  ];

  for (const [idx, opts] of frameDefs) {
    const key = `player_f${idx}`;
    const ctx = makeCanvas(scene, key, fw, fh);
    drawPlayerFrame(ctx, 0, opts);
    drawFrameOutline(ctx, 0, 0, fw, fh, P.outline);
    finalize(scene, key);
  }

  // Also generate a default 'player' texture (frame 0) for initial sprite creation
  const defCtx = makeCanvas(scene, 'player', fw, fh);
  drawPlayerFrame(defCtx, 0, { legOffset: 0, bodyBob: 0, armMode: 'normal' });
  drawFrameOutline(defCtx, 0, 0, fw, fh, P.outline);
  finalize(scene, 'player');
}

interface PlayerFrameOpts {
  legOffset: number;    // -1 = left forward, 0 = neutral, 1 = right forward
  bodyBob: number;      // vertical offset for body/head (-1 = up, 1 = down)
  armMode: 'normal' | 'swing_left' | 'swing_right' | 'gather' | 'gather_up' | 'gather_deep' | 'gather_pull' | 'attack_windup' | 'attack_swing' | 'attack_impact' | 'attack_recover';
}

function drawPlayerFrame(ctx: CanvasRenderingContext2D, frameIdx: number, opts: PlayerFrameOpts): void {
  const fw = 16;
  const fh = 26;
  const ox = frameIdx * fw; // x offset for this frame
  const by = opts.bodyBob;  // body vertical shift
  const yo = 2; // vertical offset — gives headroom for upward bob so hair isn't clipped

  // Shadow (wider ellipse under feet)
  rect(ctx, ox + 3, yo + 21, 10, 2, '#00000040');

  // Left leg
  const llOff = opts.legOffset === -1 ? -1 : (opts.legOffset === 1 ? 1 : 0);
  rect(ctx, ox + 4, yo + 16 + llOff, 3, 3, P.brownLight);   // thigh
  rect(ctx, ox + 4, yo + 19 + llOff, 3, 2, P.brownDark);    // boot

  // Right leg
  const rlOff = opts.legOffset === 1 ? -1 : (opts.legOffset === -1 ? 1 : 0);
  rect(ctx, ox + 9, yo + 16 + rlOff, 3, 3, P.brownLight);
  rect(ctx, ox + 9, yo + 19 + rlOff, 3, 2, P.brownDark);

  // Body — wider torso
  rect(ctx, ox + 4, yo + 9 + by, 8, 7, P.blue);
  rect(ctx, ox + 4, yo + 13 + by, 8, 3, P.blueDark);
  // Belt
  rect(ctx, ox + 4, yo + 15 + by, 8, 1, P.brown);
  // Shirt highlight
  rect(ctx, ox + 5, yo + 9 + by, 3, 3, P.blueLight);

  // Arms depend on mode — 2px wide arms with visible hands
  switch (opts.armMode) {
    case 'normal':
      rect(ctx, ox + 2, yo + 9 + by, 2, 5, P.blue);
      rect(ctx, ox + 12, yo + 9 + by, 2, 5, P.blue);
      rect(ctx, ox + 2, yo + 14 + by, 2, 2, P.skin);
      rect(ctx, ox + 12, yo + 14 + by, 2, 2, P.skin);
      break;
    case 'swing_left':
      rect(ctx, ox + 1, yo + 9 + by, 2, 4, P.blue);
      rect(ctx, ox + 13, yo + 10 + by, 2, 5, P.blue);
      rect(ctx, ox + 1, yo + 13 + by, 2, 2, P.skin);
      rect(ctx, ox + 13, yo + 15 + by, 2, 2, P.skin);
      break;
    case 'swing_right':
      rect(ctx, ox + 2, yo + 10 + by, 2, 5, P.blue);
      rect(ctx, ox + 13, yo + 9 + by, 2, 4, P.blue);
      rect(ctx, ox + 2, yo + 15 + by, 2, 2, P.skin);
      rect(ctx, ox + 13, yo + 13 + by, 2, 2, P.skin);
      break;
    case 'gather':
      rect(ctx, ox + 1, yo + 12 + by, 3, 2, P.blue);
      rect(ctx, ox + 12, yo + 12 + by, 3, 2, P.blue);
      rect(ctx, ox + 1, yo + 14 + by, 2, 2, P.skin);
      rect(ctx, ox + 13, yo + 14 + by, 2, 2, P.skin);
      break;
    case 'gather_up':
      rect(ctx, ox + 1, yo + 10 + by, 3, 2, P.blue);
      rect(ctx, ox + 12, yo + 10 + by, 3, 2, P.blue);
      rect(ctx, ox + 1, yo + 9 + by, 2, 2, P.skin);
      rect(ctx, ox + 13, yo + 9 + by, 2, 2, P.skin);
      break;
    case 'gather_deep':
      rect(ctx, ox + 1, yo + 14 + by, 3, 2, P.blue);
      rect(ctx, ox + 12, yo + 14 + by, 3, 2, P.blue);
      rect(ctx, ox + 1, yo + 16 + by, 2, 2, P.skin);
      rect(ctx, ox + 13, yo + 16 + by, 2, 2, P.skin);
      break;
    case 'gather_pull':
      rect(ctx, ox + 2, yo + 8 + by, 3, 2, P.blue);
      rect(ctx, ox + 11, yo + 8 + by, 3, 2, P.blue);
      rect(ctx, ox + 3, yo + 7 + by, 2, 2, P.skin);
      rect(ctx, ox + 11, yo + 7 + by, 2, 2, P.skin);
      px(ctx, ox + 7, yo + 7 + by, P.brownLight);
      px(ctx, ox + 8, yo + 7 + by, P.brownLight);
      break;
    case 'attack_windup':
      rect(ctx, ox + 2, yo + 10 + by, 2, 5, P.blue);
      rect(ctx, ox + 2, yo + 15 + by, 2, 2, P.skin);
      rect(ctx, ox + 12, yo + 4 + by, 2, 4, P.blue);
      rect(ctx, ox + 12, yo + 2 + by, 2, 2, P.skin);
      rect(ctx, ox + 12, yo + 0 + by, 2, 2, P.gray);
      px(ctx, ox + 13, yo + 0 + by, P.grayLight);
      break;
    case 'attack_swing':
      rect(ctx, ox + 1, yo + 10 + by, 2, 4, P.blue);
      rect(ctx, ox + 1, yo + 14 + by, 2, 2, P.skin);
      rect(ctx, ox + 13, yo + 8 + by, 2, 3, P.blue);
      rect(ctx, ox + 14, yo + 7 + by, 2, 2, P.skin);
      rect(ctx, ox + 14, yo + 5 + by, 1, 3, P.gray);
      px(ctx, ox + 15, yo + 5 + by, P.grayLight);
      break;
    case 'attack_impact':
      rect(ctx, ox + 2, yo + 11 + by, 2, 4, P.blue);
      rect(ctx, ox + 2, yo + 15 + by, 2, 2, P.skin);
      rect(ctx, ox + 13, yo + 11 + by, 3, 2, P.blue);
      rect(ctx, ox + 14, yo + 13 + by, 2, 2, P.skin);
      rect(ctx, ox + 14, yo + 15 + by, 1, 2, P.gray);
      px(ctx, ox + 15, yo + 14 + by, P.grayLight);
      break;
    case 'attack_recover':
      rect(ctx, ox + 2, yo + 9 + by, 2, 5, P.blue);
      rect(ctx, ox + 2, yo + 14 + by, 2, 2, P.skin);
      rect(ctx, ox + 12, yo + 10 + by, 2, 4, P.blue);
      rect(ctx, ox + 12, yo + 14 + by, 2, 2, P.skin);
      break;
  }

  // Head — 6px wide
  rect(ctx, ox + 5, yo + 3 + by, 6, 6, P.skin);
  rect(ctx, ox + 5, yo + 7 + by, 6, 2, P.skinShade);

  // Eyes — 2 dots with 1px gap
  px(ctx, ox + 6, yo + 5 + by, P.outline);
  px(ctx, ox + 7, yo + 5 + by, P.outline);
  px(ctx, ox + 9, yo + 5 + by, P.outline);
  px(ctx, ox + 10, yo + 5 + by, P.outline);

  // Mouth
  px(ctx, ox + 7, yo + 7 + by, P.skinShade);
  px(ctx, ox + 8, yo + 7 + by, P.skinShade);

  // Hair — full cap
  rect(ctx, ox + 5, yo + 1 + by, 6, 3, P.hair);
  px(ctx, ox + 4, yo + 2 + by, P.hair);
  px(ctx, ox + 4, yo + 3 + by, P.hair);
  px(ctx, ox + 11, yo + 2 + by, P.hair);
  px(ctx, ox + 11, yo + 3 + by, P.hair);
  rect(ctx, ox + 5, yo + 0 + by, 6, 1, P.hairLight);  // top highlight

  // Outline this frame
  drawFrameOutline(ctx, frameIdx * fw, 0, fw, fh, P.outline);
}

/** Outline only within a specific frame region of the spritesheet. */
function drawFrameOutline(ctx: CanvasRenderingContext2D, fx: number, fy: number, fw: number, fh: number, color: string): void {
  const imageData = ctx.getImageData(fx, fy, fw, fh);
  const data = imageData.data;
  const outlinePixels: [number, number][] = [];

  for (let y = 0; y < fh; y++) {
    for (let x = 0; x < fw; x++) {
      const alpha = data[(y * fw + x) * 4 + 3];
      if (alpha > 0) continue;
      const neighbors = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
      for (const [nx, ny] of neighbors) {
        if (nx < 0 || nx >= fw || ny < 0 || ny >= fh) continue;
        if (data[(ny * fw + nx) * 4 + 3] > 20) {
          outlinePixels.push([x, y]);
          break;
        }
      }
    }
  }

  ctx.fillStyle = color;
  for (const [x, y] of outlinePixels) {
    ctx.fillRect(fx + x, fy + y, 1, 1);
  }
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

  // Generic fallback mob — 16x14
  {
    const ctx = makeCanvas(scene, 'mob', 16, 14);
    rect(ctx, 3, 3, 10, 8, P.red);
    rect(ctx, 4, 2, 8, 1, P.red);
    rect(ctx, 4, 11, 8, 1, P.red);
    rect(ctx, 4, 4, 3, 2, P.redLight);  // highlight
    px(ctx, 5, 6, P.white);   // left eye
    px(ctx, 10, 6, P.white);  // right eye
    px(ctx, 5, 7, P.outline);
    px(ctx, 10, 7, P.outline);
    rect(ctx, 4, 13, 8, 1, '#00000020');
    drawSpriteOutline(ctx, 16, 14, P.outline);
    finalize(scene, 'mob');
  }
}

function drawSlime(scene: Phaser.Scene): void {
  const w = 18, h = 16;
  const ctx = makeCanvas(scene, 'mob_slime', w, h);
  // Body blob — wider, squished shape
  rect(ctx, 2, 6, 14, 7, P.slimeGreen);
  rect(ctx, 3, 5, 12, 2, P.slimeGreen);
  rect(ctx, 5, 3, 8, 3, P.slimeGreen);
  rect(ctx, 7, 2, 4, 2, P.slimeLight);  // top highlight dome
  // Inner highlight blob
  rect(ctx, 5, 5, 5, 3, P.slimeLight);
  px(ctx, 6, 4, P.slimeLight);
  // Drip on bottom edges
  px(ctx, 3, 13, P.slimeGreen);
  px(ctx, 14, 13, P.slimeGreen);
  // Eyes (2 wide)
  rect(ctx, 5, 8, 3, 3, P.white);
  rect(ctx, 10, 8, 3, 3, P.white);
  rect(ctx, 6, 9, 2, 2, P.outline);   // pupils
  rect(ctx, 11, 9, 2, 2, P.outline);
  px(ctx, 6, 9, P.white);  // eye sparkle
  px(ctx, 11, 9, P.white);
  // Shadow
  rect(ctx, 3, 14, 12, 2, '#00000030');
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, 'mob_slime');
}

function drawRabbit(scene: Phaser.Scene): void {
  const w = 14, h = 16;
  const ctx = makeCanvas(scene, 'mob_rabbit', w, h);
  // Ears — tall and thin
  rect(ctx, 4, 0, 2, 6, P.grayLight);
  px(ctx, 5, 1, P.skin);  // inner ear left
  rect(ctx, 8, 0, 2, 6, P.grayLight);
  px(ctx, 9, 1, P.skin);  // inner ear right
  // Head
  rect(ctx, 3, 5, 8, 5, P.offWhite);
  rect(ctx, 4, 5, 6, 4, P.grayLight);
  // Nose (pink dot)
  px(ctx, 6, 8, P.skin);
  px(ctx, 7, 8, P.skin);
  // Eyes
  px(ctx, 5, 7, P.outline);
  px(ctx, 9, 7, P.outline);
  // Body
  rect(ctx, 2, 9, 10, 5, P.offWhite);
  rect(ctx, 3, 9, 8, 5, P.grayLight);
  rect(ctx, 4, 10, 4, 3, P.offWhite);  // belly highlight
  // Feet
  rect(ctx, 2, 13, 4, 2, P.grayLight);
  rect(ctx, 8, 13, 4, 2, P.grayLight);
  // Tail
  rect(ctx, 10, 11, 3, 2, P.white);
  // Shadow
  rect(ctx, 2, 15, 10, 1, '#00000020');
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, 'mob_rabbit');
}

function drawDeer(scene: Phaser.Scene): void {
  const w = 20, h = 24;
  const ctx = makeCanvas(scene, 'mob_deer', w, h);
  // Antlers — branching
  rect(ctx, 5, 0, 2, 4, P.brownDark);
  px(ctx, 3, 1, P.brownDark);  // left branch
  px(ctx, 4, 2, P.brownDark);
  px(ctx, 7, 0, P.brownDark);  // right branch
  rect(ctx, 13, 0, 2, 4, P.brownDark);
  px(ctx, 15, 1, P.brownDark);
  px(ctx, 16, 2, P.brownDark);
  px(ctx, 12, 0, P.brownDark);
  // Head
  rect(ctx, 6, 4, 8, 5, P.brownLight);
  rect(ctx, 7, 7, 6, 3, P.brownLight);  // snout extension
  // Eyes
  px(ctx, 7, 6, P.outline);
  px(ctx, 12, 6, P.outline);
  // Nose
  rect(ctx, 8, 9, 2, 1, P.brownDark);
  px(ctx, 8, 9, P.black);
  // Neck
  rect(ctx, 8, 8, 4, 3, P.brownLight);
  // Body
  rect(ctx, 3, 10, 14, 9, P.brownLight);
  rect(ctx, 4, 10, 12, 9, P.brown);
  // Belly lighter stripe
  rect(ctx, 7, 14, 6, 4, P.offWhite);
  // Back highlight
  rect(ctx, 5, 10, 8, 2, P.brownLight);
  // 4 Legs
  rect(ctx, 4, 19, 3, 4, P.brownDark);   // front left
  rect(ctx, 8, 19, 3, 4, P.brownDark);   // front right
  rect(ctx, 13, 19, 3, 4, P.brownDark);  // back left
  rect(ctx, 17, 19, 3, 4, P.brownDark);  // back right -- slight offset for perspective
  // Hooves
  rect(ctx, 4, 22, 3, 2, P.grayDark);
  rect(ctx, 8, 22, 3, 2, P.grayDark);
  rect(ctx, 13, 22, 3, 2, P.grayDark);
  rect(ctx, 17, 22, 3, 2, P.grayDark);
  // Shadow
  rect(ctx, 3, 23, 14, 1, '#00000020');
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, 'mob_deer');
}

function drawGolem(scene: Phaser.Scene, key: string, body: string, shade: string, eyes: string): void {
  // ancient_golem gets 26x28, rock_golem gets 20x24
  const isAncient = key === 'mob_ancient_golem';
  const w = isAncient ? 26 : 20;
  const h = isAncient ? 28 : 24;
  const ctx = makeCanvas(scene, key, w, h);

  if (isAncient) {
    // Big boss golem — 26x28
    // Head — wide square
    rect(ctx, 5, 1, 16, 8, shade);
    rect(ctx, 6, 2, 14, 6, body);
    // Eyes — glowing 2x2
    rect(ctx, 8, 4, 3, 3, eyes);
    rect(ctx, 15, 4, 3, 3, eyes);
    // Forehead cracks
    px(ctx, 11, 2, shade); px(ctx, 12, 3, shade); px(ctx, 13, 2, shade);
    // Jaw details
    rect(ctx, 7, 7, 4, 2, shade);
    rect(ctx, 15, 7, 4, 2, shade);
    // Body — massive torso
    rect(ctx, 3, 9, 20, 11, body);
    rect(ctx, 4, 10, 18, 9, shade);
    // Chest emblem
    rect(ctx, 10, 11, 6, 5, body);
    px(ctx, 12, 12, eyes); px(ctx, 13, 12, eyes);  // rune glow
    px(ctx, 12, 14, eyes); px(ctx, 13, 14, eyes);
    // Shoulder plates
    rect(ctx, 1, 9, 4, 6, body);
    rect(ctx, 21, 9, 4, 6, body);
    // Arms — chunky
    rect(ctx, 1, 15, 4, 8, shade);
    rect(ctx, 21, 15, 4, 8, shade);
    rect(ctx, 2, 16, 2, 6, body);
    rect(ctx, 22, 16, 2, 6, body);
    // Fists
    rect(ctx, 1, 22, 5, 4, body);
    rect(ctx, 20, 22, 5, 4, body);
    // Legs — pillars
    rect(ctx, 6, 20, 5, 7, body);
    rect(ctx, 15, 20, 5, 7, body);
    rect(ctx, 7, 21, 3, 5, shade);
    rect(ctx, 16, 21, 3, 5, shade);
    // Cracks all over body
    px(ctx, 7, 12, shade); px(ctx, 8, 13, shade); px(ctx, 6, 14, shade);
    px(ctx, 17, 11, shade); px(ctx, 18, 13, shade);
    px(ctx, 9, 16, shade); px(ctx, 14, 17, shade); px(ctx, 11, 18, shade);
    // Shadow
    rect(ctx, 4, 27, 18, 1, '#00000040');
  } else {
    // Standard rock golem — 20x24
    // Head
    rect(ctx, 5, 1, 10, 7, shade);
    rect(ctx, 6, 2, 8, 5, body);
    // Eyes
    rect(ctx, 7, 4, 2, 2, eyes);
    rect(ctx, 11, 4, 2, 2, eyes);
    // Head crack
    px(ctx, 9, 2, shade); px(ctx, 10, 3, shade);
    // Body
    rect(ctx, 4, 8, 12, 9, body);
    rect(ctx, 5, 9, 10, 7, shade);
    // Chest cracks
    px(ctx, 8, 10, shade); px(ctx, 9, 11, shade); px(ctx, 7, 12, shade);
    px(ctx, 13, 10, shade); px(ctx, 12, 13, shade);
    // Arms
    rect(ctx, 1, 8, 4, 8, body);
    rect(ctx, 15, 8, 4, 8, body);
    rect(ctx, 2, 9, 2, 6, shade);
    rect(ctx, 16, 9, 2, 6, shade);
    // Legs
    rect(ctx, 5, 17, 4, 6, body);
    rect(ctx, 11, 17, 4, 6, body);
    rect(ctx, 6, 18, 2, 4, shade);
    rect(ctx, 12, 18, 2, 4, shade);
    // Shadow
    rect(ctx, 4, 23, 12, 1, '#00000030');
  }

  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, key);
}

function drawBat(scene: Phaser.Scene): void {
  const w = 18, h = 16;

  // Frame 0: wings up
  {
    const ctx = makeCanvas(scene, 'mob_cave_bat_f0', w, h);
    // Wings raised high
    rect(ctx, 1, 2, 4, 4, P.grayDark);
    rect(ctx, 13, 2, 4, 4, P.grayDark);
    rect(ctx, 0, 3, 3, 3, P.grayDark);
    rect(ctx, 15, 3, 3, 3, P.grayDark);
    // Wing bone lines
    px(ctx, 1, 2, P.grayDeep); px(ctx, 3, 4, P.grayDeep);
    px(ctx, 16, 2, P.grayDeep); px(ctx, 14, 4, P.grayDeep);
    // Wing-fold highlights
    px(ctx, 2, 4, '#4a4a5a'); px(ctx, 15, 4, '#4a4a5a');
    // Body
    rect(ctx, 6, 4, 6, 7, P.grayDeep);
    rect(ctx, 7, 5, 4, 5, P.grayDark);
    // Feet/claws
    px(ctx, 7, 11, P.grayDark); px(ctx, 8, 12, P.grayDark);
    px(ctx, 10, 11, P.grayDark); px(ctx, 9, 12, P.grayDark);
    // Head
    rect(ctx, 7, 2, 4, 3, P.grayDark);
    // Eyes
    rect(ctx, 7, 3, 2, 2, P.red);
    rect(ctx, 11, 3, 2, 2, P.red);
    px(ctx, 8, 3, P.redLight); px(ctx, 12, 3, P.redLight);
    // Ears
    px(ctx, 7, 1, P.grayDark); px(ctx, 6, 0, P.grayDark);
    px(ctx, 11, 1, P.grayDark); px(ctx, 12, 0, P.grayDark);
    drawSpriteOutline(ctx, w, h, P.outline);
    finalize(scene, 'mob_cave_bat_f0');
  }

  // Frame 1: wings down
  {
    const ctx = makeCanvas(scene, 'mob_cave_bat_f1', w, h);
    // Wings spread low
    rect(ctx, 0, 7, 5, 4, P.grayDark);
    rect(ctx, 13, 7, 5, 4, P.grayDark);
    rect(ctx, 2, 6, 4, 3, P.grayDark);
    rect(ctx, 12, 6, 4, 3, P.grayDark);
    // Wing bone lines
    px(ctx, 1, 10, P.grayDeep); px(ctx, 3, 8, P.grayDeep);
    px(ctx, 16, 10, P.grayDeep); px(ctx, 14, 8, P.grayDeep);
    // Wing-fold highlights
    px(ctx, 2, 9, '#4a4a5a'); px(ctx, 15, 9, '#4a4a5a');
    // Body
    rect(ctx, 6, 4, 6, 7, P.grayDeep);
    rect(ctx, 7, 5, 4, 5, P.grayDark);
    // Feet/claws
    px(ctx, 7, 11, P.grayDark); px(ctx, 8, 12, P.grayDark);
    px(ctx, 10, 11, P.grayDark); px(ctx, 9, 12, P.grayDark);
    // Head
    rect(ctx, 7, 2, 4, 3, P.grayDark);
    // Eyes
    rect(ctx, 7, 3, 2, 2, P.red);
    rect(ctx, 11, 3, 2, 2, P.red);
    px(ctx, 8, 3, P.redLight); px(ctx, 12, 3, P.redLight);
    // Ears
    px(ctx, 7, 1, P.grayDark); px(ctx, 6, 0, P.grayDark);
    px(ctx, 11, 1, P.grayDark); px(ctx, 12, 0, P.grayDark);
    drawSpriteOutline(ctx, w, h, P.outline);
    finalize(scene, 'mob_cave_bat_f1');
  }

  // Also keep a static key for fallback
  const ctx = makeCanvas(scene, 'mob_cave_bat', w, h);
  rect(ctx, 0, 5, 5, 5, P.grayDark);
  rect(ctx, 13, 5, 5, 5, P.grayDark);
  rect(ctx, 2, 3, 4, 4, P.grayDark);
  rect(ctx, 12, 3, 4, 4, P.grayDark);
  px(ctx, 1, 9, P.grayDeep); px(ctx, 3, 6, P.grayDeep);
  px(ctx, 16, 9, P.grayDeep); px(ctx, 14, 6, P.grayDeep);
  px(ctx, 2, 7, '#4a4a5a'); px(ctx, 15, 7, '#4a4a5a');
  rect(ctx, 6, 4, 6, 7, P.grayDeep);
  rect(ctx, 7, 5, 4, 5, P.grayDark);
  px(ctx, 7, 11, P.grayDark); px(ctx, 8, 12, P.grayDark);
  px(ctx, 10, 11, P.grayDark); px(ctx, 9, 12, P.grayDark);
  rect(ctx, 7, 2, 4, 3, P.grayDark);
  rect(ctx, 7, 3, 2, 2, P.red);
  rect(ctx, 11, 3, 2, 2, P.red);
  px(ctx, 8, 3, P.redLight); px(ctx, 12, 3, P.redLight);
  px(ctx, 7, 1, P.grayDark); px(ctx, 6, 0, P.grayDark);
  px(ctx, 11, 1, P.grayDark); px(ctx, 12, 0, P.grayDark);
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, 'mob_cave_bat');
}

export function createBatAnimation(scene: Phaser.Scene): void {
  if (scene.anims.exists('bat_fly')) return;
  scene.anims.create({
    key: 'bat_fly',
    frames: [
      { key: 'mob_cave_bat_f0' },
      { key: 'mob_cave_bat_f1' },
    ],
    frameRate: 6,
    repeat: -1,
  });
}

function drawFrog(scene: Phaser.Scene): void {
  const w = 14, h = 16;
  const ctx = makeCanvas(scene, 'mob_poison_frog', w, h);
  // Body — low, wide
  rect(ctx, 2, 7, 10, 6, P.greenLight);
  rect(ctx, 3, 6, 8, 2, P.greenLight);
  rect(ctx, 4, 5, 6, 2, P.greenLight);
  // Belly (lighter)
  rect(ctx, 4, 9, 6, 3, P.offWhite);
  // Spots — poison warning
  rect(ctx, 3, 8, 2, 2, P.yellow);
  rect(ctx, 9, 9, 2, 2, P.yellow);
  px(ctx, 6, 11, P.yellow);
  // Eyes (big, bulgy — on top of head)
  rect(ctx, 2, 3, 3, 3, P.yellow);
  rect(ctx, 9, 3, 3, 3, P.yellow);
  rect(ctx, 3, 4, 2, 2, P.outline);   // pupils
  rect(ctx, 10, 4, 2, 2, P.outline);
  px(ctx, 3, 4, P.white);  // sparkle
  px(ctx, 10, 4, P.white);
  // Front legs
  rect(ctx, 1, 10, 2, 4, P.greenDark);
  rect(ctx, 11, 10, 2, 4, P.greenDark);
  // Webbed toes
  px(ctx, 0, 13, P.greenDark); px(ctx, 2, 14, P.greenDark); px(ctx, 1, 14, P.greenDark);
  px(ctx, 12, 13, P.greenDark); px(ctx, 13, 14, P.greenDark); px(ctx, 12, 14, P.greenDark);
  // Shadow
  rect(ctx, 2, 15, 10, 1, '#00000020');
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, 'mob_poison_frog');
}

function drawLurker(scene: Phaser.Scene): void {
  const w = 20, h = 24;
  const ctx = makeCanvas(scene, 'mob_bog_lurker', w, h);
  // Tendrils / head fins
  px(ctx, 6, 0, P.swampDark); px(ctx, 7, 1, P.swampDark);
  px(ctx, 10, 0, P.swampDark); px(ctx, 11, 1, P.swampDark);
  px(ctx, 13, 0, P.swampDark); px(ctx, 14, 1, P.swampDark);
  px(ctx, 5, 1, P.swampDark); px(ctx, 15, 1, P.swampDark);
  // Head
  rect(ctx, 4, 2, 12, 7, P.swampGreen);
  rect(ctx, 5, 3, 10, 5, P.swampDark);
  // Slime drip on face
  px(ctx, 7, 7, P.slimeGreen); px(ctx, 12, 7, P.slimeGreen);
  // Eyes — glowing
  rect(ctx, 6, 4, 3, 3, P.slimeLight);
  rect(ctx, 11, 4, 3, 3, P.slimeLight);
  px(ctx, 7, 5, P.slimeGreen); px(ctx, 12, 5, P.slimeGreen); // pupils
  // Mouth with teeth
  rect(ctx, 6, 7, 8, 2, P.swampDark);
  px(ctx, 7, 8, P.offWhite); px(ctx, 9, 8, P.offWhite); px(ctx, 11, 8, P.offWhite);
  // Body — hunched, wide
  rect(ctx, 3, 9, 14, 10, P.swampGreen);
  rect(ctx, 4, 10, 12, 8, P.swampDark);
  // Belly mucus
  rect(ctx, 7, 12, 6, 5, P.swampGreen);
  px(ctx, 8, 13, P.slimeGreen); px(ctx, 11, 14, P.slimeGreen);
  // Slime drips off body
  px(ctx, 4, 19, P.swampDark); px(ctx, 5, 20, P.swampDark);
  px(ctx, 14, 19, P.swampDark); px(ctx, 15, 20, P.swampDark);
  // Legs — stumpy
  rect(ctx, 4, 19, 4, 4, P.swampGreen);
  rect(ctx, 12, 19, 4, 4, P.swampGreen);
  rect(ctx, 5, 20, 2, 3, P.swampDark);
  rect(ctx, 13, 20, 2, 3, P.swampDark);
  // Claws
  px(ctx, 3, 22, P.swampDark); px(ctx, 4, 23, P.swampDark); px(ctx, 7, 23, P.swampDark);
  px(ctx, 12, 23, P.swampDark); px(ctx, 15, 23, P.swampDark); px(ctx, 16, 22, P.swampDark);
  // Shadow
  rect(ctx, 3, 23, 14, 1, '#00000030');
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, 'mob_bog_lurker');
}

function drawElemental(scene: Phaser.Scene, key: string, core: string, glow: string, bright: string): void {
  const w = 18, h = 16;
  const ctx = makeCanvas(scene, key, w, h);
  // Outer glow / body flame
  rect(ctx, 4, 5, 10, 9, glow);
  rect(ctx, 5, 4, 8, 2, glow);
  rect(ctx, 6, 3, 6, 2, glow);
  // Core body
  rect(ctx, 6, 6, 6, 7, core);
  rect(ctx, 5, 7, 8, 5, core);
  // Bright center
  rect(ctx, 7, 7, 4, 3, bright);
  px(ctx, 8, 6, bright);
  // Top flames — 3 tongues
  rect(ctx, 7, 1, 2, 3, glow);   // left flame
  rect(ctx, 9, 0, 2, 4, core);   // center tall flame
  rect(ctx, 11, 2, 2, 2, glow);  // right flame
  px(ctx, 9, 0, bright); px(ctx, 10, 0, bright);
  // Side wisps
  rect(ctx, 2, 7, 3, 2, glow);
  rect(ctx, 13, 6, 3, 2, glow);
  px(ctx, 3, 6, glow); px(ctx, 14, 8, glow);
  px(ctx, 2, 9, core); px(ctx, 15, 7, core);
  // Eyes (dark pupils in the bright center)
  rect(ctx, 7, 8, 2, 2, P.outline);
  rect(ctx, 11, 8, 2, 2, P.outline);
  px(ctx, 8, 8, glow); px(ctx, 12, 8, glow);  // inner reflection
  // Shadow
  rect(ctx, 5, 14, 8, 2, '#00000020');
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, key);
}

function drawBeast(scene: Phaser.Scene, key: string, body: string, accent: string): void {
  const w = 20, h = 24;
  const ctx = makeCanvas(scene, key, w, h);
  // Horns — swept back
  px(ctx, 5, 0, body); px(ctx, 4, 1, body); px(ctx, 3, 2, body);
  px(ctx, 14, 0, body); px(ctx, 15, 1, body); px(ctx, 16, 2, body);
  // Head — wide, menacing
  rect(ctx, 5, 1, 10, 7, accent);
  rect(ctx, 6, 2, 8, 5, body);
  // Snout
  rect(ctx, 7, 6, 6, 3, accent);
  // Eyes (red, menacing)
  rect(ctx, 6, 3, 3, 2, P.red);
  rect(ctx, 11, 3, 3, 2, P.red);
  px(ctx, 7, 3, P.redLight); px(ctx, 12, 3, P.redLight);
  // Nostrils
  px(ctx, 8, 7, body); px(ctx, 11, 7, body);
  // Teeth
  px(ctx, 8, 8, P.offWhite); px(ctx, 10, 8, P.offWhite); px(ctx, 12, 8, P.offWhite);
  // Neck
  rect(ctx, 7, 8, 6, 3, accent);
  // Body
  rect(ctx, 3, 10, 14, 9, body);
  rect(ctx, 4, 11, 12, 7, accent);
  // Fur texture / stripes
  rect(ctx, 6, 12, 2, 4, body);
  rect(ctx, 10, 11, 2, 5, body);
  rect(ctx, 14, 13, 2, 3, body);
  // Legs — 4 sturdy legs
  rect(ctx, 4, 19, 4, 4, body);
  rect(ctx, 12, 19, 4, 4, body);
  // Claws
  px(ctx, 3, 22, accent); px(ctx, 4, 23, accent); px(ctx, 7, 23, accent);
  px(ctx, 12, 23, accent); px(ctx, 15, 23, accent); px(ctx, 16, 22, accent);
  // Tail hint
  rect(ctx, 17, 11, 3, 5, body);
  px(ctx, 19, 10, body); px(ctx, 19, 16, body);
  // Shadow
  rect(ctx, 3, 23, 14, 1, '#00000030');
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, key);
}

function drawCorruptedNPC(scene: Phaser.Scene): void {
  const w = 20, h = 24;
  const ctx = makeCanvas(scene, 'mob_corrupted_npc', w, h);
  // Hair (messy, corruption tendrils)
  rect(ctx, 6, 0, 8, 3, P.purpleDark);
  px(ctx, 4, 1, P.purpleDark); px(ctx, 5, 2, P.purpleDark);
  px(ctx, 15, 1, P.purpleDark); px(ctx, 14, 2, P.purpleDark);
  // Corruption wisps from head
  px(ctx, 6, 0, P.purple); px(ctx, 9, 0, P.purpleLight); px(ctx, 13, 0, P.purple);
  // Head
  rect(ctx, 6, 3, 8, 7, P.skinShade);
  rect(ctx, 7, 4, 6, 5, P.skin);
  // Corruption on face (veins)
  px(ctx, 7, 5, P.purple); px(ctx, 8, 6, P.purple);
  px(ctx, 12, 5, P.purple); px(ctx, 11, 7, P.purple);
  // Eyes (glowing purple)
  rect(ctx, 8, 6, 2, 2, P.purpleLight);
  rect(ctx, 12, 6, 2, 2, P.purpleLight);
  px(ctx, 9, 6, P.white); px(ctx, 13, 6, P.white);
  // Mouth (sinister smile)
  px(ctx, 9, 8, P.purpleDark); px(ctx, 10, 9, P.purpleDark); px(ctx, 11, 8, P.purpleDark);
  // Neck
  rect(ctx, 9, 10, 4, 2, P.skinShade);
  // Body — tattered robes
  rect(ctx, 5, 11, 10, 8, P.purpleDark);
  rect(ctx, 6, 12, 8, 6, P.purple);
  // Robe details / tears
  rect(ctx, 8, 12, 4, 5, P.purpleDark);
  px(ctx, 7, 15, P.purpleLight); px(ctx, 12, 14, P.purpleLight);
  // Arms — with corruption veins
  rect(ctx, 3, 11, 3, 7, P.purpleDark);
  rect(ctx, 14, 11, 3, 7, P.purpleDark);
  rect(ctx, 4, 12, 1, 5, P.purple);
  rect(ctx, 15, 12, 1, 5, P.purple);
  // Hands with corruption
  rect(ctx, 3, 17, 3, 3, P.skinShade);
  rect(ctx, 14, 17, 3, 3, P.skinShade);
  px(ctx, 3, 18, P.purple); px(ctx, 16, 18, P.purple);
  // Legs
  rect(ctx, 6, 19, 3, 4, P.grayDark);
  rect(ctx, 11, 19, 3, 4, P.grayDark);
  rect(ctx, 7, 20, 1, 3, P.purpleDark);
  rect(ctx, 12, 20, 1, 3, P.purpleDark);
  // Corruption drips off arms/robes
  px(ctx, 4, 19, P.purple); px(ctx, 15, 19, P.purple);
  px(ctx, 7, 23, P.purple); px(ctx, 12, 23, P.purple);
  // Shadow
  rect(ctx, 5, 23, 10, 1, '#00000030');
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
  const w = 20, h = 30;
  const ctx = makeCanvas(scene, key, w, h);
  // Shadow
  rect(ctx, 5, 27, 10, 3, '#00000025');
  // Trunk — 3px wide, tall
  rect(ctx, 8, 16, 4, 13, trunk);
  rect(ctx, 9, 16, 2, 13, trunkDark);
  // Trunk texture / bark lines
  px(ctx, 8, 18, trunkDark); px(ctx, 10, 21, trunkDark);
  px(ctx, 8, 24, trunkDark); px(ctx, 11, 25, trunkDark);
  // Bottom root flares
  rect(ctx, 6, 26, 3, 2, trunk);
  rect(ctx, 11, 26, 3, 2, trunk);
  // Canopy — 3 overlapping circles / blobs
  // Bottom circle (widest)
  rect(ctx, 2, 13, 16, 6, leaf);
  rect(ctx, 1, 14, 18, 5, leaf);
  rect(ctx, 3, 12, 14, 2, leaf);
  // Middle circle
  rect(ctx, 3, 7, 14, 7, leaf);
  rect(ctx, 4, 6, 12, 2, leaf);
  rect(ctx, 2, 8, 16, 5, leaf);
  // Top circle (smallest)
  rect(ctx, 6, 2, 8, 6, leaf);
  rect(ctx, 7, 1, 6, 2, leaf);
  rect(ctx, 5, 3, 10, 5, leaf);
  // Leaf detail highlights — top-left of each cluster
  rect(ctx, 5, 14, 4, 2, leafLight);
  px(ctx, 4, 13, leafLight); px(ctx, 6, 12, leafLight);
  rect(ctx, 5, 8, 4, 2, leafLight);
  px(ctx, 5, 7, leafLight); px(ctx, 7, 6, leafLight);
  rect(ctx, 8, 3, 3, 2, leafLight);
  px(ctx, 8, 2, leafLight);
  // Darker leaf shading on bottom-right
  rect(ctx, 13, 15, 4, 3, trunkDark);
  rect(ctx, 14, 10, 3, 3, trunkDark);
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, key);
}

function drawRock(scene: Phaser.Scene, key: string, body: string, light: string, shade: string): void {
  const w = 16, h = 14;
  const ctx = makeCanvas(scene, key, w, h);
  // Shadow
  rect(ctx, 2, 12, 12, 2, '#00000020');
  // Main rock shape — chunky polygon
  rect(ctx, 3, 4, 10, 7, body);
  rect(ctx, 2, 5, 12, 6, body);
  rect(ctx, 4, 3, 8, 2, body);
  rect(ctx, 5, 2, 6, 1, body);
  // Second smaller rock behind/beside
  rect(ctx, 11, 6, 4, 4, shade);
  rect(ctx, 12, 5, 3, 1, shade);
  // Top-left facet highlight
  rect(ctx, 4, 4, 4, 2, light);
  px(ctx, 3, 5, light); px(ctx, 4, 3, light);
  px(ctx, 6, 3, light);
  // Bottom-right shading
  rect(ctx, 11, 8, 3, 3, shade);
  px(ctx, 12, 7, shade);
  // Cracks
  px(ctx, 7, 6, shade); px(ctx, 8, 7, shade); px(ctx, 6, 8, shade);
  px(ctx, 10, 5, shade); px(ctx, 11, 6, shade);
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, key);
}

function drawBush(scene: Phaser.Scene, key: string, dark: string, light: string, fruit: string): void {
  const w = 16, h = 14;
  const ctx = makeCanvas(scene, key, w, h);
  // Shadow
  rect(ctx, 2, 12, 12, 2, '#00000015');
  // Bush shape — 3 rounded lumps
  // Left lump
  rect(ctx, 1, 5, 6, 6, dark);
  rect(ctx, 2, 4, 4, 2, dark);
  // Right lump
  rect(ctx, 9, 5, 6, 6, dark);
  rect(ctx, 10, 4, 4, 2, dark);
  // Center lump (tallest)
  rect(ctx, 5, 3, 6, 8, dark);
  rect(ctx, 6, 2, 4, 2, dark);
  // Fill gaps
  rect(ctx, 3, 6, 10, 5, dark);
  // Light highlights — top of each lump
  rect(ctx, 3, 4, 2, 2, light);
  px(ctx, 3, 3, light);
  rect(ctx, 11, 4, 2, 2, light);
  px(ctx, 11, 3, light);
  rect(ctx, 7, 3, 2, 2, light);
  px(ctx, 7, 2, light);
  // Berries / fruits / flowers — scattered
  rect(ctx, 3, 7, 2, 2, fruit);
  rect(ctx, 7, 6, 2, 2, fruit);
  rect(ctx, 11, 7, 2, 2, fruit);
  px(ctx, 5, 9, fruit);
  px(ctx, 9, 9, fruit);
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, key);
}

function drawOre(scene: Phaser.Scene, key: string, rock: string, shade: string, ore: string): void {
  const w = 16, h = 14;
  const ctx = makeCanvas(scene, key, w, h);
  // Shadow
  rect(ctx, 2, 12, 12, 2, '#00000020');
  // Rock base — chunky polygon
  rect(ctx, 2, 4, 12, 7, rock);
  rect(ctx, 1, 5, 14, 6, rock);
  rect(ctx, 3, 3, 10, 2, rock);
  rect(ctx, 5, 2, 6, 1, rock);
  // Darker shading on bottom-right face
  rect(ctx, 11, 7, 4, 4, shade);
  rect(ctx, 12, 6, 2, 1, shade);
  // Ore vein seams — clusters of dots
  rect(ctx, 4, 5, 2, 2, ore);
  px(ctx, 3, 6, ore); px(ctx, 5, 7, ore);
  rect(ctx, 9, 4, 2, 2, ore);
  px(ctx, 8, 5, ore); px(ctx, 10, 6, ore);
  rect(ctx, 6, 7, 2, 2, ore);
  px(ctx, 7, 9, ore); px(ctx, 5, 8, ore);
  // Sparkle/shine on ore
  px(ctx, 4, 5, P.white); px(ctx, 9, 4, P.white);
  px(ctx, 6, 7, P.white);
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, key);
}

function drawCrystal(scene: Phaser.Scene, key: string, body: string, light: string, bright: string): void {
  const w = 14, h = 22;
  const ctx = makeCanvas(scene, key, w, h);
  // Shadow
  rect(ctx, 2, 19, 10, 3, '#00000020');
  // Center shard — tall, pointed
  px(ctx, 6, 0, bright);  // tip
  px(ctx, 7, 0, light);
  rect(ctx, 5, 1, 4, 2, light);
  rect(ctx, 5, 3, 4, 14, body);
  rect(ctx, 4, 5, 6, 10, body);
  rect(ctx, 3, 8, 8, 7, body);
  // Left shard — shorter, angled
  px(ctx, 2, 5, light);  // tip
  px(ctx, 2, 6, light);
  rect(ctx, 2, 7, 3, 2, light);
  rect(ctx, 1, 9, 4, 8, body);
  rect(ctx, 2, 8, 3, 9, body);
  // Right shard — medium height
  px(ctx, 11, 3, light);  // tip
  px(ctx, 11, 4, light);
  rect(ctx, 10, 5, 3, 2, light);
  rect(ctx, 10, 7, 4, 10, body);
  rect(ctx, 9, 6, 4, 11, body);
  // Center shard highlight face
  rect(ctx, 5, 3, 2, 12, light);
  px(ctx, 5, 2, light);
  // Left shard highlight
  px(ctx, 2, 9, light); px(ctx, 2, 11, light); px(ctx, 2, 13, light);
  // Right shard highlight
  px(ctx, 10, 7, light); px(ctx, 10, 9, light); px(ctx, 10, 11, light);
  // Dark face right side of center
  rect(ctx, 8, 5, 2, 12, P.outlineLight);
  // Bright sparkles
  px(ctx, 6, 1, bright); px(ctx, 5, 4, bright);
  px(ctx, 2, 6, bright); px(ctx, 11, 4, bright);
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, key);
}

function drawMushroom(scene: Phaser.Scene, key: string, cap: string, capLight: string, stem: string): void {
  const w = 14, h = 18;
  const ctx = makeCanvas(scene, key, w, h);
  // Shadow
  rect(ctx, 2, 16, 10, 2, '#00000015');
  // Stem — visible gills/skirt at base of cap
  rect(ctx, 5, 10, 4, 7, stem);
  rect(ctx, 4, 10, 6, 7, stem);
  rect(ctx, 6, 10, 2, 7, P.offWhite);  // stem highlight
  // Gills (underside of cap)
  rect(ctx, 3, 9, 8, 2, P.offWhite);
  px(ctx, 2, 10, P.offWhite); px(ctx, 11, 10, P.offWhite);
  px(ctx, 4, 10, stem); px(ctx, 6, 10, stem); px(ctx, 8, 10, stem); px(ctx, 10, 10, stem);
  // Cap — wide dome
  rect(ctx, 2, 4, 10, 6, cap);
  rect(ctx, 1, 5, 12, 5, cap);
  rect(ctx, 3, 3, 8, 2, cap);
  rect(ctx, 5, 2, 4, 1, cap);
  // Highlight area on cap (top-left)
  rect(ctx, 4, 4, 4, 3, capLight);
  px(ctx, 5, 3, capLight); px(ctx, 3, 5, capLight);
  // Spots — large and small
  rect(ctx, 3, 6, 2, 2, capLight);
  rect(ctx, 8, 5, 2, 2, capLight);
  rect(ctx, 6, 7, 3, 2, capLight);
  px(ctx, 10, 7, capLight); px(ctx, 2, 7, capLight);
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, key);
}

function drawReeds(scene: Phaser.Scene, key: string, stalk: string, dark: string): void {
  const w = 12, h = 22;
  const ctx = makeCanvas(scene, key, w, h);
  // Shadow
  rect(ctx, 1, 20, 10, 2, '#00000010');
  // 5 stalks at slightly different heights and x positions
  // Stalk 1 (leftmost)
  for (let y = 9; y < 20; y++) { px(ctx, 1, y, stalk); }
  // Stalk 2
  for (let y = 6; y < 20; y++) { px(ctx, 3, y, dark); }
  // Stalk 3 (tallest center)
  for (let y = 4; y < 20; y++) { px(ctx, 5, y, stalk); px(ctx, 6, y, stalk); }
  // Stalk 4
  for (let y = 7; y < 20; y++) { px(ctx, 8, y, dark); }
  // Stalk 5 (rightmost)
  for (let y = 10; y < 20; y++) { px(ctx, 10, y, stalk); }
  // Fluffy seed heads — wider oval shapes
  rect(ctx, 0, 6, 3, 4, stalk);  // head 1
  rect(ctx, 2, 3, 3, 4, dark);   // head 2
  rect(ctx, 4, 1, 3, 4, stalk);  // head 3 (tallest)
  px(ctx, 5, 0, dark); px(ctx, 6, 0, dark);
  rect(ctx, 7, 4, 3, 4, dark);   // head 4
  rect(ctx, 9, 7, 3, 3, stalk);  // head 5
  // Seed head highlights
  px(ctx, 1, 7, P.greenLight); px(ctx, 3, 4, P.greenLight);
  px(ctx, 5, 2, P.greenLight); px(ctx, 8, 5, P.greenLight);
  px(ctx, 10, 8, P.greenLight);
  drawSpriteOutline(ctx, w, h, P.outline);
  finalize(scene, key);
}

// ─── STATION TEXTURES ────────────────────────────────────

function generateStationTextures(scene: Phaser.Scene): void {
  // station_campfire: 28x24
  {
    const w = 28, h = 24;
    const ctx = makeCanvas(scene, 'station_campfire', w, h);
    // Stone ring
    rect(ctx, 6, 17, 16, 4, P.gray);
    rect(ctx, 4, 18, 20, 3, P.gray);
    rect(ctx, 5, 17, 18, 1, P.grayLight);  // top stone highlight
    outline(ctx, 4, 17, 20, 5, P.grayDark);
    // Logs — X pattern inside ring
    rect(ctx, 6, 15, 8, 4, P.brown);
    rect(ctx, 14, 15, 8, 4, P.brown);
    rect(ctx, 5, 16, 18, 3, P.brownDark);
    // Log texture details
    px(ctx, 8, 17, P.brownLight); px(ctx, 12, 16, P.brownLight);
    px(ctx, 17, 17, P.brownLight); px(ctx, 21, 16, P.brownLight);
    // Embers / coal at base
    rect(ctx, 11, 16, 6, 2, P.lava);
    px(ctx, 10, 17, P.magma); px(ctx, 17, 17, P.magma);
    // Flame layers — bottom wide, top narrow
    rect(ctx, 9, 9, 10, 7, P.lava);
    rect(ctx, 10, 7, 8, 5, P.lavaLight);
    rect(ctx, 11, 5, 6, 4, P.lavaLight);
    rect(ctx, 12, 3, 4, 4, P.magma);
    rect(ctx, 13, 1, 2, 4, P.yellow);
    // Side wisps
    px(ctx, 8, 10, P.lavaLight); px(ctx, 19, 11, P.lavaLight);
    px(ctx, 9, 7, P.magma); px(ctx, 18, 8, P.magma);
    // Ember glow around base
    px(ctx, 7, 16, P.yellow); px(ctx, 20, 16, P.yellow);
    px(ctx, 10, 15, P.magma); px(ctx, 17, 15, P.magma);
    // Shadow under fire
    rect(ctx, 6, 22, 16, 2, '#00000020');
    drawSpriteOutline(ctx, w, h, P.outline);
    finalize(scene, 'station_campfire');
  }

  // station_workbench: 28x24
  {
    const w = 28, h = 24;
    const ctx = makeCanvas(scene, 'station_workbench', w, h);
    // Table top surface
    rect(ctx, 1, 5, 26, 7, P.brownLight);
    rect(ctx, 1, 5, 26, 2, P.offWhite);     // top highlight
    rect(ctx, 1, 10, 26, 2, P.brownDark);   // bottom shadow of top
    outline(ctx, 1, 5, 26, 7, P.brownDark);
    // Wood plank lines on surface
    rect(ctx, 7, 6, 1, 6, P.brown);
    rect(ctx, 14, 6, 1, 6, P.brown);
    rect(ctx, 21, 6, 1, 6, P.brown);
    // Table legs (sturdy)
    rect(ctx, 2, 12, 5, 11, P.brown);
    rect(ctx, 21, 12, 5, 11, P.brown);
    rect(ctx, 3, 12, 3, 11, P.brownLight);  // leg highlight
    rect(ctx, 22, 12, 3, 11, P.brownLight);
    rect(ctx, 3, 21, 3, 2, P.brownDark);    // foot
    rect(ctx, 22, 21, 3, 2, P.brownDark);
    // Cross brace
    rect(ctx, 7, 17, 14, 2, P.brownDark);
    rect(ctx, 7, 17, 14, 1, P.brown);
    // Tools on table
    rect(ctx, 4, 3, 6, 2, P.grayLight);    // metal piece
    rect(ctx, 4, 3, 6, 1, P.white);
    rect(ctx, 12, 2, 3, 3, P.gray);        // handle/tool
    px(ctx, 13, 2, P.grayLight);
    rect(ctx, 18, 1, 6, 4, P.brownLight);  // plank on table
    rect(ctx, 18, 1, 6, 1, P.offWhite);
    // Shadow
    rect(ctx, 2, 23, 24, 1, '#00000020');
    drawSpriteOutline(ctx, w, h, P.outline);
    finalize(scene, 'station_workbench');
  }

  // station_forge: 28x24
  {
    const w = 28, h = 24;
    const ctx = makeCanvas(scene, 'station_forge', w, h);
    // Base body — wide stone furnace
    rect(ctx, 2, 7, 24, 15, P.grayDeep);
    rect(ctx, 2, 7, 24, 3, P.grayDark);    // top face
    outline(ctx, 2, 7, 24, 15, P.outline);
    // Side bolts/rivets
    rect(ctx, 2, 9, 2, 2, P.gray); rect(ctx, 2, 15, 2, 2, P.gray);
    rect(ctx, 24, 9, 2, 2, P.gray); rect(ctx, 24, 15, 2, 2, P.gray);
    // Forge opening — large glowing mouth
    rect(ctx, 7, 11, 14, 9, P.lavaDark);
    rect(ctx, 8, 12, 12, 7, P.lava);
    rect(ctx, 9, 13, 10, 5, P.lavaLight);
    rect(ctx, 11, 14, 6, 3, P.magma);
    px(ctx, 13, 14, P.yellow); px(ctx, 14, 14, P.yellow);
    // Arch above opening
    rect(ctx, 7, 9, 14, 3, P.grayDark);
    rect(ctx, 8, 9, 12, 2, P.gray);
    px(ctx, 9, 8, P.grayDark); px(ctx, 10, 8, P.grayDark);
    px(ctx, 17, 8, P.grayDark); px(ctx, 18, 8, P.grayDark);
    // Chimney — double-wide
    rect(ctx, 9, 1, 10, 7, P.grayDark);
    rect(ctx, 10, 1, 8, 7, P.grayDeep);
    outline(ctx, 9, 1, 10, 7, P.outline);
    // Smoke puffs
    rect(ctx, 11, 0, 3, 1, P.grayLight);
    rect(ctx, 14, 0, 3, 1, P.gray);
    px(ctx, 10, 0, P.grayLight); px(ctx, 17, 0, P.gray);
    // Heat glow from opening
    px(ctx, 6, 14, P.lava); px(ctx, 21, 14, P.lava);
    px(ctx, 6, 16, P.lavaDark); px(ctx, 21, 16, P.lavaDark);
    // Shadow
    rect(ctx, 2, 22, 24, 2, '#00000030');
    drawSpriteOutline(ctx, w, h, P.outline);
    finalize(scene, 'station_forge');
  }
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

// ─── ITEM ICONS ─────────────────────────────────────────

/**
 * Generates 10x10 pixel-art icons for every item. Texture key: `item_<id>`.
 */
export function generateItemIcons(scene: Phaser.Scene): void {
  // ── Resources: natural ────────────────────────────────

  // wood — two stacked logs with visible grain
  {
    const ctx = makeCanvas(scene, 'item_wood', 10, 10);
    // Bottom log
    rect(ctx, 1, 5, 8, 3, P.brown);
    rect(ctx, 1, 5, 8, 1, P.brownLight);
    px(ctx, 3, 6, P.brownDark); px(ctx, 6, 6, P.brownDark); // grain lines
    // Top log (offset)
    rect(ctx, 2, 2, 7, 3, P.brownLight);
    rect(ctx, 2, 2, 7, 1, '#c8905a');
    px(ctx, 4, 3, P.brown); px(ctx, 7, 3, P.brown); // grain
    // Cut end circles
    px(ctx, 1, 6, P.brownDark); px(ctx, 8, 6, P.brownDark);
    px(ctx, 2, 3, P.brown); px(ctx, 8, 3, P.brown);
    // Ring detail on cut end
    px(ctx, 8, 5, '#d4a06a');
    px(ctx, 8, 2, '#d4a06a');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_wood');
  }

  // stone — chunky rock with facets and highlight
  {
    const ctx = makeCanvas(scene, 'item_stone', 10, 10);
    // Main body
    rect(ctx, 1, 4, 8, 4, P.gray);
    rect(ctx, 2, 3, 7, 1, P.gray);
    rect(ctx, 3, 2, 5, 1, P.grayLight);
    // Top facet (lighter)
    rect(ctx, 2, 3, 3, 2, P.grayLight);
    px(ctx, 3, 2, P.grayLight);
    // Bottom-right shadow
    rect(ctx, 6, 6, 3, 2, P.grayDark);
    px(ctx, 8, 5, P.grayDark);
    // Specular highlight
    px(ctx, 3, 3, '#c8c8c8');
    px(ctx, 4, 3, '#c8c8c8');
    // Crack detail
    px(ctx, 5, 5, P.grayDark);
    px(ctx, 6, 4, P.grayDark);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_stone');
  }

  // berries — three red circles
  {
    const ctx = makeCanvas(scene, 'item_berries', 10, 10);
    // Berry 1 (left)
    rect(ctx, 1, 5, 3, 3, P.red);
    px(ctx, 2, 4, P.red);
    px(ctx, 2, 5, P.redLight);
    // Berry 2 (right)
    rect(ctx, 5, 5, 3, 3, P.red);
    px(ctx, 6, 4, P.red);
    px(ctx, 6, 5, P.redLight);
    // Berry 3 (top center)
    rect(ctx, 3, 2, 3, 3, P.red);
    px(ctx, 4, 2, P.redLight);
    // Stems
    px(ctx, 2, 3, P.greenDark);
    px(ctx, 6, 3, P.greenDark);
    px(ctx, 4, 1, P.greenDark);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_berries');
  }

  // herbs — green leaf shape
  {
    const ctx = makeCanvas(scene, 'item_herbs', 10, 10);
    // Stem
    rect(ctx, 4, 6, 1, 3, P.greenDark);
    // Leaf
    rect(ctx, 3, 3, 4, 4, P.green);
    rect(ctx, 2, 4, 6, 2, P.green);
    rect(ctx, 3, 2, 4, 1, P.greenLight);
    px(ctx, 4, 3, P.greenLight);
    px(ctx, 5, 5, P.greenDark);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_herbs');
  }

  // meat — pink/red raw chunk
  {
    const ctx = makeCanvas(scene, 'item_meat', 10, 10);
    rect(ctx, 2, 3, 6, 5, '#cd5c5c');
    rect(ctx, 3, 2, 4, 1, '#cd5c5c');
    rect(ctx, 2, 3, 6, 1, '#e07070'); // highlight
    rect(ctx, 3, 4, 2, 2, '#f08080'); // fat streak
    rect(ctx, 2, 7, 6, 1, '#a03030'); // shadow
    // bone nub
    rect(ctx, 7, 4, 2, 3, P.offWhite);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_meat');
  }

  // hide — flat tan square with darker edges
  {
    const ctx = makeCanvas(scene, 'item_hide', 10, 10);
    rect(ctx, 1, 2, 8, 6, '#deb887');
    rect(ctx, 2, 3, 6, 4, '#c9a87a');
    rect(ctx, 1, 2, 8, 1, '#e8c99a'); // highlight
    rect(ctx, 1, 7, 8, 1, '#a07855'); // shadow
    rect(ctx, 1, 2, 1, 6, '#a07855'); // left edge
    rect(ctx, 8, 2, 1, 6, '#a07855'); // right edge
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_hide');
  }

  // bone — two bulbs connected by thin bar
  {
    const ctx = makeCanvas(scene, 'item_bone', 10, 10);
    // Top bulb
    rect(ctx, 3, 1, 3, 2, P.offWhite);
    rect(ctx, 2, 2, 5, 1, P.offWhite);
    // Shaft
    rect(ctx, 4, 3, 1, 4, P.offWhite);
    px(ctx, 5, 3, P.grayLight);
    // Bottom bulb
    rect(ctx, 3, 7, 3, 2, P.offWhite);
    rect(ctx, 2, 7, 5, 1, P.offWhite);
    // Highlights
    px(ctx, 4, 1, P.white);
    px(ctx, 4, 7, P.white);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_bone');
  }

  // slime_gel — green blob/droplet
  {
    const ctx = makeCanvas(scene, 'item_slime_gel', 10, 10);
    rect(ctx, 3, 5, 4, 4, P.slimeGreen);
    rect(ctx, 2, 6, 6, 2, P.slimeGreen);
    // Droplet tip
    rect(ctx, 4, 2, 2, 3, P.slimeGreen);
    px(ctx, 4, 1, P.slimeGreen);
    // Highlights
    px(ctx, 3, 6, P.slimeLight);
    px(ctx, 4, 5, P.slimeLight);
    rect(ctx, 2, 7, 6, 1, P.slimeDark); // shadow
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_slime_gel');
  }

  // iron_ore — dark rock with silver sparkles
  {
    const ctx = makeCanvas(scene, 'item_iron_ore', 10, 10);
    rect(ctx, 2, 3, 6, 5, P.grayDark);
    rect(ctx, 3, 2, 4, 1, P.grayDark);
    rect(ctx, 2, 3, 6, 1, P.gray);
    rect(ctx, 2, 7, 6, 1, P.grayDeep);
    // Silver sparkles
    px(ctx, 3, 4, P.grayLight);
    px(ctx, 5, 5, P.grayLight);
    px(ctx, 7, 4, P.white);
    px(ctx, 4, 6, P.grayLight);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_iron_ore');
  }

  // copper_ore — dark rock with copper/orange sparkles
  {
    const ctx = makeCanvas(scene, 'item_copper_ore', 10, 10);
    rect(ctx, 2, 3, 6, 5, P.grayDark);
    rect(ctx, 3, 2, 4, 1, P.grayDark);
    rect(ctx, 2, 3, 6, 1, P.gray);
    rect(ctx, 2, 7, 6, 1, P.grayDeep);
    // Copper sparkles
    px(ctx, 3, 4, '#b87333');
    px(ctx, 5, 5, '#d4863a');
    px(ctx, 7, 4, '#e0963c');
    px(ctx, 4, 6, '#b87333');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_copper_ore');
  }

  // coal — very dark chunk
  {
    const ctx = makeCanvas(scene, 'item_coal', 10, 10);
    rect(ctx, 2, 3, 6, 5, '#2f2f2f');
    rect(ctx, 3, 2, 4, 1, '#2f2f2f');
    rect(ctx, 2, 3, 6, 1, '#4a4a4a');
    rect(ctx, 2, 7, 6, 1, '#1a1a1a');
    px(ctx, 3, 4, '#3d3d3d');
    px(ctx, 6, 5, '#1a1a1a');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_coal');
  }

  // crystal — blue pointed shard
  {
    const ctx = makeCanvas(scene, 'item_crystal', 10, 10);
    // Pointed top
    px(ctx, 4, 1, '#87ceeb');
    px(ctx, 5, 1, '#87ceeb');
    rect(ctx, 3, 2, 4, 2, '#87ceeb');
    rect(ctx, 3, 4, 4, 4, '#87ceeb');
    // Facets
    rect(ctx, 3, 2, 1, 6, '#b0e0ff');
    rect(ctx, 3, 4, 4, 1, '#b0e0ff');
    rect(ctx, 6, 5, 1, 3, '#5b9ab5');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_crystal');
  }

  // iron_ingot — silver/blue rectangular ingot
  {
    const ctx = makeCanvas(scene, 'item_iron_ingot', 10, 10);
    rect(ctx, 1, 3, 8, 5, '#b0c4de');
    rect(ctx, 2, 2, 6, 1, '#b0c4de');
    rect(ctx, 1, 3, 8, 1, '#d0d8e8'); // top highlight
    rect(ctx, 1, 7, 8, 1, '#7a8fa0'); // bottom shadow
    rect(ctx, 1, 3, 1, 5, '#d0d8e8'); // left highlight
    rect(ctx, 8, 3, 1, 5, '#7a8fa0'); // right shadow
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_iron_ingot');
  }

  // wood_plank — flat tan plank
  {
    const ctx = makeCanvas(scene, 'item_wood_plank', 10, 10);
    rect(ctx, 1, 3, 8, 4, '#deb887');
    rect(ctx, 1, 3, 8, 1, '#e8c99a'); // highlight
    rect(ctx, 1, 6, 8, 1, '#a07855'); // shadow
    // Wood grain
    px(ctx, 2, 4, '#c9a87a');
    px(ctx, 4, 5, '#c9a87a');
    px(ctx, 6, 4, '#c9a87a');
    px(ctx, 8, 5, '#c9a87a');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_wood_plank');
  }

  // rare_mushroom — purple mushroom cap
  {
    const ctx = makeCanvas(scene, 'item_rare_mushroom', 10, 10);
    // Cap
    rect(ctx, 2, 2, 6, 4, P.purple);
    rect(ctx, 1, 4, 8, 2, P.purple);
    rect(ctx, 2, 2, 6, 1, P.purpleLight); // highlight
    // Spots
    px(ctx, 3, 3, P.purpleLight);
    px(ctx, 6, 4, P.purpleLight);
    // Stem
    rect(ctx, 4, 6, 2, 3, P.offWhite);
    px(ctx, 3, 6, '#e0d8c0');
    px(ctx, 6, 6, '#e0d8c0');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_rare_mushroom');
  }

  // swamp_reed — green thin stalks
  {
    const ctx = makeCanvas(scene, 'item_swamp_reed', 10, 10);
    // Three stalks
    rect(ctx, 2, 3, 1, 6, P.swampGreen);
    rect(ctx, 4, 1, 1, 8, P.swampGreen);
    rect(ctx, 7, 2, 1, 7, P.swampGreen);
    // Tips/seed heads
    rect(ctx, 1, 2, 3, 1, '#4a6a2a');
    rect(ctx, 3, 0, 3, 1, '#4a6a2a');
    rect(ctx, 6, 1, 3, 1, '#4a6a2a');
    // Highlights
    px(ctx, 4, 3, P.greenLight);
    px(ctx, 7, 4, P.greenLight);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_swamp_reed');
  }

  // obsidian — very dark purple/black angular shard
  {
    const ctx = makeCanvas(scene, 'item_obsidian', 10, 10);
    px(ctx, 4, 1, '#1a1a2e');
    px(ctx, 5, 1, '#1a1a2e');
    rect(ctx, 3, 2, 4, 2, '#1a1a2e');
    rect(ctx, 2, 4, 6, 3, '#1a1a2e');
    rect(ctx, 3, 7, 4, 2, '#1a1a2e');
    // Highlight facets
    rect(ctx, 3, 2, 1, 3, '#2d2d4e');
    px(ctx, 4, 4, '#3a2a5e');
    px(ctx, 3, 6, '#2d2d4e');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_obsidian');
  }

  // fire_crystal — red/orange pointed shard
  {
    const ctx = makeCanvas(scene, 'item_fire_crystal', 10, 10);
    px(ctx, 4, 1, P.lava);
    px(ctx, 5, 1, P.lava);
    rect(ctx, 3, 2, 4, 2, P.lava);
    rect(ctx, 3, 4, 4, 4, P.lava);
    // Facets
    rect(ctx, 3, 2, 1, 6, P.lavaLight);
    px(ctx, 4, 4, P.magma);
    rect(ctx, 6, 5, 1, 3, P.lavaDark);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_fire_crystal');
  }

  // rare_ore — dark rock with gold sparkles
  {
    const ctx = makeCanvas(scene, 'item_rare_ore', 10, 10);
    rect(ctx, 2, 3, 6, 5, P.grayDark);
    rect(ctx, 3, 2, 4, 1, P.grayDark);
    rect(ctx, 2, 3, 6, 1, P.gray);
    rect(ctx, 2, 7, 6, 1, P.grayDeep);
    // Gold sparkles
    px(ctx, 3, 4, P.yellow);
    px(ctx, 5, 5, P.yellow);
    px(ctx, 7, 4, '#ffe060');
    px(ctx, 4, 6, P.yellow);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_rare_ore');
  }

  // shadow_essence — dark purple wispy
  {
    const ctx = makeCanvas(scene, 'item_shadow_essence', 10, 10);
    // Wispy tendrils
    px(ctx, 4, 1, P.purpleDark);
    px(ctx, 5, 1, P.purpleDark);
    rect(ctx, 3, 2, 4, 2, P.purpleDark);
    rect(ctx, 2, 4, 6, 3, P.purpleDark);
    rect(ctx, 3, 7, 4, 1, P.purpleDark);
    px(ctx, 2, 5, P.purple);
    px(ctx, 7, 4, P.purple);
    px(ctx, 4, 3, P.purpleLight);
    px(ctx, 3, 6, P.purpleDark);
    px(ctx, 6, 7, P.purpleDark);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_shadow_essence');
  }

  // void_crystal — bright purple shard
  {
    const ctx = makeCanvas(scene, 'item_void_crystal', 10, 10);
    px(ctx, 4, 1, P.purpleLight);
    px(ctx, 5, 1, P.purpleLight);
    rect(ctx, 3, 2, 4, 2, P.purpleLight);
    rect(ctx, 3, 4, 4, 4, P.purpleLight);
    // Facets
    rect(ctx, 3, 2, 1, 6, '#c070f0');
    px(ctx, 4, 4, '#d090ff');
    rect(ctx, 6, 5, 1, 3, P.purple);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_void_crystal');
  }

  // corrupted_wood — dark purple log
  {
    const ctx = makeCanvas(scene, 'item_corrupted_wood', 10, 10);
    rect(ctx, 1, 3, 8, 4, P.purpleDark);
    rect(ctx, 1, 3, 8, 1, P.purple);  // highlight top
    rect(ctx, 1, 6, 8, 1, '#1a0033'); // shadow bottom
    // End rings
    rect(ctx, 1, 3, 2, 4, P.purple);
    px(ctx, 2, 4, P.purpleDark);
    px(ctx, 2, 5, P.purpleDark);
    rect(ctx, 7, 3, 2, 4, P.purple);
    px(ctx, 7, 4, P.purpleDark);
    px(ctx, 7, 5, P.purpleDark);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_corrupted_wood');
  }

  // ── Tools & Weapons ────────────────────────────────────

  // wooden_axe — brown handle + gray head
  {
    const ctx = makeCanvas(scene, 'item_wooden_axe', 10, 10);
    // Handle
    rect(ctx, 4, 5, 2, 5, P.brown);
    // Axe head
    rect(ctx, 2, 1, 4, 5, P.gray);
    rect(ctx, 2, 1, 4, 1, P.grayLight);
    rect(ctx, 2, 5, 4, 1, P.grayDark);
    rect(ctx, 2, 1, 1, 5, P.grayLight);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_wooden_axe');
  }

  // wooden_pickaxe — brown handle + pointed head
  {
    const ctx = makeCanvas(scene, 'item_wooden_pickaxe', 10, 10);
    // Handle (angled)
    rect(ctx, 4, 4, 2, 5, P.brown);
    // Pick head (horizontal)
    rect(ctx, 1, 2, 8, 2, P.gray);
    rect(ctx, 1, 2, 8, 1, P.grayLight);
    // Points
    px(ctx, 0, 3, P.gray);
    px(ctx, 9, 3, P.gray);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_wooden_pickaxe');
  }

  // wooden_sword — brown handle + blade pointing up
  {
    const ctx = makeCanvas(scene, 'item_wooden_sword', 10, 10);
    // Blade
    rect(ctx, 4, 1, 2, 6, P.brownLight);
    px(ctx, 4, 0, P.brown);
    px(ctx, 5, 0, P.brown);
    rect(ctx, 4, 1, 1, 6, P.offWhite);
    // Guard
    rect(ctx, 2, 7, 6, 1, P.brown);
    // Handle
    rect(ctx, 4, 8, 2, 2, P.brownDark);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_wooden_sword');
  }

  // iron_sword — silver blade pointing up
  {
    const ctx = makeCanvas(scene, 'item_iron_sword', 10, 10);
    // Blade
    rect(ctx, 4, 1, 2, 6, P.grayLight);
    px(ctx, 4, 0, P.gray);
    px(ctx, 5, 0, P.gray);
    rect(ctx, 4, 1, 1, 6, P.white);
    rect(ctx, 5, 3, 1, 4, P.grayDark);
    // Guard
    rect(ctx, 2, 7, 6, 1, '#8fa8c0');
    // Handle
    rect(ctx, 4, 8, 2, 2, '#5a6a7a');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_iron_sword');
  }

  // iron_armor — silver chestplate shape
  {
    const ctx = makeCanvas(scene, 'item_iron_armor', 10, 10);
    // Shoulders
    rect(ctx, 1, 2, 3, 2, P.gray);
    rect(ctx, 6, 2, 3, 2, P.gray);
    // Chest
    rect(ctx, 1, 4, 8, 5, P.gray);
    rect(ctx, 2, 2, 6, 7, P.gray);
    // Neck opening
    rect(ctx, 3, 2, 4, 2, '#0f172a');
    // Highlights
    rect(ctx, 2, 4, 1, 5, P.grayLight);
    rect(ctx, 2, 4, 6, 1, P.grayLight);
    // Center line
    px(ctx, 4, 5, P.grayDark);
    px(ctx, 5, 5, P.grayDark);
    px(ctx, 4, 6, P.grayDark);
    px(ctx, 5, 6, P.grayDark);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_iron_armor');
  }

  // ── Consumables ────────────────────────────────────────

  // bandage — white rolled bandage
  {
    const ctx = makeCanvas(scene, 'item_bandage', 10, 10);
    // Roll shape
    rect(ctx, 2, 3, 6, 5, P.offWhite);
    rect(ctx, 2, 3, 6, 1, P.white);
    rect(ctx, 2, 7, 6, 1, '#c8c0b8');
    // Cross symbol
    rect(ctx, 4, 4, 2, 3, P.red);
    rect(ctx, 3, 5, 4, 1, P.red);
    // End tuck lines
    px(ctx, 2, 5, '#c8c0b8');
    px(ctx, 7, 4, '#c8c0b8');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_bandage');
  }

  // cooked_meat — brown cooked drumstick
  {
    const ctx = makeCanvas(scene, 'item_cooked_meat', 10, 10);
    // Meat chunk
    rect(ctx, 2, 2, 5, 5, '#cd853f');
    rect(ctx, 2, 2, 5, 1, '#d99a58');
    rect(ctx, 2, 6, 5, 1, '#8b5e27');
    rect(ctx, 3, 3, 2, 2, '#b8762e');
    // Bone handle
    rect(ctx, 6, 5, 2, 4, P.offWhite);
    px(ctx, 5, 7, P.offWhite);
    px(ctx, 5, 8, P.offWhite);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_cooked_meat');
  }

  // health_potion — red bottle
  {
    const ctx = makeCanvas(scene, 'item_health_potion', 10, 10);
    // Cork
    rect(ctx, 4, 1, 2, 1, '#c8a060');
    // Neck
    rect(ctx, 4, 2, 2, 2, P.grayLight);
    // Bottle body
    rect(ctx, 2, 4, 6, 5, P.red);
    rect(ctx, 2, 4, 6, 1, P.redLight);
    rect(ctx, 2, 8, 6, 1, P.lavaDark);
    // Liquid highlight
    rect(ctx, 3, 5, 2, 3, P.redLight);
    px(ctx, 3, 5, '#ff9090');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_health_potion');
  }

  // ── Misc ───────────────────────────────────────────────

  // gold_coin — yellow circle with G
  {
    const ctx = makeCanvas(scene, 'item_gold_coin', 10, 10);
    // Coin circle
    rect(ctx, 3, 1, 4, 8, P.yellow);
    rect(ctx, 1, 3, 8, 4, P.yellow);
    rect(ctx, 2, 2, 6, 6, P.yellow);
    // Highlight
    rect(ctx, 2, 2, 1, 3, '#ffe080');
    rect(ctx, 2, 2, 3, 1, '#ffe080');
    // Shadow
    rect(ctx, 7, 5, 1, 3, '#c09010');
    rect(ctx, 5, 7, 2, 1, '#c09010');
    // "G" letter center
    px(ctx, 4, 4, P.brownDark);
    px(ctx, 5, 4, P.brownDark);
    px(ctx, 4, 5, P.brownDark);
    px(ctx, 5, 5, P.brownDark);
    px(ctx, 4, 6, P.brownDark);
    px(ctx, 5, 6, P.brownDark);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_gold_coin');
  }

  // recipe_scroll — tan rolled scroll
  {
    const ctx = makeCanvas(scene, 'item_recipe_scroll', 10, 10);
    // Scroll body
    rect(ctx, 2, 2, 6, 6, '#f5e6c8');
    rect(ctx, 2, 2, 6, 1, '#fff0d8');
    rect(ctx, 2, 7, 6, 1, '#c8b090');
    // End rolls
    rect(ctx, 1, 1, 8, 2, '#deb887');
    rect(ctx, 1, 7, 8, 2, '#deb887');
    rect(ctx, 1, 1, 1, 8, '#c9a87a');
    rect(ctx, 8, 1, 1, 8, '#c9a87a');
    // Text lines
    rect(ctx, 3, 4, 4, 1, '#8b7355');
    rect(ctx, 3, 5, 3, 1, '#8b7355');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_recipe_scroll');
  }

  // ── Tier 1 Crafted ────────────────────────────────────

  // bone_club — thick bone weapon
  {
    const ctx = makeCanvas(scene, 'item_bone_club', 10, 10);
    // Club head (wide top)
    rect(ctx, 2, 1, 5, 4, P.offWhite);
    rect(ctx, 2, 1, 5, 1, P.white);
    rect(ctx, 3, 4, 3, 1, P.offWhite);
    // Handle
    rect(ctx, 4, 5, 2, 4, '#c8b890');
    rect(ctx, 4, 5, 1, 4, P.offWhite);
    // Knuckle details
    px(ctx, 3, 2, P.grayLight);
    px(ctx, 5, 3, P.grayLight);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_bone_club');
  }

  // leather_armor — brown chestplate
  {
    const ctx = makeCanvas(scene, 'item_leather_armor', 10, 10);
    rect(ctx, 1, 2, 3, 2, '#c9a87a');
    rect(ctx, 6, 2, 3, 2, '#c9a87a');
    rect(ctx, 1, 4, 8, 5, '#c9a87a');
    rect(ctx, 2, 2, 6, 7, '#c9a87a');
    rect(ctx, 3, 2, 4, 2, '#0f172a');
    rect(ctx, 2, 4, 1, 5, '#deb887');
    rect(ctx, 2, 4, 6, 1, '#deb887');
    px(ctx, 4, 5, '#a07855');
    px(ctx, 5, 5, '#a07855');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_leather_armor');
  }

  // stone_axe — stone head + wood handle
  {
    const ctx = makeCanvas(scene, 'item_stone_axe', 10, 10);
    rect(ctx, 4, 5, 2, 5, P.brown);
    rect(ctx, 2, 1, 4, 5, P.gray);
    rect(ctx, 2, 1, 4, 1, P.grayLight);
    rect(ctx, 2, 5, 4, 1, P.grayDark);
    px(ctx, 3, 3, P.grayLight);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_stone_axe');
  }

  // bone_arrow — thin bone shaft with point
  {
    const ctx = makeCanvas(scene, 'item_bone_arrow', 10, 10);
    // Shaft
    rect(ctx, 4, 2, 1, 7, P.offWhite);
    // Arrowhead
    px(ctx, 3, 1, P.grayLight);
    px(ctx, 4, 0, P.grayLight);
    px(ctx, 5, 1, P.grayLight);
    px(ctx, 4, 1, P.gray);
    // Fletching
    px(ctx, 3, 8, P.red);
    px(ctx, 5, 8, P.red);
    px(ctx, 3, 9, P.red);
    px(ctx, 5, 9, P.red);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_bone_arrow');
  }

  // herbal_wrap — green bandage
  {
    const ctx = makeCanvas(scene, 'item_herbal_wrap', 10, 10);
    rect(ctx, 2, 3, 6, 5, '#88cc88');
    rect(ctx, 2, 3, 6, 1, '#aaeeaa');
    rect(ctx, 2, 7, 6, 1, '#558855');
    rect(ctx, 4, 4, 2, 3, P.green);
    rect(ctx, 3, 5, 4, 1, P.green);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_herbal_wrap');
  }

  // berry_jam — red jar
  {
    const ctx = makeCanvas(scene, 'item_berry_jam', 10, 10);
    // Lid
    rect(ctx, 3, 1, 4, 2, '#c8a060');
    // Jar body
    rect(ctx, 2, 3, 6, 6, '#cc3333');
    rect(ctx, 2, 3, 6, 1, '#ee5555');
    rect(ctx, 2, 8, 6, 1, '#881818');
    // Label
    rect(ctx, 3, 5, 4, 2, '#f5e6c8');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_berry_jam');
  }

  // ── Tier 2 Crafted ────────────────────────────────────

  // copper_ingot — copper rectangular bar
  {
    const ctx = makeCanvas(scene, 'item_copper_ingot', 10, 10);
    rect(ctx, 1, 3, 8, 5, '#b87333');
    rect(ctx, 2, 2, 6, 1, '#b87333');
    rect(ctx, 1, 3, 8, 1, '#d4963a');
    rect(ctx, 1, 7, 8, 1, '#8a5520');
    rect(ctx, 1, 3, 1, 5, '#d4963a');
    rect(ctx, 8, 3, 1, 5, '#8a5520');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_copper_ingot');
  }

  // copper_sword — copper blade pointing up
  {
    const ctx = makeCanvas(scene, 'item_copper_sword', 10, 10);
    rect(ctx, 4, 1, 2, 6, '#d4963a');
    px(ctx, 4, 0, '#b87333');
    px(ctx, 5, 0, '#b87333');
    rect(ctx, 4, 1, 1, 6, '#e0a840');
    rect(ctx, 5, 3, 1, 4, '#8a5520');
    rect(ctx, 2, 7, 6, 1, '#b87333');
    rect(ctx, 4, 8, 2, 2, P.brownDark);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_copper_sword');
  }

  // copper_armor — copper chestplate
  {
    const ctx = makeCanvas(scene, 'item_copper_armor', 10, 10);
    rect(ctx, 1, 2, 3, 2, '#b87333');
    rect(ctx, 6, 2, 3, 2, '#b87333');
    rect(ctx, 1, 4, 8, 5, '#b87333');
    rect(ctx, 2, 2, 6, 7, '#b87333');
    rect(ctx, 3, 2, 4, 2, '#0f172a');
    rect(ctx, 2, 4, 1, 5, '#d4963a');
    rect(ctx, 2, 4, 6, 1, '#d4963a');
    px(ctx, 4, 5, '#8a5520');
    px(ctx, 5, 5, '#8a5520');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_copper_armor');
  }

  // crystal_lens — blue diamond shape
  {
    const ctx = makeCanvas(scene, 'item_crystal_lens', 10, 10);
    px(ctx, 4, 1, '#b0e0ff');
    px(ctx, 5, 1, '#b0e0ff');
    rect(ctx, 3, 2, 4, 2, '#87ceeb');
    rect(ctx, 2, 4, 6, 2, '#87ceeb');
    rect(ctx, 3, 6, 4, 2, '#87ceeb');
    px(ctx, 4, 8, '#5b9ab5');
    px(ctx, 5, 8, '#5b9ab5');
    // Highlight
    px(ctx, 3, 3, '#d0f0ff');
    px(ctx, 4, 4, '#d0f0ff');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_crystal_lens');
  }

  // iron_pickaxe — iron head + wood handle
  {
    const ctx = makeCanvas(scene, 'item_iron_pickaxe', 10, 10);
    rect(ctx, 4, 4, 2, 5, P.brown);
    rect(ctx, 1, 2, 8, 2, P.grayLight);
    rect(ctx, 1, 2, 8, 1, P.white);
    px(ctx, 0, 3, P.grayLight);
    px(ctx, 9, 3, P.grayLight);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_iron_pickaxe');
  }

  // iron_axe — iron head + wood handle
  {
    const ctx = makeCanvas(scene, 'item_iron_axe', 10, 10);
    rect(ctx, 4, 5, 2, 5, P.brown);
    rect(ctx, 2, 1, 4, 5, P.grayLight);
    rect(ctx, 2, 1, 4, 1, P.white);
    rect(ctx, 2, 5, 4, 1, P.grayDark);
    rect(ctx, 2, 1, 1, 5, P.white);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_iron_axe');
  }

  // reinforced_armor — iron+copper chestplate
  {
    const ctx = makeCanvas(scene, 'item_reinforced_armor', 10, 10);
    rect(ctx, 1, 2, 3, 2, P.grayLight);
    rect(ctx, 6, 2, 3, 2, P.grayLight);
    rect(ctx, 1, 4, 8, 5, P.grayLight);
    rect(ctx, 2, 2, 6, 7, P.grayLight);
    rect(ctx, 3, 2, 4, 2, '#0f172a');
    rect(ctx, 2, 4, 1, 5, P.white);
    rect(ctx, 2, 4, 6, 1, P.white);
    // Copper trim
    rect(ctx, 1, 8, 8, 1, '#b87333');
    px(ctx, 4, 6, '#b87333');
    px(ctx, 5, 6, '#b87333');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_reinforced_armor');
  }

  // lantern — yellow glow on iron frame
  {
    const ctx = makeCanvas(scene, 'item_lantern', 10, 10);
    // Handle
    rect(ctx, 4, 0, 2, 2, P.grayDark);
    px(ctx, 3, 1, P.grayDark);
    px(ctx, 6, 1, P.grayDark);
    // Frame
    rect(ctx, 2, 2, 6, 7, P.grayDark);
    // Glass/glow
    rect(ctx, 3, 3, 4, 5, P.yellow);
    rect(ctx, 3, 3, 4, 1, '#ffe080');
    px(ctx, 4, 4, '#ffe080');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_lantern');
  }

  // ── Tier 3 Crafted ────────────────────────────────────

  // poison_vial — green bottle
  {
    const ctx = makeCanvas(scene, 'item_poison_vial', 10, 10);
    rect(ctx, 4, 1, 2, 1, '#c8a060');
    rect(ctx, 4, 2, 2, 2, P.grayLight);
    rect(ctx, 2, 4, 6, 5, P.slimeGreen);
    rect(ctx, 2, 4, 6, 1, P.slimeLight);
    rect(ctx, 2, 8, 6, 1, P.slimeDark);
    rect(ctx, 3, 5, 2, 3, P.slimeLight);
    px(ctx, 3, 5, '#bbff88');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_poison_vial');
  }

  // reed_bow — curved bow shape
  {
    const ctx = makeCanvas(scene, 'item_reed_bow', 10, 10);
    // Bow curve (left arc)
    px(ctx, 3, 0, P.swampGreen);
    px(ctx, 2, 1, P.swampGreen);
    px(ctx, 1, 2, P.swampGreen);
    px(ctx, 1, 3, P.swampGreen);
    px(ctx, 1, 4, P.swampGreen);
    px(ctx, 1, 5, P.swampGreen);
    px(ctx, 1, 6, P.swampGreen);
    px(ctx, 1, 7, P.swampGreen);
    px(ctx, 2, 8, P.swampGreen);
    px(ctx, 3, 9, P.swampGreen);
    // String
    px(ctx, 3, 1, P.offWhite);
    px(ctx, 3, 2, P.offWhite);
    px(ctx, 3, 3, P.offWhite);
    px(ctx, 3, 4, P.offWhite);
    px(ctx, 3, 5, P.offWhite);
    px(ctx, 3, 6, P.offWhite);
    px(ctx, 3, 7, P.offWhite);
    px(ctx, 3, 8, P.offWhite);
    // Arrow
    rect(ctx, 4, 4, 5, 1, P.offWhite);
    px(ctx, 8, 3, P.grayLight);
    px(ctx, 8, 5, P.grayLight);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_reed_bow');
  }

  // antidote — green potion bottle
  {
    const ctx = makeCanvas(scene, 'item_antidote', 10, 10);
    rect(ctx, 4, 1, 2, 1, '#c8a060');
    rect(ctx, 4, 2, 2, 2, P.grayLight);
    rect(ctx, 2, 4, 6, 5, P.green);
    rect(ctx, 2, 4, 6, 1, P.greenLight);
    rect(ctx, 2, 8, 6, 1, P.greenDark);
    rect(ctx, 3, 5, 2, 3, P.greenLight);
    px(ctx, 3, 5, '#88ee88');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_antidote');
  }

  // swamp_boots — green boots
  {
    const ctx = makeCanvas(scene, 'item_swamp_boots', 10, 10);
    // Left boot
    rect(ctx, 0, 3, 3, 5, P.swampGreen);
    rect(ctx, 0, 7, 4, 2, P.swampGreen);
    rect(ctx, 0, 3, 3, 1, P.greenLight);
    // Right boot
    rect(ctx, 5, 3, 3, 5, P.swampGreen);
    rect(ctx, 5, 7, 4, 2, P.swampGreen);
    rect(ctx, 5, 3, 3, 1, P.greenLight);
    // Soles
    rect(ctx, 0, 8, 4, 1, P.swampDark);
    rect(ctx, 5, 8, 4, 1, P.swampDark);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_swamp_boots');
  }

  // enchanted_sword — blue-glowing blade
  {
    const ctx = makeCanvas(scene, 'item_enchanted_sword', 10, 10);
    rect(ctx, 4, 1, 2, 6, '#87ceeb');
    px(ctx, 4, 0, '#5b9ab5');
    px(ctx, 5, 0, '#5b9ab5');
    rect(ctx, 4, 1, 1, 6, '#b0e0ff');
    rect(ctx, 5, 3, 1, 4, '#5b9ab5');
    rect(ctx, 2, 7, 6, 1, P.grayLight);
    rect(ctx, 4, 8, 2, 2, P.purple);
    // Glow pixels
    px(ctx, 3, 3, '#d0f0ff');
    px(ctx, 6, 2, '#d0f0ff');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_enchanted_sword');
  }

  // ── Tier 4 Crafted ────────────────────────────────────

  // obsidian_blade — dark purple/black blade
  {
    const ctx = makeCanvas(scene, 'item_obsidian_blade', 10, 10);
    rect(ctx, 4, 1, 2, 6, '#1a1a2e');
    px(ctx, 4, 0, '#0d0d1a');
    px(ctx, 5, 0, '#0d0d1a');
    rect(ctx, 4, 1, 1, 6, '#2d2d4e');
    rect(ctx, 5, 3, 1, 4, '#0d0d1a');
    rect(ctx, 2, 7, 6, 1, '#3a2a5e');
    rect(ctx, 4, 8, 2, 2, P.lavaDark);
    // Edge gleam
    px(ctx, 3, 2, '#4a4a6e');
    px(ctx, 6, 4, '#4a4a6e');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_obsidian_blade');
  }

  // obsidian_armor — dark chestplate
  {
    const ctx = makeCanvas(scene, 'item_obsidian_armor', 10, 10);
    rect(ctx, 1, 2, 3, 2, '#1a1a2e');
    rect(ctx, 6, 2, 3, 2, '#1a1a2e');
    rect(ctx, 1, 4, 8, 5, '#1a1a2e');
    rect(ctx, 2, 2, 6, 7, '#1a1a2e');
    rect(ctx, 3, 2, 4, 2, '#0f172a');
    rect(ctx, 2, 4, 1, 5, '#2d2d4e');
    rect(ctx, 2, 4, 6, 1, '#2d2d4e');
    px(ctx, 4, 5, '#3a2a5e');
    px(ctx, 5, 6, '#3a2a5e');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_obsidian_armor');
  }

  // fire_potion — orange/red bottle
  {
    const ctx = makeCanvas(scene, 'item_fire_potion', 10, 10);
    rect(ctx, 4, 1, 2, 1, '#c8a060');
    rect(ctx, 4, 2, 2, 2, P.grayLight);
    rect(ctx, 2, 4, 6, 5, P.lava);
    rect(ctx, 2, 4, 6, 1, P.lavaLight);
    rect(ctx, 2, 8, 6, 1, P.lavaDark);
    rect(ctx, 3, 5, 2, 3, P.lavaLight);
    px(ctx, 3, 5, P.magma);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_fire_potion');
  }

  // magma_pickaxe — obsidian/fire pick
  {
    const ctx = makeCanvas(scene, 'item_magma_pickaxe', 10, 10);
    rect(ctx, 4, 4, 2, 5, P.brownDark);
    rect(ctx, 1, 2, 8, 2, '#1a1a2e');
    rect(ctx, 1, 2, 8, 1, '#2d2d4e');
    px(ctx, 0, 3, '#1a1a2e');
    px(ctx, 9, 3, '#1a1a2e');
    // Lava glow
    px(ctx, 3, 3, P.lava);
    px(ctx, 6, 3, P.lava);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_magma_pickaxe');
  }

  // golden_armor — gold chestplate
  {
    const ctx = makeCanvas(scene, 'item_golden_armor', 10, 10);
    rect(ctx, 1, 2, 3, 2, P.yellow);
    rect(ctx, 6, 2, 3, 2, P.yellow);
    rect(ctx, 1, 4, 8, 5, P.yellow);
    rect(ctx, 2, 2, 6, 7, P.yellow);
    rect(ctx, 3, 2, 4, 2, '#0f172a');
    rect(ctx, 2, 4, 1, 5, '#ffe080');
    rect(ctx, 2, 4, 6, 1, '#ffe080');
    px(ctx, 4, 5, '#c09010');
    px(ctx, 5, 5, '#c09010');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_golden_armor');
  }

  // ── Tier 5 Crafted ────────────────────────────────────

  // void_blade — purple glowing blade
  {
    const ctx = makeCanvas(scene, 'item_void_blade', 10, 10);
    rect(ctx, 4, 1, 2, 6, P.purpleLight);
    px(ctx, 4, 0, P.purple);
    px(ctx, 5, 0, P.purple);
    rect(ctx, 4, 1, 1, 6, '#c070f0');
    rect(ctx, 5, 3, 1, 4, P.purpleDark);
    rect(ctx, 2, 7, 6, 1, P.purple);
    rect(ctx, 4, 8, 2, 2, '#1a1a2e');
    // Glow
    px(ctx, 3, 2, '#d090ff');
    px(ctx, 6, 4, '#d090ff');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_void_blade');
  }

  // shadow_cloak — dark purple cloak shape
  {
    const ctx = makeCanvas(scene, 'item_shadow_cloak', 10, 10);
    // Shoulders
    rect(ctx, 1, 1, 8, 2, P.purpleDark);
    // Body
    rect(ctx, 0, 3, 10, 6, P.purpleDark);
    rect(ctx, 1, 3, 8, 1, P.purple);
    // Hood
    rect(ctx, 3, 0, 4, 2, P.purpleDark);
    rect(ctx, 4, 0, 2, 1, P.purple);
    // Inner shadow
    rect(ctx, 3, 3, 4, 5, '#1a0033');
    // Clasp
    px(ctx, 4, 2, P.purpleLight);
    px(ctx, 5, 2, P.purpleLight);
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_shadow_cloak');
  }

  // purification_potion — bright purple bottle
  {
    const ctx = makeCanvas(scene, 'item_purification_potion', 10, 10);
    rect(ctx, 4, 1, 2, 1, '#c8a060');
    rect(ctx, 4, 2, 2, 2, P.grayLight);
    rect(ctx, 2, 4, 6, 5, P.purpleLight);
    rect(ctx, 2, 4, 6, 1, '#c070f0');
    rect(ctx, 2, 8, 6, 1, P.purple);
    rect(ctx, 3, 5, 2, 3, '#c070f0');
    px(ctx, 3, 5, '#d090ff');
    drawSpriteOutline(ctx, 10, 10, P.outline);
    finalize(scene, 'item_purification_potion');
  }
}
