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
function near(a, b, msg, eps) {
  const e = eps === undefined ? 1e-9 : eps;
  if (Math.abs(a - b) < e) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg + ' got ' + JSON.stringify(a) + ' expected ~' + JSON.stringify(b)); }
}

console.log('\n[society-breakdown-test]\n');

// Luksus bonus — R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 G7 (właściciel 2026-09-05): siatka co
// 10 p.p. (`szczescie_siatka_zamoznosc`, normal [-1..8]) zastąpiona SKALĄ LINIOWĄ:
// 0% -> -10, 90% -> +10, liniowo pomiędzy, zero dokładnie przy 45%. Te cztery wywołania
// idą z `society = null`, więc mierzą FALLBACK w TS, nie wiersze JSON — i to jest tu
// wartość dodana: pilnują, żeby stała w kodzie nie rozjechała się z decyzją właściciela.
// Sprawdzana właściwość bez zmian: udział Zamożności steruje linią podatków monotonicznie
// i z tymi samymi krańcami skali; zmieniła się postać (schodki -> prosta) i rozpiętość.
near(M.luksusHappinessBonus(25, null, 'normal'), -40 / 9, 'luksus 25% -> -4,44 (liniowo, poniżej 45%)');
near(M.luksusHappinessBonus(30, null, 'normal'), -30 / 9, 'luksus 30% -> -3,33');
near(M.luksusHappinessBonus(50, null, 'normal'), 10 / 9, 'luksus 50% -> +1,11 (powyżej 45%)');
near(M.luksusHappinessBonus(70, null, 'normal'), 50 / 9, 'luksus 70% -> +5,56');
// Krańce i punkt obojętny na samym fallbacku TS (bez JSON).
eq(M.luksusHappinessBonus(0, null, 'normal'), -10, 'luksus 0% -> -10 (fallback TS = liczba właściciela)');
eq(M.luksusHappinessBonus(90, null, 'normal'), 10, 'luksus 90% -> +10 (fallback TS)');
eq(M.luksusHappinessBonus(45, null, 'normal'), 0, 'luksus 45% -> DOKŁADNIE 0 (fallback TS)');

// Law garnizon (society=null -> fallback TS, nie JSON)
// R-PRAWO-PRZEBUDOWA-SKALI-Q1 (wlasciciel 2026-09-05): fallback prawMaxByEra era2 = 65
// (D3b, dosuniete do kolumny normal), prawPctCap fallback = 170 (D7). 5 jednostek x 20 pkt
// (fallback prawo_garnizon_per_jednostka) = 100 netto; 100/65*100 = 153,8% (bez ciecia na
// starym cap=100 -- nowy cap 170 go nie tnie). Liczba PRZELICZONA, nie przepisana z pamieci.
const law = M.computeLawBreakdown({ garnizonCount: 5, era: 2 }, null);
near(law.prawPct, 153.8, '5 jednostek, era 2, fallback TS -> PrawPct 153,8% (D3b+D7)', 0.05);

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

// R-GARNCARNIA-CERAMIKA-SZCZESCIE-111-Q1 pilnowało, żeby bonus PER MIASTO nie był mnożony
// przez liczbę miast ownera (objaw „111"). R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 G3 (właściciel
// 2026-09-05) usunął OBA te wiersze z rozpiski jako DUBLE: ceramika liczy się teraz jako
// zwykły surowiec zaopatrzenia (linia `zaopatrzenie_obywateli`, ±2/surowiec), a Spichlerz
// jako budynek szczęściodajny (+5 łącznie, G2). Właściwość „żadne wejście nie może wnieść
// więcej niż należy" zostaje — po nowej stronie i mocniej: pola są IGNOROWANE, więc wejście
// 111 nie może wnieść ani punktu, a dubel nie ma jak wrócić niezauważony.
const ceramicAndGranary = M.computeHappinessBreakdown({
  population: 6,
  era: 2,
  buildingZadowolenie: 0,
  ceramikaZadowolenie: 111,
  spichlerzZadowolenie: 111,
}, null);
const bezCeramikiISpichlerza = M.computeHappinessBreakdown({
  population: 6,
  era: 2,
  buildingZadowolenie: 0,
}, null);
eq(ceramicAndGranary.lines.find(l => l.id === 'ceramika')?.value, undefined,
  'G3: linia "Ceramika (dostęp)" USUNIĘTA z rozpiski (dubel wobec zaopatrzenia)');
eq(ceramicAndGranary.lines.find(l => l.id === 'spichlerz')?.value, undefined,
  'G3: linia "Spichlerz (działający)" USUNIĘTA z rozpiski (dubel wobec linii Budynki)');
eq(ceramicAndGranary.netto, bezCeramikiISpichlerza.netto,
  'reguła 111 po G3: ceramikaZadowolenie/spichlerzZadowolenie = 111 nie zmienia netto ani o punkt');

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
// Ta wlasciwosc NIE MA odpowiednika w nowej mechanice — nie ma juz koszykow mieszkancow.
// W jej miejsce (zeby liczba asercji nie spadla, a skan negatywny G14 zil takze tutaj)
// sprawdzamy, ze funkcja faktycznie zniknela z modulu i nie wrocila bocznymi drzwiami.
{
  // Skan po ZRODLE, nie po bundlu: `typeof M.happinessBucketsFromPct === 'undefined'` byloby
  // tautologia, bo entry point tej bramki i tak jej nie eksportuje. Czytamy plik.
  const SRC_SB = fs.readFileSync(
    path.resolve(__dirname, '..', 'src', 'game', 'society-breakdown.ts'), 'utf8',
  );
  ok(!/\bhappinessBucketsFromPct\b/.test(SRC_SB),
    'G14: happinessBucketsFromPct nie wystepuje juz w society-breakdown.ts (zero wywolan w gra/src)');
}

