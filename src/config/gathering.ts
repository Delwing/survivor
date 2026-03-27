/**
 * Gathering config — defines how resources are harvested.
 * Each resource type specifies:
 * - requiredTool: what tool type is needed (null = hand)
 * - hitsNeeded: base hits to fully harvest the node
 * - baseYield: items per harvest completion
 * - toolBonuses: better tools reduce hits and increase yield
 */

export interface GatheringConfig {
  /** Tool type required: 'axe' | 'pickaxe' | null (hand) */
  requiredTool: 'axe' | 'pickaxe' | null;
  /** Base hits to deplete one resource unit */
  hitsNeeded: number;
  /** Base items per deplete */
  baseYield: number;
}

/** Tool tier lookup — maps item IDs to their gathering power */
export interface ToolPower {
  type: 'axe' | 'pickaxe';
  tier: number;
  hitReduction: number;  // subtract from hitsNeeded (min 1)
  yieldBonus: number;    // extra items per harvest
}

export const TOOL_POWER: Record<string, ToolPower> = {
  wooden_axe:    { type: 'axe',     tier: 1, hitReduction: 0, yieldBonus: 0 },
  stone_axe:     { type: 'axe',     tier: 1, hitReduction: 1, yieldBonus: 0 },
  iron_axe:      { type: 'axe',     tier: 2, hitReduction: 2, yieldBonus: 1 },
  wooden_pickaxe:{ type: 'pickaxe', tier: 1, hitReduction: 0, yieldBonus: 0 },
  iron_pickaxe:  { type: 'pickaxe', tier: 2, hitReduction: 1, yieldBonus: 1 },
  magma_pickaxe: { type: 'pickaxe', tier: 3, hitReduction: 2, yieldBonus: 2 },
};

export const GATHERING_CONFIG: Record<string, GatheringConfig> = {
  // Tier 1 — hand-gatherables
  berries:       { requiredTool: null,      hitsNeeded: 1, baseYield: 2 },
  herbs:         { requiredTool: null,      hitsNeeded: 1, baseYield: 1 },
  meat:          { requiredTool: null,      hitsNeeded: 1, baseYield: 1 }, // from mobs, not nodes

  // Tier 1 — need axe
  wood:          { requiredTool: 'axe',     hitsNeeded: 3, baseYield: 1 },

  // Tier 1 — need pickaxe
  stone:         { requiredTool: 'pickaxe', hitsNeeded: 3, baseYield: 1 },

  // Tier 1 — hand (from mobs)
  slime_gel:     { requiredTool: null,      hitsNeeded: 1, baseYield: 1 },
  bone:          { requiredTool: null,      hitsNeeded: 1, baseYield: 1 },
  hide:          { requiredTool: null,      hitsNeeded: 1, baseYield: 1 },

  // Tier 2 — need pickaxe
  iron_ore:      { requiredTool: 'pickaxe', hitsNeeded: 4, baseYield: 1 },
  copper_ore:    { requiredTool: 'pickaxe', hitsNeeded: 4, baseYield: 1 },
  coal:          { requiredTool: 'pickaxe', hitsNeeded: 3, baseYield: 2 },
  crystal:       { requiredTool: 'pickaxe', hitsNeeded: 5, baseYield: 1 },

  // Tier 3 — hand gatherables (swamp)
  rare_mushroom: { requiredTool: null,      hitsNeeded: 2, baseYield: 1 },
  swamp_reed:    { requiredTool: null,      hitsNeeded: 2, baseYield: 2 },

  // Tier 4 — need pickaxe
  obsidian:      { requiredTool: 'pickaxe', hitsNeeded: 6, baseYield: 1 },
  fire_crystal:  { requiredTool: 'pickaxe', hitsNeeded: 5, baseYield: 1 },
  rare_ore:      { requiredTool: 'pickaxe', hitsNeeded: 6, baseYield: 1 },

  // Tier 5 — need axe or pickaxe
  shadow_essence:{ requiredTool: 'pickaxe', hitsNeeded: 5, baseYield: 1 },
  void_crystal:  { requiredTool: 'pickaxe', hitsNeeded: 7, baseYield: 1 },
  corrupted_wood:{ requiredTool: 'axe',     hitsNeeded: 5, baseYield: 1 },
};

/** Get the effective gathering result for a resource + equipped weapon */
export function getGatherResult(
  resourceId: string,
  equippedWeaponId: string | null,
): { canGather: boolean; hitsNeeded: number; yield: number; reason?: string } {
  const config = GATHERING_CONFIG[resourceId];
  if (!config) {
    // Unknown resource — allow hand gathering
    return { canGather: true, hitsNeeded: 1, yield: 1 };
  }

  // No tool required
  if (!config.requiredTool) {
    return { canGather: true, hitsNeeded: config.hitsNeeded, yield: config.baseYield };
  }

  // Tool required — check if equipped weapon qualifies
  if (!equippedWeaponId) {
    return {
      canGather: false,
      hitsNeeded: config.hitsNeeded,
      yield: 0,
      reason: `Need ${config.requiredTool}`,
    };
  }

  const tool = TOOL_POWER[equippedWeaponId];
  if (!tool || tool.type !== config.requiredTool) {
    return {
      canGather: false,
      hitsNeeded: config.hitsNeeded,
      yield: 0,
      reason: `Need ${config.requiredTool}`,
    };
  }

  const hitsNeeded = Math.max(1, config.hitsNeeded - tool.hitReduction);
  const yield_ = config.baseYield + tool.yieldBonus;

  return { canGather: true, hitsNeeded, yield: yield_ };
}
