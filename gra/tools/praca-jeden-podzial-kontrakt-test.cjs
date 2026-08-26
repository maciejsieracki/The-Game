'use strict';
/**
 * praca-jeden-podzial-kontrakt-test.cjs — BRAMKA TEMATU R-PRACA-JEDEN-PODZIAL-Q1.
 *
 * Kontrakt właściciela (ECHO 2026-08-25), sprawdzany tu wprost:
 *   1. JEDEN podział Pracy, sumujący się do 100%: ulepszenia% + budynki% = 100.
 *   2. Cap: ulepszenia ≤ 50%, budynki ≥ 50%. Nigdy odwrotnie.
 *   3. Stosowany DOKŁADNIE RAZ: ustawienie X% → do ulepszeń trafia X% Pracy.
 *   4. Identyczny mechanizm globalnie i w mieście (ten sam cap, ta sama jednostka).
 *   5. Override miasta zapala się SAM przy różnicy od globalnej; powrót go gasi.
 *   8. Pozostali konsumenci puli imperium działają dalej i nic ich nie podjada.
 *
 * REGUŁA ZAOKRĄGLENIA (jawna, wymagana przez dispatch):
 *   doBudynkow      = Math.round(total × procentBudynki/100)
 *   doPuli  = total − doBudynkow            ← reszta, NIGDY osobno zaokrąglana
 * Zaokrąglana jest TYLKO jedna strona, więc suma jest z definicji równa całkowitej
 * Pracy miasta — zero gubionych i zero zdublowanych jednostek. Konsekwencja: przy
 * Pracy niepodzielnej przez 100/X udział ulepszeń odchyla się od nominalnego X% o
 * mniej niż 1 jednostkę Pracy (nigdy o więcej, nigdy w tę samą stronę systematycznie).
 *
 * Run from gra/:  node tools/praca-jeden-podzial-kontrakt-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.UPP_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));

const ENTRY_FILE = path.resolve(__dirname, '.praca-jeden-podzial-kontrakt-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.praca-jeden-podzial-kontrakt-bundle.cjs');
fs.writeFileSync(ENTRY_FILE, `
export { splitPraca, pracaImperialPoolGain, cityPracaInteger } from ${JSON.stringify(SRC + '/game/production')};
export * as production from ${JSON.stringify(SRC + '/game/production')};
export {
  clampPodzialPracyBudynkiPercent,
  procentPuliImperiumZBudynkow,
  podzialPracyZProcentuPuli,
  MIN_PODZIAL_PRACY_BUDYNKI_PERCENT,
  MAX_PODZIAL_PRACY_BUDYNKI_PERCENT,
  MAX_PROCENT_PULI_IMPERIUM,
  DEFAULT_PODZIAL_PRACY,
  ensureCitySaveDefaults,
} from ${JSON.stringify(SRC + '/game/cities')};
export {
  applyPodzialPracyLocalChange,
  resolveCityPodzialPracy,
  migratePodzialPracyOnLoad,
} from ${JSON.stringify(SRC + '/game/empire-city-defaults')};
export { pickAutoImprovements, AUTO_ULEPSZENIA_PRACA_RESERVE } from ${JSON.stringify(SRC + '/game/auto-improvements')};
export { advanceWonderMapBuilds } from ${JSON.stringify(SRC + '/game/wonder-map-build')};
export { evaluateFoundCityAffordance } from ${JSON.stringify(SRC + '/game/city-founding')};
export { countResourceUpkeepImprovementsByOwner } from ${JSON.stringify(SRC + '/game/turn-economy')};
export { getImprovementMeta } from ${JSON.stringify(SRC + '/game/improvement-tech')};
export {
  DEFAULT_ULEPSZENIA_PRACA_PERCENT,
  PODZIAL_PRACY_PULA_LBL,
  PODZIAL_PRACY_PULA_LBL_PELNA,
  PODZIAL_PRACY_PULA_TIP,
} from ${JSON.stringify(SRC + '/game/cities')};
`, 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile: BUNDLE_FILE, absWorkingDir: GRA_ROOT,
    loader: { '.json': 'json' }, logLevel: 'silent',
  });
} catch (e) {
  console.error('[praca-jeden-podzial-kontrakt] esbuild failed:\n', e.message || e);
  process.exit(1);
}
const M = require(BUNDLE_FILE);
try { fs.unlinkSync(ENTRY_FILE); } catch (e) { /* best effort */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) { /* best effort */ }

