/**
 * building-upkeep-ceramics-test.cjs
 * R-WEB-BUILDING-UPKEEP-CERAMICS-IMPL-Q1 (decyzja wlasciciela: wariant C z audytu)
 *
 * Ceramika jako surowiec UTRZYMANIA czterech budynkow: Spichlerz Krolewski (spichlerz_ii),
 * Akwedukt, Laznia publiczna, Port (port) -- 2 szt. ceramiki/ture na budynek, lacznie 8/ture.
 * Pole danych: buildings.json `utrzymanie_surowce: { ceramika: 2 }` (stala ilosc per budynek,
 * nie per typ i nie na poziom; NIE jest kosztem budowy). Mechanizm: economy-upkeep.ts
 * `buildingResourceUpkeep` (ta sama sciezka co utrzymanie proporcjonalne: turn-economy,
 * podglad, panel surowcow). Deficyt ceramiki dla utrzymania: ai-resource-needs.ts
 * `upkeepDemand` -> AI_BUILDING_FOR_DEFICIT (ceramika -> garncarnia).
 *
 *   A. dane: dokladnie 4 budynki z polem, kazdy od epoki Braz (epokaWejscia >= 2), wartosc 2
 *   B. wyliczenie per budynek: ceramika = 2 (ratio 1), 1 (ratio 0.5), 0 (ratio 0); Stela/Spichlerz I bez
 *   C. suma 4 budynkow = 8/ture; drewno/kamien/cegla dalej z koszt_surowce (bez zmian)
 *   D. deficyt: upkeepDemand ceramika > zapas => klucz w deficitKeys; zapas >= popyt => brak
 *   E. (poza zakresem: symulacja tur i brak ujemnego zapasu -- NIE_ZMIERZONO w tym tescie)
 *
 * Uruchomienie: node tools/building-upkeep-ceramics-test.cjs (z gra/, po npm install)
 */
