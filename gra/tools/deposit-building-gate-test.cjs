'use strict';
/** deposit-building-gate-test.cjs — złoże+ulepszenie → dostęp aktywny (Maciej 2026-07-22) */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.deposit-gate-entry.ts');
const BUNDLE = path.resolve(__dirname, '.deposit-gate-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  getCityResourceAccessForCity, improvementUnlockActiveOnHex,
} from '../src/game/resource-access';
export {
  buildingResourceGateMet,
  buildingRuntimeGateMet,
  filterRuntimeActiveBuiltIds,
} from '../src/game/building-resource-gate';
export { buildableProduction, eraBuildingCatalog } from '../src/game/production';
export { TerenBazowy, Nakladka } from '../src/types/hex';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
const rawBuildings = JSON.parse(fs.readFileSync(path.join(GRA, 'data/buildings.json'), 'utf8'));
const DATA = { buildings: rawBuildings, units: [] };
const TB = M.TerenBazowy;
const NK = M.Nakladka;

let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  PASS:', m); } else { fail++; console.error('  FAIL:', m); } }

const city = { id: 'c1', q: 0, r: 0, population: 10, kulturaSkumulowana: 0 };

function mapWith(...hexes) {
  const hexesObj = {};
  for (const h of hexes) hexesObj[h.coords.q + ',' + h.coords.r] = h;
  return { hexes: hexesObj };
}

// --- glina + glinianka ---
{
  const map = mapWith(
    { coords: { q: 1, r: 0 }, terenBazowy: TB.Laka, nakladka: NK.Brak, wlasciciel: '0' },
  );
  const placed = new Map([['1,0', 'glinianka']]);
  const split = M.getCityResourceAccessForCity(city, map, placed, 99);
  ok(!split.active.includes('Glina'), 'glinianka bez złoża → brak active Glina');
  ok(!M.improvementUnlockActiveOnHex('glinianka', { nakladka: NK.Brak }), 'improvementUnlockActiveOnHex glina false');
}
{
  const hex = { coords: { q: 1, r: 0 }, terenBazowy: TB.Laka, nakladka: NK.ZlozeGliny, wlasciciel: '0' };
  const map = mapWith(hex);
  const placed = new Map([['1,0', 'glinianka']]);
  const split = M.getCityResourceAccessForCity(city, map, placed, 99);
  ok(split.active.includes('Glina'), 'glinianka na złożu gliny → active Glina');
  ok(!split.potential.includes('Glina'), 'Glina złoże → poza potencjałem panelu (magazynowe)');
  ok(!M.buildingResourceGateMet({ id: 'garncarnia' }, split.active),
    'buildingResourceGateMet: garncarnia z etykietą active bez stocku — bramka zamknięta (DOSTEP-SUROWCE-Q1)');
  ok(M.buildingResourceGateMet({ id: 'garncarnia' }, split.active, undefined, { glina: 1 }),
    'buildingResourceGateMet: garncarnia z Gliną w magazynie — OK');
  ok(!M.buildingResourceGateMet({ id: 'garncarnia' }, []), 'buildingResourceGateMet: garncarnia bez Gliny — bramka zamknięta');
}

// --- miedź + kopalnia_miedzi ---
{
  const hex = { coords: { q: 1, r: 0 }, terenBazowy: TB.Wzgorza, zloze: 'miedz', wlasciciel: '0' };
  const map = mapWith(hex);
  const noImp = M.getCityResourceAccessForCity(city, map, new Map(), 99);
  ok(!noImp.potential.includes('Ruda miedzi'), 'miedz bez ulepszenia → poza potencjałem panelu (tylko Koń/Sól/Złoto)');
  ok(!noImp.active.includes('Ruda'), 'miedz bez ulepszenia → brak active Ruda');
  const placed = new Map([['1,0', 'kopalnia_miedzi']]);
  const withImp = M.getCityResourceAccessForCity(city, map, placed, 99);
  ok(withImp.active.includes('Ruda'), 'kopalnia_miedzi na miedzi → active Ruda');
  ok(!M.improvementUnlockActiveOnHex('kopalnia_miedzi', { zloze: 'zelazo' }), 'kopalnia_miedzi false na zelazo');
}

