'use strict';
/**
 * oblezenie-siege-lifted-po-bitwie-test.cjs
 * P-OBLEZENIE-IKONA-NIE-ZNIKA-PO-WYGRANEJ (Maciej 2026-08-14, dyspozycje/PYTANIA-OTWARTE.md).
 *
 * ZGŁOSZENIE: „w momencie gdy mamy oblężenie i je przerwiemy, wygramy, po wygranej bitwie,
 * nadal widnieje symbol oblężenia na mieście, znika dopiero jak się wejdzie z powrotem
 * jednostką do miasta."
 *
 * DIAGNOZA (patrz PYTANIA-OTWARTE.md): `city.oblegane` jest flagą STANOWĄ, nie liczoną na
 * żywo. Jedyna funkcja, która potrafi ją zdjąć po WYKRYCIU że oblegający już nie żyją, to
 * `validateActiveSieges()` (main.ts) — ale przed tą naprawą była wołana wyłącznie po RUCHU
 * jednostki (main.ts, obsługa marszu ×2) i na koniec tury AI (scanAutoSiegesAfterAiTurn,
 * warunkowo — pomijane gdy `aiTurnAwaitingBattle`). Żadne z tych miejsc nie jest wołane z
 * rozstrzygnięcia BITWY — więc zwycięska bitwa polowa nad armią oblegającą nie czyściła
 * flagi, dopóki cokolwiek się nie ruszyło.
 *
 * NAPRAWA: `validateActiveSieges()` dodane na końcu `applyMapBattleOutcome()` — to JEDYNY
 * wspólny punkt, przez który przechodzi KAŻDA ścieżka rozstrzygnięcia bitwy polowej na
 * mapie (auto-resolve gracza/AI, ręczna bitwa 3D, szturm muru z podsumowaniem i bez) —
 * patrz komentarz przy wywołaniu w main.ts. Naprawa w JEDNYM miejscu pokrywa WSZYSTKIE
 * ścieżki (nie trzeba duplikować w każdym callerze) i działa też, gdy bitwa gracza
 * rozstrzyga się W TRAKCIE tury AI (aiTurnAwaitingBattle=true) — bo woła się synchronicznie
 * wewnątrz rozstrzygnięcia, nie czeka na koniec tury AI.
 *
 * OGRANICZENIE (dokumentowane, nie obchodzone dużą przebudową — zgodnie z poleceniem):
 * `validateActiveSieges`/`endMapSiege`/`applyMapBattleOutcome` żyją jako domknięcia
 * wewnątrz `async function boot()` w main.ts, ze wspólnym stanem (`cities`, `units`,
 * mapy Map<>, referencje do UI). Nie da się ich zaimportować wprost bez dużej
 * przebudowy (rozbicia main.ts) — sprzecznej z poleceniem „NIE rób dużej przebudowy".
 * Test więc łączy DWIE warstwy, wzorem `road-hook-mainguard-test.cjs`:
 *   §1 STRAŻNIK TEKSTOWY — potwierdza że wywołanie zostało dodane we WŁAŚCIWYM miejscu
 *      (wewnątrz applyMapBattleOutcome, PO applyPostBattleMap — inaczej zobaczyłoby
 *      jeszcze martwe jednostki w units[]) i że istniejące 3 miejsca się nie zgubiły.
 *   §2 TEST BEHAWIORALNY — wycina PRAWDZIWY tekst `validateActiveSieges` i `endMapSiege`
 *      z bieżącego main.ts (nie reimplementację-kopię!) i wykonuje go NAPRAWDĘ przez
 *      `new Function`, z prawdziwym `hexDistance` (src/units/setup.ts, czysta funkcja)
 *      i atrapami tylko dla zależności UI/renderowania (refreshSiegeMarkers,
 *      hideSiegeMapPanel, showHintMessage, clearSiegeMachines — żadna z nich nie wpływa
 *      na logikę decyzyjną „czy oblegający wciąż stoi przy murze").
 *   §3 SAMOSPRAWDZENIE — te same asercje puszczone na ZMUTOWANYCH W PAMIĘCI kopiach
 *      main.ts (bez dotykania dysku) muszą zaświecić na czerwono — dowód, że strażnik
 *      faktycznie łapie regresję, a nie tylko biernie przechodzi.
 *
 * Bramka (z katalogu gra/): node tools/oblezenie-siege-lifted-po-bitwie-test.cjs — exit 0 = zielona.
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
// Wycinanie funkcji po SYGNATURZE (nie po numerze linii — te się przesuwają przy
// każdym commicie). Wzorzec kanoniczny w repo: road-hook-mainguard-test.cjs.
// ---------------------------------------------------------------------------
function wytnijFunkcje(src, sygnatura) {
  const start = src.indexOf(sygnatura);
  if (start < 0) return null;
  // Najpierw przeskocz CAŁĄ listę parametrów licząc nawiasy okrągłe (nie klamrowe) --
  // applyMapBattleOutcome ma parametr `opts?: { ... }` z własnymi klamrami W ŚRODKU listy
  // parametrów, więc naiwne "pierwszy `{` po sygnaturze" trafiłoby w typ, nie w ciało.
  let parenIdx = src.indexOf('(', start);
  if (parenIdx < 0) return null;
  let pdepth = 0;
  let i = parenIdx;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '(') pdepth++;
    else if (c === ')') { pdepth--; if (pdepth === 0) { i++; break; } }
  }
  // Od końca listy parametrów (ewentualnie po adnotacji typu zwracanego) znajdź
  // faktyczne otwarcie ciała funkcji i policz klamry.
  const bodyStart = src.indexOf('{', i);
  if (bodyStart < 0) return null;
  let depth = 0;
  let j = bodyStart;
  for (; j < src.length; j++) {
    const c = src[j];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(start, j + 1); }
  }
  return null;
}

const SYG_OUTCOME = 'function applyMapBattleOutcome(';
const SYG_VALIDATE = 'function validateActiveSieges(): void {';
const SYG_END_SIEGE = 'function endMapSiege(cityId: string): void {';

// ===========================================================================
// §1. STRAŻNIK TEKSTOWY
// ===========================================================================
/** Zwraca listę komunikatów o naruszeniach (pusta = struktura w porządku). */
function naruszeniaStruktury(src) {
  const b = [];

  const outcome = wytnijFunkcje(src, SYG_OUTCOME);
  if (!outcome) { b.push('brak applyMapBattleOutcome w main.ts'); return b; }

  const idxValidate = outcome.indexOf('validateActiveSieges()');
  if (idxValidate < 0) {
    b.push('applyMapBattleOutcome NIE woła validateActiveSieges() — ikona/etykieta oblężenia '
      + 'zostanie na mieście po wygranej bitwie aż do najbliższego ruchu jednostki');
  } else {
    // Kolejność: MUSI być PO applyPostBattleMap(...) — inaczej zobaczy jeszcze martwe
    // jednostki w units[] i błędnie uzna, że oblegający wciąż stoją przy murze.
    const idxPost = outcome.indexOf('applyPostBattleMap(');
    if (idxPost < 0) b.push('applyMapBattleOutcome nie woła applyPostBattleMap — nieoczekiwana struktura');
    else if (idxValidate < idxPost) {
      b.push('validateActiveSieges() wołane PRZED applyPostBattleMap — zobaczy jeszcze martwe '
        + 'jednostki w units[], sprawdzenie oblężenia będzie nieaktualne o jeden krok');
    }
  }

  if (!wytnijFunkcje(src, SYG_VALIDATE)) b.push('brak validateActiveSieges w main.ts');
  if (!wytnijFunkcje(src, SYG_END_SIEGE)) b.push('brak endMapSiege w main.ts');

  // Trzy ISTNIEJĄCE miejsca (ruch natychmiastowy, ruch po animacji, koniec tury AI) nie
  // mogą się zgubić przy okazji tej naprawy — plus nowe w applyMapBattleOutcome = 4.
  const wywolania = (src.match(/validateActiveSieges\(\);/g) || []).length;
  if (wywolania !== 4) {
    b.push(`validateActiveSieges() wołane ${wywolania}× w main.ts, oczekiwano dokładnie 4 `
      + '(2× obsługa ruchu + scanAutoSiegesAfterAiTurn + applyMapBattleOutcome)');
  }

  return b;
}

