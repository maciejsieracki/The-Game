'use strict';
/**
 * okolica-tryb-reset-ownership-change-test.cjs
 *
 * R-OKOLICA-TRYB-RESET-PO-ZMIANIE-WLASCICIELA-Q1=A (Maciej 2026-08-14).
 *
 * Zgloszenie (Evaluator, notatka N1 przy commit 3f1a2f85): resolveWorkedTiles
 * (okolica.ts) honoruje city.okolicaTryb==='reczny' BEZ FILTRA WLASCICIELA. Wszystkie
 * 4 sciezki zmiany okolicaTryb (applyOkolicaTileAdjust/onOkolicaEnterManual/
 * onOkolicaRestoreAuto/onOkolicaFocusChange) sa callbackami panelu miasta dostepnymi
 * WYLACZNIE graczowi (ownerId===0). Skutek: miasto gracza przejete przez AI/
 * rebeliantow zostawalo w trybie recznym NA ZAWSZE -- AI nie ma zadnej sciezki
 * powrotu do auto, obywatele stali bezczynnie mimo wolnych heksow w zasiegu.
 *
 * Naprawa: main.ts::seedCityOwnerDefaults(c) -- funkcja, ktora WSZYSTKIE 9 call
 * site'ow zmiany wlasciciela/zalozenia miasta i tak juz musialy wolac (kontrakt
 * "wywoluj PO kazdej zmianie city.ownerId", patrz okolica-ownership-change-
 * reconcile-test.cjs) -- teraz TEZ resetuje c.okolicaTryb na 'auto' i kasuje
 * c.okolicaReczne (martwe dane po powrocie do auto, ten sam wzorzec co
 * onOkolicaRestoreAuto). Maciej wybral WARIANT A (zawsze resetuj), NIE wariant C
 * (tylko gdy nowy wlasciciel to AI) -- reset zachodzi TEZ gdy gracz odzyskuje
 * WLASNE miasto (kontratak), mimo ze traci wlasne wczesniejsze reczne ustawienia.
 * To swiadomy wybor wlasciciela, nie przeoczenie -- SEKCJA 1.4 nizej testuje
 * dokladnie ten przypadek graniczny.
 *
 * SEKCJA 1: repro behawioralne -- bez DOM/THREE, testuje bezposrednio
 * resolveWorkedTiles (mechanizm, ktory honoruje/nie honoruje okolicaTryb) w 4
 * krokach: (1.1) bug PRZED naprawa -- bezczynni obywatele w trybie recznym mimo
 * wolnych heksow, (1.2) kontrola czulosci -- zmiana wlasciciela BEZ resetu trybu
 * NIE naprawia problemu (dowod, ze bug faktycznie wymaga tej konkretnej naprawy),
 * (1.3) PO naprawie -- reset trybu+kasowanie okolicaReczne daje pelne auto-
 * przypisanie, zero bezczynnych, (1.4) przypadek graniczny -- gracz odzyskuje
 * WLASNE miasto, naprawa i tak sie stosuje (wariant A, bez wyjatku).
 *
 * SEKCJA 2: main.ts zawiera DOM/THREE (nie da sie zbundlowac standalone w node,
 * patrz pre-istniejace bledy harnessu w CLAUDE.md) -- weryfikacja WIRINGU jest
 * wiec tekstowa na zrodle, dokladnie jak SEKCJA 2 w okolica-ownership-change-
 * reconcile-test.cjs (ten sam, juz przyjety w repo wzorzec). Potwierdza: (a) cialo
 * seedCityOwnerDefaults resetuje okolicaTryb na DEFAULT_OKOLICA_TRYB; (b) kasuje
 * okolicaReczne; (c) DEFAULT_OKOLICA_TRYB jest zaimportowane z './game/cities';
 * (d) reset nastepuje w tej samej funkcji co juz istniejace wywolanie
 * reconcileAllWorkedTiles (mutacja kontrolna dowodzi, ze asercja nie jest
 * tautologiczna).
 *
 * Run from gra/: node tools/okolica-tryb-reset-ownership-change-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[okolica-tryb-reset-ownership-change-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.okolica-tryb-reset-entry.ts');
const BUNDLE = path.join(__dirname, '.okolica-tryb-reset-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { resolveWorkedTiles } from '../src/game/okolica';
export { DEFAULT_OKOLICA_TRYB } from '../src/game/cities';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[okolica-tryb-reset-ownership-change-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const { resolveWorkedTiles, DEFAULT_OKOLICA_TRYB } = require(BUNDLE);

// --- test harness ------------------------------------------------------------
let passed = 0;
let failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}
function eq(a, b, msg) {
  ok(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

// --- fixtures ------------------------------------------------------------------
/** Rownina wszedzie w [qMin,qMax]x[rMin,rMax] -- teren jednorodny, wszystko workable. */
function buildPlainsMap(qMin, qMax, rMin, rMax) {
  const hexes = {};
  for (let q = qMin; q <= qMax; q++) {
    for (let r = rMin; r <= rMax; r++) {
      hexes[`${q},${r}`] = { terenBazowy: 0 };
    }
  }
  return { szerokoscQ: qMax - qMin + 1, wysokoscR: rMax - rMin + 1, seed: 1, hexes };
}
const map = buildPlainsMap(-15, 15, -15, 15);
const yieldOf = () => ({ zywnosc: 1, praca: 1, handel: 1 });

