'use strict';
/**
 * magazyn-era-scaling-test.cjs -- standalone Node test for
 * P-MAGAZYN-SKALOWANIE-EPOKA-Q1 (Maciej 2026-08-12):
 *
 *   (1) "zwiększ jeszcze wielkość magazynu do 10 tysięcy sztuk dla każdego
 *   surowca z obecnego 1000 oraz dla magazynów, które wybudujemy w mieście
 *   zwiększ przepustowość z 100 i 150 na 1000 i 1500."
 *   (2) "I co? A każdą epokę wielkość magazynu powinna się podwajać. To co
 *   powiedziałem to powinno być dla epoki kamienia."
 *
 * Interpretacja (potwierdzona grepem, patrz raport Operatora / rejestr
 * dyspozycje/PYTANIA-OTWARTE.md): "100 i 150" = SPICHLERZ_EMPIRE_CAP_I/II
 * (building-resource-gate.ts) -- JEDYNA para wartości 100/150 w całym
 * mechanizmie magazynów (komentarz "Spichlerze lokalne +100/+150, Magazyn
 * +100" przy magazyn_centralny_baza_zywnosc w econ-params.json) -- NIE
 * magazyn_bonus_surowce_na_budynek (ma tylko JEDNĄ wartość, 100). Wszystkie
 * cztery pola dostają IDENTYCZNY mechanizm podwajania co epokę WŁAŚCICIELA:
 *   magazyn_baza_surowce:          1000 -> 10000 (era1), era2=20000, era3=40000
 *   magazyn_bonus_surowce_na_budynek: 100 (era1, niezmieniony), era2=200, era3=400
 *   SPICHLERZ_EMPIRE_CAP_I:          100 -> 1000 (era1), era2=2000, era3=4000
 *   SPICHLERZ_EMPIRE_CAP_II_FULL:    150 -> 1500 (era1), era2=3000, era3=6000
 *
 * Pokrywa:
 *   A. magazynEraMultiplier (funkcja czysta, economy-upkeep.ts) -- ×1/×2/×4,
 *      brzegi (era<1, era=0, era=NaN, era ujemna, era niecalkowita).
 *   B. ownerResourceCapacityPerType z era -- baza+bonus×magazyn skalowane
 *      RAZEM (compound na wynik), rownowazne skalowaniu obu skladnikow
 *      osobno (sekcja C nizej dowodzi rownowaznosci).
 *   C. ownerStorageParamsForEra -- rozbicie UI (capBase/capBonusPerMagazyn)
 *      sumuje sie DOKLADNIE do ownerResourceCapacityPerType (brak rozjazdu
 *      HUD-SKARBIEC).
 *   D. Wartosci bazowe w REALNYM econ-params.json (era1, wszystkie
 *      trudnosci) -- ten sam plik, ktory czyta silnik.
 *   E. SPICHLERZ_EMPIRE_CAP_I/II -- wartosci bazowe (era1) 1000/1500.
 *   F. computeCentralFoodCap (przez advanceEmpireFood + resolveOwnerEra) --
 *      wklad Spichlerza I/II do centralnego capu zywnosci skaluje sie co
 *      epoke WLASCICIELA; centralCapBaza/centralCapBonusMagazyn (osobny
 *      mechanizm, NIE w zakresie tego zadania) zostaja PLASKIE.
 *   G. Regresja: dowod WLASNY, ze scaling realnie zmienia cap wzgledem bazy
 *      (asercja ktora PADLABY na kodzie sprzed tej zmiany, era ignorowana).
 *   H. Integracja PELNA (esbuild-bundle-real-source, advanceCityEconomy +
 *      reconcileOwnerResourceCaps): PARYTET AI -- gracz (ownerId=0, era1) i
 *      AI (ownerId=7, era3) w JEDNYM wywolaniu, magazyn panstwa realnie
 *      wiekszy dla wlasciciela w epoce3 (ten sam resolver, zero galezi po
 *      ownerId).
 *
 * Save/load: mechanizm NIE dodaje zadnego nowego trwalego pola stanu --
 * cap jest przeliczany co ture z (a) econ-params.json/stalych [PT] i (b)
 * epoki wlasciciela, ktora JUZ jest zapisywana/wczytywana w main.ts
 * (`ownerEraByOwner` w buildSaveGameSnapshot/restoreGameFromSave, sprzed tej
 * zmiany) -- brak nowej luki save/load do pokrycia tutaj (ten sam wzorzec
 * co converter-era-scaling-test.cjs dla P-KONWERTERY-PRZEPUSTOWOSC-Q1).
 *
 * Run from gra/:  node tools/magazyn-era-scaling-test.cjs
 */