const naruszenia = naruszeniaStruktury(realSrc);
ok(naruszenia.length === 0,
  'applyMapBattleOutcome woła validateActiveSieges() PO applyPostBattleMap, 4 wywołania łącznie w main.ts'
  + (naruszenia.length ? ' → ' + naruszenia.join(' | ') : ''));

// ===========================================================================
// §2. TEST BEHAWIORALNY — prawdziwy kod main.ts wykonany w izolacji
// ===========================================================================
const ENTRY = path.resolve(__dirname, '.oblezenie-lifted-entry.ts');
const BUNDLE = path.resolve(__dirname, '.oblezenie-lifted-bundle.cjs');
fs.writeFileSync(ENTRY, `export { hexDistance } from '../src/units/setup';\n`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
  absWorkingDir: GRA_ROOT, nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { hexDistance } = require(BUNDLE);

/**
 * Buduje działające `validateActiveSieges` + `endMapSiege` z PODANEGO tekstu źródła
 * (prawdziwego albo zmutowanego w pamięci, §3). Wolne zmienne domknięcia main.ts
 * podstawiamy atrapami (UI/renderowanie — nie wpływają na logikę decyzyjną);
 * `hexDistance` jest PRAWDZIWY (import wyżej), bo to on decyduje "czy oblegający
 * wciąż stoi przy murze" — dokładnie ta część, która musi być wiarygodna.
 */
function zbudujHarness(src) {
  const validateTxt = wytnijFunkcje(src, SYG_VALIDATE);
  const endSiegeTxt = wytnijFunkcje(src, SYG_END_SIEGE);
  if (!validateTxt || !endSiegeTxt) return null;
  const js = esbuild.transformSync(endSiegeTxt + '\n' + validateTxt, { loader: 'ts', target: 'node18' }).code;

  const cities = [];
  const units = [];
  const calls = { refreshSiegeMarkers: 0, hideSiegeMapPanel: 0, clearSiegeMachines: 0, hints: [] };
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
  };
  const fabryka = new Function('deps', `
    const { cities, units, hexDistance, clearSiegeMachines, siegeBesiegerByCity,
            siegeAiStateByKey, siegeAiKey, siegeTurnByCity, refreshSiegeMarkers,
            getActiveSiegeCityId, hideSiegeMapPanel, showHintMessage } = deps;
    ${js}
    return { validateActiveSieges, endMapSiege };
  `);
  const F = fabryka(deps);
  return { cities, units, calls, siegeBesiegerByCity, F };
}