console.log('\n================ SEKCJA 1: repro "miasto gracza zdobyte przez AI zostaje w trybie recznym na zawsze" ================\n');

console.log('1.1 PRZED naprawa: miasto gracza w trybie recznym, mniej wpisow niz populacja -> bezczynni obywatele mimo wolnych heksow');
{
  const city = {
    id: 'c1', ownerId: 0, q: 0, r: 0, population: 6,
    okolicaTryb: 'reczny',
    okolicaReczne: { '1,0': 1, '2,0': 1 }, // tylko 2 wpisy, populacja 6 -> 4 bezczynnych
  };
  const worked = resolveWorkedTiles(city, map, yieldOf);
  eq(worked.length, 2, 'tryb reczny z 2 wpisami -> tylko 2 kafle obrobione, mimo populacji 6 i mnostwa wolnych heksow dookola (bug)');
}

console.log('\n1.2 kontrola czulosci: sama zmiana wlasciciela (BEZ resetu trybu -- stan SPRZED tej naprawy) NIE naprawia problemu');
{
  const city = {
    id: 'c2', ownerId: 0, q: 0, r: 0, population: 6,
    okolicaTryb: 'reczny',
    okolicaReczne: { '1,0': 1, '2,0': 1 },
  };
  // AI/rebelianci przejmuja miasto -- SAMA zmiana ownerId, jak main.ts robi PRZED
  // wywolaniem seedCityOwnerDefaults(city) we wszystkich 4 realnych sciezkach.
  city.ownerId = 3; // AI
  const worked = resolveWorkedTiles(city, map, yieldOf);
  eq(worked.length, 2, 'kontrola: bez resetu okolicaTryb, resolveWorkedTiles nadal honoruje "reczny" niezaleznie od nowego wlasciciela -- dokladnie bug zgloszony przez Evaluatora (N1)');
}

console.log('\n1.3 PO naprawie: reset okolicaTryb=\'auto\' + kasowanie okolicaReczne (dokladnie to, co teraz robi seedCityOwnerDefaults) -> pelne auto-przypisanie, zero bezczynnych');
{
  const city = {
    id: 'c3', ownerId: 0, q: 0, r: 0, population: 6,
    okolicaTryb: 'reczny',
    okolicaReczne: { '1,0': 1, '2,0': 1 },
  };
  city.ownerId = 3; // AI przejmuje miasto
  // Naprawiony seedCityOwnerDefaults konczy sie tym (main.ts, SEKCJA 2 nizej
  // potwierdza ze te dwie linie faktycznie tam sa):
  city.okolicaTryb = DEFAULT_OKOLICA_TRYB;
  delete city.okolicaReczne;

  eq(city.okolicaTryb, 'auto', 'okolicaTryb zresetowany na \'auto\' po zmianie wlasciciela');
  const worked = resolveWorkedTiles(city, map, yieldOf);
  eq(worked.length, 6, 'PO naprawie: 6 kafli obrobionych automatycznie = cala populacja, zero bezczynnych obywateli mimo wolnych heksow');
}

