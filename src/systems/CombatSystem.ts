import { EntityStats } from '@/types/entities';
import { EventBus } from './EventBus';
import { damageVariance } from '@/utils/math';

export class CombatSystem {
  constructor(private eventBus: EventBus) {}

  calculateDamage(attacker: EntityStats, defender: EntityStats): number {
    const baseDamage = Math.max(0, attacker.attack - defender.defense);
    return damageVariance(baseDamage);
  }

  applyDamage(attackerId: string, defenderId: string, attacker: EntityStats, defender: EntityStats): number {
    const damage = this.calculateDamage(attacker, defender);
    defender.health = Math.max(0, defender.health - damage);
    this.eventBus.emit('damage-dealt', { attackerId, defenderId, damage });
    return damage;
  }

  canAttack(attackSpeed: number, lastAttackTime: number, currentTime: number): boolean {
    const interval = 1000 / attackSpeed;
    return (currentTime - lastAttackTime) >= interval;
  }
}
