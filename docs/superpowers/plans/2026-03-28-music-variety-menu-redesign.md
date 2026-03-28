# Music Variety & Menu Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add dynamic music with phrase randomization, combat/idle layers, and percussion; add a dark ambient menu drone; redesign all menu scenes with stone-textured UI and animated fog/ember backgrounds.

**Architecture:** MusicSystem is extended with phrase-pool configs, a `MusicState` enum, percussion synthesis, and a menu drone mode. Two new UI files (`MenuBackground`, `StoneUI`) provide reusable visual components for all three menu scenes. GameScene drives music state transitions based on combat/movement.

**Tech Stack:** Phaser 3, Web Audio API, TypeScript, Vitest

---

### Task 1: Refactor MusicSystem to Phrase-Based Config

**Files:**
- Modify: `src/audio/MusicSystem.ts`

- [ ] **Step 1: Replace BiomeConfig with phrase-based structure**

Replace the existing `BiomeConfig` interface and `BIOME_CONFIGS` constant in `src/audio/MusicSystem.ts` with:

```ts
type WaveType = 'square' | 'triangle' | 'sawtooth';
type MusicState = 'exploring' | 'combat' | 'idle';

interface BiomeVariation {
  bassPhrases: number[][];
  melodyPhrases: number[][];
  arpPhrases?: number[][];
  tempo: number;
  waveform: WaveType;
  bassWaveform?: WaveType;
}

const BIOME_CONFIGS: Record<string, BiomeVariation[]> = {
  forest: [
    {
      bassPhrases: [
        [36, 38, 40, 43], [36, 40, 43, 45], [43, 40, 38, 36],
      ],
      melodyPhrases: [
        [60, 62, 64, 67, 69, 72], [72, 69, 67, 64, 62, 60],
        [64, 67, 69, 67, 64, 60], [60, 64, 67, 72, 69, 64],
      ],
      arpPhrases: [
        [72, 76, 79, 76], [79, 76, 72, 69], [72, 69, 72, 76],
      ],
      tempo: 130,
      waveform: 'triangle',
      bassWaveform: 'square',
    },
    {
      bassPhrases: [
        [36, 43, 40, 38], [45, 43, 40, 36], [36, 36, 43, 40],
      ],
      melodyPhrases: [
        [62, 64, 67, 69, 67, 64], [60, 67, 69, 72, 69, 67],
        [69, 67, 64, 62, 64, 67], [64, 60, 62, 64, 67, 69],
      ],
      tempo: 125,
      waveform: 'triangle',
      bassWaveform: 'square',
    },
  ],

  rocky_highlands: [
    {
      bassPhrases: [
        [45, 45, 43, 40], [41, 43, 45, 43], [40, 43, 45, 40],
      ],
      melodyPhrases: [
        [69, 67, 65, 64, 62, 60], [62, 64, 65, 64, 62, 60],
        [60, 62, 65, 67, 65, 62], [65, 64, 62, 60, 62, 65],
      ],
      tempo: 150,
      waveform: 'square',
      bassWaveform: 'sawtooth',
    },
    {
      bassPhrases: [
        [45, 43, 41, 40], [40, 41, 43, 45], [43, 45, 43, 40],
      ],
      melodyPhrases: [
        [60, 62, 64, 65, 67, 69], [69, 65, 62, 60, 62, 65],
        [67, 65, 64, 62, 64, 67], [62, 60, 65, 64, 62, 60],
      ],
      tempo: 145,
      waveform: 'square',
      bassWaveform: 'sawtooth',
    },
  ],

  swamp: [
    {
      bassPhrases: [
        [36, 37, 36, 42], [36, 37, 41, 36], [42, 41, 37, 36],
      ],
      melodyPhrases: [
        [60, 61, 60, 66, 65, 64], [61, 60, 66, 61, 65, 60],
        [66, 65, 64, 61, 60, 61], [60, 66, 64, 65, 61, 60],
      ],
      tempo: 80,
      waveform: 'triangle',
      bassWaveform: 'triangle',
    },
    {
      bassPhrases: [
        [36, 42, 37, 36], [41, 36, 37, 42], [36, 41, 36, 37],
      ],
      melodyPhrases: [
        [61, 66, 65, 60, 61, 66], [60, 61, 65, 66, 64, 61],
        [66, 64, 61, 60, 66, 65], [65, 61, 60, 66, 61, 60],
      ],
      tempo: 75,
      waveform: 'triangle',
      bassWaveform: 'triangle',
    },
  ],

  volcanic_wastes: [
    {
      bassPhrases: [
        [38, 38, 41, 38], [45, 41, 38, 43], [38, 43, 41, 38],
      ],
      melodyPhrases: [
        [62, 65, 69, 68, 65, 62], [63, 65, 69, 72, 69, 65],
        [72, 69, 65, 62, 68, 65], [65, 62, 63, 65, 69, 72],
      ],
      arpPhrases: [
        [74, 72, 69, 65], [62, 65, 69, 72], [69, 65, 62, 65],
      ],
      tempo: 175,
      waveform: 'sawtooth',
      bassWaveform: 'square',
    },
    {
      bassPhrases: [
        [38, 41, 43, 38], [43, 38, 41, 45], [38, 45, 43, 41],
      ],
      melodyPhrases: [
        [68, 65, 62, 63, 65, 69], [62, 69, 72, 69, 65, 62],
        [65, 69, 72, 68, 65, 63], [69, 65, 63, 62, 65, 69],
      ],
      arpPhrases: [
        [72, 69, 65, 62], [65, 69, 72, 74], [62, 69, 65, 72],
      ],
      tempo: 170,
      waveform: 'sawtooth',
      bassWaveform: 'square',
    },
  ],

  corrupted_lands: [
    {
      bassPhrases: [
        [35, 41, 35, 40], [35, 41, 38, 35], [40, 38, 41, 35],
      ],
      melodyPhrases: [
        [59, 60, 66, 65, 60, 59], [65, 66, 60, 59, 63, 66],
        [60, 59, 65, 66, 60, 59], [66, 63, 59, 60, 65, 66],
      ],
      tempo: 70,
      waveform: 'square',
      bassWaveform: 'triangle',
    },
    {
      bassPhrases: [
        [35, 40, 41, 35], [41, 35, 38, 40], [35, 38, 41, 35],
      ],
      melodyPhrases: [
        [60, 66, 65, 59, 60, 66], [59, 63, 66, 65, 60, 59],
        [65, 60, 59, 66, 63, 60], [63, 66, 59, 60, 65, 59],
      ],
      tempo: 65,
      waveform: 'square',
      bassWaveform: 'triangle',
    },
  ],
};

const DEFAULT_CONFIG = BIOME_CONFIGS['forest'][0];
```

