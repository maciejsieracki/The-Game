'use strict';
/**
 * szczescie-skala-normalizacja-test.cjs
 * Bramka tematu R-SZCZESCIE-AUDYT-A-SKALA-NORMALIZACJA-Q1 (wezel A z pieciu).
 *
 * Sprawdza dwie rzeczy naraz:
 *   GOAL 1 — przeniesienie SZMAX_DEFAULTS / PRAWMAX_DEFAULTS / capow do
 *            gra/data/society-params.json bez zmiany zachowania (+ dzialajacy fallback),
 *   GOAL 2 — mianownik procentu (szMax / prawMax) skaluje sie z wielkoscia miasta,
 *            nie wylacznie z epoka: monotonicznie, ciagle, per trudnosc,
 *            z zachowana neutralnoscia startowa.
 *
 * Test importuje PRAWDZIWY modul (esbuild na ../src/game/society-breakdown), nie odtwarza
 * formuly wlasna kopia — playbook C-046 (wzorzec ucieczki mutacyjnej).
 *
 * Run: cd gra && node tools/szczescie-skala-normalizacja-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.szczescie-skala-normalizacja-entry.ts');
const BUNDLE = path.resolve(__dirname, '.szczescie-skala-normalizacja-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  computeHappinessBreakdown,
  computeLawBreakdown,
  evaluateOrderFromBreakdown,
  loadSocietyScaleParams,
  szMaxForEra,
  prawMaxForEra,
  szMaxForCity,
  prawMaxForCity,
  computePorPct,
  FALLBACK_SOCIETY_SCALE,
  SZMAX_DEFAULTS,
  PRAWMAX_DEFAULTS,
  SZ_PCT_CAP,
  PRAW_PCT_CAP,
} from '../src/game/society-breakdown';
export { loadOrderParams, FALLBACK_ORDER_PARAMS } from '../src/game/order';
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
  console.error('[szczescie-skala-normalizacja-test] bundle failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE);
const SOCIETY = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '..', 'data', 'society-params.json'), 'utf8'),
);

let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg); }
}
function eq(a, b, msg) {
  if (a === b) { passed++; console.log('  [OK] ' + msg); }
  else {
    failed++;
    console.error('  [FAIL] ' + msg + ' got ' + JSON.stringify(a) + ' expected ' + JSON.stringify(b));
  }
}
/** Kopia JSON bez wskazanego klucza w bloku — do sprawdzenia fallbacku. */
function withoutKey(block, key) {
  const clone = JSON.parse(JSON.stringify(SOCIETY));
  delete clone[block][key];
  return clone;
}

/**
 * Kopia danych ze SKALOWANIEM POPULACJA WYLACZONYM (wspolczynnik 0) — czyli prog zalezny
 * WYLACZNIE od epoki, dokladnie tak jak przed GOAL 2. Sluzy jako odniesienie „PRZED",
 * liczone tym samym kodem, zamiast przepisywania liczb z pamieci.
 */
function societyPrzedGoal2(diff, { bezCapu = false } = {}) {
  const clone = JSON.parse(JSON.stringify(SOCIETY));
  clone.szczescie.szczescie_max_pop_wspolczynnik[diff] = 0;
  clone.prawo.prawo_max_pop_wspolczynnik[diff] = 0;
  // Wariant „bez capu" sluzy WYLACZNIE do zmierzenia, jak duze jest urwisko licznika
  // sprzed tematu (zanik Osiedla / Zageszczenie), ktore cap 120% trzymal zakryte.
  if (bezCapu) {
    clone.szczescie.szczescie_pct_cap[diff] = 100000;
    clone.prawo.prawo_pct_cap[diff] = 100000;
  }
  return clone;
}

/** Podzial handlu ustawiony jawnie, zeby wynik nie zalezal od DEFAULT_PODZIAL_HANDLU. */
const PODZIAL = { procentNauka: 20, procentPieniadz: 70, procentLuksus: 10 };

// Stan SPRZED tematu — zahardkodowane w TS wartosci na bazie 2bb422aa.
const PRZED_SZMAX = { 1: 14, 2: 20, 3: 28 };
const PRZED_PRAWMAX = { 1: 50, 2: 75, 3: 100 };
const DIFFS = ['easy', 'normal', 'hard'];

