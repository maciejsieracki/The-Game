'use strict';
/**
 * oblezenie-remis-endsiege-test.cjs
 * R-OBLEZENIE-REMIS-MASZYNY-Q2=A (Maciej 2026-08-14, dyspozycje/PYTANIA-OTWARTE.md).
 *
 * DECYZJA WŁAŚCICIELA: remis szturmu muru MA ZAWSZE kończyć oblężenie — jawna reguła
 * silnika (`endMapSiege(city.id)` w gałęzi `res.winner === 'remis'` wewnątrz
 * `finishSiegeStormBattle` → `afterSiegeUi`), NIEZALEŻNIE od przypadkowej geometrii
 * odwrotu `placeFanOutGroup`.
 *
 * PRZED NAPRAWĄ (zmierzone niezależnie przez Evaluatora, werdykt FAIL dla `51a32fe6`):
 * zdjęcie oblężenia po remisie było WYŁĄCZNIE ubocznym skutkiem `validateActiveSieges()`
 * (wołanej na końcu `applyMapBattleOutcome`, PO `placeFanOutGroup`) — flaga spadała tylko
 * gdy PO fan-oucie żadna jednostka oblegającego nie została na dystansie 1 od miasta.
 * Zmierzone na wszystkich 63 niepustych podzbiorach 6 heksów przyściennych: 30/63 układów
 * kończyło oblężenie, 33/63 zostawiało je TRWAJĄCE mimo tekstu „oblężenie zniesione"
 * (liczby sprostowane przez Evaluatora naprawy `a159af84` — pierwotny pomiar Evaluatora
 * `51a32fe6` mylił się w układach k=2 i k=4).
 *
 * NOTA G1 (Evaluator, werdykt PASS-WITH-NOTES dla `a159af84`, `dyspozycje/PYTANIA-OTWARTE.md`)
 * — NAPRAWIONA tym commitem: §2 (behawioralny) dawniej wołał `endMapSiege('roma')`
 * BEZWARUNKOWO z poziomu harnessu testowego, NIEZALEŻNIE od tego, czy `finishSiegeStormBattle`
 * w main.ts faktycznie woła `endMapSiege(city.id)` w gałęzi remisu. Skutek: cofnięcie naprawy
 * w main.ts psuło WYŁĄCZNIE §1 (strażnik tekstowy) i samosprawdzenie §3 — 13/265 asercji, nie
 * 265/265 ani nawet 252/265 (63 konfiguracje × 4 asercje §2 w ogóle nie reagowały na mutację).
 * NAPRAWA: §2 wycina TEKSTOWO samą gałąź `res.winner === 'remis'` z `finishSiegeStormBattle`
 * (funkcja `wytnijBlokRemis`, WSPÓLNA z §1 — jedno źródło prawdy, nie duplikat wzorca) i
 * WYKONUJE ją naprawdę (`wykonajGalazRemis`) w tym samym zasięgu leksykalnym co wycięty
 * `endMapSiege` — więc gołe wywołanie `endMapSiege(city.id)` wewnątrz gałęzi remisu wiąże się
 * z PRAWDZIWĄ, wyciętą funkcją (podniesienie deklaracji funkcji w tym samym zasięgu), nie z
 * atrapą z harnessu. Gdy naprawa zniknie z main.ts, wykonanie gałęzi remisu PO PROSTU NIE
 * WOŁA `endMapSiege` — dokładnie tak samo, jak zniknięcie linii wpłynęłoby na grę. Dowód
 * mutacyjny: patrz §3b niżej (w pamięci) oraz opis commita (na dysku, main.ts przywrócony).
 *
 * TEN TEST — niezależny od pomiaru Evaluatora (własna implementacja, ta sama metoda:
 * wszystkie 2^6-1=63 niepuste podzbiory heksów przyściennych), sprawdza TRZY warstwy:
 *   §1 STRAŻNIK TEKSTOWY — gałąź `remis` w `finishSiegeStormBattle` woła jawnie
 *      `endMapSiege(city.id)`, PRZED końcem bloku, i to DOKŁADNIE w gałęzi remisu
 *      (nie w `atakujacy`/`obronca`).
 *   §2 TEST BEHAWIORALNY, PRAWDZIWY KOD — łączy TRZY prawdziwe fragmenty:
 *      (a) `applyPostBattleMap` z `src/game/post-battle-map.ts` (eksportowany, importowany
 *          wprost przez esbuild — ten sam moduł, który realnie porusza jednostki po
 *          remisie przez `placeFanOutGroup`);
 *      (b) `validateActiveSieges`/`endMapSiege`, wycięte TEKSTOWO z main.ts (domknięcia
 *          `boot()`, nieeksportowalne bez przebudowy — wzorzec z
 *          `oblezenie-siege-lifted-po-bitwie-test.cjs`);
 *      (c) NOWE (ten commit): sama gałąź `res.winner === 'remis'` z `finishSiegeStormBattle`,
 *          wycięta TEKSTOWO (nie reimplementacja-kopia formuły!) i wykonana w tym samym
 *          zasięgu co (b) — więc `endMapSiege(city.id)` w tej gałęzi to REALNE wywołanie
 *          rzeczywistej wyciętej funkcji, nie coś, co test i tak zrobiłby sam.
 *      Dla każdego z 63 podzbiorów odtwarza PRAWDZIWĄ kolejność wywołań z gry:
 *      `applyPostBattleMap(winner:'remis')` → `validateActiveSieges()` (stare wywołanie,
 *      wewnątrz `applyMapBattleOutcome`, dodane przez `7b57eb45`) → wykonanie PRAWDZIWEJ
 *      gałęzi remis (NOWY krok tego commitu — dawniej: gołe `endMapSiege('roma')` z
 *      harnessu, niezależne od main.ts, patrz nota G1 wyżej). Asercja: `city.oblegane === false`
 *      we WSZYSTKICH 63/63 układach PO trzecim kroku — niezależnie od tego, co zrobił krok drugi
 *      — ale TERAZ trzeci krok realnie zależy od obecności naprawy w main.ts.
 *      Dodatkowo zlicza, w ilu z 63 układów SAM `validateActiveSieges()` (krok 2, stare
 *      zachowanie) NIE wystarczał — dowód, że wykonanie gałęzi remisu w kroku 3 robi realną
 *      pracę, a test nie jest pusty (nie przechodziłby trywialnie także bez naprawy).
 *   §3 SAMOSPRAWDZENIE — cofnięcie naprawy W PAMIĘCI (dysk nietknięty) musi zaświecić na
 *      czerwono ZARÓWNO strażnik §1 (tekstowo, jak dawniej), JAK I §2 behawioralnie (§3b,
 *      nowe tego commitu) — to jest właśnie naprawiona nota G1.
 *
 * Bramka (z katalogu gra/): node tools/oblezenie-remis-endsiege-test.cjs — exit 0 = zielona.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_ROOT, 'src', 'main.ts');
const realSrc = fs.readFileSync(MAIN_TS, 'utf8');

let pass = 0, fail = 0;
function ok(cond, label) { if (cond) { pass++; } else { fail++; console.error('FAIL:', label); } }

// ---------------------------------------------------------------------------
// Wycinanie po SYGNATURZE (numery linii się przesuwają) — wzorzec kanoniczny
// w repo, patrz oblezenie-siege-lifted-po-bitwie-test.cjs / road-hook-mainguard-test.cjs.
// ---------------------------------------------------------------------------
function wytnijOdSygnatury(src, sygnatura, startBraceChar) {
  const start = src.indexOf(sygnatura);
  if (start < 0) return null;
  const bodyStart = src.indexOf(startBraceChar, start + sygnatura.length - 1);
  if (bodyStart < 0) return null;
  let depth = 0;
  for (let j = bodyStart; j < src.length; j++) {
    const c = src[j];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  return null;
}

// Wycina funkcję z listą parametrów w nawiasach okrągłych (mogą zawierać własne `{ }`
// w typach opts?: { ... } — trzeba przeskoczyć całą listę parametrów licząc `(`/`)`,
// nie naiwnie szukać pierwszego `{` po sygnaturze).
function wytnijFunkcjeZParametrami(src, sygnatura) {
  const start = src.indexOf(sygnatura);
  if (start < 0) return null;
  let parenIdx = src.indexOf('(', start);
  if (parenIdx < 0) return null;
  let pdepth = 0;
  let i = parenIdx;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '(') pdepth++;
    else if (c === ')') { pdepth--; if (pdepth === 0) { i++; break; } }
  }
  const bodyStart = src.indexOf('{', i);
  if (bodyStart < 0) return null;
  let depth = 0;
  for (let j = bodyStart; j < src.length; j++) {
    const c = src[j];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  return null;
}

const SYG_FINISH = 'function finishSiegeStormBattle(';
const SYG_VALIDATE = 'function validateActiveSieges(): void {';
const SYG_END_SIEGE = 'function endMapSiege(cityId: string): void {';

// ===========================================================================
// Wycinanie gałęzi remis z finishSiegeStormBattle — JEDNO źródło prawdy, użyte
// zarówno przez §1 (strażnik tekstowy, sprawdza SAMĄ OBECNOŚĆ wzorca) jak i §2
// (naprawa noty G1: WYKONUJE tę samą wyciętą treść naprawdę, zamiast ją tylko
// sprawdzać tekstowo w jednym miejscu, a w drugim symulować niezależnie).
// ===========================================================================
function wytnijBlokRemis(src) {
  const finish = wytnijFunkcjeZParametrami(src, SYG_FINISH);
  if (!finish) return { finish: null, idxRemis: -1, braceIdx: -1, block: null };
  const idxRemis = finish.indexOf("res.winner === 'remis'");
  if (idxRemis < 0) return { finish, idxRemis: -1, braceIdx: -1, block: null };
  const braceIdx = finish.indexOf('{', idxRemis);
  if (braceIdx < 0) return { finish, idxRemis, braceIdx: -1, block: null };
  let depth = 0, remisEnd = -1;
  for (let j = braceIdx; j < finish.length; j++) {
    const c = finish[j];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { remisEnd = j; break; } }
  }
  if (remisEnd < 0) return { finish, idxRemis, braceIdx, block: null };
  return { finish, idxRemis, braceIdx, remisEnd, block: finish.slice(braceIdx, remisEnd + 1) };
}

// ===========================================================================
// §1. STRAŻNIK TEKSTOWY — gałąź remis w finishSiegeStormBattle woła endMapSiege(city.id)
// ===========================================================================
function naruszeniaStruktury(src) {
  const b = [];

  const wyciete = wytnijBlokRemis(src);
  if (!wyciete.finish) { b.push('brak finishSiegeStormBattle w main.ts'); return b; }
  if (wyciete.idxRemis < 0) { b.push('finishSiegeStormBattle: brak gałęzi res.winner === remis'); return b; }
  if (wyciete.braceIdx < 0) { b.push('finishSiegeStormBattle: brak { po warunku remis'); return b; }
  if (!wyciete.block) { b.push('finishSiegeStormBattle: nie domknięto bloku remis'); return b; }

  const { finish, idxRemis, braceIdx, block: remisBlock } = wyciete;

  if (!remisBlock.includes('endMapSiege(city.id)')) {
    b.push('gałąź remis NIE woła endMapSiege(city.id) — R-OBLEZENIE-REMIS-MASZYNY-Q2=A '
      + 'niewdrożone, zdjęcie oblężenia po remisie zależy od geometrii placeFanOutGroup');
  }
  if (!remisBlock.includes("'Szturm: remis")) {
    b.push('gałąź remis: nie znaleziono spodziewanego toastu "Szturm: remis" — struktura się zmieniła '
      + 'bardziej niż oczekiwano, zweryfikuj ręcznie');
  }

  // Kontrola: endMapSiege(city.id) NIE powinno pojawić się w gałęzi 'obronca' (siege trwa
  // przy wygranej obrony) ani w gałęzi 'atakujacy' (miasto zdobyte — inny teardown).
  const idxObronca = finish.indexOf("res.winner === 'obronca'");
  if (idxObronca >= 0 && idxObronca < idxRemis) {
    const obroncaBlock = finish.slice(finish.indexOf('{', idxObronca), braceIdx);
    if (obroncaBlock.includes('endMapSiege(city.id)')) {
      b.push('gałąź obronca woła endMapSiege(city.id) — NIE powinna (obrona wygrana = oblężenie trwa)');
    }
  }

  if (!wytnijOdSygnatury(src, SYG_VALIDATE, '{')) b.push('brak validateActiveSieges w main.ts');
  if (!wytnijOdSygnatury(src, SYG_END_SIEGE, '{')) b.push('brak endMapSiege w main.ts');

  return b;
}

const naruszenia = naruszeniaStruktury(realSrc);
ok(naruszenia.length === 0,
  'gałąź remis w finishSiegeStormBattle woła endMapSiege(city.id) (i tylko ta gałąź)'
  + (naruszenia.length ? ' → ' + naruszenia.join(' | ') : ''));

// ===========================================================================
// §2. TEST BEHAWIORALNY — applyPostBattleMap (real) + validateActiveSieges/endMapSiege
//     (real) + PRAWDZIWA gałąź remis z finishSiegeStormBattle (real, naprawa noty G1)
// ===========================================================================
const ENTRY = path.resolve(__dirname, '.oblezenie-remis-entry.ts');
const BUNDLE = path.resolve(__dirname, '.oblezenie-remis-bundle.cjs');
fs.writeFileSync(ENTRY, [
  `export { hexDistance, hexNeighborCoords } from '../src/units/setup';`,
  `export { applyPostBattleMap, snapshotRosterPositions } from '../src/game/post-battle-map';`,
].join('\n'), 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
  absWorkingDir: GRA_ROOT, nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { hexDistance, hexNeighborCoords, applyPostBattleMap, snapshotRosterPositions } = require(BUNDLE);

/**
 * Buduje działający validateActiveSieges + endMapSiege + wykonajGalazRemis z main.ts
 * (patrz nagłówek pliku). `wykonajGalazRemis(city)` wykonuje PRAWDZIWĄ, wyciętą treść
 * gałęzi `res.winner === 'remis'` z `finishSiegeStormBattle` — w TYM SAMYM zasięgu co
 * wycięty `endMapSiege`, więc gołe `endMapSiege(city.id)` w tej treści wiąże się z
 * rzeczywistą funkcją (podniesienie deklaracji w jednym zasięgu `new Function`), nie
 * z atrapą. Jeśli main.ts nie woła tam endMapSiege (naprawa cofnięta) — ten wrapper
 * PO PROSTU jej nie wywoła, dokładnie jak w grze.
 */
