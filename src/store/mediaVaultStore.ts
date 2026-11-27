/**
 * Persistent IndexedDB Media Vault for custom uploaded MP3 audio buffers
 * and local high-res draft assets so imported songs never lose their audio on reload.
 */

const DB_NAME = 'orbit_media_vault_v1';
const STORE_AUDIO = 'audio_blobs';

function openVaultDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_AUDIO)) {
        db.createObjectStore(STORE_AUDIO);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Failed to open IndexedDB'));
  });
}

export async function saveCustomAudioBytes(songId: string, bytes: ArrayBuffer): Promise<void> {
  try {
    const db = await openVaultDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_AUDIO, 'readwrite');
      tx.objectStore(STORE_AUDIO).put(bytes.slice(0), songId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (err) {
    console.warn('Could not persist custom MP3 in IndexedDB:', err);
  }
}

export async function loadCustomAudioBytes(songId: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openVaultDb();
    const res = await new Promise<ArrayBuffer | null>((resolve, reject) => {
      const tx = db.transaction(STORE_AUDIO, 'readonly');
      const req = tx.objectStore(STORE_AUDIO).get(songId);
      req.onsuccess = () => {
        const val = req.result;
        resolve(val instanceof ArrayBuffer ? val.slice(0) : null);
      };
      req.onerror = () => reject(req.error);
    });
    db.close();
    return res;
  } catch {
    return null;
  }
}

export async function deleteCustomAudioBytes(songId: string): Promise<void> {
  try {
    const db = await openVaultDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_AUDIO, 'readwrite');
      tx.objectStore(STORE_AUDIO).delete(songId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Compresses an uploaded PNG/JPG/WebP/SVG file to fit comfortably inside
 * Firestore volumetric bounds (< 240 KB data URL) while keeping sharp alpha transparency.
 */
export async function compressImageToDataUrl(
  file: File,
  maxDimension = 960,
  targetMaxChars = 220000,
): Promise<{ dataUrl: string; mimeType: string; width: number; height: number }> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error || new Error('Image read failed'));
    reader.readAsDataURL(file);
  });

  if (file.type === 'image/svg+xml' && rawDataUrl.length <= targetMaxChars) {
    return { dataUrl: rawDataUrl, mimeType: file.type, width: 512, height: 512 };
  }

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Invalid image file'));
    el.src = rawDataUrl;
  });

  const scale = Math.min(1, maxDimension / Math.max(1, img.naturalWidth, img.naturalHeight));
  const w = Math.max(16, Math.round(img.naturalWidth * scale));
  const h = Math.max(16, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { dataUrl: rawDataUrl.slice(0, targetMaxChars), mimeType: file.type, width: w, height: h };
  }
  ctx.drawImage(img, 0, 0, w, h);

  // Preserve transparency cleanly with WebP (or PNG fallback)
  let quality = 0.86;
  let encoded = canvas.toDataURL('image/webp', quality);
  while (encoded.length > targetMaxChars && quality > 0.35) {
    quality -= 0.12;
    encoded = canvas.toDataURL('image/webp', quality);
  }
  if (encoded.length > targetMaxChars) {
    const halfCanvas = document.createElement('canvas');
    halfCanvas.width = Math.max(16, Math.round(w * 0.6));
    halfCanvas.height = Math.max(16, Math.round(h * 0.6));
    const hCtx = halfCanvas.getContext('2d');
    if (hCtx) {
      hCtx.drawImage(canvas, 0, 0, halfCanvas.width, halfCanvas.height);
      encoded = halfCanvas.toDataURL('image/webp', 0.72);
    }
  }
  return {
    dataUrl: encoded,
    mimeType: encoded.startsWith('data:image/webp') ? 'image/webp' : 'image/png',
    width: w,
    height: h,
  };
}
