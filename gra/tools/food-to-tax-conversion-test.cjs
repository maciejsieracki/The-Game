'use strict';
/**
 * R-WEB-ECONOMY-FOOD-TO-TAX-CONVERSION-Q1 -- reczna zamiana Zywnosci z zapasu imperium na Podatek.
 *
 * Testuje PRAWDZIWY kod z gra/src/game/empire-food.ts (bundlowany esbuild), wlacznie z adapterem
 * createFoodTaxIo (klamra zapasu do 0, kolejka podatku) i resolveFoodTaxRate (kurs z econ-params).
 *
 * Mutacje: ten sam plik testu uruchamiany jako proces potomny na zmutowanej KOPII empire-food.ts
 * (env FOOD_TAX_SRC_FILE). Mutant wykryty = proces potomny konczy sie kodem != 0.
 *
 * Run z gra/: node tools/food-to-tax-conversion-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const REAL_FOOD = path.join(SRC, 'game', 'empire-food.ts');
const SRC_FILE = process.env.FOOD_TAX_SRC_FILE || REAL_FOOD;
const CHILD = !!process.env.FOOD_TAX_SRC_FILE;

function buildBundle(srcFoodFile, tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'food-tax-' + tag + '-'));
  // Kopia empire-food.ts z absolutnymi importami (zeby mozna ja zbundlowac poza src/game).
  const foodCopy = path.join(tmp, 'empire-food-copy.ts');
  const text = fs.readFileSync(srcFoodFile, 'utf8');
  const rewritten = text.replace(/from '\.\//g, `from '${path.join(SRC, 'game')}/`);
  fs.writeFileSync(foodCopy, rewritten);
  const entry = path.join(tmp, 'entry.ts');
  fs.writeFileSync(entry, [
    `export * from ${JSON.stringify(foodCopy)};`,
    `export { serializePendingWorkTax, restorePendingWorkTax } from ${JSON.stringify(path.join(SRC, 'game', 'work-tax'))};`,
  ].join('\n'));
  const bundle = path.join(tmp, 'bundle.cjs');
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: bundle, absWorkingDir: ROOT, logLevel: 'silent', nodePaths: [path.join(ROOT, 'node_modules')] });
  return require(bundle);
}

const M = buildBundle(SRC_FILE, CHILD ? 'child' : 'real');

let passed = 0, failed = 0;
function ok(c, m) { if (c) { passed++; console.log('PASS: ' + m); } else { failed++; console.error('FAIL: ' + m); } }
function eq(a, b, m) { ok(a === b, `${m} (got ${a}, want ${b})`); }

// --- (A) kurs 1:1 -------------------------------------------------------------------------------
{
  const c = M.convertFoodReserveToTax(500, 200, 1, true);
  eq(c.foodSpent, 200, 'kurs 1:1: odjeto 200 Zywnosci');
  eq(c.taxGained, 200, 'kurs 1:1: naliczono 200 Podatku');
  eq(c.foodRemaining, 300, 'kurs 1:1: zostalo 300 Zywnosci');
}
// --- (B) inny kurs z parametru --------------------------------------------------------------------
{
  const c2 = M.convertFoodReserveToTax(500, 200, 2, true);
  eq(c2.taxGained, 400, 'kurs 2:1: 200 Zywnosci -> 400 Podatku');
  eq(c2.foodSpent, 200, 'kurs 2:1: odjeto 200 Zywnosci');
  const cHalf = M.convertFoodReserveToTax(500, 101, 0.5, true);
  eq(cHalf.taxGained, 50, 'kurs 0,5: 101 Zywnosci -> floor(50,5)=50 Podatku');
  eq(cHalf.foodSpent, 101, 'kurs 0,5: odjeto 101 Zywnosci');
  const cZero = M.convertFoodReserveToTax(500, 200, 0, true);
  eq(cZero.taxGained, 0, 'kurs 0: 0 Podatku');
  eq(cZero.foodSpent, 0, 'kurs 0: Zywnosc NIE odjeta (jak Praca)');
  eq(cZero.foodRemaining, 500, 'kurs 0: zapas bez zmian');
}
// --- (C) brak Targowiska = zablokowane ------------------------------------------------------------
{
  const cNo = M.convertFoodReserveToTax(500, 200, 1, false);
  eq(cNo.foodSpent, 0, 'brak Targowiska: 0 Zywnosci odjete');
  eq(cNo.taxGained, 0, 'brak Targowiska: 0 Podatku');
  eq(cNo.foodRemaining, 500, 'brak Targowiska: zapas bez zmian');
  const msg = M.foodTaxResultMessage(cNo, 200, false, 500, 0, 0);
  ok(msg.includes('Targowiska'), 'brak Targowiska: komunikat mowi o Targowisku');
}
// --- (D) ilosc > zapas: obciete do zapasu, nie schodzi ponizej 0 -----------------------------------
{
  const cOver = M.convertFoodReserveToTax(300, 1000, 1, true);
  eq(cOver.foodSpent, 300, 'ilosc > zapas: obcieta do 300');
  eq(cOver.foodRemaining, 0, 'ilosc > zapas: zapas = 0, nie ujemny');
  eq(cOver.taxGained, 300, 'ilosc > zapas: 300 Podatku');
  const cEmpty = M.convertFoodReserveToTax(0, 50, 1, true);
  eq(cEmpty.foodSpent, 0, 'pusty zapas: nic nie odjete');
  eq(cEmpty.foodRemaining, 0, 'pusty zapas: zostaje 0');
}
// --- (E) brak NaN na wejsciu i wyjsciu; ulamek zapasu zachowany -------------------------------------
{
  const cNaN = M.convertFoodReserveToTax(NaN, NaN, NaN, true);
  eq(cNaN.foodSpent, 0, 'NaN wejscia: 0 odjete');
  eq(cNaN.taxGained, 0, 'NaN wejscia: 0 Podatku');
  ok(Number.isFinite(cNaN.foodRemaining), 'NaN wejscia: foodRemaining skonczone');
  const cNeg = M.convertFoodReserveToTax(100, -20, 1, true);
  eq(cNeg.foodSpent, 0, 'ujemna ilosc: 0 odjete');
  const cFrac = M.convertFoodReserveToTax(500.75, 200, 1, true);
  eq(cFrac.foodRemaining, 300.75, 'ulamek zapasu zachowany po zamianie (500,75 - 200 = 300,75)');
}
// --- (F) zapis/wczytanie kolejki podatku i zapasu bez NaN ------------------------------------------
{
  const pending = new Map([[0, 200], [1, 0]]);
  const saved = M.serializePendingWorkTax(pending);
  const restored = M.restorePendingWorkTax(JSON.parse(JSON.stringify(saved)));
  eq(restored.get(0), 200, 'zapis/wczytanie: podatek Zywnosci przezywa round-trip');
  ok(![...restored.values()].some(v => Number.isNaN(v)), 'zapis/wczytanie: brak NaN');
  ok(!restored.has(1), 'zapis/wczytanie: zero nie jest zapisywane');
  // Zapis zapasu: save zapisuje Array.from(empireFoodStates.entries()) (main.ts ~l.41924), wczyt ustawia wpisy.
  const states = new Map([[0, { zapasyPanstwa: 500, turyUjemnychZapasow: 0 }]]);
  const pendingSave = new Map();
  const io = M.createFoodTaxIo({ states, createFresh: () => ({ zapasyPanstwa: 0, turyUjemnychZapasow: 0 }),
    pendingTaxByOwner: pendingSave, refreshRates: () => {}, markDirty: () => {},
    readRates: () => ({ skarb: 0, nauka: 0 }), showMessage: () => {}, updateHud: () => {} });
  M.runManualFoodTaxAction(0, 123, 1, true, io);
  const savedStates = JSON.parse(JSON.stringify(Array.from(states.entries())));
  const loadedStates = new Map(savedStates);
  eq(loadedStates.get(0).zapasyPanstwa, 377, 'zapis/wczytanie: zapas po zamianie = 377 (bez NaN)');
  ok(Number.isFinite(loadedStates.get(0).zapasyPanstwa), 'zapis/wczytanie: zapas skonczony');
  const restoredTax = M.restorePendingWorkTax(JSON.parse(JSON.stringify(M.serializePendingWorkTax(pendingSave))));
  eq(restoredTax.get(0), 123, 'zapis/wczytanie: podatek z zamiany Zywnosci w kolejce po round-trip = 123');
}
// --- (G) adapter createFoodTaxIo na zywych strukturach + kolejnosc akcji ---------------------------
function makeDeps(reserve0, log) {
  const states = new Map([[0, { zapasyPanstwa: reserve0, turyUjemnychZapasow: 0 }]]);
  const pending = new Map();
  return {
    states, pending,
    deps: {
      states,
      createFresh: () => ({ zapasyPanstwa: 0, turyUjemnychZapasow: 0 }),
      pendingTaxByOwner: pending,
      refreshRates: () => log.push('refresh'),
      markDirty: () => log.push('dirty'),
      readRates: () => ({ skarb: 10, nauka: 2 }),
      showMessage: (m) => log.push('msg:' + m),
      updateHud: () => log.push('hud'),
    },
  };
}
{
  const log = [];
  const d = makeDeps(500, log);
  const io = M.createFoodTaxIo(d.deps);
  const spent = M.runManualFoodTaxAction(0, 200, 1, true, io);
  eq(spent, 200, 'akcja 1:1: zwraca 200 odjetej Zywnosci');
  eq(d.states.get(0).zapasyPanstwa, 300, 'akcja 1:1: ZAPAS w states po zamianie = 300');
  eq(d.pending.get(0), 200, 'akcja 1:1: w kolejce podatku 200');
  ok(log.indexOf('dirty') > -1 && log.indexOf('dirty') < log.lastIndexOf('refresh'),
    'akcja: markDirty PRZED refresh PO zamianie (bramka empireEconDirty)');
  ok(log.some(l => l.startsWith('msg:Zamieniono 200 Żywności na 200 Podatku')), 'akcja: komunikat o wyniku');
  ok(log[log.length - 1] === 'hud', 'akcja: HUD odswiezony na koncu');
}
{
  // Klamra adaptera: zamiana nie moze zostawic ujemnego zapasu w realnej strukturze.
  const log = [];
  const d = makeDeps(300, log);
  const io = M.createFoodTaxIo(d.deps);
  M.runManualFoodTaxAction(0, 1000, 1, true, io);
  eq(d.states.get(0).zapasyPanstwa, 0, 'adapter: zapas w states = 0 po zamianie ponad zapas (nie ujemny)');
  eq(d.pending.get(0), 300, 'adapter: w kolejce 300 Podatku przy calym zapasie');
}
{
  // Klamra adaptera bezposrednio: setReserve z wartoscia ujemna nie moze zostawic zapasu < 0.
  const log = [];
  const d = makeDeps(500, log);
  const io = M.createFoodTaxIo(d.deps);
  io.setReserve(0, -50);
  eq(d.states.get(0).zapasyPanstwa, 0, 'adapter setReserve(-50): zapas w states = 0 (klamra)');
  io.setReserve(9, 40);
  eq(d.states.get(9).zapasyPanstwa, 40, 'adapter setReserve dla nowego wlasciciela: 40 (fresh state)');
}
{
  // Dwie zamiany w jednej turze: podatek sumuje sie w kolejce (wspolnej z Praca).
  const log = [];
  const d = makeDeps(500, log);
  const io = M.createFoodTaxIo(d.deps);
  M.runManualFoodTaxAction(0, 100, 1, true, io);
  M.runManualFoodTaxAction(0, 150, 2, true, io);
  eq(d.pending.get(0), 400, 'dwie zamiany: kolejka sumuje 100 + 300 = 400 Podatku');
  eq(d.states.get(0).zapasyPanstwa, 250, 'dwie zamiany: zapas 500 - 100 - 150 = 250');
}
{
  // Brak stanu imperium dla wlasciciela: adapter tworzy swiezy stan z zerem, nic nie naliczy.
  const log = [];
  const d = makeDeps(500, log);
  const io = M.createFoodTaxIo(Object.assign({}, d.deps, { states: new Map() }));
  const spent = M.runManualFoodTaxAction(7, 50, 1, true, io);
  eq(spent, 0, 'brak stanu wlasciciela: 0 odjete');
  eq(d.pending.size, 0, 'brak stanu wlasciciela: kolejka pusta');
}
{
  const log = [];
  const d = makeDeps(500, log);
  const io = M.createFoodTaxIo(d.deps);
  const spent = M.runManualFoodTaxAction(0, 200, 1, false, io);
  eq(spent, 0, 'akcja bez Targowiska: 0 odjete');
  eq(d.states.get(0).zapasyPanstwa, 500, 'akcja bez Targowiska: zapas nietkniety');
  ok(!log.includes('dirty'), 'akcja bez Targowiska: brak markDirty (nic sie nie zmienilo)');
  ok(log.some(l => l.includes('Targowiska')), 'akcja bez Targowiska: komunikat o powodzie');
}
// --- (G2) kurs z econ-params (resolveFoodTaxRate) ---------------------------------------------------
{
  const budynki = { targowisko_zywnosc_na_podatek_kurs: { easy: 2, normal: 1, hard: 0.5 } };
  eq(M.resolveFoodTaxRate(budynki, 'easy'), 2, 'kurs z parametru: easy = 2');
  eq(M.resolveFoodTaxRate(budynki, 'hard'), 0.5, 'kurs z parametru: hard = 0,5');
  eq(M.resolveFoodTaxRate(budynki, 'nieznana'), 1, 'brak wpisu trudnosci: fallback 1:1');
  eq(M.resolveFoodTaxRate(undefined, 'normal'), 1, 'brak sekcji budynki: fallback 1:1');
  eq(M.resolveFoodTaxRate({ targowisko_zywnosc_na_podatek_kurs: { normal: -3 } }, 'normal'), 1, 'kurs ujemny: fallback 1:1');
}

// --- (H) mutacje: ten sam test na zmutowanej kopii empire-food.ts musi go wywrocic ------------------
if (!CHILD) {
  const realSrc = fs.readFileSync(REAL_FOOD, 'utf8');
  const mutTmp = fs.mkdtempSync(path.join(os.tmpdir(), 'food-tax-mutants-'));
  function runMutant(label, from, to) {
    const count = realSrc.split(from).length - 1;
    if (count !== 1) { ok(false, `mutacja ${label}: wzorzec ma ${count} wystapien (oczekiwano 1)`); return; }
    const file = path.join(mutTmp, label.replace(/[^a-z0-9]+/gi, '_') + '.ts');
    fs.writeFileSync(file, realSrc.replace(from, to));
    const res = spawnSync(process.execPath, [__filename], {
      env: Object.assign({}, process.env, { FOOD_TAX_SRC_FILE: file }), encoding: 'utf8', stdio: 'pipe' });
    ok(res.status !== 0, `mutacja ${label} wykryta przez test (proces potomny status=${res.status})`);
  }
  runMutant('bez obciecia do zapasu', 'Math.min(pool, request)', 'request');
  runMutant('bez sprawdzenia Targowiska', 'const candidateFood = enabled ? Math.min(pool, request) : 0;',
    'const candidateFood = Math.min(pool, request);');
  runMutant('kurs zawsze 1:1', 'const candidateTax = Math.floor(candidateFood * safeRate);', 'const candidateTax = candidateFood;');
  runMutant('klamra zapasu usunieta (adapter)', 'st.zapasyPanstwa = Math.max(0, value);', 'st.zapasyPanstwa = value;');
  runMutant('zapas bez zmian (adapter nie zapisuje)', 'st.zapasyPanstwa = Math.max(0, value);', 'st.zapasyPanstwa = st.zapasyPanstwa;');
  runMutant('kolejka nadpisuje zamiast sumowac', '(deps.pendingTaxByOwner.get(ownerId) ?? 0) + tax', 'tax');
  runMutant('zapas bez ulamka (floor)', 'foodRemaining: poolExact - foodSpent', 'foodRemaining: pool - foodSpent');
  runMutant('brak markDirty w akcji', 'io.markDirty();', '');
  runMutant('kurs z fallbackiem zawsze 0', "return typeof rate === 'number' && Number.isFinite(rate) && rate >= 0 ? rate : 1;",
    "return typeof rate === 'number' && Number.isFinite(rate) && rate >= 0 ? rate : 0;");

  // --- (I) sondy zrodlowe: wiring w main.ts i panel obok Pracy -------------------------------------
  const main = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
  const start = main.indexOf('onConvertOwnerFoodToTax: (ownerId, requested) =>');
  const end = main.indexOf('getOwnerDefaultPodzialPracy:', start);
  const hook = start > 0 && end > start ? main.slice(start, end) : '';
  ok(hook.length > 0, 'hook onConvertOwnerFoodToTax istnieje w main.ts');
  ok(/ownerCanConvertWorkToTax\(ownerId, isHuman\(ownerId\)/.test(hook), 'hook Zywnosci wymaga isHuman (AI nie korzysta)');
  ok(/runManualFoodTaxAction\(ownerId, requested, rate, enabled, createFoodTaxIo\(/.test(hook),
    'hook deleguje do runManualFoodTaxAction z createFoodTaxIo (adapter testowany w G)');
  ok(/pendingTaxByOwner: pendingManualWorkTaxByOwner/.test(hook), 'hook: kolejka podatku = pendingManualWorkTaxByOwner (wspolna z Praca)');
  ok(/states: empireFoodStates/.test(hook), 'hook: stan zapasu = empireFoodStates');
  ok(/resolveFoodTaxRate\(\s*\(data\.econParams[^)]*\)\.budynki,\s*_menuDifficulty\)/.test(main),
    'kurs Zywnosci czytany z econ-params przez resolveFoodTaxRate per trudnosc');
  const panel = fs.readFileSync(path.join(SRC, 'ui', 'empireDetailPanel.ts'), 'utf8');
  const workIdx = panel.indexOf('data-work-tax-convert');
  const foodIdx = panel.indexOf('data-food-tax-convert');
  ok(workIdx > 0 && foodIdx > workIdx, 'panel: blok Zywnosci umieszczony ZA blokiem Pracy (obok)');
  ok(/liveFoodMax\(\)/.test(panel) && !/max="\$\{foodMax/.test(panel),
    'panel: limit ilosci liczony na zywo (brak zamrozonego max w HTML)');
  const params = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'econ-params.json'), 'utf8'));
  const k = params.budynki && params.budynki.targowisko_zywnosc_na_podatek_kurs;
  ok(k && k.easy === 1 && k.normal === 1 && k.hard === 1, 'econ-params: targowisko_zywnosc_na_podatek_kurs = 1/1/1');
  fs.rmSync(mutTmp, { recursive: true, force: true });
}

console.log(`\n${passed} PASS / ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
