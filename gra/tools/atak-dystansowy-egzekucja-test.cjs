'use strict';
/**
 * atak-dystansowy-egzekucja-test.cjs — P-BITWA-ATAK-DYSTANSOWY-EGZEKUCJA-Q1=B (RUNDA 3,
 * Maciej 2026-08-16, ECHO w dyspozycje/PYTANIA-OTWARTE.md).
 *
 * PO CO TEN PLIK. RUNDA 2 (a5bcd99a) naprawiła WARSTWĘ DECYZJI: `ai.ts:isWithinCityAttackRange`
 * daje AI ten sam zasięg ataku na miasta co gracz. Evaluator (werdykt FAIL, 2026-08-16) wykazał,
 * że rozkaz `{type:'move', toQ:city.q, toR:city.r}` wyemitowany przez tę gałąź NIGDY nie
 * dociera do egzekucji: jedyny egzekutor komend AI (`main.ts`, `cmd.type === 'move'`) najpierw
 * sprawdza `canUnitOccupyCityHex(...)` (`city-hex-movement.ts`), a ta funkcja BEZWARUNKOWO
 * zwraca `false` dla heksu obcego miasta — rozkaz jest kasowany (`continue`), jednostka NIC nie
 * robi (wcześniej, przed RUNDĄ 2, ta sama jednostka dostawała realny krok w gałęzi "ranged hold
 * back" — main.ts:isRanged). To REGRESJA, nie martwy kod: bramka `atak-dystansowy-mapa-test.cjs`
 * (sekcja h + strażnik) tego NIE łapie, bo testuje WYŁĄCZNIE warstwę decyzji (czysta funkcja
 * `isWithinCityAttackRange`), nigdy egzekutor `main.ts`.
 *
 * TEN TEST sprawdza rozkaz PO PRZEJŚCIU PRZEZ PRAWDZIWY EGZEKUTOR — nie sam predykat w
 * oderwaniu. Metoda (kanoniczny wzorzec repo — `oblezenie-remis-endsiege-test.cjs`,
 * `road-hook-mainguard-test.cjs`): CAŁY blok `if (cmd.type === 'move') { … }` z `main.ts`
 * (jedyny egzekutor komend AI) wycinany jest TEKSTOWO z PRAWDZIWEGO źródła (brace-matching,
 * nie po numerze linii — te się przesuwają) i wykonywany NAPRAWDĘ przez `new Function`,
 * owinięty w jednoelementową pętlę `for` (żeby `continue` z main.ts miał do czego się odnieść).
 * Prawdziwe zależności — `computePath`/`keyOf` (units/setup.ts), `addForeignCityBlocks`/
 * `canUnitOccupyCityHex`/`canAiEnterUndefendedCityHex` (game/city-hex-movement.ts) —
 * wstrzyknięte jako parametry, zbundlowane esbuildem z prawdziwych plików źródłowych. Efekty
 * uboczne bez znaczenia dla bramki wejścia (SFX, zbieranie chatek, obozy barbarzyńskie,
 * render) są zaślepione no-opami — nie testujemy ICH, testujemy WYŁĄCZNIE czy jednostka
 * faktycznie zmienia pozycję (rozkaz PRZEŻYŁ egzekutor) czy nie (rozkaz ZOSTAŁ SKASOWANY).
 *
 * Pokrycie:
 *  (a) SCENARIUSZ Z WERDYKTU: jednostka dystansowa (Łucznik, zasięg 3) w promieniu 2-3 heksów
 *      od pustego, niebronionego miasta wroga BEZ MURU, z rozkazem oznaczonym
 *      `rangedCityAttackEntry:true` → PO naprawie jednostka FAKTYCZNIE wchodzi na heks miasta
 *      (rozkaz nie jest cicho odrzucony).
 *  (b) KONTROLA — miasto Z MUREM, ta sama geometria/flaga → nadal blokowane (oblężenie to inna
 *      mechanika, nietknięta tym tematem; brak nowej furtki dla murów).
 *  (c) KONTROLA — miasto BEZ muru, ALE Z OBROŃCĄ, ta sama flaga → nadal blokowane (ogólna
 *      ścieżka zdobycia miasta z obrońcami to N2 werdyktu, świadomie POZA zakresem tej rundy).
 *  (d) STRAŻNIK NAJWAŻNIEJSZY — DOKŁADNIE TA SAMA geometria jak (a) (puste, nieobmurowane
 *      miasto w zasięgu), ale rozkaz BEZ `rangedCityAttackEntry` (jak KAŻDA inna gałąź ai.ts:
 *      marsz, patrol, obrona domu, wioski) → nadal blokowane. Dowodzi, że wyjątek NIE otwiera
 *      ogólnej furtki dla wszystkich rozkazów `move`, tylko dla tej jednej, oznaczonej gałęzi.
 *  (e) KONTROLA — własne miasto (ownerId zgodny) → wejście dozwolone niezależnie od flagi
 *      (zero zmiany zachowania bazowego).
 *  MUT-K — cofnięcie naprawy (mutacja TEKSTOWA W PAMIĘCI, plik na dysku nietknięty): dokładnie
 *      ten sam scenariusz (a) z cofniętym egzekutorem MUSI dać "jednostka nic nie robi" —
 *      odtworzenie REGRESJI zmierzonej przez Evaluatora. Kontrola (b)/(c)/(d)/(e) zostają
 *      bez zmian (dowód że mutacja trafia wyłącznie w wąski wyjątek, nie w resztę egzekutora).
 *
 * Bramka (z katalogu gra/): node tools/atak-dystansowy-egzekucja-test.cjs — exit 0 = zielona.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_ROOT, 'src', 'main.ts');
const realMainSrc = fs.readFileSync(MAIN_TS, 'utf8');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; } else { fail++; console.error('FAIL:', label); }
}

// ---------------------------------------------------------------------------
// Wycinanie bloku po UNIKALNYM MARKERZE tekstowym + brace-matching (ten sam
// wzorzec co `wytnijFunkcje` w atak-dystansowy-mapa-test.cjs / road-hook-mainguard-test.cjs,
// zastosowany tu nie do sygnatury funkcji, tylko do bloku `if (…) { … }` — brace-matching
// nie dba o to, co poprzedza pierwszy `{`).
// ---------------------------------------------------------------------------
function wytnijBlok(src, marker) {
  const start = src.indexOf(marker);
  if (start < 0) return null;
  let i = src.indexOf('{', start);
  if (i < 0) return null;
  let depth = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  return null;
}

// Marker jednoznaczny w main.ts: WYŁĄCZNIE egzekutor komend AI (nie barbarzyński
// `bcmd.type === 'move'`, inny identyfikator zmiennej).
const MARKER_MOVE_EXEC = "if (cmd.type === 'move') {";

function zmutuj(src, z, na, etykieta) {
  if (!src.includes(z)) { fail++; console.error('FAIL: mutacja nieprzygotowana —', etykieta, '(nie znaleziono wzorca)'); return null; }
  return src.replace(z, na);
}

// --- moduły logiki prawdziwej (bundlowane, nie atrapy) ---------------------
const ENTRY = path.resolve(__dirname, '.atak-dystansowy-egzekucja-entry.ts');
const BUNDLE = path.resolve(__dirname, '.atak-dystansowy-egzekucja-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { computePath, keyOf } from '../src/units/setup';
export {
  canUnitOccupyCityHex, addForeignCityBlocks, canAiEnterUndefendedCityHex,
} from '../src/game/city-hex-movement';
export { canCaptureCityWithoutBattle, hasCityDefenders } from '../src/game/siegeDefenders';
`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
  absWorkingDir: GRA_ROOT, nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const MOD = require(BUNDLE);
const {
  computePath, keyOf, canUnitOccupyCityHex, addForeignCityBlocks, canAiEnterUndefendedCityHex,
  canCaptureCityWithoutBattle, hasCityDefenders,
} = MOD;

// ---------------------------------------------------------------------------
// RUNDA 4 (P-BITWA-ATAK-DYSTANSOWY-WEJSCIE-Q1=A): atrapa REALISTYCZNA (nie no-op)
// dla `tryAutoCaptureEmptyCityAt` — main.ts jej NIE eksportuje (funkcja zagnieżdżona
// w domknięciu z tuzinem zależności UI: hideSiegeMapPanel/showCityCaptureNotice/
// applyCityCaptureToMap/refreshMapAfterCityCapture/..., ten sam powód dla którego
// main.ts w OGÓLE nie jest bundlowany w tym repo — patrz nagłówek
// barb-city-capture-cluster-test.cjs). Atrapa odtwarza jej OBSERWOWALNY kontrakt
// (zmiana city.ownerId na ownerId anchora, gdy miasto jest naprawdę zdobywalne bez
// bitwy) wołając PRAWDZIWĄ, czystą canCaptureCityWithoutBattle (siegeDefenders.ts,
// bundlowaną wyżej) — nie kopiuje jej formuły. Egzekwowanie, że PRAWDZIWY main.ts
// FAKTYCZNIE woła tryAutoCaptureEmptyCityAt w tym miejscu (nie tylko atrapę) jest
// osobnym, statycznym strażnikiem niżej (marker + okno tekstu źródłowego).
// ---------------------------------------------------------------------------
function zbudujTryAutoCaptureMock(units, cities) {
  return function tryAutoCaptureEmptyCityAt(q, r, arrivingUnits) {
    const city = cities.find(c => c.q === q && c.r === r);
    if (!city || arrivingUnits.length === 0) return false;
    const anchor = arrivingUnits[0];
    if (city.ownerId === anchor.ownerId) return false;
    if (!canCaptureCityWithoutBattle(city, units)) return false;
    city.ownerId = anchor.ownerId;
    return true;
  };
}

// ---------------------------------------------------------------------------
// Buduje i wykonuje NAPRAWDĘ blok egzekutora `cmd.type==='move'` wycięty z (ew.
// zmutowanego w pamięci) źródła main.ts. Efekty uboczne bez znaczenia dla bramki
// wejścia (SFX/chatki/obozy/render) zaślepione no-opami — testujemy WYŁĄCZNIE czy
// `u.q`/`u.r` się zmieniają (rozkaz przeżył egzekutor) czy nie (rozkaz skasowany),
// oraz (RUNDA 4) czy `city.ownerId` się zmienia (realne przejęcie, przez atrapę
// tryAutoCaptureEmptyCityAt wyżej).
// ---------------------------------------------------------------------------
function wykonajMoveExec(src, { cmd, ownerId, units, cities, map }) {
  const blokTxt = wytnijBlok(src, MARKER_MOVE_EXEC);
  if (!blokTxt) return { ok: false, reason: 'nie znaleziono bloku cmd.type===\'move\' w main.ts' };
  // Owinięcie W PĘTLĘ PRZED transformacją TS -- `continue` z main.ts jest tylko
  // składniowo poprawny wewnątrz pętli; transformSync na SAMYM bloku (bez pętli)
  // odrzuca go jako błąd parsowania.
  const tsZPetla = `for (let _execOnce = 0; _execOnce < 1; _execOnce++) {\n${blokTxt}\n}`;
  const js = esbuild.transformSync(tsZPetla, { loader: 'ts', target: 'node18' }).code;
  const fabryka = new Function('deps', `
    const {
      cmd, ownerId, units, cities, map, keyOf, computePath, addForeignCityBlocks,
      moveCostFnForUnit, canUnitOccupyCityHex, canAiEnterUndefendedCityHex,
      applyEmbarkStateAfterMove, checkBarbCampDestructionAlongPath, checkVillageRewardsAlongPath,
      applyCityVisitBonusesAlongPath, syncUnitsRender, sfxUnitsEnabled, aiVisNow, playMarchAccent,
      tryAutoCaptureEmptyCityAt,
    } = deps;
    ${js}
  `);
  fabryka({
    cmd, ownerId, units, cities, map, keyOf, computePath, addForeignCityBlocks,
    canUnitOccupyCityHex, canAiEnterUndefendedCityHex,
    // Zaślepiony koszt ruchu (stała 1/heks, teren pomijany) — bramka wejścia jest
    // niezależna od kosztów terenu; testowane wyłącznie zezwolenie/blokada heksu.
    moveCostFnForUnit: () => () => 1,
    applyEmbarkStateAfterMove: () => {},
    checkBarbCampDestructionAlongPath: () => {},
    checkVillageRewardsAlongPath: () => {},
    applyCityVisitBonusesAlongPath: () => false,
    syncUnitsRender: () => {},
    sfxUnitsEnabled: false,
    aiVisNow: null,
    playMarchAccent: () => {},
    tryAutoCaptureEmptyCityAt: zbudujTryAutoCaptureMock(units, cities),
  });
  return { ok: true };
}

// Mapa: prostokąt heksów istniejących wystarczająco duży dla dystansów użytych w
// scenariuszach (max 3) + margines na PATH_SEARCH_RADIUS_BUFFER computePath.
// Obiekty-heksy puste — moveCostFnForUnit jest zaślepiony (ignoruje teren).
function zbudujMape() {
  const hexes = {};
  for (let q = -12; q <= 12; q++) {
    for (let r = -12; r <= 12; r++) {
      hexes[`${q},${r}`] = {};
    }
  }
  return { hexes };
}

console.log('atak-dystansowy-egzekucja-test');

ok(!!wytnijBlok(realMainSrc, MARKER_MOVE_EXEC), 'wycięcie bloku egzekutora cmd.type===\'move\' z main.ts powiodło się');

function ru(typeId, q, r, ownerId) {
  return { id: `t-${typeId}-${q}-${r}-${ownerId}`, typeId, q, r, ownerId, ruchLeft: 2, ruch: 2 };
}

// ===========================================================================
// (a) SCENARIUSZ Z WERDYKTU: Łucznik (zasięg 3) @ dystans 2 i 3 od pustego,
// niebronionego, nieobmurowanego miasta wroga — rozkaz Z rangedCityAttackEntry.
// ===========================================================================
for (const dist of [2, 3]) {
  const atk = ru('Łucznik', 0, 0, 1);
  const city = { id: 'c-empty', ownerId: 2, q: dist, r: 0, name: 'Milet', maMur: false, garnizon: 0 };
  const units = [atk];
  const cities = [city];
  const cmd = { type: 'move', unitId: atk.id, toQ: city.q, toR: city.r, rangedCityAttackEntry: true };
  const res = wykonajMoveExec(realMainSrc, { cmd, ownerId: 1, units, cities, map: zbudujMape() });
  ok(res.ok, `(a) dystans=${dist}: egzekutor uruchomiony bez błędu (${res.reason || 'ok'})`);
  ok(atk.q === city.q && atk.r === city.r,
    `(a) dystans=${dist}: PO naprawie Łucznik FAKTYCZNIE wchodzi na heks pustego/nieobmurowanego miasta (q=${atk.q},r=${atk.r}, oczekiwano q=${city.q},r=${city.r} — rozkaz NIE jest cicho odrzucony)`);
  ok(atk.ruchLeft === 0, `(a) dystans=${dist}: ruchLeft=0 po wejściu (zużyty ruch, jak każdy inny ruch AI)`);
  // RUNDA 4 (P-BITWA-ATAK-DYSTANSOWY-WEJSCIE-Q1=A): wejście MUSI też realnie przejąć
  // miasto (city.ownerId -> ownerId jednostki), nie tylko przesunąć jednostkę na heks —
  // to jest DOKŁADNIE naprawa B1/B2 z werdyktu rundy 3 (evict przestaje wypychać, bo
  // canUnitOccupyCityHex widzi już zgodnego ownerId).
  ok(city.ownerId === 1,
    `(a) dystans=${dist}: RUNDA 4 -- miasto REALNIE przejęte (city.ownerId=${city.ownerId}, oczekiwano 1 -- ownerId jednostki)`);
}

// ===========================================================================
// (b) KONTROLA: miasto Z MUREM, ta sama geometria i flaga → nadal blokowane
// (oblężenie to inna mechanika — mapSiegeDetect.classifyCityAttack — nietknięta).
// ===========================================================================
{
  const atk = ru('Łucznik', 0, 0, 1);
  const city = { id: 'c-walled', ownerId: 2, q: 2, r: 0, name: 'Ateny', maMur: true, garnizon: 0 };
  const units = [atk];
  const cities = [city];
  const cmd = { type: 'move', unitId: atk.id, toQ: city.q, toR: city.r, rangedCityAttackEntry: true };
  wykonajMoveExec(realMainSrc, { cmd, ownerId: 1, units, cities, map: zbudujMape() });
  ok(atk.q === 0 && atk.r === 0,
    `(b) miasto Z MUREM: Łucznik NIE wchodzi na heks mimo rangedCityAttackEntry (q=${atk.q},r=${atk.r}, oczekiwano bez zmian 0,0 — brak nowej furtki dla murów)`);
}

// ===========================================================================
// (c) KONTROLA: miasto BEZ muru, ALE Z OBROŃCĄ (garnizon>0), ta sama flaga →
// nadal blokowane (N2 werdyktu — ogólna ścieżka zdobycia miasta z obrońcami
// przez AI — świadomie POZA zakresem tej rundy).
// ===========================================================================
{
  const atk = ru('Łucznik', 0, 0, 1);
  const city = { id: 'c-defended', ownerId: 2, q: 2, r: 0, name: 'Korynt', maMur: false, garnizon: 1 };
  const units = [atk];
  const cities = [city];
  const cmd = { type: 'move', unitId: atk.id, toQ: city.q, toR: city.r, rangedCityAttackEntry: true };
  wykonajMoveExec(realMainSrc, { cmd, ownerId: 1, units, cities, map: zbudujMape() });
  ok(atk.q === 0 && atk.r === 0,
    `(c) miasto BRONIONE (garnizon=1): Łucznik NIE wchodzi na heks mimo rangedCityAttackEntry (q=${atk.q},r=${atk.r} — N2 werdyktu świadomie poza zakresem)`);
}

// ===========================================================================
// (d) STRAŻNIK NAJWAŻNIEJSZY: DOKŁADNIE ta sama geometria jak (a) (puste,
// nieobmurowane miasto w zasięgu), ale BEZ rangedCityAttackEntry (jak KAŻDA
// inna gałąź ai.ts — marsz, patrol, obrona domu, wioski) → nadal blokowane.
// Dowodzi że wyjątek nie otwiera ogólnej furtki dla wszystkich rozkazów `move`.
// ===========================================================================
{
  const atk = ru('Łucznik', 0, 0, 1);
  const city = { id: 'c-empty-noflag', ownerId: 2, q: 2, r: 0, name: 'Milet', maMur: false, garnizon: 0 };
  const units = [atk];
  const cities = [city];
  const cmd = { type: 'move', unitId: atk.id, toQ: city.q, toR: city.r }; // BRAK rangedCityAttackEntry
  wykonajMoveExec(realMainSrc, { cmd, ownerId: 1, units, cities, map: zbudujMape() });
  ok(atk.q === 0 && atk.r === 0,
    `(d) IDENTYCZNA geometria jak (a), ale BEZ rangedCityAttackEntry: Łucznik NIE wchodzi (q=${atk.q},r=${atk.r} — wyjątek ograniczony WYŁĄCZNIE do oznaczonej gałęzi, nie do wszystkich \`move\`)`);
}

// ===========================================================================
// (e) KONTROLA: własne miasto (ownerId zgodny) → wejście dozwolone niezależnie
// od flagi (zero zmiany zachowania bazowego dla zwykłego ruchu we własnym mieście).
// ===========================================================================
{
  const atk = ru('Łucznik', 0, 0, 1);
  const city = { id: 'c-own', ownerId: 1, q: 2, r: 0, name: 'Rzym', maMur: false, garnizon: 0 };
  const units = [atk];
  const cities = [city];
  const cmd = { type: 'move', unitId: atk.id, toQ: city.q, toR: city.r }; // BRAK flagi -- nieistotne dla własnego miasta
  wykonajMoveExec(realMainSrc, { cmd, ownerId: 1, units, cities, map: zbudujMape() });
  ok(atk.q === city.q && atk.r === city.r,
    `(e) własne miasto: wejście dozwolone bez zmian (q=${atk.q},r=${atk.r}, oczekiwano ${city.q},${city.r})`);
}

// ===========================================================================
// MUT-K: cofnięcie naprawy (mutacja TEKSTOWA W PAMIĘCI main.ts — plik na dysku
// NIETKNIĘTY) do stanu RUNDY 2 (dwa gołe `canUnitOccupyCityHex` bez wyjątku) →
// scenariusz (a) MUSI odtworzyć REGRESJĘ zmierzoną przez Evaluatora: jednostka
// dostaje rozkaz i NIC nie robi. (b)/(c)/(d)/(e) zostają bez zmian (dowód że
// mutacja trafia WYŁĄCZNIE w wąski wyjątek, nie w resztę egzekutora).
// ===========================================================================
{
  const blokRealny = wytnijBlok(realMainSrc, MARKER_MOVE_EXEC);
  ok(!!blokRealny, '(MUT-K) blok egzekutora wycięty przed mutacją');
  if (blokRealny) {
    // Fragment liczący cityAttackEntry + oba warunkowe canUnitOccupyCityHex —
    // dokładnie to, co RUNDA 3 dodała do egzekutora (patrz main.ts, komentarz
    // P-BITWA-ATAK-DYSTANSOWY-EGZEKUCJA-Q1=B). RUNDA 4: zastępujemy deklarację
    // STAŁĄ `false` (zamiast usuwać ją całkiem) — main.ts od tej rundy ma NIŻEJ w
    // tym samym bloku DRUGIE odwołanie do `cityAttackEntry` (wołanie
    // tryAutoCaptureEmptyCityAt), więc pełne usunięcie identyfikatora zostawiałoby
    // ReferenceError na tamtej linii dla scenariuszy, które i tak przechodzą przez
    // udaną ścieżkę ruchu (np. kontrola (e) na własnym mieście). `false` daje
    // DOKŁADNIE tę samą obserwowalną regresję (żaden wyjątek, żadne przejęcie) bez
    // kruchości na kolejność linii w bloku.
    const wzorzecCityAttackEntry = /const cityAttackEntry = cmd\.rangedCityAttackEntry === true[\s\S]*?\);\s*\n/;
    ok(wzorzecCityAttackEntry.test(blokRealny),
      '(MUT-K) wzorzec cityAttackEntry znaleziony w bloku egzekutora (przygotowanie mutacji)');
    const mutBlok = blokRealny
      .replace(wzorzecCityAttackEntry, 'const cityAttackEntry = false;\n')
      .replace(/if \(!cityAttackEntry && !canUnitOccupyCityHex\(u\.ownerId, cmd\.toQ, cmd\.toR, cities\)\) continue;/,
        "if (!canUnitOccupyCityHex(u.ownerId, cmd.toQ, cmd.toR, cities)) continue;")
      .replace(/if \(!cityAttackEntry && !canUnitOccupyCityHex\(u\.ownerId, last\.q, last\.r, cities\)\) continue;/,
        "if (!canUnitOccupyCityHex(u.ownerId, last.q, last.r, cities)) continue;");
    ok(mutBlok !== blokRealny && !mutBlok.includes('canAiEnterUndefendedCityHex('),
      '(MUT-K) mutacja przygotowana: wywołanie canAiEnterUndefendedCityHex(...) usunięte z wyciętego '
      + 'bloku (cityAttackEntry zastąpione stałą `false`, w pamięci — main.ts na dysku bez zmian)');

    const mutSrc = realMainSrc.replace(blokRealny, mutBlok);
    ok(mutSrc !== realMainSrc, '(MUT-K) zmutowane źródło main.ts (W PAMIĘCI) różni się od oryginału');

    // (a-mut) scenariusz Z WERDYKTU po cofnięciu naprawy — MUSI dać "nic się nie
    // dzieje", odtwarzając dokładnie zmierzoną przez Evaluatora regresję.
    for (const dist of [2, 3]) {
      const atk = ru('Łucznik', 0, 0, 1);
      const city = { id: 'c-empty-mut', ownerId: 2, q: dist, r: 0, name: 'Milet', maMur: false, garnizon: 0 };
      const cmd = { type: 'move', unitId: atk.id, toQ: city.q, toR: city.r, rangedCityAttackEntry: true };
      wykonajMoveExec(mutSrc, { cmd, ownerId: 1, units: [atk], cities: [city], map: zbudujMape() });
      ok(atk.q === 0 && atk.r === 0 && atk.ruchLeft === 2,
        `(MUT-K) PO COFNIĘCIU naprawy, dystans=${dist}: ZŁAPANE — Łucznik NIC nie robi (q=${atk.q},r=${atk.r},ruchLeft=${atk.ruchLeft} — dokładnie regresja z werdyktu Evaluatora, rozkaz cicho skasowany)`);
    }

    // Kontrola: (e) własne miasto NIETKNIĘTE mutacją (mutacja trafia wyłącznie w
    // gałąź cityAttackEntry, nie w bazowy canUnitOccupyCityHex dla własnych miast).
    {
      const atk = ru('Łucznik', 0, 0, 1);
      const city = { id: 'c-own-mut', ownerId: 1, q: 2, r: 0, name: 'Rzym', maMur: false, garnizon: 0 };
      const cmd = { type: 'move', unitId: atk.id, toQ: city.q, toR: city.r };
      wykonajMoveExec(mutSrc, { cmd, ownerId: 1, units: [atk], cities: [city], map: zbudujMape() });
      ok(atk.q === city.q && atk.r === city.r,
        `(MUT-K) kontrola: własne miasto nadal dostępne mimo mutacji (q=${atk.q},r=${atk.r} — mutacja nie psuje bazowego zachowania)`);
    }
  }
}

// ===========================================================================
// SEKCJA PEŁNEJ SEKWENCJI (RUNDA 4, punkt 3 zlecenia): decideAITurn (PRAWDZIWE,
// bundlowane z ai.ts) → egzekutor (PRAWDZIWY blok main.ts, jak wyżej) →
// evictForeignUnitsFromCityHexes (PRAWDZIWA funkcja, wycięta z main.ts jak blok
// egzekutora) — min. 2 kolejne tury, 4 scenariusze z werdyktu rundy 3: A2 (puste
// bez muru, dystans), B1 (bez muru + garnizon), D1 (puste bez muru, adiacencja),
// C1 (z murem).
//
// main.ts w CAŁOŚCI NIE jest bundlowany (DOM/THREE zależności — ten sam
// ograniczenie udokumentowane w nagłówku barb-city-capture-cluster-test.cjs),
// więc "egzekutor" i "evict" to PRAWDZIWY tekst źródłowy main.ts wycięty
// brace-matchingiem (jak wykonajMoveExec wyżej) i wykonany przez `new Function`
// z prawdziwymi, czystymi zależnościami (city-hex-movement.ts/siegeDefenders.ts)
// wstrzykniętymi — zero reimplementacji formuły. ai.ts NIE MA zależności DOM/THREE,
// więc decideAITurn jest bundlowane i wołane WPROST (ten sam wzorzec co
// tools/ai-test.cjs — makeGameData/makeMap tu są świadomą kopią stamtąd, ta sama
// sprawdzona konstrukcja fixture).
// ===========================================================================

// --- bundlowanie PRAWDZIWEGO decideAITurn z ai.ts (wzorzec: tools/ai-test.cjs) ---
const ENTRY_AI = path.resolve(__dirname, '.atak-dystansowy-egzekucja-ai-entry.ts');
const BUNDLE_AI = path.resolve(__dirname, '.atak-dystansowy-egzekucja-ai-bundle.cjs');
fs.writeFileSync(ENTRY_AI, `
export { decideAITurn } from '../src/game/ai';
`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY_AI], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE_AI, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
  absWorkingDir: GRA_ROOT, nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const { decideAITurn } = require(BUNDLE_AI);

// --- wycięcie + wykonanie PRAWDZIWEJ evictForeignUnitsFromCityHexes z main.ts ---
const MARKER_EVICT = 'function evictForeignUnitsFromCityHexes(): void {';

function wykonajEvict(src, { units, cities }) {
  const fnTxt = wytnijBlok(src, MARKER_EVICT);
  if (!fnTxt) return { ok: false, reason: 'nie znaleziono evictForeignUnitsFromCityHexes w main.ts' };
  const js = esbuild.transformSync(fnTxt, { loader: 'ts', target: 'node18' }).code;
  const fabryka = new Function('deps', `
    const {
      units, cities, canUnitOccupyCityHex, findAdjacentEmptyHexes, isHexPassableForUnit,
      checkBarbCampDestroyedAt, isBarbarian, syncUnitsRender,
    } = deps;
    ${js}
    return evictForeignUnitsFromCityHexes;
  `);
  const fn = fabryka({
    units, cities, canUnitOccupyCityHex,
    // Kandydat wypchnięcia ZAWSZE dostępny (heks (99,99), poza mapą scenariuszy) --
    // gdyby canUnitOccupyCityHex(...) NIE zablokowało pętli wcześniej (regresja),
    // jednostka WIDOCZNIE przeskoczy tam, więc "pozycja niezmieniona" jest
    // znaczącym dowodem, nie tylko brakiem efektu ubocznego zaślepki.
    findAdjacentEmptyHexes: () => [{ q: 99, r: 99 }],
    isHexPassableForUnit: () => true,
    checkBarbCampDestroyedAt: () => {},
    isBarbarian: () => false,
    syncUnitsRender: () => {},
  });
  ok(typeof fn === 'function', 'wycięcie evictForeignUnitsFromCityHexes z main.ts powiodło się');
  if (typeof fn !== 'function') return { ok: false, reason: 'evictForeignUnitsFromCityHexes nie jest funkcją po wycięciu' };
  fn();
  return { ok: true };
}

// --- fixture: mapa/GameData realistyczne (kopia sprawdzonego wzorca z ai-test.cjs,
// decideAITurn woła prawdziwy computePath/hexCityScore wewnętrznie -- w
// odróżnieniu od wykonajMoveExec/wykonajEvict wyżej, gdzie koszt ruchu jest
// zaślepiony, tu potrzebne są realne pola terenu). ---
function zbudujMapeAi(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      hexes[`${q},${r}`] = {
        coords: { q, r },
        terenBazowy: 'laka',
        nakladka: 'brak',
        ulepszenie: 'brak',
        wlasciciel: null,
        wioska: { istnieje: false, ludnosc: 0 },
        widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 7, riverPaths: [] };
}

function zbudujDataAi() {
  return {
    units: [
      { Jednostka: 'Wojownik', Health: 30, Ruch: 2 },
      { Jednostka: 'Łucznik', Health: 20, Ruch: 2, 'Zasięg ataku (hex)': 3 },
    ],
    buildings: [
      { id: 'spichlerz', nazwa: 'Spichlerz' }, { id: 'koszary', nazwa: 'Koszary' },
      { id: 'mury', nazwa: 'Mury' },
    ],
    terrainYields: {
      terrain_types: [{ Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 }],
    },
    aiParams: {},
  };
}

/** Jednostka fixture decideAITurn -- category MUSI być 'lucznik' (isRanged() w ai.ts czyta category, nie typeId). */
function ruAi(typeId, category, q, r, ownerId) {
  return { id: `seq-${typeId}-${q}-${r}`, typeId, category, q, r, ownerId, ruch: 2, ruchLeft: 2 };
}

