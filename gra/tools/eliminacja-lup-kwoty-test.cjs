'use strict';
/**
 * eliminacja-lup-kwoty-test.cjs -- R-MIASTA-ELIMINACJA-LUP-KWOTY-Q1,
 * przepisana w R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1 (runda 2, ratyfikacja orkiestratora).
 *
 * SENS BRAMKI JEST NIEZMIENIONY: „komunikat eliminacji podaje graczowi KONKRETNE,
 * sprawdzalne kwoty zlota/nauki (i liczbe technologii oraz Mocy) faktycznie przejetych --
 * nie ogolniki". Zmienil sie WYLACZNIE NOSNIK tresci: przed R-MIASTA-ZDOBYCIE-RAPORT-
 * TROFEA-Q1 byl to JEDEN sklejony string `eliminatedDetails`, dzis jest to LISTA POZYCJI
 * etykieta/wartosc (`CaptureReportRow[]`, `buildCityCaptureReportRows`), splaszczana do
 * jednej linii przez `captureReportOneLine` dla toastow.
 *
 * DLACZEGO PRZEPISANA (a nie wycofana): stara wersja wycinala z main.ts literal
 *   `${skarbiecText}${naukaText} ${outcome.techSkopiowane.length} tech(y) przejęte. Zdobycze Power: +${lostPower}.`
 * i asercjonowala go doslownie. Usuniecia dokladnie tego literalu zada GOAL 2 pkt 2
 * i GOAL 5 pkt 4 dispatchu R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1 (defekt E3 „tech(y)",
 * defekt E4 nieprzetlumaczone „Power"). Sprzecznosc byla w dispatchu, nie w wytworze;
 * orkiestrator rozstrzygnal ja rozszerzeniem allowlisty o TEN plik, z jawnym zakazem
 * oslabienia bramki. Mapowanie 1:1 kazdej starej asercji na nowa jest w raporcie
 * `dyspozycje/autobot/runs/R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1/04-operator-runda2.md`
 * oraz w znacznikach `[<- Xy]` przy kazdej asercji nizej.
 *
 * METODA (mocniejsza niz przed przepisaniem -- runtime zamiast lektury zrodla):
 *   1. Z main.ts wycinany jest BLOK CZYSTY (markery `BLOK CZYSTY: POCZATEK/KONIEC`)
 *      i URUCHAMIANY -- stad prawdziwe `buildCityCaptureReportRows`/`captureReportOneLine`.
 *   2. Z main.ts wycinane jest DOKLADNE MIEJSCE WYWOLANIA z galezi eliminacji
 *      (`const eliminationRows = buildCityCaptureReportRows({ ... })` az po
 *      `const eliminatedDetails = captureReportOneLine(eliminationRows);`) i URUCHAMIANE
 *      z realnym `outcome`. Dzieki temu asercje pokrywaja TAKZE mapowanie kwot w main.ts
 *      (`zloto: Math.floor(outcome.skarbiecPrzejety)` itd.), a nie tylko sam builder --
 *      stara wersja sprawdzala to tylko obecnoscia literalu w zrodle.
 *   3. Sekcja 4: REALNY `applyCapitalCapturePlunder` z capital-capture.ts (esbuild,
 *      nie mock) -> wyciety kod main.ts -> tekst finalny z liczbami z silnika.
 *      Etykieta Mocy pochodzi z REALNEGO `mocLabel()` (ui/power-labels.ts), nie ze stalej
 *      w tescie -- inaczej asercja „w tekscie gracza nie ma slowa Power" bylaby tautologia.
 *
 * ODPORNOSC (naprawa twardego crasha `ReferenceError: eliminatedDetails is not defined`
 * ze starej wersji, linie 92/104): kazda egzekucja wycietego kodu jest w try/catch, a brak
 * wycinka daje FAIL asercji i `null`, nie wyjatek. Bramka ZAWSZE dobiega do podsumowania
 * i konczy sie kodem 1, kiedy cokolwiek jest czerwone.
 *
 * Usage (z gra/): node tools/eliminacja-lup-kwoty-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const MAIN_TS_PATH = path.resolve(GRA, 'src', 'main.ts');
const mainSrc = fs.readFileSync(MAIN_TS_PATH, 'utf8');

const esbuild = (() => {
  try { return require(path.resolve(GRA, 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('  [eliminacja-lup-kwoty-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  OK: ' + label); }
  else { fail++; console.log('  FAIL: ' + label); }
}
function eq(a, b, label) {
  ok(a === b, `${label} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}
function sliceInclusive(src, startMarker, endMarker) {
  const a = src.indexOf(startMarker);
  if (a < 0) return null;
  const b = src.indexOf(endMarker, a + startMarker.length);
  if (b < 0) return null;
  return src.slice(a, b + endMarker.length);
}
/** Wiersz po etykiecie -- `null`, gdy pozycja w ogole nie powstala (defekt E5: zera pomijane). */
const rowFor = (rows, label) => (Array.isArray(rows) ? rows.find(r => r.label === label) || null : null);

