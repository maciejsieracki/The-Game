'use strict';
/**
 * currency-test.cjs -- standalone Node test for Waluta (currency) model.
 * Run from gra/:  node tools/currency-test.cjs
 *
 * Tests:
 *   Efekt 1 SCALONY (decyzja Maciej 2026-07-25): handelNetto x mennicaMnoznikPoWalucie
 *     (easy x2,0 / normal x1,5 / hard x1,0) TYLKO gdy walutaOdkryta ORAZ maMennica sa
 *     oba prawdziwe -- sam tech Waluty juz NIE wystarcza (to jest sedno zmiany, patrz
 *     tez tools/waluta-mennica-test.cjs dla pelnej macierzy trudnosc x Mennica).
 *   Efekt 2: doPuli * targowiskoPracaMnoznik -> pieniadzZPracy gdy maTargowisko+waluta; 0 bez nich.
 *     (Efekt 2 NIE wymaga Mennicy -- niezmieniony przez decyzje 2026-07-25.)
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

// 10 pol Rownina -- uzyte tylko dla sekcji B/B2 (potrzebny wiekszy handelBrutto,
// zeby delta Efektu 1 x1.5 na normal byla widoczna po floor() takze w Nauce).
const workedTilesEfekt1 = Array(10).fill(ROWNINA_TILE);
const yldBase10 = E.cityYieldPerTurn(city, workedTilesEfekt1, noBuildings, params, makeCtx());

// ---------------------------------------------------------------------------
// B. EFEKT 1 SCALONY: Waluta odkryta BEZ Mennicy -> BRAK zmiany (sedno decyzji
//    2026-07-25 -- sam tech Waluty juz nie wystarcza, kontrast z B2 ponizej).
// ---------------------------------------------------------------------------
const ctxWalutaNoMennica = makeCtx({ walutaOdkryta: true, maMennica: false });
const yldWalutaNoMennica = E.cityYieldPerTurn(city, workedTilesEfekt1, noBuildings, params, ctxWalutaNoMennica);

// Bez Mennicy: mnoznik = 1 mimo walutaOdkryta=true -> identyczne jak baseline (10 pol: pieniadz=7, nauka=2).
eq(yldWalutaNoMennica.pieniadzZPracy, 0, 'waluta bez Mennicy (no targowisko): pieniadzZPracy = 0');
eq(yldWalutaNoMennica.pieniadz, yldBase10.pieniadz,
  'EFEKT 1 SCALONY: Waluta bez Mennicy -> pieniadz NIEZMIENIONY wzgledem baseline (brak mnoznika)');
eq(yldWalutaNoMennica.nauka, yldBase10.nauka,
  'EFEKT 1 SCALONY: Waluta bez Mennicy -> nauka NIEZMIENIONA wzgledem baseline (brak mnoznika)');

// ---------------------------------------------------------------------------
// B2. EFEKT 1 SCALONY: Waluta + Mennica -> handelNetto x mennicaMnoznikPoWalucie
//     (normal = x1,5, NIE stare flat x2 sprzed decyzji 2026-07-25).
// ---------------------------------------------------------------------------
const ctxWaluta = makeCtx({ walutaOdkryta: true, maMennica: true });
const yldWaluta = E.cityYieldPerTurn(city, workedTilesEfekt1, noBuildings, params, ctxWaluta);

// handelNetto = 10 * mennicaMnoznikPoWalucie(1.5, normal) = 15
// pieniadzZHandlu = floor(15 * 0.70) = floor(10.5) = 10; naukaZHandlu = floor(15*0.20) = 3
eq(yldWaluta.pieniadzZPracy, 0, 'waluta+mennica (no targowisko): pieniadzZPracy = 0');
eq(yldWaluta.pieniadz, 10,      'efekt1 scalony (normal x1.5): pieniadz = 10 (floor(15*0.70))');
eq(yldWaluta.nauka, 3,          'efekt1 scalony (normal x1.5): nauka = 3 (floor(15*0.20)) -- wariant A, nauka tez rosnie');
// nauka z handlu powinna wzrosnac wzgledem baseline (mnoznik dziala na cala pule, wariant A)
assert(yldWaluta.nauka > yldBase10.nauka,
  'efekt1 scalony: nauka > baseline (handelNetto x1.5 wplywa tez na nauke, wariant A)');
// Verify pieniadz wyzszy niz bez Mennicy
assert(yldWaluta.pieniadz > yldWalutaNoMennica.pieniadz,
  'efekt1 scalony: pieniadz z Mennica+Waluta > pieniadz bez Mennicy');

// ---------------------------------------------------------------------------
// C. EFEKT 1 + EFEKT 2: Waluta + Targowisko
// ---------------------------------------------------------------------------
// EFEKT 1 SCALONY: sekcja C testuje Efekt1+Efekt2 RAZEM aktywne, wiec ctxBoth
// musi teraz miec tez maMennica:true (Efekt 1 wymaga Waluty ORAZ Mennicy;
// Efekt 2/Targowisko nie wymaga Mennicy, bez zmian).
const ctxBoth = makeCtx({ walutaOdkryta: true, maTargowisko: true, maMennica: true });
const yldBoth = E.cityYieldPerTurn(city, workedTiles, noBuildings, params, ctxBoth);

// Praca Rownina = 2 (data/terrain-yields.json) -> pracaNetto = 3*2 = 6 (no mlyn/cegielnia, no buildings, no corruption)
// splitPraca(6, 0.70): doBudynkow=round(6*0.70)=round(4.2)=4, doPuli=6-4=2
// pieniadzZPracy = floor(2 * 2) = 4  (targowiskoPracaMnoznik niezmieniony przez decyzje 2026-07-25)
// D5 (decyzja 76=B, POPRAWKA tego samego dnia -- cytat wlasciciela w economy.ts):
// pieniadzZPracy NIE jest doliczany do gotowej puli PO Targowisku -- to Praca
// wystawiona na handel U ZRODLA, wiec wchodzi do handelBazowy PRZED Step 3
// (Targowisko), i przechodzi przez WSZYSTKIE mnozniki Handlu (Targowisko,
// civHandelMult, trasy, korupcja, Waluta+Mennica), tak jak reszta Daniny.
// handelBazowy = handelTerenu(3) + pieniadzZPracy(4) = 7
// handelBrutto  = 7 * (1 + 0.5) = 10.5  (Targowisko +50%, teraz dziala TEZ na pieniadzZPracy)
// handelNetto   = 10.5 * mennicaMnoznikPoWalucie(1.5, normal) = 15.75
// pieniadzZHandlu = floor(15.75 * 0.70) = floor(11.025) = 11
// pieniadz total = 11 (0 buildings) -- POPRAWIONE 2026-07-25: stare 8 (i posrednie 7)
// zakladaly, ze pieniadzZPracy omija Targowisko/Mennice (formule sprzed ostatniej
// poprawki D5 w economy.ts).
eq(yldBoth.pieniadzZPracy, 4,   'efekt2 (praca rownina=2): pieniadzZPracy = 4 (doPuli=round(6)-round(6*0.70)=2, x2) -- niezmieniony przez Mennica-gate');
eq(yldBoth.pieniadz, 11,        'efekt1(x1.5 scalony)+efekt2: pieniadz = 11 (D5 poprawka: floor(((3+4)*1.5)*1.5*0.70), pieniadzZPracy przechodzi przez Targowisko+Waluta+Mennica jak Danina)');

// Now test with more worked tiles so doPuli > 0
// 6 rownina tiles -> praca=6*2=12 (Praca Rownina=2), handel=6
const workedTiles6 = Array(6).fill(ROWNINA_TILE);
const yldBoth6 = E.cityYieldPerTurn(city, workedTiles6, noBuildings, params, ctxBoth);

// pracaNetto = 6*2 = 12  (Praca Rownina=2, no multipliers)
// splitPraca(12, 0.70): doBudynkow=round(12*0.70)=round(8.4)=8, doPuli=12-8=4
// pieniadzZPracy = floor(4 * 2) = 8
// D5 (decyzja 76=B, POPRAWKA tego samego dnia -- patrz uzasadnienie w bloku wyzej):
// pieniadzZPracy wchodzi do handelBazowy PRZED Targowisko, wiec przechodzi tez
// przez Targowisko +50% i Waluta+Mennica x1.5.
// handelBazowy = handelTerenu(6) + pieniadzZPracy(8) = 14
// handelBrutto  = 14 * 1.5 = 21  (Targowisko +50%)
// handelNetto   = 21 * mennicaMnoznikPoWalucie(1.5, normal) = 31.5
// pieniadzZHandlu = floor(31.5 * 0.70) = floor(22.05) = 22
// pieniadz total = 22 -- POPRAWIONE 2026-07-25: stare 17 (i posrednie 15) zakladaly,
// ze pieniadzZPracy omija Targowisko/Mennice (formule sprzed ostatniej poprawki D5).
eq(yldBoth6.pieniadzZPracy, 8,  'efekt2: pieniadzZPracy = 8 (doPuli=4, x2) -- niezmieniony przez Mennica-gate');
eq(yldBoth6.pieniadz, 22,       'efekt1(x1.5 scalony)+efekt2: pieniadz = 22 (D5 poprawka: floor(((6+8)*1.5)*1.5*0.70), pieniadzZPracy przechodzi przez Targowisko+Waluta+Mennica jak Danina)');

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

// terenBazowy wymagany -- tileYield() czyta tylko to pole (WorkedTile), literalne
// klucze praca/handel/... na obiekcie tile sa ignorowane. Uzyj 10x Rownina (handel=1/tile)
// zeby odtworzyc pierwotny zamysl testu (handel=10).
const workedTiles7 = Array(10).fill(ROWNINA_TILE);
// EFEKT 1 SCALONY: override per-cyw jest WARTOSCIA mnoznika, ale bramka
// (walutaOdkryta && maMennica) nadal decyduje CZY w ogole mnozyc -- stad
// maMennica:true tutaj jest wymagane, inaczej override zostalby zignorowany
// (mnoznik=1) mimo ze jest ustawiony.
const ctxWalutaGrecy = {
  wojskoZuzycieZywnosci: 0, strataFraction: 0,
  maMlyn: false, maCegielnia: false, maTargowisko: false, maMennica: true,
  walutaOdkryta: true, walutaMnoznikOverride: 2.3,
};
const yldGrecy = E.cityYieldPerTurn(city, workedTiles7, noBuildings, params, ctxWalutaGrecy);
// handelNetto = 10 * 2.3 = 23; nauka 20% = floor(4.6) = 4
eq(yldGrecy.nauka, 4, 'Efekt 1 per-cyw: Grecy x2.3 (bramka Waluta+Mennica spelniona) -> nauka z handlu = 4');

// Kontrola bramki: TA SAMA override 2.3, ale BEZ Mennicy -> mnoznik musi wrocic
// do x1 (override nie omija bramki Mennicy).
const ctxWalutaGrecyNoMennica = { ...ctxWalutaGrecy, maMennica: false };
const yldGrecyNoMennica = E.cityYieldPerTurn(city, workedTiles7, noBuildings, params, ctxWalutaGrecyNoMennica);
eq(yldGrecyNoMennica.nauka, 2,
  'Kontrola bramki: Grecy override 2.3 BEZ Mennicy -> nauka = 2 (floor(10*0.20), mnoznik=1, override zignorowany)');

// --- summary ---------------------------------------------------------------
console.log(`\ncurrency-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