'use strict';
const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) { console.error('[building-upkeep-ceramics-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.buc-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.buc-bundle.cjs');
fs.writeFileSync(ENTRY_FILE, `
import { loadGameData } from '../src/data/loader';
export {
  buildingResourceUpkeep, totalBuildingResourceUpkeep, readBuildingResourceUpkeepRatio,
} from '../src/game/economy-upkeep';
export { detectOwnerResourceNeeds } from '../src/game/ai-resource-needs';
export { loadGameData };
`, 'utf8');
try {
  esbuild.buildSync({ entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE_FILE, loader: { '.json': 'json', '.ts': 'ts' }, logLevel: 'silent' });
} catch (e) { console.error('bundling failed:\n', e.message || e); process.exit(1); }
const M = require(BUNDLE_FILE);

let passed = 0, failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }
function eq(a, b, m) { assert(JSON.stringify(a) === JSON.stringify(b), `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const readJson = (p) => JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', p), 'utf8'));
const bRaw = readJson('data/buildings.json');
const BUILDINGS = Array.isArray(bRaw) ? bRaw : (bRaw.buildings || bRaw);
const byId = (id) => BUILDINGS.find(b => b.id === id);
const ECON = readJson('data/econ-params.json');
const CERAM_IDS = ['spichlerz_ii', 'akwedukt', 'laznia_publiczna', 'port'];

// ---------- A. dane ----------
console.log('A. dane');
const withField = BUILDINGS.filter(b => b.utrzymanie_surowce).map(b => b.id).sort();
eq(withField, [...CERAM_IDS].sort(), 'dokladnie 4 budynki z utrzymanie_surowce');
for (const id of CERAM_IDS) {
  const b = byId(id);
  eq(b.utrzymanie_surowce, { ceramika: 2 }, `${id}: utrzymanie_surowce = {ceramika:2}`);
  assert(b.epokaWejscia >= 2, `${id}: epokaWejscia >= 2 (Braz) (got ${b.epokaWejscia})`);
  assert(!(b.koszt_surowce && 'ceramika' in b.koszt_surowce), `${id}: ceramika NIE jest w koszcie budowy`);
}
assert(!byId('spichlerz').utrzymanie_surowce, 'spichlerz (Spichlerz I) bez pola utrzymania ceramika');
assert(!byId('port_wielki').utrzymanie_surowce, 'port_wielki poza lista');

// ---------- B. wyliczenie per budynek ----------
console.log('B. wyliczenie per budynek');
for (const id of CERAM_IDS) {
  const r1 = M.buildingResourceUpkeep(byId(id), 1, 1);
  eq(r1.ceramika, 2, `${id}: ceramika = 2 przy ratio 1`);
  eq(M.buildingResourceUpkeep(byId(id), 1, 0.5).ceramika, 1, `${id}: ceramika = 1 przy ratio 0.5`);
  eq(M.buildingResourceUpkeep(byId(id), 1, 0).ceramika, undefined, `${id}: brak ceramiki przy ratio 0`);
}
eq(M.buildingResourceUpkeep(byId('spichlerz'), 1, 1).ceramika, undefined, 'Spichlerz I: brak ceramiki');
eq(M.buildingResourceUpkeep(byId('studnia'), 1, 1).ceramika, undefined, 'Studnia: brak ceramiki');
eq(M.buildingResourceUpkeep(null, 1, 1), {}, 'null: brak utrzymania');
// koszt_surowce dalej dziala tak jak przed zmiana (proporcjonalnie do Pieniadza)
const portRes = M.buildingResourceUpkeep(byId('port'), 1, 1);
assert(portRes.drewno > 0 && portRes.kamien > 0, 'Port: drewno i kamien z koszt_surowce nadal sa');
eq(portRes.cegla, undefined, 'Port: brak cegly (nie ma jej w koszt_surowce)');

// ---------- C. suma ----------
console.log('C. suma 4 budynkow');
const owned = CERAM_IDS.map(id => ({ record: byId(id), level: 1 }));
const total = M.totalBuildingResourceUpkeep(owned, 1);
eq(total.ceramika, 8, 'suma ceramiki dla 4 budynkow = 8/ture');
const allTotal = M.totalBuildingResourceUpkeep(
  BUILDINGS.map(b => ({ record: b, level: 1 })), 1);
// Liczba budynkow z ceramika w calym katalogu = 4, wiec suma ceramiki w katalogu == 8 (nie 4*5 jak stala 5/typ).
eq(allTotal.ceramika, 8, 'suma ceramiki po calym katalogu = 8 (nie 40)');

// ---------- D. deficyt AI ----------
console.log('D. deficyt utrzymania (AI)');
const goods0 = [{ key: 'ceramika', ilosc: 0 }];
const needs0 = M.detectOwnerResourceNeeds({
  goods: goods0, pricedKeys: [], pakietWielkosc: 10,
  upkeepDemand: { ceramika: 8 },
});
assert(needs0.deficitKeys.includes('ceramika'), 'zapas 0 < popyt 8 => ceramika w deficitKeys');
const needs8 = M.detectOwnerResourceNeeds({
  goods: [{ key: 'ceramika', ilosc: 8 }], pricedKeys: [], pakietWielkosc: 10,
  upkeepDemand: { ceramika: 8 },
});
assert(!needs8.deficitKeys.includes('ceramika'), 'zapas 8 >= popyt 8 => brak deficytu ceramiki');
const needsNone = M.detectOwnerResourceNeeds({
  goods: goods0, pricedKeys: [], pakietWielkosc: 10,
});
assert(!needsNone.deficitKeys.includes('ceramika'), 'bez upkeepDemand => brak deficytu (zero regresji)');

// E (brak ujemnego zapasu przy poborze, pelna symulacja tur) NIE jest pokryte tym testem: NIE_ZMIERZONO.

console.log(`\n${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (_) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (_) {}
process.exit(failed ? 1 : 0);