const dataAi = zbudujDataAi();
const AI_OWNER = 1;
const ENEMY_OWNER = 2;
const HOME_CITY = { id: 'home', ownerId: AI_OWNER, q: 0, r: 0, name: 'Roma', population: 3 };

/**
 * Wykonuje JEDNĄ turę AI dla `unit` przeciw `enemyCity`: decideAITurn (PRAWDZIWE)
 * -> filtruje komendy tej jednostki -> egzekutor PRAWDZIWY (dla type==='move') ->
 * evict PRAWDZIWY. Zwraca listę typów komend wyemitowanych dla `unit` (do
 * asercji "realny ruch, nie zamiera").
 */
function wykonajTureAi(mainSrc, aiCommandsForUnit, { unit, enemyCity, allUnits, allCities, execMap }) {
  const cmdTypes = [];
  for (const cmd of aiCommandsForUnit) {
    cmdTypes.push(cmd.type);
    if (cmd.type === 'move') {
      wykonajMoveExec(mainSrc, {
        cmd, ownerId: AI_OWNER, units: allUnits, cities: allCities, map: execMap,
      });
    }
    // inne typy komend (attack/foundCityAt/endTurn) -- poza zakresem egzekucji
    // testowanej tu (ta jednostka w tych scenariuszach nigdy ich nie emituje --
    // sprawdzone przez samą listę cmdTypes w asercjach niżej).
  }
  const evictRes = wykonajEvict(mainSrc, { units: allUnits, cities: allCities });
  return { cmdTypes, evictOk: evictRes.ok };
}