// --- Scenariusz A (ZGŁOSZENIE Macieja): bitwa niszczy WSZYSTKIE jednostki oblegającego,
//     bez ruchu i bez zdobycia miasta — oblegane musi wrócić na false OD RAZU. ---
{
  const h = zbudujHarness(realSrc);
  ok(!!h, 'wycięcie validateActiveSieges/endMapSiege z main.ts się powiodło');
  if (h) {
    const city = { id: 'roma', ownerId: 0, oblegane: true, oblegajacyOwnerId: 1, q: 5, r: 0, name: 'Roma' };
    h.cities.push(city);
    h.siegeBesiegerByCity.set('roma', 1);
    // Jednostka gracza w mieście — NIE poruszona (dokładnie scenariusz zgłoszenia:
    // "znika dopiero jak się wejdzie jednostką do miasta" -- tu celowo NIKT nie wchodzi).
    h.units.push({ id: 'u-def', ownerId: 0, q: 5, r: 0 });
    // Jednostki oblegające (bId=1) USUNIĘTE z units[] -- to właśnie robi applyPostBattleMap
    // po przegranej bitwie oblegającego. Symulacja: po prostu ich tu nie ma.

    h.F.validateActiveSieges();

    ok(city.oblegane === false, 'Scenariusz A: city.oblegane wraca na false zaraz po bitwie (bez ruchu)');
    ok(city.oblegajacyOwnerId === undefined, 'Scenariusz A: oblegajacyOwnerId skasowany');
    ok(h.calls.refreshSiegeMarkers === 1, 'Scenariusz A: refreshSiegeMarkers wywołane (marker/etykieta znika)');
    ok(h.siegeBesiegerByCity.has('roma') === false, 'Scenariusz A: siegeBesiegerByCity wyczyszczone');
  }
}

// --- Scenariusz B (kontrola negatywna — NIE wolno zdejmować za wcześnie): oblegający
//     WCIĄŻ stoi przy murze (dystans 1) — oblegane musi ZOSTAĆ true. ---
{
  const h = zbudujHarness(realSrc);
  const city = { id: 'ateny', ownerId: 2, oblegane: true, oblegajacyOwnerId: 1, q: 0, r: 0, name: 'Ateny' };
  h.cities.push(city);
  h.siegeBesiegerByCity.set('ateny', 1);
  h.units.push({ id: 'u-atk', ownerId: 1, q: 1, r: 0 }); // dystans 1 od (0,0) -- wciąż oblega

  h.F.validateActiveSieges();

  ok(city.oblegane === true, 'Scenariusz B: oblegający wciąż przy murze — oblegane NIE zdjęte (brak fałszywego pozytywu)');
  ok(h.calls.refreshSiegeMarkers === 0, 'Scenariusz B: refreshSiegeMarkers NIE wywołane -- nic się nie zmieniło');
}

// --- Scenariusz C (kontrola): oblegający ŻYJE, ale się wycofał poza dystans 1 --
//     zachowanie sprzed tej naprawy, musi dalej działać identycznie. ---
{
  const h = zbudujHarness(realSrc);
  const city = { id: 'sparta', ownerId: 0, oblegane: true, oblegajacyOwnerId: 1, q: 0, r: 0, name: 'Sparta' };
  h.cities.push(city);
  h.siegeBesiegerByCity.set('sparta', 1);
  h.units.push({ id: 'u-atk', ownerId: 1, q: 5, r: 5 }); // daleko

  h.F.validateActiveSieges();

  ok(city.oblegane === false, 'Scenariusz C: oblegający żyje ale poza dystansem 1 -- oblegane zdjęte (regresja niedopuszczalna)');
}

