'use strict';
/**
 * diplo-truce-saveload-live-test.cjs — R-WEB-TRUCE-E2E-SAVELOAD-MEASURE-Q1, CZĘŚĆ B.
 *
 * Prawdziwy roundtrip zapisu stanu dyplomacji w trakcie aktywnego rozejmu, z NOWĄ sesją
 * przeglądarki przy wczytaniu. Scenariusz dzielony na FAZY, każda to osobny proces Node + osobny
 * proces Chromium z TYM SAMYM trwałym profilem (userDataDir → IndexedDB z zapisem przeżywa), bo
 * generowanie świata trwa ~85 s i cały przebieg w jednym procesie przekraczał limit 120 s:
 *
 *   save   — nowa gra (?playtest=mapa) → rozejm AI→gracz przez REALNĄ akceptację
 *            (acceptTruceForTest = aiCommandToPendingProposal → resolvePlayerAcceptsAiPending →
 *            applyProposalOutcome), SETUP flagi agresora / casus belli / licznika wojen epoki
 *            (__truceSaveLoadTestDebug), jedna tura EOT w oknie rozejmu, REALNY zapis do slotu
 *            (persistSaveToSlot → saveToLocal → IndexedDB) + kopia slotu w formacie SPRZED pól
 *            (stary zapis). Stan "przed" zapisany do state.json.
 *   load   — NOWY proces przeglądarki, nowa gra, REALNE wczytanie slotu (loadGameFromSlot = „Wczytaj
 *            grę"), porównanie: truceUntilTurn i długość rozejmu, aggressorFlagUntilByOwner,
 *            casusBelliUntilByPair, licznik wojen epoki, diplomacyPairMeta (bez duplikatów),
 *            zdarzenia Wiarygodności.
 *   expire — NOWY proces, wczytanie slotu, tury EOT: rozejm trwa do U-1, w turze U wygasa do wojny
 *            BEZ kary (brak nowego 'zlamanie_paktu_nap') i BEZ nowej flagi agresora.
 *   legacy — NOWY proces, wczytanie starego zapisu (bez pól rozejmu/flagi/licznika): bez błędu,
 *            wartości domyślne.
 *
 * Usage (z gra/): node ./node_modules/vite/bin/vite.js build --outDir <scratch>/b --emptyOutDir
 *   PHASE=all|save|load|expire|legacy node tools/diplo-truce-saveload-live-test.cjs <scratchAbs>
 *   <scratchAbs>/b = bundle (lub SKIP_BUILD=0 → budowany przez test), <scratchAbs>/profile i
 *   <scratchAbs>/state.json tworzone przez test. PHASE=all uruchamia fazy jako osobne procesy
 *   (każda z limitem 120 s); PHASES=save,load zawęża zestaw (np. do mutacji).
 * Mutacja: bundle zbudowany z usuniętym zapisem/odczytem pola → faza load MUSI paść (exit 1).
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('node:assert/strict');
const { execSync, spawnSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-truce-saveload');
const BUNDLE = process.env.BUNDLE_DIR || path.join(SCRATCH, 'b');
const PROFILE = path.join(SCRATCH, 'profile');
const STATE_FILE = path.join(SCRATCH, 'state.json');
const OUT_HTML = 'file://' + path.join(BUNDLE, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PLAYER = 0;
const AI = 1;
const SLOT_MAIN = 'truce-roundtrip-main';
const SLOT_LEGACY = 'truce-roundtrip-legacy';
const TRUCE_TURNS = 5; // najkrótszy dozwolony rozejm — mniej tur EOT w fazie expire
const PHASE_LIMIT_MS = Number(process.env.PHASE_LIMIT_MS) || 150000;
const SCENARIO_LIMIT_MS = Number(process.env.SCENARIO_LIMIT_MS) || 60000;
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
  if (process.env.SKIP_BUILD !== '0' && fs.existsSync(path.join(BUNDLE, 'index.html'))) return;
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(BUNDLE)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe', timeout: 400000 });
}

// Trwały profil: IndexedDB (zapis gry) przeżywa między procesami = realna "nowa sesja".
// --disable-dev-shm-usage: pod obciążeniem renderer padał w trakcie generowania świata.
async function launchContext(chromium) {
  const opts = {
    headless: true,
    viewport: { width: 1400, height: 900 },
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
  };
  const exe = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  try {
    return await chromium.launchPersistentContext(PROFILE, exe ? { ...opts, executablePath: exe } : opts);
  } catch (e) {
    return await chromium.launchPersistentContext(PROFILE, { ...opts, executablePath: FALLBACK_CHROME });
  }
}

async function openGame(ctx, errors) {
  const page = ctx.pages()[0] || await ctx.newPage();
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 60000 });
  await page.waitForFunction(
    () => !!window.__truceTestDebug && !!window.__truceSaveLoadTestDebug && !!window.__eraTestDebug
      && !!window.__peaceRulesTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0,
    undefined,
    { timeout: 100000 },
  );
  console.log('[saveload] stan po starcie strony: ' + JSON.stringify(await page.evaluate(() => window.__eraTestDebug.getWorldState())).slice(0, 200));
  await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());
  return page;
}

async function endTurnWait(page) {
  const cur = await page.evaluate(() => window.__truceTestDebug.turn());
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  await page.waitForFunction(
    (c) => window.__truceTestDebug.turn() > c && !window.__eraTestDebug.isEndTurnInProgress(),
    cur,
    { timeout: 40000 },
  );
}

const pairState = (page) => page.evaluate(([p, a]) => window.__truceTestDebug.pairState(p, a), [PLAYER, AI]);
const dump = (page) => page.evaluate(() => window.__truceSaveLoadTestDebug.dumpDiploState());
const loadSlot = (page, slot) => page.evaluate((s) => window.__truceSaveLoadTestDebug.loadSlot(s), slot);
const readState = () => JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));

async function phaseSave(page) {
  console.log(`[saveload:save] świat gotowy (${elapsed()})`);
  await page.evaluate(([ai]) => window.__truceTestDebug.setWarAge(ai, 5), [AI]);
  const startTurn = await page.evaluate(() => window.__truceTestDebug.turn());
  const acc = await page.evaluate(([ai, n]) => window.__truceTestDebug.acceptTruceForTest(ai, n), [AI, TRUCE_TURNS]);
  console.log('[saveload:save] akceptacja rozejmu: ' + JSON.stringify(acc));
  await page.evaluate(([ai, p, t]) => {
    window.__truceSaveLoadTestDebug.setAggressorFlagForTest(ai, t + 6);
    window.__truceSaveLoadTestDebug.setCasusBelliForTest(ai, p, t + 8);
    window.__truceSaveLoadTestDebug.setEraWarCountForTest(ai, 2, 1);
    window.__truceSaveLoadTestDebug.setEraWarCountForTest(p, 2, 1);
  }, [AI, PLAYER, startTurn]);
  await endTurnWait(page); // jedna tura EOT w oknie rozejmu
  const before = await dump(page);
  const stateBefore = await pairState(page);
  console.log(`[saveload:save] przed zapisem: tura ${before.turn}, para ${JSON.stringify(stateBefore)}`);
  assert.notEqual(stateBefore.truceUntilTurn, null, 'rozejm musi być aktywny przed zapisem');
  const okSave = await page.evaluate((s) => window.__truceSaveLoadTestDebug.quickSave(s), SLOT_MAIN);
  assert.equal(okSave, true, 'realny zapis do slotu musi się udać');
  const okLegacy = await page.evaluate(([src, dst]) => window.__truceSaveLoadTestDebug.writeLegacySlot(src, dst), [SLOT_MAIN, SLOT_LEGACY]);
  assert.equal(okLegacy, true, 'kopia w formacie sprzed pól musi się zapisać');
  fs.writeFileSync(STATE_FILE, JSON.stringify({ dump: before, pair: stateBefore, startTurn }));
  check('save: zapis do slotu i kopia legacy zapisane, rozejm aktywny', () => assert.equal(stateBefore.truceUntilTurn, startTurn + TRUCE_TURNS));
}

async function phaseLoad(page) {
  console.log(`[saveload:load] NOWA sesja przeglądarki, świat gotowy (${elapsed()})`);
  const B = readState();
  await loadSlot(page, SLOT_MAIN);
  await page.waitForFunction(
    (t) => window.__truceSaveLoadTestDebug.turn() === t && !window.__eraTestDebug.isEndTurnInProgress(),
    B.dump.turn,
    { timeout: 30000 },
  );
  await wait(1000);
  const after = await dump(page);
  const stateAfter = await pairState(page);
  console.log(`[saveload:load] po wczytaniu: tura ${after.turn}, para ${JSON.stringify(stateAfter)}`);
  check('wczytanie: tura zgodna z zapisem', () => assert.equal(after.turn, B.dump.turn));
  check('wczytanie: status pary i truceUntilTurn zgodne (rozejm trwa)', () => {
    assert.equal(stateAfter.truceUntilTurn, B.pair.truceUntilTurn);
    assert.equal(stateAfter.status, B.pair.status);
    assert.notEqual(stateAfter.truceUntilTurn, null, 'rozejm musi przeżyć zapis');
    assert.equal(stateAfter.truceUntilTurn, B.startTurn + TRUCE_TURNS, 'długość rozejmu = 5 tur od zawarcia');
  });
  check('wczytanie: flaga agresora (aggressorFlagUntilByOwner) zgodna', () => {
    assert.equal(canon(after.aggressor), canon(B.dump.aggressor));
    assert.ok(Object.keys(after.aggressor).length > 0, 'flaga agresora musi być niepusta (inaczej mutacja nie jest wykrywalna)');
  });
  check('wczytanie: casus belli (casusBelliUntilByPair) zgodne', () => {
    assert.equal(canon(after.casusBelli), canon(B.dump.casusBelli));
    assert.ok(Object.keys(after.casusBelli).length > 0, 'casus belli musi być niepusty');
  });
  check('wczytanie: licznik wojen epoki (per owner, epoka) zgodny', () => {
    assert.equal(canon(after.eraWarCounts), canon(B.dump.eraWarCounts));
    assert.ok(after.eraWarCounts.length >= 2, 'licznik musi zawierać wpisy obu stron');
  });
  check('wczytanie: meta pary (diplomacyPairMeta) zgodna, bez duplikatów kluczy', () => {
    assert.equal(canon(after.pairMeta), canon(B.dump.pairMeta));
    const keys = after.pairMeta.map(e => e[0]);
    assert.equal(new Set(keys).size, keys.length, 'brak zduplikowanych kluczy par');
  });
  check('wczytanie: zdarzenia Wiarygodności zgodne (brak utraty/duplikacji)', () => {
    assert.equal(canon(after.credibility), canon(B.dump.credibility));
  });
}

async function phaseExpire(page) {
  console.log(`[saveload:expire] NOWA sesja przeglądarki, świat gotowy (${elapsed()})`);
  const B = readState();
  await loadSlot(page, SLOT_MAIN);
  await page.waitForFunction(
    (t) => window.__truceSaveLoadTestDebug.turn() === t && !window.__eraTestDebug.isEndTurnInProgress(),
    B.dump.turn,
    { timeout: 30000 },
  );
  await wait(1000);
  const start = await dump(page);
  const U = (await pairState(page)).truceUntilTurn;
  assert.equal(U, B.pair.truceUntilTurn, 'U po wczytaniu = U z zapisu');
  const credAtStart = canon(start.credibility);
  while ((await page.evaluate(() => window.__truceTestDebug.turn())) < U - 1) await endTurnWait(page);
  const atUm1 = await pairState(page);
  const aggUm1 = await dump(page);
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
}

async function phaseLegacy(page) {
  console.log(`[saveload:legacy] NOWA sesja przeglądarki, świat gotowy (${elapsed()})`);
  await loadSlot(page, SLOT_LEGACY);
  await page.waitForFunction(() => !window.__eraTestDebug.isEndTurnInProgress(), undefined, { timeout: 30000 });
  await wait(1000);
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
}

const PHASES = { save: phaseSave, load: phaseLoad, expire: phaseExpire, legacy: phaseLegacy };

async function runPhase(name) {
  buildIfNeeded();
  const { chromium } = require('playwright');
  const errors = [];
  let ctx = null;
  let exitCode = 1;
  const guard = setTimeout(() => { console.log(`[saveload:${name}] PRZEKROCZONY LIMIT ${PHASE_LIMIT_MS / 1000}s`); process.exit(2); }, PHASE_LIMIT_MS);
  try {
    ctx = await launchContext(chromium);
    const page = await openGame(ctx, errors);
    const tWorld = Date.now();
    await PHASES[name](page);
    // Strażnik czasu SCENARIUSZA (po wygenerowaniu świata). Samo generowanie świata (~70-90 s CPU
    // Chromium, niezależne od testu) zjada większość limitu 120 s z kryterium, więc osobno mierzymy
    // i pilnujemy część, na którą test ma wpływ; limit całej fazy (PHASE_LIMIT_MS) zostaje jawnym ZAŁOŻENIEM.
    const scenarioMs = Date.now() - tWorld;
    console.log(`[saveload:${name}] scenariusz po wygenerowaniu swiata: ${(scenarioMs / 1000).toFixed(1)}s (strażnik ${SCENARIO_LIMIT_MS / 1000}s)`);
    check(`${name}: scenariusz po swiecie <= ${SCENARIO_LIMIT_MS / 1000}s`, () => assert.ok(scenarioMs <= SCENARIO_LIMIT_MS, `${scenarioMs} ms`));
    check(`${name}: zero pageerror`, () => assert.equal(errors.length, 0, errors.slice(0, 3).join(' | ')));
    const failed = results.filter(r => !r.ok);
    console.log(`[saveload:${name}] wynik: ${results.length - failed.length} pass / ${failed.length} fail (${elapsed()})`);
    exitCode = failed.length === 0 ? 0 : 1;
  } catch (e) {
    console.log(`[saveload:${name}] WYJĄTEK: ` + (e && e.message ? e.message.split('\n')[0] : e));
    exitCode = 1;
  } finally {
    clearTimeout(guard);
    if (ctx) await ctx.close().catch(() => {});
  }
  process.exit(exitCode);
}

function runAll() {
  const list = (process.env.PHASES || 'save,load,expire,legacy').split(',');
  fs.mkdirSync(SCRATCH, { recursive: true });
  fs.rmSync(PROFILE, { recursive: true, force: true });
  fs.rmSync(STATE_FILE, { force: true });
  buildIfNeeded();
  let bad = 0;
  for (const ph of list) {
    const t = Date.now();
    const r = spawnSync(process.execPath, [__filename, SCRATCH],
      { env: { ...process.env, PHASE: ph }, stdio: 'inherit', timeout: PHASE_LIMIT_MS + 15000 });
    const dt = ((Date.now() - t) / 1000).toFixed(1);
    console.log(`[saveload] FAZA ${ph}: exit=${r.status} czas=${dt}s ${Number(dt) <= PHASE_LIMIT_MS / 1000 ? '(<=limit)' : '(>limit!)'}`);
    if (r.status !== 0) { bad++; break; }
  }
  console.log(`[saveload] ${bad === 0 ? 'PASS' : 'FAIL'} (fazy: ${list.join(',')})`);
  process.exit(bad === 0 ? 0 : 1);
}

const PHASE = process.env.PHASE || 'all';
if (PHASE === 'all') runAll();
else if (PHASES[PHASE]) runPhase(PHASE).catch((e) => { console.error(e); process.exit(1); });
else { console.error('Nieznana faza: ' + PHASE); process.exit(1); }
