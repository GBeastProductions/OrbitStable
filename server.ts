import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'orbit-arcade', timestamp: new Date().toISOString() });
  });

  app.get('/api/assets/rotation', (_req, res) => {
    try {
      const dailyDir = path.resolve(__dirname, 'public/assets/aistudio/Daily');
      const weeklyDir = path.resolve(__dirname, 'public/assets/aistudio/Weekly');

      const dailyFiles = fs.existsSync(dailyDir)
        ? fs
            .readdirSync(dailyDir)
            .filter((f) => f.toLowerCase().endsWith('.mp3'))
            .sort((a, b) => {
              const na = parseInt(a, 10);
              const nb = parseInt(b, 10);
              if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
              return a.localeCompare(b);
            })
        : [];

      const weeklyFiles = fs.existsSync(weeklyDir)
        ? fs
            .readdirSync(weeklyDir)
            .filter((f) => f.toLowerCase().endsWith('.mp3'))
            .sort((a, b) => a.localeCompare(b))
        : [];

      res.json({ dailyFiles, weeklyFiles });
    } catch (err) {
      res.status(500).json({ error: 'Failed to read asset directories', detail: String(err) });
    }
  });

  const firebaseConfigPath = path.resolve(__dirname, 'firebase-applet-config.json');
  const firebaseCfg = fs.existsSync(firebaseConfigPath)
    ? (JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8')) as {
        projectId: string;
        apiKey: string;
        firestoreDatabaseId?: string;
      })
    : null;

  async function verifyDeveloperBearer(
    authHeader?: string,
  ): Promise<{ ok: true; uid: string; email: string } | { ok: false; status: number; error: string }> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { ok: false, status: 401, error: 'Missing Firebase Bearer token.' };
    }
    const idToken = authHeader.slice(7).trim();
    if (!idToken || !firebaseCfg?.apiKey || !firebaseCfg?.projectId) {
      return { ok: false, status: 500, error: 'Server Firebase configuration missing.' };
    }

    const lookupRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(firebaseCfg.apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      },
    );
    if (!lookupRes.ok) {
      return { ok: false, status: 401, error: 'Invalid or expired Firebase ID token.' };
    }
    const lookupJson = (await lookupRes.json()) as {
      users?: { localId?: string; email?: string; emailVerified?: boolean }[];
    };
    const user = lookupJson.users?.[0];
    if (!user?.localId || !user.emailVerified) {
      return { ok: false, status: 403, error: 'Verified Google account required.' };
    }

    const email = (user.email || '').toLowerCase();
    if (email === 'studiosmobile092@gmail.com' || email === 'mobilelabscreator@gmail.com') {
      return { ok: true, uid: user.localId, email };
    }

    const dbId = firebaseCfg.firestoreDatabaseId || '(default)';
    const profileRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(firebaseCfg.projectId)}/databases/${encodeURIComponent(dbId)}/documents/user_profiles/${encodeURIComponent(user.localId)}`,
      {
        headers: { Authorization: `Bearer ${idToken}` },
      },
    );
    if (profileRes.ok) {
      const profileDoc = (await profileRes.json()) as {
        fields?: { dev?: { booleanValue?: boolean } };
      };
      if (profileDoc.fields?.dev?.booleanValue === true) {
        return { ok: true, uid: user.localId, email };
      }
    }

    const roleRes = await fetch(
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(firebaseCfg.projectId)}/databases/${encodeURIComponent(dbId)}/documents/dev_roles/${encodeURIComponent(user.localId)}`,
      {
        headers: { Authorization: `Bearer ${idToken}` },
      },
    );
    if (!roleRes.ok) {
      return { ok: false, status: 403, error: 'Account lacks developer permissions in Firebase.' };
    }
    const roleDoc = (await roleRes.json()) as {
      fields?: { role?: { stringValue?: string } };
    };
    const roleVal = roleDoc.fields?.role?.stringValue;
    if (roleVal !== 'developer' && roleVal !== 'admin') {
      return { ok: false, status: 403, error: 'Account lacks developer role.' };
    }
    return { ok: true, uid: user.localId, email };
  }

  app.post('/api/github/push', async (req, res) => {
    try {
      const authCheck = await verifyDeveloperBearer(req.headers.authorization);
      if (!authCheck.ok) {
        return res.status(authCheck.status).json({ ok: false, error: authCheck.error });
      }

      const ghToken = process.env.GITHUB_TOKEN?.trim();
      const ghRepo = process.env.GITHUB_REPO?.trim();
      const ghBranch = process.env.GITHUB_BRANCH?.trim() || 'main';
      if (!ghToken || !ghRepo) {
        return res.status(412).json({
          ok: false,
          error:
            'GITHUB_TOKEN or GITHUB_REPO is not configured in server secrets. Use Download Patch Bundle (.json) or set server env vars.',
        });
      }

      const body = req.body as {
        commitMessage?: string;
        files?: { path?: string; content?: string; encoding?: 'utf-8' | 'base64' }[];
      };
      const files = Array.isArray(body?.files) ? body.files : [];
      if (files.length === 0 || files.length > 64) {
        return res.status(400).json({ ok: false, error: 'Provide between 1 and 64 studio files.' });
      }

      const safeFiles: { path: string; content: string; encoding: 'utf-8' | 'base64' }[] = [];
      for (const f of files) {
        const cleanPath = String(f.path || '').replace(/\\/g, '/').trim();
        if (
          !cleanPath ||
          cleanPath.includes('..') ||
          cleanPath.startsWith('/') ||
          cleanPath.includes('\0') ||
          !/^(public\/assets\/studio|src\/studio|src\/shaders)\/[a-zA-Z0-9_\-./]+$/.test(cleanPath)
        ) {
          return res.status(400).json({ ok: false, error: `Disallowed path: ${cleanPath}` });
        }
        safeFiles.push({
          path: cleanPath,
          content: String(f.content ?? ''),
          encoding: f.encoding === 'base64' ? 'base64' : 'utf-8',
        });
      }

      const ghHeaders = {
        Authorization: `Bearer ${ghToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'User-Agent': 'ORBIT-Axiom-Dev-Studio',
      };
      const apiBase = `https://api.github.com/repos/${ghRepo}`;

      const refRes = await fetch(`${apiBase}/git/ref/heads/${encodeURIComponent(ghBranch)}`, {
        headers: ghHeaders,
      });
      if (!refRes.ok) {
        const txt = await refRes.text();
        return res.status(502).json({ ok: false, error: `GitHub ref lookup failed: ${txt}` });
      }
      const refData = (await refRes.json()) as { object?: { sha?: string } };
      const baseCommitSha = refData.object?.sha;
      if (!baseCommitSha) {
        return res.status(502).json({ ok: false, error: 'GitHub base commit SHA missing.' });
      }

      const commitRes = await fetch(`${apiBase}/git/commits/${baseCommitSha}`, { headers: ghHeaders });
      if (!commitRes.ok) {
        return res.status(502).json({ ok: false, error: 'GitHub base commit lookup failed.' });
      }
      const commitData = (await commitRes.json()) as { tree?: { sha?: string } };
      const baseTreeSha = commitData.tree?.sha;
      if (!baseTreeSha) {
        return res.status(502).json({ ok: false, error: 'GitHub base tree SHA missing.' });
      }

      const treeEntries: { path: string; mode: string; type: string; sha: string }[] = [];
      for (const file of safeFiles) {
        const blobRes = await fetch(`${apiBase}/git/blobs`, {
          method: 'POST',
          headers: ghHeaders,
          body: JSON.stringify({ content: file.content, encoding: file.encoding }),
        });
        if (!blobRes.ok) {
          const txt = await blobRes.text();
          return res.status(502).json({ ok: false, error: `Blob upload failed for ${file.path}: ${txt}` });
        }
        const blobData = (await blobRes.json()) as { sha: string };
        treeEntries.push({
          path: file.path,
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
        return res.status(502).json({ ok: false, error: 'GitHub tree creation failed.' });
      }
      const treeData = (await treeRes.json()) as { sha: string };

      const commitMsg = (body?.commitMessage || `ORBIT Dev Studio sync by ${authCheck.email}`).slice(0, 140);
      const newCommitRes = await fetch(`${apiBase}/git/commits`, {
        method: 'POST',
        headers: ghHeaders,
        body: JSON.stringify({
          message: commitMsg,
          tree: treeData.sha,
          parents: [baseCommitSha],
        }),
      });
      if (!newCommitRes.ok) {
        return res.status(502).json({ ok: false, error: 'GitHub commit creation failed.' });
      }
      const newCommitData = (await newCommitRes.json()) as { sha: string; html_url?: string };

      const updateRefRes = await fetch(`${apiBase}/git/refs/heads/${encodeURIComponent(ghBranch)}`, {
        method: 'PATCH',
        headers: ghHeaders,
        body: JSON.stringify({ sha: newCommitData.sha }),
      });
      if (!updateRefRes.ok) {
        return res.status(502).json({ ok: false, error: 'GitHub branch ref update failed.' });
      }

      return res.json({
        ok: true,
        commitSha: newCommitData.sha,
        commitUrl: newCommitData.html_url || `https://github.com/${ghRepo}/commit/${newCommitData.sha}`,
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: err instanceof Error ? err.message : 'GitHub push failed.',
      });
    }
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ORBIT server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start ORBIT server:', err);
  process.exit(1);
});
