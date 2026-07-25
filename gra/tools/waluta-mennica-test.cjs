'use strict';
/**
 * waluta-mennica-test.cjs -- standalone Node test for EFEKT 1 SCALONY (decyzja
 * Maciej 2026-07-25): "Podwojenie handlu i zamiana na pieniądz następuje w
 * momencie, gdy po pierwsze odkryjemy walutę, a po drugie postawimy mennicę."
 *
 * Kontrakt (przed 2026-07-25 byly DWA osobne mnozniki -- teraz JEDEN):
 *   - Bramka AND: ctx.walutaOdkryta === true ORAZ ctx.maMennica === true.
 *     Sam tech Waluty (bez Mennicy) juz NIE wystarcza -- to jest sedno zmiany.
 *   - Wartosc mnoznika = params.mennicaMnoznikPoWalucie (globalne.mennica_mnoznik_po_walucie
 *     w econ-params.json): easy x2,0 / normal x1,5 / hard x1,0 (brak efektu na hard).
 *   - Mnoznik dziala na CALY handelNetto PRZED podzialem suwakiem -- Pieniadz,
 *     Nauka i Zamoznosc (Luksus) rosna RAZEM (wariant A, decyzja wlasciciela).
 *   - Efekt Targowiska (Praca->Pieniadz, targowiskoPracaMnoznik) jest OSOBNYM
 *     strumieniem, nie wymaga Mennicy, NIE zostal ruszony przez ta decyzje.
 *   - PARYTET AI: formula nie ma zadnej galezi po ownerId.
 *
 * Run from gra/:  node tools/waluta-mennica-test.cjs
 * Self-contained: bundluje economy.ts + turn-economy.ts + generator mapy z esbuild.
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[waluta-mennica-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.waluta-mennica-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.waluta-mennica-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { cityYieldPerTurn, loadEconParams, mnoznikHandelPieniadzForCiv } from '../src/game/economy';
export { buildEconParams, advanceCityEconomy } from '../src/game/turn-economy';
export { generateMap } from '../src/map/generator';
export { foundCityAt, canFoundCity } from '../src/game/cities';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[waluta-mennica-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const econParamsRaw = require('../data/econ-params.json');
const civs = require('../data/civs.json');
const societyParams = require('../data/society-params.json');
const buildings = require('../data/buildings.json');
const units = require('../data/units.json');
const tech = require('../data/tech.json');

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; console.log('PASS:', msg); } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

const pEasy   = M.loadEconParams(econParamsRaw, 'easy');
const pNormal = M.loadEconParams(econParamsRaw, 'normal');
const pHard   = M.loadEconParams(econParamsRaw, 'hard');

// ---------------------------------------------------------------------------
// 0. Wartosci parametru w econ-params.json (sanity, dowod ze JSON niesie decyzje
//    wlasciciela: easy x2,0 / normal x1,5 / hard x1,0).
// ---------------------------------------------------------------------------
console.log('\n-- 0. mennica_mnoznik_po_walucie w econ-params.json --');
eq(pEasy.mennicaMnoznikPoWalucie,   2,   'easy: mennicaMnoznikPoWalucie = 2,0');
eq(pNormal.mennicaMnoznikPoWalucie, 1.5, 'normal: mennicaMnoznikPoWalucie = 1,5');
eq(pHard.mennicaMnoznikPoWalucie,   1,   'hard: mennicaMnoznikPoWalucie = 1,0 (brak efektu, NIE zero)');

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
function makeCity(overrides) {
  return Object.assign({
    id: 'c1', ludnosc: 3, zdrowie: 0, czyStolica: true,
    maSpichlerz: false, maAkwedukt: false, magazynZywnosci: 0,
    specjalisci: [], kolejkaProdukcji: [],
    podziałHandlu: { procentNauka: 20, procentPieniadz: 70, procentLuksus: 10 },
    podziałPracy:  { procentBudynki: 70 },
  }, overrides);
}
function makeCtx(overrides) {
  return Object.assign({
    wojskoZuzycieZywnosci: 0, strataFraction: 0,
    maMlyn: false, maCegielnia: false, maTargowisko: false, maBiblioteka: false,
    maMennica: false, walutaOdkryta: false,
  }, overrides);
}
const RTILE = { terenBazowy: 'rownina', nakladka: 'brak', maRzeke: false };
const tiles20 = Array(20).fill(RTILE);
const city = makeCity();

// ---------------------------------------------------------------------------
// 1. Waluta odkryta, BRAK Mennicy -> mnoznik 1, Handel netto BEZ ZMIAN
//    (to jest sedno zmiany -- sam tech juz nie wystarcza).
// ---------------------------------------------------------------------------
console.log('\n-- 1. Waluta odkryta, brak Mennicy -> mnoznik 1 (BRAK zmiany) --');
const yldBase = M.cityYieldPerTurn(city, tiles20, [], pNormal, makeCtx());
const yldWalutaNoMennica = M.cityYieldPerTurn(city, tiles20, [], pNormal,
  makeCtx({ walutaOdkryta: true, maMennica: false }));
eq(yldWalutaNoMennica.pieniadz, yldBase.pieniadz,
  'Waluta bez Mennicy: Pieniadz identyczny jak bez Waluty (mnoznik=1)');
eq(yldWalutaNoMennica.nauka, yldBase.nauka,
  'Waluta bez Mennicy: Nauka identyczna jak bez Waluty (mnoznik=1)');
eq(yldWalutaNoMennica.luksus, yldBase.luksus,
  'Waluta bez Mennicy: Zamoznosc (Luksus) identyczna jak bez Waluty (mnoznik=1)');

// ---------------------------------------------------------------------------
// 2. Mennica zbudowana, BRAK odkrytej Waluty -> mnoznik 1 (bramka AND, druga strona).
// ---------------------------------------------------------------------------
console.log('\n-- 2. Mennica zbudowana, brak Waluty -> mnoznik 1 --');
const yldMennicaNoWaluta = M.cityYieldPerTurn(city, tiles20, [], pNormal,
  makeCtx({ walutaOdkryta: false, maMennica: true }));
eq(yldMennicaNoWaluta.pieniadz, yldBase.pieniadz,
  'Mennica bez Waluty: Pieniadz identyczny jak baseline (mnoznik=1)');
eq(yldMennicaNoWaluta.nauka, yldBase.nauka,
  'Mennica bez Waluty: Nauka identyczna jak baseline (mnoznik=1)');

// ---------------------------------------------------------------------------
// 3. Waluta + Mennica na NORMAL -> Handel netto x1,5; Pieniadz, Nauka I Zamoznosc
//    rosna RAZEM (wariant A -- mnoznik dziala PRZED podzialem suwakiem).
// ---------------------------------------------------------------------------
console.log('\n-- 3. Waluta + Mennica, normal -> x1,5 na Pieniadz+Nauka+Zamoznosc --');
const yldNormalBoth = M.cityYieldPerTurn(city, tiles20, [], pNormal,
  makeCtx({ walutaOdkryta: true, maMennica: true }));
// handelBrutto = 20 (20 pol Rownina, brak Targowiska); handelNetto = 20*1.5 = 30
// pieniadz = floor(30*0.70) = 21; nauka = floor(30*0.20) = 6; luksus = floor(30*0.10) = 3
eq(yldNormalBoth.pieniadz, 21, 'normal x1,5: Pieniadz = floor(30*0.70) = 21');
eq(yldNormalBoth.nauka,     6, 'normal x1,5: Nauka = floor(30*0.20) = 6');
eq(yldNormalBoth.luksus,    3, 'normal x1,5: Zamoznosc (Luksus) = floor(30*0.10) = 3');
assert(yldNormalBoth.pieniadz > yldBase.pieniadz, 'normal x1,5: Pieniadz > baseline');
assert(yldNormalBoth.nauka    > yldBase.nauka,    'normal x1,5: Nauka > baseline (wariant A)');
assert(yldNormalBoth.luksus   > yldBase.luksus,   'normal x1,5: Zamoznosc > baseline (wariant A)');

// ---------------------------------------------------------------------------
// 4. Waluta + Mennica na HARD -> BRAK efektu (x1,0) -- decyzja wlasciciela.
// ---------------------------------------------------------------------------
console.log('\n-- 4. Waluta + Mennica, hard -> BRAK efektu (x1,0) --');
const yldHardBase = M.cityYieldPerTurn(city, tiles20, [], pHard, makeCtx());
const yldHardBoth = M.cityYieldPerTurn(city, tiles20, [], pHard,
  makeCtx({ walutaOdkryta: true, maMennica: true }));
eq(yldHardBoth.pieniadz, yldHardBase.pieniadz, 'hard: Pieniadz z Waluta+Mennica = Pieniadz bez nich (brak efektu)');
eq(yldHardBoth.nauka,    yldHardBase.nauka,    'hard: Nauka niezmieniona (brak efektu)');
eq(yldHardBoth.luksus,   yldHardBase.luksus,   'hard: Zamoznosc niezmieniona (brak efektu)');

// ---------------------------------------------------------------------------
// 5. Waluta + Mennica na EASY -> x2,0.
// ---------------------------------------------------------------------------
console.log('\n-- 5. Waluta + Mennica, easy -> x2,0 --');
const yldEasyBoth = M.cityYieldPerTurn(city, tiles20, [], pEasy,
  makeCtx({ walutaOdkryta: true, maMennica: true }));
// handelNetto = 20*2 = 40; pieniadz=floor(40*0.70)=28; nauka=floor(40*0.20)=8; luksus=floor(40*0.10)=4
eq(yldEasyBoth.pieniadz, 28, 'easy x2,0: Pieniadz = floor(40*0.70) = 28');
eq(yldEasyBoth.nauka,     8, 'easy x2,0: Nauka = floor(40*0.20) = 8');
eq(yldEasyBoth.luksus,    4, 'easy x2,0: Zamoznosc (Luksus) = floor(40*0.10) = 4');

// ---------------------------------------------------------------------------
// 6. Tabela skutku (raport): dochod Pieniadz/Nauka/Zamoznosc z Handlu, dla trzech
//    poziomow trudnosci, z Mennica i bez -- wypisane na konsole do raportu.
// ---------------------------------------------------------------------------
console.log('\n-- 6. TABELA SKUTKU (dla raportu) --');
console.log('trudnosc | wariant          | Pieniadz | Nauka | Zamoznosc');
for (const [label, p] of [['easy', pEasy], ['normal', pNormal], ['hard', pHard]]) {
  const bez = M.cityYieldPerTurn(city, tiles20, [], p, makeCtx({ walutaOdkryta: true, maMennica: false }));
  const zM  = M.cityYieldPerTurn(city, tiles20, [], p, makeCtx({ walutaOdkryta: true, maMennica: true  }));
  console.log(`${label.padEnd(8)} | Waluta bez Mennicy | ${String(bez.pieniadz).padStart(8)} | ${String(bez.nauka).padStart(5)} | ${bez.luksus}`);
  console.log(`${label.padEnd(8)} | Waluta + Mennica   | ${String(zM.pieniadz).padStart(8)} | ${String(zM.nauka).padStart(5)} | ${zM.luksus}`);
}

// ---------------------------------------------------------------------------
// 7. PARYTET AI: identyczny wynik dla dwoch roznych ownerId, przez pelny silnik
//    advanceCityEconomy (nie tylko cityYieldPerTurn) -- dowod braku galezi po ownerId.
//    UWAGA: geografia (terrain wokol miasta) legalnie wplywa na dochod, wiec zeby
//    izolowac WYLACZNIE efekt ownerId, uzywamy TEGO SAMEGO miasta (identyczne q/r,
//    identyczne worked tiles) w DWOCH oddzielnych wywolaniach advanceCityEconomy --
//    raz oznaczonego ownerId=0 (gracz), raz ownerId=7 (AI). Roznica w wyniku moglaby
//    powstac WYLACZNIE gdyby kod mial galaz po ownerId -- nie ma.
// ---------------------------------------------------------------------------
console.log('\n-- 7. PARYTET AI: advanceCityEconomy, ownerId=0 (gracz) vs ownerId=7 (AI), to samo miasto --');
const gameData = { civs, econParams: econParamsRaw, societyParams, buildings, units, tech };
const map = M.generateMap(30, 30, 4242, 'kontynenty');
let baseCityForParity = null;
for (const h of Object.values(map.hexes)) {
  const c = { q: h.coords.q, r: h.coords.r };
  if (M.canFoundCity(c.q, c.r, [], map).ok) {
    const city = M.foundCityAt(c.q, c.r, 0, [], map, 'Test');
    if (city) { baseCityForParity = city; break; }
  }
}
if (!baseCityForParity) {
  console.error('FAIL: brak pola ladu do zalozenia miasta testowego parytetu AI');
  failed++;
} else {
  const builtByCity = new Map([[baseCityForParity.id, ['mennica']]]);
  const playerZbadane = new Set(['Waluta']);
  function tickFor(ownerId) {
    const city = { ...baseCityForParity, ownerId };
    const econ = M.advanceCityEconomy(
      [city], map, gameData, 'normal', [], new Map(), builtByCity, 1, playerZbadane, new Map(), new Map(),
    );
    return econ.perCity.find(t => t.cityId === city.id);
  }
  const tickPlayer = tickFor(0);
  const tickAI = tickFor(7);
  assert(!!tickPlayer && !!tickAI, 'parytet AI: oba przebiegi zwracaja wpis perCity');
  if (tickPlayer && tickAI) {
    eq(tickAI.pieniadzBrutto, tickPlayer.pieniadzBrutto,
      `parytet AI: pieniadzBrutto identyczny dla ownerId=0 i ownerId=7, to samo miasto (${tickPlayer.pieniadzBrutto})`);
    eq(tickAI.nauka, tickPlayer.nauka,
      `parytet AI: nauka identyczna dla ownerId=0 i ownerId=7 (${tickPlayer.nauka})`);
    eq(tickAI.luksus, tickPlayer.luksus,
      `parytet AI: luksus identyczny dla ownerId=0 i ownerId=7 (${tickPlayer.luksus})`);
    assert(tickPlayer.pieniadzBrutto > 0, `parytet AI: sanity -- pieniadzBrutto > 0 (Mennica+Waluta aktywne, got ${tickPlayer.pieniadzBrutto})`);
  }
}

// ---------------------------------------------------------------------------
// 8. Targowisko: efekt Praca->Pieniadz (targowiskoPracaMnoznik) dziala NIEZALEZNIE
//    od bramki Waluta+Mennica i sie NIE dubluje z nowym mnoznikiem scalonym.
// ---------------------------------------------------------------------------
console.log('\n-- 8. Targowisko: efekt Praca->Pieniadz niezalezny, bez podwojnego liczenia --');
const tiles6 = Array(6).fill(RTILE);
// (a) Targowisko + Waluta, BEZ Mennicy: Efekt2 (Praca->Pieniadz) MUSI dzialac
//     (nie wymaga Mennicy), Efekt1 scalony (Handel netto) MUSI byc nieaktywny.
const ctxTargNoMennica = makeCtx({ walutaOdkryta: true, maTargowisko: true, maMennica: false });
const yldTargNoMennica = M.cityYieldPerTurn(city, tiles6, [], pNormal, ctxTargNoMennica);
assert(yldTargNoMennica.pieniadzZPracy > 0,
  `Targowisko+Waluta bez Mennicy: pieniadzZPracy > 0 (Efekt2 niezalezny od Mennicy, got ${yldTargNoMennica.pieniadzZPracy})`);

// (b) Ten sam ctx ALE z Mennica: pieniadzZPracy (strumien Efekt2, z doPuli) MUSI
//     pozostac IDENTYCZNY -- gdyby scalony mnoznik "przeciekal" na Efekt2, dublowalby
//     sie z wlasnym mnoznikiem Targowiska (targowiskoPracaMnoznik), co jest zakazane.
const ctxTargZMennica = makeCtx({ walutaOdkryta: true, maTargowisko: true, maMennica: true });
const yldTargZMennica = M.cityYieldPerTurn(city, tiles6, [], pNormal, ctxTargZMennica);
eq(yldTargZMennica.pieniadzZPracy, yldTargNoMennica.pieniadzZPracy,
  'Targowisko: pieniadzZPracy IDENTYCZNY z i bez Mennicy -- brak podwojnego liczenia z Efektem 1 scalonym');
// Natomiast pieniadzZHandlu (strumien Efekt1) MUSI wzrosnac z Mennica -- dowod ze
// oba efekty dzialaja na ROZNYCH strumieniach jednoczesnie, bez interferencji.
assert(yldTargZMennica.pieniadz > yldTargNoMennica.pieniadz,
  'Targowisko+Mennica: pieniadz total wyzszy niz bez Mennicy (Efekt1 dziala na strumieniu Handlu, Efekt2 na strumieniu Pracy, oba naraz)');

// --- summary ---------------------------------------------------------------
console.log(`\nwaluta-mennica-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
