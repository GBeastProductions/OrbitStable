import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  User,
  getAuth,
  getRedirectResult,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import {
  DevAssetItem,
  EditableThemePayload,
  PlayerProfile,
  PublishedHudLayout,
  SongDefinition,
  ThemeId,
} from './types/game';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

async function testConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration (Firestore offline).');
    }
  }
}

void testConnection();

export const BOOTSTRAPPED_DEV_EMAIL = 'studiosmobile092@gmail.com';
export const BOOTSTRAPPED_DEV_EMAILS = [
  'studiosmobile092@gmail.com',
  'mobilelabscreator@gmail.com',
];

export function formatFirebaseAuthError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: unknown }).code)
      : '';
  const msg = error instanceof Error ? error.message : String(error);
  const host = typeof window !== 'undefined' ? window.location.hostname : 'this domain';
  if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
    return `Domain "${host}" is not authorized in Firebase Auth. Add "${host}" under Firebase Console -> Authentication -> Settings -> Authorized domains.`;
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Sign-in popup was closed before completing.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Popup blocked by browser. Use Redirect Sign-In instead.';
  }
  return msg;
}

export async function handleAuthRedirectOnBoot(): Promise<User | null> {
  try {
    const res = await getRedirectResult(auth);
    return res?.user || null;
  } catch (error) {
    console.warn('Redirect sign-in check:', formatFirebaseAuthError(error));
    return null;
  }
}

export async function signInWithGooglePopup(): Promise<User | null> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return cred.user;
  } catch (error) {
    const code =
      typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code)
        : '';
    if (
      code === 'auth/popup-blocked' ||
      code === 'auth/operation-not-supported-in-this-environment'
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw new Error(formatFirebaseAuthError(error));
  }
}

export async function signInWithGoogleRedirect(): Promise<void> {
  try {
    await signInWithRedirect(auth, googleProvider);
  } catch (error) {
    throw new Error(formatFirebaseAuthError(error));
  }
}

export async function signOutAccount(): Promise<void> {
  await signOut(auth);
}

export async function checkUserDeveloperRole(user: User): Promise<boolean> {
  if (!user.emailVerified) return false;
  const userEmail = (user.email || '').toLowerCase();
  if (BOOTSTRAPPED_DEV_EMAILS.some((e) => e.toLowerCase() === userEmail)) {
    return true;
  }
  try {
    const profileSnap = await getDoc(doc(db, 'user_profiles', user.uid));
    if (profileSnap.exists() && profileSnap.data()?.dev === true) {
      return true;
    }
  } catch {
    // Continue to dev_roles fallback
  }
  try {
    const snap = await getDoc(doc(db, 'dev_roles', user.uid));
    if (!snap.exists()) return false;
    const data = snap.data() as { role?: string };
    return data.role === 'developer' || data.role === 'admin';
  } catch {
    return false;
  }
}

export interface CloudProfileSnapshot {
  theme?: ThemeId;
  unlockedThemes?: ThemeId[];
  bestScore?: number;
  bestStreak?: number;
  totalOrbsEarned?: number;
  tutorialSongCompleted?: boolean;
}

export async function fetchUserCloudProfile(user: User): Promise<CloudProfileSnapshot | null> {
  if (!user.emailVerified) return null;
  const profilePath = `user_profiles/${user.uid}`;
  try {
    const snap = await getDoc(doc(db, 'user_profiles', user.uid));
    if (!snap.exists()) return null;
    return snap.data() as CloudProfileSnapshot;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, profilePath);
  }
}

export async function syncUserProfileToCloud(user: User, profile: PlayerProfile): Promise<void> {
  if (!user.emailVerified) return;
  const profilePath = `user_profiles/${user.uid}`;
  const docRef = doc(db, 'user_profiles', user.uid);

  const sanitizedThemes = Array.from(
    new Set(
      (profile.unlockedThemes.length > 0 ? profile.unlockedThemes : ['tokyo_pink']).map((t) =>
        String(t).toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 48),
      ),
    ),
  ).slice(0, 30);

  const safeTheme =
    String(profile.theme || 'tokyo_pink')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .slice(0, 48) || 'tokyo_pink';

  const sharedPayload = {
    displayName: (user.displayName || 'Orbit Player').slice(0, 80),
    email: (user.email || '').slice(0, 180),
    theme: safeTheme,
    unlockedThemes: sanitizedThemes,
    bestScore: Math.max(0, Math.floor(profile.bestScore || 0)),
    bestStreak: Math.max(0, Math.floor(profile.bestStreak || 0)),
    totalOrbsEarned: Math.max(0, Math.floor(profile.totalOrbsEarned || 0)),
    tutorialSongCompleted: Boolean(profile.tutorialSongCompleted),
    updatedAt: serverTimestamp(),
  };

  try {
    const existingSnap = await getDoc(docRef);
    if (!existingSnap.exists()) {
      await setDoc(docRef, {
        uid: user.uid.slice(0, 128),
        dev: false,
        ...sharedPayload,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, sharedPayload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, profilePath);
  }
}

// =========================================================================
// Live Published Content & Dev Studio Persistence Helpers
// =========================================================================

function sanitizeSlugId(raw: string, maxLen = 64): string {
  const clean = raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, maxLen);
  return clean || `item_${Date.now()}`;
}

