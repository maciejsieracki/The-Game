'use strict';
/**
 * R-WEB-UI-BATTLE-DAMAGE-COLORS-BLUE-RED-Q1 (runda 2) -- ZYWY driver bitwy w Chromium.
 *
 * Startuje prawdziwa mape swiata (?playtest=mapa), otwiera produkcyjna bitwe 28 vs 28
 * (przycisk „START WALKI”), a nastepnie wywoluje PRODUKCYJNE metody ciosu sceny bitwy
 * (_doAttack = wrecz, _doRangedAttack = dystans) na jednostkach ustawionych na legalnych
 * heksach (sasiad dla wrecz, dystans 2 dla dystansu). Przechwytuje kazde wywolanie
 * _spawnDamageLabel (wrapper na instancji, zadnej zmiany zrodel) i odczytuje
 * computed color pływającej etykiety obrazen.
 *
 * Kryterium: obrazenia zadane PRZECIWNIKOWI = niebieskie (#8fb6e0), obrazenia jednostek
 * GRACZA = czerwone (#ff7070). Zrzut po kazdym trafieniu (wrecz i dystans, 2 rozdzielczosci).
 *
 * Build vite POZA repo (os.tmpdir()), zadne zrodlo w repo nie jest zmieniane:
 * sonda (__battleLargeReturnProbe) jest wstrzykiwana pluginem do main.ts w pamieci.
 *
 * Uzycie (z katalogu gra/):
 *   node tools/battle-damage-colors-live-test.cjs [--vp 1440x900] [--dist <katalog buildu>] [--shots <katalog>]
 *   Drugi viewport bez ponownego builda: --dist <katalog z pierwszego uruchomienia> --vp 1024x640
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const argv = process.argv.slice(2);
const arg = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const [VW, VH] = String(arg('--vp', '1440x900')).split('x').map(Number);
const runId = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const shotsDir = path.resolve(arg('--shots', path.join(os.tmpdir(), `battle-dmg-colors-shots-${runId}`)));
const REUSE = argv.includes('--dist');
const DIST = path.resolve(arg('--dist', path.join(os.tmpdir(), `battle-dmg-colors-dist-${runId}`)));
const MAP_BOOT_MS = Math.max(10000, Number(process.env.BATTLE_DMG_MAP_BOOT_MS || 150000));
const EXPECT = { enemy: 'rgb(143, 182, 224)', player: 'rgb(255, 112, 112)' }; // #8fb6e0 / #ff7070
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const checks = [];
function ck(name, ok, extra) {
  checks.push({ name, ok: !!ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${extra === undefined ? '' : '  ' + JSON.stringify(extra)}`);
}
function mark(phase, data) {
  console.log(`[dmg-colors ${new Date().toISOString()}] ${phase}${data === undefined ? '' : ' ' + JSON.stringify(data)}`);
}

async function build() {
  const vite = await import('vite');
  const loaded = await vite.loadConfigFromFile({ command: 'build', mode: 'production' }, path.join(root, 'vite.config.ts'), root);
  const plugin = {
    name: 'temporary-battle-damage-colors-live-probe',
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
  mark('build:start', { DIST });
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

// Sonda w przegladarce: haki na instancji sceny bitwy (wrapper _spawnDamageLabel) i pomocnicy ciosu.
// Wszystkie ciosy i ustawienia pozycji idą przez produkcyjne metody sceny.
const IN_PAGE_HELPERS = `
(() => {
  const s = window.__battleLargeReturnProbe.scene;
  const log = [];
  const els = [];
  window.__dmgLog = log;
  const orig = s._spawnDamageLabel;
  s._spawnDamageLabel = function (ru, dmg) {
    const n0 = this.floatLabels.length;
    orig.call(this, ru, dmg);
    if (this.floatLabels.length > n0) {
      const fl = this.floatLabels[this.floatLabels.length - 1];
      // Test-only: etykieta zyje dluzej, zeby zrzut po ciosie pokazal ja na ekranie (nie zmienia produktu).
      fl.duration = 60000;
      const el = fl.elem;
      els.push(el);
      log.push({ id: ru.bu.id, side: ru.side, isPlayer: this._isPlayerSide(ru.side), dmg, text: el.textContent,
        color: getComputedStyle(el).color, connected: el.isConnected });
    }
  };
  const hexDist = (aq, ar, bq, br) => { const dq = aq - bq, dr = ar - br; return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(dq + dr)); };
  const alive = u => !u.dead && !u.fadingOut && !u.routed;
  const occupied = (q, r) => s.occByKey.get(q + ',' + r);
  const place = (u, q, r) => {
    s.occByKey.delete(u.q + ',' + u.r);
    u.q = q; u.r = r; u.acted = false; u.dead = false; u.routed = false;
    u.moveLeft = u.moveMax; u.playerOrder = { type: 'none' };
    s.occByKey.set(q + ',' + r, u);
  };
  const cells = (cx, cy, dist) => {
    const out = [];
    for (let dq = -dist; dq <= dist; dq++) for (let dr = -dist; dr <= dist; dr++) {
      if (hexDist(0, 0, dq, dr) !== dist) continue;
      out.push([cx + dq, cy + dr]);
    }
    return out;
  };
  const freeCell = (t, dist) => cells(t.q, t.r, dist).find(([q, r]) => s.terrainMap.passable(q, r) && !occupied(q, r));
  // Wybor celu i atakujacego po stronie: wantPlayer=true -> cel jest jednostka gracza (ciosy przeciwnika).
  const pickPair = (wantPlayer, ranged) => {
    const all = [...s.atk, ...s.def].filter(alive);
    const isPl = u => s._isPlayerSide(u.side);
    const targets = all.filter(u => isPl(u) === wantPlayer);
    const attackers = all.filter(u => isPl(u) !== wantPlayer && (ranged ? (u.rangedBase && u.ammoLeft > 0) : !u.rangedBase));
    return { targets, attackers };
  };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const callAttack = (a, t, ranged) => new Promise(resolve => {
    const guard = setTimeout(resolve, 8000);
    const done = () => { clearTimeout(guard); resolve(); };
    if (ranged) s._doRangedAttack(a, t, done); else s._doAttack(a, t, done);
  });
  // Jedno trafienie: ustawia atakujacego (wrecz: sasiad; dystans: heks w odleglosci 2), wykonuje cios
  // produkcyjna metoda, az pojawi sie etykieta na celu (max 25 prob, nowe cele po zgonie).
  window.__dmgHit = async (wantPlayer, ranged) => {
    const dist = ranged ? 2 : 1;
    const before = log.length;
    for (let attempt = 0; attempt < 25; attempt++) {
      const { targets, attackers } = pickPair(wantPlayer, ranged);
      if (!targets.length || !attackers.length) return { error: 'no-pair', targets: targets.length, attackers: attackers.length };
      const t = targets[attempt % targets.length];
      const a = attackers[attempt % attackers.length];
      const cell = freeCell(t, dist);
      if (!cell) continue;
      place(a, cell[0], cell[1]);
      s._applyTerrainRange && s._applyTerrainRange(a);
      if (!ranged && hexDist(a.q, a.r, t.q, t.r) !== 1) continue;
      if (ranged && (hexDist(a.q, a.r, t.q, t.r) !== 2 || a.range <= 1)) continue;
      await callAttack(a, t, ranged);
      const hitIdx = log.findIndex((e, i) => i >= before && e.id === t.bu.id);
      const hit = hitIdx >= 0 ? log[hitIdx] : null;
      if (hit) {
        await wait(400);
        const el = els[hitIdx];
        const rect = el.getBoundingClientRect();
        return { ok: true, attempt, attacker: a.bu.id, attackerSide: a.side, target: t.bu.id, targetSide: t.side,
          entry: hit, labelDisplay: getComputedStyle(el).display, labelOpacity: getComputedStyle(el).opacity, labelText: el.textContent,
          labelRect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height }, vw: innerWidth, vh: innerHeight,
          labelInViewport: rect.width > 0 && rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= innerWidth && rect.y + rect.height <= innerHeight };
      }
    }
    return { error: 'no-label-after-attempts', newEntries: log.slice(before) };
  };
  return { ok: true, round: s.roundNo, atk: s.atk.length, def: s.def.length, playerSide: s._playerControlSide() };
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
  const setup = await page.evaluate(IN_PAGE_HELPERS);
  ck(`[${tag}] bitwa wystartowala po „START WALKI” (roster 28 vs 28)`, setup && setup.ok && setup.atk === 28 && setup.def === 28, setup);
  if (!setup || !setup.ok) return;

  const steps = [
    { name: 'wrecz-przeciwnik', wantPlayer: false, ranged: false, expect: EXPECT.enemy },
    { name: 'wrecz-gracz', wantPlayer: true, ranged: false, expect: EXPECT.player },
    { name: 'dystans-przeciwnik', wantPlayer: false, ranged: true, expect: EXPECT.enemy },
    { name: 'dystans-gracz', wantPlayer: true, ranged: true, expect: EXPECT.player },
  ];
  for (const st of steps) {
    const res = await page.evaluate(([w, r]) => window.__dmgHit(w, r), [st.wantPlayer, st.ranged]);
    mark(`hit:${st.name}:${tag}`, res);
    if (res.error) { ck(`[${tag}] ${st.name}: trafienie wykonane`, false, res); continue; }
    const shot = path.join(shotsDir, `${st.name}-${tag}.png`);
    await page.screenshot({ path: shot, fullPage: false });
    mark('shot', { shot });
    ck(`[${tag}] ${st.name}: etykieta obrazen na celu (${res.entry.isPlayer ? 'gracz' : 'przeciwnik'}) = ${st.expect}`,
      res.entry.color === st.expect && res.entry.text.startsWith('-') && res.entry.connected,
      { target: res.target, side: res.targetSide, color: res.entry.color, text: res.entry.text, labelInViewport: res.labelInViewport, shot });
    if (!res.labelInViewport) mark('note:label-outside-viewport', { step: st.name, tag, labelRect: res.labelRect });
  }
  const log = await page.evaluate(() => window.__dmgLog);
  const bad = log.filter(e => e.color !== (e.isPlayer ? EXPECT.player : EXPECT.enemy));
  ck(`[${tag}] wszystkie etykiety obrazen w logu: gracz czerwone / przeciwnik niebieskie`, bad.length === 0 && log.length > 0, { total: log.length, bad: bad.slice(0, 5) });
  fs.writeFileSync(path.join(shotsDir, `dmg-log-${tag}.json`), JSON.stringify(log, null, 2) + '\n');
  ck(`[${tag}] brak bledow strony i konsoli`, errors.length === 0, errors.slice(0, 3));
  await page.close();
}

async function main() {
  fs.mkdirSync(shotsDir, { recursive: true });
  mark('start', { viewport: `${VW}x${VH}`, shotsDir, DIST, reuse: REUSE });
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

main().catch(e => { console.error('[dmg-colors] ERR', e && e.stack ? e.stack : e); process.exitCode = 2; });
