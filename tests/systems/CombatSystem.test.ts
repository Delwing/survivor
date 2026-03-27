import { describe, it, expect, vi } from 'vitest';
import { CombatSystem } from '@/systems/CombatSystem';
import { EventBus } from '@/systems/EventBus';
import { EntityStats } from '@/types/entities';

function makeStats(overrides: Partial<EntityStats> = {}): EntityStats {
  return { health: 100, maxHealth: 100, attack: 10, defense: 3, speed: 100, attackSpeed: 1, ...overrides };
}

describe('CombatSystem', () => {
  it('calculates damage as attack - defense with variance', () => {
    const combat = new CombatSystem(new EventBus());
    const attacker = makeStats({ attack: 15 });
    const defender = makeStats({ defense: 5 });
    const damage = combat.calculateDamage(attacker, defender);
    expect(damage).toBeGreaterThanOrEqual(8);
    expect(damage).toBeLessThanOrEqual(12);
  });
  it('deals minimum 1 damage when defense >= attack', () => {
    const combat = new CombatSystem(new EventBus());
    const damage = combat.calculateDamage(makeStats({ attack: 3 }), makeStats({ defense: 20 }));
    expect(damage).toBeGreaterThanOrEqual(1);
  });
  it('applies damage and reduces defender health', () => {
    const combat = new CombatSystem(new EventBus());
    const defender = makeStats({ health: 50, defense: 0 });
    combat.applyDamage('a', 'd', makeStats({ attack: 10 }), defender);
    expect(defender.health).toBeLessThan(50);
    expect(defender.health).toBeGreaterThanOrEqual(38);
  });
  it('emits damage-dealt event', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('damage-dealt', handler);
    const combat = new CombatSystem(bus);
    combat.applyDamage('a', 'd', makeStats({ attack: 10 }), makeStats({ defense: 0 }));
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ attackerId: 'a', defenderId: 'd' }));
  });
  it('health does not go below 0', () => {
    const combat = new CombatSystem(new EventBus());
    const defender = makeStats({ health: 5, defense: 0 });
    combat.applyDamage('a', 'd', makeStats({ attack: 200 }), defender);
    expect(defender.health).toBe(0);
  });
  it('canAttack respects attack speed cooldown', () => {
    const combat = new CombatSystem(new EventBus());
    expect(combat.canAttack(2, 0, 600)).toBe(true);
    expect(combat.canAttack(2, 0, 400)).toBe(false);
  });
});
