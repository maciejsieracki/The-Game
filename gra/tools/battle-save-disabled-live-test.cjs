'use strict';
/**
 * battle-save-disabled-live-test.cjs
 *
 * TEMAT: R-WEB-BATTLE-SAVE-DISABLED-DURING-BATTLE-Q1.
 * Test ZYWY w Chromium na produkcyjnym bundlu (Vite build poza repo, serwowany HTTP na
 * 127.0.0.1). Nie zapisuje zrodel produktu.
 *
 * Przebieg:
 *  1) mapa (bez bitwy): Ctrl+S ZAPISUJE (baseline: zapis dziala poza bitwa);
 *  2) otwarcie bitwy duzej (preset 28v28) i start przez UI (#deploy-toolbar-start);
 *  3) w bitwie: Ctrl+S NIE zapisuje (zero wywolan zapisu IDB/localStorage/FSA) i pokazuje
 *     komunikat „Zapis niedostepny w trakcie bitwy”;
 *  4) w bitwie: przycisk „Zapisz” w menu pauzy (Esc), jesli dostepny -- ten sam wynik;
 *  5) zakonczenie bitwy (scene.skip()), zamkniecie podsumowania, powrot na mape;
 *  6) po bitwie: Ctrl+S ZAPISUJE ponownie.
 *
 * Liczniki zapisu: init-script opakowuje IDBObjectStore.put/add, Storage.setItem oraz
 * FileSystemFileHandle.createWritable i rejestruje kazde wywolanie (klucz/typ) w
 * window.__saveLog. „Zero zapisow” = brak wpisow w oknie czasowym.
 *
 * Tryb MUTANT (--mutant): w kopii bundla bramka isSaveBlockedByBattle() zwraca false.
 * Oczekiwane: test CZERWIENI (asercja 3 FAIL, exit 1). Dowod, ze test wykrywa regresje
 * zachowania, a nie tylko tekst zrodla.
 *
 * Uruchomienie (z gra/): node tools/battle-save-disabled-live-test.cjs [--mutant]
 * Env: CIV_SAVE_TEST_OUT = katalog na bundle (poza repo); CIV_SAVE_TEST_EVIDENCE = katalog na dowody.
 * Wyjscie: 0 = wszystkie asercje PASS; 1 = co najmniej jedna FAIL.
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const MUTANT = process.argv.includes('--mutant');
const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT = process.env.CIV_SAVE_TEST_OUT
  ? path.resolve(process.env.CIV_SAVE_TEST_OUT, MUTANT ? 'mutant' : 'real')
  : path.join(os.tmpdir(), `civ-save-disabled-${RUN_ID}${MUTANT ? '-mutant' : ''}`);
const EVIDENCE = process.env.CIV_SAVE_TEST_EVIDENCE
  ? path.resolve(process.env.CIV_SAVE_TEST_EVIDENCE)
  : path.resolve(ROOT, '..', 'dyspozycje/autobot/runs/R-WEB-BATTLE-SAVE-DISABLED-DURING-BATTLE-Q1/evidence');
const CHROME = fs.existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined;
const MSG = 'Zapis niedostępny w trakcie bitwy';
const MAP_BOOT_MS = 180000;
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

let pass = 0;
let fail = 0;
const results = [];
function check(label, ok, detail) {
  results.push({ label, ok, detail: detail ?? null });
  if (ok) { pass++; console.log('PASS ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
  else { fail++; console.log('FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
function note(label, detail) {
  results.push({ label, info: true, detail: detail ?? null });
  console.log('INFO ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
}

/** Wstrzykiwany przed kodem strony: rejestr wywolan zapisu. */
const SAVE_SPY = `
  window.__toastLog = [];
  new MutationObserver(() => {
    const el = document.getElementById('civ-hint-toast');
    if (!el) return;
    if (el.style.display === 'block') window.__toastLog.push({ t: (el.textContent || '').trim(), at: Date.now() });
    else window.__toastHide = (window.__toastHide || []).concat([{ at: Date.now(), disp: el.style.display }]).slice(-50);
    if (window.__toastLog.length > 800) window.__toastLog.splice(0, 400);
  }).observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
  window.__keyLog = [];
  window.addEventListener('keydown', e => window.__keyLog.push('cap:' + e.key + ':' + e.ctrlKey + ':' + (e.defaultPrevented ? 1 : 0)), true);
  window.addEventListener('keydown', e => window.__keyLog.push('bub:' + e.key + ':' + e.ctrlKey + ':' + (e.defaultPrevented ? 1 : 0)));
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
`;