console.log('\n1.4 przypadek graniczny (wariant A, bez wyjatku): gracz ODZYSKUJE WLASNE miasto (kontratak) -- naprawa stosuje sie TAK SAMO, mimo utraty wlasnych recznych ustawien');
{
  const city = {
    id: 'c4', ownerId: 0, q: 0, r: 0, population: 6,
    okolicaTryb: 'reczny',
    okolicaReczne: { '1,0': 1, '2,0': 1 }, // WLASNE reczne ustawienia gracza
  };
  // Miasto na chwile trafia do AI, a potem WRACA do TEGO SAMEGO gracza
  // (ownerId 0 -> 3 -> 0) -- kontratak. seedCityOwnerDefaults(city) wolane PRZY
  // KAZDEJ z tych dwoch zmian wlasciciela, wiec reset zachodzi dwukrotnie.
  city.ownerId = 3;
  city.okolicaTryb = DEFAULT_OKOLICA_TRYB;
  delete city.okolicaReczne;
  city.ownerId = 0; // gracz odzyskuje wlasne miasto
  city.okolicaTryb = DEFAULT_OKOLICA_TRYB;
  delete city.okolicaReczne;

  eq(city.okolicaTryb, 'auto', 'wariant A: gracz odzyskujacy WLASNE miasto tez dostaje reset trybu na auto (Maciej NIE wybral wariantu C -- wylacznie dla nowego wlasciciela AI)');
  ok(!('okolicaReczne' in city) || city.okolicaReczne === undefined, 'wlasne reczne ustawienia gracza sprzed utraty miasta skasowane -- swiadomy koszt wariantu A, nie blad');
  const worked = resolveWorkedTiles(city, map, yieldOf);
  eq(worked.length, 6, 'miasto odzyskane przez gracza: 6 kafli obrobionych automatycznie = cala populacja, zero bezczynnych');
}

console.log('\n================ SEKCJA 2: wiring main.ts -- naprawa faktycznie wpieta w seedCityOwnerDefaults ================\n');

const MAIN_TS_SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.ts'), 'utf8');

console.log('2.1 main.ts::seedCityOwnerDefaults(...) resetuje c.okolicaTryb na DEFAULT_OKOLICA_TRYB');
let fnBody = '';
{
  const fnStartMarker = 'function seedCityOwnerDefaults(c: City): void {';
  const fnStart = MAIN_TS_SRC.indexOf(fnStartMarker);
  ok(fnStart >= 0, 'znaleziono seedCityOwnerDefaults(...) w main.ts');
  const fnEndIdx = fnStart >= 0 ? MAIN_TS_SRC.indexOf('\n    function ', fnStart + fnStartMarker.length) : -1;
  ok(fnEndIdx > fnStart, 'znaleziono koniec seedCityOwnerDefaults(...) (kolejna funkcja na tym samym poziomie)');
  fnBody = fnStart >= 0 && fnEndIdx > fnStart ? MAIN_TS_SRC.slice(fnStart, fnEndIdx) : '';

  ok(/c\.okolicaTryb\s*=\s*DEFAULT_OKOLICA_TRYB;/.test(fnBody),
    "R-OKOLICA-TRYB-RESET-PO-ZMIANIE-WLASCICIELA-Q1=A: cialo seedCityOwnerDefaults(...) zawiera 'c.okolicaTryb = DEFAULT_OKOLICA_TRYB;'");
}