// --- ruda/żelazo/węgiel + kopalnia ---
{
  const hexRuda = { coords: { q: 1, r: 0 }, terenBazowy: TB.Wzgorza, nakladka: NK.ZlozeRudy, wlasciciel: '0' };
  const mapR = mapWith(hexRuda);
  const placedR = new Map([['1,0', 'kopalnia']]);
  ok(M.getCityResourceAccessForCity(city, mapR, placedR, 99).active.includes('Ruda'), 'kopalnia na ZlozeRudy → Ruda');
}
{
  const hexZ = { coords: { q: 2, r: 0 }, terenBazowy: TB.Gory, zloze: 'zelazo', wlasciciel: '0' };
  const mapZ = mapWith(hexZ);
  const placedZ = new Map([['2,0', 'kopalnia']]);
  // kopalnia na złożu żelaza daje surowiec 'Ruda żelaza' (metal Żelazo powstaje dopiero
  // w hucie, nie w kopalni) -- przebudowa modelu brązu/żelaza.
  ok(M.getCityResourceAccessForCity(city, mapZ, placedZ, 99).active.includes('Ruda żelaza'), 'kopalnia na zelazo → Ruda żelaza');
  ok(!M.improvementUnlockActiveOnHex('kopalnia', { zloze: 'miedz' }), 'kopalnia false na miedz');
}
{
  const hexW = { coords: { q: 3, r: 0 }, terenBazowy: TB.Gory, zloze: 'wegiel', wlasciciel: '0' };
  const mapW = mapWith(hexW);
  const placedW = new Map([['3,0', 'kopalnia']]);
  ok(M.getCityResourceAccessForCity(city, mapW, placedW, 99).active.includes('Węgiel'), 'kopalnia na wegiel → Węgiel');
}

// --- sól + warzelnia_soli (złoże) ---
{
  const hex = { coords: { q: 1, r: 0 }, terenBazowy: TB.Rownina, zloze: 'sol', wlasciciel: '0' };
  const map = mapWith(hex);
  const placed = new Map([['1,0', 'warzelnia_soli']]);
  ok(M.getCityResourceAccessForCity(city, map, placed, 99).active.includes('Sól'), 'warzelnia na zloze sol → Sól');
}

// --- warzelnia_soli na wybrzeżu (bez złoża) ---
{
  const hex = { coords: { q: 1, r: 0 }, terenBazowy: TB.Wybrzeze, nakladka: NK.Brak, wlasciciel: '0' };
  const map = mapWith(hex);
  const placed = new Map([['1,0', 'warzelnia_soli']]);
  ok(M.getCityResourceAccessForCity(city, map, placed, 99).active.includes('Sól'), 'warzelnia na wybrzeżu → Sól bez złoża');
  ok(M.improvementUnlockActiveOnHex('warzelnia_soli', { terenBazowy: TB.Wybrzeze }), 'warzelnia coast active');
}

// --- koń + stadnina ---
{
  const hex = { coords: { q: 1, r: 0 }, terenBazowy: TB.Laka, nakladka: NK.ZlozeKonia, wlasciciel: '0' };
  const map = mapWith(hex);
  const noImp = M.getCityResourceAccessForCity(city, map, new Map(), 99);
  ok(noImp.potential.includes('Koń'), 'złoże konia → potencjał Koń');
  const placed = new Map([['1,0', 'stadnina']]);
  ok(M.getCityResourceAccessForCity(city, map, placed, 99).active.includes('Koń'), 'stadnina na złożu konia → Koń');
  ok(!M.improvementUnlockActiveOnHex('stadnina', { nakladka: NK.Brak }), 'stadnina false bez złoża');
}

// --- złoto: złoże w zasięgu panelu ---
{
  const hex = { coords: { q: 1, r: 0 }, terenBazowy: TB.Wzgorza, zloze: 'zloto', wlasciciel: '0' };
  const map = mapWith(hex);
  const noImp = M.getCityResourceAccessForCity(city, map, new Map(), 99);
  ok(noImp.potential.includes('Złoto'), 'złoże złota bez kopalni → potencjał panelu');
  ok(!noImp.active.includes('Złoto'), 'złoże złota bez kopalni → brak active Złoto');
  const placed = new Map([['1,0', 'kopalnia_zlota']]);
  const withImp = M.getCityResourceAccessForCity(city, map, placed, 99);
  ok(withImp.active.includes('Złoto'), 'kopalnia_zlota na złożu → active Złoto (imperium)');
  ok(!withImp.potential.includes('Złoto'), 'kopalnia_zlota → Złoto nie w potencjale');
}

// --- wyjątki: tartak, kamieniołom ---
{
  const hex = { coords: { q: 1, r: 0 }, terenBazowy: TB.Rownina, nakladka: NK.Brak, wlasciciel: '0' };
  const map = mapWith(hex);
  ok(M.getCityResourceAccessForCity(city, map, new Map([['1,0', 'tartak']]), 99).active.includes('Drewno'), 'tartak bez złoża → Drewno');
  ok(M.getCityResourceAccessForCity(city, map, new Map([['1,0', 'kamieniolom']]), 99).active.includes('Kamień'), 'kamieniołom bez złoża → Kamień');
}

// --- Model B: hodowla bez złoża ---
{
  const hex = { coords: { q: 1, r: 0 }, terenBazowy: TB.Laka, nakladka: NK.Brak, wlasciciel: '0' };
  const map = mapWith(hex);
  const placed = new Map([['1,0', 'bydlo']]);
  // Bydło/owce/lama NIE są surowcami (decyzja Maciej, wielokrotnie powtarzana --
  // resource-access.ts LIVESTOCK_NOT_RESOURCE) -- pastwiska nie emitują etykiety
  // do active, mimo wybudowanej hodowli.
  const split = M.getCityResourceAccessForCity(city, map, placed, 99);
  ok(!split.active.includes('Trzoda (krowa/świnia)'), 'bydlo NIE jest surowcem -> brak w active mimo hodowli');
  ok(M.improvementUnlockActiveOnHex('bydlo', { nakladka: NK.Brak }), 'bydlo active bez złoża');
}

