'use strict';
/**
 * test-hook-guard-test.cjs -- R-WEB-TEST-HOOK-HEADLESS-GAME-Q1, kryteria (a) i (d).
 *
 * (a) Bez `?testhook=1` żaden global `window.__test` nie istnieje; `Math.random` jest
 *     natywny (hak nie reseeduje RNG w produkcji).
 * (b) Z `?testhook=1` hak istnieje i ma pełny kształt API.
 * (c) Czyste funkcje hooka (parser bramki, mulberry32, stabilny skrót, normalizacja
 *     parametrów, redukcja snapshotu) zachowują się zgodnie z kontraktem.
 *
 * Uruchomienie (z katalogu gra/): node tools/test-hook-guard-test.cjs
 * Wynik: wypisuje PASS/FAIL per asercja; kod wyjścia 0 tylko gdy wszystkie PASS.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { withSimBundle, launchBrowser, openSimPage, wait } = require('./lib/game-sim-harness.cjs');

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' -- ' + detail : ''}`);
}

/** Kompiluje test-hook.ts do CJS w katalogu tymczasowym (poza repo) i zwraca moduł. */
function loadPureModule() {
  const esbuild = require('esbuild');
  const src = path.resolve(__dirname, '..', 'src', 'game', 'test-hook.ts');
  const out = esbuild.buildSync({
    entryPoints: [src], bundle: true, format: 'cjs', platform: 'node', write: false,
    logLevel: 'silent',
  });
  const dir = path.join(os.tmpdir(), `civ-guard-testhook-${process.pid}-${Math.random().toString(36).slice(2, 8)}`);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, 'test-hook.cjs');
  fs.writeFileSync(file, out.outputFiles[0].text);
  try {
    return require(file);
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* best-effort */ }
  }
}

function pureChecks() {
  const m = loadPureModule();
  check('parser: ?testhook=1 włącza', m.isTestHookRequested('?testhook=1') === true);
  check('parser: brak parametru wyłącza', m.isTestHookRequested('') === false);
  check('parser: ?testhook=0 wyłącza', m.isTestHookRequested('?testhook=0') === false);
  check('parser: ?testhook=true nie włącza (ścisła wartość 1)', m.isTestHookRequested('?testhook=true') === false);

  const r1 = m.mulberry32(42), r2 = m.mulberry32(42), r3 = m.mulberry32(43);
  const a = [r1(), r1(), r1()], b = [r2(), r2(), r2()], c = [r3(), r3(), r3()];
  check('mulberry32: ten sam seed -> ta sama sekwencja', JSON.stringify(a) === JSON.stringify(b));
  check('mulberry32: inny seed -> inna sekwencja', JSON.stringify(a) !== JSON.stringify(c));
  check('mulberry32: wartości w [0,1)', a.every(x => x >= 0 && x < 1));

  check('stableHash: kolejność kluczy nie zmienia skrótu',
    m.stableHash({ x: 1, y: [2, { p: 1, q: 2 }] }) === m.stableHash({ y: [2, { q: 2, p: 1 }], x: 1 }));
  check('stableHash: różne dane -> różny skrót', m.stableHash({ x: 1 }) !== m.stableHash({ x: 2 }));

  let threw = '';
  try { m.normalizeStartOpts({ seed: 1, aiCount: 3 }); } catch (e) { threw = String(e.message); }
  check('normalizeStartOpts: aiCount=3 odrzucone (zakres 4–6)', /4–6/.test(threw), threw);
  const ok = m.normalizeStartOpts({ seed: 7, aiCount: 4, difficulty: 'hard', era: 'braz' });
  check('normalizeStartOpts: hard -> Trudny (etykieta kreatora)', ok.difficulty === 'Trudny');
  check('normalizeStartOpts: domyślne cityStates=2, playerPassive=true',
    ok.cityStates === 2 && ok.playerPassive === true);

  const raw = {
    turn: 3,
    cities: [{ owner: 1, q: 1, r: 1, pop: 2 }, { owner: 2, q: 5, r: 5, pop: 1 }],
    units: [{ owner: 1, typ: 'Wojownik', q: 1, r: 2 }],
    relations: [
      { a: 2, b: 1, status: 'wojna', zaufanie: 10 },
      { a: 1, b: 3, status: 'pokoj', zaufanie: 55 },
    ],
    deals: 1,
    offers: [{ id: 'd1', ownerId: 3, cmdType: 'x', reason: 'r', goldOnce: -5 }],
  };
  const s = m.summarizeRaw(raw);
  check('summarizeRaw: wojna normalizowana do pary posortowanej', JSON.stringify(s.wars) === '[[1,2]]');
  check('summarizeRaw: liczba wojen i właścicieli', s.warCount === 1 && s.owners === 2);
  check('summarizeRaw: zaufanie po kluczu pary', s.trust['1-3'] === 55 && s.trust['1-2'] === 10);
  const s2 = m.summarizeRaw({ ...raw, units: [{ owner: 1, typ: 'Wojownik', q: 1, r: 2 }] });
  check('summarizeRaw: skrót stabilny dla identycznego stanu', s.hash === s2.hash);
  const s3 = m.summarizeRaw({ ...raw, turn: 4 });
  check('summarizeRaw: skrót zmienia się przy zmianie stanu', s.hash !== s3.hash);
}

