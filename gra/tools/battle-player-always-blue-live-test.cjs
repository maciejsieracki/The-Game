'use strict';
/**
 * R-WEB-UI-BATTLE-PLAYER-ALWAYS-BLUE-ALL-PATHS-Q1 -- ZYWY driver bitwy w Chromium (rola atk / def).
 *
 * Startuje prawdziwa mape swiata (?playtest=mapa), otwiera produkcyjna bitwe duza (preset
 * bitwa_duza_pole, przycisk „START WALKI”) z rola gracza wstrzyknieta do sceny (window.__pbRole = 'atk' | 'def')
 * i sprawdza w przegladarce:
 *   - scena dostaje role gracza z launchera (deployPlayerSide = rola) i _playerControlSide() = rola
 *     (to ono steruje kolorem 3D jednostek, awatarow, pasков, minimapy, obrazen i muru);
 *   - zapisuje zrzuty ekranu (start bitwy i +4 s) do obejrzenia.
 * Kolor niebieski/czerwony na zrzutach ocenia czlowiek (Read PNG); test sprawdza wiring roli w runtime.
 *
 * Tryb mutacji (--mutant): w pamieci (plugin vite, zadne zrodlo w repo nie jest zmieniane) launcher
 * ignoruje __pbRole i zawsze podaje 'atk'. Dla roli 'def' test musi czerwienic (dowod, ze asercje lapia regresje).
 *
 * Build vite POZA repo (--dist, domyslnie os.tmpdir()); zadne zrodlo w repo nie jest zmieniane.
 *
 * Uzycie (z katalogu gra/):
 *   node tools/battle-player-always-blue-live-test.cjs --vp 1024x640 --dist /tmp/pb1-dist --shots /tmp/pb1-shots
 *   kolejne viewporty bez builda: --reuse --dist /tmp/pb1-dist --vp 1280x720 --shots /tmp/pb1-shots
 *   mutacja: --mutant --dist /tmp/pb1-mut --vp 1024x640 --shots /tmp/pb1-shots-mut
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const [VW, VH] = String(arg('--vp', '1024x640')).split('x').map(Number);
const runId = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const shotsDir = path.resolve(arg('--shots', path.join(os.tmpdir(), `pbblue-shots-${runId}`)));
const REUSE = argv.includes('--reuse');
const MUTANT = argv.includes('--mutant');
const DIST = path.resolve(arg('--dist', path.join(os.tmpdir(), `pbblue-dist-${runId}${MUTANT ? '-mutant' : ''}`)));
const MAP_BOOT_MS = Math.max(10000, Number(process.env.BANNER_TEST_MAP_BOOT_MS || 150000));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const checks = [];
function ck(name, ok, extra) {
  checks.push({ name, ok: !!ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra === undefined ? '' : '  ' + JSON.stringify(extra)}`);
}
function mark(phase, data) {
  console.log(`[pbblue ${new Date().toISOString()}] ${phase}${data === undefined ? '' : ' ' + JSON.stringify(data)}`);
}

async function build() {
  const vite = await import('vite');
  const loaded = await vite.loadConfigFromFile({ command: 'build', mode: 'production' }, path.join(root, 'vite.config.ts'), root);
  const plugin = {
    name: 'temporary-pbblue-live-probe',
    enforce: 'pre',
    transform(code, moduleId) {
      if (!moduleId.endsWith('/src/main.ts')) return null;
      let output = code;
      const debugMarker = '      getWorldState: () => ({ citiesLen: cities.length, unitsLen: units.length, turn }),';
      if (!output.includes(debugMarker)) throw new Error('Could not locate __eraTestDebug marker');
      output = output.replace(debugMarker, `${debugMarker}
      startLargeBattleForTest: () => launchBigPresetBattle('bitwa_duza_pole', false),`);
      const battleMarker = '      const bs = new BattleScene(bOpts);';
      if (!output.includes(battleMarker)) throw new Error('Could not locate production BattleScene construction');
      const role = MUTANT
        ? 'bOpts.deployPlayerSide'
        : '((window as any).__pbRole ?? bOpts.deployPlayerSide)';
      output = output.replace(battleMarker, `      const bs = new BattleScene({ ...bOpts, deployPlayerSide: ${role} });
      (window as any).__pbProbe = { scene: bs, canvas: bs.canvas };`);
      return { code: output, map: null };
    },
  };
  const cfg = vite.mergeConfig(loaded.config, {
    root,
    plugins: [...(loaded.config.plugins || []), plugin],
    build: { outDir: DIST, emptyOutDir: true },
    logLevel: 'warn',
  });
  mark('build:start', { DIST, MUTANT });
  await vite.build(cfg);
  mark('build:complete', { DIST });
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.wasm': 'application/wasm', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf',
};
function serveFile(outDir, req, res) {
  const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  if (pathname === '/favicon.ico') { res.statusCode = 204; res.end(); return; }
  const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const file = path.resolve(outDir, rel);
  if (!file.startsWith(path.resolve(outDir) + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    res.statusCode = 404; res.end(`not found: ${pathname}`); return;
  }
  res.setHeader('content-type', MIME[path.extname(file).toLowerCase()] || 'application/octet-stream');
  fs.createReadStream(file).pipe(res);
}

async function waitMapReady(page) {
  const t0 = Date.now();
  while (Date.now() - t0 < MAP_BOOT_MS) {
    const ready = await page.evaluate(() => {
      const c = window.__eraTestDebug?.startLargeBattleForTest ? document.querySelector('canvas') : null;
      return !!c && c.width > 0 && !document.querySelector('.civ-map-load-overlay');
    }).catch(() => false);
    if (ready) return true;
    await wait(500);
  }
  throw new Error(`map not ready within ${MAP_BOOT_MS} ms`);
}

// Odczyt roli w runtime (tylko odczyt): rola z launchera i rola, ktora steruje kolorami.
const IN_PAGE_ROLE = `
(() => {
  const s = window.__pbProbe.scene;
  return { opt: s._deployPlayerSideOpt, control: s._playerControlSide(), vw: innerWidth, vh: innerHeight };
})()
`;

async function runCase(browser, baseUrl, errors, role) {
  const page = await browser.newPage({ viewport: { width: VW, height: VH } });
  page.setDefaultTimeout(60000);
  page.on('pageerror', e => errors.push(String(e.message || e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const tag = `${role}-${VW}x${VH}`;
  await page.goto(baseUrl + '/?playtest=mapa', { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => !!window.__eraTestDebug?.startLargeBattleForTest, undefined, { timeout: 60000 });
  await waitMapReady(page);
  mark('map:ready', { tag });
  await page.evaluate(r => { window.__pbRole = r; window.__eraTestDebug.startLargeBattleForTest(); }, role);
  await page.waitForFunction(() => !!window.__pbProbe?.canvas?.isConnected, undefined, { timeout: 60000 });
  const startBtn = page.getByText(/^START WALKI$/i).last();
  await startBtn.waitFor({ state: 'visible', timeout: 60000 });
  await startBtn.click({ timeout: 180000 });
  await wait(1500);
  const r0 = await page.evaluate(IN_PAGE_ROLE);
  mark(`role:${tag}`, r0);
  ck(`[${tag}] scena dostala role gracza z launchera (deployPlayerSide = ${role})`, r0.opt === role, r0);
  ck(`[${tag}] _playerControlSide() = ${role} (steruje kolorem 3D/minimapy/obrazen)`, r0.control === role, r0);
  await page.screenshot({ path: path.join(shotsDir, `pb-${tag}${MUTANT ? '-mutant' : ''}-t0.png`) });
  await wait(4000);
  await page.screenshot({ path: path.join(shotsDir, `pb-${tag}${MUTANT ? '-mutant' : ''}-t4s.png`) });
  ck(`[${tag}] brak bledow strony i konsoli`, errors.length === 0, errors.slice(0, 3));
  await page.close();
}

async function main() {
  fs.mkdirSync(shotsDir, { recursive: true });
  mark('start', { viewport: `${VW}x${VH}`, shotsDir, DIST, reuse: REUSE, mutant: MUTANT });
  if (!REUSE) await build();
  const server = http.createServer((req, res) => serveFile(DIST, req, res));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROMIUM_PATH || (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium'),
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
  });
  const errors = [];
  try {
    for (const role of ['atk', 'def']) {
      errors.length = 0;
      await runCase(browser, baseUrl, errors, role);
    }
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
  const failed = checks.filter(c => !c.ok).length;
  console.log(`\nWYNIK: ${checks.length - failed} PASS / ${failed} FAIL   zrzuty: ${shotsDir}   build: ${DIST}`);
  process.exitCode = failed ? 1 : 0;
}

main().catch(e => { console.error('[pbblue] ERR', e && e.stack ? e.stack : e); process.exitCode = 2; });
