import Phaser from 'phaser';
import { MenuBackground } from '@/ui/MenuBackground';
import { stoneTitle, stoneButton, stonePanel } from '@/ui/StoneUI';
import { getSharedMusic } from '@/scenes/MainMenuScene';

export class GameOverScene extends Phaser.Scene {
  private bg: MenuBackground = new MenuBackground();

  constructor() { super({ key: 'GameOver' }); }

  create(data: { survived: number; recipesFound: number; cause: string }): void {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    this.bg.create(this);

    const music = getSharedMusic();
    music.init();
    music.playMenuDrone();

    this.events.once('shutdown', () => this.bg.destroy());

    const title = stoneTitle(this, cx, cy - 110, 'YOU DIED', '48px', '#cc4444');
    title.setDepth(10);

    const panel = stonePanel({ scene: this, x: cx - 150, y: cy - 60, width: 300, height: 90 });
    panel.setDepth(10);

    this.add.text(cx, cy - 40, `Cause: ${data.cause ?? 'Unknown'}`, {
      fontSize: '15px',
      color: '#94a3b8',
    }).setOrigin(0.5).setDepth(11);

    this.add.text(cx, cy, `Survived: ${Math.floor((data.survived ?? 0) / 1000)}s  |  Recipes: ${data.recipesFound ?? 0}`, {
      fontSize: '15px',
      color: '#d4d0c8',
    }).setOrigin(0.5).setDepth(11);

    const tryAgainBtn = stoneButton({
      scene: this,
      x: cx,
      y: cy + 70,
      width: 200,
      height: 48,
      label: 'Try Again',
      fontSize: '22px',
      onClick: () => {
        music.stopMenuDrone();
        this.time.delayedCall(300, () => {
          this.scene.start('Game', { seed: Date.now().toString(36) });
        });
      },
    });
    tryAgainBtn.setDepth(10);

    const menuBtn = stoneButton({
      scene: this,
      x: cx,
      y: cy + 135,
      width: 180,
      height: 40,
      label: 'Main Menu',
      fontSize: '17px',
      onClick: () => {
        this.scene.start('MainMenu');
      },
    });
    menuBtn.setDepth(10);
  }

  update(_time: number, delta: number): void {
    this.bg.update(delta);
  }
}