- [ ] **Step 2: Update MusicSystem class fields for phrase-based sequencing**

Replace the existing sequencer state fields and add new ones:

```ts
export class MusicSystem {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentBiome: string = '';
  private playing = false;
  private musicState: MusicState = 'exploring';

  // Current variation (randomly chosen per biome)
  private currentVariation: BiomeVariation = DEFAULT_CONFIG;

  // Phrase sequencing: current phrase + position within phrase
  private currentBassPhrase: number[] = [];
  private currentMelodyPhrase: number[] = [];
  private currentArpPhrase: number[] = [];
  private bassNoteIdx = 0;
  private melodyNoteIdx = 0;
  private arpNoteIdx = 0;
  private beatMs = 0;

  // Layer gains for dynamic crossfading
  private melodyGain: GainNode | null = null;
  private arpGain: GainNode | null = null;

  // Scheduler timing
  private schedulerId: number | null = null;
  private nextBassTime = 0;
  private nextMelodyTime = 0;
  private nextArpTime = 0;
  private nextPercTime = 0;

  // How far ahead (seconds) we schedule notes
  private readonly LOOKAHEAD = 0.1;
  // How often (ms) we run the scheduler loop
  private readonly SCHEDULE_INTERVAL = 50;

  // Menu drone state
  private droneOscs: OscillatorNode[] = [];
  private droneGain: GainNode | null = null;
  private droneLfo: OscillatorNode | null = null;
  private dronePercId: number | null = null;
  private droneActive = false;

  constructor() {}
```

- [ ] **Step 3: Update init() to create layer gain nodes**

```ts
  init(): void {
    if (this.audioCtx) return;
    this.audioCtx = new AudioContext();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = 0.06;
    this.masterGain.connect(this.audioCtx.destination);

    // Per-layer gain nodes for dynamic fading
    this.melodyGain = this.audioCtx.createGain();
    this.melodyGain.gain.value = 1.0;
    this.melodyGain.connect(this.masterGain);

    this.arpGain = this.audioCtx.createGain();
    this.arpGain.gain.value = 0.0; // off by default, enabled in combat
    this.arpGain.connect(this.masterGain);
  }
```

- [ ] **Step 4: Update setBiome() to pick a random variation and init phrases**