function sanitizeThemeSlug(raw: string): string {
  const clean = raw
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
  return clean || `theme_${Date.now()}`;
}

export async function fetchLivePublishedCatalog(devUser: User | null): Promise<{
  songs: SongDefinition[];
  themes: EditableThemePayload[];
  hudLayouts: PublishedHudLayout[];
  assets: DevAssetItem[];
}> {
  const loadCol = async <T extends { id: string }>(
    colName: string,
    mapper: (data: Record<string, unknown>, id: string) => T,
  ): Promise<T[]> => {
    const map = new Map<string, T>();
    try {
      const pubQ = query(collection(db, colName), where('status', '==', 'published'));
      const pubSnap = await getDocs(pubQ);
      pubSnap.forEach((d) => {
        map.set(d.id, mapper(d.data() as Record<string, unknown>, d.id));
      });
      if (devUser && devUser.emailVerified) {
        try {
          const draftQ = query(collection(db, colName), where('updatedByUid', '==', devUser.uid));
          const draftSnap = await getDocs(draftQ);
          draftSnap.forEach((d) => {
            map.set(d.id, mapper(d.data() as Record<string, unknown>, d.id));
          });
        } catch {
          // Non-dev users won't have drafts
        }
      }
    } catch (error) {
      console.warn(`Skipped live fetch for ${colName}:`, error);
    }
    return Array.from(map.values());
  };

  const [songs, themes, hudLayouts, assets] = await Promise.all([
    loadCol<SongDefinition>('published_songs', (d, id) => ({
      id,
      num: 'DEV',
      newgroundsId: id,
      title: String(d.title || 'Untitled Track'),
      artist: String(d.artist || 'Orbit Studio'),
      genre: String(d.genre || 'Electronic'),
      category: (String(d.category || 'custom') as SongDefinition['category']),
      bpm: Number(d.bpm || 128),
      keySig: 'C MIN',
      scaleNotes: Array.isArray(d.scaleNotes) ? (d.scaleNotes as number[]) : [60, 62, 63, 67, 68, 72],
      durationSec: Number(d.durationSec || 120),
      audioUrl: String(d.audioUrl || ''),
      bgImageUrl: String(d.bgImageUrl || ''),
      orbCost: Number(d.orbCost || 0),
      chillOnly: Boolean(d.chillOnly),
      demonOnly: Boolean(d.demonOnly),
      stars: (d.stars as SongDefinition['stars']) || { CHILL: '1.5★', NORMAL: '3.0★', HARD: '4.5★' },
      desc: String(d.desc || ''),
      sections: Array.isArray(d.sections)
        ? (d.sections as SongDefinition['sections'])
        : [{ startPct: 0, label: 'INTRO' }, { startPct: 0.35, label: 'DROP' }],
      customBeatmap: Array.isArray(d.customBeatmap)
        ? (d.customBeatmap as SongDefinition['customBeatmap'])
        : undefined,
      status: (d.status as 'draft' | 'published') || 'published',
      isPublishedOverride: true,
    })),
    loadCol<EditableThemePayload>('published_themes', (d, id) => ({
      ...(d as unknown as EditableThemePayload),
      id,
      status: (d.status as 'draft' | 'published') || 'published',
    })),
    loadCol<PublishedHudLayout>('published_hud_layouts', (d, id) => ({
      ...(d as unknown as PublishedHudLayout),
      id,
      status: (d.status as 'draft' | 'published') || 'published',
    })),
    loadCol<DevAssetItem>('dev_asset_library', (d, id) => ({
      ...(d as unknown as DevAssetItem),
      id,
      status: (d.status as 'draft' | 'published') || 'published',
    })),
  ]);

  return { songs, themes, hudLayouts, assets };
}

