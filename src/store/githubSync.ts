import { DevAssetItem, EditableThemePayload, PublishedHudLayout, SongDefinition } from '../types/game';

export interface GitHubFileEntry {
  path: string;
  content: string;
  encoding: 'utf-8' | 'base64';
}

export interface StudioExportManifest {
  exportedAtIso: string;
  songs: SongDefinition[];
  themes: EditableThemePayload[];
  hudLayouts: PublishedHudLayout[];
  assets: DevAssetItem[];
}

export interface GitHubDevConfig {
  repo: string;
  branch: string;
  pat: string;
  autoPushOnSave: boolean;
}

const GITHUB_CFG_KEY = 'orbit_dev_github_config_v1';

export const DEFAULT_GITHUB_CONFIG: GitHubDevConfig = {
  repo: 'GBeastProductions/Orbit-V2',
  branch: 'main',
  pat: '',
  autoPushOnSave: false,
};

export function loadGitHubDevConfig(): GitHubDevConfig {
  try {
    const raw = window.localStorage.getItem(GITHUB_CFG_KEY);
    if (!raw) return { ...DEFAULT_GITHUB_CONFIG };
    const parsed = JSON.parse(raw) as Partial<GitHubDevConfig>;
    return {
      repo: (parsed.repo || DEFAULT_GITHUB_CONFIG.repo).trim(),
      branch: (parsed.branch || DEFAULT_GITHUB_CONFIG.branch).trim() || 'main',
      pat: (parsed.pat || '').trim(),
      autoPushOnSave: Boolean(parsed.autoPushOnSave),
    };
  } catch {
    return { ...DEFAULT_GITHUB_CONFIG };
  }
}

export function saveGitHubDevConfig(cfg: GitHubDevConfig): void {
  try {
    window.localStorage.setItem(
      GITHUB_CFG_KEY,
      JSON.stringify({
        repo: cfg.repo.trim() || DEFAULT_GITHUB_CONFIG.repo,
        branch: cfg.branch.trim() || 'main',
        pat: cfg.pat.trim(),
        autoPushOnSave: Boolean(cfg.autoPushOnSave),
      }),
    );
  } catch {
    // Ignore quota error
  }
}

export function buildStudioRepoFiles(manifest: StudioExportManifest): GitHubFileEntry[] {
  const files: GitHubFileEntry[] = [];

  files.push({
    path: 'public/assets/studio/published_catalog.json',
    encoding: 'utf-8',
    content: JSON.stringify(
      {
        exportedAtIso: manifest.exportedAtIso,
        songs: manifest.songs,
        themes: manifest.themes,
        hudLayouts: manifest.hudLayouts,
      },
      null,
      2,
    ),
  });

  // Also emit individual asset files for clean folder organization in GitHub
  for (const asset of manifest.assets) {
    const safeFolder =
      asset.folder.replace(/[^a-zA-Z0-9_\-/]/g, '').replace(/^\/+|\/+$/g, '') || 'misc';
    const safeName = asset.name.replace(/[^a-zA-Z0-9_\-.]/g, '_');
    if (asset.dataUrlOrPath.startsWith('data:')) {
      const commaIdx = asset.dataUrlOrPath.indexOf(',');
      if (commaIdx > 0) {
        const meta = asset.dataUrlOrPath.slice(5, commaIdx);
        const rawB64 = asset.dataUrlOrPath.slice(commaIdx + 1);
        const ext = meta.includes('webp')
          ? 'webp'
          : meta.includes('png')
          ? 'png'
          : meta.includes('svg')
          ? 'svg'
          : meta.includes('mpeg') || meta.includes('mp3')
          ? 'mp3'
          : 'jpg';
        const finalName = safeName.includes('.') ? safeName : `${safeName}.${ext}`;
        files.push({
          path: `public/assets/studio/${safeFolder}/${finalName}`,
          encoding: 'base64',
          content: rawB64,
        });
      }
    }
  }

  return files;
}

