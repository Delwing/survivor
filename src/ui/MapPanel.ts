import Phaser from 'phaser';

const PANEL_X = 60;
const PANEL_Y = 30;
const PANEL_W = 840;
const PANEL_H = 480;

const TILE_PX = 12; // pixels per chunk square

const BIOME_COLORS: Record<string, number> = {
  forest:          0x22aa22,
  rocky_highlands: 0x888888,
  swamp:           0x2e5c2e,
  volcanic_wastes: 0xaa2222,
  corrupted_lands: 0x660099,
};

const DEFAULT_COLOR = 0x334155;

export class MapPanel {
  private container: Phaser.GameObjects.Container;
  private mapGraphics!: Phaser.GameObjects.Graphics;
  private playerDot!: Phaser.GameObjects.Graphics;
  private coordsText!: Phaser.GameObjects.Text;

  private exploredChunks = new Map<string, string>(); // "cx,cy" -> biomeId
  private playerChunkX = 0;
  private playerChunkY = 0;
  private blinkTimer = 0;
  private blinkVisible = true;

  constructor(private scene: Phaser.Scene) {
    this.container = scene.add.container(0, 0);
    this.buildUI();
  }

  private buildUI(): void {
    const scene = this.scene;

    // Dark overlay
    const overlay = scene.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, scene.cameras.main.width, scene.cameras.main.height);
    this.container.add(overlay);

