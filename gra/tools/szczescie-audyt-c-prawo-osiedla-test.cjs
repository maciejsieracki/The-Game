'use strict';
/**
 * szczescie-audyt-c-prawo-osiedla-test.cjs
 * Bramka tematu R-SZCZESCIE-AUDYT-C-PRAWO-I-OSIEDLA-Q1 (00-dispatch.md).
 *
 * NOWA bramka (nie rozszerzenie prawo-przebudowa-skali-test.cjs ani
 * szczescie-przebudowa-skali-test.cjs) -- uzasadnienie: żadna z dwóch istniejących bramek
 * nie ma infrastruktury siatkowego pomiaru PorPct (najgorszy spadek na +1 mieszkańca w
 * pełnej macierzy trudność x epoka x pop x warianty). Obie liczą pojedyncze, ręcznie
 * dobrane punkty kontrolne swoich tematów (D1-D7 Prawa / G1-G15 Szczęścia), nie generyczny
 * skan. Ten temat jest z natury pomiarowy (recon PRZED/PO), więc dostaje własny, dedykowany
 * harness, zamiast doklejać nieswoją funkcję do bramek historycznych tamtych tematów.
 *
 * Test importuje PRAWDZIWE moduły (esbuild na ../src/game/society-breakdown.ts) i PRAWDZIWE
 * dane (data/society-params.json) -- nie odtwarza formuł własną kopią (playbook C-046).
 *
 * Run: cd gra && node tools/szczescie-audyt-c-prawo-osiedla-test.cjs
 */

const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const esbuild = (() => {
  try { return require(path.resolve(GRA, 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[szczescie-audyt-c-prawo-osiedla-test] brak esbuild. Uruchom: npm install (z gra/)');
    process.exit(1);
  }
})();

const ENTRY = path.resolve(__dirname, '.szczescie-audyt-c-prawo-osiedla-entry.ts');
const BUNDLE = path.resolve(__dirname, '.szczescie-audyt-c-prawo-osiedla-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { evaluateOrderFromBreakdown } from '../src/game/society-breakdown';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: GRA,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[szczescie-audyt-c-prawo-osiedla-test] bundle failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE);

let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg); }
}

// ---------------------------------------------------------------------------
// Siatka pomiarowa -- ta sama metodologia co recon z 00-dispatch.md: trudność x epoka x
// pop 1-14 x warianty administracji/trybunału/sądu/garnizonu(jednostki)/garnizonu(budynek)/
// wojny. Mierzymy najgorszy spadek PorPct na PRZEJŚCIU +1 mieszkaniec (nie tylko pop 4->5).
// ---------------------------------------------------------------------------

const DIFFS = ['easy', 'normal', 'hard'];
const ERAS = [1, 2, 3];
const POPS = [];
for (let p = 1; p <= 14; p++) POPS.push(p);
const ADMIN_VARIANTS = [
  { hasDomStarszyzny: true },
  { hasDworZarzadcy: true },
  { hasPretorium: true },
  {},
];
const TRYBUNAL_VARIANTS = [true, false];
const SAD_VARIANTS = [true, false];
const GARNIZON_COUNT_VARIANTS = [0, 1, 3];
const GARNIZON_BUDYNEK_VARIANTS = [true, false];
const AT_WAR_VARIANTS = [true, false];

function loadSociety() {
  return JSON.parse(fs.readFileSync(path.resolve(GRA, 'data/society-params.json'), 'utf8'));
}

function baselineSociety() {
  // Baseline PRZED tym tematem -- wartości sprzed zmiany klucza prawo_bonus_osiedle_pop,
  // reszta danych (społeczeństwo, prawMax, szMax...) identyczna jak dziś w repo (żadna inna
  // zmiana nie jest przedmiotem tego tematu).
  const s = loadSociety();
  s.prawo.prawo_bonus_osiedle_pop = {
    easy: [32, 24, 16, 10],
    normal: [28, 20, 14, 8],
    hard: [22, 16, 10, 6],
  };
  return s;
}