console.log('\natak-dystansowy-egzekucja-test: sekcja PEŁNEJ SEKWENCJI (decideAITurn -> egzekutor -> evict)');

// ===========================================================================
// SCENARIUSZ A2: puste miasto BEZ muru, dystans=3 (granica zasięgu Łucznika) --
// oczekiwane: tura 1 -- miasto zmienia właściciela; tura 2 -- evict NIE wypycha
// jednostki (miasto już jej), jednostka zostaje NA heksie miasta.
// ===========================================================================
{
  const enemyCity = { id: 'a2-city', ownerId: ENEMY_OWNER, q: 7, r: 0, name: 'Milet', maMur: false, garnizon: 0, population: 2 };
  const unit = ruAi('Łucznik', 'lucznik', 4, 0, AI_OWNER); // dystans do (7,0) = 3
  const allUnits = [unit];
  const allCities = [HOME_CITY, enemyCity];
  const execMap = zbudujMape();
  const aiMap = zbudujMapeAi(20, 3);

  // Tura 1: decideAITurn PRAWDZIWE.
  const cmds1 = decideAITurn(AI_OWNER, allUnits, allCities, aiMap, dataAi, { poziomTrudnosci: 2 });
  const cmdsForUnit1 = cmds1.filter(c => c.unitId === unit.id);
  ok(cmdsForUnit1.some(c => c.type === 'move' && c.rangedCityAttackEntry === true && c.toQ === enemyCity.q && c.toR === enemyCity.r),
    `(A2) tura1: decideAITurn emituje move+rangedCityAttackEntry na heks miasta (got ${JSON.stringify(cmdsForUnit1)})`);
  const t1 = wykonajTureAi(realMainSrc, cmdsForUnit1, { unit, enemyCity, allUnits, allCities, execMap });
  ok(t1.evictOk, '(A2) tura1: evictForeignUnitsFromCityHexes uruchomiony bez błędu');
  ok(unit.q === enemyCity.q && unit.r === enemyCity.r,
    `(A2) tura1: jednostka NA heksie miasta po egzekutorze (q=${unit.q},r=${unit.r})`);
  ok(enemyCity.ownerId === AI_OWNER,
    `(A2) tura1: miasto REALNIE przejęte (ownerId=${enemyCity.ownerId}, oczekiwano ${AI_OWNER})`);

  // Tura 2: reset ruchu (jak na koniec tury gracza/AI w main.ts), decideAITurn
  // ponownie (miasto już WŁASNE, więc 4b nie powinno jej dotyczyć), evict ponownie.
  unit.ruchLeft = unit.ruch;
  const cmds2 = decideAITurn(AI_OWNER, allUnits, allCities, aiMap, dataAi, { poziomTrudnosci: 2 });
  const cmdsForUnit2 = cmds2.filter(c => c.unitId === unit.id);
  const t2 = wykonajTureAi(realMainSrc, cmdsForUnit2, { unit, enemyCity, allUnits, allCities, execMap });
  ok(t2.evictOk, '(A2) tura2: evictForeignUnitsFromCityHexes uruchomiony bez błędu');
  ok(unit.q === enemyCity.q && unit.r === enemyCity.r,
    `(A2) tura2: jednostka NADAL na heksie miasta -- evict NIE wypycha (q=${unit.q},r=${unit.r} -- NAPRAWA B1/B2 werdyktu rundy 3)`);
  ok(enemyCity.ownerId === AI_OWNER, '(A2) tura2: miasto nadal AI (bez oscylacji właściciela)');
}

