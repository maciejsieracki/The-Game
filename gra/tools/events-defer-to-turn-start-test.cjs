'use strict';
/**
 * events-defer-to-turn-start-test.cjs — R-WEB-EVENTS-DEFER-TO-TURN-START-Q1.
 *
 * Regula wlasciciela: informacje / odkrycia / wydarzenia z tur innych cywilizacji i PM pojawiaja
 * sie dopiero na POCZATKU nowej tury gracza (wyjatek: dyplomacja wymagajaca odpowiedzi).
 *
 * Warstwy (kazda jest bramka):
 *  A. JEDNOSTKOWA — realny modul `src/game/event-defer-queue.ts` (esbuild): FIFO, filtr fotela
 *     (hot-seat), wyjatek dyplomacji, odpornosc na wyjatek, reentrancja, `clear()` (load/nowa gra).
 *  B. MUTACJE — te same asercje na zmutowanych kopiach modulu MUSZA sie wywrocic.
 *  C. STRUKTURALNA — main.ts: kazdy punkt emisji modalu (tech, cud, zdobycie miasta) idzie przez
 *     `emitOrDeferNotice`; flush wpiety w `flushDeferredMergePrompts` i `advanceSeat`; `clear()`
 *     w `resetEndTurnBlockers`.
 *  D. ZYWA (Chromium, bundle w /dev/shm) — REALNY `advanceSeat()` (koniec tury): modal odkrycia
 *     technologii z auto-badania NIE moze sie pojawic, gdy `endTurnInProgress===true`; pojawia sie
 *     po zakonczeniu tury; modal w fazie gracza (`openTechCompletion`) pozostaje natychmiastowy.
 *     Pomijana flaga `--no-live`.
 *
 * Uruchomienie (z gra/): node tools/events-defer-to-turn-start-test.cjs [--no-live]
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
const MODULE_SRC = path.join(GRA, 'src', 'game', 'event-defer-queue.ts');
const MAIN_SRC = path.join(GRA, 'src', 'main.ts');
const NO_LIVE = process.argv.includes('--no-live');

let pass = 0;
let fail = 0;
function ok(label, cond, detail) {
  if (cond) { pass++; console.log('  OK   ' + label); }
  else { fail++; console.error('  FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

function bundleModule(srcText, tag) {
  const tmpDir = fs.mkdtempSync('/dev/shm/evq-unit-' + tag + '-');
  const tsFile = path.join(tmpDir, 'mod.ts');
  const outFile = path.join(tmpDir, 'mod.cjs');
  fs.writeFileSync(tsFile, srcText, 'utf8');
  esbuild.buildSync({ entryPoints: [tsFile], bundle: true, platform: 'node', format: 'cjs', outfile: outFile, logLevel: 'silent' });
  const mod = require(outFile);
  return { mod, cleanup: () => fs.rmSync(tmpDir, { recursive: true, force: true }) };
}

/** Asercje jednostkowe; zwraca liczbe porazek (do uzycia przez warstwe mutacji). */
function unitChecks(B, report) {
  let bad = 0;
  const chk = (label, cond) => { if (!cond) bad++; if (report) ok(label, cond); };

  chk('A1 faza EOT: modal odraczany', B.shouldDeferNotice(true, 'tech-discovery') === true);
  chk('A2 faza gracza: modal natychmiast', B.shouldDeferNotice(false, 'tech-discovery') === false);
  chk('A3 dyplomacja = wyjatek (nie odraczana nawet w EOT)', B.shouldDeferNotice(true, 'diplomacy') === false);
  chk('A4 cud i zdobycie miasta odraczane w EOT',
    B.shouldDeferNotice(true, 'wonder-completed') && B.shouldDeferNotice(true, 'city-capture'));

  const q = B.createEventDeferQueue();
  const fired = [];
  q.enqueue('tech-discovery', 0, () => fired.push('t1'));
  q.enqueue('wonder-completed', 0, () => fired.push('w1'));
  q.enqueue('city-capture', 0, () => fired.push('c1'));
  chk('A5 przed flushem nic nie odpalone', fired.length === 0 && q.size() === 3);
  const n = q.flushFor(0);
  chk('A6 flush odpala wszystko w kolejnosci wystapienia', n === 3 && fired.join(',') === 't1,w1,c1');
  chk('A7 po flushu kolejka pusta, drugi flush nic nie dubluje', q.size() === 0 && q.flushFor(0) === 0 && fired.length === 3);

  // hot-seat: wpisy fotela 1 czekaja na jego ture
  const h = B.createEventDeferQueue();
  const hf = [];
  h.enqueue('tech-discovery', 0, () => hf.push('A1'));
  h.enqueue('tech-discovery', 1, () => hf.push('B1'));
  h.enqueue('city-capture', 0, () => hf.push('A2'));
  h.enqueue('wonder-completed', 1, () => hf.push('B2'));
  chk('A8 hot-seat: flush fotela 0 odpala tylko jego wpisy w kolejnosci', h.flushFor(0) === 2 && hf.join(',') === 'A1,A2');
  chk('A9 hot-seat: wpisy fotela 1 nietkniete do jego tury', h.sizeFor(1) === 2 && h.size() === 2);
  chk('A10 hot-seat: flush fotela 1 odpala jego wpisy w kolejnosci', h.flushFor(1) === 2 && hf.join(',') === 'A1,A2,B1,B2');

  // odpornosc na wyjatek
  const e = B.createEventDeferQueue();
  const ef = [];
  const errs = [];
  e.enqueue('tech-discovery', 0, () => { throw new Error('boom'); });
  e.enqueue('city-capture', 0, () => ef.push('after'));
  const en = e.flushFor(0, (err) => errs.push(String(err)));
  chk('A11 wyjatek w jednym wpisie nie gubi pozostalych', ef.join(',') === 'after' && en === 1 && errs.length === 1);

  // reentrancja
  const r = B.createEventDeferQueue();
  let rc = 0;
  r.enqueue('tech-discovery', 0, () => { rc++; r.flushFor(0); });
  r.flushFor(0);
  chk('A12 reentrancja nie dubluje wpisu', rc === 1);

  // zapis/wczytanie: clear() zeruje (brak duplikatow po wczytaniu), brak gubienia przed clear
  const s = B.createEventDeferQueue();
  let sc = 0;
  s.enqueue('tech-discovery', 0, () => sc++);
  chk('A13 wpis oczekuje (nie zgubiony) przed wczytaniem', s.size() === 1 && s.snapshot()[0].channel === 'tech-discovery');
  s.clear();
  chk('A14 po wczytaniu/nowej grze clear() = brak duplikatow', s.size() === 0 && s.flushFor(0) === 0 && sc === 0);
  return bad;
}

