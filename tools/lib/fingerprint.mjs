import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { ROOT } from './runtime.mjs';

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? filesIn(resolve(directory, entry.name)) : [resolve(directory, entry.name)]))).flat();
}

export async function fingerprint() {
  const paths = [...await filesIn(resolve(ROOT, 'src')), ...(await filesIn(resolve(ROOT, 'audio'))).filter((path) => path.endsWith('.js')), ...await filesIn(resolve(ROOT, 'public')), resolve(ROOT, 'package-lock.json'), resolve(ROOT, 'vite.config.js')].sort();
  const hash = createHash('sha256');
  for (const path of paths) { hash.update(relative(ROOT, path)); hash.update(await readFile(path)); }
  return hash.digest('hex');
}