async function browserChecks(bundleDir) {
  const browser = await launchBrowser();
  try {
    // (a) bez hooka
    const off = await openSimPage(browser, { bundleDir, testhook: false });
    try {
      await off.page.waitForFunction(() => !!window.__eraTestDebug, undefined, { timeout: 180000 });
      const info = await off.page.evaluate(() => ({
        hasTest: typeof window.__test !== 'undefined',
        rndNative: /\[native code\]/.test(Math.random.toString()),
      }));
      check('(a) bez ?testhook=1: window.__test NIE istnieje', info.hasTest === false);
      check('(a) bez ?testhook=1: Math.random natywny (brak reseedu)', info.rndNative === true);
      check('(a) bez ?testhook=1: brak błędów strony', off.pageErrors.length === 0,
        off.pageErrors.length ? off.pageErrors[0] : '');
    } finally {
      await off.context.close();
    }

    // (b) z hakiem
    const on = await openSimPage(browser, { bundleDir, testhook: true });
    try {
      await on.page.waitForFunction(() => !!window.__test, undefined, { timeout: 180000 });
      const shape = await on.page.evaluate(() => ({
        startGame: typeof window.__test.startGame,
        runTurns: typeof window.__test.runTurns,
        snapshot: typeof window.__test.snapshot,
        setFlag: typeof window.__test.setFlag,
      }));
      check('(b) z ?testhook=1: __test.startGame/runTurns/snapshot/setFlag są funkcjami',
        Object.values(shape).every(t => t === 'function'), JSON.stringify(shape));
      let flagErr = '';
      try { await on.page.evaluate(() => window.__test.setFlag('nieistnieje', true)); } catch (e) { flagErr = String(e.message); }
      check('(b) setFlag nieznanej flagi rzuca błąd', /brak nadpisania/.test(flagErr), flagErr.slice(0, 120));
      await wait(100);
      check('(b) brak błędów strony z hakiem', on.pageErrors.length === 0,
        on.pageErrors.length ? on.pageErrors[0] : '');
    } finally {
      await on.context.close();
    }
  } finally {
    await browser.close();
  }
}

async function main() {
  pureChecks();
  await withSimBundle(async ({ bundleDir }) => {
    await browserChecks(bundleDir);
  });
  const failed = results.filter(r => !r.ok).length;
  console.log(`\nWYNIK: ${results.length - failed}/${results.length} PASS`);
  process.exitCode = failed ? 1 : 0;
}

main().catch(e => { console.error('[test-hook-guard] BŁĄD:', e && e.stack || e); process.exitCode = 1; });