function zbudujHarness(src) {
  const validateTxt = wytnijOdSygnatury(src, SYG_VALIDATE, '{');
  const endSiegeTxt = wytnijOdSygnatury(src, SYG_END_SIEGE, '{');
  const wyciete = wytnijBlokRemis(src);
  if (!validateTxt || !endSiegeTxt || !wyciete.block) return null;

  const remisWrapperSrc = [
    'function __wykonajGalazRemis(city, __rDeps) {',
    '  const { showHintMessage, syncUnitsRender, cityRenderer, cities, _cityRenderOpts,',
    '          refreshFog, updateHud, refreshD1bHud } = __rDeps;',
    wyciete.block,
    '}',
  ].join('\n');

  const js = esbuild.transformSync(
    endSiegeTxt + '\n' + validateTxt + '\n' + remisWrapperSrc,
    { loader: 'ts', target: 'node18' },
  ).code;

  const cities = [];
  const units = [];
  const calls = {
    refreshSiegeMarkers: 0, hideSiegeMapPanel: 0, clearSiegeMachines: 0, hints: [],
    syncUnitsRender: 0, cityRendererSync: 0, refreshFog: 0, updateHud: 0, refreshD1bHud: 0,
  };
  const siegeBesiegerByCity = new Map();
  const siegeAiStateByKey = new Map();
  const siegeTurnByCity = new Map();

  const deps = {
    cities, units, hexDistance,
    clearSiegeMachines: () => { calls.clearSiegeMachines++; },
    siegeBesiegerByCity, siegeAiStateByKey,
    siegeAiKey: (bId, cityId) => bId + '::' + cityId,
    siegeTurnByCity,
    refreshSiegeMarkers: () => { calls.refreshSiegeMarkers++; },
    getActiveSiegeCityId: () => null,
    hideSiegeMapPanel: () => { calls.hideSiegeMapPanel++; },
    showHintMessage: (msg) => { calls.hints.push(msg); },
    syncUnitsRender: () => { calls.syncUnitsRender++; },
    cityRenderer: { sync: () => { calls.cityRendererSync++; } },
    _cityRenderOpts: () => ({}),
    refreshFog: () => { calls.refreshFog++; },
    updateHud: () => { calls.updateHud++; },
    refreshD1bHud: () => { calls.refreshD1bHud++; },
  };
  const fabryka = new Function('deps', `
    const { cities, units, hexDistance, clearSiegeMachines, siegeBesiegerByCity,
            siegeAiStateByKey, siegeAiKey, siegeTurnByCity, refreshSiegeMarkers,
            getActiveSiegeCityId, hideSiegeMapPanel, showHintMessage } = deps;
    ${js}
    return {
      validateActiveSieges, endMapSiege,
      wykonajGalazRemis: (city) => __wykonajGalazRemis(city, deps),
    };
  `);
  const F = fabryka(deps);
  return { cities, units, calls, siegeBesiegerByCity, siegeTurnByCity, F };
}