// ===========================================================================
// SCENARIUSZ D1: puste miasto BEZ muru, ADIACENCJA (dystans=1) -- ten sam
// oczekiwany wynik jak A2, dowodzi że naprawa działa też przy adiacencji, nie
// tylko z dystansu.
// ===========================================================================
{
  const enemyCity = { id: 'd1-city', ownerId: ENEMY_OWNER, q: 3, r: 0, name: 'Efez', maMur: false, garnizon: 0, population: 2 };
  const unit = ruAi('Wojownik', 'miecznik', 2, 0, AI_OWNER); // dystans do (3,0) = 1
  const allUnits = [unit];
  const allCities = [HOME_CITY, enemyCity];
  const execMap = zbudujMape();
  const aiMap = zbudujMapeAi(20, 3);

  const cmds1 = decideAITurn(AI_OWNER, allUnits, allCities, aiMap, dataAi, { poziomTrudnosci: 2 });
  const cmdsForUnit1 = cmds1.filter(c => c.unitId === unit.id);
  ok(cmdsForUnit1.some(c => c.type === 'move' && c.rangedCityAttackEntry === true && c.toQ === enemyCity.q && c.toR === enemyCity.r),
    `(D1) tura1: decideAITurn emituje move+rangedCityAttackEntry na heks miasta w adiacencji (got ${JSON.stringify(cmdsForUnit1)})`);
  wykonajTureAi(realMainSrc, cmdsForUnit1, { unit, enemyCity, allUnits, allCities, execMap });
  ok(unit.q === enemyCity.q && unit.r === enemyCity.r,
    `(D1) tura1: jednostka NA heksie miasta (adiacencja) po egzekutorze (q=${unit.q},r=${unit.r})`);
  ok(enemyCity.ownerId === AI_OWNER, `(D1) tura1: miasto REALNIE przejęte z adiacencji (ownerId=${enemyCity.ownerId})`);

  unit.ruchLeft = unit.ruch;
  const cmds2 = decideAITurn(AI_OWNER, allUnits, allCities, aiMap, dataAi, { poziomTrudnosci: 2 });
  const cmdsForUnit2 = cmds2.filter(c => c.unitId === unit.id);
  wykonajTureAi(realMainSrc, cmdsForUnit2, { unit, enemyCity, allUnits, allCities, execMap });
  ok(unit.q === enemyCity.q && unit.r === enemyCity.r,
    `(D1) tura2: jednostka NADAL na heksie miasta -- evict NIE wypycha (q=${unit.q},r=${unit.r})`);
}