```ts
  setBiome(biomeId: string): void {
    if (biomeId === this.currentBiome) return;
    this.currentBiome = biomeId;

    const variations = BIOME_CONFIGS[biomeId] ?? BIOME_CONFIGS['forest'];
    this.currentVariation = variations[Math.floor(Math.random() * variations.length)];
    this.beatMs = (60 / this.currentVariation.tempo) * 1000 * 0.5;

    // Pick initial random phrases
    this.pickNextBassPhrase();
    this.pickNextMelodyPhrase();
    this.pickNextArpPhrase();

    if (this.audioCtx) {
      this.nextBassTime = this.audioCtx.currentTime;
      this.nextMelodyTime = this.audioCtx.currentTime;
      this.nextArpTime = this.audioCtx.currentTime;
      this.nextPercTime = this.audioCtx.currentTime;
    }
  }

  private pickNextBassPhrase(): void {
    const phrases = this.currentVariation.bassPhrases;
    this.currentBassPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    this.bassNoteIdx = 0;
  }

  private pickNextMelodyPhrase(): void {
    const phrases = this.currentVariation.melodyPhrases;
    this.currentMelodyPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    this.melodyNoteIdx = 0;
  }

  private pickNextArpPhrase(): void {
    const phrases = this.currentVariation.arpPhrases;
    if (phrases && phrases.length > 0) {
      this.currentArpPhrase = phrases[Math.floor(Math.random() * phrases.length)];
    } else {
      this.currentArpPhrase = [];
    }
    this.arpNoteIdx = 0;
  }
```

- [ ] **Step 5: Update schedule() for phrase-based sequencing**

```ts
  private schedule(): void {
    if (!this.audioCtx || !this.playing) return;

    const cfg = this.currentVariation;
    const tempoMultiplier = this.musicState === 'combat' ? 1.1 : 1.0;
    const beatSec = (this.beatMs / 1000) / tempoMultiplier;
    const horizon = this.audioCtx.currentTime + this.LOOKAHEAD;

    // Bass — every 2 beats (always plays)
    while (this.nextBassTime < horizon) {
      if (this.currentBassPhrase.length > 0) {
        const note = this.currentBassPhrase[this.bassNoteIdx];
        this.playNote(note, cfg.bassWaveform ?? 'square', this.nextBassTime, beatSec * 1.8, 0.55, this.masterGain!);
        this.bassNoteIdx++;
        if (this.bassNoteIdx >= this.currentBassPhrase.length) {
          this.pickNextBassPhrase();
        }
      }
      this.nextBassTime += beatSec * 2;
    }

    // Melody — every beat (fades out in idle)
    while (this.nextMelodyTime < horizon) {
      if (this.currentMelodyPhrase.length > 0) {
        const note = this.currentMelodyPhrase[this.melodyNoteIdx];
        const isRest = this.melodyNoteIdx % 4 === 3 && Math.random() < 0.25;
        if (!isRest) {
          this.playNote(note, cfg.waveform, this.nextMelodyTime, beatSec * 0.75, 0.38, this.melodyGain!);
        }
        this.melodyNoteIdx++;
        if (this.melodyNoteIdx >= this.currentMelodyPhrase.length) {
          this.pickNextMelodyPhrase();
        }
      }
      this.nextMelodyTime += beatSec;
    }

    // Arpeggio — every half beat (combat only, routed through arpGain)
    if (this.currentArpPhrase.length > 0) {
      while (this.nextArpTime < horizon) {
        const note = this.currentArpPhrase[this.arpNoteIdx];
        this.playNote(note, 'triangle', this.nextArpTime, beatSec * 0.45, 0.18, this.arpGain!);
        this.arpNoteIdx++;
        if (this.arpNoteIdx >= this.currentArpPhrase.length) {
          this.pickNextArpPhrase();
        }
        this.nextArpTime += beatSec * 0.5;
      }
    }

    // Percussion — combat only
    if (this.musicState === 'combat') {
      while (this.nextPercTime < horizon) {
        this.playPercussion(this.nextPercTime, beatSec);
        this.nextPercTime += beatSec;
      }
    }
  }
```

- [ ] **Step 6: Add playNote with explicit destination, percussion, and setMusicState**

Update `playNote` to accept a destination node, and add percussion + state methods:

```ts
  /** Set the dynamic music state (exploring, combat, idle). */
  setMusicState(state: MusicState): void {
    if (state === this.musicState) return;
    this.musicState = state;

    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    if (state === 'idle') {
      // Fade melody out
      this.melodyGain?.gain.setTargetAtTime(0.0, now, 0.5);
      this.arpGain?.gain.setTargetAtTime(0.0, now, 0.3);
    } else if (state === 'combat') {
      // Full melody + arps
      this.melodyGain?.gain.setTargetAtTime(1.0, now, 0.3);
      this.arpGain?.gain.setTargetAtTime(1.0, now, 0.3);
      // Reset perc timing
      this.nextPercTime = now;
    } else {
      // Exploring: melody on, arps off
      this.melodyGain?.gain.setTargetAtTime(1.0, now, 0.3);
      this.arpGain?.gain.setTargetAtTime(0.0, now, 0.5);
    }
  }

  private playNote(
    midi: number,
    wave: WaveType,
    startAt: number,
    duration: number,
    velocity: number,
    destination: GainNode,
  ): void {
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = wave;
    osc.frequency.value = midiToHz(midi);

    const attackEnd = startAt + 0.008;
    const decayEnd = startAt + duration;

    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(velocity, attackEnd);
    gain.gain.exponentialRampToValueAtTime(0.0001, decayEnd);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(startAt);
    osc.stop(decayEnd + 0.01);

    osc.onended = () => {
      gain.disconnect();
      osc.disconnect();
    };
  }

  // Beat counter for kick/snare pattern
  private percBeat = 0;

  private playPercussion(startAt: number, beatSec: number): void {
    if (!this.audioCtx || !this.masterGain) return;

    const isKick = this.percBeat % 4 === 0 || this.percBeat % 4 === 2;

    const bufferSize = this.audioCtx.sampleRate * (isKick ? 0.05 : 0.03);
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = isKick ? 'lowpass' : 'highpass';
    filter.frequency.value = isKick ? 150 : 5000;

    const gain = this.audioCtx.createGain();
    gain.gain.setValueAtTime(isKick ? 0.4 : 0.15, startAt);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + (isKick ? 0.05 : 0.03));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    noise.start(startAt);
    noise.stop(startAt + (isKick ? 0.06 : 0.04));

    noise.onended = () => {
      gain.disconnect();
      filter.disconnect();
      noise.disconnect();
    };

    this.percBeat++;
  }
```

- [ ] **Step 7: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: no errors related to MusicSystem

- [ ] **Step 8: Commit**

```bash
git add src/audio/MusicSystem.ts
git commit -m "feat: refactor MusicSystem to phrase-based config with dynamic layers and percussion"
```

---

### Task 2: Add Menu Drone to MusicSystem

**Files:**
- Modify: `src/audio/MusicSystem.ts`

- [ ] **Step 1: Add playMenuDrone() and stopMenuDrone() methods**

Add these methods to the `MusicSystem` class:

```ts
  playMenuDrone(): void {
    if (this.droneActive || !this.audioCtx) return;
    this.droneActive = true;

    this.droneGain = this.audioCtx.createGain();
    this.droneGain.gain.value = 0.0;
    this.droneGain.connect(this.audioCtx.destination);
    // Fade in
    this.droneGain.gain.setTargetAtTime(0.04, this.audioCtx.currentTime, 0.5);

    // Two detuned sawtooth oscillators for dark beating
    const freqs = [40, 42];
    for (const freq of freqs) {
      const osc = this.audioCtx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.connect(this.droneGain);
      osc.start();
      this.droneOscs.push(osc);
    }

    // Slow LFO modulating drone gain for pulsing
    this.droneLfo = this.audioCtx.createOscillator();
    this.droneLfo.type = 'sine';
    this.droneLfo.frequency.value = 0.1;
    const lfoGain = this.audioCtx.createGain();
    lfoGain.gain.value = 0.015;
    this.droneLfo.connect(lfoGain);
    lfoGain.connect(this.droneGain.gain);
    this.droneLfo.start();

    // Occasional deep percussion hit
    this.scheduleDronePerc();
  }

  private scheduleDronePerc(): void {
    if (!this.droneActive || !this.audioCtx || !this.droneGain) return;

    // Low-freq noise burst
    const bufferSize = this.audioCtx.sampleRate * 0.12;
    const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const noise = this.audioCtx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 80;

    const gain = this.audioCtx.createGain();
    gain.gain.value = 0.3;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.droneGain);

    noise.start();

    // Schedule next hit in 4-8 seconds
    const delay = 4000 + Math.random() * 4000;
    this.dronePercId = window.setTimeout(() => this.scheduleDronePerc(), delay);
  }

  stopMenuDrone(): void {
    if (!this.droneActive) return;
    this.droneActive = false;

    if (this.dronePercId !== null) {
      clearTimeout(this.dronePercId);
      this.dronePercId = null;
    }

    // Fade out over 1s then clean up
    if (this.droneGain && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.droneGain.gain.setTargetAtTime(0, now, 0.3);
    }

    setTimeout(() => {
      for (const osc of this.droneOscs) {
        try { osc.stop(); osc.disconnect(); } catch (_) {}
      }
      this.droneOscs = [];
      if (this.droneLfo) {
        try { this.droneLfo.stop(); this.droneLfo.disconnect(); } catch (_) {}
        this.droneLfo = null;
      }
      if (this.droneGain) {
        this.droneGain.disconnect();
        this.droneGain = null;
      }
    }, 1500);
  }
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/audio/MusicSystem.ts
git commit -m "feat: add dark ambient menu drone to MusicSystem"
```

---

### Task 3: Create StoneUI Components

**Files:**
- Create: `src/ui/StoneUI.ts`

- [ ] **Step 1: Create StoneUI.ts with stoneTitle, stoneButton, and stonePanel**

