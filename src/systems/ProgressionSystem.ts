import { RECIPE_DEFINITIONS } from '@/config/recipes';

const SAVE_KEY = 'survivor_meta';

export interface MetaSave {
  knownRecipes: string[];
  unlockedNPCTypes: string[];
  milestones: Record<string, number>;
  totalRuns: number;
  startingBonuses: string[];
}

function defaultSave(): MetaSave {
  return { knownRecipes: [], unlockedNPCTypes: [], milestones: {}, totalRuns: 0, startingBonuses: [] };
}

export class ProgressionSystem {
  private data: MetaSave;

  constructor(private storage: Storage) { this.data = this.load(); }

  load(): MetaSave {
    const raw = this.storage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    try { return JSON.parse(raw) as MetaSave; } catch { return defaultSave(); }
  }

  save(): void { this.storage.setItem(SAVE_KEY, JSON.stringify(this.data)); }
  getSave(): MetaSave { return this.data; }

  addRecipe(recipeId: string): void {
    if (!this.data.knownRecipes.includes(recipeId)) this.data.knownRecipes.push(recipeId);
  }

  incrementMilestone(milestoneId: string): void {
    this.data.milestones[milestoneId] = (this.data.milestones[milestoneId] ?? 0) + 1;
  }

  unlockNPCType(npcTypeId: string): void {
    if (!this.data.unlockedNPCTypes.includes(npcTypeId)) this.data.unlockedNPCTypes.push(npcTypeId);
  }

  recordRunEnd(): void { this.data.totalRuns += 1; this.save(); }

  getStartingRecipeIds(): string[] {
    const knownDiscovery = RECIPE_DEFINITIONS.filter(r => r.discovery === 'known').map(r => r.id);
    return Array.from(new Set([...knownDiscovery, ...this.data.knownRecipes]));
  }

  getMilestoneCount(milestoneId: string): number { return this.data.milestones[milestoneId] ?? 0; }
}
