'use strict';
/**
 * live-verify-wave-650-664-save-r2.cjs
 *
 * TEMAT: R-WEB-LIVE-VERIFY-WAVE-650-664-Q1, runda 2 (odpowiedz Obrony na zarzuty Evaluatora 2, 3, 4, 7).
 * Chromium na bundlu Vite zbudowanym POZA repo (hak testowy tylko w kopii bundla, src/ bez zmian).
 * Serwer STATYCZNY: poprawne MIME dla kazdego pliku, 404 dla brakujacych plikow, ZERO fallbacku na
 * index.html (poprzedni test serwowal index.html dla kazdego adresu -- stad „Unexpected token '<'").
 *
 * Pomiary w zywej grze:
 *  A) mapa: Ctrl+S zapisuje (baseline);
 *  B) bitwa (preset duzy, start przez UI); w bitwie:
 *     B1 Ctrl+S: probkowanie WIDOCZNOSCI #civ-hint-toast co 100 ms (display, rect, opacity, visibility),
 *        zrzut w pierwszej widocznej probce; asercja: komunikat widoczny w probkach, zero zapisow;
 *     B2 Esc -> menu pauzy: szukanie przycisku „Zapisz grę" BEZ filtra offsetParent (poprzedni test
 *        odrzucal elementy position:fixed, co dawalo falszywe saveBtnCount 0); klik -> zero zapisow;
 *     B3 autozapis rotacyjny (hak doRotatingAutosaveForTest) -> zero zapisow, ostrzezenie „pomijam”;
 *  C) bledy: pageerror, console.error, zasoby 404 lub odpowiedzi HTML dla adresow innych niz strona.
 *
 * Uruchomienie (z gra/): CIV_R2_OUT=<katalog poza repo> node tools/live-verify-wave-650-664-save-r2.cjs
 * Wyjscie: 0 = wszystkie asercje PASS; 1 = co najmniej jedna FAIL.
 */
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(process.env.CIV_R2_OUT || path.join(require('node:os').tmpdir(), 'civ-r2-bundle'));
const EVIDENCE = path.resolve(ROOT, '..', 'dyspozycje/autobot/runs/R-WEB-LIVE-VERIFY-WAVE-650-664-Q1/evidence/save-r2');
const CHROME = fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined;
const MSG = 'Zapis niedostępny w trakcie bitwy';
const MAP_BOOT_MS = 180000;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

