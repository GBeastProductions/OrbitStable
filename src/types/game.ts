export type DifficultyId = 'CHILL' | 'NORMAL' | 'HARD' | 'INSANE' | 'DEMON';
export type BuiltInThemeId =
  | 'tokyo_pink'
  | 'shibuya_cyan'
  | 'emerald'
  | 'amber'
  | 'crimson'
  | 'shinjuku_violet'
  | 'snowflake_frost'
  | 'kyoto_jade'
  | 'neon_sakura'
  | 'cozy_christmas_2026'
  | 'krampusnacht_2026';

export type ThemeId = BuiltInThemeId | (string & {});

export type SkinParticlePreset = 'none' | 'sakura' | 'snow' | 'krampus_ash';
export type SkinDialStyle = 'classic' | 'sakura_kintsugi' | 'christmas_frost' | 'krampus_forged';
export type SkinTrimStyle = 'none' | 'sakura_blossom' | 'snow_cap' | 'krampus_iron';

export type OverdriveAnimationType =
  | 'flame_rise'
  | 'pulse_shockwave'
  | 'parallax_drift'
  | 'helix_orbit'
  | 'chromatic_split'
  | 'lightning_strobe'
  | 'petal_swirl'
  | 'thermal_heatwave'
  | 'slash_sweep'
  | 'bounce_pop'
  | 'flipbook_sheet'
  | 'spark_emitter';

export type OverdriveLayerAnchor =
  | 'bottom_border'
  | 'left_border'
  | 'right_border'
  | 'side_borders'
  | 'screen_frame'
  | 'center_aura';

export interface OverdriveCustomLayer {
  id: string;
  name: string;
  imageUrl: string;
  anchor: OverdriveLayerAnchor;
  animation: OverdriveAnimationType;
  blendMode: 'screen' | 'lighter' | 'normal';
  opacity: number;
  scale: number;
  speed: number;
  buildupMinOpacity: number;
  eruptBoost: number;
  flipbookCols?: number;
  flipbookRows?: number;
  flipbookFps?: number;
  enabled: boolean;
}

export interface ThemeShaderConfig {
  overdriveIntensity: number;
  overdriveTurbulence: number;
  flareStrength: number;
  shaderSpeed: number;
  ringAura: number;
  atmosphereOpacity: number;
}

export interface EditableThemePayload {
  id: string;
  status: 'draft' | 'published';
  label: string;
  jpLabel: string;
  orbCost: number;
  isTransformationSkin?: boolean;
  unlockRequirement?: string;
  primary: string;
  bright: string;
  secondary: string;
  dim: string;
  onPrimary: string;
  bgAccentRgb: string;
  manifest: SkinPackManifest;
  overdriveLayers?: OverdriveCustomLayer[];
  hideBuiltInFlames?: boolean;
  shaderConfig?: ThemeShaderConfig;
  isBuiltInOverride?: boolean;
  updatedAtIso?: string;
}

export interface HudWidgetOverride {
  widgetId: string;
  xOffsetPx: number;
  yOffsetPx: number;
  scale: number;
  opacity: number;
  visible: boolean;
  customImageUrl?: string;
  bgColor?: string;
  borderColor?: string;
  borderRadiusPx?: number;
  labelOverride?: string;
}

export interface DevDockStyleConfig {
  position: 'left' | 'right' | 'top';
  opacity: number;
  blurPx: number;
  accentColor: string;
  bgColor: string;
  borderColor: string;
  compact: boolean;
  showTooltips: boolean;
}

export interface CustomDecorWidget {
  id: string;
  screen: 'TITLE' | 'SONG_SELECT' | 'PLAYING' | 'ALL';
  kind: 'image' | 'badge';
  text?: string;
  imageUrl?: string;
  xPct: number;
  yPct: number;
  widthPx: number;
  heightPx: number;
  opacity: number;
  rotationDeg: number;
  blendMode?: 'screen' | 'normal';
}

export interface PublishedHudLayout {
  id: string;
  status: 'draft' | 'published';
  name: string;
  widgets: Record<string, HudWidgetOverride>;
  devDockStyle: DevDockStyleConfig;
  customDecorWidgets?: CustomDecorWidget[];
}

export interface DevAssetItem {
  id: string;
  status: 'draft' | 'published';
  name: string;
  folder: string;
  kind: 'image' | 'audio';
  dataUrlOrPath: string;
  mimeType?: string;
  sizeBytes?: number;
  tags?: string[];
  updatedAtIso?: string;
}

