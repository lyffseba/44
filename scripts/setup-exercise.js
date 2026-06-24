import { mkdir, writeFile, copyFile, access, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { homedir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const WORKSPACE = join(homedir(), '.44', 'piscine');

const C_HEADER = await readFile(join(ROOT, 'templates/c/header.c'), 'utf8');

function header(func) {
  const now = new Date();
  const date = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  return C_HEADER.replace(/FUNC_NAME/g, func)
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

async function copyReloadedAssets(moduleDir, exercise) {
  const src = join(homedir(), 'lyff', '43', 'piscine_reloaded', exercise.id);
  if (!(await exists(src))) return;
  for (const file of exercise.files || []) {
    const from = join(src, file);
    if (await exists(from)) {
      await copyFile(from, join(moduleDir, file));
    }
  }
}

export async function setupExercise(module, exercise) {
  const moduleDir = join(WORKSPACE, module.id, exercise.id);
  await mkdir(moduleDir, { recursive: true });

  const subjectPath = join(moduleDir, 'SUBJECT.txt');
  const lines = [
    `Module: ${module.name}`,
    `Exercise: ${exercise.id} — ${exercise.title}`,
    `Type: ${module.type}`,
    '',
    '42 rules:',
    '  - Norminette must pass (run: norminette)',
    '  - Test locally with: mini (from module dir for C)',
    '  - Exact output required',
    '  - Only allowed functions per subject',
    '',
  ];

  if (module.type === 'c' && exercise.func) {
    const cFile = join(moduleDir, `${exercise.func}.c`);
    if (!(await exists(cFile))) {
      const content = `${header(exercise.func)}\n\n${exercise.proto}\n{\n\n}\n`;
      await writeFile(cFile, content);
      lines.push(`Created: ${exercise.func}.c`);
    }
  }

  if (module.id === 'reloaded') {
    await copyReloadedAssets(moduleDir, exercise);
    for (const file of exercise.files || []) {
      const fp = join(moduleDir, file);
      if (await exists(fp)) {
        try {
          execSync(`chmod +x "${fp}"`, { stdio: 'ignore' });
        } catch { /* not executable */ }
      }
    }
  }

  if (module.type === 'shell') {
    for (const file of exercise.files || []) {
      const fp = join(moduleDir, file);
      if (!(await exists(fp))) {
        await writeFile(fp, '#!/bin/bash\n\n');
        try {
          execSync(`chmod +x "${fp}"`, { stdio: 'ignore' });
        } catch { /* ignore */ }
      }
    }
  }

  await writeFile(subjectPath, lines.join('\n'));

  return { workspace: moduleDir, subject: subjectPath };
}

export function launchTerminal(workspace, module, exercise) {
  const banner = [
    '╔══════════════════════════════════════════╗',
    '║           44 — PISCINE WORLD             ║',
    '╚══════════════════════════════════════════╝',
    '',
    `  Module:   ${module.name}`,
    `  Exercise: ${exercise.id} — ${exercise.title}`,
    `  Path:     ${workspace}`,
    '',
    '  Commands:',
    '    cat SUBJECT.txt   — read brief',
    module.type === 'c' ? '    mini              — run moulinette (from module parent)' : '    ./script          — run your solution',
    '    norminette        — check style (C)',
    '',
    '  First do it. Then do it right. Then do it better.',
    '',
  ].join('\\n');

  const cmd = `cd "${workspace}" && clear && printf "${banner}" && exec ${process.env.SHELL || '/bin/bash'}`;
  const escaped = cmd.replace(/"/g, '\\"');

  if (process.platform === 'linux') {
    try {
      execSync(`gnome-terminal -- bash -c "${escaped}"`, { stdio: 'ignore', detached: true });
      return { method: 'gnome-terminal' };
    } catch {
      try {
        execSync(`xterm -e bash -c "${escaped}"`, { stdio: 'ignore', detached: true });
        return { method: 'xterm' };
      } catch {
        return { method: 'manual', command: cmd };
      }
    }
  }

  return { method: 'manual', command: cmd };
}