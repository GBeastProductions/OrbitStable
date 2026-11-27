import React, { useState } from 'react';
import { CheckCircle2, CloudUpload, Download, GitBranch, KeyRound, RotateCcw } from 'lucide-react';
import { auth } from '../../firebase';
import {
  buildStudioRepoFiles,
  downloadStudioPatchBundle,
  GitHubDevConfig,
  loadGitHubDevConfig,
  pushStudioChangesToGitHubSmart,
  saveGitHubDevConfig,
  verifyGitHubTokenDirect,
} from '../../store/githubSync';
import {
  DevAssetItem,
  EditableThemePayload,
  PublishedHudLayout,
  SongDefinition,
} from '../../types/game';

interface PublishSyncPanelProps {
  draftSongsCount: number;
  draftThemesCount: number;
  hasDraftHud: boolean;
  draftAssetsCount: number;
  exportSongs: SongDefinition[];
  exportThemes: EditableThemePayload[];
  hudLayout: PublishedHudLayout;
  assets: DevAssetItem[];
  onPublishAllCloud: () => Promise<string>;
  onDiscardDrafts: () => void;
}

export const PublishSyncPanel: React.FC<PublishSyncPanelProps> = ({
  draftSongsCount,
  draftThemesCount,
  hasDraftHud,
  draftAssetsCount,
  exportSongs,
  exportThemes,
  hudLayout,
  assets,
  onPublishAllCloud,
  onDiscardDrafts,
}) => {
  const [ghConfig, setGhConfig] = useState<GitHubDevConfig>(() => loadGitHubDevConfig());
  const [commitMessage, setCommitMessage] = useState('ORBIT Dev Studio publish');
  const [busy, setBusy] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);
  const [commitUrl, setCommitUrl] = useState<string | null>(null);

  const totalPending =
    draftSongsCount + draftThemesCount + (hasDraftHud ? 1 : 0) + draftAssetsCount;

  const updateGhConfig = (patch: Partial<GitHubDevConfig>) => {
    const next = { ...ghConfig, ...patch };
    setGhConfig(next);
    saveGitHubDevConfig(next);
  };

  const runGitHubPush = async (): Promise<{
    ok: boolean;
    message: string;
    url?: string;
  }> => {
    const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;
    const files = buildStudioRepoFiles({
      exportedAtIso: new Date().toISOString(),
      songs: exportSongs,
      themes: exportThemes,
      hudLayouts: [hudLayout],
      assets,
    });
    const res = await pushStudioChangesToGitHubSmart(token, files, commitMessage);
    if (res.ok) {
      return {
        ok: true,
        message: `Pushed commit ${res.commitSha?.slice(0, 7) || ''} (${res.mode === 'direct' ? 'GitHub API' : 'Server Proxy'})`,
        url: res.commitUrl,
      };
    }
    return { ok: false, message: res.error || 'GitHub push failed.' };
  };

  const handleCloudPublish = async () => {
    setBusy(true);
    setResultMsg(null);
    setCommitUrl(null);
    try {
      const msg = await onPublishAllCloud();
      if (ghConfig.autoPushOnSave && ghConfig.pat.trim()) {
        const pushRes = await runGitHubPush();
        setResultMsg(`${msg} · ${pushRes.message}`);
        if (pushRes.url) setCommitUrl(pushRes.url);
      } else {
        setResultMsg(msg);
      }
    } catch (err) {
      setResultMsg(err instanceof Error ? err.message : 'Firebase publish failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleGitHubPush = async () => {
    setBusy(true);
    setResultMsg(null);
    setCommitUrl(null);
    try {
      const pushRes = await runGitHubPush();
      setResultMsg(pushRes.message);
      if (pushRes.url) setCommitUrl(pushRes.url);
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyPat = async () => {
    setVerifyMsg('Verifying repository push access...');
    const res = await verifyGitHubTokenDirect(ghConfig);
    setVerifyMsg(res.ok ? res.permissions || 'Token verified.' : res.error || 'Verification failed.');
  };

  const handleDownloadPatch = () => {
    downloadStudioPatchBundle({
      exportedAtIso: new Date().toISOString(),
      songs: exportSongs,
      themes: exportThemes,
      hudLayouts: [hudLayout],
      assets,
    });
    setResultMsg('Downloaded static GitHub patch bundle (.json).');
  };

  return (
    <div className="space-y-3 text-xs text-slate-200">
      <div className="border border-slate-700 bg-slate-800/80 p-3 space-y-2">
        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#38BDF8]">
          Publish Live &amp; GitHub Auto-Push
        </span>

        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          <div className="border border-slate-700 bg-slate-900 px-2.5 py-1.5 flex justify-between">
            <span className="text-slate-400">Draft Songs</span>
            <span className="tabular-nums font-bold text-white">{draftSongsCount}</span>
          </div>
          <div className="border border-slate-700 bg-slate-900 px-2.5 py-1.5 flex justify-between">
            <span className="text-slate-400">Draft Themes</span>
            <span className="tabular-nums font-bold text-white">{draftThemesCount}</span>
          </div>
          <div className="border border-slate-700 bg-slate-900 px-2.5 py-1.5 flex justify-between">
            <span className="text-slate-400">HUD Layout</span>
            <span className="font-bold text-white">{hasDraftHud ? 'Modified' : 'Synced'}</span>
          </div>
          <div className="border border-slate-700 bg-slate-900 px-2.5 py-1.5 flex justify-between">
            <span className="text-slate-400">Draft Assets</span>
            <span className="tabular-nums font-bold text-white">{draftAssetsCount}</span>
          </div>
        </div>
      </div>

      {/* Firebase Live Publish */}
      <div className="border border-slate-700 bg-slate-800/65 p-3 space-y-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleCloudPublish()}
          className="flex w-full items-center justify-center gap-2 border border-emerald-400/70 bg-emerald-500/20 py-2.5 font-bold text-emerald-200 hover:bg-emerald-500/30 disabled:opacity-50 cursor-pointer"
        >
          <CloudUpload className="h-4 w-4" />
          <span>
            {busy ? 'Publishing...' : `Publish Live to Firebase (${totalPending} pending)`}
          </span>
        </button>
        <p className="text-[10px] text-slate-400">
          Updates songs, themes, GLSL shaders, Overdrive VFX, HUD layout, and compressed assets in real time across Firebase &amp; GitHub Pages.
        </p>
      </div>

      {/* Direct Browser GitHub REST Push + Server Proxy */}
      <div className="border border-slate-700 bg-slate-800/65 p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase text-[#38BDF8]">
            <KeyRound className="h-3 w-3" /> GitHub Repo Sync (Pages + Local)
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <label className="col-span-2 space-y-0.5">
            <span className="text-[10px] text-slate-400">Owner / Repo</span>
            <input
              type="text"
              value={ghConfig.repo}
              onChange={(e) => updateGhConfig({ repo: e.target.value })}
              placeholder="GBeastProductions/Orbit-V2"
              className="w-full border border-slate-600 bg-slate-900 px-2 py-1 font-mono text-[11px] text-white"
            />
          </label>
          <label className="space-y-0.5">
            <span className="text-[10px] text-slate-400">Branch</span>
            <input
              type="text"
              value={ghConfig.branch}
              onChange={(e) => updateGhConfig({ branch: e.target.value })}
              placeholder="main"
              className="w-full border border-slate-600 bg-slate-900 px-2 py-1 font-mono text-[11px] text-white"
            />
          </label>
        </div>

        <div className="space-y-1">
          <span className="text-[10px] text-slate-400">
            Fine-Grained PAT (Contents: Read &amp; Write · stored locally)
          </span>
          <div className="flex gap-1.5">
            <input
              type="password"
              value={ghConfig.pat}
              onChange={(e) => updateGhConfig({ pat: e.target.value })}
              placeholder="github_pat_..."
              className="flex-1 border border-slate-600 bg-slate-900 px-2 py-1 font-mono text-[11px] text-white"
            />
            <button
              type="button"
              onClick={() => void handleVerifyPat()}
              className="flex items-center gap-1 border border-slate-600 bg-slate-900 px-2.5 py-1 text-[10px] font-bold text-slate-200 hover:border-[#38BDF8] cursor-pointer whitespace-nowrap"
            >
              <CheckCircle2 className="h-3 w-3 text-[#38BDF8]" />
              <span>Verify</span>
            </button>
          </div>
          {verifyMsg && (
            <p className="font-mono text-[10px] text-[#38BDF8]">{verifyMsg}</p>
          )}
        </div>

        <label className="flex items-center justify-between border border-slate-700 bg-slate-900 px-2.5 py-1.5 cursor-pointer">
          <span className="text-[10px] font-semibold text-slate-200">
            Auto-Push to GitHub on Publish
          </span>
          <input
            type="checkbox"
            checked={ghConfig.autoPushOnSave}
            onChange={(e) => updateGhConfig({ autoPushOnSave: e.target.checked })}
            className="accent-[#38BDF8]"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-[10px] text-slate-400">Commit Message</span>
          <input
            type="text"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            className="w-full border border-slate-600 bg-slate-900 px-2 py-1 text-white"
          />
        </label>

        <button
          type="button"
          disabled={busy}
          onClick={() => void handleGitHubPush()}
          className="flex w-full items-center justify-center gap-2 border border-[#38BDF8]/70 bg-[#38BDF8]/20 py-2 font-bold text-white hover:bg-[#38BDF8]/30 disabled:opacity-50 cursor-pointer"
        >
          <GitBranch className="h-4 w-4 text-[#38BDF8]" />
          <span>Push Changes to GitHub Now</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadPatch}
          className="flex w-full items-center justify-center gap-2 border border-slate-600 bg-slate-900 py-1.5 font-semibold text-slate-200 hover:border-slate-400 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Download GitHub Patch Bundle (.json)</span>
        </button>
      </div>

      {resultMsg && (
        <div className="border border-[#38BDF8]/50 bg-slate-900 p-2.5 text-[11px] text-slate-100 space-y-1">
          <p>{resultMsg}</p>
          {commitUrl && (
            <a
              href={commitUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-block font-mono text-[10px] text-[#38BDF8] underline"
            >
              View Commit on GitHub
            </a>
          )}
        </div>
      )}

      {totalPending > 0 && (
        <button
          type="button"
          onClick={onDiscardDrafts}
          className="flex w-full items-center justify-center gap-1.5 border border-rose-500/40 bg-rose-950/35 py-1.5 text-[11px] font-bold text-rose-300 hover:bg-rose-950/60 cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Discard Local Unsaved Drafts</span>
        </button>
      )}
    </div>
  );
};