// ===========================================================================
// SCENARIUSZ B1: miasto BEZ muru, ALE BRONIONE (garnizon=1), adiacencja --
// oczekiwane: jednostka NIE wchodzi (miasto zostaje wrogie), ALE wykonuje REALNY
// ruch (nie zamiera) -- gałąź "ranged hold back" (ai.ts) po tym, jak
// isWithinCityAttackRange (RUNDA 4) odrzuci tę adiacencję z powodu obrońców.
// ===========================================================================
{
  const enemyCity = { id: 'b1-city', ownerId: ENEMY_OWNER, q: 3, r: 0, name: 'Argos', maMur: false, garnizon: 1, population: 2 };
  // Dom DALEKO (dystans 13), żeby "hold back" (main.ts:2648, dystans do domu > 2)
  // dał REALNY krok, nie idle-fallback "już jestem w domu".
  const homeFar = { id: 'home-far', ownerId: AI_OWNER, q: 0, r: 0, name: 'Roma', population: 3 };
  const unit = ruAi('Łucznik', 'lucznik', 2, 0, AI_OWNER); // dystans do (3,0) = 1
  const allUnits = [unit];
  const allCities = [homeFar, enemyCity];
  const execMap = zbudujMape();
  const aiMap = zbudujMapeAi(20, 3);

  const cmds1 = decideAITurn(AI_OWNER, allUnits, allCities, aiMap, dataAi, { poziomTrudnosci: 2 });
  const cmdsForUnit1 = cmds1.filter(c => c.unitId === unit.id);
  ok(!cmdsForUnit1.some(c => c.type === 'move' && c.rangedCityAttackEntry === true),
    `(B1) tura1: decideAITurn NIE emituje rangedCityAttackEntry dla miasta bronionego (got ${JSON.stringify(cmdsForUnit1)})`);
  ok(cmdsForUnit1.some(c => c.type === 'move'),
    `(B1) tura1: jednostka dostaje INNY, realny rozkaz move (nie zamiera) -- got ${JSON.stringify(cmdsForUnit1)}`);
  const posPrzed = { q: unit.q, r: unit.r };
  wykonajTureAi(realMainSrc, cmdsForUnit1, { unit, enemyCity, allUnits, allCities, execMap });
  ok(unit.q !== posPrzed.q || unit.r !== posPrzed.r,
    `(B1) tura1: jednostka FAKTYCZNIE się poruszyła (z ${posPrzed.q},${posPrzed.r} do ${unit.q},${unit.r} -- realny ruch, nie zamarcie)`);
  ok(enemyCity.ownerId === ENEMY_OWNER, '(B1) tura1: miasto NIE zmienia właściciela (bronione)');
}

