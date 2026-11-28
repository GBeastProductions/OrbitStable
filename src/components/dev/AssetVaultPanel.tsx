import React, { useMemo, useRef, useState } from 'react';
import { FolderOpen, ImagePlus, Layers, Music, Search, Trash2, Upload } from 'lucide-react';
import { BUILTIN_STUDIO_PNGS, builtinPngToAssetItem } from '../../data/studioBuiltinAssets';
import { compressImageToDataUrl, saveCustomAudioBytes } from '../../store/mediaVaultStore';
import { DevAssetItem } from '../../types/game';

const FOLDERS = ['all', 'overdrive', 'themes', 'songs', 'ornaments', 'audio'] as const;
type CatalogTab = 'builtin' | 'vault';
type BuiltinPackFilter = 'all' | 'christmas' | 'krampus' | 'sakura' | 'backdrops';

interface AssetVaultPanelProps {
  assets: DevAssetItem[];
  onUpsertAsset: (asset: DevAssetItem) => void;
  onDeleteAsset: (assetId: string) => void;
  onPlaceDecorFromAsset?: (asset: DevAssetItem) => void;
  onAssignToOverdrive?: (asset: DevAssetItem) => void;
  onAssignToThemeBackdrop?: (asset: DevAssetItem) => void;
  onAssignToThemeOrnament?: (asset: DevAssetItem) => void;
}