export type UIActionId =
  | 'play_primary'
  | 'open_tracks'
  | 'open_shop'
  | 'open_index'
  | 'open_settings'
  | 'toggle_music'
  | 'open_mods'
  | 'open_practice'
  | 'open_dev_console';

export type HitSfxMode = 'switch' | 'harmonic' | 'rimshot';
export type BgFxMode = 'dynamic' | 'clean' | 'minimal';
export type OverdriveVfxMode = 'full' | 'subtle' | 'off';
export type ScreenView = 'TITLE' | 'SONG_SELECT' | 'PLAYING' | 'SETTINGS' | 'INDEX' | 'SHOP';
export type GameScreen = ScreenView;

export type ModCode =
  | 'EZ'
  | 'NF'
  | 'SH'
  | 'GA'
  | 'SA'
  | 'RG'
  | 'HR'
  | 'DT'
  | 'HD'
  | 'FL'
  | 'SD'
  | 'BF'
  | 'SM'
  | 'DR'
  | 'HO'
  | 'VD'
  | 'OC'
  | 'OS'
  | 'MR'
  | 'RX'
  | 'SG'
  | 'CV';

export type ModCategory = 'reduction' | 'increase' | 'special';
export type SongCategory = 'tutorial' | 'arcade' | 'electronic' | 'christmas' | 'daily' | 'weekly' | 'custom';

export type WaveModeId =
  | 'CW_GREEN'
  | 'CCW_RED'
  | 'HOLD_ARC'
  | 'DOUBLE_TAP'
  | 'BEAT_BURST'
  | 'METEOR_SLASH'
  | 'FEVER_SPINNER'
  | 'PURPLE_SURGE'
  | 'ONE_PASS'
  | 'SNIPER_MICRO'
  | 'MULTI_CLUSTER'
  | 'ORDERED_SEQ'
  | 'CASCADE_CHAIN'
  | 'DECAY_ARC'
  | 'HAZARD_DECOY'
  | 'GHOST_PULSE'
  | 'SPRING_BOUNCE'
  | 'BRAKE_DRIFT'
  | 'OSU_PORTAL';

export type SongSection = 'INTRO' | 'BUILD-UP' | 'DROP' | 'BREAKDOWN' | 'OUTRO';
export type JudgmentTier = 'PERFECT' | 'GREAT' | 'GOOD' | 'MISS';
export type LetterRank = 'SS' | 'S' | 'A' | 'B' | 'C' | 'D' | 'F';
export type GamePhase = 'IDLE' | 'PLAYING' | 'PAUSED' | 'SUMMARY' | 'TUTORIAL_CINEMATIC';
export type PauseTabId = 'main' | 'ctrl' | 'audio' | 'disp';

export interface ChassisTheme {
  id: ThemeId;
  label: string;
  jpLabel: string;
  orbCost: number;
  isTransformationSkin?: boolean;
  unlockRequirement?: string;
  primary: string;
  bright: string;
  secondary: string;
  dim: string;
  edgeTick: string;
  trailSteps: [string, string, string, string];
  hubActiveFill: string;
  onPrimary: string;
  bgAccentRgb: string;
}

export interface SkinSlotOverlay {
  id: string;
  slot: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'turntable' | 'headerAccent';
  imageUrl: string;
  opacity: number;
  scale?: number;
  rotateDeg?: number;
  flipX?: boolean;
  blendMode?: 'screen' | 'lighten' | 'normal';
}

export interface SkinPackManifest {
  id: ThemeId;
  name: string;
  subtitle: string;
  isFullTransformation: boolean;
  unlockRuleText: string;
  displayFont: string;
  bodyFont: string;
  monoFont: string;
  backdropImageUrl: string | null;
  backdropScrimRgba: string;
  surfaceBg: string;
  surfaceElevatedBg: string;
  surfaceBorder: string;
  headerBg: string;
  bladeBg: string;
  bladeHoverBg: string;
  trimStyle: SkinTrimStyle;
  particlePreset: SkinParticlePreset;
  dialStyle: SkinDialStyle;
  turntableGlowCss: string;
  ornamentImageUrl: string | null;
  overlays: SkinSlotOverlay[];
}

