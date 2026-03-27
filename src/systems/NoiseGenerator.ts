import { createNoise2D } from 'simplex-noise';
import alea from 'alea';

export class NoiseGenerator {
  private noise2D: (x: number, y: number) => number;

  constructor(seed: string) {
    const prng = alea(seed);
    this.noise2D = createNoise2D(prng);
  }

  get(x: number, y: number): number { return this.noise2D(x, y); }
  getNormalized(x: number, y: number): number { return (this.noise2D(x, y) + 1) / 2; }
  getScaled(x: number, y: number, scale: number): number { return this.noise2D(x * scale, y * scale); }
  getScaledNormalized(x: number, y: number, scale: number): number { return (this.noise2D(x * scale, y * scale) + 1) / 2; }
}
