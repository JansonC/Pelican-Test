import { copyFile, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { ROOT } from './lib/runtime.mjs';

// Preserve unmodified upstream texts for direct and transitive runtime packages.
const lock = JSON.parse(await readFile(resolve(ROOT, 'package-lock.json'), 'utf8'));
const notices = [];
for (const [path, dependency] of Object.entries(lock.packages)) {
  if (!path || dependency.dev) continue;
  const source = resolve(ROOT, path);
  const pkg = JSON.parse(await readFile(resolve(source, 'package.json'), 'utf8'));
  const destination = resolve(ROOT, 'public/licenses', pkg.name);
  const filenames = (await readdir(source)).filter((name) => /^(licen[cs]e|copying|notice|authors)(\.|$)/i.test(name));
  await mkdir(destination, { recursive: true });
  const files = [];
  for (const filename of filenames) {
    const target = resolve(destination, filename);
    await copyFile(resolve(source, filename), target);
    files.push(relative(resolve(ROOT, 'public'), target).replaceAll('\\', '/'));
  }
  let note;
  if (pkg.name === 'omggif') {
    const code = await readFile(resolve(source, 'omggif.js'), 'utf8');
    const target = resolve(destination, 'LICENSE-header.txt');
    await writeFile(target, code.slice(0, code.indexOf('"use strict"')));
    files.push(relative(resolve(ROOT, 'public'), target).replaceAll('\\', '/'));
  } else if (pkg.name === '@davepagurek/bezier-path') {
    // Upstream publishes an MIT declaration and author, but no separate license file.
    const target = resolve(destination, 'package.json');
    await copyFile(resolve(source, 'package.json'), target);
    files.push(relative(resolve(ROOT, 'public'), target).replaceAll('\\', '/'));
    note = 'The upstream npm package and repository declare MIT but provide no standalone license text; the original package metadata is preserved.';
  } else if (!filenames.length) {
    throw new Error(`No upstream license text found for ${pkg.name}`);
  }
  if (pkg.name === 'pako') {
    const code = await readFile(resolve(source, 'lib/zlib/deflate.js'), 'utf8');
    const target = resolve(destination, 'ZLIB-header.txt');
    const header = code.match(/\/\/ \(C\)[\s\S]*?(?=\nconst )/);
    if (!header) throw new Error('pako zlib notice header was not found');
    await writeFile(target, header[0]);
    files.push(relative(resolve(ROOT, 'public'), target).replaceAll('\\', '/'));
  }
  notices.push({ name: pkg.name, version: pkg.version, license: pkg.license, repository: pkg.repository, note, files });
}
await writeFile(resolve(ROOT, 'public/licenses/index.json'), JSON.stringify(notices, null, 2));
console.log(`Preserved upstream notices for ${notices.length} runtime packages.`);