// ===========================================================================
// SCENARIUSZ C1: miasto Z MUREM -- bez zmian, nadal poza zakresem (oblężenie to
// osobna mechanika, świadomie nietknięta tym tematem).
// ===========================================================================
{
  const enemyCity = { id: 'c1-city', ownerId: ENEMY_OWNER, q: 3, r: 0, name: 'Teby', maMur: true, garnizon: 0, population: 2 };
  const unit = ruAi('Łucznik', 'lucznik', 2, 0, AI_OWNER); // dystans do (3,0) = 1 (adiacencja)
  const allUnits = [unit];
  const allCities = [HOME_CITY, enemyCity];
  const execMap = zbudujMape();
  const aiMap = zbudujMapeAi(20, 3);

  const cmds1 = decideAITurn(AI_OWNER, allUnits, allCities, aiMap, dataAi, { poziomTrudnosci: 2 });
  const cmdsForUnit1 = cmds1.filter(c => c.unitId === unit.id);
  ok(!cmdsForUnit1.some(c => c.type === 'move' && c.rangedCityAttackEntry === true),
    `(C1) tura1: decideAITurn NIE emituje rangedCityAttackEntry dla miasta z murem (got ${JSON.stringify(cmdsForUnit1)})`);
  wykonajTureAi(realMainSrc, cmdsForUnit1, { unit, enemyCity, allUnits, allCities, execMap });
  ok(enemyCity.ownerId === ENEMY_OWNER, '(C1) tura1: miasto NIE zmienia właściciela (mur -- oblężenie poza zakresem)');
  ok(unit.q !== enemyCity.q || unit.r !== enemyCity.r,
    `(C1) tura1: jednostka NIE wchodzi na heks miasta z murem (q=${unit.q},r=${unit.r})`);
}