export async function publishSongToCloud(
  user: User,
  song: SongDefinition,
  status: 'draft' | 'published' = 'published',
): Promise<void> {
  if (!user.emailVerified) throw new Error('Verified developer email required.');
  const id = sanitizeSlugId(song.id, 64);
  const docPath = `published_songs/${id}`;
  const docRef = doc(db, 'published_songs', id);

  const safeBg =
    song.bgImageUrl && song.bgImageUrl.length <= 180000 ? song.bgImageUrl : '';
  const payload = {
    id,
    status,
    title: song.title.slice(0, 100) || 'Untitled Track',
    artist: song.artist.slice(0, 100) || 'Orbit Studio',
    genre: (song.genre || 'Electronic').slice(0, 64),
    category: (song.category || 'custom').slice(0, 24),
    bpm: Math.max(40, Math.min(360, Number(song.bpm || 128))),
    durationSec: Math.max(5, Math.min(1200, Number(song.durationSec || 120))),
    audioUrl: (song.audioUrl || '').slice(0, 400),
    bgImageUrl: safeBg,
    desc: (song.desc || '').slice(0, 320),
    scaleNotes: (song.scaleNotes || [60, 62, 64, 67, 69, 72]).slice(0, 16),
    stars: song.stars || {},
    sections: (song.sections || []).slice(0, 16),
    customBeatmap: (song.customBeatmap || []).slice(0, 900),
    chillOnly: Boolean(song.chillOnly),
    demonOnly: Boolean(song.demonOnly),
    orbCost: Math.max(0, Math.min(10000, Math.floor(song.orbCost || 0))),
    updatedByUid: user.uid.slice(0, 128),
    updatedAt: serverTimestamp(),
  };

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, {
        ...payload,
        createdByUid: user.uid.slice(0, 128),
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deletePublishedSongFromCloud(songId: string): Promise<void> {
  const id = sanitizeSlugId(songId, 64);
  const docPath = `published_songs/${id}`;
  try {
    await deleteDoc(doc(db, 'published_songs', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function publishThemeToCloud(
  user: User,
  theme: EditableThemePayload,
  status: 'draft' | 'published' = 'published',
): Promise<void> {
  if (!user.emailVerified) throw new Error('Verified developer email required.');
  const id = sanitizeThemeSlug(theme.id);
  const docPath = `published_themes/${id}`;
  const docRef = doc(db, 'published_themes', id);

  const payload = {
    id,
    status,
    label: theme.label.slice(0, 64) || 'Custom Theme',
    jpLabel: (theme.jpLabel || '').slice(0, 64),
    orbCost: Math.max(0, Math.min(10000, Math.floor(theme.orbCost || 0))),
    isTransformationSkin: Boolean(theme.isTransformationSkin),
    unlockRequirement: (theme.unlockRequirement || '').slice(0, 140),
    primary: theme.primary.slice(0, 24),
    bright: theme.bright.slice(0, 24),
    secondary: theme.secondary.slice(0, 24),
    dim: (theme.dim || '#181020').slice(0, 24),
    onPrimary: (theme.onPrimary || '#ffffff').slice(0, 24),
    bgAccentRgb: (theme.bgAccentRgb || '255, 59, 130').slice(0, 24),
    manifest: theme.manifest,
    overdriveLayers: (theme.overdriveLayers || []).slice(0, 12),
    hideBuiltInFlames: Boolean(theme.hideBuiltInFlames),
    ...(theme.shaderConfig ? { shaderConfig: theme.shaderConfig } : {}),
    updatedByUid: user.uid.slice(0, 128),
    updatedAt: serverTimestamp(),
  };

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, {
        ...payload,
        createdByUid: user.uid.slice(0, 128),
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deletePublishedThemeFromCloud(themeId: string): Promise<void> {
  const id = sanitizeThemeSlug(themeId);
  const docPath = `published_themes/${id}`;
  try {
    await deleteDoc(doc(db, 'published_themes', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function publishHudLayoutToCloud(
  user: User,
  layout: PublishedHudLayout,
  status: 'draft' | 'published' = 'published',
): Promise<void> {
  if (!user.emailVerified) throw new Error('Verified developer email required.');
  const id = sanitizeSlugId(layout.id, 48);
  const docPath = `published_hud_layouts/${id}`;
  const docRef = doc(db, 'published_hud_layouts', id);

  const payload = {
    id,
    status,
    name: layout.name.slice(0, 80) || 'Default Layout',
    widgets: layout.widgets || {},
    devDockStyle: layout.devDockStyle,
    customDecorWidgets: (layout.customDecorWidgets || []).slice(0, 24),
    updatedByUid: user.uid.slice(0, 128),
    updatedAt: serverTimestamp(),
  };

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, {
        ...payload,
        createdByUid: user.uid.slice(0, 128),
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function publishDevAssetToCloud(
  user: User,
  asset: DevAssetItem,
  status: 'draft' | 'published' = 'published',
): Promise<void> {
  if (!user.emailVerified) throw new Error('Verified developer email required.');
  if (asset.dataUrlOrPath.length > 280000) {
    throw new Error('Asset exceeds 280KB Firestore limit; compress image further or push via GitHub.');
  }
  const id = sanitizeSlugId(asset.id, 64);
  const docPath = `dev_asset_library/${id}`;
  const docRef = doc(db, 'dev_asset_library', id);

  const payload = {
    id,
    status,
    name: asset.name.slice(0, 96) || 'asset',
    folder: asset.folder.slice(0, 64) || 'overdrive',
    kind: asset.kind,
    dataUrlOrPath: asset.dataUrlOrPath,
    mimeType: (asset.mimeType || 'image/webp').slice(0, 64),
    sizeBytes: Math.max(0, Math.min(50000000, Math.floor(asset.sizeBytes || 0))),
    tags: (asset.tags || []).slice(0, 10),
    updatedByUid: user.uid.slice(0, 128),
    updatedAt: serverTimestamp(),
  };

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, {
        ...payload,
        createdByUid: user.uid.slice(0, 128),
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(docRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deletePublishedDevAssetFromCloud(assetId: string): Promise<void> {
  const id = sanitizeSlugId(assetId, 64);
  const docPath = `dev_asset_library/${id}`;
  try {
    await deleteDoc(doc(db, 'dev_asset_library', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}