function validateSafeGitHubPaths(files: GitHubFileEntry[]): string | null {
  for (const f of files) {
    const cleanPath = String(f.path || '').replace(/\\/g, '/').trim();
    if (
      !cleanPath ||
      cleanPath.includes('..') ||
      cleanPath.startsWith('/') ||
      cleanPath.includes('\0') ||
      !/^(public\/assets\/studio|src\/studio|src\/shaders)\/[a-zA-Z0-9_\-./]+$/.test(cleanPath)
    ) {
      return `Disallowed studio path: ${cleanPath}`;
    }
  }
  return null;
}

export async function verifyGitHubTokenDirect(
  cfg: GitHubDevConfig,
): Promise<{ ok: boolean; permissions?: string; error?: string }> {
  const repo = cfg.repo.trim();
  const pat = cfg.pat.trim();
  if (!repo || !repo.includes('/')) {
    return { ok: false, error: 'Repository must be in owner/repo format (e.g. GBeastProductions/Orbit-V2).' };
  }
  if (!pat) {
    return { ok: false, error: 'Enter a Fine-Grained GitHub Personal Access Token first.' };
  }
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: {
        Authorization: `Bearer ${pat}`,
        Accept: 'application/vnd.github+json',
      },
    });
    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, error: `GitHub returned HTTP ${res.status}: ${txt.slice(0, 140)}` };
    }
    const data = (await res.json()) as {
      full_name?: string;
      permissions?: { push?: boolean; admin?: boolean };
    };
    if (!data.permissions?.push && !data.permissions?.admin) {
      return {
        ok: false,
        error: `Token authenticated on ${data.full_name || repo}, but lacks Contents: Read & write push permission.`,
      };
    }
    return {
      ok: true,
      permissions: `Push access verified on ${data.full_name || repo} (${cfg.branch})`,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'GitHub connection failed.' };
  }
}

export async function pushStudioChangesToGitHubDirect(
  cfg: GitHubDevConfig,
  files: GitHubFileEntry[],
  commitMessage: string,
): Promise<{ ok: boolean; commitSha?: string; commitUrl?: string; error?: string }> {
  const repo = cfg.repo.trim();
  const branch = cfg.branch.trim() || 'main';
  const pat = cfg.pat.trim();
  if (!repo || !pat) {
    return { ok: false, error: 'Missing GitHub repository or Personal Access Token.' };
  }
  const pathErr = validateSafeGitHubPaths(files);
  if (pathErr) {
    return { ok: false, error: pathErr };
  }

  const ghHeaders = {
    Authorization: `Bearer ${pat}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
  };
  const apiBase = `https://api.github.com/repos/${repo}`;

  try {
    const refRes = await fetch(`${apiBase}/git/ref/heads/${encodeURIComponent(branch)}`, {
      headers: ghHeaders,
    });
    if (!refRes.ok) {
      const txt = await refRes.text();
      return { ok: false, error: `GitHub branch lookup (${branch}) failed: ${txt.slice(0, 140)}` };
    }
    const refData = (await refRes.json()) as { object?: { sha?: string } };
    const baseCommitSha = refData.object?.sha;
    if (!baseCommitSha) {
      return { ok: false, error: 'GitHub base commit SHA missing.' };
    }

    const commitRes = await fetch(`${apiBase}/git/commits/${baseCommitSha}`, { headers: ghHeaders });
    if (!commitRes.ok) {
      return { ok: false, error: 'GitHub base commit lookup failed.' };
    }
    const commitData = (await commitRes.json()) as { tree?: { sha?: string } };
    const baseTreeSha = commitData.tree?.sha;
    if (!baseTreeSha) {
      return { ok: false, error: 'GitHub base tree SHA missing.' };
    }

    const treeEntries: { path: string; mode: string; type: string; sha: string }[] = [];
    for (const file of files) {
      const blobRes = await fetch(`${apiBase}/git/blobs`, {
        method: 'POST',
        headers: ghHeaders,
        body: JSON.stringify({ content: file.content, encoding: file.encoding }),
      });
      if (!blobRes.ok) {
        const txt = await blobRes.text();
        return { ok: false, error: `Blob upload failed for ${file.path}: ${txt.slice(0, 120)}` };
      }
      const blobData = (await blobRes.json()) as { sha: string };
      treeEntries.push({
        path: file.path.replace(/\\/g, '/').trim(),
        mode: '100644',
        type: 'blob',
        sha: blobData.sha,
      });
    }

    const treeRes = await fetch(`${apiBase}/git/trees`, {
      method: 'POST',
      headers: ghHeaders,
      body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries }),
    });
    if (!treeRes.ok) {
      return { ok: false, error: 'GitHub tree creation failed.' };
    }
    const treeData = (await treeRes.json()) as { sha: string };

    const newCommitRes = await fetch(`${apiBase}/git/commits`, {
      method: 'POST',
      headers: ghHeaders,
      body: JSON.stringify({
        message: commitMessage.slice(0, 140),
        tree: treeData.sha,
        parents: [baseCommitSha],
      }),
    });
    if (!newCommitRes.ok) {
      return { ok: false, error: 'GitHub commit creation failed.' };
    }
    const newCommitData = (await newCommitRes.json()) as { sha: string; html_url?: string };

    const updateRefRes = await fetch(`${apiBase}/git/refs/heads/${encodeURIComponent(branch)}`, {
      method: 'PATCH',
      headers: ghHeaders,
      body: JSON.stringify({ sha: newCommitData.sha }),
    });
    if (!updateRefRes.ok) {
      return { ok: false, error: 'GitHub branch ref update failed.' };
    }

    return {
      ok: true,
      commitSha: newCommitData.sha,
      commitUrl: newCommitData.html_url || `https://github.com/${repo}/commit/${newCommitData.sha}`,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Direct browser GitHub push failed.',
    };
  }
}