export interface DifficultyConfig {
  id: DifficultyId;
  name: string;
  mult: number;
  orbCost: number;
  minGapSec: number;
  targetGapSec: number;
  baseSpeed: number;
  arcScale: number;
  desc: string;
}

export interface SongSectionCue {
  startPct: number;
  label: SongSection;
}

export interface SynthFallbackPattern {
  style: 'arcade' | 'electro' | 'house' | 'rave' | 'demon';
  chords: number[][];
  lead: number[];
}

export interface SongDefinition {
  id: string;
  num: string;
  newgroundsId: string;
  artist: string;
  title: string;
  genre: string;
  category: SongCategory;
  bpm: number;
  keySig: string;
  scaleNotes: number[];
  durationSec: number;
  audioUrl: string;
  bgImageUrl: string;
  orbCost: number;
  chillOnly: boolean;
  demonOnly?: boolean;
  isDaily?: boolean;
  isWeekly?: boolean;
  rotationNumber?: number;
  isCustom?: boolean;
  customOnsets?: number[];
  customBeatmap?: BeatmapNote[];
  status?: 'draft' | 'published';
  isPublishedOverride?: boolean;
  synthFallback?: SynthFallbackPattern;
  stars: Partial<Record<DifficultyId, string>>;
  desc: string;
  sections: SongSectionCue[];
}

export interface LevelBackgroundSetting {
  dimPct: number;
  blurPx: number;
  customImageDataUrl?: string;
}

export interface WaveModeInfo {
  id: WaveModeId;
  name: string;
  tag: string;
  category: 'Core' | 'Rhythm & Hold' | 'Precision & Multi' | 'Hazard & Warp';
  color: string;
  desc: string;
  howToHit: string;
  timingTip: string;
  tierPresence: string;
}

export interface ModDefinition {
  id: ModCode;
  code: ModCode;
  name: string;
  category: ModCategory;
  mult: number;
  unlockHits: number;
  orbCost: number;
  desc: string;
}

export interface TrophyBadge {
  id: string;
  title: string;
  jpTitle: string;
  desc: string;
  tier: 'bronze' | 'silver' | 'gold' | 'prism';
  orbReward: number;
}

export interface StackedNoteLayer {
  modeId: WaveModeId;
  angleOffsetRad?: number;
  sizeScale?: number;
  taps?: number;
  holdDurationSec?: number;
}

export interface BeatmapNote {
  index: number;
  hitTime: number;
  stepSec: number;
  modeId: WaveModeId;
  section: SongSection;
  energy: number;
  sizeScale?: number;
  speedScale?: number;
  holdDurationSec?: number;
  burstCount?: number;
  stackedModes?: StackedNoteLayer[];
}

export interface TargetSector {
  id: number;
  modeId?: WaveModeId;
  angle: number;
  baseAngle: number;
  halfWidth: number;
  initialHalfWidth: number;
  tapsLeft: number;
  lastTapAtMs?: number;
  seqNum: number;
  alpha: number;
  enteredWindow: boolean;
  // Audio-clock synchronization & recovery metadata
  spawnTime?: number;
  targetHitTime?: number;
  expireTime?: number;
  // Phase 2 Hold Arc & Special Mechanic Fields
  isHold?: boolean;
  holdSpanRad?: number;
  holdEndAngle?: number;
  holdStartAngle?: number;
  holdRemainingRad?: number;
  holdTravelledRad?: number;
  holdDir?: 1 | -1;
  holdDurationSec?: number;
  holdElapsedSec?: number;
  isHolding?: boolean;
  holdTickAccum?: number;
  isFeverSpinner?: boolean;
  feverHits?: number;
  feverMaxHits?: number;
  feverRemainingSec?: number;
  isMeteorEcho?: boolean;
}

export interface HazardMine {
  angle: number;
  halfWidth: number;
}

export interface PortalPair {
  entryAngle: number;
  exitAngle: number;
  halfWidth: number;
  warped: boolean;
  warpFlashTimer: number;
}

export interface HitEffect {
  timer: number;
  duration: number;
  angle: number;
  isPerfect: boolean;
  label: string;
  color: string;
}

export interface HitErrorTick {
  offsetSigned: number;
  color: string;
  age: number;
}

export interface TutorialLesson {
  id: string;
  triggerMode: WaveModeId | 'ANY';
  minWaveIndex: number;
  title: string;
  instruction: string;
  highlightType: 'sector' | 'reverse' | 'bullseye' | 'hold';
}