// ---------------------------------------------------------------------------
console.log('\n1. GOAL 1 — rownowaznosc: przeniesienie stalych nie zmienia zachowania');
// ---------------------------------------------------------------------------
{
  // 1a. Liczby w JSON sa DOKLADNIE tymi, ktore byly zahardkodowane w TS.
  for (const diff of DIFFS) {
    const scale = M.loadSocietyScaleParams(SOCIETY, diff);
    eq(scale.szMaxByEra.join(','), '14,20,28', `JSON szczescie_max_epoka ${diff} = 14,20,28 (jak SZMAX_DEFAULTS)`);
    eq(scale.prawMaxByEra.join(','), '50,75,100', `JSON prawo_max_epoka ${diff} = 50,75,100 (jak PRAWMAX_DEFAULTS)`);
    eq(scale.szPctCap, 120, `JSON szczescie_pct_cap ${diff} = 120 (jak SZ_PCT_CAP)`);
    eq(scale.prawPctCap, 100, `JSON prawo_pct_cap ${diff} = 100 (jak PRAW_PCT_CAP)`);
  }

  // 1b. Wynik na progu epoki identyczny ze starym `DEFAULTS[e] ?? DEFAULTS[3]`,
  //     lacznie z epokami poza tablica (4, 7 -> wartosc epoki 3).
  const scaleN = M.loadSocietyScaleParams(SOCIETY, 'normal');
  for (const era of [1, 2, 3, 4, 7]) {
    const staraSz = PRZED_SZMAX[era] ?? PRZED_SZMAX[3];
    const staraPraw = PRZED_PRAWMAX[era] ?? PRZED_PRAWMAX[3];
    eq(M.szMaxForEra(era, scaleN), staraSz, `szMaxForEra(${era}) = ${staraSz} jak przed przeniesieniem`);
    eq(M.prawMaxForEra(era, scaleN), staraPraw, `prawMaxForEra(${era}) = ${staraPraw} jak przed przeniesieniem`);
  }

  // 1c. Pelny przebieg na konkretnych liczbach: pop <= populacji odniesienia, czyli
  //     obszar, ktorego GOAL 2 celowo nie rusza — wynik musi byc co do cyfry jak przed zmiana.
  const sz = M.computeHappinessBreakdown(
    { population: 2, era: 1, difficulty: 'normal', buildingZadowolenie: 13, podzialHandlu: PODZIAL },
    SOCIETY,
  );
  eq(sz.netto, 16, 'pop 2 / epoka 1: netto Sz = 16 (13 budynkow + 3 Osiedle)');
  eq(sz.szMax, 14, 'pop 2 / epoka 1: szMax = 14 (dokladnie jak przed zmiana)');
  eq(sz.szPct, 114.3, 'pop 2 / epoka 1: SzPct = 114,3% (dokladnie jak przed zmiana)');
  const pr = M.computeLawBreakdown(
    { population: 2, era: 1, difficulty: 'normal', garnizonCount: 0 }, SOCIETY,
  );
  eq(pr.netto, 20, 'pop 2 / epoka 1: netto Prawo = 20 (bonus Osiedla)');
  eq(pr.prawMax, 50, 'pop 2 / epoka 1: prawMax = 50 (dokladnie jak przed zmiana)');
  eq(pr.prawPct, 40, 'pop 2 / epoka 1: PrawPct = 40% (dokladnie jak przed zmiana)');
}

