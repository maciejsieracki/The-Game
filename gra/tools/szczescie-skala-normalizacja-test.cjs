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
function near(a, b, msg, eps) {
  const e = eps === undefined ? 1e-9 : eps;
  if (Math.abs(a - b) < e) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg + ' got ' + JSON.stringify(a) + ' expected ~' + JSON.stringify(b)); }
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

// Stan SPRZED tematu R-SZCZESCIE-AUDYT-A-SKALA-NORMALIZACJA-Q1 — zahardkodowane w TS
// wartosci na bazie 2bb422aa. SZCZESCIE juz ich nie uzywa: R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1
// G13 (wlasciciel 2026-09-05) przestawil `szczescie_max_epoka` na tabele PER TRUDNOSC
// (nizej, SZMAX_G13), bo trudnosc ma byc odtad wyrazana WYLACZNIE mianownikiem Szczescia.
// PRAWO nie bylo objete ta decyzja i zostaje 50/75/100 — dlatego PRZED_PRAWMAX zyje dalej.
const PRZED_SZMAX = { 1: 14, 2: 20, 3: 28 };
const PRZED_PRAWMAX = { 1: 50, 2: 75, 3: 100 };
const DIFFS = ['easy', 'normal', 'hard'];

// Tabela G13 — liczby WLASCICIELA z 00-dispatch.md, przepisane wprost, nie wyliczone.
const SZMAX_G13 = { easy: [20, 40, 60], normal: [30, 50, 70], hard: [35, 55, 80] };

const PRZED_SZMAX_TAB = [14, 20, 28];

/**
 * Kopia danych ze stanem SPRZED G13: mianownik Szczescia wraca do 14/20/28 (i skalowanie
 * populacja wylaczone). Sluzy do ODTWORZENIA objawu ze zgloszenia wlasciciela („im dalej
 * w las, tym szczescie wyzsze" — rozwiniete miasto siedzialo na capie 120%), zeby bramka
 * dalej pokazywala, PRZED czym broni, a nie tylko jak jest dzis.
 */
function societyPrzedG13(diff) {
  const clone = societyPrzedGoal2(diff);
  clone.szczescie.szczescie_max_epoka[diff] = [...PRZED_SZMAX_TAB];
  return clone;
}

