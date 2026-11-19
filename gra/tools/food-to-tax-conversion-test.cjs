'use strict';
/**
 * R-WEB-ECONOMY-FOOD-TO-TAX-CONVERSION-Q1 -- reczna zamiana Zywnosci z zapasu imperium na Podatek.
 * Sprawdza: kurs 1:1 i inny kurs z parametru, brak Targowiska = zablokowane, ilosc > zapas = obciete,
 * zapas nie schodzi ponizej 0, brak NaN w zapisie kolejki podatku (wspolnej z Praca), komunikaty,
 * oraz mutacje kopii zrodla (czerwone = test lapie bledy).
 * Run z gra/: node tools/food-to-tax-conversion-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');

function buildBundle(srcFoodText, tag) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'food-tax-' + tag + '-'));
  // Kopia empire-food.ts z absolutnymi importami (zeby mozna ja zbundlowac poza src/game).
  const foodCopy = path.join(tmp, 'empire-food-copy.ts');
  const rewritten = srcFoodText.replace(/from '\.\//g, `from '${path.join(SRC, 'game')}/`);
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

const realSrc = fs.readFileSync(path.join(SRC, 'game', 'empire-food.ts'), 'utf8');
const M = buildBundle(realSrc, 'real');

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
// --- (E) brak NaN na wejsciu i wyjsciu ---------------------------------------------------------------
{
  const cNaN = M.convertFoodReserveToTax(NaN, NaN, NaN, true);
  eq(cNaN.foodSpent, 0, 'NaN wejscia: 0 odjete');
  eq(cNaN.taxGained, 0, 'NaN wejscia: 0 Podatku');
  ok(Number.isFinite(cNaN.foodRemaining), 'NaN wejscia: foodRemaining skonczone');
  const cNeg = M.convertFoodReserveToTax(100, -20, 1, true);
  eq(cNeg.foodSpent, 0, 'ujemna ilosc: 0 odjete');
}
// --- (F) zapis/wczytanie kolejki podatku bez NaN (wspolna z Praca) --------------------------------
{
  const pending = new Map([[0, 200], [1, 0]]);
  const saved = M.serializePendingWorkTax(pending);
  const restored = M.restorePendingWorkTax(JSON.parse(JSON.stringify(saved)));
  eq(restored.get(0), 200, 'zapis/wczytanie: podatek Zywnosci przezywa round-trip');
  ok(![...restored.values()].some(v => Number.isNaN(v)), 'zapis/wczytanie: brak NaN');
  ok(!restored.has(1), 'zapis/wczytanie: zero nie jest zapisywane');
}
// --- (G) cala akcja: kolejnosc i skutki -------------------------------------------------------------
function fakeIo(reserve0, log) {
  let reserve = reserve0;
  const queued = [];
  return {
    state: () => ({ reserve, queued }),
    io: {
      getReserve: () => reserve,
      setReserve: (_id, v) => { reserve = v; log.push('set:' + v); },
      queueTax: (_id, t) => { queued.push(t); log.push('queue:' + t); },
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
  const f = fakeIo(500, log);
  const spent = M.runManualFoodTaxAction(0, 200, 1, true, f.io);
  eq(spent, 200, 'akcja 1:1: zwraca 200 odjetej Zywnosci');
  eq(f.state().reserve, 300, 'akcja 1:1: zapas po zamianie 300');
  eq(f.state().queued[0], 200, 'akcja 1:1: w kolejce 200 Podatku');
  ok(log.indexOf('dirty') > -1 && log.indexOf('dirty') < log.lastIndexOf('refresh'),
    'akcja: markDirty PRZED refresh PO zamianie (bramka empireEconDirty)');
  ok(log.some(l => l.startsWith('msg:Zamieniono 200 Żywności na 200 Podatku')), 'akcja: komunikat o wyniku');
  ok(log[log.length - 1] === 'hud', 'akcja: HUD odswiezony na koncu');
}
{
  const log = [];
  const f = fakeIo(500, log);
  const spent = M.runManualFoodTaxAction(0, 200, 1, false, f.io);
  eq(spent, 0, 'akcja bez Targowiska: 0 odjete');
  eq(f.state().reserve, 500, 'akcja bez Targowiska: zapas nietkniety');
  ok(!log.includes('dirty'), 'akcja bez Targowiska: brak markDirty (nic sie nie zmienilo)');
  ok(log.some(l => l.includes('Targowiska')), 'akcja bez Targowiska: komunikat o powodzie');
}

// --- (H) mutacje kopii zrodla: kazda musi byc zlapana (czerwone) ------------------------------------
function runMutant(label, from, to) {
  if (!realSrc.includes(from)) { ok(false, `mutacja ${label}: wzorzec nie znaleziony`); return; }
  const mutated = M_mut(realSrc.replace(from, to));
  const caught = mutated === 'caught';
  ok(caught, `mutacja ${label} wykryta przez test`);
}
function M_mut(src) {
  let mm;
  try { mm = buildBundle(src, 'mut' + Math.random().toString(36).slice(2, 7)); } catch (e) { return 'caught'; }
  let bad = false;
  const a = mm.convertFoodReserveToTax(500, 1000, 1, true);
  if (a.foodSpent !== 500) bad = true;                 // ilosc > zapas musi byc obcieta
  if (mm.convertFoodReserveToTax(500, 200, 1, false).foodSpent !== 0) bad = true; // brak Targowiska
  if (mm.convertFoodReserveToTax(500, 200, 1, true).foodRemaining !== 300) bad = true; // 1:1
  if (mm.convertFoodReserveToTax(500, 200, 2, true).taxGained !== 400) bad = true; // kurs
  return bad ? 'caught' : 'missed';
}
runMutant('bez obciecia do zapasu', 'Math.min(pool, request)', 'request');
runMutant('bez sprawdzenia Targowiska', 'const candidateFood = enabled ? Math.min(pool, request) : 0;', 'const candidateFood = Math.min(pool, request);');
runMutant('kurs zawsze 1:1', 'const candidateTax = Math.floor(candidateFood * safeRate);', 'const candidateTax = candidateFood;');

// --- (I) sondy zrodlowe main.ts / panel: hook tylko dla czlowieka, UI obok Pracy -----------------------
{
  const main = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
  const start = main.indexOf('onConvertOwnerFoodToTax: (ownerId, requested) =>');
  const end = main.indexOf('getOwnerDefaultPodzialPracy:', start);
  const hook = start > 0 && end > start ? main.slice(start, end) : '';
  ok(hook.length > 0, 'hook onConvertOwnerFoodToTax istnieje w main.ts');
  ok(/ownerCanConvertWorkToTax\(ownerId, isHuman\(ownerId\)/.test(hook), 'hook Zywnosci wymaga isHuman (AI nie korzysta)');
  ok(/runManualFoodTaxAction\(ownerId, requested, rate, enabled,/.test(hook), 'hook deleguje do runManualFoodTaxAction');
  ok(main.includes("targowisko_zywnosc_na_podatek_kurs?.[_menuDifficulty]"), 'kurs Zywnosci czytany z econ-params per trudnosc');
  const panel = fs.readFileSync(path.join(SRC, 'ui', 'empireDetailPanel.ts'), 'utf8');
  const workIdx = panel.indexOf('data-work-tax-convert');
  const foodIdx = panel.indexOf('data-food-tax-convert');
  ok(workIdx > 0 && foodIdx > workIdx, 'panel: blok Zywnosci umieszczony ZA blokiem Pracy (obok)');
  const params = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'econ-params.json'), 'utf8'));
  const k = params.budynki && params.budynki.targowisko_zywnosc_na_podatek_kurs;
  ok(k && k.easy === 1 && k.normal === 1 && k.hard === 1, 'econ-params: targowisko_zywnosc_na_podatek_kurs = 1/1/1');
}

console.log(`\n${passed} PASS / ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
