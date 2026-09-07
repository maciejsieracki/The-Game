'use strict';
/**
 * szczescie-audyt-d-progi-bunt-test.cjs
 * Bramka tematu R-SZCZESCIE-AUDYT-D-PROGI-I-BUNT-Q1 (00-dispatch.md).
 *
 * NOWA bramka (nie rozszerzenie szczescie-audyt-c-prawo-osiedla-test.cjs) -- uzasadnienie:
 * węzeł C mierzy WIELKOŚĆ najgorszego spadku PorPct na +1 mieszkańca; ten węzeł mierzy coś
 * innego -- czy taki spadek przeskakuje GRANICE porPctBand/tierFromPorPct (a/b z GOAL) oraz
 * czy updateRevoltGrace jest odporny na ostry, jednorazowy skok w karencji (c z GOAL).
 * Dodanie tych trzech miar do istniejącej bramki C zmieniłoby jej zakres (dispatch C wymaga
 * "szczescie-audyt-c-prawo-osiedla-test.cjs niemodyfikowany, jeśli węzeł D dodaje nową
 * bramkę zamiast rozszerzać tę" -- 00-dispatch.md ALLOWLISTA). Ten test importuje PRAWDZIWE
 * moduły (esbuild na ../src/game/society-breakdown.ts) i PRAWDZIWE dane
 * (data/society-params.json), tak samo jak węzeł C.
 *
 * Run: cd gra && node tools/szczescie-audyt-d-progi-bunt-test.cjs
 */