// D-START-OSIEDLE: symulacja PorPct w turze 1, pop=1, bez garnizonu.
//
// R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 (wlasciciel 2026-09-05) przestawil tu cztery rzeczy naraz:
//   G10 — bonus osiedla `szczescie_bonus_osiedle_pop` [4,3,2,1] -> [15,12,8,5] (przy pop 1
//         daje +15, bo stary bonus znosil sie z kara za wielkosc i przy pop 4 dawal netto ujemne),
//   G7  — podatki: siatka -> skala liniowa, przy udziale Zamoznosci 10% to -7,78 zamiast 0/-1/-2,
//   G4  — kultura i religia licza sie z UDZIALU wlasnej razy x(epoka) = 10/16/23,
//   G13 — mianownik `szczescie_max_epoka` 14/20/28 -> 20/30/35 (epoka 1, easy/normal/hard).
//
// Dlatego stare cele 80 / 58 / 34 (wyliczone na siatce sprzed zmiany) sa NIEAKTUALNE.
// Nowe liczby to POMIAR na parametrach wlasciciela, a nie liczba dobrana pod bramke —
// tolerancja +-4 p.p. i pasmo zostaja bez zmian, tak jak byly.
//
// R-PRAWO-PRZEBUDOWA-SKALI-Q1 (wlasciciel 2026-09-05) przestawil polowe Prawa tego samego
// scenariusza: prawo_max_epoka era1 50->35/40/45 per trudnosc (D3), prawo_max_pop_wspolczynnik
// 0,033/0,041/0,049->0,04 plasko (D4), prawo_pct_cap 100->170 (D7), obie kary za brak garnizonu
// usuniete (D5, i tak nie dotyczyly tego scenariusza: garnizonCount=0 ale population=1 <
// prog kary). Cele PONOWNIE PRZELICZONE (nie przepisane z pamieci, patrz pomiar w raporcie
// Operatora rundy 1): 94,8/73,4/59,2 -> 107,1/80,4/61,9. Pasma bez zmian.
//
// UWAGA na wejscia: `haKult` / `haRel` to od G4 ZNORMALIZOWANY wskaznik [-1,+1], a nie punkty.
// Poprzednie wartosci 3 / 2 / 1 (punkty starej skali) po zmianie wszystkie obcinaja sie do +1,
// czyli oznaczaly to samo — dlatego scenariusze dostaja teraz jawnie udzial 1,0 (nowe miasto
// ma 100% wlasnej kultury i wlasnej religii), a JEDYNA roznica miedzy nimi to trudnosc.
// To jest dokladnie wlasciwosc, ktora G13 obiecuje: trudnosc wyrazana WYLACZNIE mianownikiem.
{
  const society = require('../data/society-params.json');
  const podzial = { procentNauka: 20, procentPieniadz: 70, procentLuksus: 10 };
  const base = {
    era: 1, population: 1, buildingZadowolenie: 0, podzialHandlu: podzial, garnizonCount: 0,
    ownCultureShare: 1, ownReligionShare: 1,
  };
  const scenarios = [
    { diff: 'easy', target: 107.1, band: 'Ład' },
    { diff: 'normal', target: 80.4, band: 'Spokój' },
    { diff: 'hard', target: 61.9, band: 'Napięcie' },
  ];
  console.log('\n[D-START-OSIEDLE symulacja T1 pop=1, 100% wlasnej kultury i religii, bez garnizonu]\n');
  const zmierzone = [];
  for (const s of scenarios) {
    const ord = M.evaluateOrderFromBreakdown(
      { ...base, difficulty: s.diff },
      { ...base, difficulty: s.diff },
      society,
      s.diff,
    );
    const por = Math.round(ord.porPct * 10) / 10;
    zmierzone.push(por);
    const osiedleSz = ord.sz.lines.find(l => l.id === 'osiedle');
    const osiedlePr = ord.prawo.lines.find(l => l.id === 'osiedle');
    console.log(
      `  ${s.diff.padEnd(6)} PorPct=${por}% (cel ~${s.target}%) band=${ord.bandLabel} | ` +
      `Sz ${Math.round(ord.sz.szPct)}% Praw ${Math.round(ord.prawo.prawPct)}% | ` +
      `osiedle Sz +${osiedleSz?.value ?? '?'} Praw +${osiedlePr?.value ?? '?'}`,
    );
    ok(Math.abs(por - s.target) <= 4, `${s.diff} PorPct ~${s.target}% (±4)`);
    eq(ord.bandLabel, s.band, `${s.diff} pasmo startowe = ${s.band}`);
    // G10: przy pop 1 bonus osiedla w Szczesciu to dokladnie +15, na kazdej trudnosci.
    eq(osiedleSz?.value, 15, `${s.diff}: bonus osiedla przy pop 1 = +15 (G10, ta sama liczba na kazdej trudnosci)`);
  }
  // G13 wprost: przy IDENTYCZNYCH wejsciach roznica miedzy poziomami bierze sie wylacznie
  // z mianownika, wiec start musi byc scisle malejacy easy > normal > hard.
  ok(zmierzone[0] > zmierzone[1] && zmierzone[1] > zmierzone[2],
    `start scisle malejacy easy > normal > hard (${zmierzone.join(' > ')})`);
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
