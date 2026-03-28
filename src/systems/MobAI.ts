import { MobState, MobCategory } from '@/types/entities';
import { distance } from '@/utils/math';

// ─── Types ──────────────────────────────────────────────────

type AIState = MobState['aiState'];

interface StateResult {
  next: AIState;
  dx: number;
  dy: number;
  speedMult: number;
  /** Partial mob state overrides applied on transition */
  set?: Partial<MobState>;
}

interface AIContext {
  mob: MobState;
  playerPos: { x: number; y: number };
  distToPlayer: number;
  distToHome: number;
  delta: number;
}

/** A state handler returns a StateResult describing movement + optional transition */
type StateHandler = (ctx: AIContext) => StateResult;

// ─── Helpers ────────────────────────────────────────────────

const WANDER_RADIUS = 50;
const WANDER_PAUSE_MIN = 2000;
const WANDER_PAUSE_MAX = 5000;
const WANDER_SPEED = 0.3;

function dirToward(ax: number, ay: number, bx: number, by: number): { dx: number; dy: number } {
  const dx = bx - ax;
  const dy = by - ay;
  const d = Math.sqrt(dx * dx + dy * dy);
  return d === 0 ? { dx: 0, dy: 0 } : { dx: dx / d, dy: dy / d };
}

function stay(state: AIState, set?: Partial<MobState>): StateResult {
  return { next: state, dx: 0, dy: 0, speedMult: 0, set };
}

// ─── Shared state handlers (reusable across profiles) ───────

const idle: StateHandler = (ctx) => {
  return wander(ctx);
};

const patrol: StateHandler = (ctx) => {
  return wander(ctx);
};

function wander(ctx: AIContext): StateResult {
  const { mob, delta } = ctx;

  // Walking to wander target
  if (mob.wanderTarget) {
    const d = distance(mob.position.x, mob.position.y, mob.wanderTarget.x, mob.wanderTarget.y);
    if (d < 5) {
      const pause = WANDER_PAUSE_MIN + Math.random() * (WANDER_PAUSE_MAX - WANDER_PAUSE_MIN);
      return stay('idle', { wanderTarget: null, wanderCooldown: pause });
    }
    const dir = dirToward(mob.position.x, mob.position.y, mob.wanderTarget.x, mob.wanderTarget.y);
    return { next: 'patrol', ...dir, speedMult: WANDER_SPEED };
  }

  // Waiting for cooldown
  const cd = mob.wanderCooldown - delta;
  if (cd > 0) return stay('idle', { wanderCooldown: cd });

  // Pick new wander point
  const angle = Math.random() * Math.PI * 2;
  const radius = 15 + Math.random() * WANDER_RADIUS;
  const wx = mob.homePosition.x + Math.cos(angle) * radius;
  const wy = mob.homePosition.y + Math.sin(angle) * radius;
  return stay('patrol', { wanderTarget: { x: wx, y: wy } });
}

const flee: StateHandler = (ctx) => {
  const { mob, playerPos, distToPlayer } = ctx;
  if (distToPlayer >= mob.alertRange) {
    return stay('idle', { wanderTarget: null, wanderCooldown: WANDER_PAUSE_MIN });
  }
  const dir = dirToward(playerPos.x, playerPos.y, mob.position.x, mob.position.y);
  return { next: 'flee', ...dir, speedMult: 1 };
};

const returning: StateHandler = (ctx) => {
  const { mob } = ctx;
  if (ctx.distToHome < 10) {
    return stay('idle', { target: null, wanderTarget: null, wanderCooldown: WANDER_PAUSE_MIN });
  }
  const dir = dirToward(mob.position.x, mob.position.y, mob.homePosition.x, mob.homePosition.y);
  return { next: 'returning', ...dir, speedMult: 1 };
};

const alert: StateHandler = (ctx) => {
  const { mob, playerPos, distToPlayer } = ctx;
  if (distToPlayer < mob.alertRange) {
    const dir = dirToward(mob.position.x, mob.position.y, playerPos.x, playerPos.y);
    return { next: 'chase', ...dir, speedMult: 1 };
  }
  return stay('idle', { target: null, wanderTarget: null, wanderCooldown: WANDER_PAUSE_MIN });
};

