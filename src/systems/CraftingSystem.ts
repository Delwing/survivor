import { RecipeDefinition, CraftingStation } from '@/types/items';
import { InventorySlot } from '@/types/entities';
import { EventBus } from './EventBus';
import { ItemSystem } from './ItemSystem';
import { RECIPE_DEFINITIONS, getRecipeDef } from '@/config/recipes';

export class CraftingSystem {
  constructor(private eventBus: EventBus, private itemSystem: ItemSystem) {}

  canCraft(recipeId: string, inventory: InventorySlot[], knownRecipes: Set<string>, currentStation: CraftingStation): boolean {
    if (!knownRecipes.has(recipeId)) return false;
    const recipe = getRecipeDef(recipeId);
    if (!recipe) return false;
    if (recipe.station !== currentStation) return false;
    return this.itemSystem.hasItems(inventory, recipe.ingredients);
  }

  craft(recipeId: string, inventory: InventorySlot[], knownRecipes: Set<string>, currentStation: CraftingStation): boolean {
    if (!this.canCraft(recipeId, inventory, knownRecipes, currentStation)) return false;
    const recipe = getRecipeDef(recipeId)!;
    for (const ingredient of recipe.ingredients) this.itemSystem.removeItem(inventory, ingredient.item, ingredient.count);
    this.itemSystem.addItem(inventory, recipe.output.item, recipe.output.count);
    this.eventBus.emit('item-crafted', { recipeId });
    return true;
  }

  getKnownRecipes(knownRecipes: Set<string>): RecipeDefinition[] {
    return RECIPE_DEFINITIONS.filter(r => knownRecipes.has(r.id));
  }

  getStartingRecipes(): RecipeDefinition[] {
    return RECIPE_DEFINITIONS.filter(r => r.discovery === 'known');
  }

  checkMaterialDiscovery(materialId: string): RecipeDefinition[] {
    return RECIPE_DEFINITIONS.filter(r => r.discovery === 'material' && r.materialTrigger === materialId);
  }
}