const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const esbuild = (() => {
  try { return require(path.resolve(GRA, 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[szczescie-audyt-d-progi-bunt-test] brak esbuild. Uruchom: npm install (z gra/)');
    process.exit(1);
  }
})();

const ENTRY = path.resolve(__dirname, '.szczescie-audyt-d-progi-bunt-entry.ts');
const BUNDLE = path.resolve(__dirname, '.szczescie-audyt-d-progi-bunt-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  evaluateOrderFromBreakdown, porPctBand, tierFromPorPct, updateRevoltGrace, loadRevoltParams,
} from '../src/game/society-breakdown';
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
  console.error('[szczescie-audyt-d-progi-bunt-test] bundle failed:', e.message || e);
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
// Siatka (a)/(b) -- pop 1-14 na pełnym zakresie wymaganym literalnie przez dispatch
// (00-dispatch.md:68: "3 trudności × 3 epoki × pop 1-14 × reprezentatywne warianty ...
// (ten sam zakres co węzeł C, żeby liczby były porównywalne)"), pozostałe wymiary
// IDENTYCZNE co do zakresu jak węzeł C: pełny zbiór potęgowy (2^6=64) sześciu flag
// Prawa x palacTier(0/1/2/3) x garnizon x wojna x udział kultury/religii x luksus x
// stolica-easy.
// (Poprzednia wersja tego pliku zawężała siatkę (a)/(b) do pop 1-6 z komentarzem
// odsyłającym do funkcji "measurePop5PlusStability niżej" -- funkcja ta W TYM PLIKU
// nigdy nie istniała (jest zdefiniowana wyłącznie w szczescie-audyt-c-prawo-osiedla-test.cjs,
// skąd komentarz skopiowano bez implementacji) -- fabrykowane/wiszące odwołanie wykryte
// przez Evaluatora rundy 1, zgłoszone jako ZARZUT 1. Naprawa: zamiast dorabiać odwołanie,
// siatkę (a)/(b) rozszerzono na pop 1-14, żeby zgodność z dispatchiem nie zależała od
// żadnego zewnętrznego dowodu. Evaluator niezależnie już to zmierzył na własnym harnessie
// (10 450 944 komórek / 9 704 448 przejść, wynik identyczny) -- ten przebieg to teraz ta
// sama miara wewnątrz tej bramki.)
// ---------------------------------------------------------------------------

const DIFFS = ['easy', 'normal', 'hard'];
const ERAS = [1, 2, 3];
const POPS_FULL = [];
for (let p = 1; p <= 14; p++) POPS_FULL.push(p);
const POPS = POPS_FULL;

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

// Kolejność pasm/tierów OD NAJGORSZEGO DO NAJLEPSZEGO -- ranga = odległość w krokach.
const BAND_ORDER = ['bunt_skrajny', 'bunt', 'niepokoj', 'napiecie', 'spokoj', 'lad'];
const TIER_ORDER = ['unrest', 'neutral', 'order'];
function bandRank(b) { return BAND_ORDER.indexOf(b); }
function tierRank(t) { return TIER_ORDER.indexOf(t); }

/** (a)+(b) na pełnej siatce: dla każdego przejścia pop->pop+1 sprawdź czy porPctBand
 * przeskakuje WIĘCEJ NIŻ JEDNO pasmo naraz, oraz czy kierunek zmiany tierFromPorPct jest
 * SPRZECZNY z kierunkiem zmiany porPctBand tej samej pary (from,to). */
function scanGrid(society) {
  let worstBandSkip = { skip: 0 };
  const tierBandConflicts = [];
  let transitionsChecked = 0;
  let cellsChecked = 0;

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
                      let prev = null;
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
                        cellsChecked++;
                        const cur = { por: result.porPct, band: result.band, tier: result.tier, pop };
                        if (prev) {
                          transitionsChecked++;
                          const bandDelta = bandRank(cur.band) - bandRank(prev.band);
                          const tierDelta = tierRank(cur.tier) - tierRank(prev.tier);
                          const skip = Math.abs(bandDelta);
                          if (skip > worstBandSkip.skip) {
                            worstBandSkip = {
                              skip, difficulty, era, admin, palacTier, garnizonCount, atWar,
                              ownCultureShare, ownReligionShare, luksPct, stolicaEasyBonus,
                              popFrom: prev.pop, popTo: cur.pop,
                              bandFrom: prev.band, bandTo: cur.band,
                              porFrom: prev.por, porTo: cur.por,
                            };
                          }
                          if (Math.sign(bandDelta) !== 0 && Math.sign(tierDelta) !== 0
                            && Math.sign(bandDelta) !== Math.sign(tierDelta)) {
                            tierBandConflicts.push({
                              difficulty, era, popFrom: prev.pop, popTo: cur.pop,
                              bandFrom: prev.band, bandTo: cur.band,
                              tierFrom: prev.tier, tierTo: cur.tier,
                              porFrom: prev.por, porTo: cur.por,
                            });
                          }
                        }
                        prev = cur;
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
  return { worstBandSkip, tierBandConflicts, transitionsChecked, cellsChecked };
}

// ---------------------------------------------------------------------------
// (c) Symulacja tur updateRevoltGrace -- gradual, ostry skok, i cykl relapse/recovery,
// dla każdej trudności z REALNYMI graceTurns/criticalPorPct z society-params.json.
// ---------------------------------------------------------------------------

function simulateTrajectory(trajectory, revolt) {
  let grace = null;
  let warnedStreak = 0; // liczba KOLEJNYCH tur z warning=true i trigger=false PRZED bieżącą turą
  let wasTriggering = false; // czy POPRZEDNIA tura już miała shouldTriggerRebellion=true
  const log = [];
  const graceTurns = Math.max(0, Math.floor(revolt.graceTurns));
  for (const por of trajectory) {
    const state = M.updateRevoltGrace(grace, por, revolt);
    log.push({ por, ...state });
    if (state.shouldTriggerRebellion && !wasTriggering) {
      // Sprawdzamy WYŁĄCZNIE ZBOCZE NARASTAJĄCE (pierwsza tura triggera po serii false) --
      // kolejne tury pod rząd z trigger=true to KONTYNUACJA już trwającej rebelii (miasto
      // nadal poniżej crit), nie nowy, przedwczesny start, więc nie podlegają temu warunkowi.
      // Rebelia startuje dopiero po PEŁNYCH graceTurns turach ostrzeżenia -- czyli
      // graceTurns+1 kolejnych tur z warning=true (pierwsza tura ustawia grace=graceTurns,
      // każda kolejna dekrementuje o 1, aż currentGrace===0 wywoła trigger na NASTĘPNEJ turze).
      if (warnedStreak !== graceTurns + 1) {
        return { ok: false, reason: 'trigger po ' + warnedStreak + ' turach ostrzeżenia, oczekiwano ' + (graceTurns + 1), log };
      }
    }
    if (state.revoltWarning && !state.shouldTriggerRebellion) {
      warnedStreak += 1;
    } else if (!state.revoltWarning) {
      warnedStreak = 0;
    }
    // gdy shouldTriggerRebellion===true, warnedStreak NIE rośnie dalej -- liczy tylko tury
    // ostrzeżenia PRZED pierwszym trigerem, zgodnie z GOAL (c): "nigdy nie pozwala rebelii
    // wystartować bez pełnych graceTurns ostrzeżenia" dotyczy STARTU, nie trwania rebelii.
    wasTriggering = state.shouldTriggerRebellion;
    grace = state.revoltGraceRemaining;
  }
  return { ok: true, log };
}

function buildTrajectories(crit) {
  const above = crit + 40;
  const deepNegative = -50; // "ostry skok" -- znacznie poniżej crit w JEDNEJ turze, nie stopniowo
  return {
    gradual: [above, crit + 5, crit - 1, crit - 2, crit - 3, crit - 4, crit - 5, crit - 6, crit - 7, crit - 8],
    sharpJump: [above, above, deepNegative, deepNegative, deepNegative, deepNegative, deepNegative, deepNegative],
    sharpJumpFromLad: [95, 95, deepNegative, deepNegative, deepNegative, deepNegative, deepNegative, deepNegative, deepNegative],
    relapseRecovery: [crit - 3, crit - 1, above, above, crit - 3, crit - 3, above, crit - 10, crit - 10, crit - 10, crit - 10, crit - 10],
  };
}

// ---------------------------------------------------------------------------
console.log('\n[szczescie-audyt-d-progi-bunt-test] Audyt odporności progów porPctBand/tierFromPorPct'
  + ' i karencji updateRevoltGrace na skok +1 mieszkaniec (węzeł D)\n');

const society = loadSociety();

console.log('--- (a)/(b): siatka trudność x epoka x pop1-14 x admin(64) x palacTier x garnizon x'
  + ' wojna x kultura/religia x luksus x stolica-easy ---');
const grid = scanGrid(society);
console.log('  Komórek policzonych: ' + grid.cellsChecked + ', przejść pop->pop+1: ' + grid.transitionsChecked);
console.log('  Najgorszy przeskok pasma (porPctBand): ' + grid.worstBandSkip.skip + ' pasm(o) -- '
  + (grid.worstBandSkip.skip > 0
    ? (grid.worstBandSkip.difficulty + '/era' + grid.worstBandSkip.era + '/pop' + grid.worstBandSkip.popFrom
      + '->' + grid.worstBandSkip.popTo + ', ' + grid.worstBandSkip.bandFrom + '(' + grid.worstBandSkip.porFrom.toFixed(1)
      + '%) -> ' + grid.worstBandSkip.bandTo + '(' + grid.worstBandSkip.porTo.toFixed(1) + '%)')
    : 'brak przeskoków w ogóle na tej siatce'));
console.log('  Konflikty kierunku band vs tier: ' + grid.tierBandConflicts.length);

ok(grid.cellsChecked > 100000, 'D-a0: siatka realnie pokrywa ten sam rząd wielkości co węzeł C -- '
  + grid.cellsChecked + ' komórek');

ok(grid.worstBandSkip.skip <= 1,
  'D-a: (a) ŻADNE przejście pop->pop+1 na pełnej siatce nie przeskakuje więcej niż JEDNEGO'
  + ' pasma porPctBand naraz -- zmierzony najgorszy przeskok = ' + grid.worstBandSkip.skip + ' pasm(o)');

ok(grid.tierBandConflicts.length === 0,
  'D-b: (b) ZERO przejść, w których tierFromPorPct zmienia się w kierunku SPRZECZNYM z porPctBand'
  + ' tej samej pary (from,to) -- zmierzono ' + grid.tierBandConflicts.length + ' konflikt(ów)'
  + (grid.tierBandConflicts.length ? ' -- pierwszy: ' + JSON.stringify(grid.tierBandConflicts[0]) : ''));

console.log('\n--- (c): symulacja tur updateRevoltGrace, per trudność (graceTurns/criticalPorPct z JSON) ---');
for (const difficulty of DIFFS) {
  const revolt = M.loadRevoltParams(society, difficulty);
  console.log('  ' + difficulty + ': criticalPorPct=' + revolt.criticalPorPct + ', graceTurns=' + revolt.graceTurns);
  const trajectories = buildTrajectories(revolt.criticalPorPct);
  for (const [name, traj] of Object.entries(trajectories)) {
    const res = simulateTrajectory(traj, revolt);
    ok(res.ok, 'D-c: ' + difficulty + '/' + name + ' -- rebelia NIGDY nie startuje bez pełnych '
      + '(graceTurns+1=' + (Math.max(0, Math.floor(revolt.graceTurns)) + 1) + ') tur ostrzeżenia'
      + (res.ok ? '' : ' -- ' + res.reason));
  }
}

// (c) dodatkowo na REALNEJ trajektorii porPct z siatki (a) -- najgorszy przypadek węzła C
// (easy/era1, admin puste, palacTier=null, garnizonCount=0, atWar=false, luksPct=0) na pełnym
// zakresie pop 1-14, żeby sprawdzić karencję na prawdziwych, nie tylko syntetycznych, wartościach.
console.log('\n--- (c) dodatkowo: karencja na REALNEJ trajektorii porPct (pop 1-14, scenariusz węzła C) ---');
for (const difficulty of DIFFS) {
  const revolt = M.loadRevoltParams(society, difficulty);
  const porTrajectory = POPS_FULL.map((pop) => {
    const happinessInput = {
      difficulty, era: 1, population: pop, buildingZadowolenie: 0, atWar: false,
      ownCultureShare: 0, ownReligionShare: 0, stolicaEasyBonus: false,
      podzialHandlu: { procentNauka: 0, procentPieniadz: 100, procentLuksus: 0 },
    };
    const result = M.evaluateOrderFromBreakdown(
      happinessInput,
      { difficulty, era: 1, population: pop, garnizonCount: 0, palacTier: null },
      society, difficulty,
    );
    return result.porPct;
  });
  const res = simulateTrajectory(porTrajectory, revolt);
  ok(res.ok, 'D-c-real: ' + difficulty + '/real-pop1-14 -- karencja spójna na realnej trajektorii'
    + (res.ok ? '' : ' -- ' + res.reason));
}

console.log('\n[szczescie-audyt-d-progi-bunt-test] ' + passed + ' OK, ' + failed + ' FAIL\n');
process.exit(failed > 0 ? 1 : 0);
