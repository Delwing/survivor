import { describe, it, expect } from 'vitest';
import { ITEM_DEFINITIONS, getItemDef } from '@/config/items';
import { RECIPE_DEFINITIONS } from '@/config/recipes';
import { BIOME_DEFINITIONS } from '@/config/biomes';
import { MOB_DEFINITIONS } from '@/config/mobs';
import { NPC_DEFINITIONS } from '@/config/npcs';

describe('Data validation', () => {
  it('all item IDs are unique', () => {
    const ids = ITEM_DEFINITIONS.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('all recipe IDs are unique', () => {
    const ids = RECIPE_DEFINITIONS.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('all recipe ingredients reference existing items', () => {
    for (const recipe of RECIPE_DEFINITIONS) {
      for (const ingredient of recipe.ingredients) {
        expect(getItemDef(ingredient.item), `Recipe "${recipe.id}" ingredient "${ingredient.item}" not found`).toBeDefined();
      }
    }
  });
  it('all recipe outputs reference existing items', () => {
    for (const recipe of RECIPE_DEFINITIONS) {
      expect(getItemDef(recipe.output.item), `Recipe "${recipe.id}" output "${recipe.output.item}" not found`).toBeDefined();
    }
  });
  it('all biome resource items exist', () => {
    for (const biome of BIOME_DEFINITIONS) {
      for (const resource of biome.resources) {
        expect(getItemDef(resource.itemId), `Biome "${biome.id}" resource "${resource.itemId}" not found`).toBeDefined();
      }
    }
  });
  it('all biome mob references exist', () => {
    const mobIds = new Set(MOB_DEFINITIONS.map(m => m.id));
    for (const biome of BIOME_DEFINITIONS) {
      for (const mobId of biome.mobs) {
        expect(mobIds.has(mobId), `Biome "${biome.id}" mob "${mobId}" not found`).toBe(true);
      }
    }
  });
  it('all mob drop items exist', () => {
    for (const mob of MOB_DEFINITIONS) {
      for (const drop of mob.drops) {
        expect(getItemDef(drop.itemId), `Mob "${mob.id}" drop "${drop.itemId}" not found`).toBeDefined();
      }
    }
  });
  it('all NPC hire costs reference existing items', () => {
    for (const npc of NPC_DEFINITIONS) {
      for (const cost of npc.hireCost) {
        expect(getItemDef(cost.item), `NPC "${npc.id}" hire cost "${cost.item}" not found`).toBeDefined();
      }
    }
  });
  it('all NPC gather types reference existing items', () => {
    for (const npc of NPC_DEFINITIONS) {
      expect(getItemDef(npc.gatherType), `NPC "${npc.id}" gatherType "${npc.gatherType}" not found`).toBeDefined();
    }
  });
});
