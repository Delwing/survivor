import Phaser from 'phaser';

export class UIManager {
  private panels = new Map<string, Phaser.GameObjects.Container>();
  private activePanel: string | null = null;

  constructor(private scene: Phaser.Scene) {}

  registerPanel(name: string, container: Phaser.GameObjects.Container): void {
    container.setVisible(false);
    container.setScrollFactor(0);
    container.setDepth(20000);
    this.panels.set(name, container);
  }

  togglePanel(name: string): void {
    if (this.activePanel === name) { this.closePanel(); return; }
    this.closePanel();
    const panel = this.panels.get(name);
    if (panel) { panel.setVisible(true); this.activePanel = name; }
  }

  closePanel(): void {
    if (this.activePanel) {
      this.panels.get(this.activePanel)?.setVisible(false);
      this.activePanel = null;
    }
  }

  isOpen(): boolean { return this.activePanel !== null; }
}
