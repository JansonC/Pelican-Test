import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './lib/runtime.mjs';

async function scripts(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(entries.map((entry) => {
    const path = resolve(directory, entry.name);
    return entry.isDirectory() ? scripts(path) : /\.(mjs|js)$/.test(entry.name) ? [path] : [];
  }));
  return groups.flat();
}

const files = (await Promise.all(['src', 'audio', 'tools', 'test'].map((dir) => scripts(resolve(ROOT, dir))))).flat();
let failed = false;
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8', windowsHide: true });
  if (result.status !== 0) { console.error(result.stderr); failed = true; }
}
console.log(`Checked ${files.length} JavaScript modules.`);
if (failed) process.exitCode = 1;
