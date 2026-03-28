import Phaser from 'phaser';

interface FogSprite {
  image: Phaser.GameObjects.Ellipse;
  speed: number;
}

interface Ember {
  image: Phaser.GameObjects.Arc;
  vy: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  life: number;
  maxLife: number;
}

export class MenuBackground {
  private scene: Phaser.Scene | null = null;
  private width: number = 0;
  private height: number = 0;

  private stoneBase: Phaser.GameObjects.Graphics | null = null;
  private fogSprites: FogSprite[] = [];
  private embers: Ember[] = [];
  private emberTimer: Phaser.Time.TimerEvent | null = null;
  private vignette: Phaser.GameObjects.Graphics | null = null;

  create(scene: Phaser.Scene): void {
    this.scene = scene;
    this.width = scene.cameras.main.width;
    this.height = scene.cameras.main.height;

    this.createStoneBase();
    this.createFog();
    this.createEmberTimer();
    this.createVignette();
  }

  private createStoneBase(): void {
    const scene = this.scene!;
    const gfx = scene.add.graphics();
    gfx.setDepth(0);

    // Dark fill
    gfx.fillStyle(0x1a1a1a, 1);
    gfx.fillRect(0, 0, this.width, this.height);

    // ~600 grain noise pixels
    for (let i = 0; i < 600; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const offset = Math.floor(Math.random() * 0x101010);
      const shade = 0x1a1a1a + offset;
      gfx.fillStyle(shade, 0.3);
      gfx.fillRect(x, y, 1, 1);
    }

    this.stoneBase = gfx;
  }

  private createFog(): void {
    const scene = this.scene!;

    for (let i = 0; i < 10; i++) {
      const size = 200 + Math.random() * 200; // 200-400
      const ellipse = scene.add.ellipse(
        Math.random() * this.width,
        Math.random() * this.height,
        size,
        size * 0.5,
        0xffffff,
        0.03 + Math.random() * 0.05 // 0.03-0.08
      );
      ellipse.setDepth(1);

      this.fogSprites.push({
        image: ellipse,
        speed: 8 + Math.random() * 12, // 8-20 px/sec
      });
    }
  }

  private createEmberTimer(): void {
    const scene = this.scene!;

    this.emberTimer = scene.time.addEvent({
      delay: 600 + Math.random() * 400, // 600-1000ms
      loop: true,
      callback: this.spawnEmber,
      callbackScope: this,
    });
  }

  private spawnEmber(): void {
    if (!this.scene) return;

    const scene = this.scene;
    const spreadStart = this.width * 0.2;
    const spreadWidth = this.width * 0.6;
    const x = spreadStart + Math.random() * spreadWidth;
    const y = this.height + 5;
    const radius = 1 + Math.random() * 2; // 1-3px
    const color = Math.random() < 0.5 ? 0xff6600 : 0xff4400;

    const circle = scene.add.circle(x, y, radius, color, 0.8);
    circle.setDepth(2);

    const maxLife = 2000 + Math.random() * 1000; // 2000-3000ms

    this.embers.push({
      image: circle,
      vy: -(30 + Math.random() * 40), // -30 to -70
      wobbleSpeed: 1 + Math.random() * 3,
      wobbleAmp: 5 + Math.random() * 15,
      life: 0,
      maxLife,
    });
  }

  private createVignette(): void {
    const scene = this.scene!;
    const gfx = scene.add.graphics();
    gfx.setDepth(3);

    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const alpha = t * t * 0.7;
      const inset = (steps - 1 - i) * 10;

      gfx.fillStyle(0x000000, alpha);
      // Top bar
      gfx.fillRect(inset, inset, this.width - inset * 2, inset > 0 ? 1 : 0);
      // Bottom bar
      gfx.fillRect(inset, this.height - inset - 1, this.width - inset * 2, inset > 0 ? 1 : 0);
      // Left bar
      gfx.fillRect(inset, inset, inset > 0 ? 1 : 0, this.height - inset * 2);
      // Right bar
      gfx.fillRect(this.width - inset - 1, inset, inset > 0 ? 1 : 0, this.height - inset * 2);
    }

    this.vignette = gfx;
  }

  update(dt: number): void {
    const dtSec = dt / 1000;

    // Move fog rightward, wrap around
    for (const fog of this.fogSprites) {
      fog.image.x += fog.speed * dtSec;
      if (fog.image.x > this.width + 200) {
        fog.image.x = -200;
      }
    }

    // Move embers upward with wobble, fade by life
    const toRemove: Ember[] = [];
    for (const ember of this.embers) {
      ember.life += dt;

      if (ember.life >= ember.maxLife) {
        toRemove.push(ember);
        continue;
      }

      ember.image.y += ember.vy * dtSec;
      ember.image.x += Math.sin(ember.life * 0.001 * ember.wobbleSpeed * Math.PI * 2) * ember.wobbleAmp * dtSec;

      const lifeFraction = ember.life / ember.maxLife;
      ember.image.setAlpha(0.8 * (1 - lifeFraction));
    }

    for (const ember of toRemove) {
      ember.image.destroy();
      const idx = this.embers.indexOf(ember);
      if (idx !== -1) this.embers.splice(idx, 1);
    }
  }

  destroy(): void {
    // Destroy fog
    for (const fog of this.fogSprites) {
      fog.image.destroy();
    }
    this.fogSprites = [];

    // Destroy embers
    for (const ember of this.embers) {
      ember.image.destroy();
    }
    this.embers = [];

    // Destroy timer
    if (this.emberTimer) {
      this.emberTimer.destroy();
      this.emberTimer = null;
    }

    // Destroy graphics layers
    if (this.stoneBase) {
      this.stoneBase.destroy();
      this.stoneBase = null;
    }

    if (this.vignette) {
      this.vignette.destroy();
      this.vignette = null;
    }

    this.scene = null;
  }
}
