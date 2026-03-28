import Phaser from 'phaser';

export interface StoneButtonConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  fontSize?: string;
  onClick: () => void;
}

export interface StonePanelConfig {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function stoneTitle(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  fontSize: string = '48px',
  color: string = '#e8dcc8'
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);

  const shadow = scene.add.text(2, 2, text, {
    fontSize,
    fontStyle: 'bold',
    color: '#000000',
  });
  shadow.setOrigin(0.5);
  shadow.setAlpha(0.5);

  const main = scene.add.text(0, 0, text, {
    fontSize,
    fontStyle: 'bold',
    color,
  });
  main.setOrigin(0.5);

  container.add([shadow, main]);
  return container;
}

export function stoneButton(config: StoneButtonConfig): Phaser.GameObjects.Container {
  const { scene, x, y, width, height, label, fontSize = '22px', onClick } = config;

  const container = scene.add.container(x, y);

  const bg = scene.add.graphics();

  // Pre-generate speckle positions once
  const rng = new Phaser.Math.RandomDataGenerator(['stone-btn']);
  const speckles: { x: number; y: number }[] = [];
  for (let i = 0; i < 20; i++) {
    speckles.push({
      x: rng.between(-width / 2 + 4, width / 2 - 4),
      y: rng.between(-height / 2 + 4, height / 2 - 4),
    });
  }

  const drawBg = (fillColor: number, borderColor: number): void => {
    bg.clear();
    bg.fillStyle(fillColor, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
    bg.lineStyle(1, borderColor, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);

    bg.fillStyle(0x282828, 0.6);
    for (const s of speckles) {
      bg.fillRect(s.x, s.y, 1, 1);
    }
  };

  drawBg(0x3a3a3a, 0x555555);

  const labelText = scene.add.text(0, 0, label, {
    fontSize,
    fontStyle: 'bold',
    color: '#d4d0c8',
  });
  labelText.setOrigin(0.5);

  container.add([bg, labelText]);
  container.setSize(width, height);
  container.setInteractive({ useHandCursor: true });

  let baseY = y;

  container.on('pointerover', () => {
    drawBg(0x454545, 0x888888);
    scene.tweens.add({
      targets: container,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 80,
      ease: 'Sine.easeOut',
    });
  });

  container.on('pointerout', () => {
    drawBg(0x3a3a3a, 0x555555);
    scene.tweens.add({
      targets: container,
      scaleX: 1.0,
      scaleY: 1.0,
      duration: 80,
      ease: 'Sine.easeOut',
    });
    container.y = baseY;
    labelText.y = 0;
  });

  container.on('pointerdown', () => {
    drawBg(0x2a2a2a, 0x555555);
    scene.tweens.add({
      targets: container,
      scaleX: 0.97,
      scaleY: 0.97,
      duration: 60,
      ease: 'Sine.easeOut',
    });
    baseY = container.y;
    container.y = baseY + 1;
  });

  container.on('pointerup', () => {
    drawBg(0x454545, 0x888888);
    scene.tweens.add({
      targets: container,
      scaleX: 1.03,
      scaleY: 1.03,
      duration: 60,
      ease: 'Sine.easeOut',
    });
    container.y = baseY;
    onClick();
  });

  return container;
}

export function stonePanel(config: StonePanelConfig): Phaser.GameObjects.Graphics {
  const { scene, x, y, width, height } = config;

  const gfx = scene.add.graphics({ x, y });

  // Main fill
  gfx.fillStyle(0x2e2e2e, 0.9);
  gfx.fillRoundedRect(0, 0, width, height, 8);

  // Stone grain speckles (~30 darker dots)
  gfx.fillStyle(0x202020, 0.5);
  const rng = new Phaser.Math.RandomDataGenerator(['stone-panel']);
  for (let i = 0; i < 30; i++) {
    const sx = rng.between(4, width - 4);
    const sy = rng.between(4, height - 4);
    gfx.fillRect(sx, sy, 1, 1);
  }

  // Inset border: dark on top/left, lighter on bottom/right
  const r = 8;

  // Top edge (dark)
  gfx.lineStyle(1, 0x1a1a1a, 1);
  gfx.beginPath();
  gfx.moveTo(r, 0);
  gfx.lineTo(width - r, 0);
  gfx.strokePath();

  // Left edge (dark)
  gfx.lineStyle(1, 0x1a1a1a, 1);
  gfx.beginPath();
  gfx.moveTo(0, r);
  gfx.lineTo(0, height - r);
  gfx.strokePath();

  // Bottom edge (light)
  gfx.lineStyle(1, 0x4a4a4a, 1);
  gfx.beginPath();
  gfx.moveTo(r, height);
  gfx.lineTo(width - r, height);
  gfx.strokePath();

  // Right edge (light)
  gfx.lineStyle(1, 0x4a4a4a, 1);
  gfx.beginPath();
  gfx.moveTo(width, r);
  gfx.lineTo(width, height - r);
  gfx.strokePath();

  return gfx;
}
