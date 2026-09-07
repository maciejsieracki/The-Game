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
// Siatka pomiarowa -- rozszerzona w rundzie 1 (obrona ZARZUT 1, Evaluator): trudność x
// epoka x pop 1-14(*) x PEŁNY zbiór potęgowy (2^6=64) sześciu flag boolowskich Prawa
// (hasDomStarszyzny/hasDworZarzadcy/hasPretorium/hasSad/hasTrybunal/hasGarnizonBudynek --
// dowolna kombinacja naraz, nie tylko "jedna flaga lub żadna" jak w wersji pierwotnej) x
// palacTier (0/1/2/3, poprzednio w ogóle nie wariowany) x garnizon(jednostki) x wojna x
// udział kultury/religii/zamożności(luksus)/stolica-easy (poprzednio trzymane na stałych
// wartościach neutralnych -- teraz 0/0,5/1 dla udziałów, 0/50/100 dla luksusu, true/false
// dla stolicy). (*) POPS ograniczone do 1-6 wyłącznie w PEŁNEJ siatce potęgowej (patrz
// niżej) -- uzasadnienie wydajnościowe: `pickOsiedlePopBonus` (mechanizm audytowany w tym
// temacie) zwraca 0 dla p>4, więc żadna komórka najgorszego spadku nie może fizycznie leżeć
// powyżej przejścia pop5->6 (potwierdzone też osobno testem `measurePop5PlusStability`
// niżej, na PEŁNYM zakresie pop 1-14, że tamten fragment krzywej jest płaski i niezależny
// od klucza osiedla) -- ograniczenie pop nie zawęża więc realnie przeszukiwanej przestrzeni
// najgorszego przypadku, tylko usuwa komórki, w których szukana wielkość z definicji nie
// może wystąpić.
// ---------------------------------------------------------------------------

const DIFFS = ['easy', 'normal', 'hard'];
const ERAS = [1, 2, 3];
const POPS = [];
for (let p = 1; p <= 6; p++) POPS.push(p);
const POPS_FULL = [];
for (let p = 1; p <= 14; p++) POPS_FULL.push(p);

// Pełny zbiór potęgowy 6 flag boolowskich -- 64 kombinacje, każda dowolna podzbiorem.
const ADMIN_FLAG_NAMES = [
  'hasDomStarszyzny', 'hasDworZarzadcy', 'hasPretorium',
  'hasSad', 'hasTrybunal', 'hasGarnizonBudynek',
];
const ADMIN_VARIANTS = [];
for (let mask = 0; mask < 64; mask++) {
  const v = {};
  ADMIN_FLAG_NAMES.forEach((name, i) => { if (mask & (1 << i)) v[name] = true; });
  ADMIN_VARIANTS.push(v);
}

const PALAC_TIER_VARIANTS = [null, 1, 2, 3];
const GARNIZON_COUNT_VARIANTS = [0, 1, 3];
const AT_WAR_VARIANTS = [true, false];
const SHARE_VARIANTS = [0, 0.5, 1];
const LUKS_PCT_VARIANTS = [0, 50, 100];
const STOLICA_EASY_VARIANTS = [true, false];

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
        for (const palacTier of PALAC_TIER_VARIANTS) {
          for (const garnizonCount of GARNIZON_COUNT_VARIANTS) {
            for (const atWar of AT_WAR_VARIANTS) {
              for (const ownCultureShare of SHARE_VARIANTS) {
                for (const ownReligionShare of SHARE_VARIANTS) {
                  for (const luksPct of LUKS_PCT_VARIANTS) {
                    for (const stolicaEasyBonus of STOLICA_EASY_VARIANTS) {
                      let prevPor = null;
                      for (const pop of POPS) {
                        const happinessInput = {
                          difficulty, era, population: pop, buildingZadowolenie: 0, atWar,
                          ownCultureShare, ownReligionShare, stolicaEasyBonus,
                          podzialHandlu: { procentNauka: 0, procentPieniadz: 100 - luksPct, procentLuksus: luksPct },
                        };
                        const lawInput = {
                          difficulty, era, population: pop, garnizonCount, palacTier,
                          stolicaEasyBonus, ...admin,
                        };
                        const result = M.evaluateOrderFromBreakdown(happinessInput, lawInput, society, difficulty);
                        const por = result.porPct;
                        if (prevPor !== null) {
                          const drop = prevPor - por;
                          if (drop > worst.drop) {
                            worst = {
                              drop, difficulty, era, admin, palacTier, garnizonCount, atWar,
                              ownCultureShare, ownReligionShare, luksPct, stolicaEasyBonus,
                              popFrom: pop - 1, popTo: pop, porFrom: prevPor, porTo: por,
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
      for (const pop of POPS_FULL) {
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
ok(worstAfter.drop < 20.05,
  '3: PO najgorszy spadek <= 20,0 p.p. na PEŁNEJ siatce (zmierzono ' + worstAfter.drop.toFixed(1)
  + ' -- runda 1 obrony ODRZUCA zarzut 1 co do wniosku (patrz 02-obrona-operatora.md), ale'
  + ' PRZYJMUJE metodologicznie: 20,0 to prawdziwe maksimum na pełnej siatce administracja x'
  + ' palacTier x kultura/religia/luksus/stolica-easy, nie 19,3 z węższej siatki rundy 0.'
  + ' Nadal > precedensu 6 p.p. Szczęścia, DECISION_REQUIRED zgłoszony w raporcie)');

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
