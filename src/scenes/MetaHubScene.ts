import Phaser from 'phaser';
import { ProgressionSystem } from '@/systems/ProgressionSystem';

export class MetaHubScene extends Phaser.Scene {
  constructor() { super({ key: 'MetaHub' }); }

  create(): void {
    const cx = this.cameras.main.centerX;
    const prog = new ProgressionSystem(localStorage);
    const save = prog.getSave();

    this.add.text(cx, 40, 'PROGRESSION', { fontSize: '32px', color: '#ffffff', fontStyle: 'bold' }).setOrigin(0.5);
    let y = 100;
    this.add.text(cx, y, `Total Runs: ${save.totalRuns}`, { fontSize: '18px', color: '#cbd5e1' }).setOrigin(0.5); y += 40;
    this.add.text(cx, y, `Recipes Discovered: ${save.knownRecipes.length}`, { fontSize: '18px', color: '#fde68a' }).setOrigin(0.5); y += 30;
    this.add.text(cx, y, `NPC Types Unlocked: ${save.unlockedNPCTypes.length}`, { fontSize: '18px', color: '#6ee7b7' }).setOrigin(0.5); y += 30;
    this.add.text(cx, y, `Milestones: ${Object.keys(save.milestones).length}`, { fontSize: '18px', color: '#c4b5fd' }).setOrigin(0.5); y += 60;

    const backButton = this.add.text(cx, y, '[ Back to Menu ]', { fontSize: '20px', color: '#3b82f6' }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backButton.on('pointerdown', () => { this.scene.start('MainMenu'); });
  }
}