// ===========================================================================
// 0. Regula przeciw samooszukiwaniu: main.ts NIE ma dedykowanego formattera
//    walut/liczb -- inne komunikaty w pliku tez sklejaja plain `${amount} złota`
//    / `${amount} nauki` bez separatorow tysiecy ani zaokraglania do formatu.
//    (Sekcja przeniesiona bez zmian -- dotyczy main.ts, nie nosnika raportu.)
// ===========================================================================
console.log('0. main.ts nie ma gotowego formattera waluty (grep-owalny dowód)');
{
  ok(mainSrc.includes("'Chatka (' + label + '): +' + amount + ' złota'"),
    "0a: main.ts (Chatka barbarzyńska) skleja plain '+' + amount + ' złota' -- ten sam wzorzec [<- 0a]");
  ok(mainSrc.includes("'\\u2212' + done.koszt + ' nauki'"),
    "0b: main.ts (log badania techu) skleja plain '\\u2212' + koszt + ' nauki' -- ten sam wzorzec [<- 0b]");
  ok(!/function\s+formatGold|function\s+formatZloto|function\s+formatCurrency|function\s+formatKwota/.test(mainSrc),
    '0c: brak funkcji formatGold/formatZloto/formatCurrency/formatKwota w main.ts [<- 0c]');
}

// ===========================================================================
// 1. Wyciecie DWOCH fragmentow main.ts: BLOKU CZYSTEGO (budowniczy wierszy)
//    i MIEJSCA WYWOLANIA z galezi eliminacji (mapowanie kwot outcome -> wiersze).
//    Zastepuje wyciecie po literale sklejanego stringa -- ten literal usuwa GOAL 2.
// ===========================================================================
console.log('1. Wyciąganie z main.ts: BLOK CZYSTY + miejsce wywołania gałęzi eliminacji');
const PURE_START = '// R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1 — BLOK CZYSTY: POCZATEK';
const PURE_END = '// R-MIASTA-ZDOBYCIE-RAPORT-TROFEA-Q1 — BLOK CZYSTY: KONIEC';
const CALL_START = 'const eliminationRows = buildCityCaptureReportRows({';
const CALL_END = 'const eliminatedDetails = captureReportOneLine(eliminationRows);';

const pureBlock = sliceInclusive(mainSrc, PURE_START, PURE_END);
const callSite = sliceInclusive(mainSrc, CALL_START, CALL_END);
{
  // [<- 1a] „znaleziono start bloku": zamiast literalu `const skarbiecKwota = ...`
  //         start jest dzis jawnym, wersjonowanym markerem BLOKU CZYSTEGO.
  ok(pureBlock !== null && pureBlock.length > 0,
    '1a: znaleziono BLOK CZYSTY main.ts po markerach POCZATEK/KONIEC [<- 1a]');
  // [<- 1b] „znaleziono koniec bloku (przypisanie eliminatedDetails)": `eliminatedDetails`
  //         nadal istnieje i nadal konczy ten fragment -- tylko powstaje z wierszy.
  ok(callSite !== null && callSite.length > 0,
    '1b: znaleziono miejsce wywołania eliminacji (eliminationRows..eliminatedDetails) [<- 1b]');
  // [<- 1c] „blok niepusty" -- oba wycinki musza byc niepuste i wykonywalne.
  ok(!!pureBlock && pureBlock.includes('function buildCityCaptureReportRows(')
    && pureBlock.includes('function captureReportOneLine('),
    '1c: BLOK CZYSTY niesie oba budowniczych raportu (rows + jedna linia) [<- 1c]');
  // [<- 1d] „const skarbiecKwota = Math.floor(outcome.skarbiecPrzejety);" -- ta sama
  //         WLASNOSC (kwota zlota = ucieta podloga faktyczna kwota z outcome), nowe miejsce.
  ok(!!callSite && callSite.includes('zloto: Math.floor(outcome.skarbiecPrzejety),'),
    '1d: kwota złota bierze się z Math.floor(outcome.skarbiecPrzejety) [<- 1d]');
  // [<- 1e] „const naukaKwota = Math.floor(outcome.naukaPrzejeta);" -- j.w. dla nauki.
  ok(!!callSite && callSite.includes('nauka: Math.floor(outcome.naukaPrzejeta),'),
    '1e: kwota nauki bierze się z Math.floor(outcome.naukaPrzejeta) [<- 1e]');
  // [<- 1f] „przypisanie eliminatedDetails warunkowane barbCaptor" -- galaz barbarzynska
  //         nadal jest sterowana `barbCaptor`, tylko wewnatrz buildera (`barbarzyncaZdobywca`).
  ok(!!callSite && callSite.includes('barbarzyncaZdobywca: barbCaptor,')
    && !!pureBlock && pureBlock.includes('if (input.barbarzyncaZdobywca)'),
    '1f: gałąź barbarzyńska nadal sterowana barbCaptor (przez barbarzyncaZdobywca) [<- 1f]');
}