console.log('\n2.2 to samo cialo kasuje okolicaReczne (martwe dane po powrocie do auto, wzorem onOkolicaRestoreAuto)');
{
  ok(/delete c\.okolicaReczne;/.test(fnBody),
    "cialo seedCityOwnerDefaults(...) zawiera 'delete c.okolicaReczne;' -- ten sam wzorzec co onOkolicaRestoreAuto (okolicaTryb='auto' + delete okolicaReczne razem)");
}

console.log('\n2.3 DEFAULT_OKOLICA_TRYB zaimportowane z \'./game/cities\' (nie zgadywana nazwa)');
{
  const importBlockMatch = MAIN_TS_SRC.match(/import \{[\s\S]*?\} from '\.\/game\/cities';/);
  ok(!!importBlockMatch, "znaleziono blok import ... from './game/cities' w main.ts");
  ok(!!importBlockMatch && /\bDEFAULT_OKOLICA_TRYB\b/.test(importBlockMatch[0]),
    "DEFAULT_OKOLICA_TRYB wymienione w bloku import z './game/cities'");
}

console.log('\n2.4 reset trybu wystepuje W TEJ SAMEJ funkcji co juz istniejace wywolanie reconcileAllWorkedTiles (P-MILET-ATENY, 3f1a2f85)');
{
  ok(/reconcileAllWorkedTiles\(/.test(fnBody),
    'cialo seedCityOwnerDefaults(...) nadal woła reconcileAllWorkedTiles(...) (naprawa dzisiejsza NIE zastapila wczorajszej)');
}

console.log('\n2.5 mutacja kontrolna -- fizyczne usuniecie linii resetu trybu zawala TYLKO 2.1, dowod ze asercja nie jest tautologiczna');
{
  const target = 'c.okolicaTryb = DEFAULT_OKOLICA_TRYB;\n      delete c.okolicaReczne;\n';
  const occurrences = MAIN_TS_SRC.split(target).length - 1;
  eq(occurrences, 1, 'punkt mutacji (obie linie razem, w tej kolejnosci) wystepuje dokladnie raz w main.ts');
  const mutated = MAIN_TS_SRC.replace(target, '');
  const stillMatches = /c\.okolicaTryb\s*=\s*DEFAULT_OKOLICA_TRYB;/.test(mutated);
  ok(!stillMatches, 'PO usunieciu linii resetu: wzorzec 2.1 faktycznie przestaje pasowac (mutacja wykryta) -- asercja nie jest tautologiczna');
}

console.log('\n2.6 territory-work.ts (reconcileAllWorkedTiles/reconcileWorkedTilesForOwner) NIE czyta/pisze okolicaTryb -- kolejnosc reset-vs-reconcile w seedCityOwnerDefaults nie ma znaczenia funkcjonalnego');
{
  const TERRITORY_WORK_SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'map', 'territory-work.ts'), 'utf8');
  const reconcileFnStart = TERRITORY_WORK_SRC.indexOf('export function reconcileWorkedTilesForOwner(');
  ok(reconcileFnStart >= 0, 'znaleziono reconcileWorkedTilesForOwner w territory-work.ts');
  const reconcileFnEnd = reconcileFnStart >= 0 ? TERRITORY_WORK_SRC.indexOf('\nexport function reconcileAllWorkedTiles', reconcileFnStart) : -1;
  const reconcileBody = reconcileFnStart >= 0 && reconcileFnEnd > reconcileFnStart ? TERRITORY_WORK_SRC.slice(reconcileFnStart, reconcileFnEnd) : '';
  ok(!/okolicaTryb/.test(reconcileBody),
    'reconcileWorkedTilesForOwner nie odwoluje sie do okolicaTryb -- operuje wylacznie na okolicaReczne, niezaleznie od trybu miasta');
}

// --- summary -------------------------------------------------------------------
const total = passed + failed;
if (failed === 0) {
  console.log(`\nOKOLICA-TRYB-RESET-OWNERSHIP-CHANGE OK (${passed}/${total})`);
} else {
  console.log(`\nOKOLICA-TRYB-RESET-OWNERSHIP-CHANGE FAIL (${passed}/${total} passed, ${failed} failed)`);
}

try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }

process.exit(failed === 0 ? 0 : 1);