// ---------------------------------------------------------------------------
console.log('\n1. GOAL 1 — rownowaznosc: przeniesienie stalych nie zmienia zachowania');
// ---------------------------------------------------------------------------
{
  // 1a. Liczby w JSON sa DOKLADNIE tymi, ktore byly zahardkodowane w TS.
  for (const diff of DIFFS) {
    const scale = M.loadSocietyScaleParams(SOCIETY, diff);
    // PRZED G13 wszystkie trzy trudnosci mialy 14/20/28 — czyli DOKLADNIE stala SZMAX_DEFAULTS
    // z TS. Ta asercja sprawdzala wtedy rownowaznosc przeniesienia stalej do JSON, ale przy
    // rownych liczbach nie potrafila odroznic „wczytano z JSON" od „wzieto fallback z TS".
    // PO G13 (liczby wlasciciela, 00-dispatch.md) tabela jest inna per trudnosc i INNA niz
    // stala TS — wiec asercja pilnuje teraz obu rzeczy naraz: wartosci sa te, ktore podal
    // wlasciciel, ORAZ loader faktycznie czyta plik, a nie fallback.
    eq(scale.szMaxByEra.join(','), SZMAX_G13[diff].join(','),
      `JSON szczescie_max_epoka ${diff} = ${SZMAX_G13[diff].join(',')} (G13, liczby wlasciciela)`);
    // R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 R3-C: SZMAX_DEFAULTS zostal dosuniety do danych
    // (30/50/70 = kolumna `normal`), wiec dla `normal` porownanie „liczby sie roznia"
    // z definicji przestalo odrozniac JSON od fallbacku. Sprawdzana WLASCIWOSC — „loader
    // faktycznie czyta plik, a nie stala w TS" — zostaje i jest teraz MOCNIEJSZA: zamiast
    // liczyc na przypadkowa nierownosc liczb wstawiam do KOPII danych wartownika i zadam,
    // zeby loader zwrocil dokladnie jego. Dziala na kazdej trudnosci, takze tam, gdzie
    // dane i fallback sa rowne.
    const wartownik = JSON.parse(JSON.stringify(SOCIETY));
    wartownik.szczescie.szczescie_max_epoka[diff] = [997, 998, 999];
    eq(M.loadSocietyScaleParams(wartownik, diff).szMaxByEra.join(','), '997,998,999',
      `${diff}: szMaxByEra pochodzi z JSON, a nie z fallbacku SZMAX_DEFAULTS (wartownik w danych)`);
    eq(scale.prawMaxByEra.join(','), '50,75,100', `JSON prawo_max_epoka ${diff} = 50,75,100 (jak PRAWMAX_DEFAULTS)`);
    eq(scale.szPctCap, 120, `JSON szczescie_pct_cap ${diff} = 120 (jak SZ_PCT_CAP)`);
    eq(scale.prawPctCap, 100, `JSON prawo_pct_cap ${diff} = 100 (jak PRAW_PCT_CAP)`);
  }

  // 1b. Wynik na progu epoki identyczny ze starym `DEFAULTS[e] ?? DEFAULTS[3]`,
  //     lacznie z epokami poza tablica (4, 7 -> wartosc epoki 3).
  const scaleN = M.loadSocietyScaleParams(SOCIETY, 'normal');
  for (const era of [1, 2, 3, 4, 7]) {
    // Sprawdzana wlasciwosc bez zmian: epoka POZA tablica (4, 7) dostaje wartosc epoki 3 —
    // to jest sedno tej petli i to G13 nie ruszylo. Zmienily sie tylko same liczby Szczescia.
    const oczekSz = SZMAX_G13.normal[era - 1] ?? SZMAX_G13.normal[2];
    const staraPraw = PRZED_PRAWMAX[era] ?? PRZED_PRAWMAX[3];
    eq(M.szMaxForEra(era, scaleN), oczekSz, `szMaxForEra(${era}) = ${oczekSz} (G13 normal, epoka >3 -> wartosc epoki 3)`);
    eq(M.prawMaxForEra(era, scaleN), staraPraw, `prawMaxForEra(${era}) = ${staraPraw} jak przed przeniesieniem`);
  }

  // 1c. Pelny przebieg na konkretnych liczbach: pop <= populacji odniesienia, czyli
  //     obszar, ktorego GOAL 2 celowo nie rusza — wynik musi byc co do cyfry jak przed zmiana.
  const sz = M.computeHappinessBreakdown(
    { population: 2, era: 1, difficulty: 'normal', buildingZadowolenie: 13, podzialHandlu: PODZIAL },
    SOCIETY,
  );
  // PRZED R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 bylo tu: netto 16 (13 budynkow + 3 Osiedle),
  // szMax 14, SzPct 114,3% — czyli „co do cyfry jak przed przeniesieniem stalych".
  // Ta rownowaznosc zostala SWIADOMIE zerwana przez wlasciciela: G10 podniosl bonus osiedla
  // przy pop 2 z +3 na +12, G7 zastapil siatke podatkow skala liniowa (udzial 10% -> -7,78),
  // G4 dolozyl linie Kultury (+x = +10 przy 100% wlasnej), a G13 podniosl mianownik 14 -> 30.
  // Sprawdzana wlasciwosc zostaje: JEDEN w pelni okreslony przebieg jest przybity do liczby,
  // wraz z rozbiciem na skladniki — zeby zmiana ktoregokolwiek z nich nie przeszla po cichu.
  const v1c = (id) => (sz.lines.find((l) => l.id === id) || { value: 0 }).value;
  eq(v1c('budynki'), 13, 'pop 2 / epoka 1: skladnik Budynki = 13 (wejscie)');
  eq(v1c('osiedle'), 12, 'pop 2 / epoka 1: skladnik Osiedle = +12 (G10, pop 2)');
  eq(v1c('kultura'), 10, 'pop 2 / epoka 1: skladnik Kultura = +10 (G4, 100% wlasnej, x epoki 1)');
  near(v1c('wysokie_podatki'), -70 / 9, 'pop 2 / epoka 1: skladnik podatki = -7,78 (G7, udzial 10%)');
  near(sz.netto, 13 + 12 + 10 - 70 / 9, 'pop 2 / epoka 1: netto Sz = 27,22 (suma czterech skladnikow)');
  eq(sz.szMax, 30, 'pop 2 / epoka 1: szMax = 30 (G13 normal, pop <= populacji odniesienia -> bez skalowania)');
  eq(sz.szPct, 90.7, 'pop 2 / epoka 1: SzPct = 90,7%');
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
  // R3-C (ratyfikacja orkiestratora 2026-09-05): fallback dosuniety do danych — 30/50/70,
  // czyli kolumna `normal` z tabeli G13. Sprawdzana wlasciwosc bez zmian (fallback ISTNIEJE
  // i jest brany, gdy society = null); zmienily sie wylacznie liczby, ktore niesie.
  eq(M.SZMAX_DEFAULTS[1], 30, 'stala TS SZMAX_DEFAULTS[1] = 30 (R3-C)');
  eq(M.SZMAX_DEFAULTS[2], 50, 'stala TS SZMAX_DEFAULTS[2] = 50 (R3-C)');
  eq(M.SZMAX_DEFAULTS[3], 70, 'stala TS SZMAX_DEFAULTS[3] = 70 (R3-C)');
  // WIAZANIE KOD <-> DANE, dolozone przez R3-C: fallback ma byc DOKLADNIE kolumna `normal`
  // z society-params.json. Bez tej asercji przyszly rozjazd (ktos zmienia dane i zapomina
  // o stalej, albo odwrotnie) siedzialby cicho — dokladnie tak, jak siedzial 14/20/28.
  eq([M.SZMAX_DEFAULTS[1], M.SZMAX_DEFAULTS[2], M.SZMAX_DEFAULTS[3]].join(','),
    M.loadSocietyScaleParams(SOCIETY, 'normal').szMaxByEra.join(','),
    'R3-C: SZMAX_DEFAULTS === szczescie_max_epoka.normal z JSON (rozjazd kodu z danymi czerwieni bramke)');
  eq(M.PRAWMAX_DEFAULTS[1], 50, 'stala TS PRAWMAX_DEFAULTS[1] = 50');
  eq(M.SZ_PCT_CAP, 120, 'stala TS SZ_PCT_CAP = 120');
  eq(M.PRAW_PCT_CAP, 100, 'stala TS PRAW_PCT_CAP = 100');

  // society = null -> same stale z TS.
  const brakCalosci = M.loadSocietyScaleParams(null, 'normal');
  eq(brakCalosci.szMaxByEra.join(','), '30,50,70', 'society=null -> szMaxByEra ze stalej TS (R3-C: 30,50,70)');
  eq(brakCalosci.prawMaxByEra.join(','), '50,75,100', 'society=null -> prawMaxByEra ze stalej TS');
  eq(brakCalosci.szPctCap, M.SZ_PCT_CAP, 'society=null -> szPctCap ze stalej TS');
  eq(brakCalosci.prawPctCap, M.PRAW_PCT_CAP, 'society=null -> prawPctCap ze stalej TS');

  // Usuniecie POJEDYNCZEGO wiersza — reszta nadal z JSON, brakujacy ze stalej.
  const bezSzEpoka = M.loadSocietyScaleParams(withoutKey('szczescie', 'szczescie_max_epoka'), 'normal');
  eq(bezSzEpoka.szMaxByEra.join(','), '30,50,70', 'brak szczescie_max_epoka -> SZMAX_DEFAULTS z TS (R3-C)');
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
  eq(szBezDanych.szMax, 50, 'przebieg bez wiersza JSON: szMax epoki 2 = 50 z fallbacku TS (R3-C)');
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
      // Wlasciwosc bez zmian: przy populacji <= populacji odniesienia (2) mianownik jest
      // CZYSTA wartoscia epoki, bez zadnego skalowania. Zmienila sie tylko sama wartosc:
      // 14 dla kazdej trudnosci -> tabela G13 wlasciciela, rozna per trudnosc.
      eq(M.szMaxForCity(1, pop, scale), SZMAX_G13[diff][0],
        `${diff}: pop ${pop} / epoka 1 -> szMax ${SZMAX_G13[diff][0]} (G13, bez skalowania populacja)`);
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
  // R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 R3-A (decyzja wlasciciela 2026-09-05): wspolczynnik
  // Szczescia to JEDNA liczba 0,04 na wszystkich trzech poziomach — uchyla 0,038/0,048/0,058.
  // Asercja NIE znika, tylko odwraca znak oczekiwania: dalej pilnuje, zeby nikt nie wrocil
  // do trojki per trudnosc (kontrakt G13: trudnosc wyrazana WYLACZNIE przez szczescie_max_epoka).
  const wspSz = DIFFS.map((d) => M.loadSocietyScaleParams(SOCIETY, d).szMaxPopWsp);
  ok(wspSz[0] === wspSz[1] && wspSz[1] === wspSz[2],
    `R3-A: wspolczynnik Sz JEDEN na easy/normal/hard (${wspSz.join(' === ')})`);
  eq(wspSz[1], 0.04, 'R3-A: wspolczynnik Sz = 0,04 (liczba wlasciciela, ten sam co prawo_max_pop_wspolczynnik)');
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
  // Zrzut wlasciciela (114% / 40%) pochodzi sprzed R-SZCZESCIE-PRZEBUDOWA-SKALI-Q1 i po
  // stronie SZCZESCIA jest juz nieodtwarzalny — G4/G7/G10/G13 zmienily i licznik, i mianownik
  // tego samego miasta (netto 16 -> 27,22; szMax 14 -> 30; SzPct 114,3% -> 90,7%).
  // Strona PRAWA nie byla objeta tematem i musi zgadzac sie ze zrzutem co do cyfry — dlatego
  // asercja 40% zostaje bez zmian. Dla Szczescia przybijamy nowa liczbe tego samego miasta.
  near(sz.netto, 13 + 12 + 10 - 70 / 9, 'zrzut: Szczescie netto = 27,22 (po G4/G7/G10)');
  eq(pr.netto, 20, 'zrzut: Prawo netto = 20');
  eq(szPrzed.szPct, 90.7, 'zrzut PRZED (skalowanie populacja wylaczone): SzPct = 90,7%');
  eq(prPrzed.prawPct, 40, 'zrzut PRZED: PrawPct = 40% (zrzut wlasciciela pokazywal 40%)');
  // pop 2 = populacja odniesienia, wiec PO zmianie ma byc IDENTYCZNIE — neutralnosc startowa.
  eq(sz.szPct, szPrzed.szPct, 'zrzut PO zmianie: SzPct bez zmian wobec PRZED (90,7%)');
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
  // Objaw ze zgloszenia („im dalej w las, tym szczescie wyzsze") odtwarzamy na stanie sprzed
  // OBU tematow: mianownik 14/20/28 (sprzed G13) i skalowanie populacja wylaczone (sprzed
  // GOAL 2). Sam PRZED z dzisiejszym mianownikiem G13 juz go NIE pokazuje — bo wlasnie
  // podniesienie mianownika 28 -> 70 jest ta czescia naprawy, ktora wniosl G13.
  // Wlasciwosc bez zmian: bramka nadal odtwarza objaw, a nie tylko opisuje stan po naprawie.
  const dobijaPrzedG13 = M.computeHappinessBreakdown(wejscie(31), societyPrzedG13('normal'));
  eq(dobijaPrzedG13.szPct, 120, 'PRZED zmiana (mianownik 14/20/28) rozwiniete miasto dobija do capu 120% (odtworzony objaw ze zgloszenia)');
  ok(dobijaPrzed.szPct < 120, `sam G13 (mianownik 28 -> 70) juz zbija miasto z capu: ${dobijaPrzed.szPct}%`);
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
  // Historia tych dwoch liczb: 22,4 / 44,8 (baza 14 / 28) -> 48,0 / 112,0 po G13 (baza 30 / 70,
  // mnoznik populacji 0,048) -> 44,4 / 103,6 po R3-A (baza bez zmian, mnoznik 0,04 na kazdej
  // trudnosci). Wlasciwosc bez zmian: tabela drukowana w raporcie jest przybita do kodu, wiec
  // zmiana formuly ALBO wspolczynnika rozjezdza bramke.
  // Rachunek: (1 + 0,04) ^ (12 - 2) = 1,48 (zaokraglone do 2 miejsc w popScaleMultiplier);
  // 30 x 1,48 = 44,4 i 70 x 1,48 = 103,6.
  eq(M.szMaxForCity(1, 12, scale), 44.4, 'tabela: szMax(pop 12, epoka 1) = 44,4 (G13 baza 30 x mnoznik 1,48 z R3-A)');
  eq(M.szMaxForCity(3, 12, scale), 103.6, 'tabela: szMax(pop 12, epoka 3) = 103,6 (G13 baza 70 x mnoznik 1,48 z R3-A)');
  // Kotwica samego mnoznika, zeby zmiana bazy nie zamaskowala zmiany wspolczynnika:
  // stosunek prog(pop 12) / prog(pop 2) musi byc ten sam w kazdej epoce.
  near(M.szMaxForCity(1, 12, scale) / M.szMaxForCity(1, 2, scale),
    M.szMaxForCity(3, 12, scale) / M.szMaxForCity(3, 2, scale),
    'mnoznik populacji nie zalezy od epoki (prog 12/prog 2 taki sam w epokach 1 i 3)');
  // ...i jego WARTOSC, zapisana literalem — inaczej zmiana wspolczynnika przesunelaby obie
  // strony powyzszego rownania jednoczesnie i przeszlaby bez sladu.
  near(M.szMaxForCity(1, 12, scale) / M.szMaxForCity(1, 2, scale), 1.48,
    'R3-A: mnoznik populacji na pop 12 = 1,48x (0,04 skladane na 10 mieszkancow ponad populacje odniesienia)');
  eq(M.prawMaxForCity(1, 12, scale), 74.5, 'tabela: prawMax(pop 12, epoka 1) = 74,5');
  eq(M.prawMaxForCity(3, 6, scale), 117, 'tabela: prawMax(pop 6, epoka 3) = 117,0');
}