// --- Scenariusz D (edge case istniejący wcześniej): brak wpisu oblegajacyOwnerId ani
//     w siegeBesiegerByCity -- kończy oblężenie natychmiast (bId===undefined). ---
{
  const h = zbudujHarness(realSrc);
  const city = { id: 'kartagina', ownerId: 0, oblegane: true, q: 0, r: 0, name: 'Kartagina' };
  h.cities.push(city);

  h.F.validateActiveSieges();

  ok(city.oblegane === false, 'Scenariusz D: brak bId -- oblężenie kończone (zachowanie sprzed naprawy, bez zmian)');
}

// ===========================================================================
// §3. SAMOSPRAWDZENIE — mutacje w PAMIĘCI (dysk nietknięty)
// ===========================================================================
function zmutuj(src, z, na, etykieta) {
  if (!src.includes(z)) { fail++; console.error('FAIL: mutacja nieprzygotowana —', etykieta, '(nie znaleziono wzorca)'); return null; }
  return src.replace(z, na);
}

// MUT-1: przywrócenie BUGA -- validateActiveSieges() usunięte z applyMapBattleOutcome.
//        To jest DOKŁADNIE stan main.ts SPRZED tej naprawy.
{
  const outcome = wytnijFunkcje(realSrc, SYG_OUTCOME);
  const insert = '\n      validateActiveSieges();\n      return battleLoot;';
  ok(outcome.includes(insert), 'przygotowanie MUT-1: wzorzec do usunięcia znaleziony w applyMapBattleOutcome');
  const mut = zmutuj(realSrc, insert, '\n      return battleLoot;', 'MUT-1');
  ok(mut !== null && naruszeniaStruktury(mut).some(m => m.includes('NIE woła validateActiveSieges')),
    '(mutacja MUT-1 = stan sprzed naprawy) brak wywołania w applyMapBattleOutcome -- ZŁAPANE strażnikiem tekstowym');
  if (mut !== null) {
    const h = zbudujHarness(mut); // validateActiveSieges/endMapSiege same w sobie nietknięte -- harness dalej działa
    // Ale w main.ts realnym applyMapBattleOutcome przestałby jej wołać -- symulujemy TO
    // bezpośrednio: brak wywołania walidacji po bitwie = flaga zostaje wisieć.
    ok(!!h, '(mutacja MUT-1) harness nadal buduje się z okrojonego main.ts (walidacja/endSiege nietknięte)');
  }
}

// MUT-2: wywołanie przeniesione PRZED applyPostBattleMap -- widziałoby jeszcze martwe
//        jednostki oblegającego jako "wciąż przy murze".
{
  const przed = zmutuj(
    realSrc,
    'applyPostBattleMap({',
    'DUMMY_MARKER_NIGDY_NIE_ISTNIEJACY_W_KODZIE({',
    'MUT-2 (marker)',
  );
  ok(przed !== null, 'przygotowanie MUT-2: applyPostBattleMap( znaleziony do podmiany znacznikiem');
  if (przed !== null) {
    // Wstaw validateActiveSieges() TUŻ PRZED oryginalnym applyPostBattleMap(, usuwając
    // wywołanie z końca funkcji (żeby nie było 2×, co inny strażnik złapałby z innego powodu).
    const bezKonca = przed.replace('\n      validateActiveSieges();\n      return battleLoot;', '\n      return battleLoot;');
    const zPrzeniesionym = bezKonca.replace(
      'DUMMY_MARKER_NIGDY_NIE_ISTNIEJACY_W_KODZIE({',
      'validateActiveSieges();\n      applyPostBattleMap({',
    );
    ok(naruszeniaStruktury(zPrzeniesionym).some(m => m.includes('PRZED applyPostBattleMap')),
      '(mutacja MUT-2) wywołanie przeniesione przed applyPostBattleMap -- ZŁAPANE (kolejność)');
  }
}

// Kontrola pozytywna: nietknięte źródło MUSI przechodzić -- inaczej mutacje wyżej nie
// dowodzą niczego (świeciłyby na czerwono zawsze).
ok(naruszeniaStruktury(realSrc).length === 0,
  '(kontrola) nietknięty main.ts przechodzi strażnik -- mutacje MUT-1/MUT-2 nie są fałszywie dodatnie');

fs.rmSync(ENTRY, { force: true });
fs.rmSync(BUNDLE, { force: true });
console.log('oblezenie-siege-lifted-po-bitwie-test: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
