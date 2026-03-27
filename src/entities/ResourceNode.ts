import Phaser from 'phaser';
import { getItemDef } from '@/config/items';

export interface ResourceNodeState {
  id: string;
  itemId: string;
  position: { x: number; y: number };
  remaining: number;
}

export function createResourceNode(itemId: string, x: number, y: number): ResourceNodeState {
  return {
    id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    itemId, position: { x, y },
    remaining: 3 + Math.floor(Math.random() * 5),
  };
}

export function createResourceSprite(scene: Phaser.Scene, x: number, y: number, itemId: string): Phaser.GameObjects.Sprite {
  const def = getItemDef(itemId);
  const sprite = scene.add.sprite(x, y, 'resource_node');
  sprite.setTint(def?.color ?? 0xffd700);
  sprite.setOrigin(0.5, 1);
  return sprite;
}
