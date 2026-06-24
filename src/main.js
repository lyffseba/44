import { Game } from './game/Game.js';

async function main() {
  const res = await fetch('/api/piscine');
  const data = await res.json();
  const canvas = document.getElementById('canvas');
  new Game(canvas, data);
}

main().catch((err) => {
  document.body.innerHTML = `<pre style="color:#ff6b6b;padding:2rem">Failed to load 44: ${err.message}\n\nRun: 454</pre>`;
});