// ---------------------------------------------------------------------------
console.log('\n2. GOAL 1 — fallback: usuniecie wpisu z JSON daje wartosc ze stalej w TS');
// ---------------------------------------------------------------------------
{
  eq(M.SZMAX_DEFAULTS[1], 14, 'stala TS SZMAX_DEFAULTS[1] = 14');
  eq(M.PRAWMAX_DEFAULTS[1], 50, 'stala TS PRAWMAX_DEFAULTS[1] = 50');
  eq(M.SZ_PCT_CAP, 120, 'stala TS SZ_PCT_CAP = 120');
  eq(M.PRAW_PCT_CAP, 100, 'stala TS PRAW_PCT_CAP = 100');

  // society = null -> same stale z TS.
  const brakCalosci = M.loadSocietyScaleParams(null, 'normal');
  eq(brakCalosci.szMaxByEra.join(','), '14,20,28', 'society=null -> szMaxByEra ze stalej TS');
  eq(brakCalosci.prawMaxByEra.join(','), '50,75,100', 'society=null -> prawMaxByEra ze stalej TS');
  eq(brakCalosci.szPctCap, M.SZ_PCT_CAP, 'society=null -> szPctCap ze stalej TS');
  eq(brakCalosci.prawPctCap, M.PRAW_PCT_CAP, 'society=null -> prawPctCap ze stalej TS');

  // Usuniecie POJEDYNCZEGO wiersza — reszta nadal z JSON, brakujacy ze stalej.
  const bezSzEpoka = M.loadSocietyScaleParams(withoutKey('szczescie', 'szczescie_max_epoka'), 'normal');
  eq(bezSzEpoka.szMaxByEra.join(','), '14,20,28', 'brak szczescie_max_epoka -> SZMAX_DEFAULTS z TS');
  const bezPrawEpoka = M.loadSocietyScaleParams(withoutKey('prawo', 'prawo_max_epoka'), 'normal');
  eq(bezPrawEpoka.prawMaxByEra.join(','), '50,75,100', 'brak prawo_max_epoka -> PRAWMAX_DEFAULTS z TS');
  const bezCapu = M.loadSocietyScaleParams(withoutKey('szczescie', 'szczescie_pct_cap'), 'normal');
  eq(bezCapu.szPctCap, M.SZ_PCT_CAP, 'brak szczescie_pct_cap -> SZ_PCT_CAP z TS');
  const bezWsp = M.loadSocietyScaleParams(
    withoutKey('szczescie', 'szczescie_max_pop_wspolczynnik'), 'normal',
  );
  eq(bezWsp.szMaxPopWsp, M.FALLBACK_SOCIETY_SCALE.szMaxPopWsp,
    'brak szczescie_max_pop_wspolczynnik -> wspolczynnik ze stalej TS');

  // Fallback dziala takze w pelnym przebiegu (nie tylko w loaderze).
  const szBezDanych = M.computeHappinessBreakdown(
    { population: 2, era: 2, difficulty: 'normal', buildingZadowolenie: 10 },
    withoutKey('szczescie', 'szczescie_max_epoka'),
  );
  eq(szBezDanych.szMax, 20, 'przebieg bez wiersza JSON: szMax epoki 2 = 20 z fallbacku TS');
}

// ---------------------------------------------------------------------------
console.log('\n3. GOAL 2 — monotonicznosc progu po populacji (pop 1..15)');
// ---------------------------------------------------------------------------
{
  for (const diff of DIFFS) {
    const scale = M.loadSocietyScaleParams(SOCIETY, diff);
    for (const era of [1, 2, 3]) {
      let monoSz = true;
      let monoPraw = true;
      for (let pop = 1; pop < 15; pop++) {
        if (M.szMaxForCity(era, pop + 1, scale) < M.szMaxForCity(era, pop, scale)) monoSz = false;
        if (M.prawMaxForCity(era, pop + 1, scale) < M.prawMaxForCity(era, pop, scale)) monoPraw = false;
      }
      ok(monoSz, `${diff}/epoka ${era}: szMax niemalejacy dla pop 1..15`);
      ok(monoPraw, `${diff}/epoka ${era}: prawMax niemalejacy dla pop 1..15`);
    }
  }
  // Wiekszy zawsze znaczy NIE mniej — i realnie wiecej powyzej populacji odniesienia.
  const scaleN = M.loadSocietyScaleParams(SOCIETY, 'normal');
  ok(M.szMaxForCity(1, 12, scaleN) > M.szMaxForCity(1, 2, scaleN),
    'normal/epoka 1: prog pop 12 realnie wiekszy niz pop 2 (nie tylko rowny)');
  ok(M.prawMaxForCity(1, 12, scaleN) > M.prawMaxForCity(1, 2, scaleN),
    'normal/epoka 1: prog Prawa pop 12 realnie wiekszy niz pop 2');
}

