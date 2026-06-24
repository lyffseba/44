# 44 — Piscine World

A 3D virtual campus for 42 Piscine exercises. Walk through portals, enter exercise worlds, and get a terminal workspace ready to code — exam-style.

> First do it, then do it right, then do it better.

## Quick Start

```bash
cd /home/sebae/lyff/44
npm install
npm run install-cli   # adds `454` to ~/.local/bin
454
```

## Controls

| Key | Action |
|-----|--------|
| WASD | Move |
| Shift | Sprint |
| E | Interact (enter zone, start exercise) |
| Esc | Back to hub |

## Flow

1. **Hub** — spawn point with two paths
2. **42 Intro** — brief on École 42 and the Piscine
3. **Piscine Yard** — module portals (Reloaded, Shell00, C00, C01…)
4. **Exercise** — press E to scaffold workspace at `~/.44/piscine/<module>/<ex>/` and open a terminal

## 42 Practices Built In

- Norminette-ready C headers
- `SUBJECT.txt` in each workspace
- `mini` moulinette hint for C modules
- Piscine Reloaded assets copied from [lyffseba/43](https://github.com/lyffseba/43)

## Stack

- Three.js (3D world)
- Vite (dev + build)
- Express (API + terminal launcher)

## Roadmap

- [ ] PDF subject viewer per exercise
- [ ] All piscine modules (C02–C13, S01, Rush, BSQ)
- [ ] Exam mode (timer, no browser)
- [ ] Progress persistence
- [ ] Richer worlds per exercise theme