const fs   = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[magazyn-era-scaling-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE  = path.resolve(__dirname, '.magazyn-era-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.magazyn-era-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  DEFAULT_OWNER_STORAGE_PARAMS, loadOwnerStorageParams, magazynEraMultiplier,
  ownerResourceCapacityPerType, ownerStorageParamsForEra, reconcileOwnerResourceCaps,
} from '../src/game/economy-upkeep';
export { SPICHLERZ_EMPIRE_CAP_I, SPICHLERZ_EMPIRE_CAP_II_FULL } from '../src/game/building-resource-gate';
export { advanceEmpireFood, freshEmpireFoodState, buildEmpireFoodParams, getEmpireFoodMaxCap } from '../src/game/empire-food';
export { advanceCityEconomy, ownerResourceCap } from '../src/game/turn-economy';
export { foundCityAt, canFoundCity } from '../src/game/cities';
export { generateMap } from '../src/map/generator';
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
  console.error('[magazyn-era-scaling-test] esbuild bundling failed:\n', e.message || e);
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
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('  FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ===========================================================================
// A. magazynEraMultiplier: x1/x2/x4, brzegi
// ===========================================================================
console.log('\n-- A. magazynEraMultiplier: podwajanie co epoke, brzegi --');
eq(M.magazynEraMultiplier(1), 1, 'era1: mnoznik x1');
eq(M.magazynEraMultiplier(2), 2, 'era2: mnoznik x2');
eq(M.magazynEraMultiplier(3), 4, 'era3: mnoznik x4');
eq(M.magazynEraMultiplier(4), 8, 'era4: mnoznik x8 (compound, nie addytywny)');
eq(M.magazynEraMultiplier(0), 1, 'era0 (ponizej 1) -> traktowana jak era1 (mnoznik x1)');
eq(M.magazynEraMultiplier(-5), 1, 'era ujemna -> traktowana jak era1 (mnoznik x1)');
eq(M.magazynEraMultiplier(NaN), 1, 'era NaN -> traktowana jak era1 (mnoznik x1)');
eq(M.magazynEraMultiplier(Infinity), 1, 'era Infinity (nieskonczona) -> traktowana jak era1 (mnoznik x1)');
eq(M.magazynEraMultiplier(undefined), 1, 'era undefined -> traktowana jak era1 (mnoznik x1)');
// era niecalkowita: formula 2^(era-1) NIE floorowana (gladka interpolacja, spojna z 2^n dla calkowitych)
assert(Math.abs(M.magazynEraMultiplier(1.5) - Math.SQRT2) < 1e-9, 'era1.5: mnoznik = 2^0.5 (~1.414, gladka interpolacja)');

// ===========================================================================
// B. ownerResourceCapacityPerType z era: baza+bonus skalowane RAZEM
// ===========================================================================
console.log('\n-- B. ownerResourceCapacityPerType(magazynCount, params, era) --');
const SP = { bazaSurowcePanstwo: 10000, bonusSurowceNaBudynek: 100 };
eq(M.ownerResourceCapacityPerType(0, SP), 10000, 'domyslne era=1 (brak 3. argumentu): 0 Magazynow -> cap 10000');
eq(M.ownerResourceCapacityPerType(0, SP, 1), 10000, 'era1, 0 Magazynow -> cap 10000');
eq(M.ownerResourceCapacityPerType(2, SP, 1), 10200, 'era1, 2 Magazyny -> cap 10000+200=10200');
eq(M.ownerResourceCapacityPerType(0, SP, 2), 20000, 'era2, 0 Magazynow -> cap 20000 (x2)');
eq(M.ownerResourceCapacityPerType(2, SP, 2), 20400, 'era2, 2 Magazyny -> cap (10000+200)x2=20400');
eq(M.ownerResourceCapacityPerType(0, SP, 3), 40000, 'era3, 0 Magazynow -> cap 40000 (x4)');
eq(M.ownerResourceCapacityPerType(2, SP, 3), 40800, 'era3, 2 Magazyny -> cap (10000+200)x4=40800');
eq(M.ownerResourceCapacityPerType(-1, SP, 2), 20000, 'magazynCount ujemny -> traktowany jako 0, era2 nadal x2');

// ===========================================================================
// C. ownerStorageParamsForEra: rozbicie UI sumuje sie DOKLADNIE do capu
// ===========================================================================
console.log('\n-- C. ownerStorageParamsForEra: capBase + capBonusPerMagazyn x N == cap (brak rozjazdu HUD) --');
for (const era of [1, 2, 3, 5]) {
  for (const n of [0, 1, 4]) {
    const scaled = M.ownerStorageParamsForEra(SP, era);
    const sum = scaled.bazaSurowcePanstwo + scaled.bonusSurowceNaBudynek * n;
    const cap = M.ownerResourceCapacityPerType(n, SP, era);
    eq(sum, cap, `era${era}, ${n} Magazynow: capBase+capBonusPerMagazyn×N (${sum}) == ownerResourceCapacityPerType (${cap})`);
  }
}
eq(M.ownerStorageParamsForEra(SP, 2).bazaSurowcePanstwo, 20000, 'era2: capBase = 20000');
eq(M.ownerStorageParamsForEra(SP, 2).bonusSurowceNaBudynek, 200, 'era2: capBonusPerMagazyn = 200');
eq(M.ownerStorageParamsForEra(SP, 3).bazaSurowcePanstwo, 40000, 'era3: capBase = 40000');
eq(M.ownerStorageParamsForEra(SP, 3).bonusSurowceNaBudynek, 400, 'era3: capBonusPerMagazyn = 400');

// ===========================================================================
// D. econ-params.json REALNE wartosci (era1, wszystkie trudnosci)
// ===========================================================================
console.log('\n-- D. econ-params.json: magazyn_baza_surowce=50000, magazyn_bonus_surowce_na_budynek=500 (era1, R-EKONOMIA-SUROWCE-SKALA-5X-Q1) --');
eq(M.DEFAULT_OWNER_STORAGE_PARAMS.bazaSurowcePanstwo, 50000, 'default fallback: baza panstwa = 50000 (R-EKONOMIA-SUROWCE-SKALA-5X-Q1, Maciej 2026-08-13, x5 vs 10000, era1)');
eq(M.DEFAULT_OWNER_STORAGE_PARAMS.bonusSurowceNaBudynek, 500, 'default fallback: bonus/Magazyn = 500 (R-EKONOMIA-SUROWCE-SKALA-5X-Q1: tym razem TO pole objete poleceniem "wszystkie skladowe formuly cap x5", w odroznieniu od wczesniejszego P-MAGAZYN-SKALOWANIE-EPOKA-Q1 ktory go nie ruszal)');
for (const d of ['easy', 'normal', 'hard']) {
  const p = M.loadOwnerStorageParams(econParamsRaw, d);
  eq(p.bazaSurowcePanstwo, 50000, `econ-params.json ${d}: magazyn_baza_surowce = 50000 (era1, R-EKONOMIA-SUROWCE-SKALA-5X-Q1)`);
  eq(p.bonusSurowceNaBudynek, 500, `econ-params.json ${d}: magazyn_bonus_surowce_na_budynek = 500 (era1, R-EKONOMIA-SUROWCE-SKALA-5X-Q1)`);
}

// ===========================================================================
// E. SPICHLERZ_EMPIRE_CAP_I/II -- wartosci bazowe (era1) 1000/1500
// ===========================================================================
console.log('\n-- E. SPICHLERZ_EMPIRE_CAP_I/II: 1000/1500 (era1, cytat "z 100 i 150 na 1000 i 1500") --');
eq(M.SPICHLERZ_EMPIRE_CAP_I, 1000, 'SPICHLERZ_EMPIRE_CAP_I (Spichlerz I, era1) = 1000 (bylo 100)');
eq(M.SPICHLERZ_EMPIRE_CAP_II_FULL, 1500, 'SPICHLERZ_EMPIRE_CAP_II_FULL (Spichlerz II, era1) = 1500 (bylo 150)');

// ===========================================================================
// F. computeCentralFoodCap (przez advanceEmpireFood): Spichlerz skaluje sie
//    co epoke WLASCICIELA; centralCapBaza/Bonus (osobny mechanizm) plaskie.
// ===========================================================================
console.log('\n-- F. advanceEmpireFood + resolveOwnerEra: wklad Spichlerza I/II do capu zywnosci skaluje sie co epoke --');
{
  const upkeep = { jednostkaUtrzymanieStd: 1, zywnoscJednostkaRuch: 1, zywnoscJednostkaOboz: 0.5 };
  const efParams = M.buildEmpireFoodParams({
    ekonomia_miasta: {
      magazyn_centralny_baza_zywnosc: { normal: 500 },
      magazyn_centralny_bonus_zywnosc_na_budynek: { normal: 100 },
      glod_wojska_hp_frac: { normal: 0.08 },
    },
  });

  function runTick(era, resolver) {
    const states = new Map([[0, { zapasyPanstwa: 100000, turyUjemnychZapasow: 0 }]]);
    const econ = { perCity: [{ cityId: 'c1', ownerId: 0, oblegany: false, maSpichlerz: true, zywnoscBrutto: 0, kosztRacji: 0, bilansLokalny: 0, zywnoscNetto: 0 }] };
    M.advanceEmpireFood(econ, [], states, upkeep, efParams, {}, undefined, resolver);
    return M.getEmpireFoodMaxCap(0);
  }

  const capEra1 = runTick(1, () => 1);
  const capEra2 = runTick(2, () => 2);
  const capEra3 = runTick(3, () => 3);
  const capNoResolver = runTick(1, undefined);

  eq(capEra1, 500 + 1000, 'era1: cap = centralCapBaza(500, plaski) + SPICHLERZ_EMPIRE_CAP_I(1000) = 1500');
  eq(capEra2, 500 + 2000, 'era2: cap = 500 + SPICHLERZ_EMPIRE_CAP_I x2(2000) = 2500 -- centralCapBaza NIE skaluje sie (poza zakresem)');
  eq(capEra3, 500 + 4000, 'era3: cap = 500 + SPICHLERZ_EMPIRE_CAP_I x4(4000) = 4500');
  eq(capNoResolver, capEra1, 'brak resolveOwnerEra (undefined) -> era domyslnie 1, identyczne jak jawne era=1 (kompatybilnosc wsteczna)');

  // Spichlerz II (wyzszy tier) -- ten sam mechanizm, inna baza (1500 zamiast 1000)
  const states2 = new Map([[0, { zapasyPanstwa: 100000, turyUjemnychZapasow: 0 }]]);
  const econ2 = { perCity: [{ cityId: 'c1', ownerId: 0, oblegany: false, maSpichlerz: true, maSpichlerzII: true, zywnoscBrutto: 0, kosztRacji: 0, bilansLokalny: 0, zywnoscNetto: 0 }] };
  M.advanceEmpireFood(econ2, [], states2, upkeep, efParams, {}, undefined, () => 3);
  eq(M.getEmpireFoodMaxCap(0), 500 + 6000, 'Spichlerz II, era3: cap = 500 + SPICHLERZ_EMPIRE_CAP_II_FULL x4(6000) = 6500');
}

// ===========================================================================
// G. Regresja: dowod WLASNY, ze era realnie zmienia wynik (nie no-op)
// ===========================================================================
console.log('\n-- G. Regresja: cap RESPEKTUJE era (asercja ktora PADLABY na kodzie sprzed tej zmiany) --');
{
  const capFlat = M.ownerResourceCapacityPerType(1, SP, 1);
  const capEra3 = M.ownerResourceCapacityPerType(1, SP, 3);
  assert(capEra3 === capFlat * 4, 'era3 daje DOKLADNIE x4 wzgledem era1 (10100 -> 40400) -- kod sprzed zmiany ignorowalby era i dalby capFlat==capEra3');
  assert(capEra3 !== capFlat, 'sanity: era3 != era1 (mechanizm faktycznie cos zmienia, nie jest to no-op)');
}

// ===========================================================================
// H. Integracja PELNA (advanceCityEconomy + reconcileOwnerResourceCaps):
//    PARYTET AI -- gracz era1 vs AI era3, JEDNO wywolanie.
// ===========================================================================
console.log('\n-- H. advanceCityEconomy: PARYTET AI (gracz era1, AI era3) -- magazyn panstwa realnie wiekszy w epoce3 --');
{
  const map = M.generateMap(40, 40, 5521, 'kontynenty');
  const data = { civs, econParams: econParamsRaw, societyParams, buildings, units, tech };

  function landHexes(n, minDist) {
    const all = [];
    for (const h of Object.values(map.hexes)) {
      const c = { q: h.coords.q, r: h.coords.r };
      if (M.canFoundCity(c.q, c.r, [], map).ok) all.push(c);
    }
    const picked = [];
    for (const c of all) {
      if (picked.every(p => (Math.abs(c.q - p.q) + Math.abs(c.q + c.r - p.q - p.r) + Math.abs(c.r - p.r)) / 2 >= minDist)) {
        picked.push(c);
        if (picked.length >= n) break;
      }
    }
    return picked;
  }

  const spots = landHexes(2, 6);
  if (spots.length < 2) {
    console.error('FAIL: brak wystarczajaco ladu do zalozenia 2 miast testowych (sekcja H pominieta)');
    failed++;
  } else {
    const cities = [];
    const cPlayer = M.foundCityAt(spots[0].q, spots[0].r, 0, cities, map, 'PlayerCity'); cities.push(cPlayer);
    const cAi     = M.foundCityAt(spots[1].q, spots[1].r, 7, cities, map, 'AiCity');     cities.push(cAi);

    // Zapas WPROST ponad cap era1 (50000, R-EKONOMIA-SUROWCE-SKALA-5X-Q1) ale POD cap
    // era3 (200000) -- jesli era dziala poprawnie: gracz (era1) traci nadwyzke, AI
    // (era3) zachowuje wszystko. 125000 zachowuje te sama proporcje do capu era1
    // (2,5x) i marginesu do capu era3 (0,625x) co poprzedni pin 25000 vs 10000/40000.
    cPlayer.surowce = { drewno: 125000 };
    cAi.surowce     = { drewno: 125000 };
    const builtByCity = new Map([[cPlayer.id, []], [cAi.id, []]]);

    // PARYTET AI: JEDEN resolver, zero galezi w kodzie produkcyjnym -- owner 0 -> era 1,
    // owner 7 (AI) -> era 3. Resolver zyje TYLKO w tescie (jak main.ts empireEpochForOwner).
    const resolveOwnerEra = (ownerId) => (ownerId === 0 ? 1 : 3);

    const econ = M.advanceCityEconomy(
      cities, map, data, 'normal', [], new Map(), builtByCity,
      1, new Set(), new Map(), new Map(),
      resolveOwnerEra,
    );
    assert(!!econ, 'advanceCityEconomy nie rzuca wyjatku (2 ownerow, era1 vs era3, magazyn surowcow)');

    const playerCap = M.ownerResourceCap(cities, builtByCity, 0, data, 'normal', 1);
    const aiCap     = M.ownerResourceCap(cities, builtByCity, 7, data, 'normal', 3);
    eq(playerCap, 50000, 'gracz (era1): cap panstwa = 50000 (0 Magazynow, R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 10000)');
    eq(aiCap, 200000, 'AI (ownerId=7, era3): cap panstwa = 200000 (x4 wzgledem era1) -- MECHANIZM DZIALA DLA AI (R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo 40000)');

    eq(cPlayer.surowce.drewno, 50000, 'gracz (era1): 125000 drewna obciete do cap era1 (50000) -- reconcile realnie dziala (R-EKONOMIA-SUROWCE-SKALA-5X-Q1, bylo cap 10000)');
    // >= 125000 (nie == 125000): terytorium miasta moze dolozyc kilka sztuk drewna
    // z plonow terenu tej tury (szum niezalezny od P-MAGAZYN-SKALOWANIE-EPOKA-Q1) --
    // sedno asercji to BRAK obciecia (< cap era3=200000, w odroznieniu od gracza wyzej).
    assert(cAi.surowce.drewno >= 125000, `AI (era3): drewno (${cAi.surowce.drewno}) NIE obciete ponizej wejsciowych 125000 (magazyn realnie wiekszy w epoce3)`);
    assert(cAi.surowce.drewno < 200000, `AI (era3): drewno (${cAi.surowce.drewno}) ponizej cap era3 (200000) -- reconcile NIE obcina (zero galezi po ownerId)`);
  }
}

// --- summary ---------------------------------------------------------------
console.log(`\nmagazyn-era-scaling-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed ? 1 : 0);
