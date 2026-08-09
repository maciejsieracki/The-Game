'use strict';
/**
 * okolica-isworkable-silnik-test.cjs
 * P-HEKS-ISWORKABLE-OVERLAY-VS-SILNIK-HIPOTEZA (2026-08-09) + R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1
 *
 * Testuje SILNIK ekonomii (`cityWorkedTilesForEconomy` / `workedHexCoordsForCity` w
 * src/game/turn-economy.ts) -- musi wykluczac Morze/Gory z obsadzania robotnikami,
 * dokladnie jak overlay renderowania (main.ts::okolicaHexWorkable) i wspolne zrodlo
 * prawdy `isLandWorkableHex` (src/game/okolica.ts).
 *
 * Runda 3 (B2, Evaluator rundy 2): do tej rundy plik NIE ISTNIAL -- zero pokrycia dla
 * trybu RECZNEGO w silniku w ogole. Sekcja 2 ponizej dokłada dokladnie ten scenariusz
 * z kanonu decyzji R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1: stary zapis z nielegalnym
 * przydzialem (Gory/Morze) -- silnik po prostu NIE liczy tej produkcji, bez komunikatu,
 * bez auto-naprawy danych `okolicaReczne`.
 *
 * Run from gra/: node tools/okolica-isworkable-silnik-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[okolica-isworkable-silnik-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.okolica-isworkable-silnik-entry.ts');
const BUNDLE = path.join(__dirname, '.okolica-isworkable-silnik-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { cityWorkedTilesForEconomy, workedHexCoordsForCity } from '../src/game/turn-economy';
export { isLandWorkableHex, assignWorkedTiles, wagiForFocus, cityRangeForPopulation } from '../src/game/okolica';
export { tileYield } from '../src/game/economy';
`, 'utf8');

try {
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
} catch (e) {
  console.error('[okolica-isworkable-silnik-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const {
  cityWorkedTilesForEconomy, workedHexCoordsForCity,
  isLandWorkableHex, assignWorkedTiles, wagiForFocus, cityRangeForPopulation,
  tileYield,
} = require(BUNDLE);

let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}
function eq(a, b, msg) {
  ok(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

console.log('\n-- P-HEKS-ISWORKABLE: silnik wyklucza Gory/Morze, stare reczne zapisy nie licza sie bez migracji --\n');

// --- fake map: siatka Rownin, pierscien Gor w d=1, jeden hex Morza w d=2 -----------
// Wartosci terenu (terrain-yields.json): Gory Praca=4 Zywnosc=0 Podatek=0 (najwyzsza
// Praca w grze -- gdyby silnik NIE filtrowal terenu, fokus "produkcja" wybralby je
// jako pierwsze). Morze Zywnosc=2 Praca=0 Podatek=2 (Podatek wyzszy niz Rownina=1 --
// analogiczna pulapka dla fokusu "podatki"). Rownina baseline: Zywnosc=2 Praca=2 Podatek=1.
function buildMap() {
  const hexes = {};
  for (let q = -8; q <= 8; q++) {
    for (let r = -8; r <= 8; r++) {
      hexes[`${q},${r}`] = { terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak' };
    }
  }
  const ring1 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
  for (const [dq, dr] of ring1) {
    hexes[`${dq},${dr}`] = { terenBazowy: 'gory', nakladka: 'brak', ulepszenie: 'brak' };
  }
  hexes['3,0'] = { terenBazowy: 'morze', nakladka: 'brak', ulepszenie: 'brak' };
  return { szerokoscQ: 17, wysokoscR: 17, seed: 1, hexes };
}

// =============================================================================
// SEKCJA 1: tryb AUTO -- silnik nigdy nie wybiera Gor/Morza, mimo ze maja
// najwyzszy score pod danym fokusem (kontrast z assignWorkedTiles BEZ filtra,
// ktore w tej samej sytuacji Gory/Morze WYBIERA -- dowod ze test jest czuly na
// usuniecie filtra, nie tylko "przypadkiem zielony").
// =============================================================================
console.log('1. tryb AUTO — silnik (cityWorkedTilesForEconomy) wyklucza Gory pod fokusem "produkcja"');
{
  const map = buildMap();
  const cityAuto = {
    id: 'c-auto-gory', ownerId: 0, q: 0, r: 0, population: 6,
    okolicaFocus: 'produkcja', okolicaTryb: 'auto',
  };
  const tiles = cityWorkedTilesForEconomy(cityAuto, map);
  eq(tiles.length, 7, '1 centrum + 6 robotnikow (pop=6)');
  const anyGoraInResult = tiles.some(t => t.terenBazowy === 'gory');
  ok(!anyGoraInResult, 'silnik: ZERO przypisanych pol na Gorach mimo fokusu "produkcja" (Praca=4, najwyzsza w grze)');

  // Kontrast: bez filtra terenu (isWorkable pominiete) assignWorkedTiles WYBIERA Gory
  // jako pierwsze -- dowodzi ze scenariusz testowy realnie odroznia "z filtrem" od
  // "bez filtra" (czuly na regresje usuniecia isWorkable z silnika).
  const wagi = wagiForFocus('produkcja');
  const unfiltered = assignWorkedTiles(0, 0, 6, map, (q, r) => {
    const h = map.hexes[`${q},${r}`];
    if (!h) return {};
    if (h.terenBazowy === 'gory') return { zywnosc: 0, praca: 4, handel: 0 };
    if (h.terenBazowy === 'morze') return { zywnosc: 2, praca: 0, handel: 2 };
    return { zywnosc: 2, praca: 2, handel: 1 };
  }, { radius: 6, wagi });
  const unfilteredHasGora = unfiltered.some(t => t.key === '1,0' || t.key === '-1,0' || t.key === '0,1' || t.key === '0,-1' || t.key === '1,-1' || t.key === '-1,1');
  ok(unfilteredHasGora, 'kontrola: BEZ filtra terenu ten sam scenariusz WYBIERA Gory (dowod ze test jest czuly na regresje)');
}

console.log('\n2. tryb AUTO — silnik (workedHexCoordsForCity) wyklucza Morze pod fokusem "podatki"');
{
  const map = buildMap();
  const cityAuto = {
    id: 'c-auto-morze', ownerId: 0, q: 0, r: 0, population: 1,
    okolicaFocus: 'podatki', okolicaTryb: 'auto',
  };
  const coords = workedHexCoordsForCity(cityAuto, map);
  eq(coords.length, 1, '1 robotnik (pop=1)');
  const pickedMorze = coords.some(c => c.q === 3 && c.r === 0);
  ok(!pickedMorze, 'silnik: heks Morza (3,0) NIE wybrany mimo fokusu "podatki" (Podatek=2 > Rownina=1)');
}

// =============================================================================
// SEKCJA 2: tryb RECZNY, STARY zapis z nielegalnym przydzialem -- kanon decyzji
// R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1: "silnik po prostu nie liczy tej produkcji,
// bez komunikatu, bez auto-przestawienia". Zero pokrycia przed runda 3 (B2).
// =============================================================================
console.log('\n3. tryb RECZNY — STARY zapis: silnik NIE liczy produkcji z nielegalnych pol (bez migracji)');
{
  const map = buildMap();
  // 3 legalne wpisy (Rownina, dystans 2 -- POZA pierscieniem Gor z Sekcji 1) +
  // 2 nielegalne (Gory '1,0', Morze '3,0') -- symulacja zapisu sprzed naprawy
  // filtra terenu w trybie recznym.
  const staleReczne = { '2,0': 1, '0,2': 1, '-2,0': 1, '1,0': 1, '3,0': 1 };
  const staleReczneSnapshot = JSON.stringify(staleReczne);
  const cityStale = {
    id: 'c-stale', ownerId: 0, q: 0, r: 0, population: 5,
    okolicaFocus: 'zrownowazone', okolicaTryb: 'reczny',
    okolicaReczne: staleReczne,
  };

  const tiles = cityWorkedTilesForEconomy(cityStale, map);
  // 1 centrum + tylko 3 legalne (Gory i Morze wykluczone z produkcji)
  eq(tiles.length, 4, '1 centrum + 3 legalne pola licza sie do produkcji (2 z 5 wpisow nielegalne, pomijane)');
  ok(!tiles.some(t => t.terenBazowy === 'gory'), 'zero pol Gor w wyniku silnika mimo wpisu w okolicaReczne');
  ok(!tiles.some(t => t.terenBazowy === 'morze'), 'zero pol Morza w wyniku silnika mimo wpisu w okolicaReczne');

  // Suma Pracy: centrum (Rownina, Praca=2) + 3 legalne pola Rownina (Praca=2 kazde) = 8 pkt Pracy/ture.
  // Gdyby silnik liczyl wszystkie 5 wpisow legalnie (bez filtra terenu): centrum(2) +
  // 3xRownina(2) + Gory(4) + Morze(0) = 14 pkt Pracy/ture -- konkretny, zmierzalny
  // przyklad "cichej utraty produkcji" akceptowanej przez R-HEKS-ISWORKABLE-STARE-ZAPISY-Q1.
  // (cityWorkedTilesForEconomy zwraca deskryptory hexow -- tileYield() liczy realny
  // plon, dokladnie jak w silnikowej sciezce sumEconomyForOwner/computeCityHealthBreakdown.)
  const pracaSum = tiles.reduce((s, t) => s + (tileYield(t).praca ?? 0), 0);
  eq(pracaSum, 8, 'suma Pracy/ture = 8 pkt (centrum 2 + 3 legalne pola x2 Praca kazde, Gory/Morze pominiete)');

  // Parytet z workedHexCoordsForCity (drugi call site tej samej silnikowej sciezki).
  const coords = workedHexCoordsForCity(cityStale, map);
  eq(coords.length, 3, 'workedHexCoordsForCity: rowniez tylko 3 legalne pola (parytet z cityWorkedTilesForEconomy)');

  // Brak auto-migracji: samo policzenie produkcji (odpowiednik otwarcia panelu /
  // przetworzenia tury po wczytaniu zapisu) NIE zmienia city.okolicaReczne -- zadnego
  // automatycznego usuniecia/przesuniecia nielegalnych wpisow bez akcji gracza.
  eq(cityStale.okolicaReczne, staleReczne, 'okolicaReczne wciaz ten sam obiekt po odczycie przez silnik');
  eq(JSON.stringify(cityStale.okolicaReczne), staleReczneSnapshot,
    'okolicaReczne zawartosc niezmieniona (5 wpisow, w tym Gory+Morze, nadal obecne w danych)');
}

console.log('\n4. isLandWorkableHex — parytet bezposredni z terenem uzytym w silniku powyzej');
{
  const map = buildMap();
  eq(isLandWorkableHex(map, 2, 0), true, 'Rownina (2,0) -> workable (zgodne z Sekcja 3)');
  eq(isLandWorkableHex(map, 1, 0), false, 'Gory (1,0) -> NIE workable (zgodne z Sekcja 3)');
  eq(isLandWorkableHex(map, 3, 0), false, 'Morze (3,0) -> NIE workable (zgodne z Sekcja 3)');
}

// --- summary -----------------------------------------------------------------
const total = passed + failed;
if (failed === 0) {
  console.log(`\nOKOLICA-ISWORKABLE-SILNIK OK (${passed}/${total})`);
} else {
  console.log(`\nOKOLICA-ISWORKABLE-SILNIK FAIL (${passed}/${total} passed, ${failed} failed)`);
}

try { fs.unlinkSync(ENTRY); } catch (e) {}
try { fs.unlinkSync(BUNDLE); } catch (e) {}

process.exit(failed === 0 ? 0 : 1);
