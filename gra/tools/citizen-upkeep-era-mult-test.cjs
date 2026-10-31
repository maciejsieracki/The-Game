'use strict';
/**
 * citizen-upkeep-era-mult-test.cjs -- R-WEB-CITIZEN-UPKEEP-ERA-MULT-Q1 (Maciej 2026-10-31).
 *
 * Run from gra/:  node tools/citizen-upkeep-era-mult-test.cjs
 *
 * Decyzja właściciela: listy surowców BEZ zmian, mnożnik stawki zużycia per epoka
 * (sztuk KAŻDEGO wymaganego surowca na 1 obywatela na turę): Kamień ×1 (1,0), Brąz ×2 (2,0),
 * Żelazo ×3 (3,0). required = floor(populacja × stawka_epoki), drained = min(required, magazyn),
 * bramka binarna per surowiec (pokryte w pełni = dostępny).
 *
 * Pokrywa:
 *   A. Stawka per epoka + fallbacki (era spoza 1..3, undefined, NaN, ujemna, ułamek).
 *   B. Siatka: epoka 1/2/3 × populacja {0,1,7,50,100} × magazyn {0, N-1, N, N+1}
 *      -> required = floor(pop × stawka), drained = min(N, magazyn), bramka binarna.
 *   C. Spójność podgląd ↔ drenaż: resolveCitizenResourceCoverage(era, stock, pop) i
 *      computeCitizenResourceDrain(era, pop, stock) dają ten sam werdykt pokryte/brakujące.
 *   D. Granice N-1 / N / N+1 (Brąz, pop 7 -> N = 14).
 *   E. Populacja NaN / ujemna / Infinity -> 0 (zdefiniowane zachowanie).
 *   F. Ekonomia (kumulatywnie, sumy per tura): pop 10 Brąz 20×4=80, Żelazo 30×5=150,
 *      Kamień 10×2=20; pop 50 -> 50/100/150 per surowiec; pop 100 -> 100/200/300 per surowiec.
 *   G. Wyświetlanie (citizenUpkeepDisplayLines) niesie stawkę epoki z werdyktu silnika.
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[citizen-upkeep-era-mult-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.citizen-upkeep-era-mult-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.citizen-upkeep-era-mult-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  citizenRequiredResourcesForEra,
  citizenUpkeepRateForEra,
  resolveCitizenResourceCoverage,
  computeCitizenResourceDrain,
  citizenUpkeepDisplayLines,
  CITIZEN_UPKEEP_RATE_PER_CITIZEN,
} from '../src/game/citizen-resource-upkeep';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[citizen-upkeep-era-mult-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const table = require('../data/citizen-resource-upkeep.json');

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const RATE = { 1: 1, 2: 2, 3: 3 };
const LIST_LEN = { 1: 2, 2: 4, 3: 5 };
const ERA_KEYS = { 1: 'drewno', 2: 'drewno', 3: 'drewno' };
const POPS = [0, 1, 7, 50, 100];

// --- A. Stawka per epoka i fallbacki --------------------------------------------------------
console.log('-- A. stawka per epoka i fallbacki --');
eq(M.citizenUpkeepRateForEra(1), 1, 'A1: Kamień (era 1) stawka = 1');
eq(M.citizenUpkeepRateForEra(2), 2, 'A2: Brąz (era 2) stawka = 2');
eq(M.citizenUpkeepRateForEra(3), 3, 'A3: Żelazo (era 3) stawka = 3');
eq(M.citizenUpkeepRateForEra(4), 3, 'A4: era 4 (powyżej tabeli) -> wiersz najwyższej epoki = 3');
eq(M.citizenUpkeepRateForEra(99), 3, 'A5: era 99 -> wiersz najwyższej epoki = 3');
eq(M.citizenUpkeepRateForEra(0), 1, 'A6: era 0 -> epoka 1 (stawka 1)');
eq(M.citizenUpkeepRateForEra(-5), 1, 'A7: era ujemna -> epoka 1 (stawka 1)');
eq(M.citizenUpkeepRateForEra(NaN), 1, 'A8: era NaN -> epoka 1 (stawka 1)');
eq(M.citizenUpkeepRateForEra(undefined), 1, 'A9: era undefined -> epoka 1 (stawka 1)');
eq(M.citizenUpkeepRateForEra(2.7), 2, 'A10: era 2.7 -> floor -> epoka 2 (stawka 2)');
eq(M.CITIZEN_UPKEEP_RATE_PER_CITIZEN, 1, 'A11: stała fallback = 1,0 (dla brakującego pola)');
// Dane: każdy wiersz ma stawkaNaObywatela = oczekiwana wartość, listy surowców bez zmian.
for (const row of table.epoki) {
  eq(row.stawkaNaObywatela, RATE[row.epoka], `A12: data epoka ${row.epoka} stawkaNaObywatela`);
  eq(row.surowce.length, LIST_LEN[row.epoka], `A13: data epoka ${row.epoka} liczba surowców bez zmian`);
}
// Fallback pola (brak / NaN / ujemne) w wierszu -> stała 1,0: sprawdzane przez resolve z era 1.
eq(M.citizenRequiredResourcesForEra(2).length, 4, 'A14: lista Brązu = 4 surowce (bez zmian)');
eq(M.citizenRequiredResourcesForEra(3).length, 5, 'A15: lista Żelaza = 5 surowców (bez zmian)');

// --- B. Siatka epoka × populacja × magazyn ---------------------------------------------------
console.log('-- B. siatka epoka x populacja x magazyn --');
for (const era of [1, 2, 3]) {
  const rate = RATE[era];
  const list = M.citizenRequiredResourcesForEra(era);
  eq(list.length, LIST_LEN[era], `B0: era ${era} lista długości ${LIST_LEN[era]}`);
  for (const pop of POPS) {
    const need = Math.floor(pop * rate);
    const tiers = need > 0 ? [0, need - 1, need, need + 1] : [0, 1];
    for (const have of tiers) {
      const stock = {};
      for (const k of list) stock[k] = have;
      const d = M.computeCitizenResourceDrain(era, pop, stock);
      const tag = `era=${era} pop=${pop} magazyn=${have}`;
      eq(d.ratePerCitizen, rate, `B1: ${tag} ratePerCitizen`);
      eq(JSON.stringify(d.required), JSON.stringify(list), `B2: ${tag} required = lista epoki`);
      const drained = Math.min(need, have);
      for (const k of list) {
        eq(d.deductions[k] ?? 0, drained, `B3: ${tag} drained[${k}] = min(${need}, ${have})`);
      }
      const covered = have >= need;
      eq(d.available.length, covered ? list.length : 0, `B4: ${tag} liczba dostępnych (bramka binarna)`);
      eq(d.missing.length, covered ? 0 : list.length, `B5: ${tag} liczba brakujących (bramka binarna)`);
    }
  }
}

// --- C. Spójność podgląd ↔ drenaż ------------------------------------------------------------
console.log('-- C. spójność podgląd <-> drenaż --');
for (const era of [1, 2, 3]) {
  for (const pop of POPS) {
    const need = Math.floor(pop * RATE[era]);
    for (const have of [0, Math.max(0, need - 1), need, need + 1]) {
      const stock = {};
      for (const k of M.citizenRequiredResourcesForEra(era)) stock[k] = have;
      const drain = M.computeCitizenResourceDrain(era, pop, stock);
      const cov = M.resolveCitizenResourceCoverage(era, stock, pop);
      const tag = `era=${era} pop=${pop} magazyn=${have}`;
      eq(JSON.stringify(cov.available), JSON.stringify(drain.available), `C1: ${tag} dostępne podgląd = drenaż`);
      eq(JSON.stringify(cov.missing), JSON.stringify(drain.missing), `C2: ${tag} brakujące podgląd = drenaż`);
      eq(cov.ratePerCitizen, RATE[era], `C3: ${tag} podgląd niesie stawkę epoki`);
    }
  }
}
// Podgląd BEZ populacji zachowuje starą bramkę „magazyn > 0" (zgodność wsteczna).
{
  const list = M.citizenRequiredResourcesForEra(3);
  const stock = {};
  for (const k of list) stock[k] = 1;
  const cov = M.resolveCitizenResourceCoverage(3, stock);
  eq(cov.available.length, list.length, 'C4: podgląd bez populacji: magazyn 1 > 0 => dostępny (legacy)');
  eq(cov.ratePerCitizen, 3, 'C5: podgląd bez populacji nadal niesie stawkę epoki 3');
}

// --- D. Granice N-1 / N / N+1 (Brąz, pop 7 -> N = 14) ----------------------------------------
console.log('-- D. granice N-1 / N / N+1 --');
{
  const pop = 7, need = 14, list = M.citizenRequiredResourcesForEra(2);
  for (const [have, wantDrained, wantAvail] of [[need - 1, 13, false], [need, 14, true], [need + 1, 14, true]]) {
    const stock = {};
    for (const k of list) stock[k] = have;
    const d = M.computeCitizenResourceDrain(2, pop, stock);
    eq(d.deductions[list[0]], wantDrained, `D1: magazyn ${have} -> drenaż ${wantDrained}`);
    eq(d.available.includes(list[0]), wantAvail, `D2: magazyn ${have} -> dostępny=${wantAvail}`);
    const cov = M.resolveCitizenResourceCoverage(2, stock, pop);
    eq(cov.available.includes(list[0]), wantAvail, `D3: podgląd magazyn ${have} -> dostępny=${wantAvail}`);
  }
}

// --- E. Populacja NaN / ujemna / Infinity -> 0 -----------------------------------------------
console.log('-- E. populacja NaN / ujemna / Infinity --');
for (const pop of [NaN, -3, Infinity, -Infinity, undefined]) {
  const stock = { drewno: 500, glina: 500, kamien: 500, ceramika: 500, cegla: 500 };
  const d = M.computeCitizenResourceDrain(3, pop, stock);
  eq(Object.keys(d.deductions).length, 0, `E1: pop=${String(pop)} -> brak odjęć`);
  eq(d.available.length, 5, `E2: pop=${String(pop)} -> wszystkie dostępne (zapotrzebowanie 0)`);
}

// --- F. Ekonomia: sumy zużycia na turę ------------------------------------------------------
console.log('-- F. ekonomia: sumy zużycia na turę --');
function totalDrain(era, pop) {
  const list = M.citizenRequiredResourcesForEra(era);
  const stock = {};
  for (const k of list) stock[k] = 1e9;
  const d = M.computeCitizenResourceDrain(era, pop, stock);
  return { per: list.map(k => d.deductions[k]), total: Object.values(d.deductions).reduce((a, b) => a + b, 0) };
}
{
  const kam = totalDrain(1, 10);
  eq(JSON.stringify(kam.per), JSON.stringify([10, 10]), 'F1: Kamień pop 10 -> 10 każdego z 2 (razem 20)');
  eq(kam.total, 20, 'F2: Kamień pop 10 -> razem 20');
  const brz = totalDrain(2, 10);
  eq(JSON.stringify(brz.per), JSON.stringify([20, 20, 20, 20]), 'F3: Brąz pop 10 -> 20 każdego z 4 (razem 80)');
  eq(brz.total, 80, 'F4: Brąz pop 10 -> razem 80');
  const zel = totalDrain(3, 10);
  eq(JSON.stringify(zel.per), JSON.stringify([30, 30, 30, 30, 30]), 'F5: Żelazo pop 10 -> 30 każdego z 5 (razem 150)');
  eq(zel.total, 150, 'F6: Żelazo pop 10 -> razem 150');
  eq(JSON.stringify(totalDrain(1, 50).per), JSON.stringify([50, 50]), 'F7: Kamień pop 50 -> 50/surowiec');
  eq(JSON.stringify(totalDrain(2, 50).per), JSON.stringify([100, 100, 100, 100]), 'F8: Brąz pop 50 -> 100/surowiec');
  eq(JSON.stringify(totalDrain(3, 50).per), JSON.stringify([150, 150, 150, 150, 150]), 'F9: Żelazo pop 50 -> 150/surowiec');
  eq(JSON.stringify(totalDrain(2, 100).per), JSON.stringify([200, 200, 200, 200]), 'F10: Brąz pop 100 -> 200/surowiec');
  eq(JSON.stringify(totalDrain(3, 100).per), JSON.stringify([300, 300, 300, 300, 300]), 'F11: Żelazo pop 100 -> 300/surowiec');
}
// Magazyn ogranicza odjęcie (nie schodzi poniżej zera) również w Brązie.
{
  const list = M.citizenRequiredResourcesForEra(2);
  const stock = { [list[0]]: 5 };
  const d = M.computeCitizenResourceDrain(2, 10, stock);
  eq(d.deductions[list[0]], 5, 'F12: Brąz pop 10, magazyn 5 -> odjęte 5 (nie 20)');
  eq(d.missing.includes(list[0]), true, 'F13: Brąz pop 10, magazyn 5 -> brakujący');
  eq(Object.values(d.deductions).every(v => v >= 0), true, 'F14: odjęcia nieujemne');
}

// --- G. Wyświetlanie niesie stawkę epoki z werdyktu -----------------------------------------
console.log('-- G. wyświetlanie stawki epoki --');
{
  const list = M.citizenRequiredResourcesForEra(2);
  const stock = {};
  for (const k of list) stock[k] = 1000;
  const cov = M.resolveCitizenResourceCoverage(2, stock, 10);
  const lines = M.citizenUpkeepDisplayLines(cov, 10);
  eq(lines.length, 4, 'G1: Brąz -> 4 wiersze');
  eq(lines.every(l => l.value === 20 && l.available === true), true, 'G2: Brąz pop 10 -> 20 na wiersz (stawka 2)');
  const lines3 = M.citizenUpkeepDisplayLines(M.resolveCitizenResourceCoverage(3, {}, 10), 10);
  eq(lines3.every(l => l.value === -30 && l.available === false), true, 'G3: Żelazo brak zapasu -> -30 na wiersz');
  const legacy = M.citizenUpkeepDisplayLines({ available: ['drewno'], missing: [] }, 10);
  eq(legacy[0].value, 10, 'G4: werdykt bez stawki (legacy) -> fallback 1,0 -> 10');
}

console.log(`\ncitizen-upkeep-era-mult-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