// --- Egzekucja obu wycinkow (odporna: brak wycinka => null, nigdy wyjatek) ---
let pureApi = null;
if (pureBlock) {
  try {
    const js = esbuild.transformSync(
      pureBlock + '\nreturn { buildCityCaptureReportRows, captureReportOneLine };',
      { loader: 'ts', format: 'cjs' },
    ).code;
    // eslint-disable-next-line no-new-func
    pureApi = new Function(js)();
  } catch (e) {
    console.log('  (egzekucja BLOKU CZYSTEGO rzuciła: ' + (e && e.message) + ')');
  }
}

let callSiteJs = null;
if (callSite) {
  try {
    callSiteJs = esbuild.transformSync(callSite, { loader: 'ts', format: 'esm' }).code;
  } catch (e) {
    console.log('  (transpilacja miejsca wywołania rzuciła: ' + (e && e.message) + ')');
  }
}

/**
 * Uruchamia FAKTYCZNY kod main.ts z gałęzi eliminacji na podanym `outcome`.
 * Zwraca `{ rows, line }` albo `null` (gdy wycinka nie ma -- wtedy asercje czerwienieją,
 * a bramka i tak dobiega do podsumowania; stara wersja w tym miejscu wywalała się
 * twardym `ReferenceError: eliminatedDetails is not defined`).
 */
function renderEliminationReport(outcome, barbCaptor, powerGain, mocEtykieta, population, buildings) {
  if (!callSiteJs || !pureApi) return null;
  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function(
      'buildCityCaptureReportRows', 'captureReportOneLine', 'mocLabel',
      'city', 'cityBuilt', 'outcome', 'powerGain', 'barbCaptor',
      callSiteJs + '\nreturn { rows: eliminationRows, line: eliminatedDetails };',
    );
    return fn(
      pureApi.buildCityCaptureReportRows,
      pureApi.captureReportOneLine,
      () => mocEtykieta,
      { id: 'c1', name: 'Miasto', population },
      new Map([['c1', new Array(buildings).fill('b')]]),
      outcome,
      powerGain,
      barbCaptor,
    );
  } catch (e) {
    console.log('  (egzekucja miejsca wywołania rzuciła: ' + (e && e.message) + ')');
    return null;
  }
}

