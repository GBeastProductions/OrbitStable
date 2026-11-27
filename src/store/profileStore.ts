import { CHASSIS_THEMES, DIFFICULTIES, STORAGE_KEY } from '../data/catalog';
import { DifficultyId, ModCode, OverdriveVfxMode, PlayerProfile, ThemeId } from '../types/game';

export const INITIAL_PROFILE: PlayerProfile = {
  trigger1Code: 'Space',
  trigger1Label: 'SPACE',
  trigger2Code: 'KeyJ',
  trigger2Label: 'KEY J',
  allowPointerTap: true,
  musicEnabled: true,
  musicVolume: 75,
  soundEnabled: true,
  sfxVolume: 80,
  hitSfxMode: 'switch',
  audioOffsetMs: 0,
  bgFxMode: 'dynamic',
  overdriveVfxMode: 'full',
  theme: 'tokyo_pink',
  unlockedThemes: ['tokyo_pink', 'shibuya_cyan', 'emerald'],
  selectedSongId: 'moments_passing',
  selectedDifficulty: 'CHILL',
  equippedMods: [],
  purchasedMods: [],
  unlockedDiffs: ['CHILL'],
  unlockedSongs: [
    'moments_passing',
    'play_aliens',
    'mecha',
    'little_birdy',
    'cosmic_colors',
    'little_two',
    'speechless',
    'firefly',
    'the_other_pot_pie',
  ],
  unlockedBadges: [],
  mechanicStats: {},
  orbs: 0,
  totalOrbsEarned: 0,
  totalOverdrives: 0,
  levelBgSettings: {},
  tutorialSongCompleted: false,
  devUnlocked: false,
  bestScore: 0,
  tierBestScores: { CHILL: 0, NORMAL: 0, HARD: 0, INSANE: 0, DEMON: 0 },
  songRecords: {},
  bestStreak: 0,
  totalHits: 0,
  totalMisses: 0,
  totalPerfects: 0,
  offsetDegSum: 0,
  earlyMisses: 0,
  lateMisses: 0,
  dailyStreak: 0,
  lastDailyDateKey: '',
  completedDailyIds: [],
  completedWeeklyIds: [],
};

const VALID_THEMES = Object.keys(CHASSIS_THEMES) as ThemeId[];
function isValidThemeSlug(t: unknown): t is ThemeId {
  if (typeof t !== 'string') return false;
  if (VALID_THEMES.includes(t)) return true;
  return /^[a-z0-9_]{1,48}$/.test(t);
}
const VALID_VFX_MODES: OverdriveVfxMode[] = ['full', 'subtle', 'off'];
const VALID_MODS: ModCode[] = [
  'EZ',
  'NF',
  'SH',
  'GA',
  'SA',
  'RG',
  'HR',
  'DT',
  'HD',
  'FL',
  'SD',
  'BF',
  'SM',
  'DR',
  'HO',
  'VD',
  'OC',
  'OS',
  'MR',
  'RX',
  'SG',
  'CV',
];

export function loadProfile(): PlayerProfile {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) || localStorage.getItem('orbit_rhythm_v9');
    if (!raw) return { ...INITIAL_PROFILE };
    const parsed = JSON.parse(raw) as Partial<PlayerProfile>;
    const merged: PlayerProfile = {
      ...INITIAL_PROFILE,
      ...parsed,
      tierBestScores: {
        ...INITIAL_PROFILE.tierBestScores,
        ...(parsed.tierBestScores || {}),
      },
      songRecords: { ...(parsed.songRecords || {}) },
      songDiffRecords: { ...(parsed.songDiffRecords || {}) },
      levelBgSettings: { ...(parsed.levelBgSettings || {}) },
      mechanicStats: { ...(parsed.mechanicStats || {}) },
      devUnlocked: false,
      equippedMods: Array.isArray(parsed.equippedMods)
        ? (parsed.equippedMods.filter((m) => VALID_MODS.includes(m)).slice(0, 3) as ModCode[])
        : [],
      purchasedMods: Array.isArray(parsed.purchasedMods)
        ? (parsed.purchasedMods.filter((m) => VALID_MODS.includes(m)) as ModCode[])
        : [],
      unlockedBadges: Array.isArray(parsed.unlockedBadges) ? parsed.unlockedBadges : [],
      unlockedDiffs:
        Array.isArray(parsed.unlockedDiffs) && parsed.unlockedDiffs.length > 0
          ? (parsed.unlockedDiffs.filter((d) => d in DIFFICULTIES) as DifficultyId[])
          : ['CHILL'],
      unlockedSongs:
        Array.isArray(parsed.unlockedSongs) && parsed.unlockedSongs.length > 0
          ? Array.from(new Set([...INITIAL_PROFILE.unlockedSongs, ...parsed.unlockedSongs]))
          : INITIAL_PROFILE.unlockedSongs,
      unlockedThemes:
        Array.isArray(parsed.unlockedThemes) && parsed.unlockedThemes.length > 0
          ? (parsed.unlockedThemes.filter(isValidThemeSlug) as ThemeId[])
          : INITIAL_PROFILE.unlockedThemes,
      totalOverdrives:
        typeof parsed.totalOverdrives === 'number' ? Math.max(0, parsed.totalOverdrives) : 0,
      overdriveVfxMode:
        parsed.overdriveVfxMode && VALID_VFX_MODES.includes(parsed.overdriveVfxMode)
          ? parsed.overdriveVfxMode
          : 'full',
      dailyStreak: typeof parsed.dailyStreak === 'number' ? Math.max(0, parsed.dailyStreak) : 0,
      lastDailyDateKey: typeof parsed.lastDailyDateKey === 'string' ? parsed.lastDailyDateKey : '',
      completedDailyIds: Array.isArray(parsed.completedDailyIds)
        ? parsed.completedDailyIds.filter((id): id is string => typeof id === 'string')
        : [],
      completedWeeklyIds: Array.isArray(parsed.completedWeeklyIds)
        ? parsed.completedWeeklyIds.filter((id): id is string => typeof id === 'string')
        : [],
    };
    if (!isValidThemeSlug(merged.theme)) merged.theme = 'tokyo_pink';
    if (!(merged.selectedDifficulty in DIFFICULTIES)) merged.selectedDifficulty = 'CHILL';
    return merged;
  } catch {
    return { ...INITIAL_PROFILE };
  }
}

export function saveProfile(profile: PlayerProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage quota errors
  }
}