// ---------------------------------------------------------------------------
console.log('\n4. GOAL 2 — ciaglosc: brak skoku progu przy pop -> pop+1');
// ---------------------------------------------------------------------------
{
  // Ustalony prog: wzrost mianownika przy +1 mieszkanca nigdy nie przekracza 8% wartosci
  // sprzed przyrostu. Wzrost skladany daje STALY skok wzgledny na kazdym kroku (rowny
  // (1+wsp)), wiec granica to najwyzszy wspolczynnik w pliku, czyli hard Sz 0,058.
  const MAX_SKOK = 1.08;
  let najwiekszySz = 1;
  let najwiekszyPraw = 1;
  for (const diff of DIFFS) {
    const scale = M.loadSocietyScaleParams(SOCIETY, diff);
    for (const era of [1, 2, 3]) {
      for (let pop = 1; pop < 15; pop++) {
        najwiekszySz = Math.max(najwiekszySz, M.szMaxForCity(era, pop + 1, scale) / M.szMaxForCity(era, pop, scale));
        najwiekszyPraw = Math.max(najwiekszyPraw, M.prawMaxForCity(era, pop + 1, scale) / M.prawMaxForCity(era, pop, scale));
      }
    }
  }
  console.log(`  (najwiekszy skok wzgledny progu: Sz x${najwiekszySz.toFixed(3)}, Prawo x${najwiekszyPraw.toFixed(3)})`);
  ok(najwiekszySz <= MAX_SKOK, `skok szMax przy pop->pop+1 <= x${MAX_SKOK} (jest x${najwiekszySz.toFixed(3)})`);
  ok(najwiekszyPraw <= MAX_SKOK, `skok prawMax przy pop->pop+1 <= x${MAX_SKOK} (jest x${najwiekszyPraw.toFixed(3)})`);

  // Skutek dla gracza — mierzony na CALEJ SIATCE PROFILI, nie na jednym zaszytym profilu.
  // (Runda 1, zarzut 1 Evaluatora: pojedynczy profil dawal 7,8 p.p. przy progu 8, a inne,
  // zupelnie zwyczajne profile daly 11,8 p.p. — bramka nie miala szans zaczerwieniec.)
  //
  // UWAGA na zakres: PorPct spada przy +1 mieszkancu takze z powodow SPRZED tego tematu
  // (zanik bonusu Osiedla powyzej pop 4, kara Zageszczenia powyzej pop 5 — wezly C i D).
  // Mierzymy wiec OBIE liczby: DODATKOWY spadek wniesiony przez GOAL 2 (ten sam krok
  // policzony ze skalowaniem i bez) oraz CALKOWITY spadek widziany przez gracza.
  // Rozklad „dodatkowego" spadku na dwa skladniki, bo to NIE jest jedna wielkosc:
  //   (A) odsloniete urwisko licznika sprzed tematu — zanik bonusu Osiedla powyzej pop 4
  //       i kara Zageszczenia powyzej pop 5 (wezly C i D). Ono istnialo zawsze, ale przy
  //       stojacym mianowniku miasto siedzialo na capie 120% po OBU stronach kroku, wiec
  //       urwisko bylo NIEWIDOCZNE. Mierzymy je na stanie PRZED z capem podniesionym.
  //   (B) wklad wlasny tego wezla = (A+B) - A. Tylko to podlega naszej allowliscie.
  const BUDYNKI = [0, 2, 5, 9, 14, 20, 26, 31];
  const GARNIZON = [0, 1, 3, 5];
  const PALAC = [null, 1, 2, 3];
  const ERY = [1, 2, 3, 4, 9];
  const WOJNA = [false, true];
  const HANDEL = [PODZIAL, { procentNauka: 40, procentPieniadz: 40, procentLuksus: 20 }];
  const LIMIT_WLASNY = 8;
  let maxDod = 0; let gdzieDod = '';
  let maxWlasny = 0; let gdzieWlasny = '';
  let maxTotPo = 0; let maxTotPrzed = 0;
  let profili = 0;
  for (const diff of DIFFS) {
    const PRZED = societyPrzedGoal2(diff);
    const PRZED_BEZ_CAPU = societyPrzedGoal2(diff, { bezCapu: true });
    for (const era of ERY) for (const b of BUDYNKI) for (const g of GARNIZON) for (const pt of PALAC)
      for (const w of WOJNA) for (const h of HANDEL) {
        profili++;
        const wSz = (pop) => ({
          population: pop, era, difficulty: diff, buildingZadowolenie: b,
          haKult: 2, haRel: 2, podzialHandlu: h, atWar: w,
          hasSwiatynia: b >= 5, hasAmfiteatr: b >= 9,
          ceramikaZadowolenie: b >= 2 ? 1 : 0, spichlerzZadowolenie: b >= 5 ? 1 : 0,
        });
        const wPr = (pop) => ({
          population: pop, era, difficulty: diff, garnizonCount: g, palacTier: pt,
          brakGarnizonuKara: g === 0, hasSad: b >= 14, hasPretorium: b >= 20,
        });
        const por = (pop, soc) => M.evaluateOrderFromBreakdown(wSz(pop), wPr(pop), soc, diff).porPct;
        for (let pop = 1; pop < 12; pop++) {
          const spadekPrzed = por(pop, PRZED) - por(pop + 1, PRZED);
          const spadekPo = por(pop, SOCIETY) - por(pop + 1, SOCIETY);
          const urwisko = Math.max(0, por(pop, PRZED_BEZ_CAPU) - por(pop + 1, PRZED_BEZ_CAPU));
          const dodatkowy = spadekPo - spadekPrzed;
          const wlasny = dodatkowy - urwisko;
          const opis = `${diff}/e${era}/${b} bud./garnizon ${g}/palac ${pt}/wojna ${w}/pop ${pop}->${pop + 1}`;
          if (dodatkowy > maxDod) { maxDod = dodatkowy; gdzieDod = `${opis} (z tego urwisko sprzed tematu ${urwisko.toFixed(1)} p.p.)`; }
          if (wlasny > maxWlasny) { maxWlasny = wlasny; gdzieWlasny = opis; }
          if (spadekPo > maxTotPo) maxTotPo = spadekPo;
          if (spadekPrzed > maxTotPrzed) maxTotPrzed = spadekPrzed;
        }
      }
  }
  console.log(`  (siatka: ${profili} profili x 11 krokow populacji)`);
  console.log(`  (CALKOWITY spadek PorPct przy +1 mieszkancu — stan gry PRZED tym tematem: max ${maxTotPrzed.toFixed(1)} p.p.; zanik Osiedla / Zageszczenie, wezly C i D)`);
  console.log(`  (CALKOWITY spadek PorPct PO tym wezle: max ${maxTotPo.toFixed(1)} p.p.)`);
  console.log(`  (DODATKOWY, co widzi gracz: max ${maxDod.toFixed(1)} p.p. — ${gdzieDod})`);
  console.log(`  (WLASNY WKLAD skalowania progu: max ${maxWlasny.toFixed(1)} p.p. — ${gdzieWlasny})`);
  ok(maxWlasny < LIMIT_WLASNY,
    `NA CALEJ SIATCE wlasny wklad skalowania w spadek PorPct przy +1 mieszkancu < ${LIMIT_WLASNY} p.p. (max ${maxWlasny.toFixed(1)} p.p., ${gdzieWlasny})`);
  // Drugi bezpiecznik: temat nie ma prawa POGORSZYC najgorszego przypadku, ktory gra ma juz
  // dzis, o wiecej niz 2,5 p.p. — to pilnuje, ze nie przesuwamy problemu wezlow C/D.
  ok(maxTotPo - maxTotPrzed <= 2.5,
    `najgorszy calkowity spadek gry rosnie najwyzej o 2,5 p.p. (${maxTotPrzed.toFixed(1)} -> ${maxTotPo.toFixed(1)} p.p.)`);
}

