import Phaser from 'phaser';
import { PlayerState } from '@/types/entities';
import { createPlayerAnimations } from '@/graphics/TextureGenerator';

export function createPlayerState(): PlayerState {
  return {
    id: 'player',
    stats: { health: 100, maxHealth: 100, attack: 5, defense: 0, speed: 120, attackSpeed: 1, hunger: 100, maxHunger: 100 },
    position: { x: 0, y: 0 },
    equipment: { weapon: null, armor: null, ability1: null, ability2: null },
    inventory: [],
    autoAttackTarget: null,
    abilityCooldowns: {},
  };
}

export function createPlayerSprite(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Sprite {
  createPlayerAnimations(scene);
  const sprite = scene.add.sprite(x, y, 'player');
  sprite.setOrigin(0.5, 1);
  sprite.play('player_idle');
  return sprite;
}
