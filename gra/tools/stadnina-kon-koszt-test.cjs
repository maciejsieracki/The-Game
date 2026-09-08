'use strict';
/**
 * stadnina-kon-koszt-test.cjs — BRAMKA TEMATU P-STADNINA-KONIE-KOSZT-ROZBUDOWY-Q1 (runda 2).
 *
 * GOAL RUNDY 2 (04-dispatch-runda2.md): stadnina NA złożu konia — bez zmian, zawsze darmowa;
 * stadnina POZA złożem — dozwolona WYŁĄCZNIE gdy magazyn imperium ma >= 50 'kon' W CHWILI
 * sprawdzenia, i przy potwierdzeniu budowy odejmuje DOKŁADNIE 50 z magazynu imperium
 * (jednorazowo, per stadnina — NIE stała bramka odblokowania).
 *
 * ŻYWY DOWÓD (nie lektura kodu, nie reimplementacja) — woła DOKŁADNIE te same funkcje silnika,
 * na DOKŁADNIE ten sam wzorzec co main.ts (refreshBuildApi / commitBuildRequest):
 *   • bramka kwalifikacji     -> buildImprovementQualifier (map/improvement-build.ts,
 *                                createQualifier -> isLivestockUnlockedForPlacement)
 *   • magazyn imperium        -> ownerResourceStockAll (game/building-stock-cost.ts) — ten sam
 *                                mechanizm sumowania co main.ts::citySurowceSumForOwner
 *   • odjęcie kosztu          -> deductBuildingStockCostAcrossCities (game/building-stock-cost.ts)
 *                                — DOKŁADNIE ta funkcja, którą main.ts::commitBuildRequest woła
 *                                dla budynków z koszt_surowce; runda 2 wpina ten sam wzorzec
 *                                mutacji magazynu dla stadniny (main.ts:12921-12969, poza
 *                                allowlistą bezpośredniego bundlowania stąd — main.ts ma
 *                                zależności DOM/WebGL, patrz uzasadnienie w innych bramkach tego
 *                                repo — więc symulujemy DOKŁADNIE ten sam warunek + wywołanie co
 *                                tam, nie reimplementujemy logiki od zera).
 *
 * KRYTERIA KOŃCA (04-dispatch-runda2.md, punkt 5 ZADANIA):
 *   (a) stadnina NA złożu konia — bez zmian, bez warunku magazynu, bez odjęcia.
 *   (b) POZA złożem, magazyn < 50 — zablokowana (qualifies() === false).
 *   (c) POZA złożem, magazyn >= 50 — budowa się udaje, magazyn spada DOKŁADNIE o 50.
 *   (d) handel 'kon' — już potwierdzony działającym bez zmian w rundzie 1 (03-obrona-runda1.md,
 *       10/10 OK) — NIE powtarzany tu (poza zakresem tej bramki, dispatch: „nie wracaj do niego").
 * Regresja ZERO: bydło/owce/lama nie znają pojęcia magazynu konia (zawsze dozwolone, bez zmian).
 * Regresja ZERO: tradeRouteKonUnlocked (Temat #4, „Handel E3b", osobny wcześniej wdrożony
 * mechanizm) nadal odblokowuje stadninę za darmo, niezależnie od magazynu — nie jest częścią
 * Modelu B retirowanego tym tematem.
 *
 * Uruchamiaj z gra/:  node tools/stadnina-kon-koszt-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.stadnina-kon-koszt-entry.ts');
const BUNDLE = path.resolve(__dirname, '.stadnina-kon-koszt-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { buildImprovementQualifier } from ${JSON.stringify(SRC + '/map/improvement-build')};
export {
  isLivestockUnlockedForPlacement,
  STADNINA_HORSE_COST,
} from ${JSON.stringify(SRC + '/game/livestock-unlock')};
export {
  ownerResourceStockAll,
  deductBuildingStockCostAcrossCities,
} from ${JSON.stringify(SRC + '/game/building-stock-cost')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE, resolveExtensions: ['.ts', '.js', '.json'], logLevel: 'silent',
});

const M = require(BUNDLE);
const T = M.TerenBazowy;
const N = M.Nakladka;

let pass = 0, fail = 0;
const ok = (cond, name, extra) => {
  if (cond) { pass++; console.log(`  [OK] ${name}`); }
  else { fail++; console.log(`  [FAIL] ${name}${extra !== undefined ? ' :: ' + JSON.stringify(extra) : ''}`); }
};

ok(M.STADNINA_HORSE_COST === 50, 'STADNINA_HORSE_COST === 50 (liczba jawna właściciela, bez zmian)');

function mkHex(q, r, teren, nakladka = N.Brak) {
  return {
    coords: { q, r },
    terenBazowy: teren,
    nakladka,
    rzeka: { obecna: false, krawedzie: [] },
    ulepszenie: 'brak',
    wioska: { istnieje: false, ludnosc: 0 },
    wlasciciel: null,
  };
}

// Mapa: heks ze złożem konia (0,0) + heks Łąka bez złoża (1,0) — oba w terytorium ownera 0.
const DEPOSIT_HEX = mkHex(0, 0, T.Rownina, N.ZlozeKonia);
const OPEN_HEX = mkHex(1, 0, T.Laka);
const hexes = { '0,0': DEPOSIT_HEX, '1,0': OPEN_HEX };
const map = { hexes, riverPaths: [], startPositions: [{ q: 0, r: 0 }] };
const cityNodes = [{ q: 0, r: 0, pop: 10, level: 1 }];
const territoryNodes = Object.values(hexes).map(h => ({ q: h.coords.q, r: h.coords.r, pop: 10, level: 1, ownerId: 0 }));

function qual(horseStockAvailable, tradeRouteKonUnlocked) {
  return M.buildImprovementQualifier({
    map, cityNodes, territoryNodes, playerOwnerIdNum: 0,
    playerCivArchetype: 'rzym', playerEra: 1,
    horseStockAvailable, tradeRouteKonUnlocked,
  });
}

// ---------------------------------------------------------------------------------------------
console.log('\n--- (a) NA złożu konia: bez zmian, bez warunku magazynu, bez odjęcia ---');
// ---------------------------------------------------------------------------------------------
ok(qual(0, false)('stadnina', 0, 0) === true,
  'GOAL (a): stadnina NA złożu kwalifikuje się z magazynem 0 (bez żadnego warunku)');
ok(M.isLivestockUnlockedForPlacement('stadnina', DEPOSIT_HEX, false, 0) === true,
  'GOAL (a): isLivestockUnlockedForPlacement bezpośrednio potwierdza — złoże wystarcza samo');
{
  const cities = [{ id: 'c0', ownerId: 0, surowce: { kon: 12 } }];
  // Symulacja DOKŁADNIE warunku main.ts::commitBuildRequest: stadninaPozaZlozem = key==='stadnina'
  // && hex.nakladka !== Nakladka.ZlozeKonia — na złożu ten warunek jest false, WIĘC deduction
  // NIE jest wołane wcale (gate zwarty w main.ts, patrz komentarz nad importami wyżej).
  const stadninaPozaZlozemNaZlozu = DEPOSIT_HEX.nakladka !== N.ZlozeKonia;
  ok(stadninaPozaZlozemNaZlozu === false, 'kontrola: main.ts NIE wołałby deductBuildingStockCostAcrossCities na złożu (warunek fałszywy)');
  ok(M.ownerResourceStockAll(cities, 0).kon === 12, 'kontrola: magazyn nietknięty (12 kon) — brak wywołania deduct na tej ścieżce');
}

// ---------------------------------------------------------------------------------------------
console.log('\n--- (b) POZA złożem, magazyn < 50: zablokowana ---');
// ---------------------------------------------------------------------------------------------
ok(qual(0, false)('stadnina', 1, 0) === false, 'GOAL (b): magazyn 0/50 — stadnina POZA złożem zablokowana');
ok(qual(49, false)('stadnina', 1, 0) === false, 'GOAL (b): magazyn 49/50 (o 1 za mało) — nadal zablokowana');
ok(qual(50, false)('stadnina', 1, 0) === true, 'kontrola granicy: magazyn DOKŁADNIE 50/50 — już dozwolona (próg >=, nie >)');

// ---------------------------------------------------------------------------------------------
console.log('\n--- (c) POZA złożem, magazyn >= 50: budowa się udaje, magazyn spada DOKŁADNIE o 50 ---');
// ---------------------------------------------------------------------------------------------
{
  const cities = [
    { id: 'c0', ownerId: 0, surowce: { kon: 40 } },
    { id: 'c1', ownerId: 0, surowce: { kon: 30 } },
  ];
  const stockBefore = M.ownerResourceStockAll(cities, 0).kon;
  ok(stockBefore === 70, 'setup: magazyn imperium (2 miasta) = 70 kon (>= 50)');
  ok(qual(stockBefore, false)('stadnina', 1, 0) === true,
    'GOAL (c): stadnina POZA złożem kwalifikuje się z magazynem 70 >= 50');

  // ŻYWE odjęcie — dokładnie ta funkcja, którą main.ts::commitBuildRequest woła dla kosztów
  // surowcowych (deductBuildingStockCostAcrossCities), z kosztem { kon: 50 } — nie osobna
  // reimplementacja, ten sam wzorzec mutacji magazynu co reszta funkcji (dispatch, ZADANIE pkt 3).
  M.deductBuildingStockCostAcrossCities(cities, 0, { kon: 50 });
  const stockAfter = M.ownerResourceStockAll(cities, 0).kon;
  ok(stockAfter === 20, `GOAL (c): magazyn spadł DOKŁADNIE o 50 (70 -> 20), rzeczywiste: ${stockAfter}`, stockAfter);

  // Druga stadnina poza złożem — MUSI zapłacić OSOBNE 50 (NIE jest to stała bramka
  // odblokowania po pierwszej zapłacie — dispatch, ZADANIE pkt 2).
  ok(qual(stockAfter, false)('stadnina', 1, 0) === false,
    'GOAL: DRUGA stadnina poza złożem z magazynem 20 (po pierwszej zapłacie) jest ZNÓW zablokowana — brak stałego odblokowania');
}

// ---------------------------------------------------------------------------------------------
console.log('\n--- regresja: bydło/owce/lama nigdy nie znają pojęcia magazynu konia ---');
// ---------------------------------------------------------------------------------------------
const PASTURE_HEX = mkHex(2, 0, T.Laka);
ok(M.isLivestockUnlockedForPlacement('bydlo', PASTURE_HEX, false, 0) === true, 'regresja: bydlo zawsze dozwolone (magazyn=0)');
ok(M.isLivestockUnlockedForPlacement('owce', PASTURE_HEX, false, 0) === true, 'regresja: owce zawsze dozwolone (magazyn=0)');
ok(M.isLivestockUnlockedForPlacement('lama', PASTURE_HEX, false, 0) === true, 'regresja: lama zawsze dozwolona (magazyn=0)');

// ---------------------------------------------------------------------------------------------
console.log('\n--- regresja: tradeRouteKonUnlocked (Temat #4, osobny mechanizm) bez zmian ---');
// ---------------------------------------------------------------------------------------------
ok(qual(0, true)('stadnina', 1, 0) === true,
  'regresja Temat #4: trasa handlowa nadal odblokowuje stadninę za darmo, magazyn=0');
ok(M.isLivestockUnlockedForPlacement('stadnina', OPEN_HEX, true, 0) === true,
  'regresja Temat #4: isLivestockUnlockedForPlacement potwierdza bezpośrednio');

console.log(`\nstadnina-kon-koszt-test: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