/** Plugin Vite: hook testowy (start bitwy) + opcjonalny mutant bramki. */
function makePlugin() {
  return {
    name: 'battle-save-disabled-live',
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
      quickSaveForTest: () => doQuickSave(true),`);
      const battleMarker = '      const bs = new BattleScene(bOpts);';
      if (!output.includes(battleMarker)) throw new Error('Nie znaleziono konstrukcji BattleScene');
      output = output.replace(battleMarker, `${battleMarker}
      (window as any).__battleLiveProbe = { scene: bs, canvas: bs.canvas, isFinished: () => (bs as any).finished };`);
      const notifyLine = "      showHintMessage('Zapis niedostępny w trakcie bitwy', 3000, undefined, true);";
      if (output.includes(notifyLine)) output = output.replace(notifyLine, notifyLine + "\n      (window as any).__blockedNotify = ((window as any).__blockedNotify || 0) + 1; (window as any).__blockedDisplay = (() => { const r = hintToast.getBoundingClientRect(); const cs = getComputedStyle(hintToast); const chain = []; let p: HTMLElement | null = hintToast; while (p && chain.length < 8) { chain.push(p.tagName + '#' + p.id + '.' + p.className + ' d=' + getComputedStyle(p).display + ' v=' + getComputedStyle(p).visibility + ' o=' + getComputedStyle(p).opacity); p = p.parentElement; } return { display: hintToast.style.display, rect: [r.left, r.top, r.width, r.height], vis: cs.visibility, op: cs.opacity, z: cs.zIndex, pos: cs.position, chain }; })();");
      if (MUTANT) {
        const guardBody = '    function isSaveBlockedByBattle(): boolean {\n      return isBattleSceneOpen() || isPostBattleSummaryOpen();';
        if (!output.includes(guardBody)) throw new Error('MUTANT: nie znaleziono ciala isSaveBlockedByBattle');
        output = output.replace(guardBody, '    function isSaveBlockedByBattle(): boolean {\n      return false; // MUTANT: bramka wylaczona');
      }
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

async function pressCtrlS(page) {
  await page.keyboard.press('Control+s');
}

async function saveCount(page) {
  return page.evaluate(() => window.__saveLog.length);
}

async function saveKeys(page, from) {
  return page.evaluate(i => window.__saveLog.slice(i).map(e => e.kind + ':' + e.key), from);
}

async function toastSince(page, t0, pred) {
  return page.evaluate(([from, p]) => window.__toastLog.some(e => e.at >= from && (p === null ? true : e.t.includes(p))), [t0, pred]);
}

async function hintVisible(page, text, timeoutMs) {
  try {
    await page.waitForFunction(t => Array.from(document.querySelectorAll('div')).some(d => {
      if (d.textContent.trim() !== t || d.style.display !== 'block') return false;
      const r = d.getBoundingClientRect();
      const cs = getComputedStyle(d);
      return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0 && Number(d.style.zIndex) >= 10000;
    }), text, { timeout: timeoutMs, polling: 100 });
    return true;
  } catch (_) { return false; }
}

async function shot(page, name) {
  fs.mkdirSync(EVIDENCE, { recursive: true });
  const file = path.join(EVIDENCE, `${MUTANT ? 'mutant-' : ''}${name}.png`);
  await page.screenshot({ path: file, timeout: 15000 }).catch(() => {});
  return file;
}

async function main() {
  const startedAt = Date.now();
  const evidence = { mode: MUTANT ? 'mutant' : 'real', steps: [] };
  let browser = null;
  let server = null;
  const errors = [];
  try {
    await build();
    const indexPath = path.join(OUT, 'index.html');
    const sha = crypto.createHash('sha256').update(fs.readFileSync(indexPath)).digest('hex');
    evidence.bundle = { path: indexPath, sha256: sha, bytes: fs.statSync(indexPath).size };
    console.log('BUILD ' + JSON.stringify(evidence.bundle));

    browser = await chromium.launch({
      headless: true,
      executablePath: CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
    });
    server = http.createServer((req, res) => {
      res.setHeader('content-type', 'text/html; charset=utf-8');
      fs.createReadStream(indexPath).pipe(res);
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const url = `http://127.0.0.1:${server.address().port}/?playtest=mapa`;

    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(SAVE_SPY);
    const page = await context.newPage();
    page.setDefaultTimeout(120000);
    page.on('pageerror', e => errors.push('pageerror: ' + e.message));
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction(() => !!window.__eraTestDebug?.startLargeBattleForTest, undefined, { timeout: 60000 });
    await page.waitForFunction(() => !!window.__eraTestDebug?.mapCanvasForTest?.()
      && !document.querySelector('.civ-map-load-overlay'), undefined, { timeout: MAP_BOOT_MS, polling: 500 });
    await wait(1000);

    // 1) Baseline poza bitwa.
    let c0 = await saveCount(page);
    const tBase = await page.evaluate(() => Date.now());
    await pressCtrlS(page);
    await wait(1500);
    const baselineWrites = (await saveCount(page)) - c0;
    const baselineToast = await toastSince(page, tBase, 'Szybki zapis');
    check('1 baseline: poza bitwa Ctrl+S zapisuje (liczniki zapisu rosna)', baselineWrites > 0, { writes: baselineWrites, toast: baselineToast });
    evidence.steps.push({ step: 'baseline-map', writes: baselineWrites, toast: baselineToast });

    // 2) Otwarcie bitwy i start przez UI.
    await page.evaluate(() => window.__eraTestDebug.startLargeBattleForTest());
    await page.waitForFunction(() => !!window.__battleLiveProbe?.canvas?.isConnected, undefined, { timeout: 30000 });
    await page.waitForFunction(() => !!document.getElementById('deploy-toolbar-start'), undefined, { timeout: 120000, polling: 250 });
    await page.evaluate(() => document.getElementById('deploy-toolbar-start').click());
    await wait(1500);
    const inBattle = await page.evaluate(() => window.__eraTestDebug.isBattleOpenForTest() && !window.__battleLiveProbe.isFinished());
    check('2 bitwa otwarta (isBattleSceneOpen = true, bitwa nie zakonczona)', inBattle === true, { inBattle });
    await shot(page, 'in-battle-before-save');

    // 3) Zapis w bitwie: bezposrednio przez doQuickSave (ta sama funkcja co Ctrl+S) i klawiszem.
    c0 = await saveCount(page);
    const notify0 = await page.evaluate(() => window.__blockedNotify || 0);
    const tDirect = await page.evaluate(() => Date.now());
    const directRet = await page.evaluate(() => window.__eraTestDebug.quickSaveForTest());
    const notifyAfterDirect = await page.evaluate(() => window.__blockedNotify || 0) - notify0;
    await wait(800);
    const directWrites = (await saveCount(page)) - c0;
    const toastDirect = await toastSince(page, tDirect, MSG);
    check('3a doQuickSave w bitwie: zwraca false i zero zapisow (IDB/localStorage/FSA)', directRet === false && directWrites === 0, { ret: directRet, writes: directWrites, keys: await saveKeys(page, c0), toastDirect, notifyAfterDirect, blockedDisplay: await page.evaluate(() => window.__blockedDisplay) });
    c0 = await saveCount(page);
    const k0 = await page.evaluate(() => window.__keyLog.length);
    const tKey = await page.evaluate(() => Date.now());
    await pressCtrlS(page);
    const keysSeen = await page.evaluate(i => window.__keyLog.slice(i), k0);
    await page.waitForFunction(t0 => window.__toastLog.some(e => e.at >= t0), tKey, { timeout: 20000, polling: 100 }).catch(() => {});
    const coverDiag = await page.evaluate(() => { const d = document.getElementById('civ-hint-toast'); if (!d) return null; const r = d.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); const cs = getComputedStyle(d); return { display: d.style.display, text: d.textContent.trim().slice(0, 50), rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)], pointerEvents: cs.pointerEvents, color: cs.color, bg: cs.backgroundColor, fontSize: cs.fontSize, topEl: e ? (e.tagName + '#' + e.id + '.' + String(e.className).slice(0, 80)) : null, topIsToast: !!e && d.contains(e), viewport: [innerWidth, innerHeight] }; });
    console.log('COVER ' + JSON.stringify(coverDiag));
    console.log('SEQ ' + JSON.stringify({ tKey, shows: await page.evaluate(t0 => window.__toastLog.filter(e => e.at >= t0).map(e => [e.at - t0, e.t.slice(0, 20)]), tKey), hides: await page.evaluate(t0 => (window.__toastHide || []).filter(e => e.at >= t0).map(e => [e.at - t0, e.disp]), tKey) }));
    await shot(page, 'in-battle-ctrl-s-toast');
    await wait(1500);
    const toastInBattle = await toastSince(page, tKey, MSG);
    const toastDiag = await page.evaluate(() => Array.from(document.querySelectorAll('div')).filter(d => (d.textContent || '').includes('Zapis') && d.children.length === 0).map(d => { const r = d.getBoundingClientRect(); return { text: d.textContent.trim().slice(0, 60), display: d.style.display, z: d.style.zIndex, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] }; }).slice(0, 5));
    await wait(1500);
    const battleWrites = (await saveCount(page)) - c0;
    const battleKeys = await saveKeys(page, c0);
    check('3c Ctrl+S w bitwie: zero zapisow (klawisz)', battleWrites === 0, { writes: battleWrites, keys: battleKeys, keysSeen });
    check('3b Ctrl+S w bitwie: komunikat „' + MSG + '” widoczny', toastInBattle, { toastInBattle, toastDiag });
    await shot(page, 'in-battle-ctrl-s-blocked');
    evidence.steps.push({ step: 'ctrl-s-in-battle', writes: battleWrites, keys: battleKeys, toast: toastInBattle });

    // 4) Menu pauzy (Esc) -> przycisk „Zapisz”, jesli istnieje. Best-effort; wynik zapisany.
    c0 = await saveCount(page);
    await page.keyboard.press('Escape');
    await wait(700);
    const saveBtnCount = await page.evaluate(() => Array.from(document.querySelectorAll('button'))
      .filter(b => /zapisz/i.test(b.textContent || '') && b.offsetParent !== null).length);
    if (saveBtnCount > 0) {
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button'))
          .find(x => /zapisz/i.test(x.textContent || '') && x.offsetParent !== null);
        if (b) b.click();
      });
      const pauseToast = await hintVisible(page, MSG, 3000);
      await wait(1000);
      const pauseWrites = (await saveCount(page)) - c0;
      check('4 menu pauzy „Zapisz” w bitwie: zero zapisow + komunikat', pauseWrites === 0 && pauseToast, { writes: pauseWrites, toast: pauseToast });
    } else {
      note('4 menu pauzy „Zapisz” nie znaleziono w DOM przy Esc (sciezka niezmierzona na zywo; bramka strukturalna w kodzie)', { saveBtnCount });
    }
    await shot(page, 'after-pause-attempt');
    // Zamknij ewentualne menu (Esc) i wroc do sceny bitwy.
    await page.keyboard.press('Escape');
    await wait(500);

    // 5) Zakonczenie bitwy (przewinięcie) i zamkniecie podsumowania.
    await page.evaluate(() => { const bs = window.__battleLiveProbe.scene; bs.renderer.render = () => {}; bs.skip(); });
    const endDeadline = Date.now() + 300000;
    let lastDiag = 0;
    while (!(await page.evaluate(() => window.__battleLiveProbe.isFinished()))) {
      if (Date.now() > endDeadline) throw new Error('bitwa nie zakonczyla sie w 300 s po skip()');
      if (Date.now() - lastDiag > 20000) {
        lastDiag = Date.now();
        console.log('diag skip', JSON.stringify(await page.evaluate(() => { const b = window.__battleLiveProbe.scene; return { started: b.started, deployPhase: !!b.deployPhase, ff: !!b._ffActive, paused: !!b.paused, logLen: (b.log || []).length, lastLog: (b.log || []).slice(-1)[0] }; })));
      }
      await wait(500);
    }
    await wait(1500);
    let summaryClicked = null;
    for (let i = 0; i < 40; i++) {
      summaryClicked = await page.evaluate(() => {
        const cands = Array.from(document.querySelectorAll('button'))
          .filter(b => b.offsetParent !== null && /^(kontynuuj|dalej|zamknij|powr[oó]t na map[eę]|wr[oó]ć na map[eę])$/i.test((b.textContent || '').trim()));
        const b = cands[0];
        if (!b) return null;
        const label = (b.textContent || '').trim();
        b.click();
        return label;
      });
      if (summaryClicked) break;
      await wait(500);
    }
    check('5 zakonczenie bitwy: podsumowanie zamkniete przyciskiem', !!summaryClicked, { button: summaryClicked });
    await wait(2500);
    const backOnMap = await page.evaluate(() => !window.__eraTestDebug.isBattleOpenForTest());
    check('5b po bitwie: isBattleSceneOpen = false (powrot na mape)', backOnMap, { backOnMap });
    await shot(page, 'after-battle-map');

    // 6) Po bitwie: Ctrl+S zapisuje.
    c0 = await saveCount(page);
    const tPost = await page.evaluate(() => Date.now());
    await pressCtrlS(page);
    await wait(1500);
    const postWrites = (await saveCount(page)) - c0;
    const postToast = await toastSince(page, tPost, 'Szybki zapis');
    check('6 po bitwie: Ctrl+S znowu zapisuje', postWrites > 0, { writes: postWrites, toast: postToast });
    evidence.steps.push({ step: 'ctrl-s-after-battle', writes: postWrites, toast: postToast });
    evidence.steps.push({ step: 'summary-button', label: summaryClicked });
  } catch (error) {
    check('0 wykonanie testu bez wyjatku', false, { error: String(error && error.message || error) });
  } finally {
    evidence.errors = errors.slice(-30);
    evidence.checks = results;
    evidence.durationMs = Date.now() - startedAt;
    try {
      fs.mkdirSync(EVIDENCE, { recursive: true });
      fs.writeFileSync(path.join(EVIDENCE, `${MUTANT ? 'mutant-' : ''}live-result.json`), JSON.stringify(evidence, null, 2));
    } catch (_) { /* dowody best-effort */ }
    if (browser) await browser.close().catch(() => {});
    if (server) server.close();
  }
  console.log('\nWynik' + (MUTANT ? ' (MUTANT)' : '') + ': ' + pass + ' PASS / ' + fail + ' FAIL / czas ' + Math.round((Date.now() - startedAt) / 1000) + ' s');
  process.exit(fail === 0 ? 0 : 1);
}

main();