// Wszystkie 2^6 - 1 = 63 niepuste podzbiory 6 heksów przyściennych (miasto w (0,0)).
const NEIGHBORS = hexNeighborCoords(0, 0);
ok(NEIGHBORS.length === 6, 'hexNeighborCoords(0,0) zwraca 6 sąsiadów (siatka heksagonalna)');

function wszystkiePodzbiory(n) {
  const out = [];
  for (let mask = 1; mask < (1 << n); mask++) {
    const idxs = [];
    for (let i = 0; i < n; i++) if (mask & (1 << i)) idxs.push(i);
    out.push(idxs);
  }
  return out;
}
const PODZBIORY = wszystkiePodzbiory(6);
ok(PODZBIORY.length === 63, 'liczba niepustych podzbiorów 6-elementowych = 63 (2^6 - 1)');

const trivialDef = { getDef: () => ({}), maxHpOf: () => 1 };

/**
 * Symuluje WSZYSTKIE 63 konfiguracje dla podanego źródła main.ts (prawdziwego albo
 * zmutowanego w pamięci, §3b) i zwraca zarówno zagregowane liczniki, jak i wynik
 * per-konfiguracja (do szczegółowych asercji w §2 głównym). Jedna implementacja
 * użyta przez §2 (realSrc) i §3b (mut) — bez duplikatu pętli/formuły.
 */
