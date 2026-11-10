'use strict';
// HTTP-only fallback evidence for the 40db31f20 release bundle.
// It intentionally does not claim or emulate the original file:// acceptance gate.
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const { createRequire } = require('module');

const ROOT = path.resolve(__dirname, '../../../../../');
const OUT = process.env.AUDIO_DIST || '/tmp/codex-release-out-40db31f20';
const requireFromGame = createRequire(path.join(ROOT, 'gra', 'package.json'));
const { chromium } = requireFromGame('playwright');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let failures = 0;
function check(label, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'} ${label}${detail === undefined ? '' : ` — ${JSON.stringify(detail).slice(0, 500)}`}`);
  if (!ok) failures++;
}

function serve(root) {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/favicon.ico') { res.writeHead(204); return res.end(); }
    const rel = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const file = path.resolve(root, `.${rel}`);
    if (!file.startsWith(path.resolve(root) + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('not found');
    }
    const type = file.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/javascript; charset=utf-8';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({
    server,
    url: `http://127.0.0.1:${server.address().port}/index.html?playtest=mapa`,
  })));
}

async function gotoMapa(page, url) {
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 180000 });
  for (let i = 0; i < 900; i++) {
    if ((await page.locator('text=Tworzenie świata').count()) === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(() => !!window.__musicEraTestDebug && !!window.__truceTestDebug
    && !!window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0,
  undefined, { timeout: 900000 });
  await wait(300);
}

async function playing(page, ms) {
  let last = [];
  for (const started = Date.now(); Date.now() - started < ms;) {
    last = await page.evaluate(() => window.__audioPlaying());
    if (last.length && last.every(x => x.dur > 0)) return last;
    await wait(250);
  }
  return last;
}

async function main() {
  const build = path.resolve(OUT);
  if (!fs.existsSync(path.join(build, 'index.html'))) throw new Error(`missing ${build}/index.html`);
  const noPacksDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-sidecar-http-no-packs-'));
  fs.copyFileSync(path.join(build, 'index.html'), path.join(noPacksDir, 'index.html'));
  const withServer = await serve(build);
  const withoutServer = await serve(noPacksDir);
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: '/usr/bin/chromium',
      args: ['--no-sandbox', '--headless=new', '--autoplay-policy=no-user-gesture-required',
        '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const pageErrors = [];
    const consoleErrors = [];
    const packResponses = [];
    page.on('pageerror', e => pageErrors.push(String(e).slice(0, 300)));
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 250)); });
    page.on('response', response => {
      if (/audio-pack-\d+\.js(?:\?|$)/.test(response.url())) {
        packResponses.push({ url: response.url().split('/').pop(), status: response.status() });
      }
    });
    await page.addInitScript(() => {
      const OriginalAudio = window.Audio;
      const all = [];
      function WrappedAudio(...args) { const element = new OriginalAudio(...args); all.push(element); return element; }
      WrappedAudio.prototype = OriginalAudio.prototype;
      window.Audio = WrappedAudio;
      window.__audioPlaying = () => all.filter(e => !e.paused && e.hasAttribute('src'))
        .map(e => ({ src: e.src.slice(0, 5), dur: e.duration, t: e.currentTime }));
    });

    await gotoMapa(page, withServer.url);
    await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());
    await page.evaluate(() => window.__musicEraTestDebug.startMusic('mapa'));
    const bg1 = await playing(page, 15000);
    await wait(2000);
    const bg2 = await page.evaluate(() => window.__audioPlaying());
    check('HTTP+packs: muzyka gry gra, blob, duration>0, currentTime rośnie',
      bg1.length === 1 && bg1[0].src === 'blob:' && bg1[0].dur > 0
        && bg2.length >= 1 && bg2[0].t > bg1[0].t + 1, { bg1, bg2 });
    await page.evaluate(() => {
      window.__musicEraTestDebug.setOwnerCivForTest(1, 'grecy');
      window.__truceTestDebug.openAudience(1);
    });
    await wait(1500);
    const diplo1 = await playing(page, 15000);
    await wait(2000);
    const diplo2 = await page.evaluate(() => window.__audioPlaying());
    check('HTTP+packs: przywitanie Greków gra, blob, 30–60 s, currentTime rośnie',
      diplo1.length === 1 && diplo1[0].src === 'blob:' && diplo1[0].dur > 30 && diplo1[0].dur < 60
        && diplo2.length === 1 && diplo2[0].t > diplo1[0].t + 1, { diplo1, diplo2 });
    await page.evaluate(() => window.__truceTestDebug.closeAudience());
    const registry = await page.evaluate(() => window.__CIV_AUDIO__ ? Object.keys(window.__CIV_AUDIO__).length : -1);
    check('HTTP+packs: window.__CIV_AUDIO__ zwolniony po dekodowaniu', registry === 0, { registry });
    check('HTTP+packs: pakiety audio odpowiedziały 200', packResponses.length === 3 && packResponses.every(x => x.status === 200), packResponses);
    check('HTTP+packs: zero pageerror i console.error', pageErrors.length === 0 && consoleErrors.length === 0,
      { pageErrors, consoleErrors });

    pageErrors.length = 0; consoleErrors.length = 0; packResponses.length = 0;
    await page.goto('about:blank');
    await gotoMapa(page, withoutServer.url);
    await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());
    await page.evaluate(() => window.__musicEraTestDebug.startMusic('mapa'));
    const silentBg = await playing(page, 4000);
    await wait(2000);
    const silentBg2 = await page.evaluate(() => window.__audioPlaying());
    check('HTTP bez pakietów: gra startuje i nie gra audio', silentBg.length === 0 && silentBg2.length === 0,
      { silentBg, silentBg2 });
    await page.evaluate(() => {
      window.__musicEraTestDebug.setOwnerCivForTest(1, 'grecy');
      window.__truceTestDebug.openAudience(1);
    });
    await wait(3000);
    const silentDiplo = await page.evaluate(() => window.__audioPlaying());
    await page.evaluate(() => window.__truceTestDebug.closeAudience());
    const hud = await page.locator('.civ-hud, .civ-ux-frame, .civ-cs').count();
    const missingPackCount = packResponses.filter(x => x.status === 404).length;
    check('HTTP bez pakietów: dyplomacja nie odtwarza audio', silentDiplo.length === 0, { silentDiplo });
    check('HTTP bez pakietów: HUD działa', hud > 0, { hud });
    check('HTTP bez pakietów: jedyne braki to 3 oczekiwane HTTP 404 sąsiadów',
      missingPackCount === 3 && packResponses.length === 3, { packResponses, consoleErrors });
    check('HTTP bez pakietów: zero pageerror', pageErrors.length === 0, pageErrors);
  } finally {
    if (browser) await browser.close();
    await Promise.all([withServer, withoutServer].map(({ server }) => new Promise(resolve => server.close(resolve))));
    fs.rmSync(noPacksDir, { recursive: true, force: true });
  }
  console.log(failures ? `audio-sidecar-http-smoke: FAIL (${failures})` : 'audio-sidecar-http-smoke: PASS');
  process.exitCode = failures ? 1 : 0;
}

main().catch(e => { console.error(e); process.exitCode = 1; });
