# 44 — Piscine World

A 3D virtual campus for 42 Piscine exercises. Walk through portals, enter exercise worlds, and get a terminal workspace ready to code — exam-style.

> First do it, then do it right, then do it better.

## Quick Start

```bash
cd ~/lyff/44
npm run install-cli   # once: adds `454` to ~/.local/bin
454
```

Click **Enter Campus** in the browser, then explore the Hub.

## Commands

| Command | Action |
|---------|--------|
| `454` | Start server + open browser |
| `454 stop` | Stop server |
| `454 status` | Check if running |
| `454 restart` | Stop + start fresh |

Leave the `454` terminal open while playing. **Ctrl+C** stops the server.

## Controls

| Key | Action |
|-----|--------|
| Click canvas | Focus for movement |
| WASD | Move |
| Shift | Sprint |
| E | Interact |
| Esc | Back / close panel |

## Flow

1. **Start screen** → Enter Campus
2. **Hub** → 42 Intro (left) or Piscine (right)
3. **Piscine Yard** → pick module (Reloaded, Shell00, C00, C01…)
4. **Module** → pick exercise → terminal opens at `~/.44/piscine/<module>/<ex>/`

## 42 Practices

- Norminette-ready C headers with your username
- `git init` in each module folder
- `SUBJECT.txt` brief in every exercise
- C modules: test with `cd .. && mini` from exercise dir
- Piscine Reloaded assets from [lyffseba/43](https://github.com/lyffseba/43)

## Stack

Three.js · Vite · Express · port **4540**

## Roadmap (do it better)

- PDF subject viewer
- All modules (C02–C13, S01, Rush, BSQ)
- Exam mode (timer, lockdown)
- Progress persistence