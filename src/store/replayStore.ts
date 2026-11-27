import { DifficultyId, ReplayData } from '../types/game';

const REPLAY_STORAGE_KEY = 'orbit_replays_v1';
const MAX_RECENT_REPLAYS = 10;

interface ReplayStorePayload {
  bestReplays: Record<string, ReplayData>;
  recentReplays: ReplayData[];
}

function replayKey(songId: string, difficulty: DifficultyId): string {
  return `${songId}::${difficulty}`;
}

function readStore(): ReplayStorePayload {
  try {
    const raw = localStorage.getItem(REPLAY_STORAGE_KEY);
    if (!raw) return { bestReplays: {}, recentReplays: [] };
    const parsed = JSON.parse(raw) as Partial<ReplayStorePayload>;
    return {
      bestReplays:
        parsed.bestReplays && typeof parsed.bestReplays === 'object' ? parsed.bestReplays : {},
      recentReplays: Array.isArray(parsed.recentReplays) ? parsed.recentReplays : [],
    };
  } catch {
    return { bestReplays: {}, recentReplays: [] };
  }
}

function writeStore(data: ReplayStorePayload): void {
  try {
    localStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // If localStorage quota is tight, trim recent replays first
    try {
      const trimmed: ReplayStorePayload = {
        bestReplays: data.bestReplays,
        recentReplays: data.recentReplays.slice(0, 3),
      };
      localStorage.setItem(REPLAY_STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Ignore storage failures safely
    }
  }
}

export function saveRunReplay(replay: ReplayData, isNewBest: boolean): void {
  const store = readStore();
  const key = replayKey(replay.songId, replay.difficulty);
  const existingBest = store.bestReplays[key];

  if (isNewBest || !existingBest || replay.score >= existingBest.score) {
    store.bestReplays[key] = { ...replay, isBest: true };
  }

  store.recentReplays = [
    replay,
    ...store.recentReplays.filter((r) => r.id !== replay.id),
  ].slice(0, MAX_RECENT_REPLAYS);

  writeStore(store);
}

export function getBestReplayFor(songId: string, difficulty: DifficultyId): ReplayData | null {
  const store = readStore();
  return store.bestReplays[replayKey(songId, difficulty)] || null;
}

export function getLatestReplayForSong(songId: string): ReplayData | null {
  const store = readStore();
  const recent = store.recentReplays.find((r) => r.songId === songId);
  if (recent) return recent;
  const bestMatch = Object.values(store.bestReplays).find((r) => r.songId === songId);
  return bestMatch || null;
}

export function getReplayById(id: string): ReplayData | null {
  const store = readStore();
  const inRecent = store.recentReplays.find((r) => r.id === id);
  if (inRecent) return inRecent;
  const inBest = Object.values(store.bestReplays).find((r) => r.id === id);
  return inBest || null;
}

export function listReplays(): ReplayData[] {
  const store = readStore();
  const map = new Map<string, ReplayData>();
  for (const r of store.recentReplays) map.set(r.id, r);
  for (const r of Object.values(store.bestReplays)) {
    if (!map.has(r.id)) map.set(r.id, r);
  }
  return Array.from(map.values()).sort((a, b) =>
    b.createdAtIso.localeCompare(a.createdAtIso),
  );
}
