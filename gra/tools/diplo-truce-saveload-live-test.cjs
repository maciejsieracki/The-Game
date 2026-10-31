'use strict';
/**
 * diplo-truce-saveload-live-test.cjs — R-WEB-TRUCE-E2E-SAVELOAD-MEASURE-Q1, CZĘŚĆ B.
 *
 * Prawdziwy roundtrip zapisu stanu dyplomacji w trakcie aktywnego rozejmu:
 *   Strona 1 (zapis): nowa gra (?playtest=mapa) → rozejm AI→gracz przez REALNĄ akceptację
 *     (acceptTruceForTest = aiCommandToPendingProposal → resolvePlayerAcceptsAiPending →
 *     applyProposalOutcome), ustawienie stanu flagi agresora / casus belli / licznika wojen
 *     epoki (SETUP przez __truceSaveLoadTestDebug), jedna tura EOT w oknie rozejmu, potem
 *     REALNY zapis do slotu (persistSaveToSlot → saveToLocal → IndexedDB) i kopia slotu w formacie
 *     SPRZED pól rozejmu/flagi/licznika (stary zapis).
 *   Strona 2 (NOWA strona Chromium, ten sam profil przeglądarki): nowa gra → REALNE wczytanie slotu
 *     (loadGameFromSlot = „Wczytaj grę") → porównanie stanu z zapisem: truceUntilTurn i długość
 *     rozejmu, aggressorFlagUntilByOwner, casusBelliUntilByPair, licznik wojen epoki, meta pary
 *     (diplomacyPairMeta), zdarzenia Wiarygodności, brak duplikacji i utraty.
 *   Potem kilka tur po wczytaniu: rozejm trwa do tury U (włącznie z U-1), w turze U wygasa do wojny
 *     BEZ kary (brak nowego 'zlamanie_paktu_nap') i BEZ nowej flagi agresora.
 *   Stary zapis (bez pól rozejmu/flagi/licznika) wczytuje się bez błędu z wartościami domyślnymi.
 *
 * Usage (z gra/): SKIP_BUILD=1 node tools/diplo-truce-saveload-live-test.cjs <scratchAbs>
 *   Bundle budowany wg diplo-truce-ai-table-live-test.cjs (vite build do katalogu scratch).
 * Mutacja: bundle zbudowany z usuniętym zapisem/odczytem pola → test MUSI paść (exit 1).
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('node:assert/strict');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-truce-saveload-' + process.pid);
const OUT_HTML = 'file://' + path.join(SCRATCH, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PLAYER = 0;
const AI = 1;
const SLOT_MAIN = 'truce-roundtrip-main';
const SLOT_LEGACY = 'truce-roundtrip-legacy';
const TRUCE_TURNS = 10;
const EPOCH = 2;
const T0 = Date.now();
const elapsed = () => ((Date.now() - T0) / 1000).toFixed(1) + 's';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const results = [];
function check(name, fn) {
  try { fn(); results.push({ name, ok: true }); console.log('  OK  ' + name); }
  catch (e) { results.push({ name, ok: false, msg: e.message.split('\n')[0] }); console.log('  FAIL ' + name + ' — ' + e.message.split('\n')[0]); }
}
function canon(v) {
  if (Array.isArray(v)) return '[' + v.map(canon).join(',') + ']';
  if (v && typeof v === 'object') return '{' + Object.keys(v).sort().filter(k => v[k] !== undefined).map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}';
  return JSON.stringify(v);
}

function buildIfNeeded() {
  if (process.env.SKIP_BUILD === '1' && fs.existsSync(path.join(SCRATCH, 'index.html'))) return;
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(SCRATCH)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe', timeout: 400000 });
}

// --disable-dev-shm-usage: pod obciążeniem maszyny (współdzielony /dev/shm) renderer padał
// („Target crashed") w trakcie generowania świata; ten flag przenosi bufory do /tmp.
async function launchBrowser(chromium) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'];
  try { return await chromium.launch({ headless: true, args }); }
  catch (e) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args });
  }
}

// reuse = istniejąca strona: nawigacja NA NOWO (nowy dokument, nowa sesja gry), ten sam kontekst
// przeglądarki, więc IndexedDB z zapisem jest widoczna. Bez reuse = nowa strona w kontekście.
async function openGame(browser, errors, reuse) {
  const page = reuse || await browser.newPage({ viewport: { width: 1400, height: 900 } });
  if (!reuse) page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(
    () => !!window.__truceTestDebug && !!window.__truceSaveLoadTestDebug && !!window.__eraTestDebug
      && !!window.__peaceRulesTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 600000 },
  );
  await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());
  return page;
}

async function endTurnWait(page) {
  const cur = await page.evaluate(() => window.__truceTestDebug.turn());
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  await page.waitForFunction(
    (c) => window.__truceTestDebug.turn() > c && !window.__eraTestDebug.isEndTurnInProgress(),
    cur,
    { timeout: 60000 },
  );
}

const pairState = (page) => page.evaluate(([p, a]) => window.__truceTestDebug.pairState(p, a), [PLAYER, AI]);
const dump = (page) => page.evaluate(() => window.__truceSaveLoadTestDebug.dumpDiploState());

async function phaseSave(browser, errors, report) {
  console.log(`[saveload] strona 1 — zapis (${elapsed()})`);
  const page = await openGame(browser, errors);
  console.log(`[saveload] świat gotowy po ${elapsed()}`);
  await page.evaluate(([ai]) => window.__truceTestDebug.setWarAge(ai, 5), [AI]);
  const startTurn = await page.evaluate(() => window.__truceTestDebug.turn());
  // Rozejm: REALNA akceptacja propozycji AI (ta sama ścieżka co stół), 10 tur.
  const acc = await page.evaluate(([ai, n]) => window.__truceTestDebug.acceptTruceForTest(ai, n), [AI, TRUCE_TURNS]);
  report.accept = acc;
  // Stan towarzyszący (SETUP, ten sam stan co w pamięci silnika).
  await page.evaluate(([ai, p, t]) => {
    window.__truceSaveLoadTestDebug.setAggressorFlagForTest(ai, t + 6);
    window.__truceSaveLoadTestDebug.setCasusBelliForTest(ai, p, t + 8);
    window.__truceSaveLoadTestDebug.setEraWarCountForTest(ai, 2, 1);
    window.__truceSaveLoadTestDebug.setEraWarCountForTest(p, 2, 1);
  }, [AI, PLAYER, startTurn]);
  await endTurnWait(page); // jedna tura EOT w oknie rozejmu
  const before = await dump(page);
  const stateBefore = await pairState(page);
  report.before = { dump: before, pair: stateBefore, startTurn };
  console.log(`[saveload] przed zapisem: tura ${before.turn}, para ${JSON.stringify(stateBefore)}`);
  const okSave = await page.evaluate((s) => window.__truceSaveLoadTestDebug.quickSave(s), SLOT_MAIN);
  assert.equal(okSave, true, 'realny zapis do slotu musi się udać');
  const okLegacy = await page.evaluate(([src, dst]) => window.__truceSaveLoadTestDebug.writeLegacySlot(src, dst), [SLOT_MAIN, SLOT_LEGACY]);
  assert.equal(okLegacy, true, 'kopia w formacie sprzed pól musi się zapisać');
  console.log(`[saveload] zapis OK (${elapsed()})`);
  return page;
}

async function phaseLoad(browser, errors, report, page1) {
  console.log(`[saveload] strona 2 — NOWA sesja gry w tej samej przeglądarce, wczytanie (${elapsed()})`);
  const page = await openGame(browser, errors, page1);
  console.log(`[saveload] świat gotowy po ${elapsed()}`);
  await page.evaluate(([s]) => window.__truceSaveLoadTestDebug.loadSlot(s), [SLOT_MAIN]);
  const B0 = report.before;
  await page.waitForFunction(
    (t) => window.__truceSaveLoadTestDebug.turn() === t && !window.__eraTestDebug.isEndTurnInProgress(),
    B0.dump.turn,
    { timeout: 180000 },
  );
  await wait(1500);
  const after = await dump(page);
  const stateAfter = await pairState(page);
  report.after = { dump: after, pair: stateAfter };
  console.log(`[saveload] po wczytaniu: tura ${after.turn}, para ${JSON.stringify(stateAfter)}`);

  check('wczytanie: tura zgodna z zapisem', () => assert.equal(after.turn, B0.dump.turn));
  check('wczytanie: status pary i truceUntilTurn zgodne (rozejm trwa)', () => {
    assert.equal(stateAfter.truceUntilTurn, B0.pair.truceUntilTurn);
    assert.equal(stateAfter.status, B0.pair.status);
    assert.notEqual(stateAfter.truceUntilTurn, null, 'rozejm musi przeżyć zapis');
    assert.equal(stateAfter.truceUntilTurn, B0.startTurn + TRUCE_TURNS, 'długość rozejmu = 10 tur od zawarcia');
  });
  check('wczytanie: flaga agresora (aggressorFlagUntilByOwner) zgodna', () => {
    assert.equal(canon(after.aggressor), canon(B0.dump.aggressor));
    assert.ok(Object.keys(after.aggressor).length > 0, 'flaga agresora musi być niepusta (inaczej mutacja nie jest wykrywalna)');
  });
  check('wczytanie: casus belli (casusBelliUntilByPair) zgodne', () => {
    assert.equal(canon(after.casusBelli), canon(B0.dump.casusBelli));
    assert.ok(Object.keys(after.casusBelli).length > 0, 'casus belli musi być niepusty');
  });
  check('wczytanie: licznik wojen epoki (per owner, epoka) zgodny', () => {
    assert.equal(canon(after.eraWarCounts), canon(B0.dump.eraWarCounts));
    assert.ok(after.eraWarCounts.length >= 2, 'licznik musi zawierać wpisy obu stron');
  });
  check('wczytanie: meta pary (diplomacyPairMeta) zgodna, bez duplikatów kluczy', () => {
    assert.equal(canon(after.pairMeta), canon(B0.dump.pairMeta));
    const keys = after.pairMeta.map(e => e[0]);
    assert.equal(new Set(keys).size, keys.length, 'brak zduplikowanych kluczy par');
  });
  check('wczytanie: zdarzenia Wiarygodności zgodne (brak utraty/duplikacji)', () => {
    assert.equal(canon(after.credibility), canon(B0.dump.credibility));
  });

  // Tryb mutacji (SAVELOAD_STOP_AFTER_LOAD=1): po porównaniu stanu kończymy — oszczędza czas
  // (świat generuje się ~100-200 s pod obciążeniem). Pełny przebieg = bez tej zmiennej.
  if (process.env.SAVELOAD_STOP_AFTER_LOAD === '1') return page;

  // Okno rozejmu po wczytaniu: trwa do U-1, w turze U wygasa bez kary i bez flagi.
  const U = stateAfter.truceUntilTurn;
  const credAtStart = canon(after.credibility);
  while ((await page.evaluate(() => window.__truceTestDebug.turn())) < U - 1) await endTurnWait(page);
  const atUm1 = await pairState(page);
  const aggUm1 = await page.evaluate(() => window.__truceSaveLoadTestDebug.dumpDiploState());
  check(`po wczytaniu: w turze U-1 (${U - 1}) rozejm nadal aktywny`, () => {
    assert.equal(atUm1.status, 'pokoj');
    assert.equal(atUm1.truceUntilTurn, U);
  });
  await endTurnWait(page);
  const atU = await pairState(page);
  const dumpU = await dump(page);
  check(`po wczytaniu: w turze U (${U}) rozejm wygasa do wojny`, () => {
    assert.equal(atU.turn, U);
    assert.equal(atU.status, 'wojna');
    assert.equal(atU.truceUntilTurn, null);
  });
  check('po wygaśnięciu: BEZ kary (brak nowego zlamanie_paktu_nap u gracza)', () => {
    assert.equal(canon(dumpU.credibility), credAtStart, 'lista Wiarygodności bez zmian od wczytania');
    assert.ok(!canon(dumpU.credibility).includes('zlamanie_paktu_nap') || credAtStart.includes('zlamanie_paktu_nap'),
      'brak nowej kary zlamanie_paktu_nap');
  });
  check('po wygaśnięciu: BEZ nowej flagi agresora (brak nowych kluczy i wzrostu wartości)', () => {
    const newKeys = Object.keys(dumpU.aggressor).filter(k => !(k in aggUm1.aggressor));
    assert.equal(newKeys.length, 0, 'wygaśnięcie rozejmu nie dopisuje flagi');
    for (const k of Object.keys(dumpU.aggressor)) {
      assert.ok(dumpU.aggressor[k] <= aggUm1.aggressor[k], 'flaga nie może zostać przedłużona');
    }
  });

  // Stary zapis (bez pól rozejmu/flagi/licznika) — wczytanie bez błędu, wartości domyślne.
  console.log(`[saveload] stary zapis (${elapsed()})`);
  await page.evaluate(([s]) => window.__truceSaveLoadTestDebug.loadSlot(s), [SLOT_LEGACY]);
  await page.waitForFunction(() => !window.__eraTestDebug.isEndTurnInProgress(), undefined, { timeout: 120000 });
  await wait(1500);
  const legacyState = await pairState(page);
  const legacyDump = await dump(page);
  check('stary zapis: wczytuje się bez błędu z wartościami domyślnymi', () => {
    assert.equal(legacyState.truceUntilTurn, null, 'brak pola => brak rozejmu');
    assert.deepEqual(legacyDump.aggressor, {});
    assert.deepEqual(legacyDump.casusBelli, {});
  });
  check('stary zapis: licznik epoki odtworzony wg zasady (bez crasha)', () => {
    assert.ok(Array.isArray(legacyDump.eraWarCounts));
  });
  return page;
}

async function main() {
  buildIfNeeded();
  const { chromium } = require('playwright');
  const errors = [];
  const report = {};
  let browser = null;
  let exitCode = 1;
  try {
    browser = await launchBrowser(chromium);
    const page1 = await phaseSave(browser, errors, report);
    const page2 = await phaseLoad(browser, errors, report, page1);
    await page2.close();
    check('strona: zero pageerror w całym scenariuszu', () => assert.equal(errors.length, 0, errors.slice(0, 3).join(' | ')));
    const failed = results.filter(r => !r.ok);
    console.log(`[saveload] wynik: ${results.length - failed.length} pass / ${failed.length} fail (${elapsed()})`);
    exitCode = failed.length === 0 ? 0 : 1;
  } catch (e) {
    console.log('[saveload] WYJĄTEK: ' + (e && e.message ? e.message.split('\n')[0] : e));
    exitCode = 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
  process.exit(exitCode);
}

main().catch((e) => { console.error(e); process.exit(1); });
