#!/usr/bin/env node
/**
 * capture-hill-compare.cjs — zrzuty ekranu wzgórze vs tarasy (prawdziwy render Three.js).
 * Uruchom z folderu gra/: node tools/capture-hill-compare.cjs
 */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');

const GRA = path.join(__dirname, '..');
const OUT = path.join(GRA, '..', 'docs', 'obieg', 'screenshots', 'wzgórze-vs-tarasy');

const SHOTS = [
  { file: '01-wzgorze-samo.png', view: 'wild', label: 'Samo wzgórze (teren bazowy)' },
  { file: '02-wzgorze-tarasy.png', view: 'tarasy', label: 'Wzgórze + ulepszenie Tarasy' },
  { file: '03-porownanie-obok.png', view: 'both', label: 'Porównanie obok siebie' },
];

function waitForServer(url, timeoutMs = 45000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      http.get(url, res => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) resolve();
        else retry();
      }).on('error', retry);
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) reject(new Error('timeout vite dev'));
      else setTimeout(tick, 400);
    };
    tick();
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  const vite = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['vite', '--host', '127.0.0.1', '--port', '5199'], {
    cwd: GRA,
    stdio: 'pipe',
    shell: process.platform === 'win32',
  });

  let viteLog = '';
  vite.stderr?.on('data', d => { viteLog += d; });
  vite.stdout?.on('data', d => { viteLog += d; });

  const baseUrl = 'http://127.0.0.1:5199';
  try {
    await waitForServer(baseUrl);
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

    for (const shot of SHOTS) {
      const url = `${baseUrl}/src/hillcompare/index.html?view=${shot.view}`;
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForFunction(() => document.body.dataset.ready === '1', { timeout: 30000 });
      await page.waitForTimeout(1200);
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      const outPath = path.join(OUT, shot.file);
      await page.screenshot({ path: outPath, fullPage: false });
      console.log(`OK: ${shot.file} — ${shot.label}`);
    }

    await browser.close();
    console.log(`\nZapisano ${SHOTS.length} pliki w:\n${OUT}`);
  } finally {
    vite.kill('SIGTERM');
    if (process.platform === 'win32') {
      try { spawn('taskkill', ['/pid', String(vite.pid), '/f', '/t'], { shell: true }); } catch { /* ignore */ }
    }
  }
}

main().catch(err => {
  console.error('FAIL:', err.message || err);
  process.exit(1);
});