function zmierzKonfiguracje(src) {
  const wyniki = [];
  let insufficientBefore = 0;
  let allEndedAfterFix = 0;
  for (const idxs of PODZBIORY) {
    const h = zbudujHarness(src);
    if (!h) return null;

    const city = { id: 'roma', ownerId: 0, oblegane: true, oblegajacyOwnerId: 1, q: 0, r: 0, name: 'Roma' };
    h.cities.push(city);
    h.siegeBesiegerByCity.set('roma', 1);
    h.siegeTurnByCity.set('roma', 3);

    const atkRoster = idxs.map((i, k) => ({
      id: 'atk-' + k, ownerId: 1, q: NEIGHBORS[i].q, r: NEIGHBORS[i].r, hp: 10,
    }));
    const defRoster = [{ id: 'def-0', ownerId: 0, q: 0, r: 0, hp: 10 }];
    h.units.push(...atkRoster, ...defRoster);

    const input = {
      units: h.units,
      map: {},
      cities: h.cities,
      battleQ: 0,
      battleR: 0,
      atkAnchor: atkRoster[0],
      atkRoster,
      defRoster,
      atkStart: snapshotRosterPositions(atkRoster),
      winner: 'remis',
      getDef: trivialDef.getDef,
      maxHpOf: trivialDef.maxHpOf,
      isPassableHex: () => true,   // wariant najłagodniejszy (metoda Evaluatora) — cała mapa przejezdna
      isUnitAt: () => false,
      cityOnBattleHex: city,
    };

    // Krok 1: PRAWDZIWA geometria odwrotu remisu (placeFanOutGroup przez applyPostBattleMap).
    applyPostBattleMap(input);

    // Krok 2: PRAWDZIWE stare wywołanie (wewnątrz applyMapBattleOutcome, 7b57eb45) —
    // ubocznie zależne od geometrii kroku 1.
    h.F.validateActiveSieges();
    const zostajePoStarym = city.oblegane === true;
    if (zostajePoStarym) insufficientBefore++;

    // Krok 3 (naprawa noty G1): PRAWDZIWA, wycięta gałąź remis z finishSiegeStormBattle —
    // NIE gołe wywołanie endMapSiege z harnessu. Jeśli main.ts nie woła tam endMapSiege
    // (naprawa cofnięta), ten krok NIC nie zmieni — city.oblegane zostaje tym, co zostawił
    // krok 2, dokładnie tak jak w grze.
    h.F.wykonajGalazRemis(city);

    const zakonczoneTeraz = city.oblegane === false;
    if (zakonczoneTeraz) allEndedAfterFix++;

    wyniki.push({
      idxs, h, city,
      zostajePoStarym, zakonczoneTeraz,
      oblegajacyOwnerIdSkasowany: city.oblegajacyOwnerId === undefined,
      besiegerWyczyszczone: h.siegeBesiegerByCity.has('roma') === false,
      turnWyczyszczone: h.siegeTurnByCity.has('roma') === false,
    });
  }
  return { wyniki, insufficientBefore, allEndedAfterFix };
}

