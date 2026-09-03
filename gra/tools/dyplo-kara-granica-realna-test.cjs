'use strict';
/**
 * dyplo-kara-granica-realna-test.cjs — R-DYPLO-NAP-KARA-GRANICA-REDEFINICJA-Q1
 *
 * `main.ts` jest monolitycznym `boot()` (nietestowalnym w izolacji), więc ten test
 * odtwarza DOKŁADNIE tę samą kombinację, którą main.ts liczy w 4 miejscach
 * (RECON w 00-dispatch.md: main.ts:16887,16923,18153,29364) po tym temacie:
 *
 *   cities.filter(c=>c.ownerId===a).length>2 && cities.filter(c=>c.ownerId===b).length>2
 *     && ownersHaveSharedLandBorder(a, b, buildAllTerritoryNodes(), map)
 *
 * przy użyciu wyeksportowanej, czystej `ownersHaveSharedLandBorder` (trade-routes.ts,
 * już pokrytej geometrycznie przez trade-routes-test.cjs n1-n4) — więc weryfikuje
 * REALNĄ formułę main.ts, nie samą sygnaturę funkcji.
 *
 * KRYTERIUM 3 dispatchu (decyzja udokumentowana, do potwierdzenia przez właściciela):
 * próg ">2 miasta" ZACHOWANY jako DODATKOWY warunek obok granicy. Żadne źródło
 * projektowe (Dyplomacja/Dyplomacja-zasady.md, Dyplomacja-DOKUMENTACJA-DEV.md,
 * gra/data/diplomacy.json) nie uzasadnia progu wielkości osobno od granicy — ale
 * dispatch nakazuje najbezpieczniejszą zmianę przy braku takiego uzasadnienia:
 * usuwamy WYŁĄCZNIE błędne utożsamienie "ekspansja"="granica", nie usuwamy całego
 * pierwotnego warunku wielkości. Test K3 niżej dowodzi, że próg nadal działa.
 *
 * REGUŁA ANTY-HALUCYNACYJNA (dispatch): scenariusz "brak granicy" (K1) używa par
 * miast oddalonych o dziesiątki heksów (promień terytorium 5 każde), NIE sąsiadów
 * geograficznie bliskich — dystans jawnie wypisany w asercji.
 */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('[dyplo-kara-granica-realna-test] esbuild missing'); process.exit(1); }
})();