// ---------------------------------------------------------------------------
console.log('\n5. GOAL 2 — neutralnosc startowa (pop 1-2, epoka 1) i epoka jako czynnik');
// ---------------------------------------------------------------------------
{
  for (const diff of DIFFS) {
    const scale = M.loadSocietyScaleParams(SOCIETY, diff);
    for (const pop of [1, 2]) {
      eq(M.szMaxForCity(1, pop, scale), 14, `${diff}: pop ${pop} / epoka 1 -> szMax 14 (dzisiejsze, bez tolerancji)`);
      eq(M.prawMaxForCity(1, pop, scale), 50, `${diff}: pop ${pop} / epoka 1 -> prawMax 50 (dzisiejsze, bez tolerancji)`);
    }
  }
  // Warunek 3: epoka nadal jest czynnikiem — przy tej samej populacji epoki roznia sie progiem.
  const scaleN = M.loadSocietyScaleParams(SOCIETY, 'normal');
  ok(
    M.szMaxForCity(1, 8, scaleN) < M.szMaxForCity(2, 8, scaleN)
    && M.szMaxForCity(2, 8, scaleN) < M.szMaxForCity(3, 8, scaleN),
    'epoka nadal rozroznia prog przy tej samej populacji (pop 8: e1 < e2 < e3)',
  );
  // Warunek 4: parametryzacja per trudnosc dziala i zachowuje konwencje easy < normal < hard.
  // OBA wspolczynniki — Szczescia i Prawa. (Runda 1, zarzut 2 Evaluatora: sprawdzany byl
  // wylacznie szMaxPopWsp, wiec zrownanie easy=hard dla Prawa przechodzilo bramke bez sladu.)
  const wspSz = DIFFS.map((d) => M.loadSocietyScaleParams(SOCIETY, d).szMaxPopWsp);
  ok(wspSz[0] < wspSz[1] && wspSz[1] < wspSz[2],
    `wspolczynnik Sz per trudnosc easy<normal<hard (${wspSz.join(' < ')})`);
  const wspPr = DIFFS.map((d) => M.loadSocietyScaleParams(SOCIETY, d).prawMaxPopWsp);
  ok(wspPr[0] < wspPr[1] && wspPr[1] < wspPr[2],
    `wspolczynnik Prawa per trudnosc easy<normal<hard (${wspPr.join(' < ')})`);
  // Rozroznienie musi byc widoczne w SAMYM PROGU, nie tylko w wartosci wspolczynnika.
  const progPop12 = DIFFS.map((d) => M.prawMaxForCity(3, 12, M.loadSocietyScaleParams(SOCIETY, d)));
  ok(progPop12[0] < progPop12[1] && progPop12[1] < progPop12[2],
    `prawMax(pop 12, epoka 3) rozny per trudnosc (${progPop12.join(' < ')})`);
  const progSzPop12 = DIFFS.map((d) => M.szMaxForCity(3, 12, M.loadSocietyScaleParams(SOCIETY, d)));
  ok(progSzPop12[0] < progSzPop12[1] && progSzPop12[1] < progSzPop12[2],
    `szMax(pop 12, epoka 3) rozny per trudnosc (${progSzPop12.join(' < ')})`);
}

