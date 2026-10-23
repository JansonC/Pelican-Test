import { spawnSync } from 'node:child_process';
import { findChrome } from './lib/runtime.mjs';

console.log(`Node: ${process.version}`);
const [major, minor] = process.versions.node.split('.').map(Number);
let failed = major < 22 || (major === 22 && minor < 12);
try { console.log(`Chrome: ${await findChrome()}`); } catch (error) { console.error(error.message); failed = true; }
for (const program of ['ffmpeg', 'ffprobe']) {
  const result = spawnSync(program, ['-version'], { encoding: 'utf8', windowsHide: true });
  if (result.error || result.status !== 0) { console.error(`${program}: not available`); failed = true; }
  else console.log(result.stdout.split(/\r?\n/)[0]);
}
if (failed) process.exitCode = 1;