    // Panel background
    const panelBg = scene.add.graphics();
    panelBg.fillStyle(0x0f172a, 0.97);
    panelBg.fillRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H);
    panelBg.lineStyle(1, 0x475569);
    panelBg.strokeRect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H);
    this.container.add(panelBg);

    // Title
    const title = scene.add.text(PANEL_X + 16, PANEL_Y + 12, 'MAP', {
      fontSize: '14px', color: '#e2e8f0', fontStyle: 'bold',
    });
    this.container.add(title);

    // Close button
    const closeBtn = scene.add.text(PANEL_X + PANEL_W - 24, PANEL_Y + 12, 'X', {
      fontSize: '14px', color: '#f87171', fontStyle: 'bold',
    }).setOrigin(0.5, 0).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => this.hide());
    this.container.add(closeBtn);

    // Divider
    const div = scene.add.graphics();
    div.lineStyle(1, 0x334155);
    div.lineBetween(PANEL_X + 16, PANEL_Y + 38, PANEL_X + PANEL_W - 16, PANEL_Y + 38);
    this.container.add(div);

    // Legend
    const legendItems = [
      { color: '#22aa22', label: 'Forest' },
      { color: '#888888', label: 'Rocky Highlands' },
      { color: '#2e5c2e', label: 'Swamp' },
      { color: '#aa2222', label: 'Volcanic' },
      { color: '#660099', label: 'Corrupted' },
    ];
    legendItems.forEach((item, i) => {
      const lx = PANEL_X + 16 + i * 160;
      const ly = PANEL_Y + PANEL_H - 28;
      const dot = scene.add.graphics();
      dot.fillStyle(Phaser.Display.Color.HexStringToColor(item.color).color, 1);
      dot.fillRect(lx, ly + 3, 8, 8);
      this.container.add(dot);
      const lbl = scene.add.text(lx + 12, ly, item.label, {
        fontSize: '9px', color: item.color,
      });
      this.container.add(lbl);
    });

    // Coordinates text (bottom-right area)
    this.coordsText = scene.add.text(PANEL_X + PANEL_W - 120, PANEL_Y + PANEL_H - 28, '', {
      fontSize: '10px', color: '#94a3b8',
    });
    this.container.add(this.coordsText);

    // Hint
    const hint = scene.add.text(PANEL_X + PANEL_W - 80, PANEL_Y + 12, '[M] to close', {
      fontSize: '9px', color: '#475569',
    });
    this.container.add(hint);

    // Map graphics layer (drawn into)
    this.mapGraphics = scene.add.graphics();
    this.container.add(this.mapGraphics);

    // Player dot layer (on top)
    this.playerDot = scene.add.graphics();
    this.container.add(this.playerDot);
  }

  addExploredChunk(cx: number, cy: number, biomeId: string): void {
    const key = `${cx},${cy}`;
    this.exploredChunks.set(key, biomeId);
  }

  update(playerChunkX: number, playerChunkY: number): void {
    this.playerChunkX = playerChunkX;
    this.playerChunkY = playerChunkY;
    this.coordsText.setText(`Chunk: ${playerChunkX}, ${playerChunkY}`);
    this.redrawMap();

    // Blink the player dot
    this.blinkTimer += 16; // approx per frame — called each frame when visible
    if (this.blinkTimer >= 500) {
      this.blinkTimer = 0;
      this.blinkVisible = !this.blinkVisible;
    }
    this.drawPlayerDot();
  }

  private redrawMap(): void {
    this.mapGraphics.clear();

    const mapAreaX = PANEL_X + 16;
    const mapAreaY = PANEL_Y + 48;
    const mapAreaW = PANEL_W - 32;
    const mapAreaH = PANEL_H - 90;

    // Map viewport: how many chunks fit
    const colsVisible = Math.floor(mapAreaW / TILE_PX);
    const rowsVisible = Math.floor(mapAreaH / TILE_PX);

    // Center on player
    const originCX = this.playerChunkX - Math.floor(colsVisible / 2);
    const originCY = this.playerChunkY - Math.floor(rowsVisible / 2);

    // Draw map border
    this.mapGraphics.lineStyle(1, 0x334155);
    this.mapGraphics.strokeRect(mapAreaX, mapAreaY, colsVisible * TILE_PX, rowsVisible * TILE_PX);

    for (let row = 0; row < rowsVisible; row++) {
      for (let col = 0; col < colsVisible; col++) {
        const cx = originCX + col;
        const cy = originCY + row;
        const key = `${cx},${cy}`;
        const biomeId = this.exploredChunks.get(key);

        if (!biomeId) continue; // unexplored — leave dark

        const color = BIOME_COLORS[biomeId] ?? DEFAULT_COLOR;
        const px = mapAreaX + col * TILE_PX;
        const py = mapAreaY + row * TILE_PX;

        this.mapGraphics.fillStyle(color, 1);
        this.mapGraphics.fillRect(px, py, TILE_PX - 1, TILE_PX - 1);
        // Subtle inner highlight on top edge
        this.mapGraphics.fillStyle(0xffffff, 0.08);
        this.mapGraphics.fillRect(px, py, TILE_PX - 1, 1);
      }
    }

    // Store for player dot drawing
    this._mapAreaX = mapAreaX;
    this._mapAreaY = mapAreaY;
    this._colsVisible = colsVisible;
    this._rowsVisible = rowsVisible;
    this._originCX = originCX;
    this._originCY = originCY;
  }

  // Cached map layout for player dot placement
  private _mapAreaX = 0;
  private _mapAreaY = 0;
  private _colsVisible = 0;
  private _rowsVisible = 0;
  private _originCX = 0;
  private _originCY = 0;

  private drawPlayerDot(): void {
    this.playerDot.clear();
    if (!this.blinkVisible) return;

    const col = this.playerChunkX - this._originCX;
    const row = this.playerChunkY - this._originCY;

    if (col < 0 || col >= this._colsVisible || row < 0 || row >= this._rowsVisible) return;

    const px = this._mapAreaX + col * TILE_PX + TILE_PX / 2;
    const py = this._mapAreaY + row * TILE_PX + TILE_PX / 2;

    this.playerDot.fillStyle(0xffffff, 1);
    this.playerDot.fillCircle(px, py, 3);
    this.playerDot.lineStyle(1, 0x000000, 0.5);
    this.playerDot.strokeCircle(px, py, 3);
  }

  show(): void { this.container.setVisible(true); }
  hide(): void { this.container.setVisible(false); }

  getContainer(): Phaser.GameObjects.Container { return this.container; }
}