// ---------------------------------------------------------------------------
console.log('\n9. Osiagalnosc: duze miasto z REALNIE mozliwa administracja epoki');
// ---------------------------------------------------------------------------
{
  // Mianownik rosnacy z miastem ma WYMAGAC administracji, nie ODCIAC od niej. Cap ludnosci
  // to 12 (econ-params.json -> akwedukt_max_ludnosci), wiec to jest realny szczyt gry.
  //
  // RUNDA 2, zarzut 6 Final Control: asercja z rundy 1 ustawiala jednoczesnie
  // `hasDworZarzadcy: true` ORAZ `hasPretorium: true` — dwa poziomy TEGO SAMEGO lancucha
  // zastepowania, konfiguracja niemozliwa w grze. Przeglad calego bloku wykazal, ze byly
  // tam w sumie TRZY niemozliwe kombinacje naraz, nie jedna:
  //   (1) Dwor Zarzadcy + Pretorium — ten sam lancuch (buildings.json: pretorium.upgradeFrom
  //       = dwor_zarzadcy, dwor_zarzadcy.upgradeFrom = dom_starszyzny);
  //   (2) Palac III + Pretorium — Palac ma `lokalizacja: "stolica"`, caly lancuch
  //       Dom Starszyzny/Dwor Zarzadcy/Pretorium ma `lokalizacja: "region"`, a
  //       production.ts:489-490 (`buildingLocationAllowed`) zwraca dla nich odpowiednio
  //       `isCapital === true` i `isCapital === false` — miasto jest albo stolica, albo nie;
  //   (3) Palac III / Pretorium / Sad (wszystkie `epokaWejscia: 3`) postawione w epoce 1 i 2.
  // Stad ponizej: DWA rozlaczne warianty miasta (stolica i region), a w kazdym administracja
  // faktycznie dostepna w danej epoce.
  const BUILDINGS = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '..', 'data', 'buildings.json'), 'utf8'),
  );
  const bud = (id) => BUILDINGS.find((b) => b.id === id) ?? {};

  // 9a. Kotwice w danych — to one uzasadniaja podzial na dwa warianty. Gdyby ktos zmienil
  //     buildings.json tak, ze lancuchy przestaja byc rozlaczne, ta bramka ma o tym powiedziec.
  eq(bud('palac_iii').lokalizacja, 'stolica', 'buildings.json: Palac III jest budynkiem stolicy');
  eq(bud('pretorium').lokalizacja, 'region', 'buildings.json: Pretorium jest budynkiem miasta regionalnego');
  eq(bud('pretorium').upgradeFrom, 'dwor_zarzadcy', 'buildings.json: Pretorium ZASTEPUJE Dwor Zarzadcy (nie wspolistnieje)');
  eq(bud('dwor_zarzadcy').upgradeFrom, 'dom_starszyzny', 'buildings.json: Dwor Zarzadcy ZASTEPUJE Dom Starszyzny');
  eq([bud('palac_iii'), bud('pretorium'), bud('sad')].map((b) => b.epokaWejscia).join(','), '3,3,3',
    'buildings.json: Palac III / Pretorium / Sad wchodza dopiero w epoce 3');

  // 9b. Administracja faktycznie dostepna w danej epoce (epokaWejscia: Trybunal 2, Sad 3).
  const STOLICA = {
    1: { palacTier: 1 },
    2: { palacTier: 2, hasTrybunal: true },
    3: { palacTier: 3, hasTrybunal: true, hasSad: true },
  };
  const REGION = {
    1: { hasDomStarszyzny: true },
    2: { hasDworZarzadcy: true, hasTrybunal: true },
    3: { hasPretorium: true, hasTrybunal: true, hasSad: true },
  };
  // Wartosci oczekiwane PRZELICZONE na realnych konfiguracjach (nie przepisane z rundy 1).
  const OCZEK = {
    stolica: { easy: [100, 100, 100], normal: [100, 100, 100], hard: [100, 90.3, 82.6] },
    region: { easy: [100, 100, 100], normal: [100, 100, 100], hard: [100, 82, 74.5] },
  };
  for (const [wariant, SET] of [['stolica', STOLICA], ['region', REGION]]) {
    for (const diff of DIFFS) {
      const wiersz = [];
      for (const era of [1, 2, 3]) {
        const r = M.computeLawBreakdown({
          population: 12, era, difficulty: diff, garnizonCount: 5, ...SET[era],
        }, SOCIETY);
        wiersz.push(`e${era} ${r.netto}/${r.prawMax}=${r.prawPct}%`);
        eq(r.prawPct, OCZEK[wariant][diff][era - 1],
          `${wariant}/${diff}/epoka ${era}: PrawPct = ${OCZEK[wariant][diff][era - 1]}% (pop 12, garnizon 5, administracja epoki)`);
      }
      console.log(`  ${wariant.padEnd(8)} ${diff.padEnd(7)} | ${wiersz.join('  | ')}`);
    }
  }

  // 9c. Wnioski, ktore te liczby faktycznie niosa — zamiast obalonego „domyka do 100% zawsze".
  //     easy/normal: mianownik WYMAGA administracji, ale jej nie odcina — 100% nadal osiagalne.
  const easyNormalMin = Math.min(
    ...[['stolica', STOLICA], ['region', REGION]].flatMap(([, SET]) => ['easy', 'normal'].flatMap(
      (diff) => [1, 2, 3].map((era) => M.computeLawBreakdown({
        population: 12, era, difficulty: diff, garnizonCount: 5, ...SET[era],
      }, SOCIETY).prawPct),
    )),
  );
  eq(easyNormalMin, 100,
    'easy i normal: pop 12 z garnizonem 5 i pelna administracja epoki domyka Prawo do 100% w epokach 1-3 (oba warianty)');
  //     hard: juz NIE domyka — i to jest zamierzone (hard ma byc trudny), ale nie wolno, zeby
  //     spadlo to miasto w pasmo ponizej „Spokoju" po samej stronie Prawa (patrz porPctBand).
  const hardMin = Math.min(
    ...[['stolica', STOLICA], ['region', REGION]].flatMap(([, SET]) => [1, 2, 3].map(
      (era) => M.computeLawBreakdown({
        population: 12, era, difficulty: 'hard', garnizonCount: 5, ...SET[era],
      }, SOCIETY).prawPct,
    )),
  );
  ok(hardMin < 100 && hardMin >= 70,
    `hard: pelna administracja epoki NIE domyka juz Prawa do capu, ale trzyma je w granicach (min ${hardMin}%, wymagane 70-99,9%)`);
}

fs.unlinkSync(ENTRY);
fs.unlinkSync(BUNDLE);

console.log(`\n[szczescie-skala-normalizacja-test] ${passed} OK, ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