export async function pushStudioChangesToGitHub(
  firebaseIdToken: string,
  files: GitHubFileEntry[],
  commitMessage: string,
): Promise<{ ok: boolean; commitSha?: string; commitUrl?: string; error?: string }> {
  try {
    const res = await fetch('/api/github/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${firebaseIdToken}`,
      },
      body: JSON.stringify({
        commitMessage: commitMessage.slice(0, 140),
        files,
      }),
    });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        error: 'Server proxy unavailable on static hosting. Configure a Fine-Grained GitHub PAT in Dev Studio to push directly from browser.',
      };
    }
    const data = (await res.json()) as {
      ok?: boolean;
      commitSha?: string;
      commitUrl?: string;
      error?: string;
    };
    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || `GitHub push failed (HTTP ${res.status})` };
    }
    return { ok: true, commitSha: data.commitSha, commitUrl: data.commitUrl };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `${err.message} (Configure a browser Fine-Grained PAT or download Patch Bundle on GitHub Pages.)`
          : 'GitHub push proxy unreachable.',
    };
  }
}

export async function pushStudioChangesToGitHubSmart(
  firebaseIdToken: string | null,
  files: GitHubFileEntry[],
  commitMessage: string,
): Promise<{ ok: boolean; mode?: 'direct' | 'proxy'; commitSha?: string; commitUrl?: string; error?: string }> {
  const cfg = loadGitHubDevConfig();
  if (cfg.pat) {
    const directRes = await pushStudioChangesToGitHubDirect(cfg, files, commitMessage);
    if (directRes.ok) {
      return { ...directRes, mode: 'direct' };
    }
    if (!firebaseIdToken) {
      return { ...directRes, mode: 'direct' };
    }
  }
  if (firebaseIdToken) {
    const proxyRes = await pushStudioChangesToGitHub(firebaseIdToken, files, commitMessage);
    if (proxyRes.ok) {
      return { ...proxyRes, mode: 'proxy' };
    }
    if (!cfg.pat) {
      return { ...proxyRes, mode: 'proxy' };
    }
  }
  return {
    ok: false,
    error: 'Add your Fine-Grained GitHub PAT in Publish & GitHub Sync to push edits directly to GitHub.',
  };
}

export function downloadStudioPatchBundle(manifest: StudioExportManifest): void {
  const files = buildStudioRepoFiles(manifest);
  const bundle = {
    format: 'orbit-studio-patch-v1',
    exportedAtIso: manifest.exportedAtIso,
    instructions:
      'Extract these files directly into your ORBIT repository root and commit/push to publish statically on GitHub Pages.',
    fileCount: files.length,
    files,
  };
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `orbit-studio-patch-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
