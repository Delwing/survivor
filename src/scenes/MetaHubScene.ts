import Phaser from 'phaser';
import { ProgressionSystem } from '@/systems/ProgressionSystem';
import { MenuBackground } from '@/ui/MenuBackground';
import { stoneTitle, stoneButton, stonePanel } from '@/ui/StoneUI';
import { getSharedMusic } from '@/scenes/MainMenuScene';

export class MetaHubScene extends Phaser.Scene {
  private bg: MenuBackground = new MenuBackground();

  constructor() { super({ key: 'MetaHub' }); }

  create(): void {
    const cx = this.cameras.main.centerX;

    const prog = new ProgressionSystem(localStorage);
    const save = prog.getSave();

    this.bg.create(this);

    const music = getSharedMusic();
    music.init();
    music.playMenuDrone();

    this.events.once('shutdown', () => this.bg.destroy());

    const title = stoneTitle(this, cx, 50, 'PROGRESSION', '36px');
    title.setDepth(10);

    const stats = [
      { label: `Total Runs: ${save.totalRuns}`, color: '#d4d0c8' },
      { label: `Recipes Discovered: ${save.knownRecipes.length}`, color: '#fde68a' },
      { label: `NPC Types Unlocked: ${save.unlockedNPCTypes.length}`, color: '#6ee7b7' },
      { label: `Milestones: ${Object.keys(save.milestones).length}`, color: '#c4b5fd' },
    ];

    const panelW = 280;
    const panelH = 40;
    let y = 110;

    for (const stat of stats) {
      const panel = stonePanel({ scene: this, x: cx - panelW / 2, y, width: panelW, height: panelH });
      panel.setDepth(10);

      this.add.text(cx, y + panelH / 2, stat.label, {
        fontSize: '16px',
        color: stat.color,
      }).setOrigin(0.5).setDepth(11);

      y += panelH + 14;
    }

    const backBtn = stoneButton({
      scene: this,
      x: cx,
      y: y + 20,
      width: 200,
      height: 44,
      label: 'Back to Menu',
      fontSize: '18px',
      onClick: () => { this.scene.start('MainMenu'); },
    });
    backBtn.setDepth(10);
  }

  update(_time: number, delta: number): void {
    this.bg.update(delta);
  }
}