async function main() {
  console.log('events-defer-to-turn-start-test');
  const src = fs.readFileSync(MODULE_SRC, 'utf8');

  // --- A ---
  console.log('[A] jednostkowa');
  const real = bundleModule(src, 'real');
  unitChecks(real.mod, true);
  real.cleanup();

  // --- B ---
  console.log('[B] mutacje (kazda MUSI wywrocic asercje A)');
  const mutations = [
    ['M1 EOT nie odracza', "return endTurnInProgress && !isDeferExemptChannel(channel);", "return false;"],
    ['M2 dyplomacja tez odraczana', "return channel === 'diplomacy';", "return false;"],
    ['M3 flush ignoruje fotel', "const mine = entries.filter(e => e.ownerId === ownerId);", "const mine = entries.slice();"],
    ['M4 flush gubi kolejnosc', "mine.sort((a, b) => a.seq - b.seq);", "mine.reverse();"],
    ['M5 wyjatek gubi reszte', "} catch (err) {\n          if (onError) onError(err, e);\n        }", "} catch (err) {\n          throw err;\n        }"],
    ['M6 clear nic nie robi', "clear() {\n      entries = [];\n    },", "clear() {\n    },"],
    ['M7 wpisy nie usuwane po flushu (duplikaty)', "entries = entries.filter(e => e.ownerId !== ownerId);", ""],
  ];
  for (const [name, from, to] of mutations) {
    if (!src.includes(from)) { ok(name + ' (wzorzec mutacji obecny w module)', false); continue; }
    const m = bundleModule(src.replace(from, to), name.split(' ')[0]);
    let bad = 0;
    try { bad = unitChecks(m.mod, false); } catch (err) { bad = 1; }
    m.cleanup();
    ok(name + ' -> test A wywraca sie (' + bad + ' porazek)', bad > 0);
  }

  // --- C ---
  console.log('[C] strukturalna main.ts');
  const main = fs.readFileSync(MAIN_SRC, 'utf8');
  const count = (re) => (main.match(re) || []).length;
  ok('C1 trzy punkty emisji modalu technologii przez emitOrDeferNotice',
    count(/emitOrDeferNotice\('tech-discovery'/g) === 3, count(/emitOrDeferNotice\('tech-discovery'/g));
  // surowe wolania showWonderCompletedNotice / showCityCaptureNotice tylko wewnatrz helperow
  const rawWonder = main.split('\n').filter(l => /\bshowWonderCompletedNotice\(/.test(l) && !/Deferred|Parameters<|import|=> showWonderCompletedNotice\(opts\)/.test(l));
  ok('C2 brak surowych wolan showWonderCompletedNotice poza helperem', rawWonder.length === 0, rawWonder);
  const rawCapture = main.split('\n').filter(l => /\bshowCityCaptureNotice\(/.test(l) && !/Deferred|Parameters<|=> showCityCaptureNotice\(\.\.\.args\)/.test(l));
  ok('C3 brak surowych wolan showCityCaptureNotice poza helperem', rawCapture.length === 0, rawCapture);
  ok('C4 flush wpiety w flushDeferredMergePrompts (wszystkie punkty odblokowania)',
    /function flushDeferredMergePrompts\(\): void \{\s*flushDeferredNotices\(\);/.test(main));
  ok('C5 flush w advanceSeat dla fotela wchodzacego w ture (hot-seat)',
    /switchActiveHuman\(nextSeat\);[\s\S]{0,900}flushDeferredNotices\(\);\s*return;/.test(main));
  ok('C6 clear() w resetEndTurnBlockers (nowa gra / wczytanie)',
    /pendingEraChangeToastForNextTurn = null;\s*eventDeferQueue\.clear\(\);/.test(main));
  ok('C7 flushDeferredNotices respektuje EOT i modale bitwy/audiencji',
    /function flushDeferredNotices\(\): void \{\s*if \(endTurnInProgress \|\| eventDeferQueue\.size\(\) === 0\) return;\s*if \(isPreBattleOpen\(\) \|\| isDiplomacyAudienceOpen\(\)\) return;/.test(main));
  // finally przejscia tury: endTurnInProgress=false PRZED flushDeferredMergePrompts
  const iFalse = main.indexOf('endTurnInProgress = false;\n          endTurnStartedAt = 0;');
  const iFlush = main.indexOf('flushDeferredMergePrompts();', iFalse);
  { const bad = (main.match(/emitOrDeferNotice\('[a-z-]+',\s*0\s*,/g) || []);
    ok('C10 ownerId wpisu = aktywny fotel (nie stale 0) — hot-seat fotel 1+', bad.length === 0 && /emitOrDeferNotice\('tech-discovery', humanSeats\.activeHumanOwnerId,/.test(main), bad); }
  ok('C11 naprawa z-index toastu przy panelu imperium zachowana', /\(isMainMenuOpen\(\) \|\| isEmpireDetailPanelOpen\(\)\) \? '600' : '320'/.test(main));
  ok('C9 renderLoop ponawia flush odlozonych modali (czekajacych za bitwa/audiencja)', /requestAnimationFrame\(renderLoop\);[^]{0,400}eventDeferQueue\.size\(\) > 0\) flushDeferredNotices\(\)/.test(main));
  ok('C8 w finally przejscia tury flush po zgaszeniu endTurnInProgress', iFalse > 0 && iFlush > iFalse && iFlush - iFalse < 4000);

  // --- D ---
  if (NO_LIVE) {
    console.log('[D] zywa: POMINIETA (--no-live)');
  } else {
    console.log('[D] zywa (Chromium, REALNY advanceSeat)');
    await liveChecks();
  }

  console.log(`\nwynik: ${pass} OK, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
}

async function liveChecks() {
  const outDir = '/dev/shm/evq-live-' + process.pid;
  try {
    execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${outDir} --emptyOutDir`, { cwd: GRA, stdio: 'pipe', timeout: 500000 });
  } catch (e) {
    ok('D0 build bundla', false, String(e.message).slice(0, 200));
    return;
  }
  const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium',
    args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    // Faza AI losowo otwiera bitwe (modal blokujacy) -- wtedy odlozony modal CZEKA za nia (zamierzone);
    // do asercji D1-D4 potrzebny jest przebieg bez bitwy na koniec tury: do 4 prob.
    let done = false;
    for (let attempt = 1; attempt <= 4 && !done; attempt++) {
      const r = await liveAttempt(browser, outDir, attempt);
      if (r === 'inconclusive') continue;
      done = true;
    }
    if (!done) ok('D-ALL przebieg bez otwartej bitwy na koniec tury (4 proby)', false);
  } finally {
    await browser.close();
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}

async function liveAttempt(browser, outDir, attempt) {
  const page = await browser.newPage();
  try {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('file://' + outDir + '/index.html?playtest=mapa&civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(
      () => window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0
        && window.__eraTestDebug.getWorldState().turn === 1,
      null, { timeout: 180000 });
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      window.__log = [];
      const t0 = performance.now();
      const rec = (k, d) => window.__log.push({ t: Math.round(performance.now() - t0), k, d, eot: window.__eraTestDebug.isEndTurnInProgress() });
      window.__rec = rec;
      const hostVisible = () => {
        const h = document.getElementById('civ-tech-discovery-notice-host');
        return !!h && getComputedStyle(h).display !== 'none';
      };
      const check = () => {
        if (hostVisible() && !window.__seen) {
          window.__seen = true;
          rec('TECH_MODAL_VISIBLE', (document.getElementById('civ-tech-discovery-notice-host').textContent || '').slice(0, 40));
        }
      };
      new MutationObserver(check).observe(document.body, { childList: true, subtree: true, attributes: true });
      setInterval(check, 20);
      window.__eraTestDebug.prepareOneTechFromBronze();
      rec('CALL_END_TURN', '');
      window.__eraTestDebug.endTurn();
    });
    for (let i = 0; i < 120; i++) {
      await page.waitForTimeout(1000);
      if (!(await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress()))) break;
    }
    await page.waitForTimeout(1500);
    const pbOpen = await page.evaluate(() => !!document.querySelector('.pb-overlay'));
    const log = await page.evaluate(() => window.__log);
    console.log(`  [proba ${attempt}] pb-overlay otwarty po EOT: ${pbOpen}`);
    for (const l of log) console.log(`    t=${l.t}ms ${l.k} eot=${l.eot} ${l.d}`);
    let modal = log.find(l => l.k === 'TECH_MODAL_VISIBLE');
    if (pbOpen) {
      // Bitwa otwarta w fazie AI: odlozony modal ma CZEKAC za nia, potem pokazac sie (nie zgubic).
      ok('D2b modal NIE wyskakuje na wierzch otwartej bitwy (czeka za nia)', !modal, modal);
      for (let k = 0; k < 6; k++) {
        const clicked = await page.evaluate(() => {
          const b = document.querySelector('.pb-overlay [data-act="auto"]');
          if (b) { b.click(); return true; }
          return false;
        });
        if (!clicked) break;
        await page.waitForTimeout(2500);
      }
      await page.waitForTimeout(1500);
      const stillOpen = await page.evaluate(() => !!document.querySelector('.pb-overlay'));
      const log2 = await page.evaluate(() => window.__log);
      modal = log2.find(l => l.k === 'TECH_MODAL_VISIBLE');
      if (stillOpen) { ok('D2c bitwa daje sie zamknac w tescie (Auto)', false); return 'inconclusive'; }
      ok('D2d po zamknieciu bitwy odlozony modal sie pokazuje (nie zgubiony)', !!modal, log2.slice(-3));
    }
    ok('D1 modal odkrycia technologii pojawil sie po przejsciu tury', !!modal);
    ok('D2 modal NIE pojawil sie w trakcie tur innych cywilizacji (endTurnInProgress===false w chwili pokazania)',
      !!modal && modal.eot === false, modal);
    ok('D3 modal dotyczy odkrytej technologii (Brazownictwo)', !!modal && /Br[aą]zownictw/i.test(modal.d || ''), modal);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    const hiddenAfterEsc = await page.evaluate(() => {
      const h = document.getElementById('civ-tech-discovery-notice-host');
      return !h || getComputedStyle(h).display === 'none';
    });
    ok('D3b modal zamyka sie Esc (warunek D4)', hiddenAfterEsc);
    await page.evaluate(() => { window.__seen = false; });
    const immediate = await page.evaluate(async () => {
      const before = window.__log.length;
      window.__eraTestDebug.openTechCompletion('Rolnictwo');
      await new Promise(r => setTimeout(r, 120));
      return window.__log.slice(before).find(l => l.k === 'TECH_MODAL_VISIBLE') || null;
    });
    ok('D4 modal w fazie gracza pozostaje natychmiastowy (bez odroczenia)', !!immediate && immediate.eot === false, immediate);
    ok('D5 zero bledow strony', errors.length === 0, errors.slice(0, 3));
    return 'done';
  } finally {
    await page.close();
  }
}

main().catch((e) => { console.error(e); process.exit(2); });
