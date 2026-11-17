#!/usr/bin/env node
/**
 * diplo-respect-military-edge-test.cjs — R-WEB-DIPLO-RESPECT-MILITARY-EVENTS-WIRING-Q1
 *
 * Czysta logika przejścia progu Respektu (respektMilitaryCrossing, diplomacy-military-strength.ts)
 * oraz parametr progu z JSON (progRespektProc = 50, jedno źródło).
 *
 * Run from gra/: node tools/diplo-respect-military-edge-test.cjs
 *
 * Przypadki:
 *  (a) stosunek 1,49 → brak zdarzenia; 1,50 → przewaga gracza, zdarzenie 'A' raz
 *  (b) kolejne tury powyżej progu → brak ponownego naliczenia
 *  (c) spadek poniżej progu (stan 'brak') i ponowne przekroczenie → ponowne zdarzenie
 *  (d) symetria: partner 1,5× silniejszy → zdarzenie 'B' (gracz słabszy) raz
 *  (e) próg w JSON = 50; mutacja progu 1,2 (20%) zmienia wynik dla 1,49 → test czerwienieby
 *  (f) siła 0 po obu stronach → brak zdarzenia
 *  (g) brak poprzedniego stanu traktowany jak 'brak'
 */
'use strict';

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) { console.error('esbuild missing (npm ci --ignore-scripts w gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.respect-military-edge-entry.ts');
const BUNDLE = path.join(__dirname, '.respect-military-edge-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  respektMilitaryCrossing, compareMilitaryStrength, loadMilitaryStrengthParams,
  DEFAULT_MILITARY_STRENGTH_PARAMS,
} from '../src/game/diplomacy-military-strength';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' },
  outfile: BUNDLE,
  absWorkingDir: GRA,
  logLevel: 'silent',
});
try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
const mod = require(BUNDLE);
const { respektMilitaryCrossing, loadMilitaryStrengthParams, DEFAULT_MILITARY_STRENGTH_PARAMS } = mod;

let pass = 0;
let fail = 0;
function check(cond, msg) {
  if (cond) { pass++; console.log('  OK:', msg); }
  else { fail++; console.error('  FAIL:', msg); }
}
const side = (id, sila) => ({ id, sila, armiaPkt: sila });

console.log('(e) parametr progu z JSON');
const params = loadMilitaryStrengthParams();
check(params.progRespektProc === 50, `progRespektProc w JSON = 50 (zmierzone ${params.progRespektProc})`);
check(params.progPrzewagiProc === 20, `progPrzewagiProc (wojna) nietknięty = 20 (zmierzone ${params.progPrzewagiProc})`);

// (a) 1,49 vs 1,50
console.log('(a) próg 1,49 / 1,50');
const r149 = respektMilitaryCrossing(side('g', 149), side('p', 100), undefined);
check(r149.stan === 'brak' && r149.zdarzenieDla === null, `stosunek 1,49 → brak zdarzenia (stan=${r149.stan})`);
const r150 = respektMilitaryCrossing(side('g', 150), side('p', 100), r149.stan);
check(r150.stan === 'A' && r150.zdarzenieDla === 'A', `stosunek 1,50 → przewaga gracza, zdarzenie 'A' raz (stan=${r150.stan})`);

// (b) utrzymanie
console.log('(b) utrzymanie powyżej progu');
let stan = r150.stan;
let liczbaZdarzen = 0;
for (let t = 0; t < 5; t++) {
  const r = respektMilitaryCrossing(side('g', 200), side('p', 100), stan);
  if (r.zdarzenieDla) liczbaZdarzen++;
  stan = r.stan;
}
check(liczbaZdarzen === 0, `5 tur powyżej progu bez ponownego naliczenia (zdarzeń=${liczbaZdarzen})`);

// (c) spadek i ponowne przekroczenie
console.log('(c) spadek poniżej progu i ponowne przekroczenie');
const spadek = respektMilitaryCrossing(side('g', 120), side('p', 100), stan);
check(spadek.stan === 'brak' && spadek.zdarzenieDla === null, `spadek poniżej progu → stan 'brak', bez zdarzenia`);
const wracaj = respektMilitaryCrossing(side('g', 160), side('p', 100), spadek.stan);
check(wracaj.zdarzenieDla === 'A', `ponowne przekroczenie 1,6 → zdarzenie 'A' ponownie`);

// (d) symetria
console.log('(d) partner silniejszy 1,5×');
const sym = respektMilitaryCrossing(side('g', 100), side('p', 150), undefined);
check(sym.stan === 'B' && sym.zdarzenieDla === 'B', `partner 1,5× → zdarzenie 'B' (gracz słabszy) raz`);
const symNext = respektMilitaryCrossing(side('g', 100), side('p', 150), sym.stan);
check(symNext.zdarzenieDla === null, 'kolejna tura bez ponownego −10');

// (f) zero
console.log('(f) siły zerowe');
const zero = respektMilitaryCrossing(side('g', 0), side('p', 0), undefined);
check(zero.stan === 'brak' && zero.zdarzenieDla === null, 'obie siły 0 → brak');

// (g) brak stanu
console.log('(g) brak poprzedniego stanu');
const brakStanu = respektMilitaryCrossing(side('g', 200), side('p', 100), undefined);
check(brakStanu.zdarzenieDla === 'A', 'undefined poprzedni stan = brak → zdarzenie przy przekroczeniu');

// (e) mutacja progu 20% musi zmienić wynik dla 1,49
console.log('(e) mutacja progu 20% (czerwone)');
const mutated = { ...DEFAULT_MILITARY_STRENGTH_PARAMS, progRespektProc: 20 };
const mut = respektMilitaryCrossing(side('g', 149), side('p', 100), undefined, mutated);
check(mut.zdarzenieDla === 'A', 'mutacja progu na 20% daje zdarzenie przy 1,49 (test wykrywa zmianę progu)');

try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
console.log(`\nWynik: ${pass} OK, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
