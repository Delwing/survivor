/**
 * Gathering config — defines how resources are harvested.
 *
 * Design: basic resources (wood, stone) can always be gathered by hand,
 * but tools make it much faster and yield more. Higher-tier resources
 * truly require tools (can't mine obsidian bare-handed).
 */

export interface GatheringConfig {
  /** Tool type that helps: 'axe' | 'pickaxe' | null (hand-only) */
  preferredTool: 'axe' | 'pickaxe' | null;
  /** If true, absolutely requires the tool — can't gather without it */
  toolRequired: boolean;
  /** Hits needed WITHOUT proper tool (hand gathering) */
  handHits: number;
  /** Hits needed WITH proper tool (base, before tool bonuses) */
  toolHits: number;
  /** Items yielded per harvest without tool */
  handYield: number;
  /** Items yielded per harvest with tool (base, before tool bonuses) */
  toolYield: number;
}

/** Tool power — maps item IDs to gathering bonuses */
export interface ToolPower {
  type: 'axe' | 'pickaxe';
  tier: number;
  hitReduction: number;  // subtract from toolHits (min 1)
  yieldBonus: number;    // extra items per harvest
}

export const TOOL_POWER: Record<string, ToolPower> = {
  wooden_axe:    { type: 'axe',     tier: 1, hitReduction: 0, yieldBonus: 0 },
  stone_axe:     { type: 'axe',     tier: 1, hitReduction: 1, yieldBonus: 0 },
  iron_axe:      { type: 'axe',     tier: 2, hitReduction: 1, yieldBonus: 0 },
  wooden_pickaxe:{ type: 'pickaxe', tier: 1, hitReduction: 0, yieldBonus: 0 },
  iron_pickaxe:  { type: 'pickaxe', tier: 2, hitReduction: 1, yieldBonus: 0 },
  magma_pickaxe: { type: 'pickaxe', tier: 3, hitReduction: 2, yieldBonus: 1 },
};

export const GATHERING_CONFIG: Record<string, GatheringConfig> = {
  // ── Tier 1 — always hand-gatherable, tools speed it up ──
  berries:       { preferredTool: null,      toolRequired: false, handHits: 1, toolHits: 1, handYield: 2, toolYield: 2 },
  herbs:         { preferredTool: null,      toolRequired: false, handHits: 2, toolHits: 2, handYield: 1, toolYield: 1 },
  slime_gel:     { preferredTool: null,      toolRequired: false, handHits: 1, toolHits: 1, handYield: 1, toolYield: 1 },
  bone:          { preferredTool: null,      toolRequired: false, handHits: 1, toolHits: 1, handYield: 1, toolYield: 1 },
  hide:          { preferredTool: null,      toolRequired: false, handHits: 1, toolHits: 1, handYield: 1, toolYield: 1 },
  meat:          { preferredTool: null,      toolRequired: false, handHits: 1, toolHits: 1, handYield: 1, toolYield: 1 },

  // Wood: hand = very slow (8 hits), axe = moderate (5 hits)
  wood:          { preferredTool: 'axe',     toolRequired: false, handHits: 8, toolHits: 5, handYield: 1, toolYield: 1 },

  // Stone: hand = very slow (10 hits), pickaxe = moderate (5 hits)
  stone:         { preferredTool: 'pickaxe', toolRequired: false, handHits: 10, toolHits: 5, handYield: 1, toolYield: 1 },

  // ── Tier 2 — need pickaxe (can't mine ore by hand) ──
  iron_ore:      { preferredTool: 'pickaxe', toolRequired: true, handHits: 0, toolHits: 6, handYield: 0, toolYield: 1 },
  copper_ore:    { preferredTool: 'pickaxe', toolRequired: true, handHits: 0, toolHits: 6, handYield: 0, toolYield: 1 },
  coal:          { preferredTool: 'pickaxe', toolRequired: false, handHits: 6, toolHits: 3, handYield: 1, toolYield: 1 },
  crystal:       { preferredTool: 'pickaxe', toolRequired: true, handHits: 0, toolHits: 8, handYield: 0, toolYield: 1 },

  // ── Tier 3 — swamp, hand-gatherable but slow ──
  rare_mushroom: { preferredTool: null,      toolRequired: false, handHits: 3, toolHits: 3, handYield: 1, toolYield: 1 },
  swamp_reed:    { preferredTool: null,      toolRequired: false, handHits: 3, toolHits: 3, handYield: 1, toolYield: 1 },

  // ── Tier 4 — requires tools ──
  obsidian:      { preferredTool: 'pickaxe', toolRequired: true, handHits: 0, toolHits: 10, handYield: 0, toolYield: 1 },
  fire_crystal:  { preferredTool: 'pickaxe', toolRequired: true, handHits: 0, toolHits: 8,  handYield: 0, toolYield: 1 },
  rare_ore:      { preferredTool: 'pickaxe', toolRequired: true, handHits: 0, toolHits: 10, handYield: 0, toolYield: 1 },

  // ── Tier 5 — requires tools ──
  shadow_essence:{ preferredTool: 'pickaxe', toolRequired: true, handHits: 0, toolHits: 8,  handYield: 0, toolYield: 1 },
  void_crystal:  { preferredTool: 'pickaxe', toolRequired: true, handHits: 0, toolHits: 12, handYield: 0, toolYield: 1 },
  corrupted_wood:{ preferredTool: 'axe',     toolRequired: true, handHits: 0, toolHits: 8,  handYield: 0, toolYield: 1 },
};

/** Get the effective gathering result for a resource + equipped weapon */
export function getGatherResult(
  resourceId: string,
  equippedWeaponId: string | null,
): { canGather: boolean; hitsNeeded: number; yield: number; reason?: string } {
  const config = GATHERING_CONFIG[resourceId];
  if (!config) {
    return { canGather: true, hitsNeeded: 1, yield: 1 };
  }

  // No preferred tool — always hand-gatherable
  if (!config.preferredTool) {
    return { canGather: true, hitsNeeded: config.handHits, yield: config.handYield };
  }

  // Check if player has the right tool equipped
  const tool = equippedWeaponId ? TOOL_POWER[equippedWeaponId] : null;
  const hasTool = tool && tool.type === config.preferredTool;

  if (!hasTool) {
    // No matching tool
    if (config.toolRequired) {
      return {
        canGather: false,
        hitsNeeded: 0,
        yield: 0,
        reason: `Need ${config.preferredTool}`,
      };
    }
    // Can hand-gather, but slowly
    return {
      canGather: true,
      hitsNeeded: config.handHits,
      yield: config.handYield,
    };
  }

  // Has proper tool — apply bonuses
  const hitsNeeded = Math.max(1, config.toolHits - tool.hitReduction);
  const yield_ = config.toolYield + tool.yieldBonus;

  return { canGather: true, hitsNeeded, yield: yield_ };
}
