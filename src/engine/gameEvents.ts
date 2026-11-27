import { DifficultyId, JudgmentTier, RunSummaryData } from '../types/game';

export interface OrbitLifecycleEvents {
  onBeat: { beatIndex: number; bpm: number; songId: string };
  onHit: {
    tier: JudgmentTier;
    streak: number;
    points: number;
    offsetSigned: number;
    songId: string;
  };
  onMiss: { reason: string; degrees: string; songId: string };
  onComboMilestone: { streak: number; tier: 1 | 2 | 3 };
  onTrackChange: { songId: string; title: string; difficulty: DifficultyId };
  onRunComplete: RunSummaryData;
}

type EventKey = keyof OrbitLifecycleEvents;
type Listener<K extends EventKey> = (payload: OrbitLifecycleEvents[K]) => void;

class OrbitEventBus {
  private listeners: { [K in EventKey]?: Set<Listener<K>> } = {};

  subscribe<K extends EventKey>(event: K, listener: Listener<K>): () => void {
    let set = this.listeners[event] as Set<Listener<K>> | undefined;
    if (!set) {
      set = new Set<Listener<K>>();
      this.listeners[event] = set as never;
    }
    set.add(listener);
    return () => {
      set?.delete(listener);
    };
  }

  emit<K extends EventKey>(event: K, payload: OrbitLifecycleEvents[K]): void {
    const set = this.listeners[event] as Set<Listener<K>> | undefined;
    if (!set || set.size === 0) return;
    set.forEach((fn) => {
      try {
        fn(payload);
      } catch {
        // Isolate listener failures from 60fps loop
      }
    });
  }
}

export const orbitEvents = new OrbitEventBus();
