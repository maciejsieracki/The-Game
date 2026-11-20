'use strict';
/**
 * R-WEB-UI-BATTLE-BANNER-OVERLAPS-RETREAT-1024X640-Q1 -- ZYWY driver bitwy w Chromium.
 *
 * Startuje prawdziwa mape swiata (?playtest=mapa), otwiera produkcyjna bitwe 28 vs 28
 * (przycisk „START WALKI”) i mierzy geometrie gornego paska bitwy w trzech rozdzielczosciach:
 *   - baner dowodcow (commanderPanel, srodek gornej belki) NIE moze przecinac zadnego
 *     widocznego elementu gornego paska (przycisk „Wycofaj się”, zebatka, „Pomiń”, etykiety
 *     tury/predkosci/pauzy, emblemat);
 *   - srodek przycisku „Wycofaj się” musi byc klikalny: elementFromPoint = ten przycisk;
 *   - baner musi miescic sie w viewpoincie (brak przycinania poza ekran).
 *
 * Tryb mutacji (--mutant): w pamieci (plugin vite, zadne zrodlo w repo nie jest zmieniane)
 * wylaczana jest funkcja dopasowania banera (_syncCommanderPanelLayout), zostaje statyczny
 * przed-poprawkowy styl. Test musi wtedy czerwienic w 1024x640 -- dowod, ze asercje lapia regresje.
 *
 * Build vite POZA repo (os.tmpdir() lub --dist), zadne zrodlo w repo nie jest zmieniane;
 * sonda (__battleLargeReturnProbe) jest wstrzykiwana pluginem do main.ts w pamieci.
 *
 * Uzycie (z katalogu gra/):
 *   node tools/battle-banner-retreat-overlap-live-test.cjs [--vp 1024x640] [--dist <katalog>] [--shots <katalog>] [--mutant] [--reuse]
 *   Kolejne viewporty bez ponownego builda: --dist <katalog z pierwszego uruchomienia> --reuse --vp 1280x720
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
const shotsDir = path.resolve(arg('--shots', path.join(os.tmpdir(), `battle-banner-retreat-shots-${runId}`)));
const REUSE = argv.includes('--reuse');
const MUTANT = argv.includes('--mutant');
const DIST = path.resolve(arg('--dist', path.join(os.tmpdir(), `battle-banner-retreat-dist-${runId}${MUTANT ? '-mutant' : ''}`)));
const MAP_BOOT_MS = Math.max(10000, Number(process.env.BANNER_TEST_MAP_BOOT_MS || 150000));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const checks = [];
function ck(name, ok, extra) {
  checks.push({ name, ok: !!ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra === undefined ? '' : '  ' + JSON.stringify(extra)}`);
}
function mark(phase, data) {
  console.log(`[banner-retreat ${new Date().toISOString()}] ${phase}${data === undefined ? '' : ' ' + JSON.stringify(data)}`);
}

async function build() {
  const vite = await import('vite');
  const loaded = await vite.loadConfigFromFile({ command: 'build', mode: 'production' }, path.join(root, 'vite.config.ts'), root);
  const plugin = {
    name: 'temporary-battle-banner-retreat-probe',
    enforce: 'pre',
    transform(code, moduleId) {
      if (moduleId.endsWith('/src/battle/battleScene.ts') && MUTANT) {
        // Mutant: wylacz dopasowanie banera dowodcow (zostaje statyczny, przed-poprawkowy maxWidth). Tylko w pamieci buildu.
        const sig = 'private _syncCommanderPanelLayout(): void {';
        if (code.split(sig).length !== 2) throw new Error('mutant: nie znaleziono _syncCommanderPanelLayout');
        return { code: code.replace(sig, sig + ' return;'), map: null };
      }
      if (!moduleId.endsWith('/src/main.ts')) return null;
      let output = code;
      const debugMarker = '      getWorldState: () => ({ citiesLen: cities.length, unitsLen: units.length, turn }),';
      if (!output.includes(debugMarker)) throw new Error('Could not locate __eraTestDebug marker');
      output = output.replace(debugMarker, `${debugMarker}
      startLargeBattleForTest: () => launchBigPresetBattle('bitwa_duza_pole', false),`);
      const battleMarker = '      const bs = new BattleScene(bOpts);';
      if (!output.includes(battleMarker)) throw new Error('Could not locate production BattleScene construction');
      output = output.replace(battleMarker, `${battleMarker}
      (window as any).__battleLargeReturnProbe = { scene: bs, canvas: bs.canvas, isFinished: () => (bs as any).finished };`);
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

// Geometria gornego paska w przegladarce. Tylko odczyt (getBoundingClientRect / elementFromPoint).
const IN_PAGE_GEOMETRY = `
(() => {
  const s = window.__battleLargeReturnProbe.scene;
  const top = s._topBar;
  const banner = s._commanderPanel;
  const rect = el => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const inter = (a, b) => a.x < b.r && b.x < a.r && a.y < b.b && b.y < a.b;
  const visible = el => { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getBoundingClientRect().width > 0; };
  // Elementy gornego paska, ktore musza pozostac odsloniete: przyciski oraz etykiety z tekstem i emblemat.
  const cands = [...top.querySelectorAll('button, span, div')].filter(el => {
    if (!visible(el)) return false;
    if (el.tagName === 'BUTTON') return true;
    if (el.id === 'battle-top-civ-emblem') return true;
    return el.children.length === 0 && (el.textContent || '').trim().length > 0;
  });
  const items = cands.map(el => ({ label: (el.textContent || el.title || el.id || el.tagName).trim().slice(0, 40), tag: el.tagName, rect: rect(el) }));
  // Prostokat banera = suma wszystkich potomkow z realnym rectem (wyjscie tresci poza ramke tez sie liczy).
  const bannerRect = (() => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const el of [banner, ...banner.querySelectorAll('*')]) {
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) continue;
      x0 = Math.min(x0, r.left); y0 = Math.min(y0, r.top); x1 = Math.max(x1, r.right); y1 = Math.max(y1, r.bottom);
    }
    return { x: x0, y: y0, r: x1, b: y1, w: x1 - x0, h: y1 - y0 };
  })();
  const overlapping = items.filter(it => inter(bannerRect, it.rect)).map(it => ({ label: it.label, rect: it.rect }));
  const retreatBtn = [...s.overlay.querySelectorAll('button')].find(b => /Wycofaj/.test(b.textContent || '') && visible(b));
  let retreat = null;
  if (retreatBtn) {
    const rr = rect(retreatBtn);
    const cx = rr.x + rr.w / 2, cy = rr.y + rr.h / 2;
    const hit = document.elementFromPoint(cx, cy);
    retreat = { rect: rr, hitIsButton: !!hit && (hit === retreatBtn || retreatBtn.contains(hit)), hitTag: hit ? hit.tagName : null,
      bannerOverlapsRetreat: inter(bannerRect, rr) };
  }
  return { vw: innerWidth, vh: innerHeight, banner: bannerRect, bannerInViewport: bannerRect.x >= 0 && bannerRect.r <= innerWidth,
    bannerOverlapped: overlapping, itemCount: items.length, retreat, roundNo: s.roundNo };
})()
`;

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

async function runViewport(browser, baseUrl, errors) {
  const page = await browser.newPage({ viewport: { width: VW, height: VH } });
  page.setDefaultTimeout(60000);
  page.on('pageerror', e => errors.push(String(e.message || e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  const tag = `${VW}x${VH}`;
  await page.goto(baseUrl + '/?playtest=mapa', { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(() => !!window.__eraTestDebug?.startLargeBattleForTest, undefined, { timeout: 60000 });
  await waitMapReady(page);
  mark('map:ready', { tag });
  await page.evaluate(() => window.__eraTestDebug.startLargeBattleForTest());
  await page.waitForFunction(() => !!window.__battleLargeReturnProbe?.canvas?.isConnected, undefined, { timeout: 60000 });
  const startBtn = page.getByText(/^START WALKI$/i).last();
  await startBtn.waitFor({ state: 'visible', timeout: 60000 });
  await startBtn.click({ timeout: 180000 });
  await wait(1500);
  const geo = await page.evaluate(IN_PAGE_GEOMETRY);
  mark(`geometry:${tag}`, { banner: geo.banner, retreat: geo.retreat, bannerOverlapped: geo.bannerOverlapped });
  const shot = path.join(shotsDir, `banner-retreat-${tag}${MUTANT ? '-mutant' : ''}.png`);
  await page.screenshot({ path: shot, fullPage: false });
  mark('shot', { shot });
  ck(`[${tag}] przycisk „Wycofaj się” istnieje i jest widoczny`, !!geo.retreat, geo.retreat);
  if (geo.retreat) {
    ck(`[${tag}] baner dowodcow nie przecina przycisku „Wycofaj się”`, !geo.retreat.bannerOverlapsRetreat, { retreat: geo.retreat.rect, banner: geo.banner });
    ck(`[${tag}] srodek przycisku „Wycofaj się” jest klikalny (elementFromPoint = przycisk)`, geo.retreat.hitIsButton, { hitTag: geo.retreat.hitTag });
  }
  ck(`[${tag}] baner dowodcow nie przecina zadnego elementu gornego paska (zebatka, Pomin, tura, predkosc, wynik)`,
    geo.bannerOverlapped.length === 0, { overlapped: geo.bannerOverlapped.slice(0, 6), items: geo.itemCount });
  ck(`[${tag}] baner dowodcow miesci sie w viewporcie`, geo.bannerInViewport, geo.banner);
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
    await runViewport(browser, baseUrl, errors);
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
  const failed = checks.filter(c => !c.ok).length;
  console.log(`\nWYNIK: ${checks.length - failed} PASS / ${failed} FAIL   zrzuty: ${shotsDir}   build: ${DIST}`);
  process.exitCode = failed ? 1 : 0;
}

main().catch(e => { console.error('[banner-retreat] ERR', e && e.stack ? e.stack : e); process.exitCode = 2; });