let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg); }
}
function eq(a, b, msg) { ok(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const PRACE = [0, 1, 2, 3, 5, 6, 7, 10, 13, 20, 37, 100, 1000];
const SIATKA_ULEPSZEN = [0, 10, 20, 30, 40, 50];

console.log('-- 1. SIATKA KONTRAKTU: ustawienie X% ulepszeń → X% Pracy, suma zawsze 100% --');
{
  for (const pctU of SIATKA_ULEPSZEN) {
    const podzial = M.podzialPracyZProcentuPuli(pctU);
    eq(M.procentPuliImperiumZBudynkow(podzial.procentBudynki), pctU,
      `ustawienie ${pctU}% ulepszeń jest zachowane (nie ścinane, nie mnożone)`);
    eq(podzial.procentBudynki + pctU, 100, `${pctU}% ulepszeń + budynki = 100%`);
    for (const praca of PRACE) {
      const r = M.splitPraca(praca, podzial.procentBudynki / 100);
      // (a) NIC nie ginie i nic się nie dubluje.
      eq(r.doBudynkow + r.doPuli, r.total,
        `praca=${praca}, ulepszenia=${pctU}%: budynki+ulepszenia = cała Praca`);
      eq(r.total, M.cityPracaInteger(praca), `praca=${praca}: total = zaokrąglona Praca miasta`);
      // (b) Udział ulepszeń to DOKŁADNIE X% — z jawną regułą zaokrąglenia (< 1 jednostki).
      const nominal = r.total * pctU / 100;
      ok(Math.abs(r.doPuli - nominal) < 1,
        `praca=${praca}, ulepszenia=${pctU}%: realny udział ${r.doPuli} ≈ nominalny ${nominal} (odchyłka < 1 Pracy)`);
      // (c) Gdy nominał jest całkowity, musi być RÓWNY co do jednostki — bez „prawie".
      if (Number.isInteger(nominal)) {
        eq(r.doPuli, nominal,
          `praca=${praca}, ulepszenia=${pctU}%: nominał całkowity → udział DOKŁADNIE ${nominal}`);
      }
      // (d) Reguła zaokrąglenia jest tą udokumentowaną, nie inną.
      eq(r.doBudynkow, Math.round(r.total * podzial.procentBudynki / 100),
        `praca=${praca}, ulepszenia=${pctU}%: doBudynkow = round(total × %budynki)`);
    }
  }
}

console.log('\n-- 2. REGRES ZE ZGŁOSZENIA: domyślne ustawienia NIE dają już 0% na ulepszenia --');
{
  // Zmierzone przed zmianą (dispatch): 10 Pracy, domyślne 70% budynki / 33% ulepszenia
  // (drugi suwak) → do ulepszeń trafiało DOKŁADNIE 0. Po przebudowie ta sama Praca przy
  // domyślnym podziale ma dać nominalne 30%.
  const domyslny = M.DEFAULT_PODZIAL_PRACY.procentBudynki;
  eq(domyslny, 70, 'domyślny podział to nadal 70% budynki');
  const r = M.splitPraca(10, domyslny / 100);
  eq(r.doPuli, 3, '10 Pracy, ustawienia domyślne → 3 na ulepszenia (było 0 — regres zamknięty)');
  eq(r.doBudynkow, 7, '10 Pracy, ustawienia domyślne → 7 na budynki');
  // Maksymalne suwaki: obiecane 50% ma być realne 50%, nie ~20%.
  const maks = M.splitPraca(10, M.MIN_PODZIAL_PRACY_BUDYNKI_PERCENT / 100);
  eq(maks.doPuli, 5, '10 Pracy, suwak na maksimum → 5 na ulepszenia (było 2 = 20%)');
  eq(maks.doBudynkow, 5, '10 Pracy, suwak na maksimum → 5 na budynki');
}

console.log('\n-- 3. CAP: > 50% na ulepszenia jest NIEOSIĄGALNE (suwak, zapis, override) --');
{
  for (const zadanie of [51, 60, 75, 99, 100, 150]) {
    const podzial = M.podzialPracyZProcentuPuli(zadanie);
    eq(podzial.procentBudynki, 50, `żądanie ${zadanie}% ulepszeń → budynki 50% (cap)`);
    eq(M.procentPuliImperiumZBudynkow(podzial.procentBudynki), 50, `żądanie ${zadanie}% ulepszeń → 50% (cap)`);
  }
  // Wartość NIELICZBOWA (Infinity/NaN/null) nie jest „żądaniem 100%" — to brak wartości,
  // więc wraca domyślna, tak samo jak w clampPodzialPracyBudynkiPercent. W żadnym
  // wypadku nie może przekroczyć capu.
  for (const zadanie of [Infinity, -Infinity, NaN, null, undefined]) {
    const podzial = M.podzialPracyZProcentuPuli(zadanie);
    eq(podzial.procentBudynki, M.DEFAULT_PODZIAL_PRACY.procentBudynki,
      `żądanie ${String(zadanie)}% ulepszeń → wartość domyślna (brak wartości ≠ 100%)`);
    ok(M.procentPuliImperiumZBudynkow(podzial.procentBudynki) <= M.MAX_PROCENT_PULI_IMPERIUM,
      `żądanie ${String(zadanie)}% ulepszeń nigdy nie przekracza capu 50%`);
  }
  // Twarda postać capu, W JEDNOSTKACH Pracy — ostrzejsza niż porównanie procentów.
  // Przy remisie zaokrąglenia (.5) nadwyżka idzie do BUDYNKÓW, czyli w stronę wymaganą
  // przez właściciela („nigdy w drugą stronę"), nigdy do ulepszeń.
  for (const pctU of SIATKA_ULEPSZEN) {
    const podzial = M.podzialPracyZProcentuPuli(pctU);
    for (const total of PRACE) {
      const r = M.splitPraca(total, podzial.procentBudynki / 100);
      ok(2 * r.doPuli <= r.total,
        `ulepszenia ${pctU}%, praca=${total}: udział ulepszeń nigdy nie przekracza połowy Pracy`);
      ok(2 * r.doBudynkow >= r.total,
        `ulepszenia ${pctU}%, praca=${total}: budynki nigdy poniżej połowy Pracy`);
    }
  }
  // Zapis (stary save / ręcznie zmodyfikowany JSON) też nie przemyci >50%.
  for (const zapis of [0, 10, 25, 49, -100, NaN]) {
    ok(M.clampPodzialPracyBudynkiPercent(zapis) >= M.MIN_PODZIAL_PRACY_BUDYNKI_PERCENT,
      `zapis procentBudynki=${zapis} → nigdy poniżej 50% dla budynków`);
  }
  // Override miasta z nielegalną wartością również jest przycinany.
  const city = { ownerId: 0, podzialPracyOverride: true, podzialPracy: { procentBudynki: 10 } };
  eq(M.resolveCityPodzialPracy(city, { procentBudynki: 70 }).procentBudynki, 50,
    'override miasta 10% budynków → przycięty do 50% przy odczycie');
  // Migracja starego zapisu (KAŻDA ścieżka) też przycina.
  const cities = [{ ownerId: 0, podzialPracyOverride: true, podzialPracy: { procentBudynki: 5 } }];
  const defaults = new Map();
  M.migratePodzialPracyOnLoad(cities, defaults, [[0, { procentBudynki: 70 }]]);
  eq(cities[0].podzialPracy.procentBudynki, 50, 'migracja: override 5% budynków przycięty do 50%');
}

console.log('\n-- 4. IDENTYCZNY MECHANIZM globalnie i w mieście (ten sam cap, ta sama jednostka) --');
{
  eq(M.MAX_PROCENT_PULI_IMPERIUM, 100 - M.MIN_PODZIAL_PRACY_BUDYNKI_PERCENT,
    'cap globalny jest wyliczony z tego samego minimum co cap miasta');
  for (const pctU of SIATKA_ULEPSZEN) {
    const globalny = M.podzialPracyZProcentuPuli(pctU);
    const miasto = { ownerId: 0, podzialPracyOverride: true, podzialPracy: { procentBudynki: globalny.procentBudynki } };
    eq(M.resolveCityPodzialPracy(miasto, globalny).procentBudynki, globalny.procentBudynki,
      `${pctU}% ulepszeń: miasto i imperium dają identyczną wartość`);
    const rG = M.splitPraca(17, globalny.procentBudynki / 100);
    const rM = M.splitPraca(17, M.resolveCityPodzialPracy(miasto, globalny).procentBudynki / 100);
    eq(rM.doPuli, rG.doPuli, `${pctU}% ulepszeń: identyczny wynik w mieście i globalnie`);
  }
}

console.log('\n-- 5. OVERRIDE MIASTA (pkt 5): zapala się SAM przy różnicy, gaśnie przy powrocie --');
{
  const globalny = { procentBudynki: 70 };
  const rowna = M.applyPodzialPracyLocalChange(70, globalny);
  eq(rowna.podzialPracyOverride, false, 'wartość równa globalnej → override zgaszony');
  eq(rowna.podzialPracy, undefined, 'wartość równa globalnej → pole lokalne skasowane (miasto śledzi globalną)');

  const rozna = M.applyPodzialPracyLocalChange(50, globalny);
  eq(rozna.podzialPracyOverride, true, 'wartość różna od globalnej → override zapalony SAM, bez klikania');
  eq(rozna.podzialPracy.procentBudynki, 50, 'wartość różna od globalnej → zapisana lokalnie');

  const powrot = M.applyPodzialPracyLocalChange(70, globalny);
  eq(powrot.podzialPracyOverride, false, 'powrót do wartości globalnej → override gaśnie');
  eq(powrot.podzialPracy, undefined, 'powrót do wartości globalnej → pole lokalne skasowane');

  // Zmiana globalnej przesuwa punkt odniesienia: 50 przestaje być „inne", gdy globalna = 50.
  const poZmianieGlobalnej = M.applyPodzialPracyLocalChange(50, { procentBudynki: 50 });
  eq(poZmianieGlobalnej.podzialPracyOverride, false,
    'gdy globalna = 50, ustawienie 50 w mieście NIE zapala override');
  // Wartość nielegalna jest najpierw przycięta, dopiero potem porównana.
  const nielegalna = M.applyPodzialPracyLocalChange(10, { procentBudynki: 50 });
  eq(nielegalna.podzialPracyOverride, false,
    'żądanie 10% budynków przycięte do 50% = globalna → override NIE zapala się na sztucznej różnicy');
  // Suwak NIE jest zablokowany: każda legalna wartość przechodzi.
  for (const v of [50, 60, 70, 80, 90, 100]) {
    const r = M.applyPodzialPracyLocalChange(v, globalny);
    const zapisana = r.podzialPracy ? r.podzialPracy.procentBudynki : globalny.procentBudynki;
    eq(zapisana, v, `suwak miasta przyjmuje ${v}% budynków (nie jest zablokowany)`);
  }
}

console.log('\n-- 6. ZERO PODWÓJNEGO LICZENIA: drugi podział nie istnieje --');
{
  // Te trzy asercje są BEHAWIORALNE: pytają ZBUNDLOWANY moduł, nie tekst pliku.
  eq(typeof M.production.splitEmpirePracaBudget, 'undefined', 'splitEmpirePracaBudget nie istnieje');
  eq(typeof M.production.allocateEmpirePracaToBuildings, 'undefined', 'allocateEmpirePracaToBuildings nie istnieje');
  eq(typeof M.production.splitPraca, 'function', 'jedyny podział (splitPraca) istnieje i jest funkcją');
  const mainSrc = fs.readFileSync(path.resolve(SRC, 'main.ts'), 'utf8');
  const mainCode = mainSrc
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n').filter(l => !/^\s*(\/\/|\*)/.test(l)).join('\n');
  ok(!/\bsplitEmpirePracaBudget\s*\(/.test(mainCode), 'main.ts nie woła drugiego podziału');
  ok(!/\bapplyEmpireBuildingBudget\s*\(/.test(mainCode), 'main.ts nie oddaje puli z powrotem do budynków');
  ok(!/ownerDefaultPracaSplit\.set\(/.test(mainCode), 'drugi, niezależny suwak ownera nie istnieje');
  // splitPraca jest wołany raz na ścieżkę ekonomii (podgląd + realny tick), nie kaskadowo.
  const turnSrc = fs.readFileSync(path.resolve(SRC, 'game', 'turn-economy.ts'), 'utf8');
  eq((turnSrc.match(/=\s*splitPraca\(/g) || []).length, 2,
    'turn-economy.ts: dokładnie 2 wywołania splitPraca (previewCityEconomy + advanceCityEconomy)');
  // RUNDA 2 (F3): USUNIĘTE dwa „dowody nietautologiczności" tej sekcji — `ok(!/…/.test('') === true)`
  // (regex przeciw pustemu stringowi) oraz test regexa na stringu, do którego dopisano szukany
  // wzorzec. Oba były samospełniające się: świeciły niezależnie od stanu kodu. Nietautologiczność
  // asercji negatywnych wyżej dowodzi się URUCHOMIENIEM tej bramki na zmutowanej KOPII źródła
  // (`UPP_SRC_DIR=/ścieżka/do/kopii node tools/praca-jeden-podzial-kontrakt-test.cjs`) — wynik
  // takiego przebiegu jest raportowany przez Operatora, a nie udawany wewnątrz pliku.
}

console.log('\n-- 7. KONSUMENCI PULI IMPERIUM (pkt 8 / kryterium 5) — DOWÓD BEHAWIORALNY --');
{
  // RUNDA 2 (F3): poprzednia wersja tej sekcji dowodziła „konsumenci działają dalej"
  // WYŁĄCZNIE regexami po tekście main.ts — asercja świeciła, choć zmierzone zachowanie
  // auto-ulepszeń to było 0 wywołań (bloker F1). Teraz przepuszczamy PRAWDZIWE tury przez
  // PRAWDZIWE funkcje każdego konsumenta i mierzymy, ile Pracy KAŻDY z nich faktycznie
  // zabrał z puli. Księga musi się domykać: wpływ = suma wydatków + saldo końcowe.
  const RES = M.AUTO_ULEPSZENIA_PRACA_RESERVE;
  const PCT_AUTO = M.DEFAULT_ULEPSZENIA_PRACA_PERCENT;

  function makeFlatMap(w, h) {
    const hexes = {};
    for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
      hexes[`${q},${r}`] = {
        coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak',
        wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
    return { szerokoscQ: w, wysokoscR: h, hexes, seed: 42, riverPaths: [] };
  }

  /**
   * Jedna symulacja: T tur, jedno miasto, wspólna pula imperium. Kolejność drenaży
   * odwzorowuje main.ts (utrzymanie → cuda na mapie → automat ulepszeń → akcje gracza).
   * `wiring` decyduje, JAK silnik podaje pickerowi budżet:
   *   'saldo'    — tak jak po naprawie F1: picker liczy pułap sam, % SKUMULOWANEJ puli;
   *   'przyrost' — tak jak w rundzie 1: absolutny cap = tegoroczny wpływ do puli.
   */
  function przepuscTury({ tur, pracaMiasta, procentBudynki, wiring }) {
    const map = makeFlatMap(34, 34);
    const city = { id: 'c1', ownerId: 0, q: 15, r: 15, name: 'Test', population: 6 };
    const territoryNodes = [{ q: 15, r: 15, pop: 6, level: 1, ownerId: 0 }];
    const placed = new Map();
    // Dwa ulepszenia surowcowe postawione „ręcznie" — realne wejście dla licznika utrzymania.
    map.hexes['14,15'].ulepszenie = 'kopalnia_zelaza';
    map.hexes['16,15'].ulepszenie = 'tartak';
    const wonderSites = [{ wonderId: 'test-cud', q: 15, r: 16, ownerId: 0, postep: 0 }];
    const kosztCudu = () => 120;
    const wyrabKoszt = (M.getImprovementMeta('wyrab') || {}).kosztPraca ?? 0;

    let pula = 0;
    let sites = wonderSites;
    const wydatki = { utrzymanie: 0, cuda: 0, ulepszeniaAuto: 0, zalozenieMiasta: 0, wycinka: 0 };
    let wplywRazem = 0;
    let pierwszeUlepszenieWTurze = null;
    let ujemnaPula = false;

    for (let t = 1; t <= tur; t++) {
      // (1) WPŁYW — jedyny podział Pracy miasta, prawdziwy splitPraca.
      const split = M.splitPraca(pracaMiasta, procentBudynki / 100);
      pula += split.doPuli;
      wplywRazem += split.doPuli;
      const wplywTejTury = split.doPuli;

      // (2) UTRZYMANIE ulepszeń surowcowych — prawdziwy licznik z turn-economy.
      const liczbaPlatnych = M.countResourceUpkeepImprovementsByOwner(map, territoryNodes).get(0) ?? 0;
      const upkeep = Math.min(pula, liczbaPlatnych * 1); // koszt/ulepszenie z econ-params (placeholder 1)
      pula -= upkeep;
      wydatki.utrzymanie += upkeep;

      // (3) CUDA NA MAPIE — prawdziwe advanceWonderMapBuilds, płacone z tej samej puli.
      const cud = M.advanceWonderMapBuilds(sites, 0, pula, kosztCudu);
      sites = cud.sites;
      pula -= cud.pracaUsed;
      wydatki.cuda += cud.pracaUsed;

      // (4) AUTOMAT ULEPSZEŃ TERENU — prawdziwy pickAutoImprovements, tak jak woła go silnik.
      const opts = {
        cities: [city], ownerId: 0, map, territoryNodes, placedImprovements: placed,
        pracaAvailable: pula,
        unlockedTechs: new Set(['Rolnictwo', 'Kamieniarstwo']),
        pracaSurplusThreshold: RES,
        skipWyrab: true, civArchetype: 'grecy',
        getFocus: () => 'zywnosc',
        pracaBudgetPercent: wiring === 'przyrost' ? 100 : PCT_AUTO,
      };
      if (wiring === 'przyrost') opts.improvementBudgetCap = wplywTejTury;
      for (const pick of M.pickAutoImprovements(opts)) {
        if (pula < pick.kosztPraca) continue;
        if (pula - pick.kosztPraca < RES) continue;
        pula -= pick.kosztPraca;
        wydatki.ulepszeniaAuto += pick.kosztPraca;
        const hk = `${pick.q},${pick.r}`;
        placed.set(hk, [...(placed.get(hk) ?? []), pick.key]);
        if (pierwszeUlepszenieWTurze === null) pierwszeUlepszenieWTurze = t;
      }

      // (5) ZAŁOŻENIE MIASTA — prawdziwe evaluateFoundCityAffordance (koszt kolejnego miasta).
      if (t === Math.floor(tur / 2)) {
        const aff = M.evaluateFoundCityAffordance(pula, [city], 0);
        if (aff.ok && aff.kosztPraca > 0) {
          pula -= aff.kosztPraca;
          wydatki.zalozenieMiasta += aff.kosztPraca;
        }
      }

      // (6) WYCINKA LASU — koszt startu z prawdziwej metadanej ulepszenia „wyrab".
      if (t === tur && wyrabKoszt > 0 && pula >= wyrabKoszt) {
        pula -= wyrabKoszt;
        wydatki.wycinka += wyrabKoszt;
      }

      if (pula < 0) ujemnaPula = true;
    }
    const wydane = Object.values(wydatki).reduce((a, b) => a + b, 0);
    return { pula, wplywRazem, wydatki, wydane, pierwszeUlepszenieWTurze, ujemnaPula };
  }

  // --- 7a. Wszyscy konsumenci realnie dostają Pracę z puli (nie regex — pomiar). ---
  const sym = przepuscTury({ tur: 40, pracaMiasta: 40, procentBudynki: 70, wiring: 'saldo' });
  ok(sym.wydatki.utrzymanie > 0,
    `konsument puli DOSTAŁ Pracę: utrzymanie ulepszeń surowcowych (${sym.wydatki.utrzymanie} Pracy w 40 turach)`);
  ok(sym.wydatki.cuda > 0,
    `konsument puli DOSTAŁ Pracę: cuda na mapie (${sym.wydatki.cuda} Pracy)`);
  ok(sym.wydatki.ulepszeniaAuto > 0,
    `konsument puli DOSTAŁ Pracę: automat ulepszeń terenu (${sym.wydatki.ulepszeniaAuto} Pracy)`);
  ok(sym.wydatki.zalozenieMiasta > 0,
    `konsument puli DOSTAŁ Pracę: założenie kolejnego miasta (${sym.wydatki.zalozenieMiasta} Pracy)`);
  ok(sym.wydatki.wycinka > 0,
    `konsument puli DOSTAŁ Pracę: wycinka lasu (${sym.wydatki.wycinka} Pracy)`);
  ok(!sym.ujemnaPula, 'pula NIGDY nie schodzi poniżej zera mimo pięciu równoległych konsumentów');
  eq(sym.wplywRazem, sym.wydane + sym.pula,
    'księga puli domyka się: wpływ = suma wydatków wszystkich konsumentów + saldo końcowe');

  // --- 7b. F1: budżet automatu liczony od SKUMULOWANEJ puli, nie od przyrostu tury. ---
  // R-AUTO-PRACA-BUDZET-PROCENT-Q1=B (decyzja właściciela): „% budżetu Pracy liczonym od
  // SKUMULOWANEJ puli Pracy na WEJŚCIU do wywołania (nie od przyrostu)". Runda 1 podała
  // pickerowi absolutny cap = tegoroczny wpływ; ponieważ picker kupuje ulepszenie tylko gdy
  // CAŁY koszt mieści się w capie, a najtańsze kosztuje 30+ Pracy, poniżej ~40 Pracy przyrostu
  // NA TURĘ powstawało ZERO ulepszeń — niezależnie od wielkości puli. Ta para asercji jest
  // wbudowaną kontrolą negatywną: to samo wejście, jedyna różnica to sposób podania budżetu.
  for (const pracaMiasta of [20, 30, 40, 60, 80, 120]) {
    // 80 tur: przy najmniejszym wpływie (6/turę) pula musi się najpierw uzbierać — o to
    // dokładnie chodzi w semantyce „% skumulowanej puli". Kontrola negatywna (budżet z
    // przyrostu) nie zbuduje NIC nawet przy 80 turach, bo cap nigdy nie sięga kosztu.
    const saldo = przepuscTury({ tur: 80, pracaMiasta, procentBudynki: 70, wiring: 'saldo' });
    const przyrost = przepuscTury({ tur: 80, pracaMiasta, procentBudynki: 70, wiring: 'przyrost' });
    const wplyw = M.splitPraca(pracaMiasta, 0.70).doPuli;
    ok(saldo.wydatki.ulepszeniaAuto > 0,
      `wpływ ${wplyw} Pracy/turę: automat ulepszeń DZIAŁA (wydał ${saldo.wydatki.ulepszeniaAuto} Pracy, `
      + `pierwsze ulepszenie w turze ${saldo.pierwszeUlepszenieWTurze})`);
    if (wplyw < 40) {
      eq(przyrost.wydatki.ulepszeniaAuto, 0,
        `kontrola negatywna: przy budżecie z PRZYROSTU (runda 1) ten sam wpływ ${wplyw}/turę daje 0 Pracy na ulepszenia`);
    }
  }
  // Skumulowana pula nie jest „martwym zapasem": im większa, tym większy pułap jednej tury.
  {
    const maly = przepuscTury({ tur: 12, pracaMiasta: 40, procentBudynki: 70, wiring: 'saldo' });
    const duzy = przepuscTury({ tur: 40, pracaMiasta: 40, procentBudynki: 70, wiring: 'saldo' });
    ok(duzy.wydatki.ulepszeniaAuto > maly.wydatki.ulepszeniaAuto,
      'dłuższa akumulacja puli → automat wydaje na ulepszenia WIĘCEJ (pułap rośnie z saldem, nie z przyrostem)');
  }
  // --- 7c. WIRING SILNIKA: `main.ts` faktycznie woła picker w semantyce z 7b. ---
  // `main.ts` (30 tys. linii, wejście Vite z SVG/audio) nie daje się zbundlować w bramce —
  // ten sam udokumentowany limit, co w `empire-praca-panel-coverage-test.cjs`. Dlatego
  // semantyka jest dowiedziona BEHAWIORALNIE w 7b (na prawdziwym pickerze), a tutaj pinujemy
  // WYCIĘTY, prawdziwy blok wywołania — trzy asercje, które razem wykluczają powrót progu.
  {
    const mainSrc = fs.readFileSync(path.resolve(SRC, 'main.ts'), 'utf8');
    const mainCode = mainSrc.replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n').filter(l => !/^\s*(\/\/|\*)/.test(l)).join('\n');
    ok(!/pracaPoolInflowByOwner/.test(mainCode),
      'main.ts nie liczy już budżetu ulepszeń z tegorocznego wpływu do puli');
    const i = mainCode.indexOf('const picks = pickAutoImprovements({');
    ok(i > -1, 'main.ts: znaleziono wywołanie pickera auto-ulepszeń gracza');
    const blok = i > -1 ? mainCode.slice(i, mainCode.indexOf('\n                });', i)) : '';
    ok(/pracaAvailable:\s*playerPracaPool/.test(blok),
      'wywołanie pickera: bazą % jest SKUMULOWANA pula gracza (playerPracaPool), nie przyrost tury');
    ok(/pracaBudgetPercent:\s*playerUlepszeniaPolicy\.pracaAutoPercent/.test(blok),
      'wywołanie pickera: % pochodzi z polityki imperium (pracaAutoPercent), nie z twardego 100');
    ok(!/improvementBudgetCap/.test(blok),
      'wywołanie pickera: silnik NIE podaje absolutnego capu — pułap liczy picker od skumulowanej puli');
  }
}

console.log('\n-- 8. NAZWY W UI (pkt 6): jedna nazwa strumienia we WSZYSTKICH panelach --');
{
  // RUNDA 2 (F2): runda 1 ujednoliciła tylko `cityPanel.ts` (pokryty bramką real-render),
  // więc `empireDetailPanel.ts` został z TRZECIĄ nazwą tej samej liczby („Ulepszenia" bez
  // kwalifikatora) i tooltipem opisującym USUNIĘTY drugi podział. Dowód nie jest tu regexem
  // po źródle: WYCINAMY prawdziwy kod obu funkcji renderujących i URUCHAMIAMY go
  // (`new Function`) na podstawionych zależnościach — asercje patrzą na FAKTYCZNIE
  // wyprodukowany HTML. Ten sam wzorzec, co `empire-praca-panel-coverage-test.cjs`
  // (render() `empireDetailPanel.ts` nie daje się zbundlować esbuildem — SVG/audio loadery).
  const LBL = M.PODZIAL_PRACY_PULA_LBL;
  const LBL_PELNA = M.PODZIAL_PRACY_PULA_LBL_PELNA;

  function wytnij(plik, naglowek, koniec) {
    const src = fs.readFileSync(plik, 'utf8');
    const i = src.indexOf(naglowek);
    if (i < 0) return null;
    const j = src.indexOf(koniec, i);
    if (j < 0) return null;
    return src.slice(i + naglowek.length, j);
  }

  // (a) PANEL IMPERIUM — empireDetailPanel.ts, sekcja podziału Pracy.
  const empBody = wytnij(
    path.resolve(SRC, 'ui', 'empireDetailPanel.ts'),
    'function renderEmpirePracaBudgetSplitSection(): string {',
    '  queueMicrotask(() => {',
  );
  ok(empBody !== null, 'empireDetailPanel.ts: sekcja podziału Pracy znaleziona i wycięta ze źródła');
  function renderEmp(lbl, lblPelna) {
    const fn = new Function(
      'empireGlobalDefaultsUi', 'procentPuliImperiumZBudynkow', 'MAX_PROCENT_PULI_IMPERIUM',
      'PODZIAL_PRACY_PULA_LBL', 'PODZIAL_PRACY_PULA_LBL_PELNA', 'PODZIAL_PRACY_PULA_TIP',
      'esc', 'laborSliderFillStyle',
      empBody + '\n  return h;\n',
    );
    return fn(
      { getOwnerDefaultPodzialPracy: () => ({ procentBudynki: 70 }), onOwnerDefaultPodzialPracyChange: () => {} },
      (pb) => 100 - pb,
      50, lbl, lblPelna, M.PODZIAL_PRACY_PULA_TIP,
      (x) => String(x).replace(/"/g, '&quot;'),
      () => 'linear-gradient(x)',
    );
  }
  const empHtml = renderEmp(LBL, LBL_PELNA);
  ok(typeof empHtml === 'string' && empHtml.length > 0, 'panel imperium: sekcja realnie wyprodukowała HTML');
  ok(empHtml.includes(LBL), `panel imperium: strumień nazwany „${LBL}" (był samym „Ulepszenia")`);
  ok(!/>Ulepszenia\s+\d+%</.test(empHtml),
    'panel imperium: hero NIE mówi już samego „Ulepszenia N%" (root cause ośmiu nawrotów)');
  ok(!/Nadrzędny podział całej puli/.test(empHtml),
    'panel imperium: tooltip NIE opisuje już usuniętego drugiego podziału');
  ok(empHtml.includes('Ten sam suwak działa globalnie i w mieście'),
    'panel imperium: tooltip mówi, czym ten suwak NAPRAWDĘ jest (jeden podział Pracy miasta)');
  ok(empHtml.includes('cuda na mapie'),
    'panel imperium: tooltip nazywa pozostałych konsumentów puli (cuda, miasta, wycinka, utrzymanie)');
  // Kontrola negatywna (mutacja JEDNEJ zmiennej wejściowej, nie zmiana asercji):
  const empMut = renderEmp('Ulepszenia', 'Ulepszenia');
  ok(/>Ulepszenia\s+\d+%</.test(empMut),
    'kontrola negatywna: przywrócenie gołej etykiety „Ulepszenia" zapala asercję hero (test nie jest tautologią)');

  // (b) HUD TRYBU BUDOWY — buildModeHud.ts.
  // R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1 — AKTUALIZACJA ASERCJI (uzasadnienie w 01-operator.md):
  //   CO PILNOWALY (do tej zmiany): ze TRZECI egzemplarz suwaka warstwy (a)
  //     (`CityPodzialPracy.procentBudynki` — podzial Pracy miasta: budynki vs pula imperium,
  //     0–50%), renderowany w panelu trybu budowy przez `renderEmpirePracaSplit()`, nazywa
  //     ten strumien TA SAMA nazwa co panel imperium i panel miasta.
  //   DLACZEGO STARY WARUNEK PRZESTAL BYC PRAWDA: ECHO wlasciciela — „w tym miejscu podzial
  //     pracy nie jest potrzebny, bo jest dublowany juz w pool imperium". Trzeci egzemplarz
  //     warstwy (a) zostal z panelu trybu budowy USUNIETY w calosci (funkcja, wstawienie,
  //     handler, CSS, pozycje kontraktu, podpiecie w main.ts). Asercja o jego nazwie nie ma
  //     juz czego pilnowac — nie zostala rozluzniona, tylko jej przedmiot przestal istniec.
  //   CO PILNUJE TERAZ (warunek MOCNIEJSZY, nie slabszy): ze warstwa (a) NIE WROCI do tego
  //     panelu — ani jako funkcja renderujaca, ani jako markup, ani jako pozycja kontraktu,
  //     ani jako import nazw warstwy (a). Kazda z czterech wlasnosci ma wlasna kontrole
  //     negatywna: syntetyczny mutant zrodla (ponownie wstawiony blok) MUSI zapalic asercje.
  {
    const HUD = path.resolve(SRC, 'ui', 'buildModeHud.ts');
    const hudSrc = fs.readFileSync(HUD, 'utf8');

    /** Cztery niezalezne sygnatury TRZECIEGO egzemplarza warstwy (a) w panelu trybu budowy. */
    function sygnaturyWarstwyA(src) {
      return {
        funkcja: /function\s+renderEmpirePracaSplit\s*\(/.test(src),
        markup: /civ-build-global-split|data-praca-empire-split|data-praca-split-scope/.test(src),
        kontrakt: /^\s*(getEmpirePracaSplit|onEmpirePracaSplitChange)\??\s*:/m.test(src),
        importNazwWarstwyA: /^\s*PODZIAL_PRACY_PULA_(LBL|LBL_PELNA|TIP),\s*$/m.test(src),
      };
    }

    const teraz = sygnaturyWarstwyA(hudSrc);
    ok(teraz.funkcja === false,
      'HUD budowy: renderEmpirePracaSplit() (warstwa (a) — CityPodzialPracy.procentBudynki) usunieta');
    ok(teraz.markup === false,
      'HUD budowy: markup suwaka warstwy (a) (civ-build-global-split / data-praca-empire-split) nie wystepuje');
    ok(teraz.kontrakt === false,
      'HUD budowy: getEmpirePracaSplit/onEmpirePracaSplitChange nie sa juz pozycjami BuildModeHudConfig');
    ok(teraz.importNazwWarstwyA === false,
      'HUD budowy: nazwy warstwy (a) (PODZIAL_PRACY_PULA_LBL*/TIP) nie sa juz importowane do tego panelu');

    // Kontrola negatywna: mutant = zrodlo z PONOWNIE wstawionym blokiem warstwy (a).
    // Kazda z czterech asercji wyzej MUSI na nim zapalic sie na czerwono.
    const mutant = hudSrc
      .replace("import {\n  MAX_PROCENT_PULI_IMPERIUM,",
        "import {\n  PODZIAL_PRACY_PULA_LBL,\n  PODZIAL_PRACY_PULA_LBL_PELNA,\n  PODZIAL_PRACY_PULA_TIP,\n  MAX_PROCENT_PULI_IMPERIUM,")
      .replace('export interface BuildModeHudConfig {',
        'export interface BuildModeHudConfig {\n  getEmpirePracaSplit?: () => number | null;\n  onEmpirePracaSplitChange?: (procentPuliImperium: number) => void;')
      .replace('/** Montuje banner',
        'function renderEmpirePracaSplit(pct: number): string {\n'
        + '  return \'<div class="civ-build-global-split" data-praca-split-scope="empire">\'\n'
        + '    + `<input data-praca-empire-split value="${pct}" />` + \'</div>\';\n}\n\n/** Montuje banner');
    const poMutacji = sygnaturyWarstwyA(mutant);
    ok(poMutacji.funkcja === true,
      'kontrola negatywna: po ponownym wstawieniu renderEmpirePracaSplit() asercja o funkcji PADA (nie tautologia)');
    ok(poMutacji.markup === true,
      'kontrola negatywna: po ponownym wstawieniu markupu asercja o markupie PADA (nie tautologia)');
    ok(poMutacji.kontrakt === true,
      'kontrola negatywna: po przywroceniu pozycji kontraktu asercja o kontrakcie PADA (nie tautologia)');
    ok(poMutacji.importNazwWarstwyA === true,
      'kontrola negatywna: po przywroceniu importu nazw warstwy (a) asercja o imporcie PADA (nie tautologia)');

    // Warstwa (a) ma ZOSTAC w swoich dwoch prawowitych miejscach — tu tylko kotwica zrodlowa,
    // pomiar zachowania jest w praca-panel-budowy-warstwa-real-render-test.cjs.
    ok(/function renderEmpirePracaBudgetSplitSection\(\): string \{/.test(
      fs.readFileSync(path.resolve(SRC, 'ui', 'empireDetailPanel.ts'), 'utf8')),
      'panel imperium NADAL renderuje warstwe (a) (renderEmpirePracaBudgetSplitSection nietkniete)');
    ok(/PODZIAL_PRACY_PULA_LBL/.test(fs.readFileSync(path.resolve(SRC, 'ui', 'cityPanel.ts'), 'utf8')),
      'panel miasta NADAL uzywa wspolnej nazwy warstwy (a) (cityPanel.ts nietkniete)');

    // Panel trybu budowy zachowuje WARSTWE (c) — `UlepszeniaEmpirePolicy.pracaAutoPercent`
    // i `City.ulepszeniaPracaPercent` (0–100%). To ona jest wlasciwa warstwa tego panelu.
    ok(/data-ulepszenia-\$\{scope\}-percent/.test(hudSrc),
      'HUD budowy: suwak warstwy (c) (pracaAutoPercent) nadal jest renderowany');
  }

  // (c) Panele mowiace o warstwie (a) czytaja JEDNO zrodlo nazwy.
  // R-PRACA-PANEL-BUDOWY-WLASCIWA-WARSTWA-Q1 — z listy wypadl `buildModeHud.ts`, bo od tej
  // zmiany NIE renderuje warstwy (a) w ogole (wyzej: cztery asercje + cztery kontrole
  // negatywne). Wlasnosc „jedna nazwa dla warstwy (a)" pilnowana jest dalej, dla obu
  // panelow, ktore ta warstwe renderuja.
  for (const [nazwa, plik] of [
    ['cityPanel.ts', path.resolve(SRC, 'ui', 'cityPanel.ts')],
    ['empireDetailPanel.ts', path.resolve(SRC, 'ui', 'empireDetailPanel.ts')],
  ]) {
    const src = fs.readFileSync(plik, 'utf8');
    ok(/PODZIAL_PRACY_PULA_LBL/.test(src),
      `${nazwa}: nazwa strumienia warstwy (a) pochodzi ze WSPOLNEJ stalej, nie z wlasnego literalu`);
  }
}

console.log(`\n--- praca-jeden-podzial-kontrakt-test: ${passed} OK, ${failed} FAIL ---`);
process.exit(failed > 0 ? 1 : 0);