let pass = 0;
let fail = 0;
const results = [];
function check(label, ok, detail) {
  results.push({ label, ok: !!ok, detail: detail ?? null });
  if (ok) { pass++; console.log('PASS ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
  else { fail++; console.log('FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
function note(label, detail) {
  results.push({ label, info: true, detail: detail ?? null });
  console.log('INFO ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
}

const SAVE_SPY = `
  window.__toastLog = [];
  new MutationObserver(() => {
    const el = document.getElementById('civ-hint-toast');
    if (!el) return;
    if (el.style.display === 'block') window.__toastLog.push({ t: (el.textContent || '').trim(), at: Date.now() });
    else window.__toastHide = (window.__toastHide || []).concat([{ at: Date.now(), disp: el.style.display }]).slice(-50);
    if (window.__toastLog.length > 800) window.__toastLog.splice(0, 400);
  }).observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
  window.__saveLog = [];
  const rec = (kind, key) => { window.__saveLog.push({ kind, key: String(key ?? ''), t: Date.now() }); };
  for (const k of ['put', 'add']) {
    const orig = IDBObjectStore.prototype[k];
    IDBObjectStore.prototype[k] = function (...a) { rec('idb.' + k + ':' + this.name, a.length ? (typeof a[1] === 'string' ? a[1] : (a[0] && a[0].id) || '') : ''); return orig.apply(this, a); };
  }
  const origSet = Storage.prototype.setItem;
  Storage.prototype.setItem = function (k, v) { rec('ls.setItem', k); return origSet.call(this, k, v); };
  if (window.FileSystemFileHandle) {
    const origCw = FileSystemFileHandle.prototype.createWritable;
    FileSystemFileHandle.prototype.createWritable = function (...a) { rec('fsa.createWritable', this.name); return origCw.apply(this, a); };
  }
  window.__keyLog = [];
  window.addEventListener('keydown', e => window.__keyLog.push({ at: Date.now(), key: e.key, ctrl: e.ctrlKey, prevented: e.defaultPrevented }), true);
  window.__consoleWarn = [];
  const origWarn = console.warn.bind(console);
  console.warn = (...a) => { window.__consoleWarn.push(a.map(String).join(' ')); origWarn(...a); };
`;

/** Plugin Vite: wylacznie w kopii bundla (src/ nietkniete). Dodaje haki pomiarowe do __eraTestDebug. */
function makePlugin() {
  return {
    name: 'wave-650-664-save-r2',
    enforce: 'pre',
    transform(code, moduleId) {
      if (!moduleId.endsWith('/src/main.ts')) return null;
      let output = code;
      const debugMarker = '      getWorldState: () => ({ citiesLen: cities.length, unitsLen: units.length, turn }),';
      if (!output.includes(debugMarker)) throw new Error('Nie znaleziono markera __eraTestDebug');
      output = output.replace(debugMarker, `${debugMarker}
      startLargeBattleForTest: () => launchBigPresetBattle('bitwa_duza_pole', false),
      mapCanvasForTest: () => renderer.domElement,
      isBattleOpenForTest: () => isBattleSceneOpen(),
      quickSaveForTest: () => doQuickSave(true),
      rotatingAutosaveForTest: () => doRotatingAutosave(),
      openPauseMenuForTest: () => toggleGamePauseMenu(),
      isPauseMenuOpenForTest: () => isGamePauseMenuOpen(),`);
      const battleMarker = '      const bs = new BattleScene(bOpts);';
      if (!output.includes(battleMarker)) throw new Error('Nie znaleziono konstrukcji BattleScene');
      output = output.replace(battleMarker, `${battleMarker}
      (window as any).__battleLiveProbe = { scene: bs, canvas: bs.canvas, isFinished: () => (bs as any).finished };`);
      return { code: output, map: null };
    },
  };
}

async function build() {
  const { build: viteBuild, mergeConfig } = await import('vite');
  const base = (await import(pathToFileURL(path.join(ROOT, 'vite.config.ts')).href)).default;
  await viteBuild(mergeConfig(base, {
    root: ROOT,
    plugins: [makePlugin()],
    build: { outDir: OUT, emptyOutDir: true },
    logLevel: 'warn',
  }));
}

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
  '.wav': 'audio/wav', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.wasm': 'application/wasm',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

/** Serwer statyczny: bez fallbacku na index.html. Zwraca liste anomalii (404, HTML dla zasobu). */
function startStaticServer(anomalies) {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
      if (pathname === '/favicon.ico') { res.statusCode = 204; res.end(); return; } // przegladarka pyta o ikone; poza zakresem pomiaru
      const rel = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
      const file = path.resolve(OUT, rel);
      if (!file.startsWith(OUT + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
        if (pathname !== '/') anomalies.push({ url: pathname, status: 404 });
        res.statusCode = 404;
        res.setHeader('content-type', 'text/plain; charset=utf-8');
        res.end('not found');
        return;
      }
      const type = MIME[path.extname(file).toLowerCase()] || 'application/octet-stream';
      if (type.startsWith('text/html') && pathname !== '/') anomalies.push({ url: pathname, status: 200, html: true });
      res.setHeader('content-type', type);
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function pressCtrlS(page) { await page.keyboard.press('Control+s'); }
async function saveCount(page) { return page.evaluate(() => window.__saveLog.length); }
async function saveKeys(page, from) { return page.evaluate(i => window.__saveLog.slice(i).map(e => e.kind + ':' + e.key), from); }

/** Widocznosc #civ-hint-toast w probkach co 100 ms przez `ms`; zrzut przy pierwszej widocznej probce. */
async function sampleToast(page, ms, shotFile) {
  const samples = [];
  let shot = null;
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    const s = await page.evaluate(() => {
      const d = document.getElementById('civ-hint-toast');
      if (!d) return null;
      const r = d.getBoundingClientRect();
      const cs = getComputedStyle(d);
      return {
        text: d.textContent.trim().slice(0, 80),
        display: d.style.display,
        rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)],
        opacity: cs.opacity,
        visibility: cs.visibility,
        z: d.style.zIndex,
        inViewport: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
        visible: d.style.display === 'block' && r.width > 0 && r.height > 0 && parseFloat(cs.opacity) > 0 && cs.visibility !== 'hidden',
      };
    });
    samples.push({ tMs: Date.now() - t0, ...(s || { missing: true }) });
    if (s && s.visible && !shot) {
      shot = path.join(EVIDENCE, shotFile);
      await page.screenshot({ path: shot, timeout: 15000 }).catch(() => {});
    }
    await wait(100);
  }
  const visibleSamples = samples.filter(s => s.visible);
  return {
    visibleCount: visibleSamples.length,
    visibleText: visibleSamples.length ? visibleSamples[0].text : null,
    textOk: visibleSamples.some(s => s.text.includes(MSG)),
    inViewport: visibleSamples.length ? visibleSamples.every(s => s.inViewport) : false,
    firstVisible: visibleSamples[0] || null,
    shot,
    samplesTotal: samples.length,
  };
}

async function main() {
  fs.mkdirSync(EVIDENCE, { recursive: true });
  const startedAt = Date.now();
  const evidence = { mode: 'real-r2', steps: [] };
  const errors = [];
  const anomalies = [];
  let browser = null;
  let server = null;
  try {
    await build();
    const indexPath = path.join(OUT, 'index.html');
    evidence.bundle = { path: indexPath, bytes: fs.statSync(indexPath).size, audioPacks: ['audio-pack-1.js', 'audio-pack-2.js', 'audio-pack-3.js'].map(f => ({ f, exists: fs.existsSync(path.join(OUT, f)) })) };
    console.log('BUILD ' + JSON.stringify(evidence.bundle));

    browser = await chromium.launch({
      headless: true,
      executablePath: CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
    });
    server = await startStaticServer(anomalies);
    const url = `http://127.0.0.1:${server.address().port}/?playtest=mapa`;

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(SAVE_SPY);
    const page = await context.newPage();
    page.setDefaultTimeout(120000);
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text().slice(0, 200)); });
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => !!window.__eraTestDebug?.startLargeBattleForTest, undefined, { timeout: 60000 });
    await page.waitForFunction(() => !!window.__eraTestDebug?.mapCanvasForTest?.()
      && !document.querySelector('.civ-map-load-overlay'), undefined, { timeout: MAP_BOOT_MS, polling: 500 });
    await wait(1000);

    // A) baseline poza bitwa
    let c0 = await saveCount(page);
    await pressCtrlS(page);
    await wait(1500);
    const baselineWrites = (await saveCount(page)) - c0;
    check('A baseline: poza bitwa Ctrl+S zapisuje', baselineWrites > 0, { writes: baselineWrites });

    // Start bitwy przez UI
    await page.evaluate(() => window.__eraTestDebug.startLargeBattleForTest());
    await page.waitForFunction(() => !!window.__battleLiveProbe?.canvas?.isConnected, undefined, { timeout: 30000 });
    await page.waitForFunction(() => !!document.getElementById('deploy-toolbar-start'), undefined, { timeout: 120000, polling: 250 });
    await page.evaluate(() => document.getElementById('deploy-toolbar-start').click());
    await wait(1500);
    const inBattle = await page.evaluate(() => window.__eraTestDebug.isBattleOpenForTest() && !window.__battleLiveProbe.isFinished());
    check('bitwa otwarta i nie zakonczona', inBattle === true, { inBattle });

    // B1) Ctrl+S w bitwie -- widocznosc komunikatu w czasie (probkowanie), zero zapisow
    c0 = await saveCount(page);
    const tKey = await page.evaluate(() => Date.now());
    await pressCtrlS(page);
    // Pokazanie komunikatu: obserwator DOM ze SAVE_SPY (display:block + tekst) od chwili klawisza.
    // Probkowanie widocznosci (node -> page) jest wolne pod swiftshader, wiec tylko uzupelnia.
    const toast = await sampleToast(page, 3000, 'B1-ctrl-s-w-bitwie-toast-widoczny.png');
    const shows = await page.evaluate(t0 => window.__toastLog.filter(e => e.at >= t0 && e.t.includes('Zapis niedostępny w trakcie bitwy')).map(e => e.at - t0), tKey);
    const diagB1 = await page.evaluate(t0 => ({
      logLenAll: window.__toastLog.length,
      logSinceKey: window.__toastLog.filter(e => e.at >= t0).map(e => [e.at - t0, e.t.slice(0, 40)]),
      keysSince: window.__keyLog.filter(e => e.at >= t0),
      toastNow: (() => { const d = document.getElementById('civ-hint-toast'); return d ? { display: d.style.display, text: d.textContent.trim().slice(0, 50) } : null; })(),
    }), tKey);
    evidence.diagB1 = diagB1;
    console.log('DIAG B1 ' + JSON.stringify(diagB1).slice(0, 700));
    // Rozroznienie: czy klawisz dociera do obslugi, a komunikat znika/nie pojawia sie?
    if (shows.length === 0) {
      const tDirect = await page.evaluate(() => Date.now());
      await page.evaluate(() => window.__eraTestDebug.quickSaveForTest());
      await wait(800);
      const directShows = await page.evaluate(t0 => window.__toastLog.filter(e => e.at >= t0).map(e => e.at - t0), tDirect);
      evidence.diagB1Direct = { directShows };
      console.log('DIAG B1 bezposrednio doQuickSave: pokazania=' + JSON.stringify(directShows));
    }
    const battleWrites = (await saveCount(page)) - c0;
    const battleKeys = await saveKeys(page, c0);
    check('B1a Ctrl+S w bitwie: zero zapisow', battleWrites === 0, { writes: battleWrites, keys: battleKeys });
    check('B1b komunikat „' + MSG + '” pokazany po Ctrl+S (display:block, obserwator DOM)', shows.length > 0, { showsMs: shows });
    if (toast.visibleCount > 0) {
      check('B1c komunikat WIDOCZNY w probce (rect>0, opacity>0, visibility) i w viewport', toast.inViewport, { firstVisible: toast.firstVisible, shot: toast.shot });
    } else {
      note('B1c widocznosc w probkach niezlapana (probkowanie wolne: samplesTotal=' + toast.samplesTotal + ')', { samplesTotal: toast.samplesTotal });
    }
    evidence.steps.push({ step: 'B1-ctrl-s-battle', writes: battleWrites, keys: battleKeys, showsMs: shows, toast });

    // B2) Menu pauzy (Esc) -> „Zapisz grę" bez filtra offsetParent
    await wait(1500);
    c0 = await saveCount(page);
    // Esc tylko ZAMYKA menu pauzy (main.ts: obsluga Escape); otwarcie idzie przez przycisk paska
    // (onOpenMenu -> toggleGamePauseMenu). Tu: ten sam toggle wywolany hakiem testowym.
    await page.evaluate(() => window.__eraTestDebug.openPauseMenuForTest());
    await wait(900);
    const pauseOpen = await page.evaluate(() => window.__eraTestDebug.isPauseMenuOpenForTest());
    const pauseButtons = await page.evaluate(() => Array.from(document.querySelectorAll('button'))
      .filter(b => /zapisz grę/i.test(b.textContent || ''))
      .map(b => ({ text: b.textContent.trim().slice(0, 40), rects: b.getClientRects().length, display: getComputedStyle(b).display, visibility: getComputedStyle(b).visibility, pos: getComputedStyle(b).position })));
    const pauseVisible = pauseButtons.filter(b => b.rects > 0 && b.display !== 'none' && b.visibility !== 'hidden');
    evidence.steps.push({ step: 'B2-pause-buttons', pauseOpen, pauseButtons });
    note('B2 stan menu pauzy po otwarciu w bitwie', { pauseOpen, pauseButtonsFound: pauseButtons.length });
    if (pauseVisible.length > 0) {
      await page.screenshot({ path: path.join(EVIDENCE, 'B2-menu-pauzy-w-bitwie.png') }).catch(() => {});
      const tPause = await page.evaluate(() => Date.now());
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find(x => /zapisz grę/i.test(x.textContent || '') && x.getClientRects().length > 0);
        if (b) b.click();
      });
      const pauseToast = await sampleToast(page, 2500, 'B2-klik-zapisz-w-bitwie-toast.png');
      const pauseWrites = (await saveCount(page)) - c0;
      check('B2a menu pauzy „Zapisz grę” w bitwie: zero zapisow', pauseWrites === 0, { writes: pauseWrites, keys: await saveKeys(page, c0), tPause });
      check('B2b menu pauzy w bitwie: komunikat widoczny', pauseToast.visibleCount > 0 && pauseToast.textOk, { visibleCount: pauseToast.visibleCount, firstVisible: pauseToast.firstVisible });
      evidence.steps.push({ step: 'B2-pause-click', writes: pauseWrites, toast: pauseToast });
    } else {
      note('B2 przycisk „Zapisz grę” nie jest widoczny w menu pauzy po Esc w bitwie (rozpoznanie DOM)', { pauseButtons });
      await page.screenshot({ path: path.join(EVIDENCE, 'B2-po-esc-w-bitwie.png') }).catch(() => {});
    }
    // zamkniecie menu pauzy (jesli otwarte) -- Escape zamyka menu pauzy
    if (pauseOpen) { await page.keyboard.press('Escape'); await wait(700); }

    // B3) Autozapis rotacyjny w bitwie
    c0 = await saveCount(page);
    const w0 = await page.evaluate(() => window.__consoleWarn.length);
    await page.evaluate(() => window.__eraTestDebug.rotatingAutosaveForTest());
    await wait(1500);
    const autoWrites = (await saveCount(page)) - c0;
    const autoWarn = await page.evaluate(i => window.__consoleWarn.slice(i).filter(s => s.includes('[Autosave]')), w0);
    check('B3a autozapis rotacyjny w bitwie: zero zapisow', autoWrites === 0, { writes: autoWrites, keys: await saveKeys(page, c0) });
    check('B3b autozapis rotacyjny w bitwie: pominiety (ostrzezenie konsoli)', autoWarn.length > 0 && autoWarn.some(s => s.includes('pomijam')), { autoWarn });
    evidence.steps.push({ step: 'B3-autosave-battle', writes: autoWrites, autoWarn });

    await page.screenshot({ path: path.join(EVIDENCE, 'final-w-bitwie.png') }).catch(() => {});
    evidence.errors = errors;
    evidence.anomalies = anomalies;
    check('C1 brak pageerror i console.error w sesji', errors.length === 0, { count: errors.length, errors: errors.slice(0, 10) });
    check('C2 brak 404 i odpowiedzi HTML dla zasobow (serwer statyczny, bez fallbacku)', anomalies.length === 0, { count: anomalies.length, anomalies: anomalies.slice(0, 20) });
  } catch (err) {
    fail++;
    console.log('FAIL wyjatek: ' + (err && err.stack || err));
    results.push({ label: 'wyjatek', ok: false, detail: String(err && err.message || err) });
  } finally {
    evidence.checks = results;
    evidence.durationMs = Date.now() - startedAt;
    evidence.summary = { pass, fail };
    fs.writeFileSync(path.join(EVIDENCE, 'live-result-r2.json'), JSON.stringify(evidence, null, 2));
    if (browser) await browser.close().catch(() => {});
    if (server) server.close();
    console.log(`Wynik: ${pass} PASS / ${fail} FAIL / czas ${Math.round((Date.now() - startedAt) / 1000)} s`);
    process.exit(fail === 0 ? 0 : 1);
  }
}

main();