// --- DOSTEP-SUROWCE-Q1 (2026-07-29): bramka budowy = wyłącznie magazyn państwa ---
{
  ok(!M.buildingResourceGateMet({ id: 'stolarnia' }, [], undefined, {}),
    'buildingResourceGateMet: stolarnia bez drewna w magazynie — bramka zamknięta');
  ok(M.buildingResourceGateMet({ id: 'stolarnia' }, [], undefined, { drewno: 10 }),
    'buildingResourceGateMet: stolarnia z drewnem w magazynie — OK (tylko stock)');
  ok(!M.buildingResourceGateMet({ id: 'stolarnia' }, ['Drewno'], undefined, {}),
    'buildingResourceGateMet: stolarnia z samym activeLabels bez stocku — bramka zamknięta');
  ok(M.buildingResourceGateMet({ id: 'garncarnia' }, [], undefined, { glina: 5 }),
    'buildingResourceGateMet: garncarnia z Gliną w magazynie — OK');
  ok(M.buildingResourceGateMet({ id: 'odlewnia_brazu' }, [], undefined, { ruda: 3 }),
    'buildingResourceGateMet: odlewnia brązu z Rudą w magazynie — OK (bez kopalni mapy)');

  const CITY = { id: 'c1', q: 0, r: 0, ownerId: 0, population: 10 };
  function prodCtx(overrides) {
    return Object.assign({ epoch: 1, builtBuildingIds: [], productionQueue: [], isCapital: true, ownerId: 0 }, overrides);
  }
  const stolarniaTech = ['Obróbka drewna'];
  ok(
    !M.buildableProduction(CITY, DATA, stolarniaTech, prodCtx()).some(it => it.id === 'stolarnia'),
    'stolarnia NIE w buildableProduction bez drewna w magazynie',
  );
  ok(
    M.buildableProduction(CITY, DATA, stolarniaTech, prodCtx({ empireResourceStock: { drewno: 10 } }))
      .some(it => it.id === 'stolarnia'),
    'stolarnia w buildableProduction z drewnem w magazynie (bez Tartaku)',
  );
  const catNoStock = M.eraBuildingCatalog(DATA, stolarniaTech, prodCtx()).find(e => e.id === 'stolarnia');
  ok(catNoStock && catNoStock.status === 'locked',
    'stolarnia eraBuildingCatalog locked bez drewna w magazynie');
  const catStock = M.eraBuildingCatalog(DATA, stolarniaTech, prodCtx({ empireResourceStock: { drewno: 10 } }));
  ok(catStock.find(e => e.id === 'stolarnia')?.status === 'ready',
    'stolarnia eraBuildingCatalog ready z drewnem w magazynie (bez Tartaku)');
}

// --- PYTANIE-84 + DOSTEP-SUROWCE-Q1: runtime gate = magazyn ---
{
  ok(
    M.buildingRuntimeGateMet({ id: 'stolarnia' }, [], [], { drewno: 3 }),
    'runtime: stolarnia działa z drewnem w magazynie',
  );
  ok(
    !M.buildingRuntimeGateMet({ id: 'stolarnia' }, ['Drewno'], [], {}),
    'runtime: stolarnia śpi bez zapasu drewna mimo activeLabels',
  );
  ok(
    M.buildingRuntimeGateMet({ id: 'spichlerz_ii' }, [], [], { sol: 99 }),
    'runtime: spichlerz II działa z Solą w magazynie państwa',
  );
  ok(
    !M.buildingRuntimeGateMet({ id: 'spichlerz_ii' }, [], [], {}),
    'runtime: spichlerz II śpi bez Soli w magazynie',
  );
  ok(
    !M.buildingRuntimeGateMet(
      { id: 'mennica' },
      [],
      [],
      {},
      { ownerId: 0, resolveOwnerZlotoAccess: () => false },
    ),
    'runtime: mennica śpi bez Złota w magazynie',
  );
  const active = M.filterRuntimeActiveBuiltIds(
    ['garncarnia', 'spichlerz'],
    [],
    {},
  );
  ok(!active.includes('garncarnia'), 'runtime filter: garncarnia śpi bez gliny i bez dostępu');
  ok(active.includes('spichlerz'), 'runtime filter: spichlerz I bez bramki Ceramiki (U-24) — zawsze aktywny');
  const active2 = M.filterRuntimeActiveBuiltIds(
    ['garncarnia', 'spichlerz'],
    [],
    { glina: 5 },
  );
  ok(active2.includes('garncarnia') && active2.includes('spichlerz'),
    'runtime filter: garncarnia+spichlerz przy zapasie Gliny w magazynie państwa');
}

console.log('\ndeposit-building-gate: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
