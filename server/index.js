import express from 'express';
import { readFile, mkdir } from 'fs/promises';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { setupExercise, launchTerminal } from '../scripts/setup-exercise.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PORT = Number(process.env.PORT) || 4540;
const HOST = process.env.HOST || '127.0.0.1';
const isProd = process.env.NODE_ENV === 'production';

const app = express();
app.use(express.json());

let piscineData;

async function loadData() {
  const raw = await readFile(join(ROOT, 'data/piscine.json'), 'utf8');
  piscineData = JSON.parse(raw);
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: '44', port: PORT, host: HOST });
});

app.get('/api/piscine', (_req, res) => {
  res.json(piscineData);
});

app.post('/api/enter', async (req, res) => {
  const { moduleId, exerciseId } = req.body ?? {};
  if (!moduleId || !exerciseId) {
    return res.status(400).json({ error: 'moduleId and exerciseId required' });
  }

  const mod = piscineData.modules.find((m) => m.id === moduleId);
  if (!mod) return res.status(404).json({ error: `Module not found: ${moduleId}` });

  const exercise = mod.exercises.find((e) => e.id === exerciseId);
  if (!exercise) return res.status(404).json({ error: `Exercise not found: ${exerciseId}` });

  try {
    const result = await setupExercise(mod, exercise);
    const terminal = await launchTerminal(result.workspace, mod, exercise);
    res.json({ ok: true, ...result, terminal });
  } catch (err) {
    console.error('enter failed:', err);
    res.status(500).json({ error: err.message });
  }
});

async function start() {
  await loadData();
  await mkdir(join(homedir(), '.44'), { recursive: true }).catch(() => {});

  if (isProd) {
    app.use(express.static(join(ROOT, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(join(ROOT, 'dist/index.html'));
    });
  } else {
    const vite = await createViteServer({
      root: ROOT,
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api')) return next();
      try {
        const html = await readFile(join(ROOT, 'index.html'), 'utf8');
        res.status(200).set({ 'Content-Type': 'text/html' }).end(
          await vite.transformIndexHtml(req.originalUrl, html)
        );
      } catch (err) {
        vite.ssrFixStacktrace(err);
        next(err);
      }
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`\n  44 — Piscine World`);
    console.log(`  ─────────────────`);
    console.log(`  http://${HOST}:${PORT}`);
    console.log(`  Press Ctrl+C to stop\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n  44: port ${PORT} already in use — run: 454 stop\n`);
    } else {
      console.error('  44: server error:', err.message);
    }
    process.exit(1);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});