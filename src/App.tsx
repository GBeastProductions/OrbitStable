import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { audioEngine } from './audio/audioEngine';
import { BackgroundBackdrop } from './components/BackgroundBackdrop';
import { AxiomDevStudio, DevToolTabId } from './components/dev/AxiomDevStudio';
import { IndexScreen } from './components/IndexScreen';
import { ZoomWarpTransition } from './components/LazerChrome';
import { CustomDecorLayer, StudioLayoutProvider } from './components/LiveLayoutWrapper';
import { ModDrawer } from './components/ModDrawer';
import { OrbShopScreen } from './components/OrbShopScreen';
import { CanvasRenderState, OrbitStage } from './components/OrbitStage';
import { PauseDrawer } from './components/PauseDrawer';
import { RunSummaryModal } from './components/RunSummaryModal';
import { AuthAccountSummary, SettingsScreen } from './components/SettingsScreen';
import { SkinAtmosphere } from './components/SkinAtmosphere';
import { SongSelectScreen } from './components/SongSelectScreen';
import { TitleScreen } from './components/TitleScreen';
import { TopBar } from './components/TopBar';
import {
  DIFFICULTIES,
  HERO_DISCO_IMAGE,
  MOD_CATALOG,
  NEEDLE_TOLERANCE,
  SONG_CATALOG,
  TUTORIAL_LESSONS,
  WAVE_MODES,
} from './data/catalog';
import { evaluateMilestoneThemes, setRuntimeSkinPackOverrides } from './data/skinManifests';
import {
  auth,
  checkUserDeveloperRole,
  deletePublishedDevAssetFromCloud,
  fetchLivePublishedCatalog,
  fetchUserCloudProfile,
  handleAuthRedirectOnBoot,
  publishDevAssetToCloud,
  publishHudLayoutToCloud,
  publishSongToCloud,
  publishThemeToCloud,
  signInWithGooglePopup,
  signInWithGoogleRedirect,
  signOutAccount,
  syncUserProfileToCloud,
} from './firebase';
import {
  buildSongBeatmap,
  computeHitPoints,
  computeLetterRank,
  computeRankOrbBonus,
  computeTotalMultiplier,
  countBeatmapPerfectUnits,
  evaluateEarnedBadges,
  formatTimeSec,
  getSectionAtProgress,
  getStreakMultiplier,
  isCashOutEligible,
  signedAngleDiff,
  wrapAngle,
} from './engine/beatmap';
import { orbitEvents } from './engine/gameEvents';
import {
  applyDailyWeeklyCompletion,
  getReleasedDailyWeeklySongs,
  isSongReleased,
} from './store/dailyWeeklyStore';
import { INITIAL_PROFILE, loadProfile, saveProfile } from './store/profileStore';
import {
  getBestReplayFor,
  getLatestReplayForSong,
  getReplayById,
  saveRunReplay,
} from './store/replayStore';
import {
  buildEditableThemeFromBuiltIn,
  clearStudioDrafts,
  DEFAULT_HUD_LAYOUT,
  getResolvedChassisTheme,
  getResolvedSkinPack,
  loadStudioDrafts,
  LocalStudioDraftBundle,
  mergeHudLayout,
  mergeSongsCatalog,
  mergeThemesCatalog,
  saveStudioDrafts,
} from './store/studioRegistryStore';
import {
  BeatmapNote,
  BgFxMode,
  CustomDecorWidget,
  DevAssetItem,
  DifficultyId,
  EditableThemePayload,
  GamePhase,
  HitErrorTick,
  HitSfxMode,
  JudgmentTier,
  MechanicStat,
  ModCode,
  NextCuePreview,
  OverdriveVfxMode,
  PauseTabId,
  PlayerProfile,
  PracticeCheckpoint,
  PublishedHudLayout,
  ReplayData,
  ReplayInputEvent,
  RunSummaryData,
  ScreenView,
  ShockwaveRing,
  SkinPackManifest,
  SongDefinition,
  SongSection,
  TargetSector,
  ThemeId,
  TutorialLesson,
  WaveModeId,
} from './types/game';

interface RuntimeEngine {
  phase: GamePhase;
  score: number;
  hp: number;
  streak: number;
  maxStreakInRun: number;
  unbankedOrbs: number;
  shields: number;
  spinnerAngle: number;
  direction: 1 | -1;
  baseAngularSpeed: number;
  angularSpeed: number;
  waveModeId: WaveModeId;
  waveIndex: number;
  waitingForCue: boolean;
  breakRemainingSec: number;
  targets: TargetSector[];
  hazards: { angle: number; halfWidth: number }[];
  portal: {
    entryAngle: number;
    exitAngle: number;
    halfWidth: number;
    warped: boolean;
    warpFlashTimer: number;
  } | null;
  waveElapsed: number;
  songTime: number;
  songSection: SongSection;
  beatmap: BeatmapNote[];
  beatmapIndex: number;
  hitEffects: {
    timer: number;
    duration: number;
    angle: number;
    isPerfect: boolean;
    label: string;
    color: string;
  }[];
  hitErrorTicks: HitErrorTick[];
  hubStatusText: string;
  hubStatusColor: string | null;
  hubStatusTimer: number;
  shakeTime: number;
  shakeAmplitude: number;
  shakeX: number;
  missReason: string;
  missDegrees: string;
  missNearestEdge: number;
  missSignedSpan: number;
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
  runOffsetDegSum: number;
  runHitCount: number;
  runOffsetSamples: number[];
  isTutorialRun: boolean;
  tutorialLives: number;
  shownLessonIds: Set<string>;
  activeLesson: TutorialLesson | null;
  activeLessonTimer: number;
  lessonSlowActive: boolean;
  tutorialGuideDisabled: boolean;
  dialTimeScale: number;
  cinematicTimer: number;
  dialVisualAlpha: number;
  dialSpinBoost: number;
  sandboxModeId: WaveModeId | null;
  beatPulse: number;
  activeBeatLed: number;
  pendingHits: number;
  pendingPerfects: number;
  pendingOffsetDegSum: number;
  pendingMisses: number;
  pendingEarlyMisses: number;
  pendingLateMisses: number;
  pendingMechanicDeltas: Partial<Record<WaveModeId, MechanicStat>>;
  lastPhysicsTimeMs: number;
  lastSweepRate: number;
  physicsAccum: number;
  // Phase 2: Overdrive, Visual Anticipation, Practice & Replay
  overdriveCharge: number;
  overdriveActive: boolean;
  overdriveTimeLeft: number;
  overdrivePerfectsEarned: number;
  overdriveTargetPerfects: number;
  overdriveUsedThisRun: boolean;
  runTriggeredOverdrive: boolean;
  shockwaves: ShockwaveRing[];
  nextCuePreview: NextCuePreview | null;
  practiceMode: boolean;
  practicePaused: boolean;
  practiceStartSec: number;
  practiceSpeed: number;
  checkpoints: PracticeCheckpoint[];
  checkpointNextId: number;
  replayMode: boolean;
  replayData: ReplayData | null;
  replayEventIndex: number;
  replaySpeed: number;
  replayPaused: boolean;
  replayLastClickLabel: string;
  recordedEvents: ReplayInputEvent[];
  silentSeek: boolean;
}

