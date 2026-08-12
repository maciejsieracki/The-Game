'use strict';
/**
 * epoka-merge-recruit-test.cjs -- standalone Node test za P-REKRUTACJA-ZNIKLE-JEDNOSTKI-EPOKI-BRAZU
 * (playtest Macieja 2026-08-11, dyspozycje/PYTANIA-OTWARTE.md punkt 7 batcha).
 * Run from gra/:  node tools/epoka-merge-recruit-test.cjs
 *
 * ZGLOSZENIE: "W epoce Braz lista rekrutacji pokazuje WYLACZNIE Zwiadowce -- reszta jednostek
 * zniknela. Wg wczesniejszej zasady projektu rekrutacja powinna obejmowac tez jednostki epoki
 * nizszej (Kamien) dostepne rownolegle z Brazem."
 *
 * KOREKTA 2026-08-12 (R-EPOKA-KASKADA-JEDNA-Q1, Maciej, ECHO commit 1d9691b0) -- ODWRACA
 * wczesniejszy wpis w tym pliku ("NIE regresja logiki laczenia epok", testy 1-3 sprzed tej
 * poprawki). Wlasciciel wyjasnil, ze wczesniejsze rozumienie bylo BLEDNE: "Zawsze
 * umozliwialismy produkcje jednostek z poprzedniej epoki, czyli w brazie powinny byc mozliwe
 * do rekrutacji od razu, od poczatku, wszystkie jednostki z kamienia. Z kolei w zelazie powinna
 * byc mozliwosc rekrutacji wszystkich jednostek z brazu, ale z kamienia juz nie. Oczywiscie
 * wyjatek dotyczy zwiadowcy." Czyli: w epoce E dostepne sa jednostki epoki E ORAZ dokladnie
 * E-1 (nie pelna kaskada w dol), WYJATEK: Zwiadowca dostepny zawsze (jednostka cywilna, nie
 * wojskowa). Filtr w production.ts (petla jednostek w availableProduction) zostal poprawiony
 * z `epochNumber(u.Epoka) > epoch -> continue` (pelna kaskada, BLEDNE) na wersje z dolnym
 * ograniczeniem `epoch - 1` plus wyjatek Zwiadowcy. Testy 1-3 ponizej PRZEPISANE, zeby
 * asercjonowac NOWA regule.
 *
 * Test 4 dotyczy INNEJ, nierozstrzygnietej sprawy (P-DREWNO-BRAMKA-RYZYKO-STARTU -- bramka
 * surowcowa drewna/brazu przy swiezo zalozonym miescie) i POZOSTAJE NIETKNIETY -- osobne ABC.
 *
 * Bundles production.ts via esbuild, then runs assertions. Pure logic only -- no DOM, no THREE.
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[epoka-merge-recruit-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.epoka-merge-recruit-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.epoka-merge-recruit-bundle.cjs');

const ENTRY_TS = `
export {
  purchasableUnits,
} from '../src/game/production';
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[epoka-merge-recruit-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const { purchasableUnits } = M;

// --- test harness ------------------------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg, extra) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else {
    failed++;
    console.error('  [FAIL] ' + msg + (extra ? (' -- ' + extra) : ''));
  }
}

const CITY = { id: 'test-city', q: 0, r: 0, ownerId: 0, population: 5 };

const realUnits = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '..', 'data', 'units.json'), 'utf8'));
const realBuildings = JSON.parse(fs.readFileSync(
  path.resolve(__dirname, '..', 'data', 'buildings.json'), 'utf8'));
const DATA = { buildings: realBuildings, units: realUnits };

// Podstawowe jednostki bazowe (bez Nacja) po epoce -- do asercji zbiorow.
const KAMIEN_BASE_IDS = realUnits
  .filter(u => (u.Epoka === 'Kamień' || u.Epoka === 'Kamien') && !(u.Nacja ?? '').trim())
  .map(u => u.Jednostka);
const BRAZ_BASE_IDS = realUnits
  .filter(u => (u.Epoka === 'Brąz' || u.Epoka === 'Braz') && !(u.Nacja ?? '').trim())
  .map(u => u.Jednostka);
const ZELAZO_BASE_IDS = realUnits
  .filter(u => (u.Epoka === 'Żelazo' || u.Epoka === 'Zelazo') && !(u.Nacja ?? '').trim())
  .map(u => u.Jednostka);

// Zwiadowca -- WYJATEK reguly (jednostka Typ='Civilian', potwierdzone empirycznie w
// unit-recruit tests/production.ts jako JEDYNA taka w units.json) -- dostepny w kazdej
// epoce niezaleznie od epoki E/E-1. Nalezy do KAMIEN_BASE_IDS (Epoka='Kamień'), wiec przy
// epoch=3 jest JEDYNYM elementem KAMIEN_BASE_IDS ktory ma prawo pozostac na liscie.
const ZWIADOWCA_ID = 'Zwiadowca';

console.log('\n[epoka-merge-recruit-test] Running tests...\n');
console.log('Kamien base units w units.json: ' + JSON.stringify(KAMIEN_BASE_IDS));
console.log('Braz base units w units.json: ' + JSON.stringify(BRAZ_BASE_IDS));
console.log('Zelazo base units w units.json: ' + JSON.stringify(ZELAZO_BASE_IDS) + '\n');

// Kontekst z pelnym dostepem: wszystkie techy odblokowane, Koszary wybudowane,
// magazyn panstwa pelny (Drewno + Braz + Zelazo) -- symuluje miasto, ktore juz kilka tur
// gromadzilo surowce (NIE stan startowy).
const ALL_TECHS = realUnits.map(u => (u.Tech ?? '').toString().trim())
  .filter(t => t.length > 0 && t !== '-' && t !== '—');
const FULL_STOCK_CTX = {
  builtBuildingIds: ['koszary', 'odlewnia_zelaza'],
  empireResourceStock: { drewno: 50, braz: 50, zelazo: 50, kamien: 50 },
  // Galera (Typ='Naval') wymaga dostepu do wody -- niezalezna bramka od epoki
  // (R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE), musi byc wlaczona zeby "pelny dostep"
  // faktycznie znaczyl pelny dostep.
  cityHasCoastOrRiver: true,
  // Jednostki Zelaza wymagaja kopalni na zlozu zelaza (zelazo-access.ts) -- "pelny dostep"
  // musi to tez obejmowac, inaczej test 3 gubi Zelazo z innego powodu niz epoka.
  hasKopalniaNaZlozuZelaza: true,
};

console.log('1. (a) Epoka Kamien (epoch=1): TYLKO jednostki Kamienia (+ Zwiadowca, ktory i tak jest Kamien), zero Brazu/Zelaza');
{
  const items = purchasableUnits(CITY, DATA, ALL_TECHS, { ...FULL_STOCK_CTX, epoch: 1 });
  const ids = items.map(i => i.id);
  const anyBraz = BRAZ_BASE_IDS.some(id => ids.includes(id));
  const anyZelazo = ZELAZO_BASE_IDS.some(id => ids.includes(id));
  assert(!anyBraz, 'epoch=1: brak jakiejkolwiek jednostki bazowej Brazu na liscie (brak gornej kaskady)', 'ids=' + JSON.stringify(ids));
  assert(!anyZelazo, 'epoch=1: brak jakiejkolwiek jednostki bazowej Zelaza na liscie', 'ids=' + JSON.stringify(ids));
  const kamienPresent = KAMIEN_BASE_IDS.filter(id => ids.includes(id));
  assert(kamienPresent.length === KAMIEN_BASE_IDS.length,
    'epoch=1: WSZYSTKIE jednostki bazowe Kamienia dostepne (biezaca epoka, pelny magazyn+techy+koszary)',
    'brakuje=' + JSON.stringify(KAMIEN_BASE_IDS.filter(id => !ids.includes(id))));
  assert(ids.includes(ZWIADOWCA_ID), 'epoch=1: Zwiadowca obecny (nalezy do Kamienia = biezaca epoka)', 'ids=' + JSON.stringify(ids));
}

console.log('\n2. (b) Epoka Braz (epoch=2): jednostki Brazu + WSZYSTKIE jednostki Kamienia (dokladnie jedna epoka nizej), zero Zelaza');
{
  const items = purchasableUnits(CITY, DATA, ALL_TECHS, { ...FULL_STOCK_CTX, epoch: 2 });
  const ids = items.map(i => i.id);
  const kamienPresent = KAMIEN_BASE_IDS.filter(id => ids.includes(id));
  const brazPresent = BRAZ_BASE_IDS.filter(id => ids.includes(id));
  const anyZelazo = ZELAZO_BASE_IDS.some(id => ids.includes(id));
  assert(kamienPresent.length === KAMIEN_BASE_IDS.length,
    'epoch=2: WSZYSTKIE jednostki bazowe Kamienia dostepne (dokladnie jedna epoka nizej niz Braz, nie tylko Zwiadowca)',
    'brakuje=' + JSON.stringify(KAMIEN_BASE_IDS.filter(id => !ids.includes(id))));
  assert(brazPresent.length === BRAZ_BASE_IDS.length,
    'epoch=2: WSZYSTKIE jednostki bazowe Brazu dostepne (biezaca epoka)',
    'brakuje=' + JSON.stringify(BRAZ_BASE_IDS.filter(id => !ids.includes(id))));
  assert(!anyZelazo, 'epoch=2: zero jednostek Zelaza (epoka wyzsza niz biezaca)', 'ids=' + JSON.stringify(ids));
  assert(ids.length > BRAZ_BASE_IDS.length,
    'epoch=2: lista jest SUMA Braz+Kamien (dluzsza niz sama lista Brazu), nie zastapieniem Kamienia przez Braz',
    'total=' + ids.length + ' brazBase=' + BRAZ_BASE_IDS.length);
}

console.log('\n3. (c) Epoka Zelazo (epoch=3): jednostki Zelaza + WSZYSTKIE jednostki Brazu + WYLACZNIE Zwiadowca z Kamienia (zero INNYCH jednostek Kamienia)');
{
  const items = purchasableUnits(CITY, DATA, ALL_TECHS, { ...FULL_STOCK_CTX, epoch: 3 });
  const ids = items.map(i => i.id);
  const kamienPresent = KAMIEN_BASE_IDS.filter(id => ids.includes(id));
  const brazPresent = BRAZ_BASE_IDS.filter(id => ids.includes(id));
  const zelazoPresent = ZELAZO_BASE_IDS.filter(id => ids.includes(id));
  const kamienNonZwiadowcaPresent = kamienPresent.filter(id => id !== ZWIADOWCA_ID);
  assert(ids.includes(ZWIADOWCA_ID),
    'epoch=3: Zwiadowca JEST dostepny (wyjatek reguly -- jednostka cywilna, wszystkie epoki)',
    'ids=' + JSON.stringify(ids));
  assert(kamienNonZwiadowcaPresent.length === 0,
    'epoch=3: ZERO innych jednostek Kamienia poza Zwiadowca (dwie epoki nizej -- kaskada NIE siega az tutaj)',
    'nieoczekiwane=' + JSON.stringify(kamienNonZwiadowcaPresent));
  assert(brazPresent.length === BRAZ_BASE_IDS.length,
    'epoch=3: WSZYSTKIE jednostki bazowe Brazu dostepne (dokladnie jedna epoka nizej niz Zelazo)',
    'brakuje=' + JSON.stringify(BRAZ_BASE_IDS.filter(id => !ids.includes(id))));
  assert(zelazoPresent.length === ZELAZO_BASE_IDS.length,
    'epoch=3: WSZYSTKIE jednostki bazowe Zelaza dostepne (biezaca epoka)',
    'brakuje=' + JSON.stringify(ZELAZO_BASE_IDS.filter(id => !ids.includes(id))));
}

console.log('\n4. PIN objawu zgloszenia: miasto SWIEZO zalozone (pusty magazyn, brak Koszar, brak technologii)');
console.log('   w epoce Braz pokazuje WYLACZNIE Zwiadowce -- to NIE regresja logiki epok, to bramka');
console.log('   surowcowa (P-DREWNO-BRAMKA-RYZYKO-STARTU, ABC czeka na decyzje wlasciciela).');
{
  const items = purchasableUnits(CITY, DATA, [], {
    epoch: 2,
    builtBuildingIds: [],
    empireResourceStock: {},
  });
  const ids = items.map(i => i.id);
  assert(ids.length === 1 && ids[0] === 'Zwiadowca',
    'Swiezo zalozone miasto w epoce Braz: TYLKO Zwiadowca (pin dzisiejszego zachowania, nie "naprawa")',
    'ids=' + JSON.stringify(ids));
}

// --- Summary -----------------------------------------------------------------
console.log('');
try { fs.unlinkSync(ENTRY_FILE); } catch {}
try { fs.unlinkSync(BUNDLE_FILE); } catch {}

if (failed === 0) {
  console.log('[epoka-merge-recruit-test] WSZYSTKIE TESTY ZIELONE (' + passed + '/' + (passed + failed) + ')');
  process.exit(0);
} else {
  console.error('[epoka-merge-recruit-test] NIEUDANE: ' + failed + '/' + (passed + failed));
  process.exit(1);
}
