import { describe, it, expect } from 'vitest';
import { MobAI } from '@/systems/MobAI';
import { MobState } from '@/types/entities';

function makeMob(overrides: Partial<MobState> = {}): MobState {
  return {
    id: 'mob1', typeId: 'slime',
    stats: { health: 20, maxHealth: 20, attack: 5, defense: 1, speed: 60, attackSpeed: 1 },
    position: { x: 100, y: 100 }, aiState: 'idle',
    homePosition: { x: 100, y: 100 }, target: null,
    leashDistance: 200, alertRange: 100, attackRange: 30, lastAttackTime: 0,
    ...overrides,
  };
}

describe('MobAI', () => {
  it('stays idle when player is out of alert range', () => {
    const mob = makeMob({ alertRange: 100 });
    const result = MobAI.update(mob, { x: 300, y: 300 }, 'aggressive');
    expect(result.aiState).toBe('idle');
  });
  it('transitions to alert when player enters alert range', () => {
    const mob = makeMob({ alertRange: 100, aiState: 'idle' });
    const result = MobAI.update(mob, { x: 150, y: 150 }, 'aggressive');
    expect(result.aiState).toBe('alert');
  });
  it('transitions from alert to chase when close enough', () => {
    const mob = makeMob({ alertRange: 100, aiState: 'alert' });
    const alerted = MobAI.update(mob, { x: 150, y: 150 }, 'aggressive');
    const chasing = MobAI.update(alerted, { x: 150, y: 150 }, 'aggressive');
    expect(chasing.aiState).toBe('chase');
  });
  it('transitions to attack when in attack range', () => {
    const mob = makeMob({ attackRange: 30, aiState: 'chase' });
    const result = MobAI.update(mob, { x: 120, y: 110 }, 'aggressive');
    expect(result.aiState).toBe('attack');
  });
  it('returns to idle when player exceeds leash distance', () => {
    const mob = makeMob({ aiState: 'chase', leashDistance: 200 });
    const result = MobAI.update(mob, { x: 500, y: 500 }, 'aggressive');
    expect(result.aiState).toBe('returning');
  });
  it('passive mobs flee when damaged', () => {
    const mob = makeMob({ aiState: 'idle' });
    const result = MobAI.update(mob, { x: 120, y: 120 }, 'passive');
    expect(result.aiState).toBe('flee');
  });
  it('passive mobs stay idle when player is far', () => {
    const mob = makeMob({ aiState: 'idle', alertRange: 100 });
    const result = MobAI.update(mob, { x: 500, y: 500 }, 'passive');
    expect(result.aiState).toBe('idle');
  });
});
