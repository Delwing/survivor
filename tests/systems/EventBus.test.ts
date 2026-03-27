import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '@/systems/EventBus';

describe('EventBus', () => {
  it('calls listener when event is emitted', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('player-died', handler);
    bus.emit('player-died', { cause: 'slime' });
    expect(handler).toHaveBeenCalledWith({ cause: 'slime' });
  });

  it('supports multiple listeners for same event', () => {
    const bus = new EventBus();
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    bus.on('mob-killed', handler1);
    bus.on('mob-killed', handler2);
    bus.emit('mob-killed', { mobId: 'm1', mobTypeId: 'slime' });
    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it('removes listener with off()', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.on('player-died', handler);
    bus.off('player-died', handler);
    bus.emit('player-died', { cause: 'slime' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('once() fires handler only once', () => {
    const bus = new EventBus();
    const handler = vi.fn();
    bus.once('item-picked-up', handler);
    bus.emit('item-picked-up', { itemId: 'wood', count: 1 });
    bus.emit('item-picked-up', { itemId: 'stone', count: 1 });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not throw when emitting event with no listeners', () => {
    const bus = new EventBus();
    expect(() => bus.emit('player-died', { cause: 'lava' })).not.toThrow();
  });
});