// ===========================================================================
// MUT-N (dyscyplina mutacyjna, punkt 3 zlecenia): cofnięcie DOKŁADNIE naprawy
// punktu 1 (usunięcie `if (cityAttackEntry) { tryAutoCaptureEmptyCityAt(...) }`
// z egzekutora main.ts, zostawiając samo wejście na heks) -- odtwarza DOKŁADNIE
// B1/B2 werdyktu rundy 3: jednostka wchodzi na heks, miasto NIE zmienia
// właściciela, i evict w turze 2 wypycha ją z powrotem (oscylacja). Scenariusz A2
// MUSI się złapać na czerwono; scenariusze B1/C1 (nie wchodzą na heks w ogóle)
// zostają zielone -- dowód że mutacja trafia WYŁĄCZNIE w krok "przejęcie po
// wejściu", nie w resztę egzekutora.
// ===========================================================================
{
  const blokRealny = wytnijBlok(realMainSrc, MARKER_MOVE_EXEC);
  ok(!!blokRealny, '(MUT-N) blok egzekutora wycięty przed mutacją');
  if (blokRealny) {
    const wzorzecCapture = /if \(cityAttackEntry\) \{\s*\n\s*tryAutoCaptureEmptyCityAt\(last\.q, last\.r, \[u\]\);\s*\n\s*\}\s*\n/;
    ok(wzorzecCapture.test(blokRealny),
      '(MUT-N) wzorzec `if (cityAttackEntry) { tryAutoCaptureEmptyCityAt(...) }` znaleziony (przygotowanie mutacji)');
    const mutBlok = blokRealny.replace(wzorzecCapture, '');
    ok(mutBlok !== blokRealny && !mutBlok.includes('tryAutoCaptureEmptyCityAt('),
      '(MUT-N) mutacja przygotowana: wywołanie tryAutoCaptureEmptyCityAt usunięte z wyciętego bloku (w pamięci)');
    const mutSrc = realMainSrc.replace(blokRealny, mutBlok);

    const enemyCity = { id: 'mutn-city', ownerId: ENEMY_OWNER, q: 7, r: 0, name: 'Milet', maMur: false, garnizon: 0, population: 2 };
    const unit = ruAi('Łucznik', 'lucznik', 4, 0, AI_OWNER);
    const allUnits = [unit];
    const allCities = [HOME_CITY, enemyCity];
    const execMap = zbudujMape();

    // Tura 1: wejście na heks (bez naprawy punktu 1 -- zachowanie identyczne jak
    // runda 3), ALE bez przejęcia.
    const cmd1 = { type: 'move', unitId: unit.id, toQ: enemyCity.q, toR: enemyCity.r, rangedCityAttackEntry: true };
    wykonajMoveExec(mutSrc, { cmd: cmd1, ownerId: AI_OWNER, units: allUnits, cities: allCities, map: execMap });
    ok(unit.q === enemyCity.q && unit.r === enemyCity.r,
      '(MUT-N) tura1: jednostka nadal wchodzi na heks (mutacja nie dotyka bramki wejścia)');
    ok(enemyCity.ownerId === ENEMY_OWNER,
      `(MUT-N) ZŁAPANE: PO cofnięciu naprawy punktu 1, miasto NIE zmienia właściciela mimo wejścia (ownerId=${enemyCity.ownerId}) -- dokładnie B1/B2 werdyktu rundy 3`);

    // Tura 2: evict (PRAWDZIWY, nietknięty mutacją) MUSI wypchnąć jednostkę --
    // miasto formalnie nadal wrogie -- odtwarzając wieczną oscylację z B1.
    const evictRes = wykonajEvict(mutSrc, { units: allUnits, cities: allCities });
    ok(evictRes.ok, '(MUT-N) tura2: evict uruchomiony bez błędu na zmutowanym źródle');
    ok(unit.q === 99 && unit.r === 99,
      `(MUT-N) ZŁAPANE: evict wypycha jednostkę (q=${unit.q},r=${unit.r}, oczekiwano kandydata (99,99) z atrapy `
      + `findAdjacentEmptyHexes) -- dokładnie wieczna oscylacja B1 werdyktu rundy 3`);
  }
}

fs.rmSync(ENTRY_AI, { force: true });
fs.rmSync(BUNDLE_AI, { force: true });
fs.rmSync(ENTRY, { force: true });
fs.rmSync(BUNDLE, { force: true });
console.log('atak-dystansowy-egzekucja-test: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
