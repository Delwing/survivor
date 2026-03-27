import Phaser from 'phaser';
import { MobState, MobDefinition } from '@/types/entities';
import { MOB_DEFINITIONS } from '@/config/mobs';

export function createMobState(typeId: string, x: number, y: number): MobState | null {
  const def = MOB_DEFINITIONS.find(m => m.id === typeId);
  if (!def) return null;
  return {
    id: `mob-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    typeId, stats: { ...def.stats },
    position: { x, y }, aiState: 'idle', homePosition: { x, y },
    target: null, leashDistance: def.leashDistance, alertRange: def.alertRange,
    attackRange: def.attackRange, lastAttackTime: 0,
  };
}

export function createMobSprite(scene: Phaser.Scene, x: number, y: number, def: MobDefinition): Phaser.GameObjects.Sprite {
  const sprite = scene.add.sprite(x, y, 'mob');
  sprite.setTint(def.color);
  sprite.setOrigin(0.5, 1);
  return sprite;
}