```ts
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

/** Create a chiseled title text with drop shadow. */
export function stoneTitle(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  fontSize: string = '48px',
  color: string = '#e8dcc8',
): Phaser.GameObjects.Container {
  const shadow = scene.add.text(x + 2, y + 2, text, {
    fontSize, color: '#000000', fontStyle: 'bold',
  }).setOrigin(0.5).setAlpha(0.5);
  const main = scene.add.text(x, y, text, {
    fontSize, color, fontStyle: 'bold',
  }).setOrigin(0.5);
  const container = scene.add.container(0, 0, [shadow, main]);
  return container;
}

/** Create an interactive stone-textured button. */
export function stoneButton(config: StoneButtonConfig): Phaser.GameObjects.Container {
  const { scene, x, y, width, height, label, fontSize = '22px', onClick } = config;

  const bg = scene.add.graphics();
  const drawBg = (fill: number, border: number) => {
    bg.clear();
    bg.fillStyle(fill, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 6);
    // Noise speckles for stone grain
    for (let i = 0; i < 20; i++) {
      const sx = -width / 2 + Math.random() * width;
      const sy = -height / 2 + Math.random() * height;
      bg.fillStyle(fill - 0x0a0a0a, 0.5);
      bg.fillRect(sx, sy, 1, 1);
    }
    bg.lineStyle(1, border, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 6);
  };
  drawBg(0x3a3a3a, 0x555555);

  const text = scene.add.text(0, 0, label, {
    fontSize, color: '#d4d0c8', fontStyle: 'bold',
  }).setOrigin(0.5);

  const container = scene.add.container(x, y, [bg, text]);
  container.setSize(width, height);
  container.setInteractive({ useHandCursor: true });

  container.on('pointerover', () => {
    drawBg(0x454545, 0x888888);
    scene.tweens.add({ targets: container, scaleX: 1.03, scaleY: 1.03, duration: 80 });
  });

  container.on('pointerout', () => {
    drawBg(0x3a3a3a, 0x555555);
    scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 80 });
  });

  container.on('pointerdown', () => {
    drawBg(0x2a2a2a, 0x444444);
    scene.tweens.add({ targets: container, scaleX: 0.97, scaleY: 0.97, y: y + 1, duration: 50 });
  });

  container.on('pointerup', () => {
    drawBg(0x3a3a3a, 0x555555);
    scene.tweens.add({ targets: container, scaleX: 1, scaleY: 1, y, duration: 50 });
    onClick();
  });

  return container;
}

/** Create a stone-textured panel (non-interactive background). */
export function stonePanel(config: StonePanelConfig): Phaser.GameObjects.Graphics {
  const { scene, x, y, width, height } = config;
  const g = scene.add.graphics();

  // Main fill
  g.fillStyle(0x2e2e2e, 0.9);
  g.fillRoundedRect(x, y, width, height, 8);

  // Noise speckles
  for (let i = 0; i < 30; i++) {
    const sx = x + Math.random() * width;
    const sy = y + Math.random() * height;
    g.fillStyle(0x222222, 0.4);
    g.fillRect(sx, sy, 1, 1);
  }

  // Inset border: dark top-left, light bottom-right (carved look)
  g.lineStyle(1, 0x1a1a1a, 0.8);
  g.beginPath();
  g.moveTo(x + 8, y);
  g.lineTo(x + width - 8, y);
  g.arc(x + width - 8, y + 8, 8, -Math.PI / 2, 0);
  g.moveTo(x, y + 8);
  g.lineTo(x, y + height - 8);
  g.stroke();

  g.lineStyle(1, 0x4a4a4a, 0.6);
  g.beginPath();
  g.moveTo(x + width, y + 8);
  g.lineTo(x + width, y + height - 8);
  g.moveTo(x + 8, y + height);
  g.lineTo(x + width - 8, y + height);
  g.stroke();

  return g;
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/ui/StoneUI.ts
git commit -m "feat: add StoneUI components (stoneTitle, stoneButton, stonePanel)"
```

---

### Task 4: Create MenuBackground

**Files:**
- Create: `src/ui/MenuBackground.ts`

- [ ] **Step 1: Create MenuBackground.ts**