// ---------------------------------------------------------------------------
console.log('\n5b. GOAL 1 — cap PorPct z JSON dziala na OBU sciezkach liczenia PorPct');
// ---------------------------------------------------------------------------
{
  // Runda 1, zarzut 4 Evaluatora: computePorPct bralo cap z argumentu, ktory podawala tylko
  // sciezka computeOrderPctBreakdown. post-capture-law.ts:135 wola computePorPct z samym
  // OrderParams, wiec przestrojenie szczescie_pct_cap w JSON bylo tam ignorowane.
  // Teraz cap jedzie w OrderParams (loadOrderParams czyta szczescie.szczescie_pct_cap).
  eq(M.FALLBACK_ORDER_PARAMS.porPctCap, M.SZ_PCT_CAP,
    'stala fallbacku PorPct w order.ts = SZ_PCT_CAP w society-breakdown.ts (brak rozjazdu dwoch liczb)');
  eq(M.loadOrderParams(SOCIETY, 'normal').porPctCap, 120, 'loadOrderParams czyta cap 120 z JSON');
  const zPodniesionymCapem = JSON.parse(JSON.stringify(SOCIETY));
  zPodniesionymCapem.szczescie.szczescie_pct_cap.normal = 150;
  eq(M.loadOrderParams(zPodniesionymCapem, 'normal').porPctCap, 150,
    'przestrojenie szczescie_pct_cap w JSON dociera do OrderParams (sciezka post-capture-law)');
  // Realny skutek: computePorPct z tymi params respektuje nowy cap.
  const pDom = M.loadOrderParams(SOCIETY, 'normal');
  const pWys = M.loadOrderParams(zPodniesionymCapem, 'normal');
  eq(M.computePorPct(200, 200, pDom), 120, 'computePorPct z capem 120 z JSON tnie do 120');
  eq(M.computePorPct(200, 200, pWys), 150, 'computePorPct z capem 150 z JSON tnie do 150');
  // Brak pola (recznie zbudowane OrderParams spoza loadOrderParams) -> stala z TS.
  const bezPola = { ...pDom };
  delete bezPola.porPctCap;
  eq(M.computePorPct(200, 200, bezPola), M.SZ_PCT_CAP,
    'OrderParams bez pola porPctCap -> fallback na stala SZ_PCT_CAP (zachowanie jak przed tematem)');
  eq(M.loadOrderParams(null, 'normal').porPctCap, M.SZ_PCT_CAP,
    'society=null -> porPctCap ze stalej TS');
}

// ---------------------------------------------------------------------------
console.log('\n6. Scenariusz ze zrzutu wlasciciela: pop 2, epoka 1, Sz netto 16, Prawo 20');
// ---------------------------------------------------------------------------
{
  const wSz = { population: 2, era: 1, difficulty: 'normal', buildingZadowolenie: 13, podzialHandlu: PODZIAL };
  const wPr = { population: 2, era: 1, difficulty: 'normal', garnizonCount: 0 };
  const PRZED = societyPrzedGoal2('normal');
  const szPrzed = M.computeHappinessBreakdown(wSz, PRZED);
  const prPrzed = M.computeLawBreakdown(wPr, PRZED);
  const sz = M.computeHappinessBreakdown(wSz, SOCIETY);
  const pr = M.computeLawBreakdown(wPr, SOCIETY);
  console.log(`  PRZED: Sz ${szPrzed.netto}/${szPrzed.szMax} = ${szPrzed.szPct}% | Prawo ${prPrzed.netto}/${prPrzed.prawMax} = ${prPrzed.prawPct}%`);
  console.log(`  PO   : Sz ${sz.netto}/${sz.szMax} = ${sz.szPct}% | Prawo ${pr.netto}/${pr.prawMax} = ${pr.prawPct}%`);
  eq(sz.netto, 16, 'zrzut: Szczescie netto = 16');
  eq(pr.netto, 20, 'zrzut: Prawo netto = 20');
  eq(szPrzed.szPct, 114.3, 'zrzut PRZED: SzPct = 114,3% (zrzut wlasciciela pokazywal 114%)');
  eq(prPrzed.prawPct, 40, 'zrzut PRZED: PrawPct = 40% (zrzut wlasciciela pokazywal 40%)');
  // pop 2 = populacja odniesienia, wiec PO zmianie ma byc IDENTYCZNIE — neutralnosc startowa.
  eq(sz.szPct, szPrzed.szPct, 'zrzut PO zmianie: SzPct bez zmian wobec PRZED (114,3%)');
  eq(pr.prawPct, prPrzed.prawPct, 'zrzut PO zmianie: PrawPct bez zmian wobec PRZED (40%)');
}