const chase: StateHandler = (ctx) => {
  const { mob, playerPos, distToPlayer } = ctx;
  if (distToPlayer <= mob.attackRange) {
    const dir = dirToward(mob.position.x, mob.position.y, playerPos.x, playerPos.y);
    return { next: 'attack', ...dir, speedMult: 0 };
  }
  if (distToPlayer >= mob.alertRange * 1.5) {
    return stay('returning', { target: null, wanderTarget: null });
  }
  const dir = dirToward(mob.position.x, mob.position.y, playerPos.x, playerPos.y);
  return { next: 'chase', ...dir, speedMult: 1 };
};

const attack: StateHandler = (ctx) => {
  const { mob, playerPos, distToPlayer } = ctx;
  if (distToPlayer > mob.attackRange * 1.5) {
    const dir = dirToward(mob.position.x, mob.position.y, playerPos.x, playerPos.y);
    return { next: 'chase', ...dir, speedMult: 1 };
  }
  return stay('attack');
};

// ─── Behavior profiles ─────────────────────────────────────

type StateMap = Record<AIState, StateHandler>;

/** Passive: wander around, flee from player */
const PASSIVE: StateMap = {
  idle: (ctx) => {
    if (ctx.distToPlayer < ctx.mob.alertRange) {
      return { next: 'flee', dx: 0, dy: 0, speedMult: 0, set: { wanderTarget: null } };
    }
    return idle(ctx);
  },
  patrol: (ctx) => {
    if (ctx.distToPlayer < ctx.mob.alertRange) {
      return { next: 'flee', dx: 0, dy: 0, speedMult: 0, set: { wanderTarget: null } };
    }
    return patrol(ctx);
  },
  flee,
  returning,
  // Passive mobs don't use these, but needed for type completeness
  alert: idle,
  chase: idle,
  attack: idle,
};

/** Aggressive: wander, alert→chase→attack, leash back home */
const AGGRESSIVE: StateMap = {
  idle: (ctx) => {
    if (ctx.distToPlayer < ctx.mob.alertRange) {
      return stay('alert', { target: 'player', wanderTarget: null });
    }
    return idle(ctx);
  },
  patrol: (ctx) => {
    if (ctx.distToPlayer < ctx.mob.alertRange) {
      return stay('alert', { target: 'player', wanderTarget: null });
    }
    return patrol(ctx);
  },
  alert,
  chase,
  attack,
  flee,
  returning,
};

const PROFILES: Record<MobCategory, StateMap> = {
  passive: PASSIVE,
  aggressive: AGGRESSIVE,
  elite: AGGRESSIVE,
  boss: AGGRESSIVE,
};

// ─── Public API (same interface as before) ──────────────────

export class MobAI {
  static update(mob: MobState, playerPos: { x: number; y: number }, category: MobCategory, delta: number): MobState {
    const profile = PROFILES[category];
    const handler = profile[mob.aiState];

    const distToPlayer = distance(mob.position.x, mob.position.y, playerPos.x, playerPos.y);
    const distToHome = distance(mob.position.x, mob.position.y, mob.homePosition.x, mob.homePosition.y);

    // Leash check (aggressive/elite/boss only) — overrides any state
    if (category !== 'passive' && mob.aiState !== 'idle' && mob.aiState !== 'returning' && mob.aiState !== 'patrol' && distToHome > mob.leashDistance) {
      return { ...mob, aiState: 'returning', target: null, wanderTarget: null };
    }

    const ctx: AIContext = { mob, playerPos, distToPlayer, distToHome, delta };
    const result = handler(ctx);

    return {
      ...mob,
      aiState: result.next,
      ...result.set,
    };
  }

  static getMovementDirection(mob: MobState, playerPos: { x: number; y: number }): { dx: number; dy: number; speedMult: number } {
    // Re-run the handler to get movement (stateless, no side effects)
    // This avoids storing movement on MobState
    const profile = PROFILES[mob.aiState === 'flee' ? 'passive' : 'aggressive'];
    const handler = profile[mob.aiState];
    const distToPlayer = distance(mob.position.x, mob.position.y, playerPos.x, playerPos.y);
    const distToHome = distance(mob.position.x, mob.position.y, mob.homePosition.x, mob.homePosition.y);
    const ctx: AIContext = { mob, playerPos, distToPlayer, distToHome, delta: 0 };
    const result = handler(ctx);
    return { dx: result.dx, dy: result.dy, speedMult: result.speedMult };
  }
}
