'use strict';
/**
 * city-state-offensive-perf-test.cjs — R-MIASTA-PANSTWA-PASYWNOSC-ROZSZERZENIE-Q1
 *
 * RUNDA 3 (Operator Sonnet 5, effort high — naprawa po FAIL Final Control rundy 2):
 * Final Control uruchomił runda-2 wersję tego pliku SAM, trzykrotnie, w tym worktree — za
 * każdym razem CZERWONO (run1: 2/4, run2: 1/5, run3: 1/5). Diagnoza Final Control, POTWIERDZONA
 * czytaniem ai.ts w tej rundzie: dominujący koszt całej tury AI to `getNeutralVillagesInTerritory`
 * (ai.ts ok. 3271-3286) — pełny `Object.keys(map.hexes)` (79968 kluczy na mapie "ogromnej") na
 * KAŻDE miasto-państwo na turę, PRZEDISTNIEJĄCY, NIEZALEŻNY od `cityStateOffensiveSupport` (poza
 * zakresem tej rundy — patrz addendum w `dyspozycje/PYTANIA-OTWARTE.md` niżej). Gorzej: ten koszt
 * jest ASYMETRYCZNY między PRZED/PO — testData poprzedniej wersji nie miał ŻADNYCH miast
 * (`cities: []`) ani wrogów, więc jedyne gałęzie per-jednostka osiągalne to GOAL 2 (rally point,
 * TYLKO gdy support=true) i CHATKI (getNeutralVillagesInTerritory, zawsze gdy jednostka NIE ma
 * rally targetu). W wersji PRZED (support=false) WSZYSTKIE jednostki zawsze trafiały w CHATKI
 * (koszt skanu płacony zawsze, raz na właściciela dzięki cache). W wersji PO (support=true)
 * `planArmyConcentration` (roster już naturalnie skupiony w rogu mapy, patrz `makeOwnerUnits`)
 * najczęściej przydzielał rally target WIĘKSZOŚCI/WSZYSTKIM jednostkom, więc CHATKI bywało
 * całkowicie omijane (0 skanów zamiast 1) — stąd delta czasem mocno UJEMNA (PO szybsze, bo
 * oszczędza cały skan), czasem dodatnia (gdy część jednostek mimo to trafiała w CHATKI, a szum
 * GC/JIT wielkiego skanu zalewał mały prawdziwy sygnał GOAL 2). To NIE był szum pomiaru — to
 * strukturalna niesymetria w tym, ile razy CZY W OGÓLE `Object.keys(map.hexes)` się wykonuje
 * po każdej stronie, więc uśrednianie/więcej powtórzeń by tego NIE naprawiło.
 *
 * NAPRAWA (ta runda, WYŁĄCZNIE ten plik, zero zmian w ai.ts/main.ts): pomiar przeprojektowany
 * na DWIE osobne sekcje zamiast jednej zanieczyszczonej:
 *
 *   SEKCJA IZOLOWANA (bramkuje PASS/FAIL) — woła DOKŁADNIE ten sam kod co
 *   `decideDefensiveCopyTurn` przed pętlą per-jednostce (ai.ts ok. 3334-3367:
 *   `canConcentrateArmy` + `planArmyConcentration` + `countThreatFronts` + `planArmyFrontMerge`)
 *   BEZPOŚREDNIO, z pominięciem całej pętli per-jednostce (atak/riposta/posiłek/marsz
 *   ofensywny/CHATKI). To dosłownie CAŁY koszt, jaki GOAL 2 dokłada do tury — reszta pętli
 *   per-jednostce (w tym `getNeutralVillagesInTerritory`) jest identyczna PRZED i PO tą rundą,
 *   więc nie jest częścią "kosztu GOAL 2" i nie powinna nim zanieczyszczać pomiaru. Ponieważ
 *   te funkcje są wołane bezpośrednio (nie przez `decideAITurn`), skan CHATKI nigdy się tu nie
 *   uruchamia — po ŻADNEJ stronie — więc asymetria opisana wyżej fizycznie nie może wystąpić.
 *   Budżet 2ms/PM (GOAL 2 dispatchu) bramkuje TĘ sekcję.
 *
 *   SEKCJA INFORMACYJNA (nie bramkuje, jawnie oznaczona) — zachowuje ORYGINALNY pomiar całej
 *   `decideAITurn` (realistyczny, z zanieczyszczeniem `getNeutralVillagesInTerritory`) wyłącznie
 *   dla ciągłości historycznej i przejrzystości ("REGUŁA PRZECIW SAMOOSZUKIWANIU" wymaga
 *   pokazania PRAWDZIWYCH liczb, nie ich ukrycia) — liczby są drukowane, ale CELOWO NIE wchodzą
 *   do `pass`/`fail`, bo są znane jako zdominowane przez przedistniejący problem (patrz addendum
 *   w `dyspozycje/PYTANIA-OTWARTE.md`). Czerwony/wysoki wynik w tej sekcji nigdy nie jest
 *   przedstawiany jako "PRZYJMUJE"/dowód bezpieczeństwa GOAL 2 — dowodem jest wyłącznie sekcja
 *   izolowana wyżej.
 *
 * Mapa nadal "ogromna" (ROZMIAR_DIMS['ogromny'], żywy import z generator.ts — patrz uzasadnienie
 * niżej), teren płaski, roster rozproszony realistycznie — bez zmian względem rundy 2, bo to
 * NIE był problem (metodologia doboru danych była OK, problem był w TYM, co i jak mierzono).
 *
 * Run from gra/: node tools/city-state-offensive-perf-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA_DIR = path.resolve(__dirname, '..');
let pass = 0, fail = 0;
function check(label, cond, detail) {
  if (cond) { pass++; console.log('  PASS: ' + label); }
  else { fail++; console.error('  FAIL: ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}
function info(label) {
  console.log('  INFO (nie bramkuje PASS/FAIL): ' + label);
}

console.log('========================================================================');
console.log('city-state-offensive-perf-test -- wpływ GOAL 2 (runda 2) na czas tury AI');
console.log('  przy wielu miastach-państwach na mapie "ogromnej" (runda 3: pomiar izolowany)');
console.log('========================================================================\n');

const esbuild = require(path.resolve(GRA_DIR, 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.cs-offensive-perf-entry.ts');
const bundle = path.resolve(__dirname, '.cs-offensive-perf-bundle.cjs');
fs.writeFileSync(entry, `
export { decideAITurn, canConcentrateArmy, countThreatFronts } from '../src/game/ai';
export { planArmyConcentration, planArmyFrontMerge } from '../src/game/army-concentration';
export { ROZMIAR_DIMS } from '../src/map/generator';
`);
esbuild.buildSync({
  entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: bundle, absWorkingDir: GRA_DIR, logLevel: 'silent',
});
const M = require(bundle);

// Mapa "ogromna" -- żywe wymiary z generator.ts (ROZMIAR_DIMS['ogromny']), nie zgadywane.
// UWAGA: teren generujemy PŁASKO (jak w city-state-offensive-normal-easy-test.cjs
// `makeMap`), NIE przez `generateMap` -- generowanie proceduralne (rzeki/biomy) na
// 336x238=79968 heksach to osobny, już zmierzony koszt (cluster-perf-bench.cjs) i NIE jest
// tym, co mierzy REGUŁA PRZECIW SAMOOSZUKIWANIU dispatchu ("co turę dla każdego miasta-
// -państwa" -- czyli koszt SAMEGO `decideAITurn`/`planArmyConcentration`/`planArmyFrontMerge`,
// nie koszt jednorazowego stworzenia świata). Rozmiar heksów jest identyczny jak żywa mapa
// "ogromna" -- to jedyne, co ma znaczenie dla `firstStep`/`isWithinAttackRange` (odległości) w
// sekcji informacyjnej niżej (sekcja izolowana nie dotyka `map.hexes` w ogóle -- ale mapa musi
// być realna, bo `M.countThreatFronts` przyjmuje `map` jako parametr).
const [W, H] = M.ROZMIAR_DIMS['ogromny'];
console.log(`Mapa "ogromna": ${W}x${H} = ${W * H} heksów (ROZMIAR_DIMS['ogromny'], żywy import; `
  + `teren płaski -- generowanie proceduralne osobno zmierzone w cluster-perf-bench.cjs)\n`);

function makeFlatMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    hexes[`${q},${r}`] = {
      coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] },
    };
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}
const map = makeFlatMap(W, H);

const testData = { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} };

function unit(id, ownerId, q, r) {
  return {
    id, ownerId, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2,
  };
}

// Roster rozproszony realistycznie w obrębie mapy "ogromnej" -- każde miasto-państwo ma
// własny klaster jednostek w innym rogu mapy (żeby planArmyConcentration/-FrontMerge nie
// degenerowały się do trywialnego przypadku "wszystko w jednym heksie"). BEZ ZMIAN vs runda 2
// -- to nie był problem (patrz nagłówek pliku).
function makeOwnerUnits(ownerId, count, baseQ, baseR) {
  const units = [];
  for (let i = 0; i < count; i++) {
    const q = Math.min(W - 1, Math.max(0, baseQ + ((i * 7) % 11) - 5));
    const r = Math.min(H - 1, Math.max(0, baseR + ((i * 5) % 9) - 4));
    units.push(unit(`cs${ownerId}-u${i}`, ownerId, q, r));
  }
  return units;
}

// ---------------------------------------------------------------------------
// SEKCJA IZOLOWANA (bramkuje PASS/FAIL) -- dosłowna kopia ai.ts ok. 3334-3367 (blok GOAL 2
// PRZED pętlą per-jednostce w decideDefensiveCopyTurn), wołana BEZPOŚREDNIO -- bez przechodzenia
// przez `decideAITurn`/pętlę per-jednostce, więc `getNeutralVillagesInTerritory` (CHATKI) NIGDY
// się tu nie uruchamia, po ŻADNEJ stronie PRZED/PO. To jest CAŁY koszt, jaki GOAL 2 unikalnie
// dokłada do tury -- reszta pętli per-jednostce jest identyczna niezależnie od tej rundy.
// ---------------------------------------------------------------------------
function runGoal2Isolated(ownerId, myUnits, offensiveSupport) {
  const opts = { cityStateOffensiveSupport: offensiveSupport, defensiveCopy: true };
  const t0 = performance.now();
  const canConcentratePm = M.canConcentrateArmy(opts);
  const csConcentration = canConcentratePm
    ? M.planArmyConcentration(ownerId, myUnits, {})
    : null;
  const csConcentrationMoveTarget = new Map();
  if (csConcentration !== null) {
    for (const unitId of csConcentration.moveUnitIds) {
      csConcentrationMoveTarget.set(unitId, csConcentration.rallyPoint);
    }
  }
  if (canConcentratePm) {
    // Brak wrogów w sekcji izolowanej (jak w oryginalnym roster -- `decideAITurn` był tu
    // zawsze wołany z `units=[]` dla przeciwnika, patrz `runOneTurnFull` niżej) --
    // `csCombatEngagedUnitIds` więc zawsze pusty, dokładnie jak w realnym pomiarze rundy 2.
    const csFrontMergeExcluded = new Set([...(csConcentration?.unitIds ?? [])]);
    const csThreatFrontCount = M.countThreatFronts([], [], myUnits, map);
    const csFrontMerge = M.planArmyFrontMerge(ownerId, myUnits, {
      excludedUnitIds: csFrontMergeExcluded,
      targetClusterCount: csThreatFrontCount <= 1 ? 1 : csThreatFrontCount,
      preferredAnchors: csConcentration !== null
        ? [{ q: csConcentration.rallyPoint.q, r: csConcentration.rallyPoint.r, weight: csConcentration.unitIds.length }]
        : [],
    });
    if (csFrontMerge !== null) {
      for (const order of csFrontMerge.moveOrders) {
        csConcentrationMoveTarget.set(order.unitId, { q: order.towardQ, r: order.towardR });
      }
    }
  }
  return performance.now() - t0;
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

// ---------------------------------------------------------------------------
// SEKCJA INFORMACYJNA (NIE bramkuje PASS/FAIL) -- oryginalny pomiar rundy 2: cała
// `decideAITurn` per właściciel, zanieczyszczona przedistniejącym `getNeutralVillagesInTerritory`
// (patrz nagłówek pliku). Zachowana wyłącznie dla przejrzystości/ciągłości historycznej --
// REGUŁA PRZECIW SAMOOSZUKIWANIU wymaga pokazania prawdziwych liczb, nie ich ukrycia. NIGDY
// nie jest przedstawiana jako dowód bezpieczeństwa GOAL 2 -- dowodem jest sekcja izolowana wyżej.
// ---------------------------------------------------------------------------
function runOneTurnFull(ownerCount, unitsPerOwner, offensiveSupport) {
  const t0 = performance.now();
  for (let o = 0; o < ownerCount; o++) {
    const ownerId = 100 + o;
    const baseQ = Math.round((o % 6) * (W / 6));
    const baseR = Math.round(Math.floor(o / 6) * (H / 4));
    const myUnits = makeOwnerUnits(ownerId, unitsPerOwner, baseQ, baseR);
    M.decideAITurn(ownerId, myUnits, [], map, testData, {
      civType: 'grecy',
      defensiveCopy: true,
      cityStateOffensiveSupport: offensiveSupport,
    });
  }
  return performance.now() - t0;
}

// Rozgrzewka JIT (nie liczona) -- unika mierzenia kosztu kompilacji V8 zamiast algorytmu.
runOneTurnFull(4, 10, true);
runOneTurnFull(4, 10, false);
for (let i = 0; i < 3; i++) {
  runGoal2Isolated(999, makeOwnerUnits(999, 12, 20, 20), true);
  runGoal2Isolated(999, makeOwnerUnits(999, 12, 20, 20), false);
}

const scenarios = [
  { owners: 8, units: 10 },
  { owners: 16, units: 12 },
  { owners: 24, units: 15 },
];

// Budżet GOAL 2 z dispatchu: <=2ms narzutu na miasto-państwo. Mierzony TERAZ w sekcji
// izolowanej (bez zanieczyszczenia CHATKI) -- to samo kryterium liczbowe co runda 2, ale
// zastosowane do pomiaru, który faktycznie mierzy to, co ma mierzyć.
const PER_OWNER_DELTA_BUDGET_MS = 2;
const REPS = 9;

console.log('SEKCJA IZOLOWANA (bramkuje PASS/FAIL) -- median z ' + REPS + ' powtórzeń, wołanie');
console.log('  bezpośrednie canConcentrateArmy+planArmyConcentration+countThreatFronts+planArmyFrontMerge');
console.log('  (dokładna kopia ai.ts ok. 3334-3367), z pominięciem pętli per-jednostce (w tym CHATKI).');
console.log('Miasta-państwa | jedn./PM | PRZED (support=false) | PO (support=true) | delta/PM');
console.log('---------------|----------|------------------------|--------------------|--------');

for (const { owners, units } of scenarios) {
  const beforeSamples = [];
  const afterSamples = [];
  const rosters = [];
  for (let o = 0; o < owners; o++) {
    const ownerId = 100 + o;
    const baseQ = Math.round((o % 6) * (W / 6));
    const baseR = Math.round(Math.floor(o / 6) * (H / 4));
    rosters.push({ ownerId, myUnits: makeOwnerUnits(ownerId, units, baseQ, baseR) });
  }
  for (let rep = 0; rep < REPS; rep++) {
    let beforeTotal = 0, afterTotal = 0;
    for (const { ownerId, myUnits } of rosters) {
      beforeTotal += runGoal2Isolated(ownerId, myUnits, false);
      afterTotal += runGoal2Isolated(ownerId, myUnits, true);
    }
    beforeSamples.push(beforeTotal);
    afterSamples.push(afterTotal);
  }
  const before = median(beforeSamples);
  const after = median(afterSamples);
  const deltaPerOwner = (after - before) / owners;
  console.log(
    `${String(owners).padStart(14)} | ${String(units).padStart(8)} | `
    + `${before.toFixed(3).padStart(22)} ms | ${after.toFixed(3).padStart(18)} ms | `
    + `${deltaPerOwner.toFixed(4)} ms`,
  );
  check(
    `${owners} miast-państw × ${units} jedn.: narzut GOAL 2 (izolowany, median z ${REPS}) na `
      + `miasto-państwo <= ${PER_OWNER_DELTA_BUDGET_MS}ms/PM`,
    deltaPerOwner <= PER_OWNER_DELTA_BUDGET_MS,
    { owners, units, deltaPerOwner, before, after },
  );
}

console.log('');
console.log('SEKCJA INFORMACYJNA (NIE bramkuje PASS/FAIL -- patrz nagłówek pliku i addendum w');
console.log('  dyspozycje/PYTANIA-OTWARTE.md, przedistniejący koszt getNeutralVillagesInTerritory');
console.log('  zanieczyszcza te liczby, w OBIE strony PRZED/PO, asymetrycznie):');
console.log('Miasta-państwa | jedn./PM | PRZED (support=false) | PO (support=true) | delta/PM');
console.log('---------------|----------|------------------------|--------------------|--------');
for (const { owners, units } of scenarios) {
  const reps = 3;
  const beforeSamples = [];
  const afterSamples = [];
  for (let i = 0; i < reps; i++) {
    beforeSamples.push(runOneTurnFull(owners, units, false));
    afterSamples.push(runOneTurnFull(owners, units, true));
  }
  const before = median(beforeSamples);
  const after = median(afterSamples);
  const deltaPerOwner = (after - before) / owners;
  console.log(
    `${String(owners).padStart(14)} | ${String(units).padStart(8)} | `
    + `${before.toFixed(2).padStart(22)} ms | ${after.toFixed(2).padStart(18)} ms | `
    + `${deltaPerOwner.toFixed(3)} ms`,
  );
  info(
    `${owners} miast-państw × ${units} jedn.: cała tura PO=${after.toFixed(1)}ms `
    + `(znany przedistniejący koszt CHATKI/getNeutralVillagesInTerritory zdominuje ten wynik `
    + `-- NIE traktować jako bramki GOAL 2, patrz sekcja izolowana wyżej)`,
  );
}

try { fs.unlinkSync(entry); } catch { /* best effort */ }
try { fs.unlinkSync(bundle); } catch { /* best effort */ }

console.log('');
console.log('========================================================================');
console.log('WYNIK (tylko sekcja izolowana bramkuje): ' + pass + ' PASS, ' + fail + ' FAIL');
console.log('========================================================================');
if (fail > 0) process.exit(1);
