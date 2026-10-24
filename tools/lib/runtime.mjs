import { access, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { parseArgs } from 'node:util';
import { createServer } from 'vite';
import puppeteer from 'puppeteer-core';

export const ROOT = fileURLToPath(new URL('../../', import.meta.url));

export function options(definitions) {
  return parseArgs({ options: definitions, strict: true, allowPositionals: false }).values;
}

export async function ensureParent(path) {
  await mkdir(dirname(resolve(path)), { recursive: true });
}

export async function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    process.env.LOCALAPPDATA && resolve(process.env.LOCALAPPDATA, 'Google/Chrome/Application/chrome.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
  ].filter(Boolean);
  if (process.env.CHROME_PATH && !existsSync(process.env.CHROME_PATH)) {
    throw new Error(`CHROME_PATH does not exist: ${process.env.CHROME_PATH}`);
  }
  for (const candidate of candidates) {
    try { await access(candidate); return candidate; } catch { /* Try the next installation. */ }
  }
  throw new Error('Google Chrome was not found. Set CHROME_PATH to its executable.');
}

export async function withRenderer(callback, { url } = {}) {
  let server;
  let browser;
  try {
    if (!url) {
      server = await createServer({ root: ROOT, configFile: resolve(ROOT, 'vite.config.js'), server: { port: 0, strictPort: false, host: '127.0.0.1', hmr: false }, logLevel: 'error' });
      await server.listen();
      url = server.resolvedUrls.local[0];
    }
    browser = await puppeteer.launch({
      executablePath: await findChrome(), headless: true,
      args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--disable-background-timer-throttling', '--hide-scrollbars'],
      defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
    });
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const target = new URL(url);
    target.searchParams.set('export', '1');
    // The film exposes readiness after fonts, brush masks and cached paintings.
    // Vite's network activity is not the signal that the canvas is ready.
    await page.goto(target.href, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await page.waitForFunction(() => window.pelican?.ready || window.pelicanError, { timeout: 90000 });
    const startupError = await page.evaluate(() => window.pelicanError);
    if (startupError) throw new Error(`Preview initialization: ${startupError}`);
    const shot = async (time) => {
      const encoded = await page.evaluate((requestedTime) => {
        window.pelican.renderAt(requestedTime);
        return document.querySelector('#screen canvas').toDataURL('image/png').split(',')[1];
      }, time);
      return Buffer.from(encoded, 'base64');
    };
    const result = await callback({ page, shot, errors, browser, url });
    if (errors.length) throw new Error(`Browser errors: ${errors.join('\n')}`);
    return result;
  } finally {
    try { await browser?.close(); } finally { await server?.close(); }
  }
}

export function run(command, args) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { cwd: ROOT, stdio: 'inherit', windowsHide: true });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolveRun() : reject(new Error(`${command} exited with ${code}`)));
  });
}
