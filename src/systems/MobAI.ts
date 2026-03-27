import { MobState, MobCategory } from '@/types/entities';
import { distance } from '@/utils/math';

export class MobAI {
  static update(mob: MobState, playerPos: { x: number; y: number }, category: MobCategory): MobState {
    if (category === 'passive') return MobAI.updatePassive(mob, playerPos);
    return MobAI.updateAggressive(mob, playerPos);
  }

  private static updatePassive(mob: MobState, playerPos: { x: number; y: number }): MobState {
    const distToPlayer = distance(mob.position.x, mob.position.y, playerPos.x, playerPos.y);
    if (distToPlayer < mob.alertRange) return { ...mob, aiState: 'flee' };
    if (mob.aiState === 'flee' && distToPlayer >= mob.alertRange) return { ...mob, aiState: 'idle' };
    return { ...mob, aiState: 'idle' };
  }

  private static updateAggressive(mob: MobState, playerPos: { x: number; y: number }): MobState {
    const distToPlayer = distance(mob.position.x, mob.position.y, playerPos.x, playerPos.y);
    const distToHome = distance(mob.position.x, mob.position.y, mob.homePosition.x, mob.homePosition.y);

    if (mob.aiState !== 'idle' && mob.aiState !== 'returning' && distToHome > mob.leashDistance) {
      return { ...mob, aiState: 'returning', target: null };
    }
    if (mob.aiState === 'returning') {
      if (distance(mob.position.x, mob.position.y, mob.homePosition.x, mob.homePosition.y) < 10) {
        return { ...mob, aiState: 'idle', target: null };
      }
      return mob;
    }
    if (mob.aiState === 'idle' || mob.aiState === 'patrol') {
      if (distToPlayer < mob.alertRange) return { ...mob, aiState: 'alert', target: 'player' };
      return mob;
    }
    if (mob.aiState === 'alert') {
      if (distToPlayer < mob.alertRange) return { ...mob, aiState: 'chase' };
      return { ...mob, aiState: 'idle', target: null };
    }
    if (mob.aiState === 'chase') {
      if (distToPlayer <= mob.attackRange) return { ...mob, aiState: 'attack' };
      if (distToPlayer >= mob.alertRange * 1.5) return { ...mob, aiState: 'returning', target: null };
      return mob;
    }
    if (mob.aiState === 'attack') {
      if (distToPlayer > mob.attackRange * 1.5) return { ...mob, aiState: 'chase' };
      return mob;
    }
    return mob;
  }

  static getMovementDirection(mob: MobState, playerPos: { x: number; y: number }): { dx: number; dy: number } {
    switch (mob.aiState) {
      case 'chase': case 'alert': case 'attack': {
        const dx = playerPos.x - mob.position.x;
        const dy = playerPos.y - mob.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return { dx: 0, dy: 0 };
        return { dx: dx / dist, dy: dy / dist };
      }
      case 'flee': {
        const dx = mob.position.x - playerPos.x;
        const dy = mob.position.y - playerPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return { dx: 0, dy: 0 };
        return { dx: dx / dist, dy: dy / dist };
      }
      case 'returning': {
        const dx = mob.homePosition.x - mob.position.x;
        const dy = mob.homePosition.y - mob.position.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist === 0) return { dx: 0, dy: 0 };
        return { dx: dx / dist, dy: dy / dist };
      }
      default: return { dx: 0, dy: 0 };
    }
  }
}
