import Phaser from 'phaser';
import { stoneButton, stonePanel, stoneTitle } from '@/ui/StoneUI';
import { getSharedMusic } from '@/scenes/MainMenuScene';
import { SFXSystem } from '@/audio/SFXSystem';
import { GAME_WIDTH, GAME_HEIGHT } from '@/config/game-config';

/**
 * Pause menu implemented as a separate Phaser scene that overlays the game.
 * This avoids scrollFactor/input issues that occur when nesting interactive
 * containers inside a scrollFactor-0 container in the game scene.
 */
export class PauseScene extends Phaser.Scene {
  private mainElements: Phaser.GameObjects.GameObject[] = [];
  private optionsElements: Phaser.GameObjects.GameObject[] = [];
  private musicVolSliderFill!: Phaser.GameObjects.Graphics;
  private sfxVolSliderFill!: Phaser.GameObjects.Graphics;
  private musicVolText!: Phaser.GameObjects.Text;
  private sfxVolText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'Pause' });
  }

  create(data: { sfx: SFXSystem }): void {
    const sfx = data.sfx;
    const music = getSharedMusic();

    // Read current volumes
    let musicVol = 0.5;
    let sfxVol = 0.4;
    const musicGain = (music as any).masterGain as GainNode | null;
    if (musicGain) musicVol = musicGain.gain.value;
    const sfxGain = (sfx as any).masterGain as GainNode | null;
    if (sfxGain) sfxVol = sfxGain.gain.value / 0.3; // normalize to 0–1

    // Dark overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.75);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // ── Main menu elements ──
    const panelW = 260;
    const panelH = 260;
    const panel = stonePanel({ scene: this, x: cx - panelW / 2, y: cy - panelH / 2, width: panelW, height: panelH });
    this.mainElements.push(panel);

    const title = stoneTitle(this, cx, cy - 90, 'PAUSED', '28px');
    this.mainElements.push(title);

    const resumeBtn = stoneButton({
      scene: this, x: cx, y: cy - 30, width: 180, height: 40, label: 'Resume',
      onClick: () => this.resume(),
    });
    this.mainElements.push(resumeBtn);

    const optionsBtn = stoneButton({
      scene: this, x: cx, y: cy + 25, width: 180, height: 40, label: 'Options',
      onClick: () => this.showOptions(),
    });
    this.mainElements.push(optionsBtn);

    const quitBtn = stoneButton({
      scene: this, x: cx, y: cy + 80, width: 180, height: 40, label: 'Quit',
      onClick: () => this.quit(),
    });
    this.mainElements.push(quitBtn);

    // ── Options elements ──
    const optPanelW = 320;
    const optPanelH = 260;
    const optPanel = stonePanel({ scene: this, x: cx - optPanelW / 2, y: cy - optPanelH / 2, width: optPanelW, height: optPanelH });
    this.optionsElements.push(optPanel);

    const optTitle = stoneTitle(this, cx, cy - 90, 'OPTIONS', '28px');
    this.optionsElements.push(optTitle);

    // Music volume slider
    this.createSlider(cx, cy - 30, 'Music', musicVol, (val) => {
      music.setVolume(val);
      this.musicVolText.setText(Math.round(val * 100) + '%');
      this.updateSliderFill(this.musicVolSliderFill, cx - 60, cy - 30, 140, val);
    }, (fill, text) => { this.musicVolSliderFill = fill; this.musicVolText = text; });

    // SFX volume slider
    this.createSlider(cx, cy + 30, 'SFX', sfxVol, (val) => {
      sfx.setVolume(val);
      this.sfxVolText.setText(Math.round(val * 100) + '%');
      this.updateSliderFill(this.sfxVolSliderFill, cx - 60, cy + 30, 140, val);
    }, (fill, text) => { this.sfxVolSliderFill = fill; this.sfxVolText = text; });

    // Back button
    const backBtn = stoneButton({
      scene: this, x: cx, y: cy + 90, width: 180, height: 40, label: 'Back',
      onClick: () => this.showMain(),
    });
    this.optionsElements.push(backBtn);

    // Start showing main menu, options hidden
    for (const el of this.optionsElements) (el as unknown as Phaser.GameObjects.Components.Visible).setVisible(false);

    // ESC in pause scene resumes
    this.input.keyboard!.on('keydown-ESC', () => this.resume());
  }

  private createSlider(
    cx: number, cy: number, label: string, initial: number,
    onChange: (val: number) => void,
    refs: (fill: Phaser.GameObjects.Graphics, text: Phaser.GameObjects.Text) => void,
  ): void {
    const sliderW = 140;
    const sliderH = 12;
    const sx = cx - 60;

    const lbl = this.add.text(sx - 60, cy, label, { fontSize: '16px', color: '#d4d0c8' });
    lbl.setOrigin(0, 0.5);
    this.optionsElements.push(lbl);

    const track = this.add.graphics();
    track.fillStyle(0x1a1a1a, 1);
    track.fillRoundedRect(sx, cy - sliderH / 2, sliderW, sliderH, 3);
    track.lineStyle(1, 0x555555, 1);
    track.strokeRoundedRect(sx, cy - sliderH / 2, sliderW, sliderH, 3);
    this.optionsElements.push(track);

    const fill = this.add.graphics();
    this.updateSliderFill(fill, sx, cy, sliderW, initial);
    this.optionsElements.push(fill);

    const pct = this.add.text(sx + sliderW + 10, cy, Math.round(initial * 100) + '%', { fontSize: '14px', color: '#d4d0c8' });
    pct.setOrigin(0, 0.5);
    this.optionsElements.push(pct);

    refs(fill, pct);

    const hitZone = this.add.zone(sx + sliderW / 2, cy, sliderW + 10, sliderH + 16);
    hitZone.setInteractive({ useHandCursor: true });
    this.optionsElements.push(hitZone);

    let dragging = false;

    const updateFromPointer = (pointer: Phaser.Input.Pointer) => {
      const rel = Phaser.Math.Clamp((pointer.x - sx) / sliderW, 0, 1);
      onChange(rel);
    };

    hitZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      dragging = true;
      updateFromPointer(pointer);
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (dragging) updateFromPointer(pointer);
    });

    this.input.on('pointerup', () => { dragging = false; });
  }

  private updateSliderFill(gfx: Phaser.GameObjects.Graphics, sx: number, cy: number, sliderW: number, val: number): void {
    const sliderH = 12;
    gfx.clear();
    const fillW = Math.max(2, sliderW * val);
    gfx.fillStyle(0x6b8f71, 1);
    gfx.fillRoundedRect(sx, cy - sliderH / 2, fillW, sliderH, 3);
  }

  private showMain(): void {
    for (const el of this.mainElements) (el as unknown as Phaser.GameObjects.Components.Visible).setVisible(true);
    for (const el of this.optionsElements) (el as unknown as Phaser.GameObjects.Components.Visible).setVisible(false);
  }

  private showOptions(): void {
    for (const el of this.mainElements) (el as unknown as Phaser.GameObjects.Components.Visible).setVisible(false);
    for (const el of this.optionsElements) (el as unknown as Phaser.GameObjects.Components.Visible).setVisible(true);
  }

  private resume(): void {
    this.scene.stop('Pause');
    this.scene.resume('Game');
  }

  private quit(): void {
    this.scene.stop('Pause');
    const gameScene = this.scene.get('Game') as any;
    gameScene.quitFromPause();
  }
}