const ENTRY  = path.resolve(__dirname, '.dyplo-kara-granica-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dyplo-kara-granica-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { ownersHaveSharedLandBorder } from '../src/game/trade-routes';
`, 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  });
} catch (e) { console.error('[dyplo-kara-granica-realna-test] esbuild failed:\n', e.message || e); process.exit(1); }

const { ownersHaveSharedLandBorder } = require(BUNDLE);

let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

// Mapa: jeden długi, płaski, przechodni rząd lądu q=0..140, r=0 (wzorem buildMap
// z trade-routes-test.cjs) — wystarczająco szeroki, żeby zmieścić klastry miast
// jednoznacznie odległe (K1) i jednoznacznie stykające się (K2/K3) w jednym pliku.
function buildMap() {
  const hexes = {};
  for (let q = 0; q <= 140; q++) hexes[`${q},0`] = { terenBazowy: 'rownina' };
  return { szerokoscQ: 141, wysokoscR: 1, hexes, seed: 1, riverPaths: [] };
}
const map = buildMap();

// pop=1 -> cityRangeForPopulation(1) = 5 (identycznie jak territoryNode() w
// trade-routes-test.cjs / buildAllTerritoryNodes() w main.ts dla level=1).
function territoryNode(q, r, ownerId) { return { q, r, pop: 1, level: 1, ownerId }; }
function city(q, ownerId) { return { q, r: 0, ownerId, population: 1 }; }

// Formuła IDENTYCZNA z tą, którą po tym temacie liczy main.ts w 4 miejscach.
function karaWspolnaGranica(citiesAll, allTerritoryNodes, mapArg, a, b) {
  return citiesAll.filter(c => c.ownerId === a).length > 2
    && citiesAll.filter(c => c.ownerId === b).length > 2
    && ownersHaveSharedLandBorder(a, b, allTerritoryNodes, mapArg);
}

console.log('dyplo-kara-granica-realna-test');

// ---------------------------------------------------------------------------
// K1 — KRYTERIUM KOŃCA #1: dwie cywilizacje, >2 miasta KAŻDA, terytoria SIĘ NIE
// STYKAJĄ (odległe) -> karaWspolnaGranica = false. Dokładna odwrotność starego
// zachowania (dawne `ekspansjaPrzyGranicy` liczyło WYŁĄCZNIE miasta -> byłoby
// true tutaj mimo braku jakiegokolwiek sąsiedztwa).
// ---------------------------------------------------------------------------
{
  const OA = 100, OB = 101;
  const citiesA = [city(0, OA), city(1, OA), city(2, OA)];       // 3 miasta, klaster lewy
  const citiesB = [city(60, OB), city(61, OB), city(62, OB)];    // 3 miasta, klaster prawy
  const cities = [...citiesA, ...citiesB];
  const nodes = cities.map(c => territoryNode(c.q, c.r, c.ownerId));
  const najblizszaParaCentrow = 60 - 2; // = 58 hexow (najblizsze miasta obu klastrow)
  const sumaPromieni = 5 + 5;           // = 10

  ok(citiesA.length > 2 && citiesB.length > 2,
    `K1 kontrola: obie strony >2 miasta (${citiesA.length} / ${citiesB.length})`);
  ok(najblizszaParaCentrow > sumaPromieni,
    `K1 kontrola dystansu (ANTY-HALUCYNACYJNA): najbliższa para centrów miast w odległości ${najblizszaParaCentrow} hexów, suma promieni terytorium = ${sumaPromieni} -> JEDNOZNACZNIE poza zasięgiem, nie "geograficznie blisko"`);
  ok(ownersHaveSharedLandBorder(OA, OB, nodes, map) === false,
    `K1 (kontrola prymitywu) ownersHaveSharedLandBorder=false przy odległości ${najblizszaParaCentrow}`);
  ok(karaWspolnaGranica(cities, nodes, map, OA, OB) === false,
    'KRYTERIUM KOŃCA #1: brak granicy, obie strony >2 miasta -> karaWspolnaGranica=false');
}

// ---------------------------------------------------------------------------
// K2 — KRYTERIUM KOŃCA #2: dwie cywilizacje, >2 miasta KAŻDA, terytoria SIĘ
// STYKAJĄ (jedna para miast w odległości 11 = promień 5 + promień 5 + 1, wzorem
// n1 z trade-routes-test.cjs) -> karaWspolnaGranica = true.
// ---------------------------------------------------------------------------
{
  const OA = 110, OB = 111;
  // Miasto "graniczne" każdej strony (q=20 / q=31, odległość 11) + 2 dodatkowe
  // miasta KAŻDEJ strony ulokowane z dala od granicy (tylko podbijają licznik >2,
  // nie wpływają na adjacency).
  const citiesA = [city(0, OA), city(5, OA), city(20, OA)];
  const citiesB = [city(31, OB), city(100, OB), city(105, OB)];
  const cities = [...citiesA, ...citiesB];
  const nodes = cities.map(c => territoryNode(c.q, c.r, c.ownerId));

  ok(citiesA.length > 2 && citiesB.length > 2,
    `K2 kontrola: obie strony >2 miasta (${citiesA.length} / ${citiesB.length})`);
  ok(ownersHaveSharedLandBorder(OA, OB, nodes, map) === true,
    'K2 (kontrola prymitywu) ownersHaveSharedLandBorder=true dla pary miast q=20/q=31 (odległość 11 = 5+5+1, wzorem n1 trade-routes-test.cjs)');
  ok(karaWspolnaGranica(cities, nodes, map, OA, OB) === true,
    'KRYTERIUM KOŃCA #2: granica lądowa istnieje, obie strony >2 miasta -> karaWspolnaGranica=true');
}

// ---------------------------------------------------------------------------
// K3 — KRYTERIUM KOŃCA #3: te same, STYKAJĄCE SIĘ terytoria co K2, ale JEDNA
// strona ma TYLKO 2 miasta (nie >2) -> karaWspolnaGranica = false, mimo
// realnej granicy. Dowodzi, że próg ">2 miasta" ZOSTAŁ ZACHOWANY jako
// DODATKOWY warunek (decyzja udokumentowana w nagłówku pliku) — kara wymaga
// ZARÓWNO granicy JAK I odpowiedniej wielkości obu stron.
// ---------------------------------------------------------------------------
{
  const OA = 120, OB = 121;
  const citiesA = [city(0, OA), city(5, OA), city(20, OA)];  // 3 miasta (>2)
  const citiesB = [city(31, OB), city(100, OB)];             // 2 miasta (NIE >2)
  const cities = [...citiesA, ...citiesB];
  const nodes = cities.map(c => territoryNode(c.q, c.r, c.ownerId));

  ok(citiesA.length > 2 && citiesB.length === 2,
    `K3 kontrola: strona A >2 miasta (${citiesA.length}), strona B dokładnie 2 miasta (próg NIE spełniony)`);
  ok(ownersHaveSharedLandBorder(OA, OB, nodes, map) === true,
    'K3 (kontrola prymitywu) ownersHaveSharedLandBorder=true -- ta sama para graniczna q=20/q=31 co K2, granica REALNIE istnieje');
  ok(karaWspolnaGranica(cities, nodes, map, OA, OB) === false,
    'KRYTERIUM KOŃCA #3: granica istnieje, ale strona B ma tylko 2 miasta (próg ">2" zachowany jako dodatkowy warunek) -> karaWspolnaGranica=false');
}

console.log(`\n${pass} OK, ${fail} FAIL`);
if (fail > 0) process.exit(1);