```ts
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
  private fog: FogSprite[] = [];
  private embers: Ember[] = [];
  private scene: Phaser.Scene | null = null;
  private vignette: Phaser.GameObjects.Graphics | null = null;
  private stoneBase: Phaser.GameObjects.Graphics | null = null;
  private emberTimer: Phaser.Time.TimerEvent | null = null;

  create(scene: Phaser.Scene): void {
    this.scene = scene;
    const w = scene.cameras.main.width;
    const h = scene.cameras.main.height;

    // Layer 1: Dark stone base with noise
    this.stoneBase = scene.add.graphics();
    this.stoneBase.fillStyle(0x1a1a1a, 1);
    this.stoneBase.fillRect(0, 0, w, h);
    // Grain noise
    for (let i = 0; i < 600; i++) {
      const nx = Math.random() * w;
      const ny = Math.random() * h;
      const shade = 0x1a1a1a + Math.floor(Math.random() * 0x101010);
      this.stoneBase.fillStyle(shade, 0.3);
      this.stoneBase.fillRect(nx, ny, 1, 1);
    }
    this.stoneBase.setDepth(0);

    // Layer 2: Fog sprites
    for (let i = 0; i < 10; i++) {
      const size = 200 + Math.random() * 200;
      const fogSprite = scene.add.ellipse(
        Math.random() * w,
        Math.random() * h,
        size,
        size * 0.5,
        0xffffff,
        0.03 + Math.random() * 0.05,
      );
      fogSprite.setDepth(1);
      this.fog.push({
        image: fogSprite,
        speed: 8 + Math.random() * 20,
      });
    }

    // Layer 3: Ember spawn timer
    this.emberTimer = scene.time.addEvent({
      delay: 600 + Math.random() * 400,
      callback: () => this.spawnEmber(),
      loop: true,
    });

    // Layer 4: Vignette overlay
    this.vignette = scene.add.graphics();
    this.vignette.setDepth(3);
    // Draw radial vignette using concentric rects with increasing alpha
    const steps = 20;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const alpha = t * t * 0.7;
      const inset = (1 - t) * Math.min(w, h) * 0.5;
      this.vignette.fillStyle(0x000000, alpha);
      // Top bar
      this.vignette.fillRect(0, 0, w, inset * 0.3);
      // Bottom bar
      this.vignette.fillRect(0, h - inset * 0.3, w, inset * 0.3);
      // Left bar
      this.vignette.fillRect(0, 0, inset * 0.4, h);
      // Right bar
      this.vignette.fillRect(w - inset * 0.4, 0, inset * 0.4, h);
    }
  }

  private spawnEmber(): void {
    if (!this.scene) return;
    const w = this.scene.cameras.main.width;
    const h = this.scene.cameras.main.height;

    const x = w * 0.2 + Math.random() * w * 0.6;
    const size = 1 + Math.random() * 2;
    const color = Math.random() > 0.5 ? 0xff6600 : 0xff4400;
    const ember = this.scene.add.circle(x, h + 5, size, color, 0.8);
    ember.setDepth(2);

    const maxLife = 2000 + Math.random() * 1000;
    this.embers.push({
      image: ember,
      vy: -(30 + Math.random() * 40),
      wobbleSpeed: 2 + Math.random() * 3,
      wobbleAmp: 10 + Math.random() * 15,
      life: 0,
      maxLife,
    });
  }

  update(dt: number): void {
    if (!this.scene) return;
    const w = this.scene.cameras.main.width;
    const dtSec = dt / 1000;

    // Move fog
    for (const f of this.fog) {
      f.image.x += f.speed * dtSec;
      if (f.image.x > w + 200) {
        f.image.x = -200;
        f.image.y = Math.random() * this.scene.cameras.main.height;
      }
    }

    // Move embers
    for (let i = this.embers.length - 1; i >= 0; i--) {
      const e = this.embers[i];
      e.life += dt;
      e.image.y += e.vy * dtSec;
      e.image.x += Math.sin(e.life / 1000 * e.wobbleSpeed) * e.wobbleAmp * dtSec;
      e.image.setAlpha(0.8 * (1 - e.life / e.maxLife));

      if (e.life >= e.maxLife) {
        e.image.destroy();
        this.embers.splice(i, 1);
      }
    }
  }

  destroy(): void {
    for (const f of this.fog) f.image.destroy();
    this.fog = [];
    for (const e of this.embers) e.image.destroy();
    this.embers = [];
    if (this.emberTimer) { this.emberTimer.destroy(); this.emberTimer = null; }
    if (this.vignette) { this.vignette.destroy(); this.vignette = null; }
    if (this.stoneBase) { this.stoneBase.destroy(); this.stoneBase = null; }
    this.scene = null;
  }
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/ui/MenuBackground.ts
git commit -m "feat: add MenuBackground with stone base, fog, embers, and vignette"
```

---

### Task 5: Redesign MainMenuScene

**Files:**
- Modify: `src/scenes/MainMenuScene.ts`

- [ ] **Step 1: Rewrite MainMenuScene with MenuBackground, StoneUI, and drone**

Replace the entire content of `src/scenes/MainMenuScene.ts`:

```ts
import Phaser from 'phaser';
import { MenuBackground } from '@/ui/MenuBackground';
import { stoneTitle, stoneButton } from '@/ui/StoneUI';
import { MusicSystem } from '@/audio/MusicSystem';

// Shared music system instance — persists across menu scenes
let sharedMusic: MusicSystem | null = null;

export function getSharedMusic(): MusicSystem {
  if (!sharedMusic) sharedMusic = new MusicSystem();
  return sharedMusic;
}

export class MainMenuScene extends Phaser.Scene {
  private bg!: MenuBackground;
  private music!: MusicSystem;

  constructor() { super({ key: 'MainMenu' }); }

  create(): void {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    // Background
    this.bg = new MenuBackground();
    this.bg.create(this);

    // Music drone
    this.music = getSharedMusic();
    this.music.init();
    this.music.playMenuDrone();

    // Title
    stoneTitle(this, cx, cy - 100, 'SURVIVOR', '52px').setDepth(10);

    // Subtitle
    this.add.text(cx, cy - 50, 'Isometric Roguelike Survival Crafter', {
      fontSize: '13px', color: '#6b6560',
    }).setOrigin(0.5).setDepth(10);

    // Clean up on scene shutdown
    this.events.once('shutdown', () => this.bg.destroy());

    // Buttons
    stoneButton({
      scene: this, x: cx, y: cy + 30, width: 220, height: 50,
      label: 'New Run', fontSize: '24px',
      onClick: () => {
        this.music.stopMenuDrone();
        this.time.delayedCall(300, () => {
          this.scene.start('Game', { seed: Date.now().toString(36) });
        });
      },
    }).setDepth(10);

    stoneButton({
      scene: this, x: cx, y: cy + 100, width: 180, height: 42,
      label: 'Progression', fontSize: '18px',
      onClick: () => { this.scene.start('MetaHub'); },
    }).setDepth(10);
  }

  update(_time: number, delta: number): void {
    this.bg.update(delta);
  }
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/scenes/MainMenuScene.ts
git commit -m "feat: redesign MainMenuScene with stone UI and animated background"
```

---

### Task 6: Redesign GameOverScene

**Files:**
- Modify: `src/scenes/GameOverScene.ts`

- [ ] **Step 1: Rewrite GameOverScene with MenuBackground, StoneUI, and drone**

Replace the entire content of `src/scenes/GameOverScene.ts`:

```ts
import Phaser from 'phaser';
import { MenuBackground } from '@/ui/MenuBackground';
import { stoneTitle, stoneButton, stonePanel } from '@/ui/StoneUI';
import { getSharedMusic } from '@/scenes/MainMenuScene';

export class GameOverScene extends Phaser.Scene {
  private bg!: MenuBackground;

  constructor() { super({ key: 'GameOver' }); }

  create(data: { survived: number; recipesFound: number; cause: string }): void {
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    // Background
    this.bg = new MenuBackground();
    this.bg.create(this);

    // Drone
    const music = getSharedMusic();
    music.init();
    music.playMenuDrone();

    // Clean up on scene shutdown
    this.events.once('shutdown', () => this.bg.destroy());

    // Title
    stoneTitle(this, cx, cy - 110, 'YOU DIED', '48px', '#cc4444').setDepth(10);

    // Stats panel
    const panelW = 300;
    const panelH = 90;
    stonePanel({ scene: this, x: cx - panelW / 2, y: cy - 60, width: panelW, height: panelH }).setDepth(10);

    this.add.text(cx, cy - 40, `Cause: ${data.cause ?? 'Unknown'}`, {
      fontSize: '15px', color: '#94a3b8',
    }).setOrigin(0.5).setDepth(11);

    this.add.text(cx, cy, `Survived: ${Math.floor((data.survived ?? 0) / 1000)}s  |  Recipes: ${data.recipesFound ?? 0}`, {
      fontSize: '15px', color: '#d4d0c8',
    }).setOrigin(0.5).setDepth(11);

    // Buttons
    stoneButton({
      scene: this, x: cx, y: cy + 70, width: 200, height: 48,
      label: 'Try Again', fontSize: '22px',
      onClick: () => {
        music.stopMenuDrone();
        this.time.delayedCall(300, () => {
          this.scene.start('Game', { seed: Date.now().toString(36) });
        });
      },
    }).setDepth(10);

    stoneButton({
      scene: this, x: cx, y: cy + 135, width: 180, height: 40,
      label: 'Main Menu', fontSize: '17px',
      onClick: () => { this.scene.start('MainMenu'); },
    }).setDepth(10);
  }

  update(_time: number, delta: number): void {
    this.bg.update(delta);
  }
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/scenes/GameOverScene.ts
git commit -m "feat: redesign GameOverScene with stone UI and animated background"
```

---

### Task 7: Redesign MetaHubScene

**Files:**
- Modify: `src/scenes/MetaHubScene.ts`

- [ ] **Step 1: Rewrite MetaHubScene with MenuBackground, StoneUI, and drone**

Replace the entire content of `src/scenes/MetaHubScene.ts`:

```ts
import Phaser from 'phaser';
import { ProgressionSystem } from '@/systems/ProgressionSystem';
import { MenuBackground } from '@/ui/MenuBackground';
import { stoneTitle, stoneButton, stonePanel } from '@/ui/StoneUI';
import { getSharedMusic } from '@/scenes/MainMenuScene';

export class MetaHubScene extends Phaser.Scene {
  private bg!: MenuBackground;

  constructor() { super({ key: 'MetaHub' }); }

  create(): void {
    const cx = this.cameras.main.centerX;
    const prog = new ProgressionSystem(localStorage);
    const save = prog.getSave();

    // Background
    this.bg = new MenuBackground();
    this.bg.create(this);

    // Drone continues seamlessly from MainMenu (playMenuDrone is idempotent)
    const music = getSharedMusic();
    music.init();
    music.playMenuDrone();

    // Clean up on scene shutdown
    this.events.once('shutdown', () => this.bg.destroy());

    // Title
    stoneTitle(this, cx, 50, 'PROGRESSION', '36px').setDepth(10);

    // Stat panels
    const panelW = 280;
    const panelH = 40;
    const stats = [
      { label: `Total Runs: ${save.totalRuns}`, color: '#d4d0c8' },
      { label: `Recipes Discovered: ${save.knownRecipes.length}`, color: '#fde68a' },
      { label: `NPC Types Unlocked: ${save.unlockedNPCTypes.length}`, color: '#6ee7b7' },
      { label: `Milestones: ${Object.keys(save.milestones).length}`, color: '#c4b5fd' },
    ];

    let y = 110;
    for (const stat of stats) {
      stonePanel({ scene: this, x: cx - panelW / 2, y, width: panelW, height: panelH }).setDepth(10);
      this.add.text(cx, y + panelH / 2, stat.label, {
        fontSize: '17px', color: stat.color,
      }).setOrigin(0.5).setDepth(11);
      y += panelH + 14;
    }

    // Back button
    stoneButton({
      scene: this, x: cx, y: y + 20, width: 200, height: 44,
      label: 'Back to Menu', fontSize: '18px',
      onClick: () => { this.scene.start('MainMenu'); },
    }).setDepth(10);
  }

  update(_time: number, delta: number): void {
    this.bg.update(delta);
  }
}
```

- [ ] **Step 2: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/scenes/MetaHubScene.ts
git commit -m "feat: redesign MetaHubScene with stone UI and progression panels"
```

---

### Task 8: Wire Music State and Transitions in GameScene

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: Import getSharedMusic and use it instead of creating a new MusicSystem**

In `src/scenes/GameScene.ts`, update the import and remove the local `new MusicSystem()`:

Change the import line:
```ts
import { MusicSystem } from '@/audio/MusicSystem';
```
to:
```ts
import { getSharedMusic } from '@/scenes/MainMenuScene';
```

Change the field declaration at line ~104:
```ts
  private musicSystem!: MusicSystem;
```
to:
```ts
  private musicSystem = getSharedMusic();
```

Remove the line in `create()` that creates a new MusicSystem (around line ~111):
```ts
    // DELETE: this.musicSystem = new MusicSystem();
```

- [ ] **Step 2: Add idle timer and music state tracking**

Add these fields to the GameScene class (near the other private fields around line ~92):

```ts
  private lastMoveTime = 0;
  private lastCombatTime = 0;
```

- [ ] **Step 3: Update the first-click audio bootstrap to also stop the drone**

In the `pointerdown` handler (around line ~334), update to:

```ts
      // Bootstrap audio on first user interaction (browser autoplay policy)
      this.musicSystem.init();
      this.musicSystem.stopMenuDrone();
      this.musicSystem.start();
      const ctx = this.musicSystem.getAudioContext();
      if (ctx) this.sfx.init(ctx);
```

- [ ] **Step 4: Set music state in the update loop**

In the main `update()` method, after the movement/combat logic and before the HUD update (around line ~500), add:

```ts
    // Update music state based on combat/movement
    const now = this.time.now;
    if (this.mobTarget) {
      this.lastCombatTime = now;
    }
    if (this.moveTarget) {
      this.lastMoveTime = now;
    }

    if (now - this.lastCombatTime < 3000) {
      this.musicSystem.setMusicState('combat');
    } else if (now - this.lastMoveTime > 5000) {
      this.musicSystem.setMusicState('idle');
    } else {
      this.musicSystem.setMusicState('exploring');
    }
```

- [ ] **Step 5: Verify build compiles**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 6: Manual test**

Run: `npm run dev`

Verify:
- Main menu shows animated stone background with fog and embers
- Dark ambient drone plays on the menu
- Clicking "New Run" fades out the drone and starts the game
- In-game: different biomes play varied music (not the same loop each time)
- Engaging a mob triggers combat music (arp + percussion)
- Standing still for 5s fades to idle (bass only)
- Dying returns to GameOver scene with stone UI and drone

- [ ] **Step 7: Commit**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: wire music state transitions and shared music system in GameScene"
```