// ===========================================================================
// 2. Egzekucja wycietego kodu main.ts z realnymi wartosciami outcome/barbCaptor/
//    powerGain -- dowod RUNTIME, nie lektura kodu. Te same piec scenariuszy
//    co przed przepisaniem, te same liczby.
// ===========================================================================
console.log('2. Egzekucja kodu wyciętego z main.ts -- konkretne kwoty w wierszach raportu');
{
  // 2a. Skarbiec > 0, nauka = 0. PRZED: caly tekst
  //     'Skarbiec: +1234 złota. 3 tech(y) przejęte. Zdobycze Power: +777.'
  //     PO: pozycja „Złoto ze skarbca +1234" istnieje, pozycja o nauce NIE POWSTAJE
  //     (zero jest pomijane -- GOAL 2 pkt 1), reszta jak nizej.
  const A = renderEliminationReport(
    { skarbiecPrzejety: 1234, naukaPrzejeta: 0, techSkopiowane: ['a', 'b', 'c'] },
    false, 777, 'Moc', 4, 2,
  );
  eq(A && rowFor(A.rows, 'Złoto ze skarbca') && rowFor(A.rows, 'Złoto ze skarbca').value, '+1234',
    '2a: skarbiec=1234 -> pozycja „Złoto ze skarbca" niesie DOKŁADNĄ kwotę [<- 2a]');
  ok(A && rowFor(A.rows, 'Punkty nauki') === null,
    '2a-2: nauka=0 -> pozycji o nauce w ogóle NIE MA (zero pomijane, nie „bez wzmianki o nauce" w zdaniu) [<- 2a]');
  ok(!!A && A.line.includes('1234'),
    '2a-kontrola: "1234" (skarbiecPrzejety) jest literalnie w wygenerowanym tekście [<- 2a-kontrola]');

  // 2b. Skarbiec = 0 i caly lup pusty. PRZED: 'Skarbiec był pusty. 0 tech(y) przejęte...'
  //     PO: pozycja o skarbcu POMINIETA (GOAL 5 pkt 2 nowego dispatchu), ale komunikat
  //     NADAL NIE MILCZY -- powstaje dokladnie jedna swiadoma pozycja „Łup: brak" (ECHO 1).
  //     To ta sama wlasnosc („gracz dostaje jawna informacje o braku lupu"), inne slowo.
  const B = renderEliminationReport(
    { skarbiecPrzejety: 0, naukaPrzejeta: 0, techSkopiowane: [] },
    false, 0, 'Moc', 4, 2,
  );
  ok(B && rowFor(B.rows, 'Złoto ze skarbca') === null,
    '2b: skarbiec=0 -> pozycja o skarbcu POMINIĘTA, nie wypisana z zerem [<- 2b]');
  eq(B && rowFor(B.rows, 'Łup') && rowFor(B.rows, 'Łup').value, 'brak',
    '2b-2: pusty łup -> jedna świadoma pozycja „Łup: brak", komunikat NIE milczy [<- 2b]');
  ok(!!B && B.line.includes('brak'),
    '2b-kontrola: słowo „brak" jest w wygenerowanym tekście (następca „pusty") [<- 2b-kontrola]');

  // 2c. Nauka > 0 -- OBIE kwoty dokladne.
  const C = renderEliminationReport(
    { skarbiecPrzejety: 500, naukaPrzejeta: 88, techSkopiowane: ['brazownictwo'] },
    false, 300, 'Moc', 4, 2,
  );
  eq(C && rowFor(C.rows, 'Złoto ze skarbca') && rowFor(C.rows, 'Złoto ze skarbca').value, '+500',
    '2c: skarbiec=500 -> dokładna kwota złota w pozycji [<- 2c]');
  eq(C && rowFor(C.rows, 'Punkty nauki') && rowFor(C.rows, 'Punkty nauki').value, '+88',
    '2c-2: nauka=88 -> dokładna kwota nauki w OSOBNEJ pozycji (koniec „Nauka: +88 nauki", defekt E2) [<- 2c]');
  ok(!!C && C.line.includes('88'),
    '2c-kontrola: "88" (naukaPrzejeta) jest literalnie w wygenerowanym tekście [<- 2c-kontrola]');
  ok(!!C && C.line.includes('500'),
    '2c-kontrola2: "500" (skarbiecPrzejety) jest literalnie w wygenerowanym tekście [<- 2c-kontrola]');

  // 2d. Math.floor -- kwoty ulamkowe scinane spojnie z HUD gracza. Ta asercja jest dzis
  //     MOCNIEJSZA: podloge wykonuje FAKTYCZNY kod main.ts (`Math.floor(outcome...)`),
  //     a nie skopiowany do testu builder.
  const D = renderEliminationReport(
    { skarbiecPrzejety: 250.7, naukaPrzejeta: 12.9, techSkopiowane: [] },
    false, 10, 'Moc', 4, 2,
  );
  eq(D && rowFor(D.rows, 'Złoto ze skarbca') && rowFor(D.rows, 'Złoto ze skarbca').value, '+250',
    '2d: 250.7 -> +250, podłoga wykonana przez kod main.ts (spójnie z HUD) [<- 2d]');
  eq(D && rowFor(D.rows, 'Punkty nauki') && rowFor(D.rows, 'Punkty nauki').value, '+12',
    '2d-2: 12.9 -> +12, bez ułamków w tekście dla gracza [<- 2d]');

  // 2e. Regresja -- galaz barbarzynska zachowuje SENS (uwaga recon E dispatchu):
  //     PRZED: 'Skarbiec i nauka przepadły (barbarzyńcy nie dziedziczą łupu).'
  //     PO: pozycja „Łup: przepadł — barbarzyńcy nie dziedziczą zdobyczy" + ZERO pozycji
  //     lupu, mimo niezerowych kwot w outcome.
  const E = renderEliminationReport(
    { skarbiecPrzejety: 999, naukaPrzejeta: 40, techSkopiowane: ['x'] },
    true, 5, 'Moc', 4, 2,
  );
  eq(E && rowFor(E.rows, 'Łup') && rowFor(E.rows, 'Łup').value,
    'przepadł — barbarzyńcy nie dziedziczą zdobyczy',
    '2e: barbCaptor=true -> łup przepadł, barbarzyńcy nie dziedziczą (sens zachowany) [<- 2e]');
  ok(E && rowFor(E.rows, 'Złoto ze skarbca') === null && rowFor(E.rows, 'Punkty nauki') === null
    && rowFor(E.rows, 'Technologie') === null,
    '2e-2: barbCaptor=true -> ŻADNEJ pozycji łupu mimo skarbca 999 i nauki 40 [<- 2e]');
}

