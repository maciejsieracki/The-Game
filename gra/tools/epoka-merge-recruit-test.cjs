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
 * WYNIK RECON (ta sesja + wczesniejszy recon zapisany w PYTANIA-OTWARTE.md przy
 * P-DREWNO-BRAMKA-RYZYKO-STARTU): to NIE regresja logiki laczenia epok. Filtr
 * `epochNumber(u.Epoka) > epoch -> continue` (production.ts, petla jednostek) poprawnie
 * przepuszcza epoke biezaca ORAZ wszystkie nizsze -- zweryfikowane ponizej testami 1-3.
 * Prawdziwa przyczyna zgloszonego objawu (test 4): miasto zawsze zaklada sie z PUSTYM
 * magazynem surowcow (cities.ts, `if (!city.surowce) city.surowce = {}`), a bramka
 * `empireStockHas(stock, 'drewno'/'braz')` (BUG-BRAMKA-DREWNO-BRAK, decyzja A 2026-08-08)
 * wymaga >0 sztuk W MAGAZYNIE PANSTWA -- z 75 jednostek w units.json TYLKO Zwiadowca ma
 * Surowiec=null (bramka go nie dotyczy). To swiadome, udokumentowane ryzyko z 2026-08-08,
 * DZIS (2026-08-12) potwierdzone playtestem jako P-DREWNO-BRAMKA-RYZYKO-STARTU -- pytanie
 * ABC (A/B/C) czeka na litere wlasciciela, NIE rozstrzygniete tym testem/commitem.
 *
 * Test 4 NIE jest "naprawa" -- to PIN dzisiejszego (zamierzonego, ale spornego) zachowania,
 * zeby przyszla zmiana w tym obszarze byla widoczna jako swiadomy diff, a nie cichy dryf.
 * Jesli wlasciciel odpowie B/C na P-DREWNO-BRAMKA-RYZYKO-STARTU, test 4 trzeba bedzie
 * ZAKTUALIZOWAC swiadomie -- to oczekiwane, nie oznaka zepsutego testu.
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

console.log('\n[epoka-merge-recruit-test] Running tests...\n');
console.log('Kamien base units w units.json: ' + JSON.stringify(KAMIEN_BASE_IDS));
console.log('Braz base units w units.json: ' + JSON.stringify(BRAZ_BASE_IDS) + '\n');

// Kontekst z pelnym dostepem: wszystkie techy odblokowane, Koszary wybudowane,
// magazyn panstwa pelny (Drewno + Braz) -- symuluje miasto, ktore juz kilka tur
// gromadzilo surowce (NIE stan startowy).
const ALL_TECHS = realUnits.map(u => (u.Tech ?? '').toString().trim())
  .filter(t => t.length > 0 && t !== '-' && t !== '—');
const FULL_STOCK_CTX = {
  builtBuildingIds: ['koszary'],
  empireResourceStock: { drewno: 50, braz: 50, zelazo: 50, kamien: 50 },
  // Galera (Typ='Naval') wymaga dostepu do wody -- niezalezna bramka od epoki
  // (R-BUDYNEK-PORTOWY-MIASTA-NADBRZEZNE), musi byc wlaczona zeby "pelny dostep"
  // faktycznie znaczyl pelny dostep.
  cityHasCoastOrRiver: true,
};

console.log('1. Epoka Kamien (epoch=1): rekrutacja pokazuje TYLKO jednostki Kamienia (Braz nie przecieka "w dol")');
{
  const items = purchasableUnits(CITY, DATA, ALL_TECHS, { ...FULL_STOCK_CTX, epoch: 1 });
  const ids = items.map(i => i.id);
  const anyBraz = BRAZ_BASE_IDS.some(id => ids.includes(id));
  assert(!anyBraz, 'epoch=1: brak jakiejkolwiek jednostki bazowej Brazu na liscie', 'ids=' + JSON.stringify(ids));
  const kamienPresent = KAMIEN_BASE_IDS.filter(id => ids.includes(id));
  assert(kamienPresent.length === KAMIEN_BASE_IDS.length,
    'epoch=1: WSZYSTKIE jednostki bazowe Kamienia dostepne (pelny magazyn+techy+koszary)',
    'brakuje=' + JSON.stringify(KAMIEN_BASE_IDS.filter(id => !ids.includes(id))));
}

console.log('\n2. Epoka Braz (epoch=2), magazyn i techy pelne: rekrutacja = Braz ORAZ Kamien RAZEM (zalozenie zgloszenia POTWIERDZONE)');
{
  const items = purchasableUnits(CITY, DATA, ALL_TECHS, { ...FULL_STOCK_CTX, epoch: 2 });
  const ids = items.map(i => i.id);
  const kamienPresent = KAMIEN_BASE_IDS.filter(id => ids.includes(id));
  const brazPresent = BRAZ_BASE_IDS.filter(id => ids.includes(id));
  assert(kamienPresent.length === KAMIEN_BASE_IDS.length,
    'epoch=2: WSZYSTKIE jednostki bazowe Kamienia WCIAZ dostepne razem z Brazem (epoka nizsza nie znika)',
    'brakuje=' + JSON.stringify(KAMIEN_BASE_IDS.filter(id => !ids.includes(id))));
  assert(brazPresent.length === BRAZ_BASE_IDS.length,
    'epoch=2: WSZYSTKIE jednostki bazowe Brazu dostepne',
    'brakuje=' + JSON.stringify(BRAZ_BASE_IDS.filter(id => !ids.includes(id))));
  assert(ids.length > BRAZ_BASE_IDS.length,
    'epoch=2: lista jest SUMA epok (dluzsza niz sama lista Brazu), nie zastapieniem Kamienia przez Braz',
    'total=' + ids.length + ' brazBase=' + BRAZ_BASE_IDS.length);
}

console.log('\n3. Epoka Zelazo (epoch=3), magazyn i techy pelne: rekrutacja nadal obejmuje jednostki Kamienia (kaskada 3 epok)');
{
  const items = purchasableUnits(CITY, DATA, ALL_TECHS, { ...FULL_STOCK_CTX, epoch: 3 });
  const ids = items.map(i => i.id);
  const kamienPresent = KAMIEN_BASE_IDS.filter(id => ids.includes(id));
  assert(kamienPresent.length === KAMIEN_BASE_IDS.length,
    'epoch=3: jednostki Kamienia WCIAZ dostepne (kaskada epok 1+2+3, nie tylko biezaca)',
    'brakuje=' + JSON.stringify(KAMIEN_BASE_IDS.filter(id => !ids.includes(id))));
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
