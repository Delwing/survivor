/** Procedural 8-bit chiptune music system using the Web Audio API. */

type WaveType = 'square' | 'triangle' | 'sawtooth';

interface BiomeConfig {
  bassNotes: number[];
  melodyNotes: number[];
  arpNotes?: number[];
  tempo: number; // BPM
  waveform: WaveType;
  bassWaveform?: WaveType;
}

/** Convert MIDI note number to frequency in Hz. */
function midiToHz(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

/**
 * Biome music configurations.
 * Bass range:   C2–C3  = MIDI 36–48
 * Melody range: C4–C5  = MIDI 60–72
 */
const BIOME_CONFIGS: Record<string, BiomeConfig> = {
  forest: {
    // C major pentatonic — gentle, peaceful
    bassNotes:   [36, 38, 40, 43, 45, 36, 40, 43],  // C2 D2 E2 G2 A2 …
    melodyNotes: [60, 62, 64, 67, 69, 72, 69, 67, 64, 62, 60, 64, 67, 69, 64, 60],
    arpNotes:    [72, 76, 79, 76, 72, 69, 72, 76],
    tempo: 130,
    waveform: 'triangle',
    bassWaveform: 'square',
  },

  rocky_highlands: {
    // A natural minor — deeper, rhythmic
    bassNotes:   [45, 45, 43, 40, 41, 43, 45, 43],  // A2 … minor feel
    melodyNotes: [69, 67, 65, 64, 62, 60, 62, 64, 65, 64, 62, 60, 62, 65, 67, 65],
    tempo: 150,
    waveform: 'square',
    bassWaveform: 'sawtooth',
  },

  swamp: {
    // Eerie — slow, lots of minor seconds and tritones
    bassNotes:   [36, 37, 36, 42, 36, 37, 41, 36],  // C2 C#2 tritone (F#2)
    melodyNotes: [60, 61, 60, 66, 65, 64, 61, 60, 66, 61, 65, 60, 61, 66, 64, 65],
    tempo: 80,
    waveform: 'triangle',
    bassWaveform: 'triangle',
  },

  volcanic_wastes: {
    // Intense — fast, D harmonic minor
    bassNotes:   [38, 38, 41, 38, 45, 41, 38, 43],  // D2 F2 A2
    melodyNotes: [62, 65, 69, 68, 65, 62, 63, 65, 69, 72, 69, 65, 62, 68, 65, 62],
    arpNotes:    [74, 72, 69, 65, 62, 65, 69, 72],
    tempo: 175,
    waveform: 'sawtooth',
    bassWaveform: 'square',
  },

  corrupted_lands: {
    // Dark — slow, tritones and minor seconds (B diminished feel)
    bassNotes:   [35, 41, 35, 40, 35, 41, 38, 35],  // B1 F2 (tritone), E2
    melodyNotes: [59, 60, 66, 65, 60, 59, 65, 66, 60, 59, 63, 66, 65, 60, 59, 65],
    tempo: 70,
    waveform: 'square',
    bassWaveform: 'triangle',
  },
};

/** Fallback config when biome is unknown. */
const DEFAULT_CONFIG = BIOME_CONFIGS['forest'];

export class MusicSystem {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentBiome: string = '';
  private playing = false;

  // Sequencer state
  private bassStep = 0;
  private melodyStep = 0;
  private arpStep = 0;
  private beatMs = 0;

  // Scheduler timing
  private schedulerId: number | null = null;
  private nextBassTime = 0;
  private nextMelodyTime = 0;
  private nextArpTime = 0;

  // How far ahead (seconds) we schedule notes
  private readonly LOOKAHEAD = 0.1;
  // How often (ms) we run the scheduler loop
  private readonly SCHEDULE_INTERVAL = 50;

  constructor() {}

  /** Must be called after a user gesture to comply with browser autoplay policy. */
  init(): void {
    if (this.audioCtx) return;
    this.audioCtx = new AudioContext();
    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = 0.06;
    this.masterGain.connect(this.audioCtx.destination);
  }

  /** Switch to music for the given biome. Seamlessly transitions. */
  setBiome(biomeId: string): void {
    if (biomeId === this.currentBiome) return;
    this.currentBiome = biomeId;

    const cfg = BIOME_CONFIGS[biomeId] ?? DEFAULT_CONFIG;
    this.beatMs = (60 / cfg.tempo) * 1000 * 0.5; // eighth-note duration in ms

    // Reset step counters so we start cleanly for the new biome
    this.bassStep = 0;
    this.melodyStep = 0;
    this.arpStep = 0;

    if (this.audioCtx) {
      this.nextBassTime = this.audioCtx.currentTime;
      this.nextMelodyTime = this.audioCtx.currentTime;
      this.nextArpTime = this.audioCtx.currentTime;
    }
  }

  start(): void {
    if (this.playing || !this.audioCtx) return;
    this.playing = true;

    if (!this.currentBiome) this.setBiome('forest');

    this.nextBassTime = this.audioCtx.currentTime;
    this.nextMelodyTime = this.audioCtx.currentTime;
    this.nextArpTime = this.audioCtx.currentTime;

    this.schedulerId = window.setInterval(() => this.schedule(), this.SCHEDULE_INTERVAL);
  }

  stop(): void {
    if (!this.playing) return;
    this.playing = false;
    if (this.schedulerId !== null) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
    // Fade out master gain to avoid a click
    if (this.masterGain && this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.masterGain.gain.setTargetAtTime(0, now, 0.3);
      setTimeout(() => {
        if (this.masterGain && this.audioCtx) {
          this.masterGain.gain.setValueAtTime(0.06, this.audioCtx.currentTime);
        }
      }, 1200);
    }
  }

  /** Return the AudioContext (available after init). */
  getAudioContext(): AudioContext | null {
    return this.audioCtx;
  }

  /** Set master volume (0–1). */
  setVolume(vol: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, vol));
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Web Audio "look-ahead" scheduler.
   * Called every SCHEDULE_INTERVAL ms; schedules any notes whose time falls
   * within the next LOOKAHEAD seconds.
   */
  private schedule(): void {
    if (!this.audioCtx || !this.playing) return;

    const cfg = BIOME_CONFIGS[this.currentBiome] ?? DEFAULT_CONFIG;
    const beatSec = this.beatMs / 1000;
    const horizon = this.audioCtx.currentTime + this.LOOKAHEAD;

    // Bass — every 2 beats
    while (this.nextBassTime < horizon) {
      const note = cfg.bassNotes[this.bassStep % cfg.bassNotes.length];
      this.playNote(note, cfg.bassWaveform ?? 'square', this.nextBassTime, beatSec * 1.8, 0.55);
      this.bassStep++;
      this.nextBassTime += beatSec * 2;
    }

    // Melody — every beat
    while (this.nextMelodyTime < horizon) {
      const note = cfg.melodyNotes[this.melodyStep % cfg.melodyNotes.length];
      // Occasional rest: every 4th note is silent 25% of the time
      const isRest = this.melodyStep % 4 === 3 && Math.random() < 0.25;
      if (!isRest) {
        this.playNote(note, cfg.waveform, this.nextMelodyTime, beatSec * 0.75, 0.38);
      }
      this.melodyStep++;
      this.nextMelodyTime += beatSec;
    }

    // Arpeggio — every half beat (if defined for this biome)
    if (cfg.arpNotes) {
      while (this.nextArpTime < horizon) {
        const note = cfg.arpNotes[this.arpStep % cfg.arpNotes.length];
        this.playNote(note, 'triangle', this.nextArpTime, beatSec * 0.45, 0.18);
        this.arpStep++;
        this.nextArpTime += beatSec * 0.5;
      }
    }
  }

  /**
   * Schedule a single note using a fresh OscillatorNode + GainNode pair.
   * @param midi     MIDI note number
   * @param wave     Oscillator type
   * @param startAt  AudioContext time to start the note
   * @param duration Duration in seconds
   * @param velocity Relative loudness (0–1), multiplied against master gain
   */
  private playNote(
    midi: number,
    wave: WaveType,
    startAt: number,
    duration: number,
    velocity: number,
  ): void {
    if (!this.audioCtx || !this.masterGain) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = wave;
    osc.frequency.value = midiToHz(midi);

    // Quick attack, exponential decay for that chiptune "blip" feel
    const attackEnd = startAt + 0.008;
    const decayEnd = startAt + duration;

    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(velocity, attackEnd);
    gain.gain.exponentialRampToValueAtTime(0.0001, decayEnd);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(startAt);
    osc.stop(decayEnd + 0.01);

    // Clean up nodes after they finish
    osc.onended = () => {
      gain.disconnect();
      osc.disconnect();
    };
  }
}