// ===========================================================================
// 3. Zero regresji: liczba technologii i Moc nadal RAPORTOWANE konkretna liczba
//    (przed przepisaniem sprawdzane obecnoscia literalu
//    `${outcome.techSkopiowane.length} tech(y) przejęte. Zdobycze Power: +${lostPower}.`
//    -- literalu, ktorego usuniecia zada GOAL 2 pkt 2 dispatchu).
// ===========================================================================
console.log('3. Zero regresji: technologie i Moc nadal z konkretną liczbą, bez skrótów dev');
{
  const F = renderEliminationReport(
    { skarbiecPrzejety: 10, naukaPrzejeta: 20, techSkopiowane: ['a', 'b', 'c'] },
    false, 777, 'Moc', 4, 2,
  );
  eq(F && rowFor(F.rows, 'Technologie') && rowFor(F.rows, 'Technologie').value, '+3',
    '3a: techSkopiowane.length=3 -> pozycja „Technologie +3" (następca „3 tech(y) przejęte") [<- 3a]');
  eq(F && rowFor(F.rows, 'Moc') && rowFor(F.rows, 'Moc').value, '+777',
    '3b: powerGain=777 -> pozycja Mocy z dokładną liczbą (następca „Zdobycze Power: +777.") [<- 3a]');
  ok(!!F && !F.line.includes('tech(y)') && !F.line.includes('Power'),
    '3c: w tekście dla gracza NIE MA już „tech(y)" ani „Power" (defekty E3/E4) [<- 3a, kierunek odwrotny]');
}