export interface SongRecord {
  bestScore: number;
  bestRank: LetterRank;
  bestAccuracy: number;
  bestCombo: number;
}

export interface MechanicStat {
  hits: number;
  perfects: number;
  misses: number;
}

export interface PlayerProfile {
  trigger1Code: string;
  trigger1Label: string;
  trigger2Code: string;
  trigger2Label: string;
  allowPointerTap: boolean;
  musicEnabled: boolean;
  musicVolume: number;
  soundEnabled: boolean;
  sfxVolume: number;
  hitSfxMode: HitSfxMode;
  audioOffsetMs: number;
  bgFxMode: BgFxMode;
  overdriveVfxMode: OverdriveVfxMode;
  theme: ThemeId;
  unlockedThemes: ThemeId[];
  selectedSongId: string;
  selectedDifficulty: DifficultyId;
  equippedMods: ModCode[];
  purchasedMods: ModCode[];
  unlockedDiffs: DifficultyId[];
  unlockedSongs: string[];
  unlockedBadges: string[];
  mechanicStats: Partial<Record<WaveModeId, MechanicStat>>;
  orbs: number;
  totalOrbsEarned: number;
  totalOverdrives: number;
  levelBgSettings: Record<string, LevelBackgroundSetting>;
  tutorialSongCompleted: boolean;
  devUnlocked: boolean;
  bestScore: number;
  tierBestScores: Record<DifficultyId, number>;
  songRecords: Record<string, SongRecord>;
  songDiffRecords?: Record<string, Partial<Record<DifficultyId, SongRecord>>>;
  bestStreak: number;
  totalHits: number;
  totalMisses: number;
  totalPerfects: number;
  offsetDegSum: number;
  earlyMisses: number;
  lateMisses: number;
  dailyStreak: number;
  lastDailyDateKey: string;
  completedDailyIds: string[];
  completedWeeklyIds: string[];
}

export interface MilestoneForecast {
  currentRank: LetterRank;
  nextRank: LetterRank | null;
  gapLabel: string;
  progressPct: number;
  potentialBonusOrbs: number;
}

export interface RunSummaryData {
  cleared: boolean;
  songId: string;
  songTitle: string;
  artist: string;
  difficulty: DifficultyId;
  score: number;
  previousBestScore: number;
  maxCombo: number;
  accuracy: number;
  rank: LetterRank;
  isSilverRank: boolean;
  perfectCount: number;
  greatCount: number;
  goodCount: number;
  missCount: number;
  avgOffsetDeg: number;
  offsetSamples: number[];
  unbankedOrbs: number;
  rankBonusOrbs: number;
  badgeBonusOrbs: number;
  cashedOutOrbs: number;
  cashOutApproved: boolean;
  newlyEarnedBadges: TrophyBadge[];
  newlyUnlockedThemes?: ThemeId[];
  missReason?: string;
  missDegrees?: string;
  isNewBest: boolean;
  replayId?: string;
  isPractice?: boolean;
}

export interface ReplayInputEvent {
  songTime: number;
  action: 'PRESS' | 'RELEASE';
  cbsAngle: number;
  tier?: JudgmentTier;
  modeId?: WaveModeId;
}

export interface ReplayData {
  id: string;
  songId: string;
  songTitle: string;
  artist: string;
  difficulty: DifficultyId;
  equippedMods: ModCode[];
  score: number;
  accuracy: number;
  rank: LetterRank;
  maxCombo: number;
  durationSec: number;
  createdAtIso: string;
  events: ReplayInputEvent[];
  isBest?: boolean;
}

export interface PracticeCheckpoint {
  id: number;
  songTime: number;
  beatmapIndex: number;
  spinnerAngle: number;
  direction: 1 | -1;
  score: number;
  streak: number;
  overdriveCharge: number;
  overdrivePerfectsEarned: number;
  overdriveUsedThisRun: boolean;
  overdriveActive: boolean;
  overdriveTimeLeft: number;
}

export interface NextCuePreview {
  angle: number;
  modeId: WaveModeId;
  color: string;
  timeUntilSpawn: number;
  isDirectionFlip: boolean;
  nextDir: 1 | -1;
}

export interface ShockwaveRing {
  timer: number;
  duration: number;
  color: string;
}