const wynikRealSrc = zmierzKonfiguracje(realSrc);
ok(wynikRealSrc !== null, 'harness (validateActiveSieges/endMapSiege/gałąź remis) zbudował się z realnego main.ts dla wszystkich 63 konfiguracji');

if (wynikRealSrc) {
  for (const w of wynikRealSrc.wyniki) {
    ok(w.zakonczoneTeraz,
      `k=${w.idxs.length} heksów [${w.idxs.join(',')}]: city.oblegane===false po wykonaniu gałęzi remis `
      + `(było ${w.zostajePoStarym ? 'TRWAJĄCE' : 'już zniesione'} po samym validateActiveSieges)`);
    ok(w.oblegajacyOwnerIdSkasowany,
      `k=${w.idxs.length} heksów [${w.idxs.join(',')}]: oblegajacyOwnerId skasowany po gałęzi remis`);
    ok(w.besiegerWyczyszczone,
      `k=${w.idxs.length} heksów [${w.idxs.join(',')}]: siegeBesiegerByCity wyczyszczone po gałęzi remis`);
    ok(w.turnWyczyszczone,
      `k=${w.idxs.length} heksów [${w.idxs.join(',')}]: siegeTurnByCity wyczyszczone po gałęzi remis`);
  }

  const { insufficientBefore, allEndedAfterFix } = wynikRealSrc;
  console.log(`[info] 63 konfiguracje: ${insufficientBefore}/63 zostawiało oblężenie TRWAJĄCE po samym `
    + `validateActiveSieges() (stare zachowanie, geometrio-zależne — u Evaluatora naprawy zmierzone `
    + `33/63 przy identycznym wariancie pełnej przejezdności); ${allEndedAfterFix}/63 ma `
    + `city.oblegane===false po WYKONANIU PRAWDZIWEJ gałęzi remis z finishSiegeStormBattle (main.ts, `
    + `ten commit — endMapSiege() w tej gałęzi to realne wywołanie wyciętej funkcji, wołane TYLKO `
    + `jeśli main.ts faktycznie je tam zawiera; patrz §3b niżej dla dowodu mutacyjnego).`);

  ok(allEndedAfterFix === 63,
    `WSZYSTKIE 63/63 konfiguracje muszą kończyć się city.oblegane===false po wykonaniu gałęzi remis (dostało ${allEndedAfterFix}/63)`);
  ok(insufficientBefore > 0,
    'test nie jest pusty: co najmniej jedna z 63 konfiguracji dowodzi, że SAM validateActiveSieges() '
    + '(stare zachowanie) NIE wystarczał — wykonanie gałęzi remis w kroku 3 wykonuje realną pracę, '
    + `dostało ${insufficientBefore}/63 (oczekiwano >0, u Evaluatora naprawy 33/63 dla analogicznego wariantu)`);
}