// ===========================================================================
// 4. Zywy dowod end-to-end: REALNY outcome z applyCapitalCapturePlunder
//    (capital-capture.ts zbundlowany esbuildem, nie mock/reimplementacja) ->
//    wyciety kod main.ts -> raport finalny z REALNYMI liczbami z silnika.
//    Etykieta Mocy z REALNEGO mocLabel() (ui/power-labels.ts).
// ===========================================================================
console.log('4. Żywy dowód -- realna eliminacja w capital-capture.ts -> raport finalny');
{
  const ENTRY_FILE = path.resolve(__dirname, '.eliminacja-lup-kwoty-entry.ts');
  const BUNDLE_FILE = path.resolve(__dirname, '.eliminacja-lup-kwoty-bundle.cjs');
  fs.writeFileSync(
    ENTRY_FILE,
    "export { applyCapitalCapturePlunder } from '../src/game/capital-capture';\n"
    + "export { computeObjectivePower } from '../src/game/power-objective';\n"
    + "export { mocLabel } from '../src/ui/power-labels';\n",
    'utf8',
  );
  try {
    esbuild.buildSync({
      entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs',
      target: 'node18', outfile: BUNDLE_FILE, logLevel: 'silent',
      resolveExtensions: ['.ts', '.js', '.json'],
    });
  } catch (e) {
    console.error('  [eliminacja-lup-kwoty-test] esbuild bundling failed:\n', e.message || e);
    process.exit(1);
  }
  const { applyCapitalCapturePlunder, mocLabel } = require(BUNDLE_FILE);

  function city(id, ownerId) { return { id, ownerId, q: 0, r: 0, name: id, population: 1 }; }
  function makeAccess(seed) {
    const skarbiec = new Map(Object.entries(seed.skarbiec || {}).map(([k, v]) => [Number(k), v]));
    const praca = new Map();
    const nauka = new Map(Object.entries(seed.nauka || {}).map(([k, v]) => [Number(k), v]));
    const techy = new Map(Object.entries(seed.techy || {}).map(([k, v]) => [Number(k), new Set(v)]));
    return {
      getTreasury: (oid) => skarbiec.get(oid) ?? 0,
      setTreasury: (oid, v) => skarbiec.set(oid, Math.max(0, v)),
      getPracaPool: (oid) => praca.get(oid) ?? 0,
      setPracaPool: (oid, v) => praca.set(oid, Math.max(0, v)),
      getNaukaPool: (oid) => nauka.get(oid) ?? 0,
      setNaukaPool: (oid, v) => nauka.set(oid, Math.max(0, v)),
      getResearchedTechs: (oid) => techy.get(oid) ?? new Set(),
      addResearchedTechs: (oid, ids) => {
        if (!techy.has(oid)) techy.set(oid, new Set());
        const s = techy.get(oid);
        for (const id of ids) s.add(id);
      },
    };
  }

  // Gracz (ownerId 0) eliminuje AI (ownerId 3) -- jedyne miasto AI, skarbiec 1500,
  // pula nauki 63, dwa techy brakujace zwyciezcy. Liczby identyczne jak przed przepisaniem.
  const citiesAfter = [city('cityLast', 0)];
  const access = makeAccess({
    skarbiec: { 3: 1500, 0: 0 },
    nauka: { 3: 63 },
    techy: { 3: ['brazownictwo', 'kolo'], 0: [] },
  });
  const outcome = applyCapitalCapturePlunder(city('cityLast', 0), 3, 0, citiesAfter, access);
  ok(outcome !== null, '4a: realna eliminacja -> outcome niepusty [<- 4a]');
  eq(outcome && outcome.eliminacja, true, '4b: eliminacja=true (ostatnie miasto AI) [<- 4b]');
  eq(outcome && outcome.skarbiecPrzejety, 1500, '4c: outcome.skarbiecPrzejety = 1500 (realny wynik silnika) [<- 4c]');
  eq(outcome && outcome.naukaPrzejeta, 63, '4d: outcome.naukaPrzejeta = 63 (realny wynik silnika) [<- 4d]');

  const powerGain = 420; // niezalezne od lupu -- symuluje barbarianCapturedPowerGain(lostPower, false)
  const real = renderEliminationReport(outcome, false, powerGain, mocLabel(), 4, 3);
  console.log('  >>> WYGENEROWANY RAPORT (żywy dowód): ' + JSON.stringify(real && real.line));
  // [<- 4e] PRZED: jeden string
  //   'Skarbiec: +1500 złota. Nauka: +63 nauki. 2 tech(y) przejęte. Zdobycze Power: +420.'
  // PO: te same cztery liczby, kazda we WLASNEJ pozycji etykieta/wartosc; asercja na
  // splaszczonej linii jest tak samo doslowna jak przedtem.
  eq(
    real && real.line,
    'Ludność: +4 · Budynki: +3 · Złoto ze skarbca: +1500 · Punkty nauki: +63'
    + ' · Technologie: +2 · Moc: +420 · Pula pracy: przepadła — nie przechodzi na zdobywcę',
    '4e: pełny raport z REALNEGO outcome silnika (1500 złota, 63 nauki, 2 techy, 420 Mocy) [<- 4e]',
  );
  eq(real && rowFor(real.rows, 'Złoto ze skarbca') && rowFor(real.rows, 'Złoto ze skarbca').value, '+1500',
    '4f: kwota złota z silnika trafia do WŁASNEJ pozycji raportu [<- 4e]');
  eq(real && rowFor(real.rows, 'Punkty nauki') && rowFor(real.rows, 'Punkty nauki').value, '+63',
    '4g: kwota nauki z silnika trafia do WŁASNEJ pozycji raportu [<- 4e]');
  eq(real && rowFor(real.rows, 'Technologie') && rowFor(real.rows, 'Technologie').value, '+2',
    '4h: liczba skopiowanych technologii z silnika (2) w raporcie [<- 4e]');
  eq(mocLabel(), 'Moc',
    '4i: etykieta Mocy pochodzi z REALNEGO mocLabel() i jest polska („Moc", nie „Power")');

  try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
  try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
