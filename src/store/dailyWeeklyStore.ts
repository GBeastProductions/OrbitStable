import { DAILY_SONGS, WEEKLY_SONGS } from '../data/catalog';
import { PlayerProfile, SongDefinition } from '../types/game';

/**
 * Rotation epoch: 2026-11-26 00:00:00 UTC.
 * At launch, ONLY Daily #1 (index 0) and Weekly W1 (index 0) are active.
 * Every 24h Daily advances by 1; every 7 days Weekly advances by 1.
 * Past entries move into the Archive; future entries remain strictly sealed.
 */
export const ROTATION_EPOCH_MS = Date.UTC(2026, 10, 26, 0, 0, 0);
export const DAY_MS = 86_400_000;
export const WEEK_MS = 7 * DAY_MS;

export interface RotationSlotInfo<T extends SongDefinition> {
  song: T;
  number: number;
  unlockMs: number;
}

export interface DailyRotationState {
  activeSong: SongDefinition;
  activeDayNumber: number;
  archiveSongs: SongDefinition[];
  upcomingSlots: RotationSlotInfo<SongDefinition>[];
  nextResetMs: number;
  remainingMs: number;
  todayKey: string;
}

export interface WeeklyRotationState {
  activeSong: SongDefinition;
  activeWeekNumber: number;
  archiveSongs: SongDefinition[];
  upcomingSlots: RotationSlotInfo<SongDefinition>[];
  nextResetMs: number;
  remainingMs: number;
  weekKey: string;
}

export function getDailyRotationState(nowMs: number = Date.now()): DailyRotationState {
  const elapsedDays = Math.max(0, Math.floor((nowMs - ROTATION_EPOCH_MS) / DAY_MS));
  const activeIndex = Math.min(DAILY_SONGS.length - 1, elapsedDays);
  const activeSong = DAILY_SONGS[activeIndex];
  const archiveSongs = DAILY_SONGS.slice(0, activeIndex).reverse();
  const upcomingSlots = DAILY_SONGS.slice(activeIndex + 1).map((song, idx) => {
    const slotIndex = activeIndex + 1 + idx;
    return {
      song,
      number: slotIndex + 1,
      unlockMs: ROTATION_EPOCH_MS + slotIndex * DAY_MS,
    };
  });

  const nextResetMs =
    elapsedDays < DAILY_SONGS.length - 1
      ? ROTATION_EPOCH_MS + (elapsedDays + 1) * DAY_MS
      : ROTATION_EPOCH_MS + (elapsedDays + 1) * DAY_MS;
  const remainingMs = Math.max(0, nextResetMs - nowMs);
  const todayKey = `daily-day-${elapsedDays + 1}`;

  return {
    activeSong,
    activeDayNumber: activeIndex + 1,
    archiveSongs,
    upcomingSlots,
    nextResetMs,
    remainingMs,
    todayKey,
  };
}

export function getWeeklyRotationState(nowMs: number = Date.now()): WeeklyRotationState {
  const elapsedWeeks = Math.max(0, Math.floor((nowMs - ROTATION_EPOCH_MS) / WEEK_MS));
  const activeIndex = Math.min(WEEKLY_SONGS.length - 1, elapsedWeeks);
  const activeSong = WEEKLY_SONGS[activeIndex];
  const archiveSongs = WEEKLY_SONGS.slice(0, activeIndex).reverse();
  const upcomingSlots = WEEKLY_SONGS.slice(activeIndex + 1).map((song, idx) => {
    const slotIndex = activeIndex + 1 + idx;
    return {
      song,
      number: slotIndex + 1,
      unlockMs: ROTATION_EPOCH_MS + slotIndex * WEEK_MS,
    };
  });

  const nextResetMs = ROTATION_EPOCH_MS + (elapsedWeeks + 1) * WEEK_MS;
  const remainingMs = Math.max(0, nextResetMs - nowMs);
  const weekKey = `weekly-w-${elapsedWeeks + 1}`;

  return {
    activeSong,
    activeWeekNumber: activeIndex + 1,
    archiveSongs,
    upcomingSlots,
    nextResetMs,
    remainingMs,
    weekKey,
  };
}

/**
 * Strict release gating: ONLY active + past archived Daily/Weekly tracks are playable/visible as playable songs.
 * Future Days (2-10) and Weeks (2-5) remain sealed until their rotation date.
 */
export function getReleasedDailyWeeklySongs(nowMs: number = Date.now()): SongDefinition[] {
  const daily = getDailyRotationState(nowMs);
  const weekly = getWeeklyRotationState(nowMs);
  return [daily.activeSong, ...daily.archiveSongs, weekly.activeSong, ...weekly.archiveSongs];
}

export function isSongReleased(songId: string, nowMs: number = Date.now()): boolean {
  const isDaily = DAILY_SONGS.some((s) => s.id === songId);
  const isWeekly = WEEKLY_SONGS.some((s) => s.id === songId);
  if (!isDaily && !isWeekly) return true;
  return getReleasedDailyWeeklySongs(nowMs).some((s) => s.id === songId);
}

export function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (days > 0) {
    return `${days}d ${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;
  }
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function applyDailyWeeklyCompletion(
  profile: PlayerProfile,
  song: SongDefinition,
  cleared: boolean,
  nowMs: number = Date.now(),
): Partial<PlayerProfile> {
  if (!cleared) return {};
  const updates: Partial<PlayerProfile> = {};

  if (song.isDaily) {
    const daily = getDailyRotationState(nowMs);
    const nextCompleted = profile.completedDailyIds.includes(song.id)
      ? profile.completedDailyIds
      : [...profile.completedDailyIds, song.id];
    updates.completedDailyIds = nextCompleted;

    if (song.id === daily.activeSong.id && profile.lastDailyDateKey !== daily.todayKey) {
      const prevMatch = profile.lastDailyDateKey.match(/^daily-day-(\d+)$/);
      const prevDayNum = prevMatch ? Number(prevMatch[1]) : 0;
      const isConsecutive = prevDayNum === daily.activeDayNumber - 1;
      updates.dailyStreak = isConsecutive ? profile.dailyStreak + 1 : 1;
      updates.lastDailyDateKey = daily.todayKey;
    }
  }

  if (song.isWeekly) {
    const nextWeekly = profile.completedWeeklyIds.includes(song.id)
      ? profile.completedWeeklyIds
      : [...profile.completedWeeklyIds, song.id];
    updates.completedWeeklyIds = nextWeekly;
  }

  return updates;
}
