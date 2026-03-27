import { GameEvents } from '@/types/events';

type EventHandler<T> = (data: T) => void;

export class EventBus {
  private listeners = new Map<string, Set<EventHandler<any>>>();

  on<K extends keyof GameEvents>(event: K, handler: EventHandler<GameEvents[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler);
  }

  off<K extends keyof GameEvents>(event: K, handler: EventHandler<GameEvents[K]>): void {
    this.listeners.get(event)?.delete(handler);
  }

  once<K extends keyof GameEvents>(event: K, handler: EventHandler<GameEvents[K]>): void {
    const wrapper: EventHandler<GameEvents[K]> = (data) => {
      this.off(event, wrapper);
      handler(data);
    };
    this.on(event, wrapper);
  }

  emit<K extends keyof GameEvents>(event: K, data: GameEvents[K]): void {
    this.listeners.get(event)?.forEach((handler) => handler(data));
  }
}