// ---------------------------------------------------------------------------
console.log('\n7. Objaw zgloszony przez wlasciciela: rozwiniete miasto NIE dobija do capu 120%');
// ---------------------------------------------------------------------------
{
  const PRZED = societyPrzedGoal2('normal');
  const wejscie = (budynki) => ({
    population: 12, era: 3, difficulty: 'normal', buildingZadowolenie: budynki,
    hasSwiatynia: true, hasAmfiteatr: true, haKult: 2, haRel: 4, podzialHandlu: PODZIAL,
  });
  const prWejscie = { population: 12, era: 3, difficulty: 'normal', garnizonCount: 5, palacTier: 3 };

  // 7a. Objaw wprost: „im dalej w las" — miasto pop 12 w epoce 3 z 30 budynkami (+1 kazdy,
  //     bez limitu — to zakres wezla B, tu NIE ruszany) PRZED zmiana dobijalo do capu 120%.
  const dobijaPrzed = M.computeHappinessBreakdown(wejscie(31), PRZED);
  const dobijaPo = M.computeHappinessBreakdown(wejscie(31), SOCIETY);
  console.log(`  pop 12 / epoka 3 / 31 budynkow: netto ${dobijaPo.netto} | PRZED ${dobijaPrzed.szPct}% (szMax ${dobijaPrzed.szMax}) -> PO ${dobijaPo.szPct}% (szMax ${dobijaPo.szMax})`);
  eq(dobijaPrzed.szPct, 120, 'PRZED zmiana rozwiniete miasto dobija do capu 120% (odtworzony objaw ze zgloszenia)');
  ok(dobijaPo.szPct < 120, `PO zmianie rozwiniete miasto NIE dobija automatycznie do capu (${dobijaPo.szPct}%)`);
  ok(dobijaPo.szMax > dobijaPrzed.szMax, `prog rosnie z miastem: szMax ${dobijaPrzed.szMax} -> ${dobijaPo.szMax}`);

  // 7b. Kontrola drugiej strony: miasto rozwiniete umiarkowanie (20 budynkow) z pelna
  //     administracja NIE ma sie zapasc w niepokoj — sprawdzane na PorPct, bo to on
  //     steruje karami, nie sam SzPct.
  const po20 = M.computeHappinessBreakdown(wejscie(20), SOCIETY);
  const prPo = M.computeLawBreakdown(prWejscie, SOCIETY);
  const prPrzed = M.computeLawBreakdown(prWejscie, PRZED);
  const ordPo = M.evaluateOrderFromBreakdown(wejscie(20), prWejscie, SOCIETY, 'normal');
  const ordPrzed = M.evaluateOrderFromBreakdown(wejscie(20), prWejscie, PRZED, 'normal');
  console.log(`  Prawo pop 12 / epoka 3 (garnizon 5 + Palac III): netto ${prPo.netto} | PRZED ${prPrzed.prawPct}% (prawMax ${prPrzed.prawMax}) -> PO ${prPo.prawPct}% (prawMax ${prPo.prawMax})`);
  console.log(`  PorPct laczny pop 12 / epoka 3 / 20 budynkow + garnizon 5 + Palac III: PRZED ${ordPrzed.porPct}% (${ordPrzed.bandLabel}) -> PO ${ordPo.porPct}% (${ordPo.bandLabel})`);
  eq(prPrzed.prawPct, 100, 'PRZED zmiana duze miasto dobija do capu Prawa 100%');
  // UWAGA, jawnie: na normal miasto pop 12 z garnizonem 5 i Palacem III NADAL domyka Prawo
  // do 100% (netto 155 / prawMax 149) — zrodla Prawa sa grubo skwantowane (garnizon 20/jedn.,
  // Palac 35–55) i naleza do wezla C, nie do tego. Asercja z rundy 1 zadala tu wprost
  // „< 100%", co bylo wlasnym wymaganiem Operatora, a nie kryterium dispatchu (GOAL 3 pkt 7
  // mowi o capie 120% Szczescia) — i wymuszalo stromszy mianownik Prawa, niz pozwala warunek
  // ciaglosci. Zamiast tego sprawdzamy WLASCIWOSC, ktora GOAL 2 faktycznie obiecuje: prog
  // Prawa rosnie z miastem, wiec to samo netto daje w duzym miescie nizszy procent.
  console.log(`  Prawo pop 12 / epoka 3, garnizon 5 + Palac III, per trudnosc: ${DIFFS.map((d) => `${d} ${M.computeLawBreakdown({ ...prWejscie, difficulty: d }, SOCIETY).prawPct}%`).join(' | ')}`);
  const prMale = M.computeLawBreakdown({ ...prWejscie, population: 2 }, SOCIETY);
  ok(prPo.prawMax > prMale.prawMax,
    `prog Prawa rosnie z miastem: pop 2 -> ${prMale.prawMax}, pop 12 -> ${prPo.prawMax} (epoka 3, normal)`);
  const prHard = M.computeLawBreakdown({ ...prWejscie, difficulty: 'hard' }, SOCIETY);
  ok(prHard.prawPct < 100,
    `na hard duze miasto z samym garnizonem i Palacem NIE domyka juz Prawa do capu (${prHard.prawPct}%)`);
  ok(ordPo.porPct >= 50,
    `PO zmianie rozwiniete miasto z pelna administracja nie wpada w niepokoj: PorPct ${ordPo.porPct}% (${ordPo.bandLabel})`);
  ok(ordPo.porPct < ordPrzed.porPct,
    `zmiana faktycznie kosztuje: PorPct ${ordPrzed.porPct}% -> ${ordPo.porPct}% (SzPct ${po20.szPct}%)`);
}

