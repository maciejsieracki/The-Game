'use strict';
/**
 * currency-test.cjs -- standalone Node test for Waluta (currency) model.
 * Run from gra/:  node tools/currency-test.cjs
 *
 * Tests (wg decyzji Maciela 2026-06-25):
 *   Efekt 1: handelNetto x2 gdy walutaOdkryta=true (cala pula przed podzialem).
 *   Efekt 2: doPuli * targowiskoPracaMnoznik -> pieniadzZPracy gdy maTargowisko+waluta; 0 bez nich.
 *   Targowisko bonusy bazowe: +50% Handel (param) + 3 Pieniadz (baza) -- nienaruszone.
 *
 * Self-contained: bundles economy.ts + production.ts with esbuild.
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[currency-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.currency-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.currency-bundle.cjs');

const ENTRY_TS = `
export {
  cityYieldPerTurn,
  loadEconParams,
  mnoznikHandelPieniadzForCiv,
  tileYield,
  corruptionRate,
} from '../src/game/economy';
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.json': 'json', '.ts': 'ts' },
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[currency-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const E = require(BUNDLE_FILE);

// --- tiny assertion framework ----------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else       { failed++; console.error('FAIL:', msg); }
}
function eq(a, b, msg) {
  assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

// Minimal EconParams from loadEconParams (empty raw -> all defaults)
const rawParams = {
  ekonomia_miasta: {},
  budynki: {},
};
const params = E.loadEconParams(rawParams, 'normal');
// Verify new params loaded with defaults
eq(params.walutaMnoznik,           2, 'params.walutaMnoznik default = 2');
eq(params.targowiskoPracaMnoznik,  2, 'params.targowiskoPracaMnoznik default = 2');
// Verify existing Targowisko param still default
eq(params.budynekTargowiskoBonusHandlu, 0.5, 'params.budynekTargowiskoBonusHandlu default = 0.5');

// A city with trade slider 60/30/10 (nauka/pieniadz/luksus)
// and work slider 70% budynki
function makeCity(overrides) {
  return Object.assign({
    id: 'c1',
    ludnosc: 3,
    zdrowie: 0,
    czyStolica: true,
    maSpichlerz: false,
    maAkwedukt: false,
    magazynZywnosci: 0,
    specjalisci: [],
    kolejkaProdukcji: [],
    podziałHandlu: { procentNauka: 20, procentPieniadz: 70, procentLuksus: 10 },
    podziałPracy:  { procentBudynki: 70 },
  }, overrides);
}

// 1 Rownina tile: praca=1, handel=1, zywnosc=2
const ROWNINA_TILE = { terenBazowy: 'rownina', nakladka: 'brak', maRzeke: false };
const workedTiles = [ROWNINA_TILE, ROWNINA_TILE, ROWNINA_TILE];  // 3 tiles -> handel=3, praca=3

const noBuildings = [];

// --- Base ctx (no waluta, no targowisko) ---
function makeCtx(overrides) {
  return Object.assign({
    wojskoZuzycieZywnosci: 0,
    strataFraction:        0,
    maMlyn:                false,
    maCegielnia:           false,
    maTargowisko:          false,
    maBiblioteka:          false,
    maMennica:             false,
    mennicaMnoznik:        1,
    walutaOdkryta:         false,
  }, overrides);
}

// ---------------------------------------------------------------------------
// A. BASELINE (no waluta, no targowisko)
// ---------------------------------------------------------------------------
const city = makeCity();
const ctxBase = makeCtx();
const yldBase = E.cityYieldPerTurn(city, workedTiles, noBuildings, params, ctxBase);

// handelNetto = 3 (3 rownina tiles), no strata, no waluta
// pieniadzZHandlu = floor(3 * 0.70 * 1) = floor(2.1) = 2
// pieniadzZPracy = 0 (no targowisko/waluta)
eq(yldBase.pieniadzZPracy, 0, 'baseline: pieniadzZPracy = 0');
eq(yldBase.pieniadz, 2,       'baseline: pieniadz = 2 (floor(3*0.70*1)+0 buildings)');

// ---------------------------------------------------------------------------
// B. EFEKT 1: Waluta odkryta (bez Targowiska) — handelNetto x2
// ---------------------------------------------------------------------------
const ctxWaluta = makeCtx({ walutaOdkryta: true });
const yldWaluta = E.cityYieldPerTurn(city, workedTiles, noBuildings, params, ctxWaluta);

// handelNetto = 3 * walutaMnoznik(2) = 6
// pieniadzZHandlu = floor(6 * 0.70 * mennicaMnoznik(1)) = floor(4.2) = 4
// naukaZHandlu    = floor(6 * 0.20) = floor(1.2) = 1  (was 0 at base)
// luksusZHandlu   = floor(6 * 0.10) = floor(0.6) = 0
// pieniadzZPracy  = 0 (brak Targowiska)
eq(yldWaluta.pieniadzZPracy, 0, 'waluta (no targowisko): pieniadzZPracy = 0');
eq(yldWaluta.pieniadz, 4,       'efekt1: pieniadz = 4 (floor(6*0.70*1))');
// nauka z handlu powinna wzrosnac
assert(yldWaluta.nauka >= 1,    'efekt1: nauka >= 1 (handelNetto x2 wplywa tez na nauke)');
// Verify handel x2 vs baseline
assert(yldWaluta.pieniadz > yldBase.pieniadz, 'efekt1: pieniadz po waluta > pieniadz bez');

// ---------------------------------------------------------------------------
// C. EFEKT 1 + EFEKT 2: Waluta + Targowisko
// ---------------------------------------------------------------------------
const ctxBoth = makeCtx({ walutaOdkryta: true, maTargowisko: true });
const yldBoth = E.cityYieldPerTurn(city, workedTiles, noBuildings, params, ctxBoth);

// handelBrutto = 3 * (1 + 0.5) = 4.5  (Targowisko +50%)
// handelNetto  = 4.5 * walutaMnoznik(2) = 9
// pieniadzZHandlu = floor(9 * 0.70 * 1) = floor(6.3) = 6
// pracaNetto = floor(3) = 3  (no mlyn/cegielnia, no buildings, no corruption)
// doPuli = floor(3 * (1 - 0.70)) = floor(0.9) = 0
// pieniadzZPracy = floor(0 * 2) = 0  (doPuli=0 from 3 praca * 30%)
// pieniadz total = 6 + 0 (buildings) + 0 (pieniadzZPracy) = 6
eq(yldBoth.pieniadzZPracy, 0,   'efekt2 (low praca): pieniadzZPracy = 0 (doPuli=floor(3*0.30)=0)');
eq(yldBoth.pieniadz, 6,         'efekt1+targowisko: pieniadz = 6 (floor(9*0.70))');

// Now test with more worked tiles so doPuli > 0
// 6 rownina tiles -> praca=6, handel=6
const workedTiles6 = Array(6).fill(ROWNINA_TILE);
const yldBoth6 = E.cityYieldPerTurn(city, workedTiles6, noBuildings, params, ctxBoth);

// handelBrutto = 6 * 1.5 = 9
// handelNetto  = 9 * 2   = 18
// pieniadzZHandlu = floor(18 * 0.70) = floor(12.6) = 12
// pracaNetto = floor(6) = 6  (no multipliers)
// doPuli = floor(6 * 0.30) = floor(1.8) = 1
// pieniadzZPracy = floor(1 * 2) = 2
// pieniadz total = 12 + 0 + 2 = 14
eq(yldBoth6.pieniadzZPracy, 2,  'efekt2: pieniadzZPracy = 2 (doPuli=1, x2)');
eq(yldBoth6.pieniadz, 14,       'efekt1+efekt2: pieniadz = 14');

// ---------------------------------------------------------------------------
// D. EFEKT 2 gate: Targowisko BEZ Waluty -> pieniadzZPracy = 0
// ---------------------------------------------------------------------------
const ctxTargOnly = makeCtx({ maTargowisko: true, walutaOdkryta: false });
const yldTargOnly = E.cityYieldPerTurn(city, workedTiles6, noBuildings, params, ctxTargOnly);
eq(yldTargOnly.pieniadzZPracy, 0, 'efekt2 gate: Targowisko bez Waluty -> pieniadzZPracy = 0');

// ---------------------------------------------------------------------------
// E. EFEKT 2 gate: Waluta BEZ Targowiska -> pieniadzZPracy = 0
// ---------------------------------------------------------------------------
const ctxWalutaOnly = makeCtx({ walutaOdkryta: true, maTargowisko: false });
const yldWalutaOnly = E.cityYieldPerTurn(city, workedTiles6, noBuildings, params, ctxWalutaOnly);
eq(yldWalutaOnly.pieniadzZPracy, 0, 'efekt2 gate: Waluta bez Targowiska -> pieniadzZPracy = 0');

// ---------------------------------------------------------------------------
// F. Targowisko bonusy bazowe NIENARUSZONE (+50% Handel, +3 Pieniadz z bazy)
// ---------------------------------------------------------------------------
// We need a building record for Targowisko with baza.pieniadz=3
// Simulate via the building system with a mock building entry
// The +50% handel is already tested indirectly above (handelBrutto = 6*1.5=9)
// Verify that the 50% bonus is applied by comparing with/without Targowisko (no waluta):

const ctxNoTarg = makeCtx({ maTargowisko: false, walutaOdkryta: false });
const ctxWithTarg = makeCtx({ maTargowisko: true, walutaOdkryta: false });
const yldNoTarg  = E.cityYieldPerTurn(city, workedTiles6, noBuildings, params, ctxNoTarg);
const yldWithTarg = E.cityYieldPerTurn(city, workedTiles6, noBuildings, params, ctxWithTarg);

// handelBrutto without = 6; with = 9 (+50%)
// pieniadzZHandlu without = floor(6*0.70) = 4
// pieniadzZHandlu with    = floor(9*0.70) = 6
assert(yldWithTarg.pieniadz > yldNoTarg.pieniadz,
  'Targowisko +50% Handel nienaruszone: pieniadz wzrasta bez Waluty');
eq(yldWithTarg.pieniadz - yldNoTarg.pieniadz, 2,
  'Targowisko +50% delta pieniadz = +2 (floor(9*0.70)-floor(6*0.70) = 6-4)');

// Test +3 Pieniadz bazowy z budynku Targowisko (baza.pieniadz=3)
// Create a minimal building record matching the targowisko definition
const mockTargowiskoBuilding = {
  record: {
    id: 'targowisko',
    nazwa: 'Targowisko',
    kategoria: 'Handel',
    epokaWejscia: 1,
    maksPoziom: 3,
    baza:   { praca:0, pieniadz:3, zywnosc:0, nauka:0, kultura:0, zadowolenie:0, obrona:0, mnoznik:0 },
    przyrost:{ praca:0, pieniadz:0, zywnosc:0, nauka:0, kultura:0, zadowolenie:0, obrona:0, mnoznik:0 },
    kosztBudowy: 60,
    przyrostKosztu: 0,
    utrzymanie: 1,
    przyrostUtrzymania: 0,
    techUnlock: 'waluta',
  },
  level: 1,
};
const yldWithTargBuilding = E.cityYieldPerTurn(
  city, workedTiles6, [mockTargowiskoBuilding], params, ctxWithTarg
);
// pieniadz = 6 (from handel) + 3 (from building baza.pieniadz) = 9
eq(yldWithTargBuilding.pieniadz, 9,
  'Targowisko baza.pieniadz=3 nienaruszone: total pieniadz = 6+3 = 9');

// Verify mnoznik=0 on Targowisko doesn't bleed into Praca (bug was mnoznik=10)
// With mnoznik=0, praca should be same as without the building
const yldNoBuilding = E.cityYieldPerTurn(city, workedTiles6, noBuildings, params, ctxNoTarg);
const yldTargBuildNoTarg = E.cityYieldPerTurn(
  city, workedTiles6,
  [{ ...mockTargowiskoBuilding, record: { ...mockTargowiskoBuilding.record }}],
  params, ctxNoTarg
);
eq(yldTargBuildNoTarg.praca, yldNoBuilding.praca,
  'Targowisko baza.mnoznik=0 nie wplywa na Prace (bug fixed)');

// ---------------------------------------------------------------------------
// G. walutaMnoznik param from JSON override
// ---------------------------------------------------------------------------
const rawOverride = {
  ekonomia_miasta: {},
  budynki: {
    waluta_mnoznik: { easy: 3, normal: 3, hard: 3 },
    targowisko_praca_na_pieniadz_mnoznik: { easy: 4, normal: 4, hard: 4 },
  },
};
const paramsOverride = E.loadEconParams(rawOverride, 'normal');
eq(paramsOverride.walutaMnoznik, 3,          'loadEconParams: walutaMnoznik override = 3');
eq(paramsOverride.targowiskoPracaMnoznik, 4, 'loadEconParams: targowiskoPracaMnoznik override = 4');

// ---------------------------------------------------------------------------
// H. per-cyw mnoznikHandelPieniadz (RDY-11, decyzja 5A)
// ---------------------------------------------------------------------------
const mockCivs = {
  cywilizacje: [
    { Cywilizacja: 'Grecy', ikonaId: 'grecy', mnoznikHandelPieniadz: 2.3 },
    { Cywilizacja: 'Chinczycy', ikonaId: 'chinczycy', mnoznikHandelPieniadz: 2.4 },
    { Cywilizacja: 'Zulusi', ikonaId: 'zulusi', mnoznikHandelPieniadz: 1.7 },
  ],
};
eq(E.mnoznikHandelPieniadzForCiv('grecy', mockCivs, 2), 2.3, 'mnoznikHandelPieniadz: Grecy = 2.3');
eq(E.mnoznikHandelPieniadzForCiv('chinczycy', mockCivs, 2), 2.4, 'mnoznikHandelPieniadz: Chinczycy = 2.4');
eq(E.mnoznikHandelPieniadzForCiv('zulusi', mockCivs, 2), 1.7, 'mnoznikHandelPieniadz: Zulusi = 1.7');
eq(E.mnoznikHandelPieniadzForCiv('unknown', mockCivs, 2), 2, 'mnoznikHandelPieniadz: unknown -> fallback 2');

const workedTiles7 = [{ praca: 0, handel: 10, zywnosc: 0, pieniadz: 0, nauka: 0, kultura: 0, zadowolenie: 0 }];
const ctxWalutaGrecy = {
  wojskoZuzycieZywnosci: 0, strataFraction: 0,
  maMlyn: false, maCegielnia: false, maTargowisko: false, maMennica: false, mennicaMnoznik: 1,
  walutaOdkryta: true, walutaMnoznikOverride: 2.3,
};
const yldGrecy = E.cityYieldPerTurn(city, workedTiles7, noBuildings, params, ctxWalutaGrecy);
// handelNetto = 10 * 2.3 = 23; nauka 20% = floor(4.6) = 4
eq(yldGrecy.nauka, 4, 'Efekt 1 per-cyw: Grecy x2.3 -> nauka z handlu = 4 (nie x2 plaskie)');

// --- summary ---------------------------------------------------------------
console.log(`\ncurrency-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