export const AssetVaultPanel: React.FC<AssetVaultPanelProps> = ({
  assets,
  onUpsertAsset,
  onDeleteAsset,
  onPlaceDecorFromAsset,
  onAssignToOverdrive,
  onAssignToThemeBackdrop,
  onAssignToThemeOrnament,
}) => {
  const [catalogTab, setCatalogTab] = useState<CatalogTab>('builtin');
  const [builtinPack, setBuiltinPack] = useState<BuiltinPackFilter>('christmas');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [uploadFolder, setUploadFolder] = useState<string>('ornaments');
  const [busyMsg, setBusyMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const filteredBuiltin = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return BUILTIN_STUDIO_PNGS.filter((item) => {
      if (builtinPack !== 'all' && item.pack !== builtinPack) return false;
      if (!q) return true;
      return item.name.toLowerCase().includes(q) || item.pack.toLowerCase().includes(q);
    });
  }, [builtinPack, searchQuery]);

  const filteredVault = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return assets.filter((a) => {
      if (activeFolder !== 'all' && a.folder !== activeFolder) return false;
      if (!q) return true;
      return a.name.toLowerCase().includes(q);
    });
  }, [assets, activeFolder, searchQuery]);

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusyMsg('Processing & compressing...');
    try {
      for (const file of Array.from(files)) {
        const isAudio =
          file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(file.name);
        const safeId = `asset_${Date.now()}_${file.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .slice(0, 24)}`;

        if (isAudio) {
          const buf = await file.arrayBuffer();
          await saveCustomAudioBytes(safeId, buf);
          onUpsertAsset({
            id: safeId,
            status: 'draft',
            name: file.name,
            folder: uploadFolder === 'overdrive' ? 'audio' : uploadFolder,
            kind: 'audio',
            dataUrlOrPath: `idb://${safeId}`,
            mimeType: file.type || 'audio/mpeg',
            sizeBytes: buf.byteLength,
            updatedAtIso: new Date().toISOString(),
          });
        } else {
          const compressed = await compressImageToDataUrl(file, 1024, 210000);
          onUpsertAsset({
            id: safeId,
            status: 'draft',
            name: file.name,
            folder: uploadFolder,
            kind: 'image',
            dataUrlOrPath: compressed.dataUrl,
            mimeType: compressed.mimeType,
            sizeBytes: compressed.dataUrl.length,
            updatedAtIso: new Date().toISOString(),
          });
        }
      }
      setCatalogTab('vault');
    } finally {
      setBusyMsg(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3 text-xs text-slate-200">
      {/* Top Importer + Search */}
      <div className="border border-slate-700 bg-slate-800/80 p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#38BDF8]">
            Game PNGs &amp; Asset Vault
          </span>
          <span className="tabular-nums font-mono text-[10px] text-slate-400">
            {BUILTIN_STUDIO_PNGS.length} Built-In · {assets.length} Vault
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setCatalogTab('builtin')}
            className={`border py-1.5 font-mono text-[10px] font-extrabold uppercase cursor-pointer ${
              catalogTab === 'builtin'
                ? 'border-[#38BDF8] bg-[#38BDF8] text-slate-950'
                : 'border-slate-600 bg-slate-900 text-slate-300 hover:text-white'
            }`}
          >
            Game PNGs ({BUILTIN_STUDIO_PNGS.length})
          </button>
          <button
            type="button"
            onClick={() => setCatalogTab('vault')}
            className={`border py-1.5 font-mono text-[10px] font-extrabold uppercase cursor-pointer ${
              catalogTab === 'vault'
                ? 'border-[#38BDF8] bg-[#38BDF8] text-slate-950'
                : 'border-slate-600 bg-slate-900 text-slate-300 hover:text-white'
            }`}
          >
            Uploaded Vault ({assets.length})
          </button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search individual PNGs..."
            className="w-full border border-slate-600 bg-slate-900 pl-7 pr-2 py-1 text-[11px] text-white placeholder-slate-500 outline-none focus:border-[#38BDF8]"
          />
        </div>

        <div className="flex items-center gap-2 pt-0.5">
          <select
            value={uploadFolder}
            onChange={(e) => setUploadFolder(e.target.value)}
            className="flex-1 border border-slate-600 bg-slate-900 px-2 py-1.5 text-[11px] text-white"
          >
            {FOLDERS.filter((f) => f !== 'all').map((f) => (
              <option key={f} value={f}>
                Upload to /{f}/
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 border border-[#38BDF8]/60 bg-[#38BDF8]/15 px-3 py-1.5 font-bold text-[#38BDF8] hover:bg-[#38BDF8]/25 cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Import File</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/svg+xml,audio/*"
            className="hidden"
            onChange={(e) => void handleFilesSelected(e.target.files)}
          />
        </div>
        {busyMsg && <p className="font-mono text-[10px] text-amber-300">{busyMsg}</p>}
      </div>

      {catalogTab === 'builtin' ? (
        <>
          {/* Built-In Sprite Pack Filter */}
          <div className="flex flex-wrap gap-1">
            {(
              [
                { id: 'christmas', label: 'Christmas' },
                { id: 'krampus', label: 'Krampus' },
                { id: 'sakura', label: 'Sakura' },
                { id: 'backdrops', label: 'Scenes' },
                { id: 'all', label: 'All' },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setBuiltinPack(p.id)}
                className={`border px-2 py-1 font-mono text-[10px] uppercase cursor-pointer ${
                  builtinPack === p.id
                    ? 'border-[#38BDF8] bg-[#38BDF8]/20 text-white font-bold'
                    : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2">
            {filteredBuiltin.map((item) => {
              const asAsset = builtinPngToAssetItem(item);
              return (
                <div
                  key={item.id}
                  className="border border-slate-700 bg-slate-800/70 p-2 space-y-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden border border-slate-600"
                      style={{
                        backgroundImage:
                          'linear-gradient(45deg, #0f172a 25%, #1e293b 25%, #1e293b 50%, #0f172a 50%, #0f172a 75%, #1e293b 75%, #1e293b 100%)',
                        backgroundSize: '12px 12px',
                      }}
                    >
                      <img
                        src={item.url}
                        alt={item.name}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[11px] font-bold text-white">
                        {item.name}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] uppercase text-slate-400">
                        {item.pack} · /{item.folder}/
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    {onPlaceDecorFromAsset && (
                      <button
                        type="button"
                        onClick={() => onPlaceDecorFromAsset(asAsset)}
                        className="flex items-center justify-center gap-1 border border-[#38BDF8]/70 bg-[#38BDF8]/20 px-1.5 py-1 text-[10px] font-extrabold text-[#7dd3fc] hover:bg-[#38BDF8]/35 cursor-pointer"
                      >
                        <Layers className="h-3 w-3" />
                        <span>+ Place on Stage</span>
                      </button>
                    )}
                    {onAssignToOverdrive && (
                      <button
                        type="button"
                        onClick={() => onAssignToOverdrive(asAsset)}
                        className="flex items-center justify-center gap-1 border border-slate-600 bg-slate-900 px-1.5 py-1 text-[10px] font-semibold text-amber-300 hover:border-amber-400 cursor-pointer"
                      >
                        <ImagePlus className="h-3 w-3" />
                        <span>+ Overdrive</span>
                      </button>
                    )}
                    {onAssignToThemeBackdrop && (
                      <button
                        type="button"
                        onClick={() => onAssignToThemeBackdrop(asAsset)}
                        className="border border-slate-600 bg-slate-900 px-1.5 py-1 text-[10px] font-semibold text-sky-300 hover:border-sky-400 cursor-pointer"
                      >
                        Set Backdrop
                      </button>
                    )}
                    {onAssignToThemeOrnament && (
                      <button
                        type="button"
                        onClick={() => onAssignToThemeOrnament(asAsset)}
                        className="border border-slate-600 bg-slate-900 px-1.5 py-1 text-[10px] font-semibold text-pink-300 hover:border-pink-400 cursor-pointer"
                      >
                        Set Ornament
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          {/* Folder Tabs */}
          <div className="flex flex-wrap gap-1">
            {FOLDERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setActiveFolder(f)}
                className={`flex items-center gap-1 border px-2 py-1 font-mono text-[10px] uppercase cursor-pointer ${
                  activeFolder === f
                    ? 'border-[#38BDF8] bg-[#38BDF8]/20 text-white'
                    : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <FolderOpen className="h-3 w-3" />
                <span>{f}</span>
              </button>
            ))}
          </div>

          {/* Vault Asset List */}
          <div className="space-y-2">
            {filteredVault.length === 0 ? (
              <div className="border border-dashed border-slate-700 bg-slate-900/60 p-4 text-center text-[11px] text-slate-400">
                No uploaded assets in /{activeFolder}/. Import PNG, WebP, SVG, or MP3 files above.
              </div>
            ) : (
              filteredVault.map((asset) => (
                <div
                  key={asset.id}
                  className="border border-slate-700 bg-slate-800/70 p-2.5 space-y-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden border border-slate-600 bg-slate-950">
                      {asset.kind === 'image' ? (
                        <img
                          src={asset.dataUrlOrPath}
                          alt={asset.name}
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <Music className="h-5 w-5 text-[#38BDF8]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-white">{asset.name}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-slate-400">
                        <select
                          value={asset.folder}
                          onChange={(e) =>
                            onUpsertAsset({ ...asset, folder: e.target.value, status: 'draft' })
                          }
                          className="border border-slate-600 bg-slate-900 px-1 py-0.5 font-mono text-[10px] text-slate-200"
                        >
                          {FOLDERS.filter((f) => f !== 'all').map((f) => (
                            <option key={f} value={f}>
                              /{f}/
                            </option>
                          ))}
                        </select>
                        <span className="tabular-nums font-mono">
                          {Math.round((asset.sizeBytes || 0) / 1024)} KB
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteAsset(asset.id)}
                      className="border border-rose-500/40 bg-rose-950/40 p-1.5 text-rose-300 hover:bg-rose-900/60 cursor-pointer"
                      title="Delete Asset"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {asset.kind === 'image' && (
                    <div className="grid grid-cols-2 gap-1">
                      {onPlaceDecorFromAsset && (
                        <button
                          type="button"
                          onClick={() => onPlaceDecorFromAsset(asset)}
                          className="flex items-center justify-center gap-1 border border-[#38BDF8]/70 bg-[#38BDF8]/20 px-1.5 py-1 text-[10px] font-extrabold text-[#7dd3fc] hover:bg-[#38BDF8]/35 cursor-pointer"
                        >
                          <Layers className="h-3 w-3" />
                          <span>+ Place on Stage</span>
                        </button>
                      )}
                      {onAssignToOverdrive && (
                        <button
                          type="button"
                          onClick={() => onAssignToOverdrive(asset)}
                          className="flex items-center justify-center gap-1 border border-slate-600 bg-slate-900 px-1.5 py-1 text-[10px] font-semibold text-amber-300 hover:border-amber-400 cursor-pointer"
                        >
                          <ImagePlus className="h-3 w-3" />
                          <span>+ Overdrive</span>
                        </button>
                      )}
                      {onAssignToThemeBackdrop && (
                        <button
                          type="button"
                          onClick={() => onAssignToThemeBackdrop(asset)}
                          className="border border-slate-600 bg-slate-900 px-1.5 py-1 text-[10px] font-semibold text-sky-300 hover:border-sky-400 cursor-pointer"
                        >
                          Set Backdrop
                        </button>
                      )}
                      {onAssignToThemeOrnament && (
                        <button
                          type="button"
                          onClick={() => onAssignToThemeOrnament(asset)}
                          className="border border-slate-600 bg-slate-900 px-1.5 py-1 text-[10px] font-semibold text-pink-300 hover:border-pink-400 cursor-pointer"
                        >
                          Set Ornament
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
