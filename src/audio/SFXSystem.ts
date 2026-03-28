/** Procedural 8-bit sound effects using the Web Audio API. */

type WaveType = 'square' | 'triangle' | 'sawtooth';

interface SFXDef {
  freq: number;
  endFreq?: number;
  wave: WaveType;
  duration: number;
  volume: number;
}

export class SFXSystem {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;

  init(audioCtx: AudioContext): void {
    if (this.masterGain) return;
    this.audioCtx = audioCtx;
    this.masterGain = audioCtx.createGain();
    this.masterGain.gain.value = 0.12;
    this.masterGain.connect(audioCtx.destination);
  }

  /** Player hits a mob */
  playerHit(): void {
    this.play({ freq: 220, endFreq: 140, wave: 'square', duration: 0.08, volume: 0.6 });
    this.play({ freq: 90, wave: 'triangle', duration: 0.05, volume: 0.4 });
  }

  /** Mob hits the player */
  playerHurt(): void {
    this.play({ freq: 300, endFreq: 100, wave: 'sawtooth', duration: 0.15, volume: 0.5 });
  }

  /** Mob dies */
  mobDeath(): void {
    this.play({ freq: 400, endFreq: 80, wave: 'square', duration: 0.2, volume: 0.4 });
    setTimeout(() => {
      this.play({ freq: 200, endFreq: 60, wave: 'triangle', duration: 0.15, volume: 0.3 });
    }, 80);
  }

  /** Gather hit on a resource (chop/mine) */
  gatherHit(): void {
    const freq = 400 + Math.random() * 100;
    this.play({ freq, endFreq: freq * 0.7, wave: 'square', duration: 0.06, volume: 0.35 });
  }

  /** Resource harvested (item collected) */
  gatherComplete(): void {
    this.play({ freq: 500, endFreq: 700, wave: 'triangle', duration: 0.1, volume: 0.4 });
    setTimeout(() => {
      this.play({ freq: 700, endFreq: 900, wave: 'triangle', duration: 0.08, volume: 0.3 });
    }, 80);
  }

  private play(def: SFXDef): void {
    if (!this.audioCtx || !this.masterGain) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = def.wave;
    osc.frequency.setValueAtTime(def.freq, now);
    if (def.endFreq) {
      osc.frequency.linearRampToValueAtTime(def.endFreq, now + def.duration);
    }

    gain.gain.setValueAtTime(def.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + def.duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + def.duration + 0.01);

    osc.onended = () => {
      gain.disconnect();
      osc.disconnect();
    };
  }
}