// ===========================================================================
// §3. SAMOSPRAWDZENIE — cofnięcie naprawy w main.ts musi zaświecić na czerwono
//     ZARÓWNO strażnik §1 (tekstowo), JAK I §2 behawioralnie (§3b) — naprawa noty G1.
// ===========================================================================
let mutBezNaprawy = null; // źródło main.ts w pamięci, bez linii endMapSiege(city.id) w gałęzi remis
{
  const finish = wytnijFunkcjeZParametrami(realSrc, SYG_FINISH);
  ok(!!finish, 'przygotowanie §3: finishSiegeStormBattle wycięty z realnego main.ts');
  if (finish) {
    const zNaprawa = finish.includes('endMapSiege(city.id)');
    ok(zNaprawa, 'przygotowanie §3: realny main.ts zawiera endMapSiege(city.id) (naprawa obecna)');
    if (zNaprawa) {
      // Cofnięcie: usuń DOKŁADNIE linię z wywołaniem endMapSiege(city.id) z gałęzi remis,
      // odtwarzając stan main.ts SPRZED tej naprawy (bez naruszania reszty pliku).
      // UWAGA: `validateActiveSieges` (main.ts) ma DWA WŁASNE wystąpienia identycznego
      // tekstu "          endMapSiege(city.id);" (ten sam wcięcie) — zwykłe realSrc.replace()
      // (bez kotwicy pozycji) usunęłoby PIERWSZE z NICH, nie linię w finishSiegeStormBattle.
      // Kotwiczymy więc usuwaną linię do ABSOLUTNEJ pozycji wewnątrz finishSiegeStormBattle
      // (finishStart + offset względny w `finish`), nie do treści samej w sobie.
      const finishStart = realSrc.indexOf(SYG_FINISH);
      ok(finishStart >= 0, 'przygotowanie §3: znaleziono pozycję finishSiegeStormBattle w realSrc');
      const relIdx = finish.indexOf('endMapSiege(city.id);');
      ok(relIdx >= 0, 'przygotowanie §3: znaleziono względny offset endMapSiege(city.id) w wyciętym bloku');
      if (finishStart >= 0 && relIdx >= 0) {
        const absStart = finishStart + relIdx;
        // Usuń całą linię (od początku wcięcia do końca `;\n`) pod absStart — cofnij się do
        // początku linii (ostatni '\n' przed absStart), żeby zniknął też wiodący whitespace.
        const lineStart = realSrc.lastIndexOf('\n', absStart) + 1;
        const lineEndIncl = realSrc.indexOf('\n', absStart) + 1; // włącznie z '\n' na końcu linii
        ok(realSrc.slice(lineStart, lineEndIncl).includes('endMapSiege(city.id);'),
          'przygotowanie §3: wycięta linia faktycznie zawiera endMapSiege(city.id) (kotwica trafiona)');
        const mut = realSrc.slice(0, lineStart) + realSrc.slice(lineEndIncl);
        // Kontrola: dokładnie JEDNO wystąpienie usunięte (długość spadła o długość linii, nie 0/2×).
        ok(realSrc.length - mut.length === lineEndIncl - lineStart,
          'przygotowanie §3: usunięta dokładnie jedna linia (nie zero, nie duplikat)');
        ok(naruszeniaStruktury(mut).some(m => m.includes('NIE woła endMapSiege')),
          '(mutacja: cofnięcie naprawy) strażnik §1 ŁAPIE regresję — brak endMapSiege(city.id) w gałęzi remis wykryty');
        mutBezNaprawy = mut;
      }
    }
  }
}

