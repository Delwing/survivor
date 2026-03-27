export interface GameEvents {
  'player-moved': { x: number; y: number };
  'player-died': { cause: string };
  'mob-killed': { mobId: string; mobTypeId: string };
  'item-picked-up': { itemId: string; count: number };
  'item-crafted': { recipeId: string };
  'recipe-discovered': { recipeId: string; method: string };
  'chunk-entered': { chunkX: number; chunkY: number; biomeId: string };
  'npc-hired': { npcTypeId: string };
  'npc-collected': { npcId: string; itemId: string; count: number };
  'ability-used': { abilityId: string };
  'damage-dealt': { attackerId: string; defenderId: string; damage: number };
  'run-started': { seed: string };
  'run-ended': { survived: number; recipesFound: number };
}
