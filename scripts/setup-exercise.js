import { mkdir, writeFile, copyFile, access, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn, execSync } from 'child_process';
import { homedir, userInfo } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const WORKSPACE = join(homedir(), '.44', 'piscine');
const REPO_43 = join(homedir(), 'lyff', '43', 'piscine_reloaded');

const C_HEADER = await readFile(join(ROOT, 'templates/c/header.c'), 'utf8');
const LOGIN = userInfo().username;

function header(func) {
  const now = new Date();
  const date = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  return C_HEADER
    .replace(/FUNC_NAME/g, func)
    .replace(/login/g, LOGIN)
    .replace(/2026\/01\/01 00:00:00/g, date);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function ensureGitRepo(dir) {
  if (await exists(join(dir, '.git'))) return;
  try {
    execSync('git init', { cwd: dir, stdio: 'ignore' });
  } catch { /* git optional */ }
}

async function copyReloadedAssets(exerciseDir, exercise) {
  const src = join(REPO_43, exercise.id);
  if (!(await exists(src))) return false;
  for (const file of exercise.files || []) {
    const from = join(src, file);
    if (await exists(from)) {
      await copyFile(from, join(exerciseDir, file));
    }
  }
  return true;
}

export async function setupExercise(module, exercise) {
  const moduleDir = join(WORKSPACE, module.id);
  const exerciseDir = join(moduleDir, exercise.id);
  await mkdir(exerciseDir, { recursive: true });
  await ensureGitRepo(moduleDir);

  const subjectPath = join(exerciseDir, 'SUBJECT.txt');
  const lines = [
    `Module: ${module.name} (${module.id})`,
    `Exercise: ${exercise.id} — ${exercise.title}`,
    `Type: ${module.type}`,
    '',
    '42 rules:',
    '  - Norminette must pass (norminette)',
    '  - Exact output required',
    '  - Only allowed functions per subject',
    '  - Work inside this directory',
    '',
    'Test:',
  ];

  if (module.type === 'c') {
    lines.push('  cd .. && mini     # moulinette from module folder (C00, C01…)');
    lines.push('  norminette        # style check');
  } else if (module.id === 'reloaded') {
    lines.push('  ./script          # run your solution');
    lines.push('  cat SUBJECT.txt   # read brief');
  } else {
    lines.push('  ./script          # run your solution');
  }

  lines.push('');

  if (module.type === 'c' && exercise.func) {
    const cFile = join(exerciseDir, `${exercise.func}.c`);
    if (!(await exists(cFile))) {
      const content = `${header(exercise.func)}\n\n${exercise.proto}\n{\n\n}\n`;
      await writeFile(cFile, content);
      lines.push(`File: ${exercise.func}.c`);
    }
  }

  if (module.id === 'reloaded') {
    const copied = await copyReloadedAssets(exerciseDir, exercise);
    if (!copied) {
      lines.push('Note: clone lyffseba/43 to ~/lyff/43 for starter files');
    }
    for (const file of exercise.files || []) {
      const fp = join(exerciseDir, file);
      if (await exists(fp)) {
        try { execSync(`chmod +x "${fp}"`, { stdio: 'ignore' }); } catch { /* ok */ }
      }
    }
  }

  if (module.type === 'shell' && module.id !== 'reloaded') {
    for (const file of exercise.files || []) {
      const fp = join(exerciseDir, file);
      if (!(await exists(fp))) {
        await writeFile(fp, '#!/bin/bash\n\n');
        try { execSync(`chmod +x "${fp}"`, { stdio: 'ignore' }); } catch { /* ok */ }
      }
    }
  }

  await writeFile(subjectPath, lines.join('\n'));

  return { workspace: exerciseDir, moduleDir, subject: subjectPath };
}

export async function launchTerminal(workspace, module, exercise) {
  const testHint = module.type === 'c'
    ? 'cd .. && mini'
    : (exercise.files?.[0] ? `./${exercise.files[0]}` : 'cat SUBJECT.txt');

  const script = join(homedir(), '.44', 'launch-session.sh');
  const lines = [
    '#!/usr/bin/env bash',
    `cd "${workspace}"`,
    'clear',
    'echo "╔══════════════════════════════════════════╗"',
    'echo "║           44 — PISCINE WORLD             ║"',
    'echo "╚══════════════════════════════════════════╝"',
    'echo ""',
    `echo "  Module:   ${module.name}"`,
    `echo "  Exercise: ${exercise.id} — ${exercise.title}"`,
    `echo "  Path:     ${workspace}"`,
    'echo ""',
    'echo "  Next steps:"',
    'echo "    cat SUBJECT.txt"',
    `echo "    ${testHint}"`,
    'echo ""',
    'echo "  First do it. Then do it right. Then do it better."',
    'echo ""',
    `exec ${process.env.SHELL || '/bin/bash'}`,
  ];

  await writeFile(script, lines.join('\n') + '\n');
  try { execSync(`chmod +x "${script}"`, { stdio: 'ignore' }); } catch { /* ok */ }

  if (process.platform === 'linux') {
    const child = spawn('gnome-terminal', ['--', 'bash', script], {
      detached: true,
      stdio: 'ignore',
    });
    child.unref();
    if (child.pid) return { method: 'gnome-terminal' };

    const xterm = spawn('xterm', ['-e', 'bash', script], { detached: true, stdio: 'ignore' });
    xterm.unref();
    if (xterm.pid) return { method: 'xterm' };
  }

  return { method: 'manual', command: `bash "${script}"` };
}