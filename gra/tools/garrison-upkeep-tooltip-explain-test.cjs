'use strict';
/**
 * garrison-upkeep-tooltip-explain-test.cjs
 * R-WEB-UI-GARRISON-UPKEEP-TOOLTIP-EXPLAIN-Q1 (GARNTIP, decyzja wlasciciela 2026-11-17, wariant A:
 * dane bez zmian, wyjasnienie w podpowiedzi).
 *
 * Bramka pokrywa:
 *   A. Garnizon: baza z danych (utrzymanie) = X, wynik silnika = Z, mnozniki z silnika = Y;
 *      X * Y === Z (wartosci czytane z kodu silnika i data/buildings.json, nie wpisane recznie).
 *   B. Tekst podpowiedzi dla Garnizonu zawiera X, Y i Z zgodne z silnikiem.
 *   C. Budynek bez roznicy (baza === wynik, np. utrzymanie 0) -> brak wyjasnienia (null).
 *   D. Budynek z epoka >= Braz -> mnoznik Y uwzglednia mnoznik ery (FALA2 x era).
 *   E. buildingUpkeep === buildingUpkeepBreakdown(...).total dla WSZYSTKICH budynkow (refaktor bez zmiany wyniku).
 *   F. Przewod UI: buildingAdapter podpina podpowiedz do wiersza „Co turę", renderer stawia ja
 *      jako `title` wartosci, cityPanel (lista budynkow miasta) ustawia `title` na utrzymaniu.
 *
 * Uruchomienie (z gra/, po npm ci): node tools/garrison-upkeep-tooltip-explain-test.cjs
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) { console.error('[garrison-upkeep-tooltip-explain-test] esbuild not found. Run: npm ci (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.gute-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.gute-bundle.cjs');
fs.writeFileSync(ENTRY_FILE, `
export {
  buildingUpkeep, buildingUpkeepBreakdown, buildingUpkeepExplanation,
} from '../src/game/economy-upkeep';
export { R_STAWKI_FALA2_MULT } from '../src/game/r-stawki-strojenie';
export { buildingEraCostMultiplier } from '../src/game/building-stock-cost';
`, 'utf8');

try {
  esbuild.buildSync({ entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE_FILE, loader: { '.json': 'json', '.ts': 'ts' }, logLevel: 'silent' });
} catch (e) { console.error('bundling failed:\n', e.message || e); process.exit(1); }
const M = require(BUNDLE_FILE);

let passed = 0, failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }
function eq(a, b, m) { assert(JSON.stringify(a) === JSON.stringify(b), `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const readText = (p) => fs.readFileSync(path.resolve(GRA, p), 'utf8');
const bRaw = JSON.parse(readText('data/buildings.json'));
const BUILDINGS = Array.isArray(bRaw) ? bRaw : (bRaw.buildings || bRaw);
const byId = (id) => BUILDINGS.find(b => b.id === id);

// ---------- A. Garnizon: X, Y, Z z silnika ----------
console.log('A. Garnizon: baza x mnoznik = wynik');
const garn = byId('garnizon');
assert(!!garn, 'budynek garnizon istnieje w buildings.json');
const bdG = M.buildingUpkeepBreakdown(garn, 1);
const expectedX = Math.floor(garn.utrzymanie); // poziom 1, przyrost nieistotny przy maksPoziom 1
eq(bdG.base, expectedX, 'X (baza utrzymania Garnizonu) = dane');
eq(bdG.fala2Mult, M.R_STAWKI_FALA2_MULT, 'Y1 = R_STAWKI_FALA2_MULT z silnika');
eq(bdG.eraMult, M.buildingEraCostMultiplier(garn.epokaWejscia), 'Y2 = mnoznik ery z silnika');
eq(bdG.total, M.buildingUpkeep(garn, 1), 'Z = buildingUpkeep (wynik silnika)');
eq(bdG.base * bdG.fala2Mult * bdG.eraMult, bdG.total, 'X * Y === Z dokladnie (mnozniki calkowite)');
assert(bdG.total !== bdG.base, 'Garnizon: wynik rozni sie od bazy (warunek wyjasnienia)');

// ---------- B. tekst podpowiedzi ----------
console.log('B. tekst podpowiedzi Garnizonu');
const expl = M.buildingUpkeepExplanation(bdG);
const mult = bdG.fala2Mult * bdG.eraMult;
eq(expl, `Utrzymanie: baza ${bdG.base} × mnożnik silnika ${mult} = ${bdG.total} Pieniądza/turę`, 'tekst podpowiedzi zgodny z silnikiem');
assert(typeof expl === 'string' && expl.includes(`baza ${bdG.base}`) && expl.includes(`= ${bdG.total}`), 'podpowiedz zawiera baze i wynik');

// ---------- C. brak roznicy -> brak wyjasnienia ----------
console.log('C. budynek bez roznicy -> null');
const zeroUpkeep = BUILDINGS.find(b => Number.isFinite(b.utrzymanie) && b.utrzymanie === 0);
assert(!!zeroUpkeep, 'istnieje budynek z utrzymaniem 0 (np. Stela/Pomnik)');
if (zeroUpkeep) {
  const bd0 = M.buildingUpkeepBreakdown(zeroUpkeep, 1);
  eq(bd0.total, 0, `${zeroUpkeep.id}: wynik 0`);
  eq(M.buildingUpkeepExplanation(bd0), null, `${zeroUpkeep.id}: brak wyjasnienia gdy baza === wynik`);
}
// Synthetic: baza == wynik bez mnozenia (era 1 + FALA2 1 nie jest mozliwe z danych, sprawdz czysta funkcje).
eq(M.buildingUpkeepExplanation({ base: 3, fala2Mult: 1, eraMult: 1, total: 3 }), null, 'czysta funkcja: base===total -> null');

// ---------- D. mnoznik ery uwzgledniony ----------
console.log('D. mnoznik ery w podpowiedzi');
const eraB = BUILDINGS.find(b => Number.isFinite(b.utrzymanie) && b.utrzymanie > 0 && b.epokaWejscia >= 2);
assert(!!eraB, 'istnieje budynek z epoka >= 2 i utrzymaniem > 0');
if (eraB) {
  const bdE = M.buildingUpkeepBreakdown(eraB, 1);
  eq(bdE.eraMult, M.buildingEraCostMultiplier(eraB.epokaWejscia), `${eraB.id}: mnoznik ery z silnika`);
  assert(bdE.eraMult >= 2, `${eraB.id}: mnoznik ery >= 2`);
  eq(bdE.base * bdE.fala2Mult * bdE.eraMult, bdE.total, `${eraB.id}: X * FALA2 * era === Z`);
  const e = M.buildingUpkeepExplanation(bdE);
  assert(e && e.includes(`mnożnik silnika ${bdE.fala2Mult * bdE.eraMult} `), `${eraB.id}: podpowiedz pokazuje laczny mnoznik`);
}

// ---------- E. refaktor: buildingUpkeep === breakdown.total dla wszystkich ----------
console.log('E. buildingUpkeep === breakdown.total (wszystkie budynki)');
let mismatch = 0;
for (const b of BUILDINGS) {
  for (const lvl of [1, 2, 3]) {
    if (M.buildingUpkeep(b, lvl) !== M.buildingUpkeepBreakdown(b, lvl).total) mismatch++;
  }
}
eq(mismatch, 0, 'brak rozjazdu buildingUpkeep vs breakdown.total');

// ---------- F. przewod UI ----------
console.log('F. przewod UI (podpowiedz w karcie, rendererze i liscie miasta)');
const adapter = readText('src/ui/entityCards/buildingAdapter.ts');
const renderer = readText('src/ui/entityCards/renderer.ts');
const types = readText('src/ui/entityCards/types.ts');
const cityPanel = readText('src/ui/cityPanel.ts');
assert(/upkeepHint\s*=\s*buildingUpkeepExplanation\(upkeepBreakdown\)/.test(adapter), 'buildingAdapter: podpowiedz z buildingUpkeepExplanation(upkeepBreakdown)');
assert(/\{ label: 'Co turę'[^}]*hint:\s*upkeepHint/.test(adapter), 'buildingAdapter: wiersz „Co turę" niesie hint');
assert(/hint\?:\s*string/.test(types), 'types.ts: EntityCardRow.hint');
assert(/if \(row\.hint\) val\.title = row\.hint;/.test(renderer), 'renderer: hint -> title wartosci wiersza');
assert(/upSpan\.title = upHint/.test(cityPanel), 'cityPanel: lista budynkow miasta ustawia title utrzymania');
assert(/buildingUpkeepExplanation\(buildingUpkeepBreakdown\(/.test(cityPanel), 'cityPanel: wyjasnienie liczone z tego samego rozbicia co silnik');
assert(/up\.title = buildingUpkeepExplanation\(buildingUpkeepBreakdown\(/.test(cityPanel), 'cityPanel: stopka karty budynku (bld-infocard-upkeep) niesie wyjasnienie');
assert(/function gridDetailRow\(grid: HTMLElement, label: string, val: string \| null \| undefined, hint\?: string\)/.test(cityPanel) && /if \(hint\) vEl\.title = hint;/.test(cityPanel), 'cityPanel: gridDetailRow przyjmuje hint -> title wartosci');
assert(/'Utrzymanie \(co turę\)',[\s\S]{0,200}buildingUpkeepExplanation\(buildingUpkeepBreakdown\(/.test(cityPanel), 'cityPanel: wiersz „Utrzymanie (co turę)” karty szczegolowej niesie wyjasnienie');

// ---------- cleanup ----------
try { fs.unlinkSync(ENTRY_FILE); } catch (_) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (_) {}

console.log(`\nWynik: ${passed} OK, ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
