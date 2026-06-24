import { Game } from './game/Game.js';

async function main() {
  const health = await fetch('/api/health');
  if (!health.ok) throw new Error('Server not responding — run: 454');

  const res = await fetch('/api/piscine');
  if (!res.ok) throw new Error('Failed to load piscine data');

  const data = await res.json();
  const startScreen = document.getElementById('start-screen');
  const overlay = document.getElementById('overlay');
  const canvas = document.getElementById('canvas');
  const startBtn = document.getElementById('start-btn');

  let game = null;

  startBtn.addEventListener('click', () => {
    startScreen.classList.add('hidden');
    overlay.classList.remove('hidden');
    canvas.classList.remove('hidden');
    if (!game) {
      game = new Game(canvas, data);
    }
    canvas.focus();
  });

  startBtn.addEventListener('keydown', (e) => {
    if (e.code === 'Enter' || e.code === 'Space') startBtn.click();
  });
}

main().catch((err) => {
  document.body.innerHTML = `<pre style="color:#ff6b6b;padding:2rem;font-family:monospace">Failed to load 44: ${err.message}\n\nRun in terminal: 454</pre>`;
});