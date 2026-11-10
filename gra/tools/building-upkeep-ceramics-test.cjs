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
 *   E. brak ujemnego zapasu przy poborze (deduct clamp)
 *   F. lancuch deficytu: AI_BUILDING_FOR_DEFICIT ceramika -> garncarnia
 *   G. agregat 4 miast = 8/t
 *   H. symulacja 200 tur (MODEL: realne funkcje, produkcja i budowa AI zalozone; NIE pelna gra)
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
export { deductBuildingStockCostAcrossCities } from '../src/game/building-stock-cost';
export { AI_BUILDING_FOR_DEFICIT } from '../src/game/ai';
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

// ---------- E. brak ujemnego zapasu przy poborze ----------
console.log('E. brak ujemnego zapasu');
const mkCity = (id, ownerId, ceram) => ({ id, ownerId, surowce: { ceramika: ceram } });
{
  // zapas 3+2 < popyt 8: obie miasta schodza do 0, nic nie jest ujemne
  const cs = [mkCity('a', 0, 3), mkCity('b', 0, 2)];
  M.deductBuildingStockCostAcrossCities(cs, 0, { ceramika: 8 });
  eq([cs[0].surowce.ceramika, cs[1].surowce.ceramika], [0, 0], 'zapas 3+2 < 8: obie miasta = 0');
  assert(cs.every(c => c.surowce.ceramika >= 0), 'zadne miasto nie schodzi ponizej 0');
}
{
  // zapas 5+3 >= 6: najpierw najwieksze miasto (a), reszta z b
  const cs = [mkCity('a', 0, 5), mkCity('b', 0, 3)];
  M.deductBuildingStockCostAcrossCities(cs, 0, { ceramika: 6 });
  eq([cs[0].surowce.ceramika, cs[1].surowce.ceramika], [0, 2], 'zapas 5+3 - pobor 6: [0,2]');
}
{
  // brak zapasu: nic nie zmienia sie i nic nie jest ujemne; obca wlasnosc nietknieta
  const cs = [mkCity('a', 0, 0), mkCity('x', 1, 4)];
  M.deductBuildingStockCostAcrossCities(cs, 0, { ceramika: 8 });
  eq([cs[0].surowce.ceramika, cs[1].surowce.ceramika], [0, 4], 'zapas 0: bez zmian, obcy owner nietkniety');
}

// ---------- F. lancuch deficyt -> Garncarnia ----------
console.log('F. lancuch deficyt -> garncarnia');
eq(M.AI_BUILDING_FOR_DEFICIT.ceramika, ['garncarnia'], 'AI_BUILDING_FOR_DEFICIT: ceramika -> garncarnia');
{
  const n = M.detectOwnerResourceNeeds({ goods: [{ key: 'ceramika', ilosc: 0 }], pricedKeys: [], pakietWielkosc: 10, upkeepDemand: { ceramika: 8 } });
  assert(n.deficitKeys.includes('ceramika') && (M.AI_BUILDING_FOR_DEFICIT[n.deficitKeys[0]] || []).includes('garncarnia') , 'deficyt ceramiki wskazuje garncarnie');
}
// Pelne wywolanie boostu (boostCandidatesForResourceDeficits) nie jest eksportowane: NIE_ZMIERZONO w tescie jednostkowym.

// ---------- G. agregat na poziomie miast (dane) ----------
console.log('G. agregat miast');
{
  const cities = CERAM_IDS.map((id, i) => ({ id: 'c' + i, ownerId: 0, buildings: [byId(id)] }));
  const sum = {};
  for (const c of cities) {
    const r = M.totalBuildingResourceUpkeep(c.buildings.map(b => ({ record: b, level: 1 })), 1);
    sum.ceramika = (sum.ceramika || 0) + (r.ceramika || 0);
  }
  eq(sum.ceramika, 8, 'agregat 4 miast z 1 budynkiem kazde = 8/ture');
}

// ---------- H. symulacja N tur (model: prawdziwe funkcje podatku/deficytu, produkcja i AI-budowa z reguly) ----------
console.log('H. symulacja tur (MODEL, nie pelna gra)');
const TURNS = 200;
const DEMAND = 8;
const PRODUCTION_PER_TURN = 50; // converters.ts garncarnia throughputFallback 50 (zakladane: wejscia glina+drewno dostepne)
const econRaw = ECON;
const RATIO = M.readBuildingResourceUpkeepRatio(econRaw, 'normal');
eq(RATIO, 1, 'wspolczynnik utrzymania surowcowego (normal) = 1');
const upkeepCeram = M.totalBuildingResourceUpkeep(CERAM_IDS.map(id => ({ record: byId(id), level: 1 })), RATIO).ceramika;
eq(upkeepCeram, DEMAND, 'popyt ceramiki w symulacji = 8');
function simulate(name, { startStock, producerTurn }) {
  let stock = startStock, deficitTurns = 0, minBal = Infinity, maxBal = -Infinity, producerBuiltAt = null;
  for (let t = 0; t < TURNS; t++) {
    if (producerTurn !== null && t >= producerTurn && producerBuiltAt === null) producerBuiltAt = t;
    const cities = [{ id: 'c', ownerId: 0, surowce: { ceramika: stock } }];
    const needs = M.detectOwnerResourceNeeds({ goods: [{ key: 'ceramika', ilosc: stock }], pricedKeys: [], pakietWielkosc: 10, upkeepDemand: { ceramika: DEMAND } });
    if (needs.deficitKeys.includes('ceramika')) deficitTurns++;
    if (producerBuiltAt !== null && t >= producerBuiltAt) cities[0].surowce.ceramika += PRODUCTION_PER_TURN;
    M.deductBuildingStockCostAcrossCities(cities, 0, { ceramika: DEMAND });
    stock = cities[0].surowce.ceramika;
    assert(stock >= 0, `${name}: zapas nieujemny w turze ${t}`);
    minBal = Math.min(minBal, stock); maxBal = Math.max(maxBal, stock);
  }
  const pct = Math.round(1000 * deficitTurns / TURNS) / 10;
  console.log(`  ${name}: tury=${TURNS}, deficyt w ${deficitTurns} turach (${pct}%), saldo min=${minBal} max=${maxBal} koniec=${stock}, garncarnia od tury=${producerBuiltAt}`);
  return { deficitTurns, stock };
}
const s1 = simulate('S1 garncarnia od t0, zapas 0', { startStock: 0, producerTurn: 0 });
assert(s1.deficitTurns <= 1, 'S1: po pierwszej turze produkcja pokrywa popyt (deficyt <= 1 tura)');
const s2 = simulate('S2 garncarnia od t10, zapas 0', { startStock: 0, producerTurn: 10 });
assert(s2.deficitTurns <= 11, 'S2: deficyt nie dluzszy niz 11 tur (czas do pierwszej produkcji)');
const s3 = simulate('S3 brak garncarni (worst case), zapas 8', { startStock: 8, producerTurn: null });
assert(s3.deficitTurns >= TURNS - 1, 'S3: bez producenta deficyt trwa (zaleznosc od AI-budowy, NIE_ZMIERZONO w grze)');


console.log(`\n${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE); } catch (_) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (_) {}
process.exit(failed ? 1 : 0);
