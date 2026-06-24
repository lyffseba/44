import express from 'express';
import { readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { setupExercise, launchTerminal } from '../scripts/setup-exercise.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PORT = process.env.PORT || 4540;
const isProd = process.env.NODE_ENV === 'production';

const app = express();
app.use(express.json());

let piscineData;

async function loadData() {
  const raw = await readFile(join(ROOT, 'data/piscine.json'), 'utf8');
  piscineData = JSON.parse(raw);
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: '44', port: PORT });
});

app.get('/api/piscine', (_req, res) => {
  res.json(piscineData);
});

app.post('/api/enter', async (req, res) => {
  const { moduleId, exerciseId } = req.body;
  const mod = piscineData.modules.find((m) => m.id === moduleId);
  if (!mod) return res.status(404).json({ error: 'Module not found' });

  const exercise = mod.exercises.find((e) => e.id === exerciseId);
  if (!exercise) return res.status(404).json({ error: 'Exercise not found' });

  try {
    const { workspace } = await setupExercise(mod, exercise);
    const terminal = launchTerminal(workspace, mod, exercise);
    res.json({ ok: true, workspace, terminal });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

async function start() {
  await loadData();

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
  }

  app.listen(PORT, () => {
    console.log(`\n  44 — Piscine World`);
    console.log(`  ─────────────────`);
    console.log(`  http://localhost:${PORT}`);
    console.log(`  Press Ctrl+C to stop\n`);
  });
}

start().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});