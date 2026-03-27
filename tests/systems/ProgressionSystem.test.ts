import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProgressionSystem, MetaSave } from '@/systems/ProgressionSystem';

const mockStorage = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => mockStorage.set(key, value)),
  removeItem: vi.fn((key: string) => mockStorage.delete(key)),
  clear: vi.fn(() => mockStorage.clear()),
};

describe('ProgressionSystem', () => {
  beforeEach(() => { mockStorage.clear(); vi.clearAllMocks(); });

  it('creates a fresh save when none exists', () => {
    const prog = new ProgressionSystem(localStorageMock as any);
    const save = prog.load();
    expect(save.knownRecipes).toEqual([]);
    expect(save.unlockedNPCTypes).toEqual([]);
    expect(save.milestones).toEqual({});
    expect(save.totalRuns).toBe(0);
  });
  it('saves and loads recipe knowledge', () => {
    const prog = new ProgressionSystem(localStorageMock as any);
    prog.addRecipe('iron_sword');
    prog.addRecipe('health_potion');
    prog.save();
    const prog2 = new ProgressionSystem(localStorageMock as any);
    const save = prog2.load();
    expect(save.knownRecipes).toContain('iron_sword');
    expect(save.knownRecipes).toContain('health_potion');
  });
  it('does not duplicate recipes', () => {
    const prog = new ProgressionSystem(localStorageMock as any);
    prog.addRecipe('iron_sword');
    prog.addRecipe('iron_sword');
    expect(prog.getSave().knownRecipes.filter(r => r === 'iron_sword').length).toBe(1);
  });
  it('tracks milestones', () => {
    const prog = new ProgressionSystem(localStorageMock as any);
    prog.incrementMilestone('reach_volcanic');
    prog.incrementMilestone('reach_volcanic');
    prog.incrementMilestone('reach_volcanic');
    expect(prog.getSave().milestones['reach_volcanic']).toBe(3);
  });
  it('unlocks NPC types', () => {
    const prog = new ProgressionSystem(localStorageMock as any);
    prog.unlockNPCType('woodcutter');
    expect(prog.getSave().unlockedNPCTypes).toContain('woodcutter');
  });
  it('increments total runs', () => {
    const prog = new ProgressionSystem(localStorageMock as any);
    prog.recordRunEnd();
    prog.recordRunEnd();
    expect(prog.getSave().totalRuns).toBe(2);
  });
  it('getStartingRecipeIds returns known + meta-persisted recipes', () => {
    const prog = new ProgressionSystem(localStorageMock as any);
    prog.addRecipe('iron_sword');
    const ids = prog.getStartingRecipeIds();
    expect(ids).toContain('iron_sword');
    expect(ids).toContain('wood_plank');
    expect(ids).toContain('bandage');
  });
});
