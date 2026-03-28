import Phaser from 'phaser';
import { MenuBackground } from '@/ui/MenuBackground';
import { stoneTitle, stoneButton } from '@/ui/StoneUI';
import { MusicSystem } from '@/audio/MusicSystem';

let sharedMusic: MusicSystem | null = null;

export function getSharedMusic(): MusicSystem {
  if (!sharedMusic) sharedMusic = new MusicSystem();
  return sharedMusic;
}

export class MainMenuScene extends Phaser.Scene {
  private bg: MenuBackground = new MenuBackground();
  private music!: MusicSystem;

  constructor() { super({ key: 'MainMenu' }); }

  create(): void {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    this.bg.create(this);

    this.music = getSharedMusic();
    this.music.init();
    this.music.playMenuDrone();

    const title = stoneTitle(this, cx, cy - 100, 'SURVIVOR', '52px');
    title.setDepth(10);

    this.add.text(cx, cy - 50, 'Isometric Roguelike Survival Crafter', {
      fontSize: '13px',
      color: '#6b6560',
    }).setOrigin(0.5).setDepth(10);

    this.events.once('shutdown', () => this.bg.destroy());

    const newRunBtn = stoneButton({
      scene: this,
      x: cx,
      y: cy + 30,
      width: 220,
      height: 50,
      label: 'New Run',
      fontSize: '24px',
      onClick: () => {
        this.music.stopMenuDrone();
        this.time.delayedCall(300, () => {
          this.scene.start('Game', { seed: Date.now().toString(36) });
        });
      },
    });
    newRunBtn.setDepth(10);

    const progressionBtn = stoneButton({
      scene: this,
      x: cx,
      y: cy + 100,
      width: 180,
      height: 42,
      label: 'Progression',
      fontSize: '18px',
      onClick: () => {
        this.scene.start('MetaHub');
      },
    });
    progressionBtn.setDepth(10);
  }

  update(_time: number, delta: number): void {
    this.bg.update(delta);
  }
}
