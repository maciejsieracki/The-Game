'use strict';
/**
 * empire-city-defaults-test.cjs — R-MIASTO-USTAWIENIA-GLOBALNE-VS-LOKALNE=A (Maciej 2026-08-09).
 * Standalone Node sanity test dla gra/src/game/empire-city-defaults.ts — mechanizm
 * "globalne ustawienie domyślne imperium + opcjonalny override lokalny" rozszerzony
 * na trzy pola bez tego dotąd: Podział Pracy / Priorytet Praca-Żywność / Priorytet
 * produkcji, wzorem JUŻ ISTNIEJĄCEGO empire-handel-split.ts (Danina/Handel).
 *
 * Uruchom z gra/: node tools/empire-city-defaults-test.cjs
 *
 * Sprawdza dla KAŻDEGO z trzech resolverów (a) miasto bez override dostaje wartość
 * globalną, (b) miasto z override dostaje wartość lokalną niezależnie od zmiany
 * globalnej, (c) migracja starego zapisu ustawia override poprawnie, oraz osobno że
 * nowo zakładane miasto (cities.ts foundCity/foundCityAt) startuje z override=false
 * na wszystkich trzech polach.
 *
 * Pure logic only -- no DOM, no THREE.
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[empire-city-defaults-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.empire-city-defaults-entry.ts');
const BUNDLE = path.resolve(__dirname, '.empire-city-defaults-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export {
  resolveCityPodzialPracy,
  migratePodzialPracyOnLoad,
  freshOwnerDefaultPodzialPracy,
  podzialPracyEqual,
  resolveCityOkolicaFocus,
  migrateOkolicaFocusOnLoad,
  freshOwnerDefaultOkolicaFocus,
  broadcastOkolicaFocusToOwnerCities,
  resolveCityBudowaProfil,
  migrateBudowaProfilOnLoad,
  freshOwnerDefaultBudowaProfil,
  broadcastBudowaProfilToOwnerCities,
  budowaProfilEqual,
} from '../src/game/empire-city-defaults';
export {
  foundCity,
  foundCityAt,
  DEFAULT_PODZIAL_PRACY,
  DEFAULT_OKOLICA_FOCUS,
  DEFAULT_BUDOWA_FOCUS,
  DEFAULT_BUDOWA_TRYB,
} from '../src/game/cities';
`,
  'utf8',
);

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[empire-city-defaults-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('FAIL:', msg); }
}

// ---------------------------------------------------------------------------
// 1. Podział Pracy — resolveCityPodzialPracy (a/b/c) — wzorzec 1:1 z Handlu.
// ---------------------------------------------------------------------------
{
  const ownerDefault = { procentBudynki: 70 };

  // (a) miasto bez override dostaje wartość globalną, mimo że ma jakąś swoją zapisaną.
  const cityNoOverride = { ownerId: 0, podzialPracyOverride: false, podzialPracy: { procentBudynki: 30 } };
  const rA = M.resolveCityPodzialPracy(cityNoOverride, ownerDefault);
  ok(rA.procentBudynki === 70, `Podział Pracy (a) bez override → globalna 70 (got ${rA.procentBudynki})`);

  // (b) miasto z override dostaje wartość lokalną NIEZALEŻNIE od zmiany globalnej.
  const cityOverride = { ownerId: 0, podzialPracyOverride: true, podzialPracy: { procentBudynki: 30 } };
  const rB1 = M.resolveCityPodzialPracy(cityOverride, ownerDefault);
  ok(rB1.procentBudynki === 30, `Podział Pracy (b) z override → lokalna 30 (got ${rB1.procentBudynki})`);
  const ownerDefaultChanged = { procentBudynki: 90 };
  const rB2 = M.resolveCityPodzialPracy(cityOverride, ownerDefaultChanged);
  ok(rB2.procentBudynki === 30, `Podział Pracy (b) override przeżywa zmianę globalnej (got ${rB2.procentBudynki}, globalna teraz 90)`);

  // brak ownerDefault (np. świeży ownerId bez wpisu w Map) → fallback na city.podzialPracy, potem params.
  const cityNoOverrideNoDefault = { ownerId: 5, podzialPracyOverride: false, podzialPracy: { procentBudynki: 55 } };
  const rFallback = M.resolveCityPodzialPracy(cityNoOverrideNoDefault, undefined);
  ok(rFallback.procentBudynki === 55, `Podział Pracy brak ownerDefault → fallback city.podzialPracy 55 (got ${rFallback.procentBudynki})`);
  const paramsFallback = { procentBudynki: 42 };
  const rParamsFallback = M.resolveCityPodzialPracy({ ownerId: 5, podzialPracyOverride: false }, undefined, paramsFallback);
  ok(rParamsFallback.procentBudynki === 42, `Podział Pracy brak city.podzialPracy i ownerDefault → paramsFallback 42 (got ${rParamsFallback.procentBudynki})`);

  // (c) migracja starego zapisu (bez ownerDefault, bez flag override) — jedno miasto z
  // wartością różną od pierwszej (owner default), jedno takie samo.
  const legacyCities = [
    { id: 'c1', ownerId: 0, podzialPracy: { procentBudynki: 70 } }, // pierwsze -> ustanawia default
    { id: 'c2', ownerId: 0, podzialPracy: { procentBudynki: 40 } }, // różni się -> override=true
    { id: 'c3', ownerId: 0, podzialPracy: { procentBudynki: 70 } }, // takie samo -> override=false
  ];
  const migratedDefaults = new Map();
  M.migratePodzialPracyOnLoad(legacyCities, migratedDefaults, undefined);
  ok(migratedDefaults.get(0).procentBudynki === 70, `Podział Pracy (c) migracja: owner default z pierwszego miasta = 70 (got ${migratedDefaults.get(0)?.procentBudynki})`);
  ok(legacyCities[0].podzialPracyOverride === false, 'Podział Pracy (c) migracja: c1 (== default) override=false');
  ok(legacyCities[1].podzialPracyOverride === true, 'Podział Pracy (c) migracja: c2 (!= default) override=true');
  ok(legacyCities[2].podzialPracyOverride === false, 'Podział Pracy (c) migracja: c3 (== default) override=false');

  // migracja z zapisanym ownerDefault (savedDefaults) -- ma pierwszeństwo, nie przelicza od nowa.
  const cities2 = [{ id: 'c1', ownerId: 0, podzialPracy: { procentBudynki: 10 } }];
  const defaults2 = new Map();
  M.migratePodzialPracyOnLoad(cities2, defaults2, [[0, { procentBudynki: 88 }]]);
  ok(defaults2.get(0).procentBudynki === 88, `Podział Pracy migracja z savedDefaults ma pierwszeństwo (got ${defaults2.get(0)?.procentBudynki})`);
}

// ---------------------------------------------------------------------------
// 2. Priorytet Praca/Żywność (okolicaFocus) — resolveCityOkolicaFocus + broadcast.
// ---------------------------------------------------------------------------
{
  const cityNoOverride = { okolicaFocus: 'zywnosc', okolicaFocusOverride: false };
  ok(M.resolveCityOkolicaFocus(cityNoOverride, 'podatki') === 'podatki', 'okolicaFocus (a) bez override → globalna');

  const cityOverride = { okolicaFocus: 'zywnosc', okolicaFocusOverride: true };
  ok(M.resolveCityOkolicaFocus(cityOverride, 'podatki') === 'zywnosc', 'okolicaFocus (b) z override → lokalna, ignoruje globalną');

  const cities = [
    { id: 'c1', ownerId: 0, okolicaFocus: 'zrownowazone', okolicaFocusOverride: false },
    { id: 'c2', ownerId: 0, okolicaFocus: 'zrownowazone', okolicaFocusOverride: true },
    { id: 'c3', ownerId: 1, okolicaFocus: 'zrownowazone', okolicaFocusOverride: false },
  ];
  M.broadcastOkolicaFocusToOwnerCities(cities, 0, 'produkcja');
  ok(cities[0].okolicaFocus === 'produkcja', 'broadcastOkolicaFocus: c1 (owner 0, bez override) dostaje nową wartość');
  ok(cities[1].okolicaFocus === 'zrownowazone', 'broadcastOkolicaFocus: c2 (owner 0, override) NIE zmienia się');
  ok(cities[2].okolicaFocus === 'zrownowazone', 'broadcastOkolicaFocus: c3 (inny owner) nie dotknięte');
}

// ---------------------------------------------------------------------------
// 3. Priorytet produkcji (budowaFocus+budowaTryb) — resolveCityBudowaProfil + broadcast.
// ---------------------------------------------------------------------------
{
  const ownerDefault = { budowaFocus: 'wojsko', budowaTryb: 'priorytet' };
  const cityNoOverride = { budowaFocus: 'kultura', budowaTryb: 'priorytet', budowaFocusOverride: false };
  const rA = M.resolveCityBudowaProfil(cityNoOverride, ownerDefault);
  ok(rA.budowaFocus === 'wojsko' && rA.budowaTryb === 'priorytet', 'budowaProfil (a) bez override → globalna');

  const cityOverride = { budowaFocus: 'kultura', budowaTryb: 'lista', budowaFocusOverride: true };
  const rB = M.resolveCityBudowaProfil(cityOverride, ownerDefault);
  ok(rB.budowaFocus === 'kultura' && rB.budowaTryb === 'lista', 'budowaProfil (b) z override → lokalna (tryb Lista, per-miasto)');
}

// ---------------------------------------------------------------------------
// 4. Nowo zakładane miasto startuje BEZ override na wszystkich trzech polach
//    (cel zgłoszenia: "nie trzeba ustawiać każdego nowego miasta od nowa").
// ---------------------------------------------------------------------------
{
  const map = { hexes: {} };
  const q = 0, r = 0;
  map.hexes[`${q},${r}`] = { terenBazowy: 0 }; // TerenBazowy.Rownina-ish (0 != Morze/Wybrzeze/Gory w tym module)
  const c = M.foundCityAt(q, r, 0, [], map, 'TestGród');
  ok(c !== null, 'foundCityAt zwraca miasto na pustej mapie');
  if (c) {
    ok(c.podzialPracyOverride === false, `nowe miasto: podzialPracyOverride=false (got ${c.podzialPracyOverride})`);
    ok(c.okolicaFocusOverride === false, `nowe miasto: okolicaFocusOverride=false (got ${c.okolicaFocusOverride})`);
    ok(c.budowaFocusOverride === false, `nowe miasto: budowaFocusOverride=false (got ${c.budowaFocusOverride})`);
  }
}

// ---------------------------------------------------------------------------
// 5. RUNDA 2 — testy DOKŁADNIE na 3 mutacje, które przeżyły próbę Evaluatora
//    w rundzie 1 (dyspozycje/PYTANIA-OTWARTE.md, "Evaluator RUNDA 1: FAIL").
// ---------------------------------------------------------------------------

// M6: broadcastBudowaProfilToOwnerCities NIE MOŻE nadpisać miasta z override=true
// (pin 📌 złamany w rundzie 1). Miasto z override musi wyjść z broadcastu BEZ ZMIAN.
{
  const pinned = { id: 'pinned', ownerId: 0, budowaFocus: 'kultura', budowaTryb: 'lista', budowaFocusOverride: true };
  const unpinned = { id: 'unpinned', ownerId: 0, budowaFocus: 'kultura', budowaTryb: 'priorytet', budowaFocusOverride: false };
  const otherOwner = { id: 'other', ownerId: 1, budowaFocus: 'kultura', budowaTryb: 'priorytet', budowaFocusOverride: false };
  const cities = [pinned, unpinned, otherOwner];
  M.broadcastBudowaProfilToOwnerCities(cities, 0, { budowaFocus: 'wojsko', budowaTryb: 'priorytet' });
  ok(pinned.budowaFocus === 'kultura' && pinned.budowaTryb === 'lista',
    `M6: miasto z budowaFocusOverride=true PRZEŻYWA broadcast bez zmian (got focus=${pinned.budowaFocus}, tryb=${pinned.budowaTryb})`);
  ok(unpinned.budowaFocus === 'wojsko' && unpinned.budowaTryb === 'priorytet',
    'M6 kontrola: miasto BEZ override dostaje nową wartość broadcastu (dowód, że broadcast działa)');
  ok(otherOwner.budowaFocus === 'kultura', 'M6 kontrola: inny owner nietknięty');
}

// M7: migrateOkolicaFocusOnLoad NIE MOŻE cichcem nadpisać miast, których stara wartość
// różniła się od pierwszego miasta (wyliczonego globalnego defaultu) — muszą dostać
// override=true i ZACHOWAĆ swoją indywidualną wartość (zero utraty danych gracza).
{
  const legacyCities = [
    { id: 'c1', ownerId: 0, okolicaFocus: 'zrownowazone' }, // pierwsze -> ustanawia default
    { id: 'c2', ownerId: 0, okolicaFocus: 'zywnosc' },      // różni się od defaultu
    { id: 'c3', ownerId: 0, okolicaFocus: 'zrownowazone' }, // == default
  ];
  const defaults = new Map();
  M.migrateOkolicaFocusOnLoad(legacyCities, defaults, undefined);
  ok(legacyCities[1].okolicaFocusOverride === true,
    `M7: miasto c2 (różni się od globalnego defaultu) dostaje override=true (got ${legacyCities[1].okolicaFocusOverride})`);
  ok(legacyCities[1].okolicaFocus === 'zywnosc',
    `M7: miasto c2 ZACHOWUJE swoją starą indywidualną wartość 'zywnosc', nie zostaje cichcem nadpisane (got ${legacyCities[1].okolicaFocus})`);
  ok(legacyCities[0].okolicaFocusOverride === false && legacyCities[2].okolicaFocusOverride === false,
    'M7 kontrola: miasta == default dostają override=false (broadcast dalej nimi rządzi)');
}

// M8: identyczna próba dla migrateBudowaProfilOnLoad (budowaFocus+budowaTryb, PARA).
{
  const legacyCities = [
    { id: 'c1', ownerId: 0, budowaFocus: 'zrownowazone', budowaTryb: 'zrownowazone' }, // pierwsze -> default
    { id: 'c2', ownerId: 0, budowaFocus: 'wojsko', budowaTryb: 'priorytet' },           // różni się
    { id: 'c3', ownerId: 0, budowaFocus: 'zrownowazone', budowaTryb: 'zrownowazone' },  // == default
  ];
  const defaults = new Map();
  M.migrateBudowaProfilOnLoad(legacyCities, defaults, undefined);
  ok(legacyCities[1].budowaFocusOverride === true,
    `M8: miasto c2 (różni się od globalnego defaultu) dostaje override=true (got ${legacyCities[1].budowaFocusOverride})`);
  ok(legacyCities[1].budowaFocus === 'wojsko' && legacyCities[1].budowaTryb === 'priorytet',
    `M8: miasto c2 ZACHOWUJE swoją starą indywidualną parę (focus,tryb), nie zostaje cichcem nadpisane (got ${legacyCities[1].budowaFocus},${legacyCities[1].budowaTryb})`);
  ok(legacyCities[0].budowaFocusOverride === false && legacyCities[2].budowaFocusOverride === false,
    'M8 kontrola: miasta == default dostają override=false (broadcast dalej nimi rządzi)');
}

console.log(`empire-city-defaults-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
