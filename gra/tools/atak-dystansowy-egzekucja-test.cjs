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
} = MOD;

// ---------------------------------------------------------------------------
// Buduje i wykonuje NAPRAWDĘ blok egzekutora `cmd.type==='move'` wycięty z (ew.
// zmutowanego w pamięci) źródła main.ts. Efekty uboczne bez znaczenia dla bramki
// wejścia (SFX/chatki/obozy/render) zaślepione no-opami — testujemy WYŁĄCZNIE czy
// `u.q`/`u.r` się zmieniają (rozkaz przeżył egzekutor) czy nie (rozkaz skasowany).
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
    // P-BITWA-ATAK-DYSTANSOWY-EGZEKUCJA-Q1=B).
    const wzorzecCityAttackEntry = /const cityAttackEntry = cmd\.rangedCityAttackEntry === true[\s\S]*?\);\s*\n/;
    ok(wzorzecCityAttackEntry.test(blokRealny),
      '(MUT-K) wzorzec cityAttackEntry znaleziony w bloku egzekutora (przygotowanie mutacji)');
    const mutBlok = blokRealny
      .replace(wzorzecCityAttackEntry, '')
      .replace(/if \(!cityAttackEntry && !canUnitOccupyCityHex\(u\.ownerId, cmd\.toQ, cmd\.toR, cities\)\) continue;/,
        "if (!canUnitOccupyCityHex(u.ownerId, cmd.toQ, cmd.toR, cities)) continue;")
      .replace(/if \(!cityAttackEntry && !canUnitOccupyCityHex\(u\.ownerId, last\.q, last\.r, cities\)\) continue;/,
        "if (!canUnitOccupyCityHex(u.ownerId, last.q, last.r, cities)) continue;");
    ok(mutBlok !== blokRealny && !mutBlok.includes('cityAttackEntry'),
      '(MUT-K) mutacja przygotowana: cityAttackEntry usunięte z wyciętego bloku (w pamięci, main.ts na dysku bez zmian)');

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

fs.rmSync(ENTRY, { force: true });
fs.rmSync(BUNDLE, { force: true });
console.log('atak-dystansowy-egzekucja-test: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