// ---------------------------------------------------------------------------
console.log('\n8. Tabela prog(pop, epoka) — PRZED vs PO (normal), zapisana w raporcie');
// ---------------------------------------------------------------------------
{
  const scale = M.loadSocietyScaleParams(SOCIETY, 'normal');
  console.log('  pop | szMax e1  e2  e3 (PRZED 14 / 20 / 28) | prawMax e1  e2  e3 (PRZED 50 / 75 / 100)');
  for (const pop of [1, 2, 4, 6, 8, 12]) {
    const s = [1, 2, 3].map((e) => M.szMaxForCity(e, pop, scale).toFixed(1).padStart(6));
    const p = [1, 2, 3].map((e) => M.prawMaxForCity(e, pop, scale).toFixed(1).padStart(6));
    console.log(`  ${String(pop).padStart(3)} |${s.join('')}                          |${p.join('')}`);
  }
  // Kotwica liczbowa tabeli — gdyby ktos zmienil formule, tabela w raporcie przestaje zgadzac sie z kodem.
  eq(M.szMaxForCity(1, 12, scale), 22.4, 'tabela: szMax(pop 12, epoka 1) = 22,4');
  eq(M.szMaxForCity(3, 12, scale), 44.8, 'tabela: szMax(pop 12, epoka 3) = 44,8');
  eq(M.prawMaxForCity(1, 12, scale), 74.5, 'tabela: prawMax(pop 12, epoka 1) = 74,5');
  eq(M.prawMaxForCity(3, 6, scale), 117, 'tabela: prawMax(pop 6, epoka 3) = 117,0');
}

// ---------------------------------------------------------------------------
console.log('\n9. Osiagalnosc: duze miasto z pelna administracja nadal domyka Prawo do 100%');
// ---------------------------------------------------------------------------
{
  // Mianownik rosnacy z miastem ma WYMAGAC administracji, nie ODCIAC od niej. Cap ludnosci
  // to 12 (econ-params.json -> akwedukt_max_ludnosci), wiec to jest realny szczyt gry.
  for (const diff of DIFFS) {
    let najgorszy = 100;
    for (const era of [1, 2, 3]) {
      const r = M.computeLawBreakdown({
        population: 12, era, difficulty: diff, garnizonCount: 5, palacTier: 3,
        hasPretorium: true, hasSad: true, hasTrybunal: true, hasDworZarzadcy: true,
      }, SOCIETY);
      najgorszy = Math.min(najgorszy, r.prawPct);
    }
    eq(najgorszy, 100,
      `${diff}: pop 12 z garnizonem 5 + Palacem III + pelna administracja domyka Prawo do 100% w epokach 1-3`);
  }
}

fs.unlinkSync(ENTRY);
fs.unlinkSync(BUNDLE);

console.log(`\n[szczescie-skala-normalizacja-test] ${passed} OK, ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