function formatKeyLabel(e: KeyboardEvent): string {
  if (e.code === 'Space') return 'SPACE';
  if (e.code.startsWith('Key')) return `KEY ${e.code.slice(3).toUpperCase()}`;
  if (e.code.startsWith('Digit')) return e.code.slice(5);
  if (e.code.startsWith('Arrow')) return e.code.slice(5).toUpperCase();
  return e.code.toUpperCase();
}

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(() => loadProfile());
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authUser, setAuthUser] = useState<AuthAccountSummary | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDeveloper, setIsDeveloper] = useState<boolean>(false);
  const [baseSongs, setBaseSongs] = useState<SongDefinition[]>(() => [
    ...SONG_CATALOG,
    ...getReleasedDailyWeeklySongs(),
  ]);
  const [publishedCatalog, setPublishedCatalog] = useState<{
    songs: SongDefinition[];
    themes: EditableThemePayload[];
    hudLayouts: PublishedHudLayout[];
    assets: DevAssetItem[];
  }>({ songs: [], themes: [], hudLayouts: [], assets: [] });
  const [studioDrafts, setStudioDrafts] = useState<LocalStudioDraftBundle>(() => loadStudioDrafts());
  const studioDraftsRef = useRef(studioDrafts);
  studioDraftsRef.current = studioDrafts;
  const draftHistoryPastRef = useRef<LocalStudioDraftBundle[]>([]);
  const draftHistoryFutureRef = useRef<LocalStudioDraftBundle[]>([]);
  const [historyCounts, setHistoryCounts] = useState({ past: 0, future: 0 });
  const lastHistoryPushMsRef = useRef(0);
  const [devStudioOpen, setDevStudioOpen] = useState(false);
  const [devActiveTab, setDevActiveTab] = useState<DevToolTabId>('overdrive');
  const [hudEditModeActive, setHudEditModeActive] = useState(false);
  const [selectedHudWidgetId, setSelectedHudWidgetId] = useState<string | null>(null);
  const [selectedDecorId, setSelectedDecorId] = useState<string | null>(null);
  const [odPreviewCharge, setOdPreviewCharge] = useState<number | null>(null);
  const [odPreviewActive, setOdPreviewActive] = useState(false);

  const songs = useMemo(
    () => mergeSongsCatalog(baseSongs, publishedCatalog.songs, studioDrafts.draftSongs),
    [baseSongs, publishedCatalog.songs, studioDrafts.draftSongs],
  );
  const mergedThemes = useMemo(
    () => mergeThemesCatalog(publishedCatalog.themes, studioDrafts.draftThemes),
    [publishedCatalog.themes, studioDrafts.draftThemes],
  );
  const mergedHudLayout = useMemo(
    () => mergeHudLayout(publishedCatalog.hudLayouts, studioDrafts.draftHudLayout),
    [publishedCatalog.hudLayouts, studioDrafts.draftHudLayout],
  );
  const mergedAssets = useMemo(() => {
    const map = new Map<string, DevAssetItem>();
    for (const a of publishedCatalog.assets) map.set(a.id, a);
    for (const a of Object.values(studioDrafts.draftAssets)) map.set(a.id, a);
    return Array.from(map.values());
  }, [publishedCatalog.assets, studioDrafts.draftAssets]);

  const [screen, setScreen] = useState<ScreenView>('TITLE');
  const [previousScreen, setPreviousScreen] = useState<ScreenView>('TITLE');
  const [customAudioStatus, setCustomAudioStatus] = useState('');
  const [pauseOpen, setPauseOpen] = useState(false);
  const [pauseTab, setPauseTab] = useState<PauseTabId>('main');
  const [modsOpen, setModsOpen] = useState(false);
  const [listeningSlot, setListeningSlot] = useState<0 | 1 | 2>(0);
  const [summaryData, setSummaryData] = useState<RunSummaryData | null>(null);
  const [showTutorialCompleteStripe, setShowTutorialCompleteStripe] = useState(false);
  const [warpLaunchLabel, setWarpLaunchLabel] = useState<string | null>(null);
  const warpTimersRef = useRef<number[]>([]);

  const [uiScore, setUiScore] = useState(0);
  const [uiHp, setUiHp] = useState(100);
  const [uiStreak, setUiStreak] = useState(0);
  const [uiUnbankedOrbs, setUiUnbankedOrbs] = useState(0);
  const [uiShields, setUiShields] = useState(0);
  const [uiSongTime, setUiSongTime] = useState(0);
  const [uiSection, setUiSection] = useState<SongSection>('INTRO');
  const [uiWaveMode, setUiWaveMode] = useState<WaveModeId>('CW_GREEN');
  const [uiPhase, setUiPhase] = useState<GamePhase>('IDLE');
  const [uiBeatLed, setUiBeatLed] = useState(0);
  const [uiActiveLesson, setUiActiveLesson] = useState<TutorialLesson | null>(null);
  const [uiTutorialLives, setUiTutorialLives] = useState(3);
  const [uiIsTutorialRun, setUiIsTutorialRun] = useState(false);
  const [uiSandboxMode, setUiSandboxMode] = useState<WaveModeId | null>(null);
  const [uiAccuracy, setUiAccuracy] = useState(100);
  const [uiOverdriveCharge, setUiOverdriveCharge] = useState(0);
  const [uiOverdriveActive, setUiOverdriveActive] = useState(false);
  const [uiOverdriveTimeLeft, setUiOverdriveTimeLeft] = useState(0);
  const [uiOverdrivePerfectsEarned, setUiOverdrivePerfectsEarned] = useState(0);
  const [uiOverdriveTargetPerfects, setUiOverdriveTargetPerfects] = useState(20);
  const [uiOverdriveUsed, setUiOverdriveUsed] = useState(false);
  const [uiPracticeMode, setUiPracticeMode] = useState(false);
  const [uiPracticePaused, setUiPracticePaused] = useState(false);
  const [uiPracticeSpeed, setUiPracticeSpeed] = useState(1.0);
  const [uiPracticeStartSec, setUiPracticeStartSec] = useState(0);
  const [uiCheckpoints, setUiCheckpoints] = useState<PracticeCheckpoint[]>([]);
  const [uiReplayMode, setUiReplayMode] = useState(false);
  const [uiReplaySpeed, setUiReplaySpeed] = useState(1.0);
  const [uiReplayPaused, setUiReplayPaused] = useState(false);
  const [uiReplayEvents, setUiReplayEvents] = useState<ReplayInputEvent[]>([]);
  const [uiReplayLabel, setUiReplayLabel] = useState('');
  const [uiReplayLastClickLabel, setUiReplayLastClickLabel] = useState('');

  const profileRef = useRef(profile);
  profileRef.current = profile;
  const songsRef = useRef(songs);
  songsRef.current = songs;
  const themesRef = useRef(mergedThemes);
  themesRef.current = mergedThemes;
  const screenRef = useRef(screen);
  screenRef.current = screen;
  const pauseOpenRef = useRef(pauseOpen);
  pauseOpenRef.current = pauseOpen;
  const modsOpenRef = useRef(modsOpen);
  modsOpenRef.current = modsOpen;
  const phaseBeforeOverlayRef = useRef<GamePhase>('IDLE');
  const lastInputTimestampRef = useRef(0);
  const lastTutorialStripeRef = useRef(false);
  const hasUnlockedAudioRef = useRef(false);

  const engineRef = useRef<RuntimeEngine>({
    phase: 'IDLE',
    score: 0,
    hp: 100,
    streak: 0,
    maxStreakInRun: 0,
    unbankedOrbs: 0,
    shields: 0,
    spinnerAngle: -Math.PI / 2,
    direction: 1,
    baseAngularSpeed: 1.55,
    angularSpeed: 1.55,
    waveModeId: 'CW_GREEN',
    waveIndex: 0,
    waitingForCue: false,
    breakRemainingSec: 0,
    targets: [],
    hazards: [],
    portal: null,
    waveElapsed: 0,
    songTime: 0,
    songSection: 'INTRO',
    beatmap: [],
    beatmapIndex: 0,
    hitEffects: [],
    hitErrorTicks: [],
    hubStatusText: 'READY',
    hubStatusColor: null,
    hubStatusTimer: 0,
    shakeTime: 0,
    shakeAmplitude: 0,
    shakeX: 0,
    missReason: '',
    missDegrees: '0.0',
    missNearestEdge: 0,
    missSignedSpan: 0,
    perfectCount: 0,
    greatCount: 0,
    goodCount: 0,
    missCount: 0,
    runOffsetDegSum: 0,
    runHitCount: 0,
    runOffsetSamples: [],
    isTutorialRun: false,
    tutorialLives: 3,
    shownLessonIds: new Set<string>(),
    activeLesson: null,
    activeLessonTimer: 0,
    lessonSlowActive: false,
    tutorialGuideDisabled: false,
    dialTimeScale: 1.0,
    cinematicTimer: 0,
    dialVisualAlpha: 1,
    dialSpinBoost: 0,
    sandboxModeId: null,
    beatPulse: 0,
    activeBeatLed: -1,
    pendingHits: 0,
    pendingPerfects: 0,
    pendingOffsetDegSum: 0,
    pendingMisses: 0,
    pendingEarlyMisses: 0,
    pendingLateMisses: 0,
    pendingMechanicDeltas: {},
    lastPhysicsTimeMs: performance.now(),
    lastSweepRate: 1.0,
    physicsAccum: 0,
    overdriveCharge: 0,
    overdriveActive: false,
    overdriveTimeLeft: 0,
    overdrivePerfectsEarned: 0,
    overdriveTargetPerfects: 20,
    overdriveUsedThisRun: false,
    runTriggeredOverdrive: false,
    shockwaves: [],
    nextCuePreview: null,
    practiceMode: false,
    practicePaused: false,
    practiceStartSec: 0,
    practiceSpeed: 1.0,
    checkpoints: [],
    checkpointNextId: 1,
    replayMode: false,
    replayData: null,
    replayEventIndex: 0,
    replaySpeed: 1.0,
    replayPaused: false,
    replayLastClickLabel: '',
    recordedEvents: [],
    silentSeek: false,
  });

  const canvasStateRef = useRef<CanvasRenderState>({
    phase: 'IDLE',
    spinnerAngle: -Math.PI / 2,
    direction: 1,
    angularSpeed: 1.55,
    waveModeId: 'CW_GREEN',
    targets: [],
    hazards: [],
    portal: null,
    hitEffects: [],
    hitErrorTicks: [],
    hubStatusText: 'READY',
    hubStatusColor: null,
    hubStatusTimer: 0,
    shakeX: 0,
    missDegrees: '0.0',
    missNearestEdge: 0,
    missSignedSpan: 0,
    dialVisualAlpha: 1,
    bassEnergy: 0,
    spectrumBins: new Float32Array(36),
    beatPulse: 0,
    streak: 0,
    songProgressRatio: 0,
    songSections: [],
    songSection: 'INTRO',
    songTime: 0,
    lessonSlowActive: false,
    activeLesson: null,
    flashlightActive: false,
    rxModActive: false,
    waitingForCue: false,
    breakRemainingSec: 0,
    overdriveCharge: 0,
    overdriveActive: false,
    overdriveTimeLeft: 0,
    overdrivePerfectsEarned: 0,
    overdriveTargetPerfects: 20,
    overdriveUsedThisRun: false,
    overdriveVfxMode: 'full',
    nextCuePreview: null,
    shockwaves: [],
    isPracticeMode: false,
    isReplayMode: false,
  });

  useEffect(() => {
    saveStudioDrafts(studioDrafts);
  }, [studioDrafts]);

  useEffect(() => {
    const manifestMap: Record<string, SkinPackManifest> = {};
    for (const [tid, entry] of Object.entries(mergedThemes)) {
      if (entry?.manifest) manifestMap[tid] = entry.manifest;
    }
    setRuntimeSkinPackOverrides(manifestMap);

    const t = getResolvedChassisTheme(profile.theme, mergedThemes);
    const skin = getResolvedSkinPack(profile.theme, mergedThemes);
    const root = document.documentElement.style;
    root.setProperty('--theme-primary', t.primary);
    root.setProperty('--theme-bright', t.bright);
    root.setProperty('--theme-dim', t.dim);
    root.setProperty('--theme-on-primary', t.onPrimary);
    root.setProperty('--accent', t.primary);
    root.setProperty('--accent-bright', t.bright);
    root.setProperty('--accent-dim', t.dim);
    root.setProperty('--accent-on', t.onPrimary);
    root.setProperty('--bg-accent-rgb', t.bgAccentRgb);
    root.setProperty('--font-display', skin.displayFont);
    root.setProperty('--font-sans', skin.bodyFont);
    root.setProperty('--font-mono', skin.monoFont);
    root.setProperty('--skin-surface', skin.surfaceBg);
    root.setProperty('--skin-surface-elevated', skin.surfaceElevatedBg);
    root.setProperty('--skin-border', skin.surfaceBorder);
    root.setProperty('--skin-header', skin.headerBg);
    root.setProperty('--skin-blade', skin.bladeBg);
    root.setProperty('--skin-blade-hover', skin.bladeHoverBg);
  }, [mergedThemes, profile.theme]);

  useEffect(() => {
    let active = true;
    void fetchLivePublishedCatalog(firebaseUser).then((catalog) => {
      if (active) setPublishedCatalog(catalog);
    });
    return () => {
      active = false;
    };
  }, [firebaseUser]);

  const updateProfile = useCallback(
    (updater: Partial<PlayerProfile> | ((p: PlayerProfile) => PlayerProfile)) => {
      setProfile((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
        saveProfile(next);
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    void handleAuthRedirectOnBoot().catch((err) => {
      setAuthError(err instanceof Error ? err.message : 'Google redirect sign-in failed.');
    });
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setFirebaseUser(null);
        setAuthUser(null);
        setIsDeveloper(false);
        setDevStudioOpen(false);
        setHudEditModeActive(false);
        setOdPreviewCharge(null);
        setOdPreviewActive(false);
        setAuthLoading(false);
        updateProfile((prev) => (prev.devUnlocked ? { ...prev, devUnlocked: false } : prev));
        return;
      }

      setFirebaseUser(user);
      setAuthUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
      setAuthError(null);

      try {
        const dev = await checkUserDeveloperRole(user);
        setIsDeveloper(dev);
        const cloud = await fetchUserCloudProfile(user);
        if (cloud) {
          updateProfile((prev) => ({
            ...prev,
            unlockedThemes: Array.from(
              new Set([...prev.unlockedThemes, ...(cloud.unlockedThemes || [])]),
            ),
            bestScore: Math.max(prev.bestScore, cloud.bestScore || 0),
            bestStreak: Math.max(prev.bestStreak, cloud.bestStreak || 0),
            totalOrbsEarned: Math.max(prev.totalOrbsEarned, cloud.totalOrbsEarned || 0),
            tutorialSongCompleted:
              prev.tutorialSongCompleted || Boolean(cloud.tutorialSongCompleted),
            devUnlocked: dev ? prev.devUnlocked : false,
          }));
        } else {
          updateProfile((prev) => ({
            ...prev,
            devUnlocked: dev ? prev.devUnlocked : false,
          }));
          if (user.emailVerified) {
            await syncUserProfileToCloud(user, profileRef.current);
          }
        }
      } catch (err) {
        console.warn('Cloud profile sync warning:', err);
      } finally {
        setAuthLoading(false);
      }
    });
    return () => unsub();
  }, [updateProfile]);

  useEffect(() => {
    if (!firebaseUser || !firebaseUser.emailVerified) return;
    const timer = window.setTimeout(() => {
      void syncUserProfileToCloud(firebaseUser, profile).catch((err) => {
        console.warn('Background profile backup skipped:', err);
      });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [
    firebaseUser,
    profile.theme,
    profile.unlockedThemes,
    profile.bestScore,
    profile.bestStreak,
    profile.totalOrbsEarned,
    profile.tutorialSongCompleted,
  ]);

  const handleGoogleSignIn = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithGooglePopup();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google sign-in failed.');
      setAuthLoading(false);
    }
  }, []);

  const handleGoogleRedirectSignIn = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogleRedirect();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google redirect sign-in failed.');
      setAuthLoading(false);
    }
  }, []);

  const handleGoogleSignOut = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signOutAccount();
      updateProfile({ devUnlocked: false });
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Sign-out failed.');
    } finally {
      setAuthLoading(false);
    }
  }, [updateProfile]);

  const handleToggleDevUnlock = useCallback(() => {
    if (!isDeveloper) return;
    updateProfile((prev) => ({ ...prev, devUnlocked: !prev.devUnlocked }));
  }, [isDeveloper, updateProfile]);

  const recordMechanicStat = (
    eng: RuntimeEngine,
    modeId: WaveModeId,
    kind: 'hit' | 'perfect' | 'miss',
  ) => {
    const cur = eng.pendingMechanicDeltas[modeId] || { hits: 0, perfects: 0, misses: 0 };
    if (kind === 'hit') cur.hits += 1;
    else if (kind === 'perfect') {
      cur.hits += 1;
      cur.perfects += 1;
    } else {
      cur.misses += 1;
    }
    eng.pendingMechanicDeltas[modeId] = cur;
  };

  const mergeMechanicStatsIntoProfile = (
    base: PlayerProfile['mechanicStats'],
    deltas: Partial<Record<WaveModeId, MechanicStat>>,
  ) => {
    const merged: PlayerProfile['mechanicStats'] = { ...base };
    for (const key of Object.keys(deltas) as WaveModeId[]) {
      const d = deltas[key];
      if (!d) continue;
      const prev = merged[key] || { hits: 0, perfects: 0, misses: 0 };
      merged[key] = {
        hits: prev.hits + d.hits,
        perfects: prev.perfects + d.perfects,
        misses: prev.misses + d.misses,
      };
    }
    return merged;
  };

  const flushRunProfileDeltas = useCallback(() => {
    const eng = engineRef.current;
    const hasMechDeltas = Object.keys(eng.pendingMechanicDeltas).length > 0;
    if (
      eng.pendingHits === 0 &&
      eng.pendingPerfects === 0 &&
      eng.pendingMisses === 0 &&
      eng.pendingOffsetDegSum === 0 &&
      !hasMechDeltas
    ) {
      return;
    }
    const hits = eng.pendingHits;
    const perfects = eng.pendingPerfects;
    const offsetSum = eng.pendingOffsetDegSum;
    const misses = eng.pendingMisses;
    const early = eng.pendingEarlyMisses;
    const late = eng.pendingLateMisses;
    const mechDeltas = eng.pendingMechanicDeltas;
    eng.pendingHits = 0;
    eng.pendingPerfects = 0;
    eng.pendingOffsetDegSum = 0;
    eng.pendingMisses = 0;
    eng.pendingEarlyMisses = 0;
    eng.pendingLateMisses = 0;
    eng.pendingMechanicDeltas = {};

    updateProfile((prev) => ({
      ...prev,
      totalHits: prev.totalHits + hits,
      totalPerfects: prev.totalPerfects + perfects,
      offsetDegSum: prev.offsetDegSum + offsetSum,
      totalMisses: prev.totalMisses + misses,
      earlyMisses: prev.earlyMisses + early,
      lateMisses: prev.lateMisses + late,
      mechanicStats: mergeMechanicStatsIntoProfile(prev.mechanicStats, mechDeltas),
    }));
  }, [updateProfile]);

  const getActiveSong = useCallback(
    (p: PlayerProfile = profileRef.current, list: SongDefinition[] = songsRef.current) => {
      return (
        list.find((s) => s.id === p.selectedSongId && isSongReleased(s.id)) || list[0]
      );
    },
    [],
  );

  const getEffectiveDifficulty = useCallback(
    (p: PlayerProfile = profileRef.current, song?: SongDefinition): DifficultyId => {
      const s = song || getActiveSong(p);
      if (s.chillOnly) return 'CHILL';
      if (s.demonOnly) return 'DEMON';
      return p.selectedDifficulty;
    },
    [getActiveSong],
  );

  const getRunConfig = useCallback(
    (eng: RuntimeEngine, p: PlayerProfile, song: SongDefinition): { diffId: DifficultyId; mods: ModCode[] } => {
      if (eng.replayMode && eng.replayData) {
        return {
          diffId: song.chillOnly ? 'CHILL' : song.demonOnly ? 'DEMON' : eng.replayData.difficulty,
          mods: eng.replayData.equippedMods,
        };
      }
      return {
        diffId: getEffectiveDifficulty(p, song),
        mods: p.equippedMods,
      };
    },
    [getEffectiveDifficulty],
  );

  const getBaseHalfWidth = useCallback((diffId: DifficultyId, mods: ModCode[]) => {
    const diff = DIFFICULTIES[diffId] || DIFFICULTIES.CHILL;
    let hw = 0.44 * diff.arcScale;
    if (mods.includes('HR')) hw *= 0.78;
    if (mods.includes('EZ')) hw *= 1.28;
    if (mods.includes('SM')) hw *= 0.90;
    return Math.max(0.11, Math.min(0.68, hw));
  }, []);

  const computeNominalSpeed = useCallback(
    (diffId: DifficultyId, mods: ModCode[], bpm: number, modeId: WaveModeId) => {
      const beatDur = 60 / Math.max(65, bpm);
      const beatsPerRev =
        diffId === 'CHILL'
          ? 4.2
          : diffId === 'NORMAL'
          ? 3.5
          : diffId === 'HARD'
          ? 3.0
          : diffId === 'INSANE'
          ? 2.6
          : 2.35;
      let speed = (Math.PI * 2) / (beatsPerRev * beatDur);
      if (mods.includes('DT')) speed *= 1.12;
      if (mods.includes('VD')) speed *= 1.14;
      if (mods.includes('EZ')) speed *= 0.90;
      if (mods.includes('SA')) speed *= 0.84;
      if (modeId === 'PURPLE_SURGE') speed *= 1.24;
      return Math.max(1.2, Math.min(4.95, speed));
    },
    [],
  );

  const computeCurrentAccuracy = (eng: RuntimeEngine): number => {
    const total = eng.perfectCount + eng.greatCount + eng.goodCount + eng.missCount;
    if (total === 0) return 100;
    const weighted = eng.perfectCount + eng.greatCount * 0.66 + eng.goodCount * 0.33;
    return (weighted / total) * 100;
  };

  const finalizeRunSummary = useCallback(
    (cleared: boolean) => {
      const eng = engineRef.current;
      const p = profileRef.current;
      const song = getActiveSong(p);
      const { diffId, mods } = getRunConfig(eng, p, song);
      const isUnranked = Boolean(eng.sandboxModeId || eng.practiceMode || eng.replayMode);

      audioEngine.stop();
      eng.phase = 'SUMMARY';
      setUiPhase('SUMMARY');

      const accuracy = computeCurrentAccuracy(eng);
      const rank = computeLetterRank(accuracy, eng.missCount, cleared);
      const isSilverRank = mods.includes('HD') && (rank === 'SS' || rank === 'S');
      const avgOffsetDeg = eng.runHitCount > 0 ? eng.runOffsetDegSum / eng.runHitCount : 0;

      const cashOutApproved = !isUnranked && isCashOutEligible(rank);
      const rankBonusOrbs = cashOutApproved ? computeRankOrbBonus(rank, diffId) : 0;

      const prevRec = p.songRecords[song.id];
      const isNewBest = !isUnranked && (!prevRec || eng.score > prevRec.bestScore);
      const rankOrder = ['SS', 'S', 'A', 'B', 'C', 'D', 'F'];
      const prevIdx = prevRec ? rankOrder.indexOf(prevRec.bestRank) : 99;
      const curIdx = rankOrder.indexOf(rank);
      const bestRank = prevRec && prevIdx >= 0 && prevIdx < curIdx ? prevRec.bestRank : rank;

      const nextRecords = isUnranked
        ? p.songRecords
        : {
            ...p.songRecords,
            [song.id]: {
              bestScore: Math.max(prevRec?.bestScore || 0, eng.score),
              bestRank,
              bestAccuracy: Math.max(prevRec?.bestAccuracy || 0, accuracy),
              bestCombo: Math.max(prevRec?.bestCombo || 0, eng.maxStreakInRun),
            },
          };

      const prevSongDiffMap = p.songDiffRecords?.[song.id] || {};
      const prevDiffRec = prevSongDiffMap[diffId];
      const prevDiffIdx = prevDiffRec ? rankOrder.indexOf(prevDiffRec.bestRank) : 99;
      const bestDiffRank =
        prevDiffRec && prevDiffIdx >= 0 && prevDiffIdx < curIdx ? prevDiffRec.bestRank : rank;
      const nextSongDiffRecords = isUnranked
        ? p.songDiffRecords || {}
        : {
            ...(p.songDiffRecords || {}),
            [song.id]: {
              ...prevSongDiffMap,
              [diffId]: {
                bestScore: Math.max(prevDiffRec?.bestScore || 0, eng.score),
                bestRank: bestDiffRank,
                bestAccuracy: Math.max(prevDiffRec?.bestAccuracy || 0, accuracy),
                bestCombo: Math.max(prevDiffRec?.bestCombo || 0, eng.maxStreakInRun),
              },
            },
          };

      const nextTierBests = { ...p.tierBestScores };
      if (!isUnranked && eng.score > (nextTierBests[diffId] || 0)) {
        nextTierBests[diffId] = eng.score;
      }

      const hitsDelta = isUnranked ? 0 : eng.pendingHits;
      const perfectsDelta = isUnranked ? 0 : eng.pendingPerfects;
      const offsetDelta = isUnranked ? 0 : eng.pendingOffsetDegSum;
      const missesDelta = isUnranked ? 0 : eng.pendingMisses;
      const earlyDelta = isUnranked ? 0 : eng.pendingEarlyMisses;
      const lateDelta = isUnranked ? 0 : eng.pendingLateMisses;
      const mechDeltas = isUnranked ? {} : eng.pendingMechanicDeltas;
      eng.pendingHits = 0;
      eng.pendingPerfects = 0;
      eng.pendingOffsetDegSum = 0;
      eng.pendingMisses = 0;
      eng.pendingEarlyMisses = 0;
      eng.pendingLateMisses = 0;
      eng.pendingMechanicDeltas = {};

      const nextMechStats = mergeMechanicStatsIntoProfile(p.mechanicStats, mechDeltas);
      const baseRunOrbs = cashOutApproved ? eng.unbankedOrbs + rankBonusOrbs : 0;
      const provisionalTotalOrbs = p.totalOrbsEarned + baseRunOrbs;
      const dailyWeeklyPatch = isUnranked ? {} : applyDailyWeeklyCompletion(p, song, cleared);
      const nextTotalOverdrives = p.totalOverdrives + (!isUnranked && eng.runTriggeredOverdrive ? 1 : 0);

      const newlyEarnedBadges = isUnranked
        ? []
        : evaluateEarnedBadges(
            p,
            cleared,
            song.id,
            diffId,
            rank,
            eng.maxStreakInRun,
            mods.length,
            provisionalTotalOrbs,
            nextMechStats,
            nextRecords,
            {
              nextTotalOverdrives,
              nextDailyStreak: dailyWeeklyPatch.dailyStreak ?? p.dailyStreak,
              nextCompletedDailyCount:
                dailyWeeklyPatch.completedDailyIds?.length ?? p.completedDailyIds.length,
              nextCompletedWeeklyCount:
                dailyWeeklyPatch.completedWeeklyIds?.length ?? p.completedWeeklyIds.length,
            },
          );

      const newlyUnlockedThemes = isUnranked
        ? []
        : evaluateMilestoneThemes({
            ...p,
            songRecords: nextRecords,
            songDiffRecords: nextSongDiffRecords,
          });

      const badgeBonusOrbs = newlyEarnedBadges.reduce((acc, b) => acc + b.orbReward, 0);
      const cashedOutOrbs = baseRunOrbs + badgeBonusOrbs;
      const nextOrbs = p.orbs + cashedOutOrbs;
      const nextTotalOrbs = p.totalOrbsEarned + cashedOutOrbs;

      const nextTutorialDone =
        p.tutorialSongCompleted ||
        (cleared && song.id === 'moments_passing' && !isUnranked);

      if (cleared) {
        audioEngine.playLevelClear(p.soundEnabled);
      }

      let savedReplayId: string | undefined = eng.replayData?.id;
      if (!isUnranked && eng.recordedEvents.length > 0) {
        savedReplayId = `rep_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const replayObj: ReplayData = {
          id: savedReplayId,
          songId: song.id,
          songTitle: song.title,
          artist: song.artist,
          difficulty: diffId,
          equippedMods: [...mods],
          score: eng.score,
          accuracy,
          rank,
          maxCombo: eng.maxStreakInRun,
          durationSec: song.durationSec,
          createdAtIso: new Date().toISOString(),
          events: [...eng.recordedEvents],
          isBest: isNewBest,
        };
        saveRunReplay(replayObj, isNewBest);
      }

      if (!isUnranked) {
        updateProfile((prev) => ({
          ...prev,
          tutorialSongCompleted: nextTutorialDone,
          orbs: nextOrbs,
          totalOrbsEarned: nextTotalOrbs,
          totalOverdrives: prev.totalOverdrives + (eng.runTriggeredOverdrive ? 1 : 0),
          songRecords: nextRecords,
          songDiffRecords: nextSongDiffRecords,
          unlockedThemes: Array.from(
            new Set([...prev.unlockedThemes, ...newlyUnlockedThemes]),
          ),
          tierBestScores: nextTierBests,
          unlockedBadges: Array.from(
            new Set([...prev.unlockedBadges, ...newlyEarnedBadges.map((b) => b.id)]),
          ),
          mechanicStats: nextMechStats,
          bestScore: Math.max(prev.bestScore, eng.score),
          bestStreak: Math.max(prev.bestStreak, eng.maxStreakInRun),
          totalHits: prev.totalHits + hitsDelta,
          totalPerfects: prev.totalPerfects + perfectsDelta,
          offsetDegSum: prev.offsetDegSum + offsetDelta,
          totalMisses: prev.totalMisses + missesDelta,
          earlyMisses: prev.earlyMisses + earlyDelta,
          lateMisses: prev.lateMisses + lateDelta,
          ...applyDailyWeeklyCompletion(prev, song, cleared),
        }));
      }

      const summary: RunSummaryData = {
        cleared,
        songId: song.id,
        songTitle: song.title,
        artist: song.artist,
        difficulty: diffId,
        score: eng.score,
        previousBestScore: prevRec?.bestScore || 0,
        maxCombo: eng.maxStreakInRun,
        accuracy,
        rank,
        isSilverRank,
        perfectCount: eng.perfectCount,
        greatCount: eng.greatCount,
        goodCount: eng.goodCount,
        missCount: eng.missCount,
        avgOffsetDeg,
        offsetSamples: [...eng.runOffsetSamples],
        unbankedOrbs: isUnranked ? 0 : eng.unbankedOrbs,
        rankBonusOrbs,
        badgeBonusOrbs,
        cashedOutOrbs,
        cashOutApproved,
        newlyEarnedBadges,
        newlyUnlockedThemes,
        missReason: cleared ? undefined : eng.missReason,
        missDegrees: cleared ? undefined : eng.missDegrees,
        isNewBest,
        replayId: savedReplayId,
        isPractice: eng.practiceMode,
      };

      orbitEvents.emit('onRunComplete', summary);

      if (cleared && song.id === 'moments_passing' && !p.tutorialSongCompleted && !isUnranked) {
        eng.phase = 'TUTORIAL_CINEMATIC';
        eng.cinematicTimer = 0;
        eng.activeLesson = null;
        eng.lessonSlowActive = false;
        setUiActiveLesson(null);
        setUiPhase('TUTORIAL_CINEMATIC');
        setSummaryData(summary);
        return;
      }

      setSummaryData(summary);
    },
    [getActiveSong, getRunConfig, updateProfile],
  );

  const spawnNextWave = useCallback(
    (isFirstNote = false, overrideMode: WaveModeId | null = null) => {
      const eng = engineRef.current;
      const p = profileRef.current;
      const song = getActiveSong(p);
      const { diffId, mods } = getRunConfig(eng, p, song);
      const mirrorMod = mods.includes('MR');

      let note: BeatmapNote | null = null;
      if (eng.phase === 'PLAYING' && !eng.sandboxModeId) {
        // Skip past notes whose beat timestamp already elapsed noticeably while waiting
        while (
          eng.beatmapIndex < eng.beatmap.length &&
          eng.beatmap[eng.beatmapIndex].hitTime < eng.songTime - 0.12
        ) {
          eng.beatmapIndex += 1;
        }
        if (eng.beatmapIndex >= eng.beatmap.length) {
          finalizeRunSummary(true);
          return;
        }

        const candidate = eng.beatmap[eng.beatmapIndex];
        const dtToHit = candidate.hitTime - eng.songTime;

        // Long quiet break/gap in music: cruise smoothly until ~1.45s before the next musical transient
        if (dtToHit > 1.85) {
          eng.waitingForCue = true;
          eng.breakRemainingSec = dtToHit;
          eng.targets = [];
          eng.hazards = [];
          eng.portal = null;
          eng.baseAngularSpeed = computeNominalSpeed(diffId, mods, song.bpm, candidate.modeId);
          eng.angularSpeed = eng.baseAngularSpeed;
          return;
        }

        eng.waitingForCue = false;
        eng.breakRemainingSec = 0;
        note = candidate;
        eng.beatmapIndex += 1;
        eng.songSection = note.section;
        setUiSection(note.section);
      } else {
        eng.waitingForCue = false;
        eng.breakRemainingSec = 0;
      }

      const modeId: WaveModeId = overrideMode || (note ? note.modeId : 'CW_GREEN');
      eng.waveModeId = modeId;
      eng.waveElapsed = 0;
      eng.hazards = [];
      eng.portal = null;
      setUiWaveMode(modeId);

      if (modeId === 'CCW_RED') eng.direction = -1;
      else if (modeId === 'CW_GREEN') eng.direction = 1;
      else if (mirrorMod && isFirstNote) eng.direction = -1;

      const noteSizeScale = note?.sizeScale ?? 1.0;
      const noteSpeedScale = note?.speedScale ?? 1.0;
      const nominalSpeed =
        computeNominalSpeed(diffId, mods, song.bpm, modeId) * noteSpeedScale;

      // Compute Audio-Locked Omega & Target Angle so needle crosses target center AT exact note.hitTime!
      const rawDt = note && !eng.sandboxModeId ? note.hitTime - eng.songTime : 0;
      const syncDt = rawDt > 0.16 ? rawDt : Math.max(0.28, note ? note.stepSec * 0.85 : 0.82);

      let travelAngle: number;
      if (modeId === 'CASCADE_CHAIN') {
        travelAngle = Math.max(0.58, Math.min(2.2, nominalSpeed * syncDt));
      } else if (note && !eng.sandboxModeId) {
        travelAngle = Math.max(0.52, Math.min(4.9, nominalSpeed * syncDt));
      } else {
        const minOff = isFirstNote ? 1.65 : 1.35;
        travelAngle = minOff + Math.random() * (4.4 - minOff);
      }

      eng.baseAngularSpeed = note && !eng.sandboxModeId ? travelAngle / syncDt : nominalSpeed;
      eng.angularSpeed = eng.baseAngularSpeed;

      const tutWidthBonus = eng.isTutorialRun ? 1.28 : 1.0;
      const baseHW = Math.max(
        0.11,
        Math.min(0.76, getBaseHalfWidth(diffId, mods) * tutWidthBonus * noteSizeScale),
      );
      const primaryAngle = wrapAngle(eng.spinnerAngle + eng.direction * travelAngle);

      const noteHitT = note && !eng.sandboxModeId ? note.hitTime : undefined;
      const standardGrace = eng.isTutorialRun ? 0.36 : diffId === 'CHILL' ? 0.32 : diffId === 'NORMAL' ? 0.28 : 0.24;
      const multiGrace = Math.max(0.82, note ? Math.min(1.55, note.stepSec * 0.92) : 1.1);

      if (modeId === 'FEVER_SPINNER') {
        const maxHits = mods.includes('RX') ? 5 : diffId === 'DEMON' ? 9 : 7;
        eng.targets = [
          {
            id: 1,
            modeId,
            angle: primaryAngle,
            baseAngle: primaryAngle,
            halfWidth: baseHW,
            initialHalfWidth: baseHW,
            tapsLeft: maxHits,
            seqNum: 0,
            alpha: 1,
            enteredWindow: false,
            spawnTime: eng.songTime,
            targetHitTime: noteHitT,
            isFeverSpinner: true,
            feverHits: 0,
            feverMaxHits: maxHits,
            feverRemainingSec: note?.holdDurationSec || 1.3,
          },
        ];
      } else if (modeId === 'HOLD_ARC') {
        const holdDur = note?.holdDurationSec || 0.85;
        const holdSpanRad = Math.max(0.56, Math.min(2.75, eng.baseAngularSpeed * holdDur));
        const endAngle = wrapAngle(primaryAngle + eng.direction * holdSpanRad);
        eng.targets = [
          {
            id: 1,
            modeId,
            angle: primaryAngle,
            baseAngle: primaryAngle,
            halfWidth: Math.max(0.24, baseHW * 1.08),
            initialHalfWidth: Math.max(0.24, baseHW * 1.08),
            tapsLeft: 1,
            seqNum: 0,
            alpha: 1,
            enteredWindow: false,
            spawnTime: eng.songTime,
            targetHitTime: noteHitT,
            expireTime: noteHitT !== undefined ? noteHitT + Math.max(0.32, holdDur * 0.48) : undefined,
            isHold: true,
            holdSpanRad,
            holdEndAngle: endAngle,
            holdDir: eng.direction,
            holdDurationSec: holdDur,
            holdElapsedSec: 0,
            isHolding: false,
            holdTickAccum: 0,
          },
        ];
      } else if (modeId === 'MULTI_CLUSTER') {
        const secondAngle = wrapAngle(primaryAngle + eng.direction * 1.32);
        const clusterExpire = noteHitT !== undefined ? noteHitT + multiGrace : undefined;
        eng.targets = [
          {
            id: 1,
            modeId,
            angle: primaryAngle,
            baseAngle: primaryAngle,
            halfWidth: baseHW * 0.94,
            initialHalfWidth: baseHW * 0.94,
            tapsLeft: 1,
            seqNum: 0,
            alpha: 1,
            enteredWindow: false,
            spawnTime: eng.songTime,
            targetHitTime: noteHitT,
            expireTime: clusterExpire,
          },
          {
            id: 2,
            modeId,
            angle: secondAngle,
            baseAngle: secondAngle,
            halfWidth: baseHW * 0.94,
            initialHalfWidth: baseHW * 0.94,
            tapsLeft: 1,
            seqNum: 0,
            alpha: 1,
            enteredWindow: false,
            spawnTime: eng.songTime,
            targetHitTime: noteHitT !== undefined ? noteHitT + 1.32 / Math.max(1, eng.baseAngularSpeed) : undefined,
            expireTime: clusterExpire,
          },
        ];
      } else if (modeId === 'ORDERED_SEQ') {
        const span = Math.max(0.76, Math.min(1.28, travelAngle * 0.68));
        const a1 = primaryAngle;
        const a2 = wrapAngle(a1 + eng.direction * span);
        const a3 = wrapAngle(a2 + eng.direction * span);
        const hw = baseHW * 0.90;
        const seqExpire = noteHitT !== undefined ? noteHitT + (span * 2) / Math.max(1, eng.baseAngularSpeed) + standardGrace : undefined;
        eng.targets = [
          { id: 1, modeId, angle: a1, baseAngle: a1, halfWidth: hw, initialHalfWidth: hw, tapsLeft: 1, seqNum: 1, alpha: 1, enteredWindow: false, spawnTime: eng.songTime, targetHitTime: noteHitT, expireTime: seqExpire },
          { id: 2, modeId, angle: a2, baseAngle: a2, halfWidth: hw, initialHalfWidth: hw, tapsLeft: 1, seqNum: 2, alpha: 1, enteredWindow: false, spawnTime: eng.songTime, targetHitTime: noteHitT !== undefined ? noteHitT + span / Math.max(1, eng.baseAngularSpeed) : undefined, expireTime: seqExpire },
          { id: 3, modeId, angle: a3, baseAngle: a3, halfWidth: hw, initialHalfWidth: hw, tapsLeft: 1, seqNum: 3, alpha: 1, enteredWindow: false, spawnTime: eng.songTime, targetHitTime: noteHitT !== undefined ? noteHitT + (span * 2) / Math.max(1, eng.baseAngularSpeed) : undefined, expireTime: seqExpire },
        ];
      } else if (modeId === 'METEOR_SLASH') {
        const echoOffset = Math.max(0.95, Math.min(1.75, travelAngle * 0.82));
        const echoAngle = wrapAngle(primaryAngle - eng.direction * echoOffset);
        const slashExpire = noteHitT !== undefined ? noteHitT + multiGrace : undefined;
        eng.targets = [
          {
            id: 1,
            modeId,
            angle: primaryAngle,
            baseAngle: primaryAngle,
            halfWidth: baseHW,
            initialHalfWidth: baseHW,
            tapsLeft: 1,
            seqNum: 0,
            alpha: 1,
            enteredWindow: false,
            spawnTime: eng.songTime,
            targetHitTime: noteHitT,
            expireTime: slashExpire,
          },
          {
            id: 2,
            modeId,
            angle: echoAngle,
            baseAngle: echoAngle,
            halfWidth: baseHW * 1.06,
            initialHalfWidth: baseHW * 1.06,
            tapsLeft: 1,
            seqNum: 0,
            alpha: 0.48,
            enteredWindow: false,
            spawnTime: eng.songTime,
            targetHitTime: noteHitT !== undefined ? noteHitT + echoOffset / Math.max(1, eng.baseAngularSpeed * 1.15) : undefined,
            expireTime: slashExpire,
            isMeteorEcho: true,
          },
        ];
      } else if (modeId === 'OSU_PORTAL') {
        const entryOff = Math.max(0.55, travelAngle * 0.44);
        const postExitOff = Math.max(0.55, travelAngle - entryOff);
        const entryA = wrapAngle(eng.spinnerAngle + eng.direction * entryOff);
        const exitA = wrapAngle(entryA + Math.PI);
        const targetA = wrapAngle(exitA + eng.direction * postExitOff);
        eng.portal = {
          entryAngle: entryA,
          exitAngle: exitA,
          halfWidth: 0.24,
          warped: false,
          warpFlashTimer: 0,
        };
        eng.targets = [
          {
            id: 1,
            modeId,
            angle: targetA,
            baseAngle: targetA,
            halfWidth: baseHW,
            initialHalfWidth: baseHW,
            tapsLeft: 1,
            seqNum: 0,
            alpha: 1,
            enteredWindow: false,
            spawnTime: eng.songTime,
            targetHitTime: noteHitT,
            expireTime: noteHitT !== undefined ? noteHitT + standardGrace : undefined,
          },
        ];
      } else {
        const tapsNeeded =
          modeId === 'DOUBLE_TAP' ? 2 : modeId === 'BEAT_BURST' ? note?.burstCount || 3 : 1;
        const hw =
          modeId === 'SNIPER_MICRO'
            ? Math.max(0.11, baseHW * 0.68)
            : modeId === 'DECAY_ARC'
            ? Math.min(0.76, baseHW * 1.18)
            : modeId === 'DOUBLE_TAP' || modeId === 'BEAT_BURST'
            ? Math.min(0.78, Math.max(baseHW * 1.24, 0.36))
            : baseHW;
        const tapExpire =
          noteHitT !== undefined
            ? noteHitT + (tapsNeeded > 1 ? Math.max(standardGrace + 0.58, multiGrace + 0.25) : standardGrace)
            : undefined;
        eng.targets = [
          {
            id: 1,
            modeId,
            angle: primaryAngle,
            baseAngle: primaryAngle,
            halfWidth: hw,
            initialHalfWidth: hw,
            tapsLeft: tapsNeeded,
            seqNum: 0,
            alpha: 1,
            enteredWindow: false,
            spawnTime: eng.songTime,
            targetHitTime: noteHitT,
            expireTime: tapExpire,
          },
        ];
        if (modeId === 'HAZARD_DECOY' || (mods.includes('HO') && !eng.isTutorialRun && eng.waveIndex % 2 === 0)) {
          eng.hazards = [
            { angle: wrapAngle(primaryAngle - eng.direction * (hw + 0.40)), halfWidth: 0.13 },
            { angle: wrapAngle(primaryAngle + eng.direction * (hw + 0.40)), halfWidth: 0.13 },
          ];
        }
      }

      // Append any simultaneous Stacked Gametype layers cleanly along the sweep arc
      if (note?.stackedModes && note.stackedModes.length > 0 && modeId !== 'FEVER_SPINNER') {
        const primaryHoldSpan = eng.targets[0]?.holdSpanRad || 0;
        for (const layer of note.stackedModes) {
          if (layer.modeId === 'FEVER_SPINNER') continue;
          const baseOffset =
            primaryHoldSpan > 0
              ? primaryHoldSpan + Math.max(0.46, (layer.angleOffsetRad || 1.2) - 0.88)
              : Math.max(0.68, layer.angleOffsetRad || 0.78);
          const stackAngle = wrapAngle(primaryAngle + eng.direction * baseOffset);
          const stackTaps =
            layer.modeId === 'DOUBLE_TAP'
              ? 2
              : layer.modeId === 'BEAT_BURST'
              ? layer.taps || 3
              : layer.taps || 1;
          const stackHW =
            layer.modeId === 'SNIPER_MICRO'
              ? Math.max(0.11, baseHW * 0.72)
              : layer.modeId === 'DECAY_ARC'
              ? Math.min(0.76, baseHW * 1.15)
              : layer.modeId === 'DOUBLE_TAP' || layer.modeId === 'BEAT_BURST'
              ? Math.min(0.76, Math.max(baseHW * 1.18, 0.34))
              : baseHW * (layer.sizeScale ?? 0.96);
          const stackTravelTime = baseOffset / Math.max(1, eng.baseAngularSpeed);
          const stackHitT = noteHitT !== undefined ? noteHitT + stackTravelTime : undefined;
          const stackExpire =
            stackHitT !== undefined
              ? stackHitT + (stackTaps > 1 ? Math.max(standardGrace + 0.56, multiGrace + 0.25) : standardGrace + 0.12)
              : undefined;
          eng.targets.push({
            id: eng.targets.length + 1,
            modeId: layer.modeId,
            angle: stackAngle,
            baseAngle: stackAngle,
            halfWidth: stackHW,
            initialHalfWidth: stackHW,
            tapsLeft: stackTaps,
            seqNum: 0,
            alpha: 1,
            enteredWindow: false,
            spawnTime: eng.songTime,
            targetHitTime: stackHitT,
            expireTime: stackExpire,
          });
          if (layer.modeId === 'HAZARD_DECOY') {
            const m1 = wrapAngle(stackAngle - eng.direction * (stackHW + 0.34));
            const m2 = wrapAngle(stackAngle + eng.direction * (stackHW + 0.34));
            if (Math.abs(signedAngleDiff(m1, primaryAngle)) > baseHW + 0.18) {
              eng.hazards.push({ angle: m1, halfWidth: 0.13 });
            }
            if (Math.abs(signedAngleDiff(m2, primaryAngle)) > baseHW + 0.18) {
              eng.hazards.push({ angle: m2, halfWidth: 0.13 });
            }
          }
          if (stackExpire !== undefined && eng.targets[0]?.expireTime !== undefined) {
            eng.targets[0].expireTime = Math.max(eng.targets[0].expireTime, stackExpire);
          }
        }
      }
    },
    [computeNominalSpeed, finalizeRunSummary, getActiveSong, getBaseHalfWidth, getRunConfig],
  );

  const resetRound = useCallback(
    (
      autoStart: boolean,
      sandboxMode: WaveModeId | null = null,
      options?: {
        practice?: boolean;
        practiceStartSec?: number;
        practiceSpeed?: number;
        preserveCheckpoints?: boolean;
        replay?: ReplayData | null;
        replaySpeed?: number;
      },
    ) => {
      const eng = engineRef.current;
      const p = profileRef.current;
      const song = getActiveSong(p);

      const nextReplay = options?.replay !== undefined ? options.replay : null;
      const nextReplayMode = Boolean(nextReplay);
      const nextPracticeMode =
        !nextReplayMode && !sandboxMode
          ? options?.practice !== undefined
            ? options.practice
            : eng.practiceMode
          : false;

      eng.replayMode = nextReplayMode;
      eng.replayData = nextReplay;
      eng.replayEventIndex = 0;
      eng.replayPaused = false;
      eng.replaySpeed = options?.replaySpeed ?? (nextReplayMode ? eng.replaySpeed : 1.0);
      eng.replayLastClickLabel = '';
      eng.recordedEvents = [];
      eng.silentSeek = false;

      eng.practiceMode = nextPracticeMode;
      if (options?.practiceStartSec !== undefined) {
        eng.practiceStartSec = Math.max(0, options.practiceStartSec);
      } else if (!nextPracticeMode) {
        eng.practiceStartSec = 0;
      }
      if (options?.practiceSpeed !== undefined) {
        eng.practiceSpeed = options.practiceSpeed;
      } else if (!nextPracticeMode) {
        eng.practiceSpeed = 1.0;
      }
      if (!nextPracticeMode || !options?.preserveCheckpoints) {
        eng.checkpoints = [];
        eng.checkpointNextId = 1;
      }

      const { diffId, mods } = getRunConfig(eng, p, song);
      audioEngine.stopHoldShimmer();

      const startAtSec =
        nextPracticeMode && !nextReplayMode ? eng.practiceStartSec : 0;

      eng.score = 0;
      eng.hp = 100;
      eng.streak = 0;
      eng.maxStreakInRun = 0;
      eng.unbankedOrbs = 0;
      eng.shields = mods.includes('SH') ? 1 : 0;
      eng.spinnerAngle = -Math.PI / 2;
      eng.direction = mods.includes('MR') ? -1 : 1;
      eng.waveIndex = 0;
      eng.waitingForCue = false;
      eng.breakRemainingSec = 0;
      eng.waveElapsed = 0;
      eng.songTime = startAtSec;
      eng.songSection = getSectionAtProgress(song, startAtSec / Math.max(1, song.durationSec));
      eng.beatmap = buildSongBeatmap(song, diffId, mods);
      const startBmIdx =
        startAtSec > 0
          ? eng.beatmap.findIndex((n) => n.hitTime >= startAtSec + 0.25)
          : 0;
      eng.beatmapIndex = startBmIdx === -1 ? eng.beatmap.length : startBmIdx;
      eng.hitEffects = [];
      eng.hitErrorTicks = [];
      eng.shockwaves = [];
      eng.nextCuePreview = null;
      eng.overdriveCharge = 0;
      eng.overdriveActive = false;
      eng.overdriveTimeLeft = 0;
      eng.overdrivePerfectsEarned = 0;
      const odRatio = mods.includes('SG') ? 0.35 : 0.45;
      eng.overdriveTargetPerfects = sandboxMode
        ? 20
        : Math.max(4, Math.ceil(countBeatmapPerfectUnits(eng.beatmap) * odRatio));
      eng.overdriveUsedThisRun = false;
      eng.runTriggeredOverdrive = false;
      eng.practicePaused = false;
      eng.hubStatusText = nextReplayMode ? 'REPLAY' : nextPracticeMode ? 'PRACTICE' : 'READY';
      eng.hubStatusColor = nextReplayMode ? '#c084fc' : nextPracticeMode ? '#38bdf8' : null;
      eng.hubStatusTimer = nextReplayMode || nextPracticeMode ? 0.65 : 0;
      eng.shakeTime = 0;
      eng.shakeX = 0;
      eng.missReason = '';
      eng.missDegrees = '0.0';
      eng.missSignedSpan = 0;
      eng.perfectCount = 0;
      eng.greatCount = 0;
      eng.goodCount = 0;
      eng.missCount = 0;
      eng.runOffsetDegSum = 0;
      eng.runHitCount = 0;
      eng.runOffsetSamples = [];
      eng.isTutorialRun =
        !sandboxMode &&
        !nextPracticeMode &&
        !nextReplayMode &&
        song.id === 'moments_passing' &&
        !p.tutorialSongCompleted;
      eng.tutorialLives = 3;
      eng.shownLessonIds = new Set<string>();
      eng.activeLesson = null;
      eng.activeLessonTimer = 0;
      eng.lessonSlowActive = false;
      eng.tutorialGuideDisabled = false;
      eng.dialTimeScale = 1.0;
      eng.cinematicTimer = 0;
      eng.dialVisualAlpha = 1;
      eng.dialSpinBoost = 0;
      eng.sandboxModeId = sandboxMode;
      eng.lastPhysicsTimeMs = performance.now();
      eng.lastSweepRate = 1.0;
      eng.physicsAccum = 0;

      setSummaryData(null);
      setShowTutorialCompleteStripe(false);
      setUiScore(0);
      setUiHp(100);
      setUiStreak(0);
      setUiAccuracy(100);
      setUiUnbankedOrbs(0);
      setUiShields(eng.shields);
      setUiSongTime(startAtSec);
      setUiSection(eng.songSection);
      setUiActiveLesson(null);
      setUiTutorialLives(3);
      setUiIsTutorialRun(eng.isTutorialRun);
      setUiSandboxMode(sandboxMode);
      setUiOverdriveCharge(0);
      setUiOverdriveActive(false);
      setUiOverdriveTimeLeft(0);
      setUiOverdrivePerfectsEarned(0);
      setUiOverdriveTargetPerfects(eng.overdriveTargetPerfects);
      setUiOverdriveUsed(false);
      setUiPracticeMode(eng.practiceMode);
      setUiPracticePaused(false);
      setUiPracticeSpeed(eng.practiceSpeed);
      setUiPracticeStartSec(eng.practiceStartSec);
      setUiCheckpoints([...eng.checkpoints]);
      setUiReplayMode(eng.replayMode);
      setUiReplaySpeed(eng.replaySpeed);
      setUiReplayPaused(false);
      setUiReplayEvents(nextReplay ? nextReplay.events : []);
      setUiReplayLabel(
        nextReplay
          ? `${nextReplay.rank} · ${nextReplay.score.toLocaleString()}${
              nextReplay.equippedMods.length ? ` · ${nextReplay.equippedMods.join('+')}` : ''
            }`
          : '',
      );
      setUiReplayLastClickLabel('');

      eng.phase = autoStart ? 'PLAYING' : 'IDLE';
      setUiPhase(eng.phase);
      spawnNextWave(true, sandboxMode);

      const playbackRate = eng.replayMode
        ? eng.replaySpeed
        : eng.practiceMode
        ? eng.practiceSpeed
        : 1.0;

      if (autoStart) {
        audioEngine
          .startAtOffset(
            song,
            startAtSec,
            p.musicEnabled,
            p.musicVolume,
            p.soundEnabled,
            p.sfxVolume,
            Boolean(sandboxMode),
            1.0,
            playbackRate,
          )
          .then((realDur) => {
            if (realDur && Math.abs(realDur - song.durationSec) > 1.5) {
              setBaseSongs((prev) =>
                prev.map((item) => (item.id === song.id ? { ...item, durationSec: realDur } : item)),
              );
              const curEng = engineRef.current;
              if (curEng.phase === 'PLAYING' && curEng.songTime < 2.0 && !curEng.sandboxModeId) {
                const updatedSong = { ...song, durationSec: realDur };
                const rebuilt = buildSongBeatmap(updatedSong, diffId, mods);
                const odRatioCur = mods.includes('SG') ? 0.35 : 0.45;
                curEng.beatmap = rebuilt;
                curEng.overdriveTargetPerfects = Math.max(
                  4,
                  Math.ceil(countBeatmapPerfectUnits(rebuilt) * odRatioCur),
                );
                setUiOverdriveTargetPerfects(curEng.overdriveTargetPerfects);
              }
            }
          });
      } else {
        audioEngine.stop();
      }
    },
    [getActiveSong, getRunConfig, spawnNextWave],
  );

  const syncTitleMusic = useCallback(
    (songOverride?: SongDefinition) => {
      const p = profileRef.current;
      if (screenRef.current !== 'TITLE') return;
      if (!p.musicEnabled) {
        audioEngine.stop();
        return;
      }
      if (!hasUnlockedAudioRef.current) return;
      const song = songOverride || getActiveSong(p);
      if (audioEngine.isPlaying() && audioEngine.getActiveSongId() === song.id) {
        audioEngine.updateVolumes(p.musicEnabled, p.musicVolume, p.soundEnabled, p.sfxVolume);
        return;
      }
      const startSec = Math.min(
        Math.max(0, song.durationSec * 0.16),
        Math.max(0, song.durationSec - 20),
      );
      audioEngine.startAtOffset(
        song,
        startSec,
        true,
        p.musicVolume,
        p.soundEnabled,
        p.sfxVolume,
        true,
        0.58,
      );
    },
    [getActiveSong],
  );

  useEffect(() => {
    if (screen === 'TITLE') {
      syncTitleMusic();
    }
  }, [screen, profile.selectedSongId, profile.musicEnabled, syncTitleMusic]);

  useEffect(() => {
    resetRound(false, null);

    const handleFirstUnlock = () => {
      hasUnlockedAudioRef.current = true;
      const p = profileRef.current;
      const active = getActiveSong(p);
      audioEngine.unlock();
      audioEngine.updateVolumes(p.musicEnabled, p.musicVolume, p.soundEnabled, p.sfxVolume);
      if (screenRef.current === 'TITLE' && p.musicEnabled && !audioEngine.isPlaying()) {
        syncTitleMusic(active);
      }
      audioEngine.loadSongBuffer(active).then((buf) => {
        if (buf && Math.abs(buf.duration - active.durationSec) > 1.5) {
          setBaseSongs((prev) =>
            prev.map((item) => (item.id === active.id ? { ...item, durationSec: buf.duration } : item)),
          );
        }
      });
    };
    window.addEventListener('pointerdown', handleFirstUnlock, { passive: true, once: true });
    window.addEventListener('keydown', handleFirstUnlock, { passive: true, once: true });
    return () => {
      window.removeEventListener('pointerdown', handleFirstUnlock);
      window.removeEventListener('keydown', handleFirstUnlock);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onBeforeUnload = () => flushRunProfileDeltas();
    const onWindowBlur = () => {
      audioEngine.stopHoldShimmer();
      if (screenRef.current === 'PLAYING' && engineRef.current.phase === 'PLAYING') {
        for (const t of engineRef.current.targets) {
          if (t.isHold && t.isHolding) t.isHolding = false;
        }
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('blur', onWindowBlur);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('blur', onWindowBlur);
      warpTimersRef.current.forEach((id) => window.clearTimeout(id));
      warpTimersRef.current = [];
    };
  }, [flushRunProfileDeltas]);

  const seekPracticeToTime = useCallback(
    (targetSec: number, restoreCp?: PracticeCheckpoint, skipAudioStart = false) => {
      audioEngine.unlock();
      const eng = engineRef.current;
      const p = profileRef.current;
      const song = getActiveSong(p);
      const clamped = Math.max(0, Math.min(Math.max(0.5, song.durationSec - 1.5), targetSec));

      audioEngine.stopHoldShimmer();
      eng.songTime = clamped;
      eng.hp = 100;
      eng.streak = restoreCp ? restoreCp.streak : 0;
      eng.overdriveActive = restoreCp ? restoreCp.overdriveActive : false;
      eng.overdriveCharge = restoreCp ? restoreCp.overdriveCharge : 0;
      eng.overdriveTimeLeft = restoreCp ? restoreCp.overdriveTimeLeft : 0;
      eng.overdrivePerfectsEarned = restoreCp ? restoreCp.overdrivePerfectsEarned : 0;
      eng.overdriveUsedThisRun = restoreCp ? restoreCp.overdriveUsedThisRun : false;
      eng.practicePaused = false;
      eng.targets = [];
      eng.hazards = [];
      eng.portal = null;
      eng.hitEffects = [];
      eng.waitingForCue = false;
      eng.breakRemainingSec = 0;
      if (restoreCp) {
        eng.spinnerAngle = restoreCp.spinnerAngle;
        eng.direction = restoreCp.direction;
        eng.score = restoreCp.score;
      } else {
        const { mods } = getRunConfig(eng, p, song);
        eng.spinnerAngle = -Math.PI / 2;
        eng.direction = mods.includes('MR') ? -1 : 1;
      }
      const nextIdx = eng.beatmap.findIndex((n) => n.hitTime >= clamped + 0.35);
      eng.beatmapIndex = nextIdx === -1 ? eng.beatmap.length : nextIdx;
      eng.songSection = getSectionAtProgress(song, clamped / Math.max(1, song.durationSec));
      eng.hubStatusText = restoreCp ? 'CHECKPOINT' : 'START POS';
      eng.hubStatusColor = '#38bdf8';
      eng.hubStatusTimer = 0.55;
      eng.phase = 'PLAYING';
      eng.lastPhysicsTimeMs = performance.now();

      setUiPhase('PLAYING');
      setUiHp(100);
      setUiStreak(eng.streak);
      setUiScore(eng.score);
      setUiSongTime(clamped);
      setUiSection(eng.songSection);
      setUiOverdriveCharge(eng.overdriveCharge);
      setUiOverdriveActive(eng.overdriveActive);
      setUiOverdriveTimeLeft(eng.overdriveTimeLeft);
      setUiOverdrivePerfectsEarned(eng.overdrivePerfectsEarned);
      setUiOverdriveUsed(eng.overdriveUsedThisRun);
      setUiPracticePaused(false);

      if (!skipAudioStart) {
        audioEngine.playCheckpointSound(p.soundEnabled);
      }
      spawnNextWave(false, null);

      if (eng.phase === 'PLAYING' && !skipAudioStart) {
        audioEngine.startAtOffset(
          song,
          clamped,
          p.musicEnabled,
          p.musicVolume,
          p.soundEnabled,
          p.sfxVolume,
          false,
          1.0,
          eng.practiceSpeed,
        );
      }
    },
    [getActiveSong, getRunConfig, spawnNextWave],
  );

  const respawnPracticeCheckpoint = useCallback(() => {
    const eng = engineRef.current;
    if (!eng.practiceMode) return;
    const lastCp = eng.checkpoints[eng.checkpoints.length - 1];
    if (lastCp) {
      seekPracticeToTime(lastCp.songTime, lastCp);
    } else {
      seekPracticeToTime(eng.practiceStartSec);
    }
  }, [seekPracticeToTime]);

  const dropPracticeCheckpoint = useCallback(() => {
    const eng = engineRef.current;
    const p = profileRef.current;
    if (!eng.practiceMode || eng.phase !== 'PLAYING') return;
    const cp: PracticeCheckpoint = {
      id: eng.checkpointNextId++,
      songTime: eng.songTime,
      beatmapIndex: eng.beatmapIndex,
      spinnerAngle: eng.spinnerAngle,
      direction: eng.direction,
      score: eng.score,
      streak: eng.streak,
      overdriveCharge: eng.overdriveCharge,
      overdrivePerfectsEarned: eng.overdrivePerfectsEarned,
      overdriveUsedThisRun: eng.overdriveUsedThisRun,
      overdriveActive: eng.overdriveActive,
      overdriveTimeLeft: eng.overdriveTimeLeft,
    };
    eng.checkpoints = [...eng.checkpoints, cp];
    setUiCheckpoints([...eng.checkpoints]);
    eng.hubStatusText = `CP #${eng.checkpoints.length}`;
    eng.hubStatusColor = '#34d399';
    eng.hubStatusTimer = 0.5;
    audioEngine.playCheckpointSound(p.soundEnabled);
  }, []);

  const removePracticeCheckpoint = useCallback(() => {
    const eng = engineRef.current;
    if (!eng.practiceMode || eng.checkpoints.length === 0) return;
    eng.checkpoints = eng.checkpoints.slice(0, -1);
    setUiCheckpoints([...eng.checkpoints]);
    eng.hubStatusText = 'CP REMOVED';
    eng.hubStatusColor = '#fbbf24';
    eng.hubStatusTimer = 0.45;
  }, []);

  const triggerMiss = useCallback(
    (reasonText: string, targetRef?: TargetSector, isSuddenFail = false) => {
      const eng = engineRef.current;
      const p = profileRef.current;
      const song = getActiveSong(p);
      const { diffId, mods } = getRunConfig(eng, p, song);
      const isUnranked = Boolean(eng.sandboxModeId || eng.practiceMode || eng.replayMode);

      audioEngine.stopHoldShimmer();

      if (eng.lessonSlowActive) {
        eng.lessonSlowActive = false;
        eng.activeLesson = null;
        eng.dialTimeScale = 1.0;
        setUiActiveLesson(null);
      }

      if (eng.shields > 0 && !isSuddenFail) {
        eng.shields -= 1;
        setUiShields(eng.shields);
        eng.shakeTime = 0.25;
        eng.shakeAmplitude = 8;
        eng.hubStatusText = 'SHIELDED';
        eng.hubStatusColor = '#34d399';
        eng.hubStatusTimer = 0.7;
        if (!eng.silentSeek) audioEngine.playShieldBreak(p.soundEnabled);
        spawnNextWave(false, eng.sandboxModeId);
        return;
      }

      if (!isUnranked) {
        recordMechanicStat(eng, targetRef?.modeId || eng.waveModeId, 'miss');
      }
      eng.missCount += 1;
      eng.streak = 0;
      setUiStreak(0);
      setUiAccuracy(computeCurrentAccuracy(eng));

      const ref = targetRef || eng.targets[0];
      if (ref) {
        const tStart = wrapAngle(ref.angle - ref.halfWidth);
        const tEnd = wrapAngle(ref.angle + ref.halfWidth);
        const dStart = signedAngleDiff(eng.spinnerAngle, tStart);
        const dEnd = signedAngleDiff(eng.spinnerAngle, tEnd);
        if (Math.abs(dStart) <= Math.abs(dEnd)) {
          eng.missNearestEdge = tStart;
          eng.missSignedSpan = dStart;
        } else {
          eng.missNearestEdge = tEnd;
          eng.missSignedSpan = dEnd;
        }
        const absDelta = Math.abs(signedAngleDiff(eng.spinnerAngle, ref.angle));
        const missRad = Math.max(0.002, absDelta - (ref.halfWidth + NEEDLE_TOLERANCE));
        eng.missDegrees = (missRad * (180 / Math.PI)).toFixed(1);
        const dirErr = signedAngleDiff(eng.spinnerAngle, ref.angle) * eng.direction;
        const isEarly = dirErr < 0;
        eng.hitErrorTicks.push({
          offsetSigned: isEarly ? -1 : 1,
          color: '#ef4444',
          age: 0,
        });
        if (eng.hitErrorTicks.length > 16) eng.hitErrorTicks.shift();
        if (!isUnranked) {
          eng.pendingMisses += 1;
          if (isEarly) eng.pendingEarlyMisses += 1;
          else eng.pendingLateMisses += 1;
        }
      }

      if (eng.isTutorialRun) {
        if (eng.tutorialLives > 0) {
          eng.tutorialLives -= 1;
          setUiTutorialLives(eng.tutorialLives);
        }
        eng.shakeTime = 0.22;
        eng.shakeAmplitude = 6;
        eng.hubStatusText = eng.tutorialLives > 0 ? `${eng.tutorialLives} LIVES` : 'PRACTICE FLOW';
        eng.hubStatusColor = '#f59e0b';
        eng.hubStatusTimer = 0.75;
        if (!eng.silentSeek) audioEngine.playShieldBreak(p.soundEnabled);
        eng.waveIndex += 1;
        spawnNextWave(false, null);
        return;
      }

      // Practice Mode: auto-respawn smoothly at last Checkpoint / Start Pos when HP reaches 0!
      const isNoFail = mods.includes('NF') || Boolean(eng.sandboxModeId);
      const isSD = mods.includes('SD') || isSuddenFail;
      const baseDrain =
        diffId === 'CHILL'
          ? 7
          : diffId === 'NORMAL'
          ? 9
          : diffId === 'HARD'
          ? 12
          : diffId === 'INSANE'
          ? 14
          : 16;
      const modeAdj = (targetRef?.modeId || eng.waveModeId) === 'ONE_PASS' ? 5 : 0;
      const modMult = mods.includes('HR') ? 1.3 : mods.includes('EZ') ? 0.55 : 1.0;
      const drain = Math.round((baseDrain + modeAdj) * modMult);

      eng.hp = isSD && !isNoFail ? 0 : Math.max(isNoFail ? 1 : 0, eng.hp - drain);
      setUiHp(eng.hp);

      if (eng.practiceMode && eng.hp <= 0) {
        respawnPracticeCheckpoint();
        return;
      }

      if (eng.hp > 0) {
        if (!eng.silentSeek) audioEngine.playMiss(p.soundEnabled);
        eng.shakeTime = 0.22;
        eng.shakeAmplitude = 7;
        eng.hubStatusText = reasonText;
        eng.hubStatusColor = '#ef4444';
        eng.hubStatusTimer = 0.52;
        eng.hitEffects.push({
          timer: 0.4,
          duration: 0.4,
          angle: eng.spinnerAngle,
          isPerfect: false,
          label: reasonText,
          color: '#ef4444',
        });
        eng.waveIndex += 1;
        spawnNextWave(false, eng.sandboxModeId);
        return;
      }

      if (!eng.silentSeek) audioEngine.playMiss(p.soundEnabled);
      eng.missReason = reasonText;
      eng.shakeTime = 0.34;
      eng.shakeAmplitude = 11;

      orbitEvents.emit('onMiss', {
        reason: reasonText,
        degrees: eng.missDegrees,
        songId: song.id,
      });

      finalizeRunSummary(false);
    },
    [finalizeRunSummary, getActiveSong, getRunConfig, respawnPracticeCheckpoint, spawnNextWave],
  );

  const awardHitSuccess = useCallback(
    (
      tier: JudgmentTier,
      offsetSigned: number,
      offsetDeg: number,
      labelOverride?: string,
      orbGain = 0,
      hitModeId?: WaveModeId,
    ) => {
      const eng = engineRef.current;
      const p = profileRef.current;
      const song = getActiveSong(p);
      const { diffId, mods } = getRunConfig(eng, p, song);
      const isUnranked = Boolean(eng.sandboxModeId || eng.practiceMode || eng.replayMode);
      const isPerfect = tier === 'PERFECT';
      const th = getResolvedChassisTheme(p.theme, themesRef.current);
      const fxColor = tier === 'PERFECT' ? (eng.overdriveActive ? th.bright : '#ffffff') : tier === 'GREAT' ? '#34d399' : '#22d3ee';
      const effectiveModeId = hitModeId || eng.waveModeId;

      eng.streak += 1;
      eng.maxStreakInRun = Math.max(eng.maxStreakInRun, eng.streak);

      const basePts = computeHitPoints(tier, diffId, mods, eng.streak);
      const pts = eng.overdriveActive ? Math.round(basePts * 1.5) : basePts;
      eng.score += pts;

      const baseHpGain = isPerfect ? 4.5 : tier === 'GREAT' ? 2.8 : 1.2;
      const hpGain = mods.includes('RG') ? baseHpGain * 1.5 : baseHpGain;
      eng.hp = Math.min(100, eng.hp + hpGain);
      setUiHp(eng.hp);

      // Overdrive: Nerfed to ONCE per run upon earning 45% (or 35% with SG mod) of all possible Perfects in the track!
      let triggeredOverdriveNow = false;
      if (!eng.overdriveActive && !eng.overdriveUsedThisRun && isPerfect) {
        eng.overdrivePerfectsEarned += 1;
        const targetPerf = Math.max(4, eng.overdriveTargetPerfects || 20);
        eng.overdriveCharge = Math.min(100, (eng.overdrivePerfectsEarned / targetPerf) * 100);
        if (eng.overdrivePerfectsEarned >= targetPerf) {
          eng.overdriveUsedThisRun = true;
          eng.runTriggeredOverdrive = true;
          eng.overdriveActive = true;
          eng.overdriveTimeLeft = 10.0;
          eng.overdriveCharge = 100;
          triggeredOverdriveNow = true;
          eng.shockwaves.push({ timer: 0.65, duration: 0.65, color: th.bright });
          eng.shockwaves.push({ timer: 0.46, duration: 0.46, color: th.secondary });
          if (!eng.silentSeek) audioEngine.playOverdriveIgnite(p.soundEnabled);
        }
        setUiOverdrivePerfectsEarned(eng.overdrivePerfectsEarned);
        setUiOverdriveTargetPerfects(targetPerf);
        setUiOverdriveUsed(eng.overdriveUsedThisRun);
        setUiOverdriveCharge(eng.overdriveCharge);
        setUiOverdriveActive(eng.overdriveActive);
        setUiOverdriveTimeLeft(eng.overdriveTimeLeft);
      }

      const multOrb = eng.overdriveActive ? 2 : 1;
      let grantedOrbs = 0;

      if (tier === 'PERFECT') {
        eng.perfectCount += 1;
        if (!isUnranked) recordMechanicStat(eng, effectiveModeId, 'perfect');
        if (!eng.sandboxModeId && !eng.practiceMode) {
          grantedOrbs = Math.max(1, orbGain) * multOrb;
        }
      } else {
        if (tier === 'GREAT') eng.greatCount += 1;
        else eng.goodCount += 1;
        if (!isUnranked) recordMechanicStat(eng, effectiveModeId, 'hit');
        if (orbGain > 0 && !eng.sandboxModeId && !eng.practiceMode) {
          grantedOrbs = orbGain * multOrb;
        }
      }

      // Orb Amplifier (CV) mod grants +1 bonus Orb on every 10th combo milestone
      if (
        mods.includes('CV') &&
        eng.streak > 0 &&
        eng.streak % 10 === 0 &&
        !eng.sandboxModeId &&
        !eng.practiceMode
      ) {
        grantedOrbs += 1;
      }

      if (grantedOrbs > 0) {
        eng.unbankedOrbs += grantedOrbs;
        setUiUnbankedOrbs(eng.unbankedOrbs);
      }

      if (isPerfect && !triggeredOverdriveNow && !eng.silentSeek) {
        eng.shockwaves.push({
          timer: 0.34,
          duration: 0.34,
          color: eng.overdriveActive ? th.bright : th.secondary,
        });
      }

      eng.runOffsetDegSum += offsetDeg;
      eng.runHitCount += 1;
      eng.runOffsetSamples.push(offsetSigned);

      if (mods.includes('SH') && eng.streak % 12 === 0 && eng.shields < 2) {
        eng.shields += 1;
        setUiShields(eng.shields);
      }

      if (!eng.silentSeek && (eng.streak === 25 || eng.streak === 50 || eng.streak === 100)) {
        const mTier: 1 | 2 | 3 = eng.streak === 100 ? 3 : eng.streak === 50 ? 2 : 1;
        audioEngine.playComboMilestone(p.soundEnabled, mTier);
        orbitEvents.emit('onComboMilestone', { streak: eng.streak, tier: mTier });
      }

      orbitEvents.emit('onHit', {
        tier,
        streak: eng.streak,
        points: pts,
        offsetSigned,
        songId: song.id,
      });

      if (!eng.silentSeek) {
        audioEngine.playHit(p.soundEnabled, p.hitSfxMode, eng.streak, isPerfect, song.scaleNotes);
      }
      eng.hitEffects.push({
        timer: 0.44,
        duration: 0.44,
        angle: eng.spinnerAngle,
        isPerfect,
        label:
          labelOverride ||
          (grantedOrbs > 0
            ? `${tier} +${pts} (+${grantedOrbs} Orb${grantedOrbs > 1 ? 's' : ''})`
            : `${tier} +${pts}`),
        color: fxColor,
      });
      if (eng.hitEffects.length > 5) eng.hitEffects.shift();

      eng.hubStatusText = triggeredOverdriveNow ? 'OVERDRIVE!' : tier;
      eng.hubStatusColor = triggeredOverdriveNow ? th.bright : fxColor;
      eng.hubStatusTimer = triggeredOverdriveNow ? 0.85 : 0.42;
      setUiScore(eng.score);
      setUiStreak(eng.streak);
      setUiAccuracy(computeCurrentAccuracy(eng));

      if (!isUnranked) {
        eng.pendingHits += 1;
        if (isPerfect) eng.pendingPerfects += 1;
        eng.pendingOffsetDegSum += offsetDeg;
      }
    },
    [getActiveSong, getRunConfig],
  );

  const processTriggerPress = useCallback(
    (cbsAngle: number, nowMs: number, fromReplay = false): boolean => {
      const eng = engineRef.current;
      const p = profileRef.current;
      const { mods } = getRunConfig(eng, p, getActiveSong(p));
      const canRecord = !fromReplay && !eng.practiceMode && !eng.replayMode && !eng.sandboxModeId;

      const recordInput = (tier?: JudgmentTier) => {
        if (!canRecord) return;
        eng.recordedEvents.push({
          songTime: Number(eng.songTime.toFixed(4)),
          action: 'PRESS',
          cbsAngle,
          tier,
          modeId: eng.waveModeId,
        });
      };

      // 1. Handle FEVER_SPINNER rapid mash
      const feverTarget = eng.targets.find((t) => t.isFeverSpinner);
      if (feverTarget) {
        feverTarget.feverHits = (feverTarget.feverHits || 0) + 1;
        const maxH = feverTarget.feverMaxHits || 7;
        const ratio = feverTarget.feverHits / maxH;
        if (!eng.silentSeek) audioEngine.playFeverTap(p.soundEnabled, ratio);
        eng.beatPulse = 0.65;
        recordInput(feverTarget.feverHits >= maxH ? 'PERFECT' : 'GREAT');
        if (feverTarget.feverHits >= maxH) {
          eng.targets = [];
          awardHitSuccess('PERFECT', 0, 0, undefined, 2);
          eng.waveIndex += 1;
          spawnNextWave(false, eng.sandboxModeId);
        }
        return true;
      }

      // 2. If currently riding a Hold Arc already, ignore secondary accidental key press
      if (eng.targets.some((t) => t.isHold && t.isHolding)) {
        return false;
      }

      // 3. Quiet gap cruise tap check
      if (eng.targets.length === 0) return false;

      // 4. Hazard mines
      for (let i = 0; i < eng.hazards.length; i++) {
        const h = eng.hazards[i];
        if (Math.abs(signedAngleDiff(cbsAngle, h.angle)) <= h.halfWidth + 0.01) {
          recordInput('MISS');
          triggerMiss('HAZARD HIT', eng.targets[0]);
          return true;
        }
      }

      // 5. Find closest hit target in range using CBS sub-frame angle
      let matchedIdx = -1;
      let bestAbsDelta = Infinity;
      for (let i = 0; i < eng.targets.length; i++) {
        const t = eng.targets[i];
        const absD = Math.abs(signedAngleDiff(cbsAngle, t.angle));
        if (absD <= t.halfWidth + NEEDLE_TOLERANCE && absD < bestAbsDelta) {
          bestAbsDelta = absD;
          matchedIdx = i;
        }
      }

      if (matchedIdx === -1) {
        let nearest = eng.targets[0];
        let minD = Infinity;
        for (const t of eng.targets) {
          const d = Math.abs(signedAngleDiff(cbsAngle, t.angle));
          if (d < minD) {
            minD = d;
            nearest = t;
          }
        }

        const timeRemaining = nearest?.targetHitTime ? nearest.targetHitTime - eng.songTime : 0;
        if (nearest && !eng.sandboxModeId && (timeRemaining > 0.30 || minD > nearest.halfWidth + 0.48)) {
          recordInput('MISS');
          eng.streak = 0;
          setUiStreak(0);
          if (!eng.isTutorialRun && !mods.includes('NF')) {
            eng.hp = Math.max(1, eng.hp - 3);
            setUiHp(eng.hp);
          }
          eng.hubStatusText = 'WAIT BEAT';
          eng.hubStatusColor = '#fbbf24';
          eng.hubStatusTimer = 0.42;
          eng.hitEffects.push({
            timer: 0.28,
            duration: 0.28,
            angle: cbsAngle,
            isPerfect: false,
            label: 'EARLY',
            color: '#fbbf24',
          });
          if (!eng.silentSeek) audioEngine.playShieldBreak(p.soundEnabled);
          return true;
        }

        recordInput('MISS');
        const dirErr = nearest ? signedAngleDiff(cbsAngle, nearest.angle) * eng.direction : 0;
        triggerMiss(dirErr < 0 ? 'TOO EARLY' : 'TOO LATE', nearest);
        return true;
      }

      const hitTarget = eng.targets[matchedIdx];
      const hitMode = hitTarget.modeId || eng.waveModeId;
      if (
        hitMode === 'ORDERED_SEQ' &&
        eng.targets.some(
          (other) => (other.modeId || eng.waveModeId) === 'ORDERED_SEQ' && other.seqNum < hitTarget.seqNum,
        )
      ) {
        recordInput('MISS');
        triggerMiss('WRONG ORDER', hitTarget);
        return true;
      }

      if (eng.activeLesson) {
        eng.activeLessonTimer = 0.9;
      }

      // 6. Engage HOLD_ARC sustain — anchored directly to player's actual CBS tap angle!
      if (hitTarget.isHold) {
        const dir = hitTarget.holdDir || eng.direction;
        const tapOffset = signedAngleDiff(cbsAngle, hitTarget.angle) * dir;
        const span = hitTarget.holdSpanRad || 0.85;
        hitTarget.isHolding = true;
        hitTarget.holdStartAngle = cbsAngle;
        hitTarget.holdRemainingRad = Math.max(0.18, span - tapOffset);
        hitTarget.holdTravelledRad = 0;
        hitTarget.holdElapsedSec = 0;
        const song = getActiveSong(p);
        if (!eng.silentSeek) audioEngine.startHoldShimmer(p.soundEnabled, song.scaleNotes, eng.streak);
        eng.hubStatusText = 'HOLDING';
        eng.hubStatusColor = '#38bdf8';
        eng.hubStatusTimer = 0.5;
        recordInput('GREAT');
        return true;
      }

      const isMultiTap = hitTarget.tapsLeft > 1 || hitTarget.lastTapAtMs !== undefined;
      const rapidFollowUp =
        hitTarget.lastTapAtMs !== undefined && nowMs - hitTarget.lastTapAtMs <= 460;
      const basePerfLimit = mods.includes('RX')
        ? isMultiTap
          ? 0.56
          : 0.34
        : isMultiTap
        ? rapidFollowUp
          ? 0.64
          : 0.46
        : 0.27;
      const perfectRatioLimit = mods.includes('SM') ? basePerfLimit * 0.75 : basePerfLimit;
      const ratio = bestAbsDelta / Math.max(0.01, hitTarget.halfWidth);
      const tier: JudgmentTier =
        ratio <= perfectRatioLimit ? 'PERFECT' : ratio <= 0.72 ? 'GREAT' : 'GOOD';
      recordInput(tier);

      const fxColor = tier === 'PERFECT' ? '#ffffff' : tier === 'GREAT' ? '#34d399' : '#22d3ee';
      const signedErr = signedAngleDiff(cbsAngle, hitTarget.angle) * eng.direction;
      const offsetSigned = Math.max(
        -1,
        Math.min(1, signedErr / Math.max(0.05, hitTarget.halfWidth + NEEDLE_TOLERANCE)),
      );
      eng.hitErrorTicks.push({ offsetSigned, color: fxColor, age: 0 });
      if (eng.hitErrorTicks.length > 16) eng.hitErrorTicks.shift();

      const offsetDeg = bestAbsDelta * (180 / Math.PI);
      if (hitTarget.tapsLeft > 1) {
        hitTarget.tapsLeft -= 1;
        hitTarget.lastTapAtMs = nowMs;
        awardHitSuccess(
          tier,
          offsetSigned,
          offsetDeg,
          hitTarget.tapsLeft === 1
            ? `${tier} · TAP ×1`
            : `${tier} · ×${hitTarget.tapsLeft} LEFT`,
          0,
          hitMode,
        );
        eng.hubStatusText = `×${hitTarget.tapsLeft} LEFT`;
        eng.hubStatusColor = tier === 'PERFECT' ? '#fde047' : '#22d3ee';
        eng.hubStatusTimer = 0.36;
        return true;
      }

      eng.targets.splice(matchedIdx, 1);

      // METEOR_SLASH flips direction straight toward its rebound echo!
      const meteorEcho = eng.targets.find((other) => other.isMeteorEcho);
      if (hitMode === 'METEOR_SLASH' && meteorEcho) {
        eng.direction = eng.direction === 1 ? -1 : 1;
        meteorEcho.alpha = 1.0;
        eng.angularSpeed = eng.baseAngularSpeed * 1.15;
      }

      const finalLabel =
        hitTarget.lastTapAtMs !== undefined
          ? tier === 'PERFECT'
            ? `DOUBLE ${tier}!`
            : `BURST ${tier}`
          : undefined;
      awardHitSuccess(tier, offsetSigned, offsetDeg, finalLabel, 0, hitMode);

      if (eng.targets.length > 0) return true;

      eng.waveIndex += 1;
      spawnNextWave(false, eng.sandboxModeId);
      return true;
    },
    [awardHitSuccess, getActiveSong, getRunConfig, spawnNextWave, triggerMiss],
  );

  const processTriggerRelease = useCallback(
    (subStepDt: number, fromReplay = false) => {
      const eng = engineRef.current;
      const p = profileRef.current;
      const { mods } = getRunConfig(eng, p, getActiveSong(p));
      const holdIdx = eng.targets.findIndex((t) => t.isHold && t.isHolding);
      if (holdIdx === -1) return;

      const holdTarget = eng.targets[holdIdx];
      const remRad = Math.max(0.18, holdTarget.holdRemainingRad ?? holdTarget.holdSpanRad ?? 0.85);
      const travelled = Math.max(0, (holdTarget.holdTravelledRad ?? 0) + eng.angularSpeed * subStepDt);
      const prog = travelled / remRad;

      // Auto-Hold Rail (GA): ignore early key release and carry needle smoothly to finish
      if (mods.includes('GA') && !fromReplay && prog < 0.72) {
        return;
      }

      audioEngine.stopHoldShimmer();

      const tier: JudgmentTier =
        prog < 0.42 ? 'MISS' : prog >= 0.72 ? 'PERFECT' : prog >= 0.54 ? 'GREAT' : 'GOOD';

      if (!fromReplay && !eng.practiceMode && !eng.replayMode && !eng.sandboxModeId) {
        eng.recordedEvents.push({
          songTime: Number(eng.songTime.toFixed(4)),
          action: 'RELEASE',
          cbsAngle: eng.spinnerAngle,
          tier,
          modeId: holdTarget.modeId || eng.waveModeId,
        });
      }

      if (prog < 0.42) {
        triggerMiss('HOLD BROKEN', holdTarget);
        return;
      }

      eng.targets.splice(holdIdx, 1);
      awardHitSuccess(
        tier,
        Math.max(-0.5, Math.min(0.5, prog - 0.96)),
        Math.abs(1 - prog) * 14,
        undefined,
        tier === 'PERFECT' ? 1 : 0,
        holdTarget.modeId || 'HOLD_ARC',
      );

      if (eng.targets.length > 0) return;

      eng.waveIndex += 1;
      spawnNextWave(false, eng.sandboxModeId);
    },
    [awardHitSuccess, spawnNextWave, triggerMiss],
  );

  const handleTriggerPress = useCallback((eventTimeMs?: number) => {
    if (screenRef.current !== 'PLAYING') return;
    if (pauseOpenRef.current || modsOpenRef.current) return;

    const eng = engineRef.current;
    if (eng.replayMode) return;

    const nowMs = performance.now();
    const inputMs = typeof eventTimeMs === 'number' && eventTimeMs > 0 ? eventTimeMs : nowMs;
    const minDebounce = eng.waveModeId === 'FEVER_SPINNER' ? 12 : 18;
    if (nowMs - lastInputTimestampRef.current < minDebounce) return;
    lastInputTimestampRef.current = nowMs;

    if (eng.phase === 'IDLE' || eng.phase === 'SUMMARY') {
      audioEngine.ensureContext();
      resetRound(true, eng.sandboxModeId);
      return;
    }
    if (eng.phase !== 'PLAYING') return;

    // CBS (Click-Between-Steps): interpolate needle angle to the exact sub-frame input timestamp
    const subStepDt = Math.max(-0.02, Math.min(0.025, (inputMs - eng.lastPhysicsTimeMs) / 1000));
    const cbsAngle = wrapAngle(
      eng.spinnerAngle + eng.direction * eng.angularSpeed * eng.lastSweepRate * subStepDt,
    );
    processTriggerPress(cbsAngle, nowMs, false);
  }, [processTriggerPress, resetRound]);

  const handleTriggerRelease = useCallback((eventTimeMs?: number) => {
    if (screenRef.current !== 'PLAYING') return;
    const eng = engineRef.current;
    if (eng.phase !== 'PLAYING' || eng.replayMode) return;

    const inputMs = typeof eventTimeMs === 'number' && eventTimeMs > 0 ? eventTimeMs : performance.now();
    const subStepDt = Math.max(-0.02, Math.min(0.025, (inputMs - eng.lastPhysicsTimeMs) / 1000));
    processTriggerRelease(subStepDt, false);
  }, [processTriggerRelease]);

  const stepSimulationRef = useRef<
    (simDt: number, nowPerfMs: number, song: SongDefinition, p: PlayerProfile) => void
  >(() => {});

  const startPracticeRound = useCallback(() => {
    audioEngine.unlock();
    setPauseOpen(false);
    setModsOpen(false);
    setSummaryData(null);
    setScreen('PLAYING');
    resetRound(true, null, {
      practice: true,
      practiceStartSec: 0,
      practiceSpeed: 1.0,
      preserveCheckpoints: false,
    });
  }, [resetRound]);

  const exitPracticeMode = useCallback(() => {
    audioEngine.unlock();
    resetRound(true, null, {
      practice: false,
      preserveCheckpoints: false,
    });
  }, [resetRound]);

  const changePracticeSpeed = useCallback(
    (speed: number) => {
      audioEngine.unlock();
      const eng = engineRef.current;
      const p = profileRef.current;
      const song = getActiveSong(p);
      eng.practiceSpeed = speed;
      setUiPracticeSpeed(speed);
      if (!eng.practicePaused && eng.phase === 'PLAYING' && screenRef.current === 'PLAYING') {
        audioEngine.startAtOffset(
          song,
          eng.songTime,
          p.musicEnabled,
          p.musicVolume,
          p.soundEnabled,
          p.sfxVolume,
          false,
          1.0,
          speed,
        );
      }
    },
    [getActiveSong],
  );

  const togglePracticePause = useCallback(() => {
    audioEngine.unlock();
    const eng = engineRef.current;
    const p = profileRef.current;
    if (!eng.practiceMode) return;
    eng.practicePaused = !eng.practicePaused;
    setUiPracticePaused(eng.practicePaused);
    if (eng.practicePaused) {
      audioEngine.stop();
      audioEngine.stopHoldShimmer();
    } else if (eng.phase === 'PLAYING') {
      const song = getActiveSong(p);
      eng.lastPhysicsTimeMs = performance.now();
      audioEngine.startAtOffset(
        song,
        eng.songTime,
        p.musicEnabled,
        p.musicVolume,
        p.soundEnabled,
        p.sfxVolume,
        false,
        1.0,
        eng.practiceSpeed,
      );
    }
  }, [getActiveSong]);

  const startReplayPlayback = useCallback(
    (replay: ReplayData) => {
      audioEngine.unlock();
      setPauseOpen(false);
      setModsOpen(false);
      setSummaryData(null);
      if (profileRef.current.selectedSongId !== replay.songId) {
        profileRef.current = { ...profileRef.current, selectedSongId: replay.songId };
        updateProfile({ selectedSongId: replay.songId });
      }
      setScreen('PLAYING');
      resetRound(true, null, {
        replay,
        replaySpeed: 1.0,
      });
    },
    [resetRound, updateProfile],
  );

  const exitReplayMode = useCallback(() => {
    audioEngine.unlock();
    resetRound(false, null, { replay: null });
  }, [resetRound]);

  const seekReplayToTime = useCallback(
    (targetSec: number, skipAudioStart = false) => {
      audioEngine.unlock();
      const eng = engineRef.current;
      const p = profileRef.current;
      if (!eng.replayMode || !eng.replayData) return;
      const song = getActiveSong(p);
      const { diffId, mods } = getRunConfig(eng, p, song);
      const clamped = Math.max(0, Math.min(Math.max(0.5, song.durationSec - 0.5), targetSec));
      const wasPaused = eng.replayPaused;

      if (!skipAudioStart) {
        audioEngine.stop();
      }
      audioEngine.stopHoldShimmer();

      eng.silentSeek = true;
      eng.isTutorialRun = false;
      eng.sandboxModeId = null;
      eng.phase = 'PLAYING';
      eng.score = 0;
      eng.hp = 100;
      eng.streak = 0;
      eng.maxStreakInRun = 0;
      eng.unbankedOrbs = 0;
      eng.shields = mods.includes('SH') ? 1 : 0;
      eng.spinnerAngle = -Math.PI / 2;
      eng.direction = mods.includes('MR') ? -1 : 1;
      eng.waveIndex = 0;
      eng.waitingForCue = false;
      eng.breakRemainingSec = 0;
      eng.waveElapsed = 0;
      eng.songTime = 0;
      eng.songSection = getSectionAtProgress(song, 0);
      eng.beatmap = buildSongBeatmap(song, diffId, mods);
      eng.beatmapIndex = 0;
      eng.replayEventIndex = 0;
      eng.replayLastClickLabel = '';
      eng.hitEffects = [];
      eng.hitErrorTicks = [];
      eng.shockwaves = [];
      eng.nextCuePreview = null;
      eng.overdriveCharge = 0;
      eng.overdriveActive = false;
      eng.overdriveTimeLeft = 0;
      eng.overdrivePerfectsEarned = 0;
      eng.overdriveTargetPerfects = Math.max(
        4,
        Math.ceil(countBeatmapPerfectUnits(eng.beatmap) * (mods.includes('SG') ? 0.35 : 0.45)),
      );
      eng.overdriveUsedThisRun = false;
      eng.runTriggeredOverdrive = false;
      eng.perfectCount = 0;
      eng.greatCount = 0;
      eng.goodCount = 0;
      eng.missCount = 0;
      eng.runOffsetDegSum = 0;
      eng.runHitCount = 0;
      eng.runOffsetSamples = [];
      eng.physicsAccum = 0;
      eng.lastSweepRate = 1.0;

      spawnNextWave(true, null);

      const simStep = 1 / 120;
      const simNow = performance.now();
      while (eng.songTime < clamped && eng.phase === 'PLAYING') {
        const dt = Math.min(simStep, clamped - eng.songTime);
        stepSimulationRef.current(dt, simNow, song, p);
      }

      eng.silentSeek = false;
      eng.replayPaused = wasPaused;
      eng.lastPhysicsTimeMs = performance.now();

      setUiScore(eng.score);
      setUiHp(eng.hp);
      setUiStreak(eng.streak);
      setUiAccuracy(computeCurrentAccuracy(eng));
      setUiSongTime(eng.songTime);
      setUiSection(eng.songSection);
      setUiPhase(eng.phase);
      setUiOverdriveCharge(eng.overdriveCharge);
      setUiOverdriveActive(eng.overdriveActive);
      setUiOverdriveTimeLeft(eng.overdriveTimeLeft);
      setUiOverdrivePerfectsEarned(eng.overdrivePerfectsEarned);
      setUiOverdriveTargetPerfects(eng.overdriveTargetPerfects);
      setUiOverdriveUsed(eng.overdriveUsedThisRun);
      setUiReplayLastClickLabel(eng.replayLastClickLabel);

      if (eng.phase === 'PLAYING' && !wasPaused && !skipAudioStart) {
        audioEngine.startAtOffset(
          song,
          eng.songTime,
          p.musicEnabled,
          p.musicVolume,
          p.soundEnabled,
          p.sfxVolume,
          false,
          1.0,
          eng.replaySpeed,
        );
      }
    },
    [getActiveSong, getRunConfig, spawnNextWave],
  );

  const toggleReplayPause = useCallback(() => {
    audioEngine.unlock();
    const eng = engineRef.current;
    const p = profileRef.current;
    if (!eng.replayMode) return;
    eng.replayPaused = !eng.replayPaused;
    setUiReplayPaused(eng.replayPaused);
    if (eng.replayPaused) {
      audioEngine.stop();
      audioEngine.stopHoldShimmer();
    } else if (eng.phase === 'PLAYING') {
      const song = getActiveSong(p);
      eng.lastPhysicsTimeMs = performance.now();
      audioEngine.startAtOffset(
        song,
        eng.songTime,
        p.musicEnabled,
        p.musicVolume,
        p.soundEnabled,
        p.sfxVolume,
        false,
        1.0,
        eng.replaySpeed,
      );
    }
  }, [getActiveSong]);

  const changeReplaySpeed = useCallback(
    (speed: number) => {
      const eng = engineRef.current;
      const p = profileRef.current;
      if (!eng.replayMode) return;
      eng.replaySpeed = speed;
      setUiReplaySpeed(speed);
      if (!eng.replayPaused && eng.phase === 'PLAYING') {
        const song = getActiveSong(p);
        audioEngine.startAtOffset(
          song,
          eng.songTime,
          p.musicEnabled,
          p.musicVolume,
          p.soundEnabled,
          p.sfxVolume,
          false,
          1.0,
          speed,
        );
      }
    },
    [getActiveSong],
  );

  const togglePracticeModeFromPause = useCallback(() => {
    const eng = engineRef.current;
    if (eng.replayMode) return;
    setPauseOpen(false);
    setScreen('PLAYING');
    resetRound(true, null, {
      practice: !eng.practiceMode,
      practiceStartSec: 0,
      practiceSpeed: 1.0,
      preserveCheckpoints: false,
    });
  }, [resetRound]);

  // Deterministic 240Hz Fixed-Timestep Physics Loop + Audio-Clock Master Sync
  useEffect(() => {
    const FIXED_DT = 1 / 240;
    let lastTime = performance.now();
    let lastHudSync = 0;
    let rafId = 0;

    const stepPhysics = (simDt: number, nowPerfMs: number, song: SongDefinition, p: PlayerProfile) => {
      const eng = engineRef.current;
      const { mods } = getRunConfig(eng, p, song);

      for (let i = eng.hitEffects.length - 1; i >= 0; i--) {
        eng.hitEffects[i].timer -= simDt;
        if (eng.hitEffects[i].timer <= 0) eng.hitEffects.splice(i, 1);
      }
      for (let i = eng.shockwaves.length - 1; i >= 0; i--) {
        eng.shockwaves[i].timer -= simDt;
        if (eng.shockwaves[i].timer <= 0) eng.shockwaves.splice(i, 1);
      }
      for (let i = eng.hitErrorTicks.length - 1; i >= 0; i--) {
        eng.hitErrorTicks[i].age += simDt;
        if (eng.hitErrorTicks[i].age >= 1.8) eng.hitErrorTicks.splice(i, 1);
      }
      if (eng.hubStatusTimer > 0) {
        eng.hubStatusTimer = Math.max(0, eng.hubStatusTimer - simDt);
      }
      if (eng.shakeTime > 0) {
        eng.shakeTime = Math.max(0, eng.shakeTime - simDt);
        const prog = 1 - eng.shakeTime / 0.34;
        eng.shakeX = Math.sin(prog * Math.PI * 10) * eng.shakeAmplitude * Math.pow(1 - prog, 2);
        if (eng.shakeTime === 0) eng.shakeX = 0;
      }

      if (eng.overdriveActive) {
        eng.overdriveTimeLeft = Math.max(0, eng.overdriveTimeLeft - simDt);
        eng.overdriveCharge = (eng.overdriveTimeLeft / 10.0) * 100;
        if (eng.overdriveTimeLeft <= 0) {
          eng.overdriveActive = false;
          eng.overdriveCharge = 0;
          eng.overdriveTimeLeft = 0;
        }
      }

      eng.beatPulse = Math.max(0, eng.beatPulse - simDt * 4.5);
      const tRef = eng.songTime > 0 ? eng.songTime : nowPerfMs / 1000;
      const ledIdx = Math.floor(tRef / (60 / Math.max(60, song.bpm))) % 4;
      if (ledIdx !== eng.activeBeatLed) {
        eng.activeBeatLed = ledIdx;
        eng.beatPulse = 0.85;
        if (!eng.silentSeek) {
          setUiBeatLed(ledIdx);
          orbitEvents.emit('onBeat', { beatIndex: ledIdx, bpm: song.bpm, songId: song.id });
          if (ledIdx === 0 && eng.phase === 'PLAYING') {
            const th = getResolvedChassisTheme(p.theme, themesRef.current);
            eng.shockwaves.push({
              timer: 0.42,
              duration: 0.42,
              color: eng.overdriveActive ? th.bright : `rgba(${th.bgAccentRgb}, 0.72)`,
            });
            if (eng.shockwaves.length > 6) eng.shockwaves.shift();
          }
        }
      }

      if (eng.phase === 'TUTORIAL_CINEMATIC') {
        eng.cinematicTimer += simDt;
        const t = eng.cinematicTimer;
        if (t < 0.85) {
          const prog = t / 0.85;
          eng.dialSpinBoost = 12 * prog;
          eng.dialVisualAlpha = Math.max(0, 1 - prog);
        } else if (t < 2.0) {
          eng.dialVisualAlpha = 0;
        } else if (t < 2.65) {
          const prog = (t - 2.0) / 0.65;
          eng.dialSpinBoost = 6 * (1 - prog);
          eng.dialVisualAlpha = Math.min(1, prog);
        } else {
          eng.dialSpinBoost = 0;
          eng.dialVisualAlpha = 1;
        }

        const stripeActive = t >= 0.65 && t < 2.15;
        if (stripeActive !== lastTutorialStripeRef.current) {
          lastTutorialStripeRef.current = stripeActive;
          setShowTutorialCompleteStripe(stripeActive);
        }

        eng.spinnerAngle = wrapAngle(eng.spinnerAngle + (eng.angularSpeed + eng.dialSpinBoost) * simDt);
        if (t >= 2.75) {
          if (lastTutorialStripeRef.current) {
            lastTutorialStripeRef.current = false;
            setShowTutorialCompleteStripe(false);
          }
          eng.dialVisualAlpha = 1;
          eng.dialSpinBoost = 0;
          eng.phase = 'SUMMARY';
          setUiPhase('SUMMARY');
        }
        return;
      }

      if (eng.phase === 'PLAYING' && screenRef.current === 'PLAYING') {
        eng.songTime += simDt;

        // Deterministic Replay Theater auto-execution
        if (eng.replayMode && eng.replayData) {
          while (
            eng.replayEventIndex < eng.replayData.events.length &&
            eng.replayData.events[eng.replayEventIndex].songTime <= eng.songTime
          ) {
            const ev = eng.replayData.events[eng.replayEventIndex++];
            eng.spinnerAngle = ev.cbsAngle;
            const mName = WAVE_MODES.find((m) => m.id === ev.modeId)?.name || ev.modeId;
            eng.replayLastClickLabel = `${mName} · ${ev.tier || ev.action}`;
            if (ev.action === 'PRESS') {
              processTriggerPress(ev.cbsAngle, nowPerfMs, true);
            } else {
              processTriggerRelease(0, true);
            }
            if (eng.phase !== 'PLAYING') return;
          }
        }

        if (!eng.sandboxModeId && eng.songTime >= song.durationSec) {
          finalizeRunSummary(true);
          return;
        }

        if (eng.waitingForCue && !eng.sandboxModeId) {
          const upcoming = eng.beatmap[eng.beatmapIndex];
          if (!upcoming) {
            eng.breakRemainingSec = 0;
            finalizeRunSummary(true);
            return;
          }
          const rem = Math.max(0, upcoming.hitTime - eng.songTime);
          eng.breakRemainingSec = rem;
          if (rem > 2.0 && eng.hp < 100) {
            eng.hp = Math.min(100, eng.hp + simDt * (mods.includes('RG') ? 4.5 : 2.2));
            if (!eng.silentSeek) setUiHp(eng.hp);
          }
          if (rem <= 1.45) {
            eng.breakRemainingSec = 0;
            spawnNextWave(false, null);
          }
        }

        if (eng.activeLesson) {
          eng.activeLessonTimer -= simDt;
          if (eng.activeLessonTimer <= 0) {
            eng.activeLesson = null;
            if (!eng.silentSeek) setUiActiveLesson(null);
          }
        }

        if (
          eng.isTutorialRun &&
          !eng.tutorialGuideDisabled &&
          !eng.activeLesson &&
          eng.targets.length > 0
        ) {
          const nextLesson = TUTORIAL_LESSONS.find(
            (l) =>
              !eng.shownLessonIds.has(l.id) &&
              eng.waveIndex >= l.minWaveIndex &&
              (l.triggerMode === 'ANY' || l.triggerMode === eng.waveModeId),
          );
          if (nextLesson) {
            const t0 = eng.targets[0];
            const timeAhead = t0.targetHitTime ? t0.targetHitTime - eng.songTime : 0.8;
            if (timeAhead <= 1.6) {
              eng.shownLessonIds.add(nextLesson.id);
              eng.activeLesson = nextLesson;
              eng.activeLessonTimer = 3.8;
              if (!eng.silentSeek) {
                audioEngine.playLessonSlowCue(p.soundEnabled);
                setUiActiveLesson(nextLesson);
              }
            }
          }
        }

        eng.dialTimeScale = 1.0;
        eng.waveElapsed += simDt;

        if (eng.waveModeId === 'BRAKE_DRIFT') {
          const mod = 0.68 + 0.50 * Math.abs(Math.sin(eng.waveElapsed * 3.4));
          eng.angularSpeed = eng.baseAngularSpeed * mod;
        } else if (mods.includes('VD') && eng.songSection === 'DROP' && eng.waveModeId !== 'METEOR_SLASH') {
          const mod = 0.84 + 0.30 * Math.abs(Math.sin(eng.waveElapsed * 3.1));
          eng.angularSpeed = eng.baseAngularSpeed * mod;
        } else if (eng.waveModeId !== 'METEOR_SLASH') {
          eng.angularSpeed = eng.baseAngularSpeed;
        }

        // Update Hold Arcs, Fever Spinners & per-target stacked behaviors at 240Hz
        for (let i = eng.targets.length - 1; i >= 0; i--) {
          const t = eng.targets[i];
          const tMode = t.modeId || eng.waveModeId;
          if (t.isFeverSpinner) {
            t.feverRemainingSec = (t.feverRemainingSec || 1.2) - simDt;
            if ((t.feverRemainingSec || 0) <= 0) {
              if ((t.feverHits || 0) >= 2) {
                eng.targets.splice(i, 1);
                awardHitSuccess('GOOD', 0, 0, 'FEVER CHARGED', 0, tMode);
                eng.waveIndex += 1;
                spawnNextWave(false, eng.sandboxModeId);
              } else {
                triggerMiss('FEVER MISSED', t);
              }
              return;
            }
            continue;
          }

          if (t.isHold && t.isHolding) {
            t.holdElapsedSec = (t.holdElapsedSec || 0) + simDt;
            t.holdTravelledRad = (t.holdTravelledRad || 0) + eng.angularSpeed * simDt;
            const remRad = Math.max(0.18, t.holdRemainingRad ?? t.holdSpanRad ?? 0.85);
            const prog = t.holdTravelledRad / remRad;
            if (!eng.silentSeek) audioEngine.updateHoldShimmer(Math.min(1, prog));
            if (prog >= 1.08) {
              // Auto-complete cleanly right after the diamond release cap
              audioEngine.stopHoldShimmer();
              eng.targets.splice(i, 1);
              awardHitSuccess(
                mods.includes('GA') ? 'PERFECT' : 'GREAT',
                0.08,
                3,
                mods.includes('GA') ? 'RAIL LOCKED!' : 'HOLD COMPLETE',
                0,
                tMode,
              );
              if (eng.targets.length === 0) {
                eng.waveIndex += 1;
                spawnNextWave(false, eng.sandboxModeId);
              }
              return;
            }
            continue;
          }

          if (tMode === 'SPRING_BOUNCE') {
            t.angle = wrapAngle(t.baseAngle + Math.sin(eng.waveElapsed * 2.8) * 0.42);
          }
          if (tMode === 'DECAY_ARC') {
            t.halfWidth = Math.max(0.11, t.initialHalfWidth - eng.waveElapsed * 0.085);
          }
          if (tMode === 'GHOST_PULSE' || mods.includes('HD')) {
            const dist = Math.abs(signedAngleDiff(eng.spinnerAngle, t.angle));
            t.alpha = dist < 0.95 ? Math.max(0.12, (dist / 0.95) * 0.75) : 1.0;
          } else if (mods.includes('BF')) {
            const dist = Math.abs(signedAngleDiff(eng.spinnerAngle, t.angle));
            const strobe = 0.30 + 0.70 * Math.pow(Math.max(0, Math.cos(eng.beatPulse * Math.PI)), 1.5);
            t.alpha = dist < 0.75 ? Math.max(0.14, (dist / 0.75) * 0.65) : strobe;
          }
        }

        const multiHover = eng.targets.some(
          (t) =>
            (t.tapsLeft > 1 || t.lastTapAtMs !== undefined) &&
            Math.abs(signedAngleDiff(eng.spinnerAngle, t.angle)) <= t.halfWidth + NEEDLE_TOLERANCE,
        );
        const sweepRate = multiHover ? 0.32 : 1.0;
        eng.lastSweepRate = sweepRate;
        eng.spinnerAngle = wrapAngle(
          eng.spinnerAngle + eng.direction * eng.angularSpeed * sweepRate * simDt,
        );

        if (eng.portal) {
          if (
            !eng.portal.warped &&
            Math.abs(signedAngleDiff(eng.spinnerAngle, eng.portal.entryAngle)) <= eng.portal.halfWidth
          ) {
            eng.portal.warped = true;
            eng.portal.warpFlashTimer = 0.16;
            eng.spinnerAngle = eng.portal.exitAngle;
            eng.hitEffects.push({
              timer: 0.28,
              duration: 0.28,
              angle: eng.portal.exitAngle,
              isPerfect: false,
              label: 'WARP',
              color: '#e879f9',
            });
          }
        }

        const hasOnePassTarget = eng.targets.some(
          (t) => (t.modeId || eng.waveModeId) === 'ONE_PASS',
        );
        if (hasOnePassTarget || mods.includes('SD')) {
          const orderedTargets = eng.targets.filter(
            (t) => (t.modeId || eng.waveModeId) === 'ORDERED_SEQ',
          );
          const candidateTargets = eng.targets.filter((t) => {
            if (t.isHolding || t.isFeverSpinner) return false;
            const tm = t.modeId || eng.waveModeId;
            if (!mods.includes('SD') && tm !== 'ONE_PASS') return false;
            if (tm === 'ORDERED_SEQ' && orderedTargets.length > 0 && t.id !== orderedTargets[0].id) {
              return false;
            }
            return true;
          });
          for (let i = 0; i < candidateTargets.length; i++) {
            const t = candidateTargets[i];
            const overNow =
              Math.abs(signedAngleDiff(eng.spinnerAngle, t.angle)) <= t.halfWidth + NEEDLE_TOLERANCE;
            if (overNow) {
              t.enteredWindow = true;
            } else if (t.enteredWindow) {
              triggerMiss('OVERSHOT ONE-PASS', t, mods.includes('SD'));
              return;
            }
          }
        }
        if (!eng.sandboxModeId && eng.targets.length > 0) {
          const pendingExpire = eng.targets.filter((t) => !t.isHolding && !t.isFeverSpinner);
          if (pendingExpire.length > 0) {
            const lastExpire = Math.max(...pendingExpire.map((t) => t.expireTime ?? 999999));
            if (eng.songTime > lastExpire) {
              triggerMiss('BEAT MISSED', pendingExpire[0]);
              return;
            }
          }
        }
      }
    };

    stepSimulationRef.current = stepPhysics;

    const tick = (now: number) => {
      const frameDt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;
      const eng = engineRef.current;
      const p = profileRef.current;
      const song = getActiveSong(p);
      const { diffId, mods } = getRunConfig(eng, p, song);

      const isPausedSubmode =
        (eng.replayMode && eng.replayPaused) || (eng.practiceMode && eng.practicePaused);
      const activeRate = isPausedSubmode
        ? 0
        : eng.replayMode
        ? eng.replaySpeed
        : eng.practiceMode
        ? eng.practiceSpeed
        : 1.0;

      // Lock master audio clock cleanly at frame start (speed-synced in Practice / Replay)
      if (eng.phase === 'PLAYING' && screenRef.current === 'PLAYING' && !eng.sandboxModeId && activeRate > 0) {
        const audioClock = audioEngine.syncClockAtPerfTime(now);
        const offsetSec = p.audioOffsetMs / 1000;
        if (audioClock !== null) {
          const targetSongTime = Math.max(0, audioClock + offsetSec);
          const drift = targetSongTime - eng.songTime;
          // Snap immediately if >25ms drift, otherwise smooth phase-lock without jitter
          if (Math.abs(drift) > 0.025) {
            eng.songTime = targetSongTime;
          } else {
            eng.songTime += drift * 0.35;
          }
        }
      }

      if (!isPausedSubmode) {
        eng.physicsAccum = Math.min(0.08, eng.physicsAccum + frameDt * activeRate);
        while (eng.physicsAccum >= FIXED_DT) {
          stepPhysics(FIXED_DT, now, song, p);
          eng.physicsAccum -= FIXED_DT;
        }
        eng.lastPhysicsTimeMs = now - eng.physicsAccum * 1000;
      }

      // Compute Visual Anticipation Radar & Pre-Flip Chevron for the upcoming beatmap cue
      let nextCuePreview: NextCuePreview | null = null;
      if (eng.phase === 'PLAYING' && !eng.sandboxModeId && eng.beatmapIndex < eng.beatmap.length) {
        const upcoming = eng.beatmap[eng.beatmapIndex];
        const dtAhead = upcoming.hitTime - eng.songTime;
        if (dtAhead > 0.04 && dtAhead <= 1.25) {
          const nextDir: 1 | -1 =
            upcoming.modeId === 'CCW_RED'
              ? -1
              : upcoming.modeId === 'CW_GREEN'
              ? 1
              : eng.direction;
          const nextNomSpeed =
            computeNominalSpeed(diffId, mods, song.bpm, upcoming.modeId) * (upcoming.speedScale ?? 1);
          const travel = Math.max(0.52, Math.min(4.9, nextNomSpeed * dtAhead));
          const estAngle = wrapAngle(eng.spinnerAngle + nextDir * travel);
          const modeObj = WAVE_MODES.find((m) => m.id === upcoming.modeId);
          nextCuePreview = {
            angle: estAngle,
            color: modeObj?.color || '#38bdf8',
            timeUntilSpawn: dtAhead,
            modeId: upcoming.modeId,
            isDirectionFlip: nextDir !== eng.direction,
            nextDir,
          };
        }
      }
      eng.nextCuePreview = nextCuePreview;

      if (eng.phase === 'PLAYING' && screenRef.current === 'PLAYING' && now - lastHudSync > 110) {
        lastHudSync = now;
        setUiSongTime(eng.songTime);
        setUiOverdriveCharge(eng.overdriveCharge);
        setUiOverdriveActive(eng.overdriveActive);
        setUiOverdriveTimeLeft(eng.overdriveTimeLeft);
        setUiOverdrivePerfectsEarned(eng.overdrivePerfectsEarned);
        setUiOverdriveTargetPerfects(eng.overdriveTargetPerfects);
        setUiOverdriveUsed(eng.overdriveUsedThisRun);
        if (eng.replayMode) {
          setUiReplayLastClickLabel(eng.replayLastClickLabel);
        }
        const sec = getSectionAtProgress(song, eng.songTime / Math.max(1, song.durationSec));
        if (sec !== eng.songSection) {
          eng.songSection = sec;
          setUiSection(sec);
        }
      }

      const cs = canvasStateRef.current;
      cs.phase = eng.phase;
      cs.spinnerAngle = eng.spinnerAngle;
      cs.direction = eng.direction;
      cs.angularSpeed = eng.angularSpeed;
      cs.waveModeId = eng.waveModeId;
      cs.targets = eng.targets;
      cs.hazards = eng.hazards;
      cs.portal = eng.portal;
      cs.hitEffects = eng.hitEffects;
      cs.hitErrorTicks = eng.hitErrorTicks;
      cs.hubStatusText = eng.hubStatusText;
      cs.hubStatusColor = eng.hubStatusColor;
      cs.hubStatusTimer = eng.hubStatusTimer;
      cs.shakeX = eng.shakeX;
      cs.missDegrees = eng.missDegrees;
      cs.missNearestEdge = eng.missNearestEdge;
      cs.missSignedSpan = eng.missSignedSpan;
      cs.missReasonText = eng.missReason;
      cs.dialVisualAlpha = eng.dialVisualAlpha;
      cs.bassEnergy = p.bgFxMode === 'dynamic' ? audioEngine.getBassEnergy() : 0;
      if (p.bgFxMode === 'dynamic') {
        audioEngine.getSpectrumBins(cs.spectrumBins);
      } else {
        cs.spectrumBins.fill(0);
      }
      cs.beatPulse = eng.beatPulse;
      cs.streak = eng.streak;
      cs.songProgressRatio = eng.songTime / Math.max(1, song.durationSec);
      cs.songSections = song.sections;
      cs.songSection = eng.songSection;
      cs.songTime = eng.songTime;
      cs.lessonSlowActive = eng.lessonSlowActive;
      cs.activeLesson = eng.activeLesson;
      cs.flashlightActive = mods.includes('FL');
      cs.rxModActive = mods.includes('RX');
      cs.waitingForCue = eng.waitingForCue;
      cs.breakRemainingSec = eng.breakRemainingSec;
      cs.overdriveCharge = eng.overdriveCharge;
      cs.overdriveActive = eng.overdriveActive;
      cs.overdriveTimeLeft = eng.overdriveTimeLeft;
      cs.overdrivePerfectsEarned = eng.overdrivePerfectsEarned;
      cs.overdriveTargetPerfects = eng.overdriveTargetPerfects;
      cs.overdriveUsedThisRun = eng.overdriveUsedThisRun;
      cs.overdriveVfxMode = p.overdriveVfxMode || 'full';
      cs.nextCuePreview = nextCuePreview;
      cs.shockwaves = eng.shockwaves;
      cs.isPracticeMode = eng.practiceMode;
      cs.isReplayMode = eng.replayMode;

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [
    awardHitSuccess,
    computeNominalSpeed,
    finalizeRunSummary,
    getActiveSong,
    getRunConfig,
    processTriggerPress,
    processTriggerRelease,
    spawnNextWave,
    triggerMiss,
  ]);

  // Overlay & Screen Navigation Management
  const openPause = useCallback(
    (tab: PauseTabId = 'main') => {
      flushRunProfileDeltas();
      audioEngine.stopHoldShimmer();
      setModsOpen(false);
      if (!pauseOpenRef.current) {
        phaseBeforeOverlayRef.current =
          screenRef.current === 'PLAYING' ? engineRef.current.phase : 'IDLE';
        if (screenRef.current === 'PLAYING' && engineRef.current.phase === 'PLAYING') {
          engineRef.current.phase = 'PAUSED';
          setUiPhase('PAUSED');
          audioEngine.stop();
        }
      }
      setPauseTab(tab);
      setPauseOpen(true);
    },
    [flushRunProfileDeltas],
  );

  const closePause = useCallback(
    (startSelectedSong = false) => {
      setListeningSlot(0);
      setPauseOpen(false);
      if (startSelectedSong) {
        setScreen('PLAYING');
        resetRound(true, null);
        return;
      }
      if (screenRef.current === 'PLAYING' && phaseBeforeOverlayRef.current === 'PLAYING') {
        const eng = engineRef.current;
        const p = profileRef.current;
        const song = getActiveSong(p);
        const rate = eng.replayMode ? eng.replaySpeed : eng.practiceMode ? eng.practiceSpeed : 1.0;
        eng.phase = 'PLAYING';
        setUiPhase('PLAYING');
        if (!(eng.replayMode && eng.replayPaused) && !(eng.practiceMode && eng.practicePaused)) {
          audioEngine.startAtOffset(
            song,
            eng.songTime,
            p.musicEnabled,
            p.musicVolume,
            p.soundEnabled,
            p.sfxVolume,
            Boolean(eng.sandboxModeId),
            1.0,
            rate,
          );
        }
      }
    },
    [getActiveSong, resetRound],
  );

  const openMods = useCallback(() => {
    flushRunProfileDeltas();
    audioEngine.stopHoldShimmer();
    setPauseOpen(false);
    if (!modsOpenRef.current) {
      phaseBeforeOverlayRef.current =
        screenRef.current === 'PLAYING' ? engineRef.current.phase : 'IDLE';
      if (screenRef.current === 'PLAYING' && engineRef.current.phase === 'PLAYING') {
        engineRef.current.phase = 'PAUSED';
        setUiPhase('PAUSED');
        audioEngine.stop();
      }
    }
    setModsOpen(true);
  }, [flushRunProfileDeltas]);

  const closeMods = useCallback(() => {
    setModsOpen(false);
    if (screenRef.current === 'PLAYING' && phaseBeforeOverlayRef.current === 'PLAYING') {
      const eng = engineRef.current;
      const p = profileRef.current;
      const song = getActiveSong(p);
      const rate = eng.replayMode ? eng.replaySpeed : eng.practiceMode ? eng.practiceSpeed : 1.0;
      eng.phase = 'PLAYING';
      setUiPhase('PLAYING');
      if (!(eng.replayMode && eng.replayPaused) && !(eng.practiceMode && eng.practicePaused)) {
        audioEngine.startAtOffset(
          song,
          eng.songTime,
          p.musicEnabled,
          p.musicVolume,
          p.soundEnabled,
          p.sfxVolume,
          Boolean(eng.sandboxModeId),
          1.0,
          rate,
        );
      }
    }
  }, [getActiveSong]);

  const openShopScreen = useCallback(() => {
    flushRunProfileDeltas();
    audioEngine.stopHoldShimmer();
    setPauseOpen(false);
    setModsOpen(false);
    if (screenRef.current === 'PLAYING' && engineRef.current.phase === 'PLAYING') {
      engineRef.current.phase = 'PAUSED';
      setUiPhase('PAUSED');
      audioEngine.stop();
    }
    if (screenRef.current !== 'SHOP') {
      setPreviousScreen(screenRef.current);
      setScreen('SHOP');
    }
  }, [flushRunProfileDeltas]);

  const exitSubScreen = useCallback(() => {
    const dest =
      previousScreen === 'SONG_SELECT' || previousScreen === 'PLAYING'
        ? previousScreen
        : 'TITLE';
    setScreen(dest);
  }, [previousScreen]);

  // Global Keyboard Shortcuts (Press + Release for Hold Arc!)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (listeningSlot > 0) {
        e.preventDefault();
        e.stopPropagation();
        if (e.code !== 'Escape') {
          const label = formatKeyLabel(e);
          updateProfile((prev) =>
            listeningSlot === 1
              ? { ...prev, trigger1Code: e.code, trigger1Label: label }
              : { ...prev, trigger2Code: e.code, trigger2Label: label },
          );
          audioEngine.playHit(
            profileRef.current.soundEnabled,
            profileRef.current.hitSfxMode,
            1,
            true,
            getActiveSong().scaleNotes,
          );
        }
        setListeningSlot(0);
        return;
      }

      if (e.code === 'Escape') {
        e.preventDefault();
        if (modsOpenRef.current) closeMods();
        else if (pauseOpenRef.current) closePause(false);
        else if (screenRef.current === 'PLAYING') openPause('main');
        else if (
          screenRef.current === 'SETTINGS' ||
          screenRef.current === 'INDEX' ||
          screenRef.current === 'SHOP'
        ) {
          exitSubScreen();
        } else if (screenRef.current === 'SONG_SELECT') {
          setScreen('TITLE');
        }
        return;
      }

      if (pauseOpenRef.current || modsOpenRef.current) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (screenRef.current !== 'PLAYING') return;

      const p = profileRef.current;
      const eng = engineRef.current;
      if (e.code === 'KeyR' && p.trigger1Code !== 'KeyR' && p.trigger2Code !== 'KeyR') {
        e.preventDefault();
        if (eng.replayMode && eng.replayData) {
          seekReplayToTime(0);
        } else {
          resetRound(true, eng.sandboxModeId);
        }
        return;
      }

      if (eng.practiceMode && !eng.replayMode) {
        if (e.code === 'KeyZ' && p.trigger1Code !== 'KeyZ' && p.trigger2Code !== 'KeyZ') {
          e.preventDefault();
          dropPracticeCheckpoint();
          return;
        }
        if (e.code === 'KeyX' && p.trigger1Code !== 'KeyX' && p.trigger2Code !== 'KeyX') {
          e.preventDefault();
          removePracticeCheckpoint();
          return;
        }
        if (e.code === 'KeyC' && p.trigger1Code !== 'KeyC' && p.trigger2Code !== 'KeyC') {
          e.preventDefault();
          respawnPracticeCheckpoint();
          return;
        }
      }

      if (e.code === p.trigger1Code || e.code === p.trigger2Code) {
        e.preventDefault();
        handleTriggerPress(e.timeStamp);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (screenRef.current !== 'PLAYING') return;
      const p = profileRef.current;
      if (e.code === p.trigger1Code || e.code === p.trigger2Code) {
        handleTriggerRelease(e.timeStamp);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [
    closeMods,
    closePause,
    dropPracticeCheckpoint,
    exitSubScreen,
    getActiveSong,
    handleTriggerPress,
    handleTriggerRelease,
    listeningSlot,
    openPause,
    removePracticeCheckpoint,
    resetRound,
    respawnPracticeCheckpoint,
    seekReplayToTime,
    updateProfile,
  ]);

  // Navigation & Unlocks
  const launchWithWarp = useCallback(
    (song: SongDefinition, diffId: DifficultyId) => {
      warpTimersRef.current.forEach((id) => window.clearTimeout(id));
      warpTimersRef.current = [];
      audioEngine.playUiLaunch(profileRef.current.soundEnabled);
      const effectiveLabel = song.chillOnly ? 'CHILL' : song.demonOnly ? 'DEMON' : diffId;
      setWarpLaunchLabel(`${song.title} · ${effectiveLabel}`);
      const t1 = window.setTimeout(() => {
        setScreen('PLAYING');
        resetRound(true, null);
      }, 240);
      const t2 = window.setTimeout(() => {
        setWarpLaunchLabel(null);
      }, 480);
      warpTimersRef.current.push(t1, t2);
    },
    [resetRound],
  );

  const previewSong = useCallback(
    (songId: string, withAudioPreview = true) => {
      if (withAudioPreview) audioEngine.unlock();
      const p = profileRef.current;
      const song = songsRef.current.find((s) => s.id === songId) || songsRef.current[0];
      const nextDiff = song.chillOnly ? 'CHILL' : song.demonOnly ? 'DEMON' : p.selectedDifficulty;
      updateProfile({ selectedSongId: song.id, selectedDifficulty: nextDiff });
      orbitEvents.emit('onTrackChange', { songId: song.id, title: song.title, difficulty: nextDiff });
      if (withAudioPreview && p.musicEnabled) {
        const previewOffset = Math.min(Math.max(12, song.durationSec * 0.28), Math.max(0, song.durationSec - 15));
        audioEngine.startAtOffset(
          song,
          previewOffset,
          true,
          p.musicVolume,
          p.soundEnabled,
          p.sfxVolume,
          true,
          0.72,
        );
      }
    },
    [updateProfile],
  );

  const enterSongSelect = useCallback(() => {
    flushRunProfileDeltas();
    audioEngine.stopHoldShimmer();
    setPauseOpen(false);
    setModsOpen(false);
    setSummaryData(null);
    setScreen('SONG_SELECT');
    const active = getActiveSong();
    if (profileRef.current.musicEnabled) {
      previewSong(active.id, true);
    }
  }, [flushRunProfileDeltas, getActiveSong, previewSong]);

  const handleEngineSwitchScreen = useCallback(
    (nextScreen: ScreenView) => {
      if (nextScreen === 'SONG_SELECT') {
        enterSongSelect();
        return;
      }
      if (nextScreen !== 'PLAYING') {
        audioEngine.stopHoldShimmer();
        setPauseOpen(false);
        setModsOpen(false);
        setSummaryData(null);
      }
      setScreen(nextScreen);
      if (nextScreen === 'PLAYING' && engineRef.current.phase !== 'PLAYING') {
        resetRound(false, null);
      }
    },
    [enterSongSelect, resetRound],
  );

  const handlePlayPrimary = useCallback(() => {
    hasUnlockedAudioRef.current = true;
    audioEngine.unlock();
    const p = profileRef.current;
    if (!p.tutorialSongCompleted) {
      const tutSong = songsRef.current.find((s) => s.id === 'moments_passing') || songsRef.current[0];
      updateProfile({ selectedSongId: tutSong.id, selectedDifficulty: 'CHILL' });
      launchWithWarp(tutSong, 'CHILL');
      return;
    }
    const active = getActiveSong(p);
    launchWithWarp(active, getEffectiveDifficulty(p, active));
  }, [getActiveSong, getEffectiveDifficulty, launchWithWarp, updateProfile]);

  const handleUnlockDifficulty = useCallback(
    (diffId: DifficultyId, cost: number) => {
      updateProfile((prev) => {
        if (prev.unlockedDiffs.includes(diffId)) return { ...prev, selectedDifficulty: diffId };
        if (!prev.devUnlocked && prev.orbs < cost) return prev;
        return {
          ...prev,
          orbs: prev.devUnlocked ? prev.orbs : prev.orbs - cost,
          unlockedDiffs: [...prev.unlockedDiffs, diffId],
          selectedDifficulty: diffId,
        };
      });
    },
    [updateProfile],
  );

  const handleUnlockSong = useCallback(
    (songId: string, cost: number) => {
      updateProfile((prev) => {
        if (prev.unlockedSongs.includes(songId)) return { ...prev, selectedSongId: songId };
        if (!prev.devUnlocked && prev.orbs < cost) return prev;
        return {
          ...prev,
          orbs: prev.devUnlocked ? prev.orbs : prev.orbs - cost,
          unlockedSongs: [...prev.unlockedSongs, songId],
          selectedSongId: songId,
        };
      });
    },
    [updateProfile],
  );

  const handleUnlockTheme = useCallback(
    (themeId: ThemeId, cost: number) => {
      updateProfile((prev) => {
        if (prev.unlockedThemes.includes(themeId)) return { ...prev, theme: themeId };
        if (!prev.devUnlocked && prev.orbs < cost) return prev;
        return {
          ...prev,
          orbs: prev.devUnlocked ? prev.orbs : prev.orbs - cost,
          unlockedThemes: [...prev.unlockedThemes, themeId],
          theme: themeId,
        };
      });
    },
    [updateProfile],
  );

  const handleUnlockMod = useCallback(
    (code: ModCode, cost: number) => {
      updateProfile((prev) => {
        if (prev.purchasedMods.includes(code)) return prev;
        if (!prev.devUnlocked && prev.orbs < cost) return prev;
        return {
          ...prev,
          orbs: prev.devUnlocked ? prev.orbs : prev.orbs - cost,
          purchasedMods: [...prev.purchasedMods, code],
          equippedMods:
            prev.equippedMods.length < 3 && !prev.equippedMods.includes(code)
              ? [...prev.equippedMods, code]
              : prev.equippedMods,
        };
      });
    },
    [updateProfile],
  );

  const handleToggleMod = useCallback(
    (code: ModCode) => {
      updateProfile((prev) => {
        const mod = MOD_CATALOG.find((m) => m.code === code);
        if (!mod) return prev;
        if (!prev.devUnlocked && mod.orbCost > 0 && !prev.purchasedMods.includes(code)) return prev;
        if (!prev.devUnlocked && prev.totalHits < mod.unlockHits) return prev;

        const cur = prev.equippedMods;
        const next = cur.includes(code)
          ? cur.filter((c) => c !== code)
          : cur.length < 3
          ? [...cur, code]
          : cur;
        return { ...prev, equippedMods: next };
      });
    },
    [updateProfile],
  );

  const handleUploadCustomAudio = useCallback(
    async (file: File, ngIdTag: string) => {
      setCustomAudioStatus(`Decoding ${file.name}...`);
      const customId = `custom_${Date.now()}`;
      const decoded = await audioEngine.decodeCustomFile(customId, file);
      if (!decoded) {
        setCustomAudioStatus('Could not decode audio file.');
        return;
      }
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim();
      const newSong: SongDefinition = {
        id: customId,
        num: String(songsRef.current.length).padStart(2, '0'),
        newgroundsId: ngIdTag || 'CUSTOM',
        artist: 'Imported Audio',
        title: cleanName || 'Custom Track',
        genre: 'Custom MP3',
        category: 'custom',
        bpm: decoded.estimatedBpm,
        keySig: 'AUTO',
        scaleNotes: [60, 62, 64, 67, 69, 72],
        durationSec: decoded.durationSec,
        audioUrl: '',
        bgImageUrl: HERO_DISCO_IMAGE,
        orbCost: 0,
        chillOnly: false,
        isCustom: true,
        customOnsets: decoded.onsets,
        stars: { CHILL: '1.5★', NORMAL: '3.0★', HARD: '4.5★', INSANE: '6.0★', DEMON: '7.5★' },
        desc: `Imported local track (${decoded.estimatedBpm} BPM · ${decoded.onsets.length} detected beats).`,
        sections: [
          { startPct: 0, label: 'INTRO' },
          { startPct: 0.25, label: 'DROP' },
          { startPct: 0.6, label: 'BREAKDOWN' },
          { startPct: 0.85, label: 'OUTRO' },
        ],
      };
      setBaseSongs((prev) => [...prev, newSong]);
      updateProfile((prev) => ({
        ...prev,
        selectedSongId: customId,
        unlockedSongs: [...prev.unlockedSongs, customId],
      }));
      setCustomAudioStatus(`Loaded "${newSong.title}" (${decoded.estimatedBpm} BPM).`);
    },
    [updateProfile],
  );

  // Axiom Dev Studio Handlers + Undo/Redo History
  const commitStudioDrafts = useCallback(
    (updater: (prev: LocalStudioDraftBundle) => LocalStudioDraftBundle, coalesceMs = 0) => {
      const prev = studioDraftsRef.current;
      const next = updater(prev);
      if (next === prev) return;
      const nowMs = Date.now();
      const shouldCoalesce =
        coalesceMs > 0 &&
        draftHistoryPastRef.current.length > 0 &&
        nowMs - lastHistoryPushMsRef.current < coalesceMs;
      if (!shouldCoalesce) {
        draftHistoryPastRef.current = [...draftHistoryPastRef.current.slice(-39), prev];
        lastHistoryPushMsRef.current = nowMs;
      }
      draftHistoryFutureRef.current = [];
      setHistoryCounts({
        past: draftHistoryPastRef.current.length,
        future: 0,
      });
      setStudioDrafts(next);
    },
    [],
  );

  const handleUndoDraft = useCallback(() => {
    if (draftHistoryPastRef.current.length === 0) return;
    const past = draftHistoryPastRef.current;
    const previous = past[past.length - 1];
    draftHistoryPastRef.current = past.slice(0, -1);
    draftHistoryFutureRef.current = [
      ...draftHistoryFutureRef.current.slice(-39),
      studioDraftsRef.current,
    ];
    lastHistoryPushMsRef.current = 0;
    setHistoryCounts({
      past: draftHistoryPastRef.current.length,
      future: draftHistoryFutureRef.current.length,
    });
    setStudioDrafts(previous);
  }, []);

  const handleRedoDraft = useCallback(() => {
    if (draftHistoryFutureRef.current.length === 0) return;
    const future = draftHistoryFutureRef.current;
    const next = future[future.length - 1];
    draftHistoryFutureRef.current = future.slice(0, -1);
    draftHistoryPastRef.current = [
      ...draftHistoryPastRef.current.slice(-39),
      studioDraftsRef.current,
    ];
    lastHistoryPushMsRef.current = 0;
    setHistoryCounts({
      past: draftHistoryPastRef.current.length,
      future: draftHistoryFutureRef.current.length,
    });
    setStudioDrafts(next);
  }, []);

  useEffect(() => {
    if (!isDeveloper || !devStudioOpen) return;
    const onUndoRedoKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || targetTag === 'SELECT') return;
      if ((e.metaKey || e.ctrlKey) && e.code === 'KeyZ') {
        e.preventDefault();
        if (e.shiftKey) handleRedoDraft();
        else handleUndoDraft();
      } else if ((e.metaKey || e.ctrlKey) && e.code === 'KeyY') {
        e.preventDefault();
        handleRedoDraft();
      }
    };
    window.addEventListener('keydown', onUndoRedoKeyDown);
    return () => window.removeEventListener('keydown', onUndoRedoKeyDown);
  }, [devStudioOpen, handleRedoDraft, handleUndoDraft, isDeveloper]);

  const handleSaveThemeDraft = useCallback(
    (theme: EditableThemePayload) => {
      commitStudioDrafts(
        (prev) => ({
          ...prev,
          draftThemes: {
            ...prev.draftThemes,
            [theme.id]: { ...theme, status: 'draft' },
          },
        }),
        400,
      );
    },
    [commitStudioDrafts],
  );

  const handleResetBuiltInTheme = useCallback(
    (id: ThemeId) => {
      const base = buildEditableThemeFromBuiltIn(id);
      commitStudioDrafts((prev) => ({
        ...prev,
        draftThemes: {
          ...prev.draftThemes,
          [id]: { ...base, status: 'draft' },
        },
      }));
    },
    [commitStudioDrafts],
  );

  const handleSaveSongDraft = useCallback(
    (song: SongDefinition) => {
      audioEngine.clearBufferedSong(song.id);
      commitStudioDrafts(
        (prev) => ({
          ...prev,
          draftSongs: {
            ...prev.draftSongs,
            [song.id]: { ...song, status: 'draft' },
          },
        }),
        400,
      );
    },
    [commitStudioDrafts],
  );

  const handlePlaytestSong = useCallback(
    (song: SongDefinition, startOffsetSec = 0) => {
      commitStudioDrafts((prev) => ({
        ...prev,
        draftSongs: {
          ...prev.draftSongs,
          [song.id]: { ...song, status: 'draft' },
        },
      }));
      updateProfile((prev) => ({
        ...prev,
        selectedSongId: song.id,
        unlockedSongs: prev.unlockedSongs.includes(song.id)
          ? prev.unlockedSongs
          : [...prev.unlockedSongs, song.id],
      }));
      setScreen('PLAYING');
      window.setTimeout(() => {
        resetRound(
          true,
          null,
          startOffsetSec > 0
            ? { practice: true, practiceStartSec: startOffsetSec, practiceSpeed: 1.0 }
            : undefined,
        );
      }, 30);
    },
    [commitStudioDrafts, resetRound, updateProfile],
  );

  const handleUpdateHudLayout = useCallback(
    (next: PublishedHudLayout) => {
      commitStudioDrafts(
        (prev) => ({
          ...prev,
          draftHudLayout: { ...next, status: 'draft' },
        }),
        450,
      );
    },
    [commitStudioDrafts],
  );

  const handleSafeResetLayout = useCallback(() => {
    setHudEditModeActive(false);
    setSelectedHudWidgetId(null);
    setSelectedDecorId(null);
    commitStudioDrafts((prev) => ({
      ...prev,
      draftHudLayout: { ...DEFAULT_HUD_LAYOUT, status: 'draft' },
    }));
  }, [commitStudioDrafts]);

  const handleUpsertAsset = useCallback(
    (asset: DevAssetItem) => {
      commitStudioDrafts((prev) => ({
        ...prev,
        draftAssets: {
          ...prev.draftAssets,
          [asset.id]: { ...asset, status: 'draft' },
        },
      }));
    },
    [commitStudioDrafts],
  );

  const handleDeleteAsset = useCallback(
    (assetId: string) => {
      commitStudioDrafts((prev) => {
        const nextAssets = { ...prev.draftAssets };
        delete nextAssets[assetId];
        return { ...prev, draftAssets: nextAssets };
      });
      if (isDeveloper && publishedCatalog.assets.some((a) => a.id === assetId)) {
        void deletePublishedDevAssetFromCloud(assetId).then(() => {
          setPublishedCatalog((prev) => ({
            ...prev,
            assets: prev.assets.filter((a) => a.id !== assetId),
          }));
        });
      }
    },
    [commitStudioDrafts, isDeveloper, publishedCatalog.assets],
  );

  const handlePublishAllCloud = useCallback(async (): Promise<string> => {
    if (!firebaseUser || !isDeveloper) {
      throw new Error('Verified developer Google account required.');
    }
    let count = 0;
    let skippedAssets = 0;

    for (const song of Object.values(studioDrafts.draftSongs)) {
      await publishSongToCloud(firebaseUser, song, 'published');
      count++;
    }
    for (const theme of Object.values(studioDrafts.draftThemes)) {
      await publishThemeToCloud(firebaseUser, theme, 'published');
      count++;
    }
    if (studioDrafts.draftHudLayout) {
      await publishHudLayoutToCloud(firebaseUser, studioDrafts.draftHudLayout, 'published');
      count++;
    }
    for (const asset of Object.values(studioDrafts.draftAssets)) {
      if (asset.dataUrlOrPath.length > 280000) {
        skippedAssets++;
        continue;
      }
      await publishDevAssetToCloud(firebaseUser, asset, 'published');
      count++;
    }

    const refreshed = await fetchLivePublishedCatalog(firebaseUser);
    setPublishedCatalog(refreshed);
    clearStudioDrafts();
    draftHistoryPastRef.current = [];
    draftHistoryFutureRef.current = [];
    setHistoryCounts({ past: 0, future: 0 });
    setStudioDrafts({ draftSongs: {}, draftThemes: {}, draftHudLayout: null, draftAssets: {} });

    return skippedAssets > 0
      ? `Published ${count} item(s) live to Firestore (${skippedAssets} large asset(s) kept for GitHub push).`
      : `Published ${count} item(s) live to Firestore!`;
  }, [firebaseUser, isDeveloper, studioDrafts]);

  const handleDiscardDrafts = useCallback(() => {
    clearStudioDrafts();
    commitStudioDrafts(() => ({
      draftSongs: {},
      draftThemes: {},
      draftHudLayout: null,
      draftAssets: {},
    }));
  }, [commitStudioDrafts]);

  const handleUpdateWidgetOffsetFromOverlay = useCallback(
    (widgetId: string, xOffsetPx: number, yOffsetPx: number) => {
      const cur = mergedHudLayout;
      const existing = cur.widgets[widgetId] || {
        widgetId,
        xOffsetPx: 0,
        yOffsetPx: 0,
        scale: 1,
        opacity: 1,
        visible: true,
      };
      handleUpdateHudLayout({
        ...cur,
        widgets: {
          ...cur.widgets,
          [widgetId]: { ...existing, xOffsetPx, yOffsetPx },
        },
      });
    },
    [handleUpdateHudLayout, mergedHudLayout],
  );

  const handleUpdateDecorFromOverlay = useCallback(
    (decorId: string, patch: Partial<CustomDecorWidget>) => {
      const cur = mergedHudLayout;
      handleUpdateHudLayout({
        ...cur,
        customDecorWidgets: (cur.customDecorWidgets || []).map((d) =>
          d.id === decorId ? { ...d, ...patch } : d,
        ),
      });
    },
    [handleUpdateHudLayout, mergedHudLayout],
  );

  const handleUpdateDecorPosFromOverlay = useCallback(
    (decorId: string, xPct: number, yPct: number) => {
      handleUpdateDecorFromOverlay(decorId, { xPct, yPct });
    },
    [handleUpdateDecorFromOverlay],
  );

  const handlePlaceDecorFromAsset = useCallback(
    (asset: DevAssetItem) => {
      const newId = `decor_${Date.now().toString().slice(-6)}`;
      const item: CustomDecorWidget = {
        id: newId,
        screen: screenRef.current || 'ALL',
        themeId: profileRef.current.theme,
        zLayer: 'foreground',
        kind: 'image',
        imageUrl: asset.dataUrlOrPath,
        text: asset.name,
        xPct: 50,
        yPct: 45,
        widthPx: 180,
        heightPx: 180,
        scale: 1,
        flipX: false,
        locked: false,
        opacity: 1,
        rotationDeg: 0,
        blendMode: 'normal',
      };
      const cur = mergedHudLayout;
      commitStudioDrafts(() => ({
        ...studioDraftsRef.current,
        draftHudLayout: {
          ...cur,
          status: 'draft',
          customDecorWidgets: [...(cur.customDecorWidgets || []), item],
        },
      }));
      setSelectedDecorId(newId);
      setDevActiveTab('layout');
      setHudEditModeActive(true);
    },
    [commitStudioDrafts, mergedHudLayout],
  );

  const activeSong = getActiveSong();
  const activeDifficulty = getEffectiveDifficulty(profile, activeSong);
  const effectivePlayDifficulty =
    uiReplayMode && engineRef.current.replayData
      ? engineRef.current.replayData.difficulty
      : activeDifficulty;
  const effectivePlayMods =
    uiReplayMode && engineRef.current.replayData
      ? engineRef.current.replayData.equippedMods
      : profile.equippedMods;
  const activeTheme = getResolvedChassisTheme(profile.theme, mergedThemes);
  const activeBgSetting = profile.levelBgSettings[activeSong.id];
  const activeModeInfo = useMemo(
    () => WAVE_MODES.find((m) => m.id === uiWaveMode) || WAVE_MODES[0],
    [uiWaveMode],
  );

  const songSelectReplay = useMemo(
    () =>
      getBestReplayFor(activeSong.id, activeDifficulty) ||
      getLatestReplayForSong(activeSong.id),
    [activeDifficulty, activeSong.id, screen, summaryData],
  );

  const summaryReplay = useMemo(() => {
    if (!summaryData) return null;
    if (summaryData.replayId) {
      return getReplayById(summaryData.replayId) || getLatestReplayForSong(summaryData.songId);
    }
    return getLatestReplayForSong(summaryData.songId);
  }, [summaryData]);

  const streakMult = getStreakMultiplier(uiStreak);
  const totalMult = computeTotalMultiplier(
    effectivePlayDifficulty,
    effectivePlayMods,
    uiStreak,
  );
  const songProgressPct = (uiSongTime / Math.max(1, activeSong.durationSec)) * 100;
  const songTimerText = `${formatTimeSec(uiSongTime)} / ${formatTimeSec(activeSong.durationSec)}`;

  const promptHint = uiReplayMode
    ? `Replay Theater (${uiReplaySpeed}×) — Use scrubber below to inspect hits & CBS angles`
    : uiPracticeMode
    ? `Practice Mode (${uiPracticeSpeed}×) — Z Drop CP · X Remove CP · C Respawn`
    : uiSandboxMode
    ? `Practice Mode (${activeModeInfo.name}) — Press ${profile.trigger1Label} or click ring to start`
    : `Press ${profile.trigger1Label}, ${profile.trigger2Label}, or click ring to launch`;

  return (
    <StudioLayoutProvider
      value={{
        widgets: mergedHudLayout.widgets,
        customDecorWidgets: mergedHudLayout.customDecorWidgets || [],
        activeThemeId: profile.theme,
        editModeActive: isDeveloper && hudEditModeActive,
        selectedWidgetId: selectedHudWidgetId,
        selectedDecorId,
        onSelectWidget: setSelectedHudWidgetId,
        onSelectDecor: setSelectedDecorId,
        onUpdateWidgetOffset: handleUpdateWidgetOffsetFromOverlay,
        onUpdateDecorPos: handleUpdateDecorPosFromOverlay,
        onUpdateDecor: handleUpdateDecorFromOverlay,
        themesMap: mergedThemes,
      }}
    >
    <div className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#07080d] text-[#f5f7fa]">
      <BackgroundBackdrop
        defaultImageUrl={screen === 'TITLE' ? activeSong.bgImageUrl || HERO_DISCO_IMAGE : activeSong.bgImageUrl}
        levelSetting={activeBgSetting}
        bgFxMode={profile.bgFxMode}
        forceDimPct={screen === 'TITLE' ? 58 : undefined}
        forceBlurPx={screen === 'TITLE' ? 2 : undefined}
        accentRgb={activeTheme.bgAccentRgb}
        themeId={profile.theme}
        preferSkinBackdrop={screen !== 'PLAYING'}
      />

      <SkinAtmosphere
        themeId={profile.theme}
        bgFxMode={profile.bgFxMode}
        dimDuringPlay={screen === 'PLAYING'}
      />

      <CustomDecorLayer screen={screen} activeThemeId={profile.theme} />

      {screen === 'TITLE' && (
        <TitleScreen
          profile={profile}
          activeSong={activeSong}
          songs={songs}
          isDeveloper={isDeveloper}
          onPlayPrimary={handlePlayPrimary}
          onEnterSongSelect={enterSongSelect}
          onOpenOrbVault={() => {
            setPreviousScreen('TITLE');
            setScreen('SHOP');
          }}
          onOpenSettings={() => {
            setPreviousScreen('TITLE');
            setScreen('SETTINGS');
          }}
          onOpenIndex={() => {
            setPreviousScreen('TITLE');
            setScreen('INDEX');
          }}
          onOpenDevStudio={() => setDevStudioOpen(true)}
          onToggleMusic={() => {
            hasUnlockedAudioRef.current = true;
            audioEngine.unlock();
            const next = !profile.musicEnabled;
            updateProfile({ musicEnabled: next });
            audioEngine.updateVolumes(next, profile.musicVolume, profile.soundEnabled, profile.sfxVolume);
            if (!next) audioEngine.stop();
          }}
          onHoverTick={() => audioEngine.playUiTick(profile.soundEnabled)}
        />
      )}

      {screen === 'SETTINGS' && (
        <SettingsScreen
          profile={profile}
          listeningSlot={listeningSlot}
          authUser={authUser}
          authLoading={authLoading}
          authError={authError}
          isDeveloper={isDeveloper}
          onGoogleSignIn={handleGoogleSignIn}
          onGoogleRedirectSignIn={handleGoogleRedirectSignIn}
          onGoogleSignOut={handleGoogleSignOut}
          onToggleDevUnlock={handleToggleDevUnlock}
          onOpenDevStudio={() => setDevStudioOpen(true)}
          onStartRebind={(slot) => setListeningSlot(slot)}
          onBackToTitle={() => {
            setListeningSlot(0);
            setScreen('TITLE');
          }}
          onTogglePointer={() => updateProfile({ allowPointerTap: !profile.allowPointerTap })}
          onReplayTutorial={() => {
            updateProfile({ selectedSongId: 'moments_passing', selectedDifficulty: 'CHILL' });
            setScreen('PLAYING');
            resetRound(true, null);
          }}
          onUpdateAudioOffset={(ms) => updateProfile({ audioOffsetMs: ms })}
          onToggleMusic={() => {
            hasUnlockedAudioRef.current = true;
            audioEngine.unlock();
            const next = !profile.musicEnabled;
            updateProfile({ musicEnabled: next });
            audioEngine.updateVolumes(next, profile.musicVolume, profile.soundEnabled, profile.sfxVolume);
          }}
          onMusicVolume={(vol) => {
            updateProfile({ musicVolume: vol });
            audioEngine.updateVolumes(profile.musicEnabled, vol, profile.soundEnabled, profile.sfxVolume);
          }}
          onToggleSound={() => {
            const next = !profile.soundEnabled;
            updateProfile({ soundEnabled: next });
            audioEngine.updateVolumes(profile.musicEnabled, profile.musicVolume, next, profile.sfxVolume);
          }}
          onSfxVolume={(vol) => {
            updateProfile({ sfxVolume: vol });
            audioEngine.updateVolumes(profile.musicEnabled, profile.musicVolume, profile.soundEnabled, vol);
          }}
          onSelectHitSfx={(mode) => {
            updateProfile({ hitSfxMode: mode });
            audioEngine.playHit(true, mode, 2, true, activeSong.scaleNotes);
          }}
          onSelectTheme={(tid) => updateProfile({ theme: tid })}
          onSelectBgFx={(mode) => updateProfile({ bgFxMode: mode })}
          onSelectOverdriveVfx={(mode) => updateProfile({ overdriveVfxMode: mode })}
          onOpenShop={() => {
            setPreviousScreen('SETTINGS');
            setScreen('SHOP');
          }}
          onResetCareer={() => {
            updateProfile({ ...INITIAL_PROFILE });
            setScreen('TITLE');
          }}
          onResetDefaults={() => {
            updateProfile((prev) => ({
              ...prev,
              trigger1Code: INITIAL_PROFILE.trigger1Code,
              trigger1Label: INITIAL_PROFILE.trigger1Label,
              trigger2Code: INITIAL_PROFILE.trigger2Code,
              trigger2Label: INITIAL_PROFILE.trigger2Label,
              allowPointerTap: INITIAL_PROFILE.allowPointerTap,
              musicEnabled: INITIAL_PROFILE.musicEnabled,
              musicVolume: INITIAL_PROFILE.musicVolume,
              soundEnabled: INITIAL_PROFILE.soundEnabled,
              sfxVolume: INITIAL_PROFILE.sfxVolume,
              hitSfxMode: INITIAL_PROFILE.hitSfxMode,
              audioOffsetMs: INITIAL_PROFILE.audioOffsetMs,
              bgFxMode: INITIAL_PROFILE.bgFxMode,
              overdriveVfxMode: INITIAL_PROFILE.overdriveVfxMode,
              theme: INITIAL_PROFILE.theme,
              equippedMods: [],
            }));
          }}
          onTestTick={() => audioEngine.playUiTick(profile.soundEnabled)}
        />
      )}

      {screen === 'INDEX' && (
        <IndexScreen
          profile={profile}
          songs={songs}
          onBack={() => setScreen('TITLE')}
          onLaunchSandbox={(modeId) => {
            setScreen('PLAYING');
            resetRound(true, modeId);
          }}
        />
      )}

      {screen === 'SHOP' && (
        <OrbShopScreen
          profile={profile}
          songs={songs}
          isDeveloper={isDeveloper}
          onToggleDevUnlock={handleToggleDevUnlock}
          onBack={exitSubScreen}
          onUnlockDifficulty={handleUnlockDifficulty}
          onUnlockSong={handleUnlockSong}
          onUnlockTheme={handleUnlockTheme}
          onEquipTheme={(themeId) => {
            updateProfile({ theme: themeId });
            audioEngine.playHit(profile.soundEnabled, profile.hitSfxMode, 2, true, activeSong.scaleNotes);
          }}
          onUnlockMod={handleUnlockMod}
          onToggleEquipMod={handleToggleMod}
        />
      )}

      {screen === 'SONG_SELECT' && (
        <SongSelectScreen
          profile={profile}
          songs={songs}
          customAudioStatus={customAudioStatus}
          onBackToTitle={() => {
            setScreen('TITLE');
          }}
          onPreviewSong={(id) => previewSong(id, true)}
          onRandomSong={() => {
            const pool = songs.filter(
              (s) => profile.devUnlocked || s.orbCost === 0 || profile.unlockedSongs.includes(s.id),
            );
            if (pool.length === 0) return;
            const pick = pool[Math.floor(Math.random() * pool.length)];
            previewSong(pick.id, true);
          }}
          onToggleMusic={() => {
            const next = !profile.musicEnabled;
            updateProfile({ musicEnabled: next });
            audioEngine.updateVolumes(next, profile.musicVolume, profile.soundEnabled, profile.sfxVolume);
            if (!next) audioEngine.stop();
            else previewSong(activeSong.id, true);
          }}
          onSelectDifficulty={(diffId) => {
            updateProfile({ selectedDifficulty: diffId });
          }}
          onStartGame={() => {
            launchWithWarp(activeSong, activeDifficulty);
          }}
          onStartPractice={startPracticeRound}
          hasBestReplay={Boolean(songSelectReplay)}
          onWatchReplay={() => {
            if (songSelectReplay) startReplayPlayback(songSelectReplay);
          }}
          onOpenMods={openMods}
          onOpenOrbVault={openShopScreen}
          onUnlockDifficulty={handleUnlockDifficulty}
          onUnlockSong={handleUnlockSong}
          onUpdateLevelBg={(songId, patch) => {
            updateProfile((prev) => ({
              ...prev,
              levelBgSettings: {
                ...prev.levelBgSettings,
                [songId]: {
                  ...(prev.levelBgSettings[songId] || { dimPct: 64, blurPx: 3 }),
                  ...patch,
                },
              },
            }));
          }}
          onResetLevelBg={(songId) => {
            updateProfile((prev) => {
              const next = { ...prev.levelBgSettings };
              delete next[songId];
              return { ...prev, levelBgSettings: next };
            });
          }}
          onUploadCustomAudio={handleUploadCustomAudio}
        />
      )}

      {screen === 'PLAYING' && (
        <>
          <TopBar
            activeSong={activeSong}
            activeDifficulty={effectivePlayDifficulty}
            themeId={profile.theme}
            equippedModsCount={effectivePlayMods.length}
            beatLedIndex={uiBeatLed}
            songTimerText={songTimerText}
            songProgressPct={songProgressPct}
            onBackToSongSelect={enterSongSelect}
            onQuickRestart={() => {
              if (engineRef.current.replayMode) {
                seekReplayToTime(0);
              } else {
                resetRound(true, engineRef.current.sandboxModeId);
              }
            }}
            onOpenMods={openMods}
            onOpenPause={() => openPause('main')}
          />

          <OrbitStage
            renderStateRef={canvasStateRef}
            phase={uiPhase}
            themeId={profile.theme}
            bgFxMode={profile.bgFxMode}
            overdriveVfxMode={profile.overdriveVfxMode}
            allowPointerTap={profile.allowPointerTap}
            onTriggerPress={handleTriggerPress}
            onTriggerRelease={handleTriggerRelease}
            score={uiScore}
            hp={uiHp}
            streak={uiStreak}
            bestScore={profile.bestScore}
            accuracyPct={uiAccuracy}
            unbankedOrbs={uiUnbankedOrbs}
            streakMult={streakMult}
            totalMult={totalMult}
            modeName={activeModeInfo.name}
            modeColor={activeModeInfo.color}
            shields={uiShields}
            noFailActive={effectivePlayMods.includes('NF')}
            isTutorialRun={uiIsTutorialRun}
            tutorialLives={uiTutorialLives}
            activeLesson={uiActiveLesson}
            showTutorialCompleteStripe={showTutorialCompleteStripe}
            promptHint={promptHint}
            trigger1Code={profile.trigger1Code}
            trigger1Label={profile.trigger1Label}
            trigger2Code={profile.trigger2Code}
            trigger2Label={profile.trigger2Label}
            onSkipTutorial={() => {
              engineRef.current.tutorialGuideDisabled = true;
              engineRef.current.lessonSlowActive = false;
              engineRef.current.activeLesson = null;
              engineRef.current.dialTimeScale = 1.0;
              setUiActiveLesson(null);
            }}
            overdriveCharge={uiOverdriveCharge}
            overdriveActive={uiOverdriveActive}
            overdriveTimeLeft={uiOverdriveTimeLeft}
            overdrivePerfectsEarned={uiOverdrivePerfectsEarned}
            overdriveTargetPerfects={uiOverdriveTargetPerfects}
            overdriveUsed={uiOverdriveUsed}
            isPracticeMode={uiPracticeMode}
            practicePaused={uiPracticePaused}
            practiceSpeed={uiPracticeSpeed}
            practiceStartSec={uiPracticeStartSec}
            practiceCheckpoints={uiCheckpoints}
            songDurationSec={activeSong.durationSec}
            songTime={uiSongTime}
            onTogglePracticePause={togglePracticePause}
            onDropCheckpoint={dropPracticeCheckpoint}
            onRemoveCheckpoint={removePracticeCheckpoint}
            onRespawnCheckpoint={respawnPracticeCheckpoint}
            onChangePracticeSpeed={changePracticeSpeed}
            onPracticeSeek={(sec, skipAudioStart) => {
              engineRef.current.practiceStartSec = sec;
              setUiPracticeStartSec(sec);
              seekPracticeToTime(sec, undefined, Boolean(skipAudioStart));
            }}
            onExitPractice={exitPracticeMode}
            isReplayMode={uiReplayMode}
            replayPaused={uiReplayPaused}
            replaySpeed={uiReplaySpeed}
            replayEvents={uiReplayEvents}
            replayLabel={uiReplayLabel}
            replayLastClickLabel={uiReplayLastClickLabel}
            onToggleReplayPause={toggleReplayPause}
            onChangeReplaySpeed={changeReplaySpeed}
            onReplaySeek={(sec, skipAudioStart) => seekReplayToTime(sec, Boolean(skipAudioStart))}
            onExitReplay={exitReplayMode}
            themesMap={mergedThemes}
            previewOverdriveCharge={isDeveloper ? odPreviewCharge : null}
            previewOverdriveActive={isDeveloper && odPreviewActive}
          />
        </>
      )}

      {/* Right-Side In-Round Pause & Settings Drawer */}
      <PauseDrawer
        open={pauseOpen}
        activeTab={pauseTab}
        onChangeTab={setPauseTab}
        profile={profile}
        songTitle={activeSong.title}
        listeningSlot={listeningSlot}
        onStartRebind={(slot) => setListeningSlot(slot)}
        onResume={() => closePause(false)}
        onRetryRound={() => {
          setPauseOpen(false);
          if (engineRef.current.replayMode) {
            seekReplayToTime(0);
          } else {
            resetRound(true, engineRef.current.sandboxModeId);
          }
        }}
        onGoToSongSelect={enterSongSelect}
        onGoToTitle={() => {
          audioEngine.stopHoldShimmer();
          setPauseOpen(false);
          setScreen('TITLE');
        }}
        onOpenOrbVault={openShopScreen}
        onTogglePointer={() => updateProfile({ allowPointerTap: !profile.allowPointerTap })}
        onUpdateAudioOffset={(ms) => updateProfile({ audioOffsetMs: ms })}
        onToggleMusic={() => {
          const next = !profile.musicEnabled;
          updateProfile({ musicEnabled: next });
          audioEngine.updateVolumes(next, profile.musicVolume, profile.soundEnabled, profile.sfxVolume);
        }}
        onMusicVolume={(vol) => {
          updateProfile({ musicVolume: vol });
          audioEngine.updateVolumes(profile.musicEnabled, vol, profile.soundEnabled, profile.sfxVolume);
        }}
        onToggleSound={() => {
          const next = !profile.soundEnabled;
          updateProfile({ soundEnabled: next });
          audioEngine.updateVolumes(profile.musicEnabled, profile.musicVolume, next, profile.sfxVolume);
        }}
        onSfxVolume={(vol) => {
          updateProfile({ sfxVolume: vol });
          audioEngine.updateVolumes(profile.musicEnabled, profile.musicVolume, profile.soundEnabled, vol);
        }}
        onSelectHitSfx={(mode) => {
          updateProfile({ hitSfxMode: mode });
          audioEngine.playHit(true, mode, 2, true, activeSong.scaleNotes);
        }}
        onSelectTheme={(tid) => updateProfile({ theme: tid })}
        onSelectBgFx={(mode) => updateProfile({ bgFxMode: mode })}
        onSelectOverdriveVfx={(mode) => updateProfile({ overdriveVfxMode: mode })}
        isPracticeMode={uiPracticeMode}
        isReplayMode={uiReplayMode}
        onTogglePracticeMode={togglePracticeModeFromPause}
      />

      <ModDrawer
        open={modsOpen}
        themeId={profile.theme}
        equippedMods={profile.equippedMods}
        purchasedMods={profile.purchasedMods}
        totalHits={profile.totalHits}
        devUnlocked={profile.devUnlocked}
        activeDifficulty={activeDifficulty}
        onToggleMod={handleToggleMod}
        onClearMods={() => updateProfile({ equippedMods: [] })}
        onOpenShop={openShopScreen}
        onClose={closeMods}
      />

      <RunSummaryModal
        summary={uiPhase === 'SUMMARY' ? summaryData : null}
        themeId={profile.theme}
        hasReplay={Boolean(summaryReplay)}
        onWatchReplay={() => {
          if (summaryReplay) startReplayPlayback(summaryReplay);
        }}
        onRetry={() => {
          if (engineRef.current.replayMode && engineRef.current.replayData) {
            startReplayPlayback(engineRef.current.replayData);
          } else {
            resetRound(true, engineRef.current.sandboxModeId);
          }
        }}
        onOpenSongSelect={enterSongSelect}
        onOpenOrbVault={() => {
          setSummaryData(null);
          openShopScreen();
        }}
        onEquipTheme={(tid) => {
          updateProfile({ theme: tid });
          audioEngine.playUiTick(profile.soundEnabled);
        }}
      />

      <ZoomWarpTransition active={Boolean(warpLaunchLabel)} label={warpLaunchLabel || ''} />

      {isDeveloper && (
        <AxiomDevStudio
          open={devStudioOpen}
          onToggleOpen={setDevStudioOpen}
          activeTab={devActiveTab}
          onSelectTab={setDevActiveTab}
          currentScreen={screen}
          onSwitchScreen={handleEngineSwitchScreen}
          profile={profile}
          themesMap={mergedThemes}
          songs={songs}
          selectedSongId={activeSong.id}
          hudLayout={mergedHudLayout}
          assets={mergedAssets}
          editModeActive={hudEditModeActive}
          selectedWidgetId={selectedHudWidgetId}
          selectedDecorId={selectedDecorId}
          previewCharge={odPreviewCharge}
          previewActive={odPreviewActive}
          draftSongsCount={Object.keys(studioDrafts.draftSongs).length}
          draftThemesCount={Object.keys(studioDrafts.draftThemes).length}
          hasDraftHud={Boolean(studioDrafts.draftHudLayout)}
          draftAssetsCount={Object.keys(studioDrafts.draftAssets).length}
          exportSongs={Object.values(studioDrafts.draftSongs)}
          exportThemes={Object.values(studioDrafts.draftThemes)}
          canUndo={historyCounts.past > 0}
          canRedo={historyCounts.future > 0}
          onUndo={handleUndoDraft}
          onRedo={handleRedoDraft}
          onToggleEditMode={() => setHudEditModeActive((v) => !v)}
          onSelectWidget={setSelectedHudWidgetId}
          onSelectDecor={setSelectedDecorId}
          onUpdateHudLayout={handleUpdateHudLayout}
          onSafeResetLayout={handleSafeResetLayout}
          onSaveThemeDraft={handleSaveThemeDraft}
          onResetBuiltInTheme={handleResetBuiltInTheme}
          onApplyPlayerTheme={(id) => updateProfile({ theme: id })}
          onSaveSongDraft={handleSaveSongDraft}
          onSelectSong={(songId) => previewSong(songId, true)}
          onPlaytestSong={handlePlaytestSong}
          onUpsertAsset={handleUpsertAsset}
          onDeleteAsset={handleDeleteAsset}
          onPlaceDecorFromAsset={handlePlaceDecorFromAsset}
          onChangePreviewCharge={setOdPreviewCharge}
          onTogglePreviewActive={setOdPreviewActive}
          onPublishAllCloud={handlePublishAllCloud}
          onDiscardDrafts={handleDiscardDrafts}
        />
      )}
    </div>
    </StudioLayoutProvider>
  );
}
