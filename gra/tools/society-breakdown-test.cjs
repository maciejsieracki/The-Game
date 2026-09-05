'use strict';
/**
 * society-breakdown-test.cjs — testy modelu % Sz/Prawo/Porządek + grace B2-Q12
 * Run: cd gra && node tools/society-breakdown-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.society-entry.ts');
const BUNDLE = path.resolve(__dirname, '.society-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  computeHappinessBreakdown,
  computeLawBreakdown,
  computeOrderPctBreakdown,
  evaluateOrderFromBreakdown,
  luksusHappinessBonus,
  tierFromPorPct,
  orderEffectsFromPorPct,
  porPctBand,
  updateRevoltGrace,
  loadRevoltParams,
  isOsiedleRevoltImmune,
  osiedlePopMax,
} from '../src/game/society-breakdown';
export { loadOrderParams } from '../src/game/order';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[society-breakdown-test] bundle failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE);
let passed = 0;
let failed = 0;

function eq(a, b, msg) {
  if (a === b) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg + ' got ' + JSON.stringify(a) + ' expected ' + JSON.stringify(b)); }
}
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg); }
}

console.log('\n[society-breakdown-test]\n');

// Luksus bonus — nowa siatka co 10 p.p. (Maciej 2026-07-25). Bracket = floor(pct/10):
// normal = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8] dla dziesiątek 0..9.
eq(M.luksusHappinessBonus(25, null, 'normal'), 1, 'luksus 25% (bracket 20-29, idx2) -> +1');
eq(M.luksusHappinessBonus(30, null, 'normal'), 2, 'luksus 30% (bracket 30-39, idx3) -> +2');
eq(M.luksusHappinessBonus(50, null, 'normal'), 4, 'luksus 50% (bracket 50-59, idx5) -> +4');
eq(M.luksusHappinessBonus(70, null, 'normal'), 6, 'luksus 70% (bracket 70-79, idx7) -> +6');

// Law garnizon
const law = M.computeLawBreakdown({ garnizonCount: 5, era: 2 }, null);
eq(law.prawPct, 100, '5 jednostek -> PrawPct 100%');

// Pałac > 1 jednostka garnizonu (normal)
const society = require('../data/society-params.json');
const palacLaw = M.computeLawBreakdown({ garnizonCount: 0, hasPalac: true, era: 1 }, society);
const oneUnitLaw = M.computeLawBreakdown({ garnizonCount: 1, era: 1 }, society);
ok(
  (palacLaw.lines.find(l => l.id === 'palac')?.value ?? 0) > (oneUnitLaw.lines.find(l => l.id === 'garnizon')?.value ?? 0),
  'Pałac daje więcej pkt Prawa niż 1 jednostka garnizonu',
);
ok(oneUnitLaw.prawPct < 100, '1 jednostka garnizonu ≠ 100% Prawo (skala PT 2026-07)');

// Happiness + order
const sz = M.computeHappinessBreakdown({
  population: 6,
  era: 2,
  buildingZadowolenie: 4,
  podzialHandlu: { procentNauka: 10, procentPieniadz: 30, procentLuksus: 60 },
}, null);
eq(sz.lines.some(l => l.id === 'niskie_podatki'), true, 'luksus 60% w rozpisce');
const pr = M.computeLawBreakdown({ garnizonCount: 2, era: 2 }, null);
const params = M.loadOrderParams(null, 'normal');
const ord = M.computeOrderPctBreakdown(sz, pr, params);
eq(ord.porPct > 0, true, 'PorPct > 0');
eq(M.porPctBand(ord.porPct).length > 0, true, 'band ok');

// R-GARNCARNIA-CERAMIKA-SZCZESCIE-111-Q1: dwa niezależne bonusy są binarne
// i sumują się per miasto; żaden nie jest mnożony przez liczbę miast ownera.
const ceramicAndGranary = M.computeHappinessBreakdown({
  population: 6,
  era: 2,
  buildingZadowolenie: 0,
  ceramikaZadowolenie: 111,
  spichlerzZadowolenie: 111,
}, null);
eq(ceramicAndGranary.lines.find(l => l.id === 'ceramika')?.value, 1,
  'R-GARNCARNIA...: Ceramika = dokładnie +1 na miasto (także przy wejściu 111)');
eq(ceramicAndGranary.lines.find(l => l.id === 'spichlerz')?.value, 1,
  'R-GARNCARNIA...: działający Spichlerz = dokładnie +1 na miasto (także przy wejściu 111)');
eq(ceramicAndGranary.lines.filter(l => ['ceramika', 'spichlerz'].includes(l.id)).reduce((sum, line) => sum + line.value, 0), 2,
  'R-GARNCARNIA...: Ceramika + Spichlerz = +2, bez owner-wide multiplication');

// Tier mapping
eq(M.tierFromPorPct(95), 'order', 'PorPct 95 -> order');
eq(M.tierFromPorPct(50), 'neutral', 'PorPct 50 -> neutral');
eq(M.tierFromPorPct(5), 'unrest', 'PorPct 5 -> unrest');

// Revolt grace (default 12% / 3 tury — PT 2026-07)
let g = M.updateRevoltGrace(null, 5);
eq(g.revoltWarning, true, 'grace start warning');
eq(g.revoltGraceRemaining, 3, 'grace = 3');
g = M.updateRevoltGrace(3, 5);
eq(g.revoltGraceRemaining, 2, 'grace tick 3->2');
g = M.updateRevoltGrace(2, 5);
eq(g.revoltGraceRemaining, 1, 'grace tick 2->1');
g = M.updateRevoltGrace(1, 5);
eq(g.revoltGraceRemaining, 0, 'grace tick 1->0');
g = M.updateRevoltGrace(0, 5);
eq(g.shouldTriggerRebellion, true, 'grace exhausted -> rebel');

g = M.updateRevoltGrace(2, 18);
eq(g.revoltGraceRemaining, null, 'recovery PorPct>=12 reset');

// D18: easy próg 5% / grace 3
const revoltEasy = M.loadRevoltParams({
  porzadek: {
    porzadek_prog_bunt_skrajny_pct: { easy: 5, normal: 8, hard: 10 },
    porzadek_grace_tur_bunt: { easy: 3, normal: 2, hard: 2 },
  },
}, 'easy');
eq(revoltEasy.criticalPorPct, 5, 'D18 easy critical 5%');
eq(revoltEasy.graceTurns, 3, 'D18 easy grace 3');
g = M.updateRevoltGrace(null, 4, revoltEasy);
eq(g.graceTurnsLeft, 3, 'easy: PorPct 4% -> grace 3');
eq(M.porPctBand(4, 5), 'bunt_skrajny', 'PorPct 4 < crit 5 -> skrajny');
eq(M.porPctBand(6, 5), 'bunt', 'PorPct 6 >= crit 5 -> bunt not skrajny');

// USUNIETE (R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 G14, wlasciciel 2026-09-05): asercja
// `happinessBucketsFromPct(10, 80)` -> suma koszykow = populacja. Funkcja zostala usunieta
// z society-breakdown.ts razem z siedmioma martwymi parametrami — byla pozostaloscia po
// porzuconym modelu "liczby zadowolonych mieszkancow", zastapionym modelem procentowym
// szPct -> PorPct, i nie miala ani jednego wywolania w gra/src poza wlasnym plikiem.

// D-START-OSIEDLE: symulacja PorPct T1 pop=1 (cele 75/55/35)
{
  const society = require('../data/society-params.json');
  const podzial = { procentNauka: 20, procentPieniadz: 70, procentLuksus: 10 };
  const base = { era: 1, population: 1, buildingZadowolenie: 0, podzialHandlu: podzial, garnizonCount: 0 };
  const scenarios = [
    // target podniesiony z 72 -> 80 (Maciej 2026-07-25): nowa siatka Sz od Zamożności daje
    // na easy +2 pkt Sz przy udziale Zamożności 10% (bracket 10-19, easy[1]=2), podczas gdy
    // stara siatka (progi od 30% wzwyż) dawała 0 poniżej 30% — PorPct realnie = 79,9% (era1
    // SzMax=14, +2 pkt Sz = +100*2/14 ≈ +14,3 p.p. Sz%, ważone wagaSz=0,55 -> ok. +7,9 p.p. PorPct).
    { diff: 'easy', haKult: 3, haRel: 3, target: 80, band: 'Spokój' },
    { diff: 'normal', haKult: 2, haRel: 2, target: 58, band: 'Napięcie' },
    { diff: 'hard', haKult: 1, haRel: 1, target: 34, band: 'Niepokój' },
  ];
  console.log('\n[D-START-OSIEDLE symulacja T1 pop=1, kult+rel, bez garnizonu]\n');
  for (const s of scenarios) {
    const ord = M.evaluateOrderFromBreakdown(
      { ...base, haKult: s.haKult, haRel: s.haRel, difficulty: s.diff },
      { ...base, difficulty: s.diff },
      society,
      s.diff,
    );
    const por = Math.round(ord.porPct * 10) / 10;
    const osiedleSz = ord.sz.lines.find(l => l.id === 'osiedle');
    const osiedlePr = ord.prawo.lines.find(l => l.id === 'osiedle');
    console.log(
      `  ${s.diff.padEnd(6)} PorPct=${por}% (cel ~${s.target}%) band=${ord.bandLabel} | ` +
      `Sz ${Math.round(ord.sz.szPct)}% Praw ${Math.round(ord.prawo.prawPct)}% | ` +
      `osiedle Sz +${osiedleSz?.value ?? '?'} Praw +${osiedlePr?.value ?? '?'}`,
    );
    ok(Math.abs(por - s.target) <= 4, `${s.diff} PorPct ~${s.target}% (±4)`);
  }
}

{
  const society = require('../data/society-params.json');
  const podzial = { procentNauka: 20, procentPieniadz: 70, procentLuksus: 10 };
  const prStart = M.computeLawBreakdown({ garnizonCount: 0, population: 1, era: 1 }, society);
  ok(prStart.lines.some(l => l.id === 'osiedle'), 'pop=1 -> bonus osiedle w Prawie');
  const prPop2 = M.computeLawBreakdown({ garnizonCount: 0, population: 2, era: 1 }, society);
  const prPop5 = M.computeLawBreakdown({ garnizonCount: 0, population: 5, era: 1 }, society);
  const prPop1Val = prStart.lines.find(l => l.id === 'osiedle')?.value ?? 0;
  const prPop2Val = prPop2.lines.find(l => l.id === 'osiedle')?.value ?? 0;
  ok(prPop1Val > prPop2Val, 'pop=1 Prawo osiedle > pop=2 (malejący bonus)');
  ok(!prPop5.lines.some(l => l.id === 'osiedle'), 'pop=5 -> brak bonusu osiedle (Prawo)');
  const szPop5 = M.computeHappinessBreakdown({
    population: 5, era: 1, buildingZadowolenie: 0, haKult: 2, haRel: 2,
    podzialHandlu: podzial,
  }, society);
  ok(!szPop5.lines.some(l => l.id === 'osiedle'), 'pop=5 -> brak bonusu osiedle (Sz)');
  const ordStart = M.evaluateOrderFromBreakdown(
    { population: 1, era: 1, buildingZadowolenie: 0, haKult: 2, haRel: 2, haWealth: 0,
      podzialHandlu: podzial },
    { garnizonCount: 0, population: 1, era: 1 },
    society,
    'normal',
  );
  ok(ordStart.porPct >= 20, 'pop=1 start PorPct >= 20% (D16-A)');
  ok(ordStart.porPct >= 50, 'pop=1 start PorPct >= 50% (D-START-OSIEDLE normal)');
  ok(M.porPctBand(ordStart.porPct) !== 'bunt_skrajny', 'pop=1 start bez bandy bunt skrajny');
}

{
  const society = require('../data/society-params.json');
  ok(M.isOsiedleRevoltImmune(1, society, 'normal'), 'pop=1 -> immunitet buntu osiedle');
  ok(M.isOsiedleRevoltImmune(4, society, 'normal'), 'pop=4 -> immunitet buntu osiedle');
  ok(!M.isOsiedleRevoltImmune(5, society, 'normal'), 'pop=5 -> brak immunitetu osiedle');
  eq(M.osiedlePopMax(society, 'normal'), 4, 'prog osiedla = 4');
}

console.log('\n[society-breakdown-test] ' + passed + ' OK, ' + failed + ' FAIL\n');
process.exit(failed > 0 ? 1 : 0);
