/** Procedural 8-bit chiptune music system using the Web Audio API. */

type WaveType = 'square' | 'triangle' | 'sawtooth';

export type MusicState = 'exploring' | 'combat' | 'idle';

// ---------------------------------------------------------------------------
// Phrase-based config
// ---------------------------------------------------------------------------

interface BiomeVariation {
  tempo: number;           // BPM (eighth-note grid)
  waveform: WaveType;      // melody oscillator type
  bassWaveform: WaveType;  // bass oscillator type
  bassPhrases: number[][];   // each inner array is one phrase (midi notes)
  melodyPhrases: number[][]; // phrases for the melody layer
  arpPhrases: number[][];    // phrases for the arp layer (may be empty)
}

/** Convert MIDI note number to frequency in Hz. */
export function midiToHz(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

/**
 * Biome music configurations — 5 biomes × 2 variations each.
 *
 * Bass range:   C2–C3  = MIDI 36–48
 * Melody range: C4–C5  = MIDI 60–72
 * Arp range:    C5–C6  = MIDI 72–84
 */
const BIOME_CONFIGS: Record<string, BiomeVariation[]> = {
  // -------------------------------------------------------------------------
  // FOREST — C major pentatonic, gentle and peaceful
  // -------------------------------------------------------------------------
  forest: [
    {
      tempo: 130,
      waveform: 'triangle',
      bassWaveform: 'square',
      bassPhrases: [
        [36, 38, 40, 43, 45, 36, 40, 43],
        [36, 40, 43, 45, 43, 40, 36, 38],
        [38, 40, 43, 40, 36, 38, 40, 36],
      ],
      melodyPhrases: [
        [60, 62, 64, 67, 69, 72, 69, 67, 64, 62, 60, 64, 67, 69, 64, 60],
        [67, 69, 72, 69, 67, 64, 62, 60, 62, 64, 67, 64, 60, 62, 64, 67],
        [60, 64, 67, 64, 60, 62, 64, 62, 60, 67, 69, 67, 64, 60, 62, 60],
      ],
      arpPhrases: [
        [72, 76, 79, 76, 72, 69, 72, 76],
        [79, 76, 72, 69, 72, 76, 79, 76],
        [72, 76, 79, 81, 79, 76, 72, 69],
      ],
    },
    {
      tempo: 120,
      waveform: 'triangle',
      bassWaveform: 'square',
      bassPhrases: [
        [36, 43, 36, 40, 38, 43, 40, 36],
        [40, 43, 45, 43, 40, 38, 36, 38],
        [36, 38, 43, 40, 36, 45, 43, 36],
      ],
      melodyPhrases: [
        [69, 67, 64, 62, 60, 62, 64, 67, 69, 72, 69, 67, 64, 60, 62, 64],
        [60, 62, 64, 60, 67, 64, 62, 60, 64, 67, 69, 67, 64, 62, 60, 62],
        [72, 69, 67, 64, 62, 60, 62, 64, 67, 64, 60, 62, 64, 67, 64, 60],
      ],
      arpPhrases: [
        [72, 74, 76, 79, 76, 74, 72, 69],
        [76, 79, 81, 79, 76, 72, 69, 72],
        [69, 72, 76, 79, 76, 72, 69, 72],
      ],
    },
  ],

  // -------------------------------------------------------------------------
  // ROCKY HIGHLANDS — A natural minor, deeper and rhythmic
  // -------------------------------------------------------------------------
  rocky_highlands: [
    {
      tempo: 150,
      waveform: 'square',
      bassWaveform: 'sawtooth',
      bassPhrases: [
        [45, 45, 43, 40, 41, 43, 45, 43],
        [40, 43, 45, 43, 41, 40, 38, 40],
        [45, 43, 41, 40, 38, 40, 43, 45],
      ],
      melodyPhrases: [
        [69, 67, 65, 64, 62, 60, 62, 64, 65, 64, 62, 60, 62, 65, 67, 65],
        [60, 62, 64, 65, 67, 65, 64, 62, 60, 62, 65, 64, 62, 60, 64, 65],
        [65, 67, 69, 67, 65, 64, 62, 60, 62, 64, 65, 64, 62, 65, 67, 65],
      ],
      arpPhrases: [
        [69, 72, 76, 72, 69, 65, 69, 72],
        [72, 76, 77, 76, 72, 69, 65, 69],
        [65, 69, 72, 76, 72, 69, 65, 69],
      ],
    },
    {
      tempo: 160,
      waveform: 'square',
      bassWaveform: 'sawtooth',
      bassPhrases: [
        [40, 40, 43, 45, 43, 40, 38, 40],
        [45, 43, 40, 38, 40, 43, 45, 43],
        [38, 40, 43, 40, 38, 41, 43, 40],
      ],
      melodyPhrases: [
        [64, 65, 67, 69, 67, 65, 64, 62, 60, 62, 64, 65, 67, 65, 64, 62],
        [69, 67, 65, 64, 62, 64, 65, 67, 69, 67, 65, 62, 60, 62, 65, 67],
        [60, 64, 65, 67, 65, 64, 62, 60, 64, 65, 67, 69, 67, 65, 64, 62],
      ],
      arpPhrases: [
        [72, 69, 65, 62, 65, 69, 72, 69],
        [65, 69, 72, 76, 72, 69, 65, 62],
        [69, 72, 76, 72, 69, 65, 62, 65],
      ],
    },
  ],

  // -------------------------------------------------------------------------
  // SWAMP — Eerie, slow, minor seconds and tritones
  // -------------------------------------------------------------------------
  swamp: [
    {
      tempo: 80,
      waveform: 'triangle',
      bassWaveform: 'triangle',
      bassPhrases: [
        [36, 37, 36, 42, 36, 37, 41, 36],
        [36, 42, 37, 36, 41, 36, 42, 37],
        [37, 36, 42, 41, 36, 37, 36, 42],
      ],
      melodyPhrases: [
        [60, 61, 60, 66, 65, 64, 61, 60, 66, 61, 65, 60, 61, 66, 64, 65],
        [66, 65, 61, 60, 61, 65, 66, 65, 60, 61, 60, 66, 65, 61, 60, 66],
        [61, 60, 66, 61, 65, 66, 60, 61, 65, 66, 61, 60, 66, 65, 61, 60],
      ],
      arpPhrases: [
        [72, 73, 78, 73, 72, 78, 73, 72],
        [73, 72, 78, 72, 73, 66, 73, 78],
        [78, 73, 72, 73, 78, 72, 73, 66],
      ],
    },
    {
      tempo: 75,
      waveform: 'triangle',
      bassWaveform: 'triangle',
      bassPhrases: [
        [36, 41, 36, 37, 42, 36, 41, 37],
        [42, 36, 37, 36, 42, 41, 36, 37],
        [36, 37, 41, 42, 37, 36, 42, 41],
      ],
      melodyPhrases: [
        [65, 66, 60, 61, 66, 65, 61, 60, 65, 66, 61, 65, 60, 61, 66, 60],
        [60, 66, 65, 61, 60, 65, 66, 61, 66, 60, 61, 65, 66, 60, 61, 65],
        [61, 65, 66, 60, 61, 66, 60, 65, 61, 60, 66, 61, 65, 66, 60, 61],
      ],
      arpPhrases: [
        [66, 73, 72, 78, 72, 73, 66, 73],
        [72, 78, 73, 66, 73, 78, 72, 73],
        [73, 66, 72, 78, 66, 72, 73, 78],
      ],
    },
  ],

  // -------------------------------------------------------------------------
  // VOLCANIC WASTES — Intense, fast, D harmonic minor
  // -------------------------------------------------------------------------
  volcanic_wastes: [
    {
      tempo: 175,
      waveform: 'sawtooth',
      bassWaveform: 'square',
      bassPhrases: [
        [38, 38, 41, 38, 45, 41, 38, 43],
        [38, 45, 41, 43, 38, 41, 45, 38],
        [41, 38, 43, 45, 43, 41, 38, 41],
      ],
      melodyPhrases: [
        [62, 65, 69, 68, 65, 62, 63, 65, 69, 72, 69, 65, 62, 68, 65, 62],
        [69, 65, 62, 63, 65, 68, 69, 65, 62, 65, 69, 72, 68, 65, 63, 62],
        [62, 63, 65, 68, 69, 65, 62, 68, 65, 63, 62, 65, 68, 69, 65, 62],
      ],
      arpPhrases: [
        [74, 72, 69, 65, 62, 65, 69, 72],
        [69, 72, 74, 72, 69, 65, 62, 65],
        [65, 69, 72, 74, 72, 68, 65, 69],
      ],
    },
    {
      tempo: 185,
      waveform: 'sawtooth',
      bassWaveform: 'square',
      bassPhrases: [
        [38, 43, 45, 43, 38, 41, 38, 45],
        [45, 41, 38, 43, 41, 38, 45, 43],
        [38, 41, 45, 38, 43, 45, 41, 38],
      ],
      melodyPhrases: [
        [65, 68, 69, 65, 62, 63, 65, 69, 68, 65, 62, 65, 69, 72, 69, 65],
        [72, 69, 65, 62, 65, 68, 69, 65, 63, 62, 65, 69, 68, 65, 62, 63],
        [62, 65, 68, 69, 65, 63, 62, 65, 68, 69, 72, 69, 65, 62, 65, 68],
      ],
      arpPhrases: [
        [74, 69, 65, 62, 65, 69, 74, 72],
        [72, 74, 72, 69, 65, 62, 65, 69],
        [65, 62, 65, 69, 72, 74, 72, 69],
      ],
    },
  ],

  // -------------------------------------------------------------------------
  // CORRUPTED LANDS — Dark, slow, tritones and minor seconds (B diminished)
  // -------------------------------------------------------------------------
  corrupted_lands: [
    {
      tempo: 70,
      waveform: 'square',
      bassWaveform: 'triangle',
      bassPhrases: [
        [35, 41, 35, 40, 35, 41, 38, 35],
        [35, 38, 41, 35, 40, 35, 41, 40],
        [41, 35, 40, 38, 35, 41, 35, 38],
      ],
      melodyPhrases: [
        [59, 60, 66, 65, 60, 59, 65, 66, 60, 59, 63, 66, 65, 60, 59, 65],
        [65, 66, 60, 59, 65, 63, 59, 60, 66, 65, 59, 60, 63, 65, 66, 60],
        [60, 59, 65, 66, 59, 60, 66, 65, 63, 60, 59, 65, 60, 66, 65, 59],
      ],
      arpPhrases: [
        [71, 77, 72, 71, 77, 66, 71, 77],
        [77, 71, 66, 72, 71, 77, 72, 66],
        [66, 72, 77, 71, 66, 77, 72, 71],
      ],
    },
    {
      tempo: 65,
      waveform: 'square',
      bassWaveform: 'triangle',
      bassPhrases: [
        [35, 40, 35, 41, 38, 35, 40, 41],
        [38, 35, 41, 40, 35, 38, 41, 35],
        [35, 41, 38, 35, 40, 41, 35, 38],
      ],
      melodyPhrases: [
        [66, 65, 59, 60, 65, 66, 60, 59, 63, 65, 66, 60, 59, 65, 63, 60],
        [59, 63, 65, 66, 60, 59, 60, 66, 65, 63, 59, 60, 65, 66, 59, 63],
        [63, 60, 59, 65, 66, 60, 59, 63, 65, 59, 60, 66, 65, 60, 63, 59],
      ],
      arpPhrases: [
        [71, 66, 77, 72, 66, 71, 77, 71],
        [66, 77, 71, 66, 72, 77, 71, 66],
        [77, 72, 66, 71, 77, 66, 72, 71],
      ],
    },
  ],
};

// Variants share parent biome music
BIOME_CONFIGS['dark_forest'] = BIOME_CONFIGS['forest'];
BIOME_CONFIGS['pine_forest'] = BIOME_CONFIGS['forest'];
BIOME_CONFIGS['granite_peaks'] = BIOME_CONFIGS['rocky_highlands'];
BIOME_CONFIGS['crystal_caverns'] = BIOME_CONFIGS['rocky_highlands'];
BIOME_CONFIGS['bog'] = BIOME_CONFIGS['swamp'];
BIOME_CONFIGS['marshland'] = BIOME_CONFIGS['swamp'];
BIOME_CONFIGS['ash_fields'] = BIOME_CONFIGS['volcanic_wastes'];
BIOME_CONFIGS['lava_flows'] = BIOME_CONFIGS['volcanic_wastes'];
BIOME_CONFIGS['shadow_realm'] = BIOME_CONFIGS['corrupted_lands'];
BIOME_CONFIGS['void_wastes'] = BIOME_CONFIGS['corrupted_lands'];

/** Fallback variation when biome is unknown. */
const DEFAULT_VARIATION = BIOME_CONFIGS['forest'][0];

// ---------------------------------------------------------------------------
// MusicSystem class
// ---------------------------------------------------------------------------

export class MusicSystem {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  // Per-layer gain nodes
  private melodyGain: GainNode | null = null;
  private arpGain: GainNode | null = null;

  // Biome / variation tracking
  private currentBiome: string = '';
  private currentVariation: BiomeVariation | null = null;
  private pendingBiome: string = '';
  private biomeDebounceTimer: number | null = null;
  private readonly BIOME_SWITCH_DELAY_MS = 3000; // wait 3s before switching music

  // Music state
  private musicState: MusicState = 'exploring';

  // Phrase tracking — bass
  private currentBassPhrase: number[] = [];
  private currentBassNoteIdx: number = 0;

  // Phrase tracking — melody
  private currentMelodyPhrase: number[] = [];
  private currentMelodyNoteIdx: number = 0;

  // Phrase tracking — arp
  private currentArpPhrase: number[] = [];
  private currentArpNoteIdx: number = 0;

  // Percussion state
  private percStep: number = 0;
  private nextPercTime: number = 0;

  // Drone state fields (methods to be implemented in a later task)
  private droneOscs: OscillatorNode[] = [];
  private droneGain: GainNode | null = null;
  private droneLfo: OscillatorNode | null = null;
  private dronePercId: number | null = null;
  private droneActive: boolean = false;

  // Playback state
  private playing = false;

  // Beat timing
  private beatSec: number = 0;

  // Scheduler timing
  private schedulerId: number | null = null;
  private nextBassTime: number = 0;
  private nextMelodyTime: number = 0;
  private nextArpTime: number = 0;

  // How far ahead (seconds) we schedule notes
  private readonly LOOKAHEAD = 0.1;
  // How often (ms) we run the scheduler loop
  private readonly SCHEDULE_INTERVAL = 50;

  constructor() {}

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /** Must be called after a user gesture to comply with browser autoplay policy. */
  init(): void {
    if (this.audioCtx) return;
    this.audioCtx = new AudioContext();

    this.masterGain = this.audioCtx.createGain();
    this.masterGain.gain.value = 0.06;
    this.masterGain.connect(this.audioCtx.destination);

    // Per-layer gain nodes — both routed through master
    this.melodyGain = this.audioCtx.createGain();
    this.melodyGain.gain.value = 1.0;
    this.melodyGain.connect(this.masterGain);

    this.arpGain = this.audioCtx.createGain();
    this.arpGain.gain.value = 0.0; // off until combat
    this.arpGain.connect(this.masterGain);
  }

  /** Switch to music for the given biome. Debounced to avoid rapid switching at biome borders. */
  setBiome(biomeId: string): void {
    if (biomeId === this.currentBiome && biomeId === this.pendingBiome) return;

    // If this is the first biome set (no music yet), apply immediately
    if (!this.currentBiome) {
      this.applyBiome(biomeId);
      return;
    }

    // If we walked back to our current biome, cancel the pending switch
    if (biomeId === this.currentBiome) {
      this.pendingBiome = biomeId;
      if (this.biomeDebounceTimer !== null) {
        window.clearTimeout(this.biomeDebounceTimer);
        this.biomeDebounceTimer = null;
      }
      return;
    }

    // Schedule a delayed switch (resets if biome changes again)
    this.pendingBiome = biomeId;
    if (this.biomeDebounceTimer !== null) {
      window.clearTimeout(this.biomeDebounceTimer);
    }
    this.biomeDebounceTimer = window.setTimeout(() => {
      this.biomeDebounceTimer = null;
      this.applyBiome(this.pendingBiome);
    }, this.BIOME_SWITCH_DELAY_MS);
  }

  /** Actually apply the biome music change. */
  private applyBiome(biomeId: string): void {
    if (biomeId === this.currentBiome) return;
    this.currentBiome = biomeId;
    this.pendingBiome = biomeId;

    const variations = BIOME_CONFIGS[biomeId] ?? BIOME_CONFIGS['forest'];
    this.currentVariation = variations[Math.floor(Math.random() * variations.length)];

    const tempoMultiplier = this.musicState === 'combat' ? 1.1 : 1.0;
    this.beatSec = (60 / (this.currentVariation.tempo * tempoMultiplier)) * 0.5; // eighth-note

    // Pick initial phrases
    this.currentBassPhrase = this.pickNextBassPhrase();
    this.currentBassNoteIdx = 0;
    this.currentMelodyPhrase = this.pickNextMelodyPhrase();
    this.currentMelodyNoteIdx = 0;
    this.currentArpPhrase = this.pickNextArpPhrase();
    this.currentArpNoteIdx = 0;
    this.percStep = 0;

    if (this.audioCtx) {
      const now = this.audioCtx.currentTime;
      this.nextBassTime = now;
      this.nextMelodyTime = now;
      this.nextArpTime = now;
      this.nextPercTime = now;
    }
  }

  start(): void {
    if (this.playing || !this.audioCtx) return;
    this.playing = true;

    if (!this.currentBiome) this.setBiome('forest');

    const now = this.audioCtx.currentTime;
    this.nextBassTime = now;
    this.nextMelodyTime = now;
    this.nextArpTime = now;
    this.nextPercTime = now;

    this.schedulerId = window.setInterval(() => this.schedule(), this.SCHEDULE_INTERVAL);
  }

  stop(): void {
    if (!this.playing) return;
    this.playing = false;
    if (this.schedulerId !== null) {
      clearInterval(this.schedulerId);
      this.schedulerId = null;
    }
    if (this.biomeDebounceTimer !== null) {
      clearTimeout(this.biomeDebounceTimer);
      this.biomeDebounceTimer = null;
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

  /** Transition to a new music state with layer crossfading. */
  setMusicState(state: MusicState): void {
    if (state === this.musicState) return;
    this.musicState = state;

    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    const FADE = 0.5; // seconds for crossfade

    // Recompute tempo for new state
    const variation = this.currentVariation ?? DEFAULT_VARIATION;
    const tempoMultiplier = state === 'combat' ? 1.1 : 1.0;
    this.beatSec = (60 / (variation.tempo * tempoMultiplier)) * 0.5;

    switch (state) {
      case 'exploring':
        // Melody on, arp off
        if (this.melodyGain) {
          this.melodyGain.gain.setTargetAtTime(1.0, now, FADE);
        }
        if (this.arpGain) {
          this.arpGain.gain.setTargetAtTime(0.0, now, FADE);
        }
        break;

      case 'combat':
        // Melody slightly reduced, arp on
        if (this.melodyGain) {
          this.melodyGain.gain.setTargetAtTime(0.75, now, FADE);
        }
        if (this.arpGain) {
          this.arpGain.gain.setTargetAtTime(1.0, now, FADE);
        }
        this.nextPercTime = now; // prevent burst catch-up after long idle
        break;

      case 'idle':
        // Melody faded down, arp off
        if (this.melodyGain) {
          this.melodyGain.gain.setTargetAtTime(0.25, now, FADE);
        }
        if (this.arpGain) {
          this.arpGain.gain.setTargetAtTime(0.0, now, FADE);
        }
        break;
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
  // Phrase pickers
  // ---------------------------------------------------------------------------

  private pickNextBassPhrase(): number[] {
    const variation = this.currentVariation ?? DEFAULT_VARIATION;
    const phrases = variation.bassPhrases;
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  private pickNextMelodyPhrase(): number[] {
    const variation = this.currentVariation ?? DEFAULT_VARIATION;
    const phrases = variation.melodyPhrases;
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  private pickNextArpPhrase(): number[] {
    const variation = this.currentVariation ?? DEFAULT_VARIATION;
    const phrases = variation.arpPhrases;
    if (phrases.length === 0) return [];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  // ---------------------------------------------------------------------------
  // Scheduler
  // ---------------------------------------------------------------------------

  /**
   * Web Audio "look-ahead" scheduler.
   * Called every SCHEDULE_INTERVAL ms; schedules any notes whose time falls
   * within the next LOOKAHEAD seconds.
   */
  private schedule(): void {
    if (!this.audioCtx || !this.playing) return;

    const variation = this.currentVariation ?? DEFAULT_VARIATION;
    const horizon = this.audioCtx.currentTime + this.LOOKAHEAD;
    const beat = this.beatSec;

    // ------------------------------------------------------------------
    // Bass — every 2 beats
    // ------------------------------------------------------------------
    while (this.nextBassTime < horizon) {
      if (this.currentBassPhrase.length === 0) break;
      const note = this.currentBassPhrase[this.currentBassNoteIdx];
      this.playNote(note, variation.bassWaveform, this.nextBassTime, beat * 1.8, 0.55, this.masterGain!);
      this.currentBassNoteIdx++;
      if (this.currentBassNoteIdx >= this.currentBassPhrase.length) {
        this.currentBassPhrase = this.pickNextBassPhrase();
        this.currentBassNoteIdx = 0;
      }
      this.nextBassTime += beat * 2;
    }

    // ------------------------------------------------------------------
    // Melody — every beat, routed through melodyGain
    // ------------------------------------------------------------------
    if (this.melodyGain) {
      while (this.nextMelodyTime < horizon) {
        const note = this.currentMelodyPhrase[this.currentMelodyNoteIdx];
        // Occasional rest: every 4th note is silent 25% of the time
        const isRest = this.currentMelodyNoteIdx % 4 === 3 && Math.random() < 0.25;
        if (!isRest) {
          this.playNote(note, variation.waveform, this.nextMelodyTime, beat * 0.75, 0.38, this.melodyGain);
        }
        this.currentMelodyNoteIdx++;
        if (this.currentMelodyNoteIdx >= this.currentMelodyPhrase.length) {
          this.currentMelodyPhrase = this.pickNextMelodyPhrase();
          this.currentMelodyNoteIdx = 0;
        }
        this.nextMelodyTime += beat;
      }
    }

    // ------------------------------------------------------------------
    // Arp — every half beat, routed through arpGain
    // ------------------------------------------------------------------
    if (this.arpGain && this.currentArpPhrase.length > 0) {
      while (this.nextArpTime < horizon) {
        const note = this.currentArpPhrase[this.currentArpNoteIdx];
        this.playNote(note, 'triangle', this.nextArpTime, beat * 0.45, 0.18, this.arpGain);
        this.currentArpNoteIdx++;
        if (this.currentArpNoteIdx >= this.currentArpPhrase.length) {
          this.currentArpPhrase = this.pickNextArpPhrase();
          this.currentArpNoteIdx = 0;
        }
        this.nextArpTime += beat * 0.5;
      }
    }

    // ------------------------------------------------------------------
    // Percussion — only in combat state
    // ------------------------------------------------------------------
    if (this.musicState === 'combat') {
      while (this.nextPercTime < horizon) {
        this.playPercussion(this.nextPercTime, this.percStep);
        this.percStep = (this.percStep + 1) % 4;
        this.nextPercTime += beat * 2; // quarter-note grid (every 2 eighth-notes)
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Note playback
  // ---------------------------------------------------------------------------

  /**
   * Schedule a single note using a fresh OscillatorNode + GainNode pair.
   * @param midi        MIDI note number
   * @param wave        Oscillator type
   * @param startAt     AudioContext time to start the note
   * @param duration    Duration in seconds
   * @param velocity    Relative loudness (0–1)
   * @param destination Destination GainNode to connect to
   */
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

    // Quick attack, exponential decay for that chiptune "blip" feel
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

  /**
   * Schedule a percussion hit using noise-based synthesis.
   * @param startAt  AudioContext time to start the hit
   * @param beatPos  Beat position (0–3 within a 4-beat bar)
   *                 Beats 0 and 2 = kick (lowpass filtered noise burst)
   *                 Beats 1 and 3 = snare (highpass filtered noise burst)
   */
  private playPercussion(startAt: number, beatPos: number): void {
    if (!this.audioCtx || !this.masterGain) return;

    const ctx = this.audioCtx;
    const isKick = beatPos === 0 || beatPos === 2;

    // Create a short noise buffer (0.1 s)
    const bufferSize = Math.ceil(ctx.sampleRate * 0.1);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Filter: lowpass for kick, highpass for snare
    const filter = ctx.createBiquadFilter();
    if (isKick) {
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      filter.Q.value = 1.0;
    } else {
      filter.type = 'highpass';
      filter.frequency.value = 2000;
      filter.Q.value = 0.5;
    }

    const gain = ctx.createGain();
    const kickVol = 0.35;
    const snareVol = 0.18;
    const vol = isKick ? kickVol : snareVol;
    const decayTime = isKick ? 0.08 : 0.05;

    gain.gain.setValueAtTime(vol, startAt);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + decayTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    source.start(startAt);
    source.stop(startAt + decayTime + 0.01);

    source.onended = () => {
      gain.disconnect();
      filter.disconnect();
      source.disconnect();
    };
  }

  // ---------------------------------------------------------------------------
  // Menu drone
  // ---------------------------------------------------------------------------

  /** Start the dark ambient menu drone. Safe to call multiple times. */
  playMenuDrone(): void {
    if (this.droneActive || !this.audioCtx) return;
    this.droneActive = true;

    const ctx = this.audioCtx;

    // Drone gain — connected directly to destination, independent of masterGain
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0.0;
    this.droneGain.connect(ctx.destination);

    // Fade in
    this.droneGain.gain.setTargetAtTime(0.03, ctx.currentTime, 0.8);

    // Two triangle oscillators with subtle detuning for a warm, dark hum
    // ~110Hz (A2) is low but audible on all speakers
    const freqs = [110, 112];
    for (const freq of freqs) {
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      osc.connect(this.droneGain);
      osc.start();
      this.droneOscs.push(osc);
    }

    // Slow LFO tremolo — gentle breathing
    this.droneLfo = ctx.createOscillator();
    this.droneLfo.type = 'sine';
    this.droneLfo.frequency.value = 0.08;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.012;

    this.droneLfo.connect(lfoGain);
    lfoGain.connect(this.droneGain.gain);
    this.droneLfo.start();

    // Start sporadic percussive noise events
    this.scheduleDronePerc();
  }

  /** Schedule a single filtered noise burst and queue the next one. */
  private scheduleDronePerc(): void {
    if (!this.droneActive || !this.audioCtx || !this.droneGain) return;

    const ctx = this.audioCtx;

    // Short noise buffer with decay envelope applied directly to samples
    const duration = 0.12;
    const bufferSize = Math.ceil(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const decay = Math.pow(1 - i / bufferSize, 2);
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    // Lowpass filter to keep it very dark
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 80;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.2;

    source.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.droneGain);

    source.start();

    source.onended = () => {
      noiseGain.disconnect();
      filter.disconnect();
      source.disconnect();
    };

    // Schedule the next percussive hit at a random interval
    const delay = 6000 + Math.random() * 8000; // 6000–14000 ms
    this.dronePercId = window.setTimeout(() => this.scheduleDronePerc(), delay);
  }

  /** Stop the menu drone with a smooth fade-out. */
  stopMenuDrone(): void {
    if (!this.droneActive) return;
    this.droneActive = false;

    // Cancel the next scheduled perc hit
    if (this.dronePercId !== null) {
      clearTimeout(this.dronePercId);
      this.dronePercId = null;
    }

    // Fade the drone out smoothly
    if (this.droneGain && this.audioCtx) {
      this.droneGain.gain.setTargetAtTime(0, this.audioCtx.currentTime, 0.3);
    }

    // After the fade, stop and disconnect everything
    setTimeout(() => {
      for (const osc of this.droneOscs) {
        try { osc.stop(); } catch { /* already stopped */ }
        osc.disconnect();
      }
      this.droneOscs = [];

      if (this.droneLfo) {
        try { this.droneLfo.stop(); } catch { /* already stopped */ }
        this.droneLfo.disconnect();
        this.droneLfo = null;
      }

      if (this.droneGain) {
        this.droneGain.disconnect();
        this.droneGain = null;
      }
    }, 1500);
  }
}