// ===========================================================================
// §3b. NAPRAWA NOTY G1 — ta sama mutacja w pamięci musi też zepsuć §2 BEHAWIORALNIE,
// nie tylko strażnik §1. Dawniej (przed tym commitem) §2 wołał endMapSiege('roma')
// bezwarunkowo z harnessu, więc cofnięcie naprawy w main.ts nie miało na §2 ŻADNEGO
// wpływu — 252/265 asercji (63×4) przechodziło mimo braku naprawy w kodzie produkcyjnym.
// Po tej poprawce §2 wykonuje PRAWDZIWĄ wyciętą gałąź remis (wykonajGalazRemis), więc ta
// sama mutacja musi zepsuć dokładnie tyle konfiguracji, ile SAM validateActiveSieges()
// zostawiał nierozwiązanych (insufficientBefore) — bo krok 3 przestaje robić cokolwiek.
// ===========================================================================
{
  ok(mutBezNaprawy !== null, 'przygotowanie §3b: mutacja w pamięci (bez naprawy) dostępna do testu behawioralnego');
  if (mutBezNaprawy !== null && wynikRealSrc !== null) {
    const wynikMut = zmierzKonfiguracje(mutBezNaprawy);
    ok(wynikMut !== null,
      '(mutacja: cofnięcie naprawy) harness §2 nadal buduje się z okrojonego main.ts (blok remis bez tej jednej linii)');
    if (wynikMut) {
      ok(wynikMut.allEndedAfterFix < 63,
        `(mutacja: cofnięcie naprawy) §2 PRZESTAJE przechodzić 63/63 behawioralnie -- dostało `
        + `${wynikMut.allEndedAfterFix}/63. To jest naprawa noty G1 Evaluatora (a159af84): `
        + 'dawniej ta sama mutacja psuła TYLKO strażnik §1 i samosprawdzenie (13/265 asercji), '
        + 'teraz psuje też realne wykonanie gałęzi remis.');
      const oczekiwane = 63 - wynikMut.insufficientBefore;
      ok(wynikMut.allEndedAfterFix === oczekiwane,
        `(mutacja: cofnięcie naprawy) liczba się zgadza dokładnie: 63-${wynikMut.insufficientBefore}=${oczekiwane} `
        + `konfiguracji kończy się WYŁĄCZNIE dzięki samemu validateActiveSieges() (krok 3 nic nie robi bez `
        + `naprawy), dostało ${wynikMut.allEndedAfterFix}/63`);
      ok(wynikMut.insufficientBefore === wynikRealSrc.insufficientBefore,
        '(mutacja: cofnięcie naprawy) validateActiveSieges() sam w sobie NIETKNIĘTY przez mutację -- '
        + `insufficientBefore identyczny z realSrc (${wynikMut.insufficientBefore} = ${wynikRealSrc.insufficientBefore}), `
        + 'różnica leży wyłącznie w kroku 3 (gałąź remis)');
    }
  }
}

// Kontrola pozytywna: nietknięty main.ts MUSI przechodzić — inaczej mutacje §3/§3b nie dowodzą niczego.
ok(naruszeniaStruktury(realSrc).length === 0,
  '(kontrola) nietknięty main.ts przechodzi strażnik §1 — mutacje §3/§3b nie są fałszywie dodatnie');

fs.rmSync(ENTRY, { force: true });
fs.rmSync(BUNDLE, { force: true });
console.log('oblezenie-remis-endsiege-test: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