function measureWorstDrop(society) {
  let worst = { drop: -Infinity };
  for (const difficulty of DIFFS) {
    for (const era of ERAS) {
      for (const admin of ADMIN_VARIANTS) {
        for (const hasTrybunal of TRYBUNAL_VARIANTS) {
          for (const hasSad of SAD_VARIANTS) {
            for (const garnizonCount of GARNIZON_COUNT_VARIANTS) {
              for (const hasGarnizonBudynek of GARNIZON_BUDYNEK_VARIANTS) {
                for (const atWar of AT_WAR_VARIANTS) {
                  let prevPor = null;
                  for (const pop of POPS) {
                    const happinessInput = {
                      difficulty, era, population: pop, buildingZadowolenie: 0, atWar,
                    };
                    const lawInput = {
                      difficulty, era, population: pop, garnizonCount, hasTrybunal, hasSad,
                      hasGarnizonBudynek, ...admin,
                    };
                    const result = M.evaluateOrderFromBreakdown(happinessInput, lawInput, society, difficulty);
                    const por = result.porPct;
                    if (prevPor !== null) {
                      const drop = prevPor - por;
                      if (drop > worst.drop) {
                        worst = {
                          drop, difficulty, era, admin, hasTrybunal, hasSad, garnizonCount,
                          hasGarnizonBudynek, atWar, popFrom: pop - 1, popTo: pop,
                          porFrom: prevPor, porTo: por,
                        };
                      }
                    }
                    prevPor = por;
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return worst;
}

/** Zero regresji na pop>=5: wzór ln-populacyjny (D4a) ma zostać stabilny 4-5 p.p. -- tu
 * mierzymy scenariusz kanoniczny (Dom Starszyzny, brak garnizonu, brak wojny) na przejściach
 * pop 6+, gdzie mechanizm pickOsiedlePopBonus już nie działa (zawsze 0 dla p>4) -- ten
 * fragment krzywej nie powinien się w ogóle ruszyć zmianą klucza osiedla. */
function measurePop5PlusStability(society) {
  let worst = { drop: -Infinity };
  for (const difficulty of DIFFS) {
    for (const era of ERAS) {
      let prevPor = null;
      for (const pop of POPS) {
        const happinessInput = { difficulty, era, population: pop, buildingZadowolenie: 0, atWar: false };
        const lawInput = { difficulty, era, population: pop, garnizonCount: 0, hasDomStarszyzny: true };
        const result = M.evaluateOrderFromBreakdown(happinessInput, lawInput, society, difficulty);
        const por = result.porPct;
        if (prevPor !== null && pop >= 6) {
          const drop = prevPor - por;
          if (drop > worst.drop) worst = { drop, difficulty, era, popFrom: pop - 1, popTo: pop };
        }
        prevPor = por;
      }
    }
  }
  return worst;
}

console.log('\n[szczescie-audyt-c-prawo-osiedla-test] Siatka PRZED/PO -- najgorszy spadek PorPct na +1 mieszkańca\n');

const baseline = baselineSociety();
const current = loadSociety();

const worstBefore = measureWorstDrop(baseline);
const worstAfter = measureWorstDrop(current);
const stabilityBefore = measurePop5PlusStability(baseline);
const stabilityAfter = measurePop5PlusStability(current);

console.log('  PRZED (baseline [32,24,16,10]/[28,20,14,8]/[22,16,10,6]): najgorszy spadek = '
  + worstBefore.drop.toFixed(1) + ' p.p. (' + worstBefore.difficulty + '/era' + worstBefore.era
  + '/pop' + worstBefore.popFrom + '->' + worstBefore.popTo + ', '
  + worstBefore.porFrom.toFixed(1) + '%->' + worstBefore.porTo.toFixed(1) + '%)');
console.log('  PO (aktualne dane): najgorszy spadek = ' + worstAfter.drop.toFixed(1) + ' p.p. ('
  + worstAfter.difficulty + '/era' + worstAfter.era + '/pop' + worstAfter.popFrom + '->'
  + worstAfter.popTo + ', ' + worstAfter.porFrom.toFixed(1) + '%->' + worstAfter.porTo.toFixed(1) + '%)');
console.log('  Redukcja: ' + (worstBefore.drop - worstAfter.drop).toFixed(1) + ' p.p. ('
  + (100 * (1 - worstAfter.drop / worstBefore.drop)).toFixed(1) + '%)');

// (1) Baseline potwierdzony liczbowo -- kotwica reconu z 00-dispatch.md (rząd wielkości,
// nie dokładna cyfra co do dziesiątej, bo recon dispatchu użył innej kombinacji wariantów
// niż ta bramka -- oba jednak lądują w tym samym paśmie ~25-30 p.p.).
ok(worstBefore.drop > 25 && worstBefore.drop < 30,
  '1: baseline (PRZED) najgorszy spadek w paśmie 25-30 p.p. (recon: 27,8 p.p.) -- zmierzono ' + worstBefore.drop.toFixed(1));

// (2) Redukcja faktyczna, mierzona -- binarne kryterium sukcesu z 00-dispatch.md.
ok(worstAfter.drop < worstBefore.drop,
  '2: PO < PRZED (redukcja najgorszego spadku) -- ' + worstAfter.drop.toFixed(1) + ' < ' + worstBefore.drop.toFixed(1));

// (3) DECISION_REQUIRED próg -- ten test NIE decyduje sam czy rezultat jest akceptowalny
// (to decyzja właściciela), ale kotwiczy ZMIERZONĄ liczbę, żeby przyszła regresja/poprawa
// była widoczna. Jeśli poniższa asercja kiedyś zaczerwienieje w dół (worstAfter < próg),
// to DOBRA wiadomość -- podnieś próg i zaktualizuj raport, nie chowaj czerwieni.
ok(worstAfter.drop < 20,
  '3: PO najgorszy spadek < 20 p.p. (zmierzono ' + worstAfter.drop.toFixed(1)
  + ' -- nadal > precedensu 6 p.p. Szczęścia, DECISION_REQUIRED zgłoszony w raporcie)');

// (4) Zero regresji na pop>=5 (D4a, wzór ln-populacyjny nietknięty -- mechanizm
// pickOsiedlePopBonus zawsze zwraca 0 dla p>4, więc te przejścia NIE powinny się zmienić
// zmianą klucza osiedla wcale).
ok(Math.abs(stabilityAfter.drop - stabilityBefore.drop) < 0.05,
  '4: zero regresji pop>=5 -- PRZED ' + stabilityBefore.drop.toFixed(2) + ' p.p., PO '
  + stabilityAfter.drop.toFixed(2) + ' p.p. (D4a nietknięty)');
ok(stabilityAfter.drop >= 1.5 && stabilityAfter.drop <= 6,
  '5: pop>=5 stabilność w oczekiwanym paśmie 1,5-6 p.p. -- zmierzono ' + stabilityAfter.drop.toFixed(2));

// (6) Kształt tablicy -- nadal malejąca pop1->4, na każdej trudności, jak przed zmianą.
const society = loadSociety();
const arr = society.prawo.prawo_bonus_osiedle_pop;
for (const diff of DIFFS) {
  const a = arr[diff];
  ok(Array.isArray(a) && a.length === 4, '6: ' + diff + ' ma tablicę długości 4');
  ok(a[0] > a[1] && a[1] > a[2] && a[2] > a[3] && a[3] > 0,
    '6: ' + diff + ' malejąca i dodatnia pop1->4 -- ' + JSON.stringify(a));
}
// (7) Proporcje między trudnościami zachowane (easy >= normal >= hard na każdym indeksie),
// jak w oryginalnej tablicy -- dispatch wymaga "zachowując proporcje... jak dziś".
for (let i = 0; i < 4; i++) {
  ok(arr.easy[i] >= arr.normal[i] && arr.normal[i] >= arr.hard[i],
    '7: idx ' + i + ' easy(' + arr.easy[i] + ') >= normal(' + arr.normal[i] + ') >= hard(' + arr.hard[i] + ')');
}

console.log('\n[szczescie-audyt-c-prawo-osiedla-test] ' + passed + ' OK, ' + failed + ' FAIL\n');
process.exit(failed > 0 ? 1 : 0);
