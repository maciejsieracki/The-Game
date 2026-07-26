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
export { buildingResourceGateMet } from '../src/game/building-resource-gate';
export { availableProduction } from '../src/game/production';
export { TerenBazowy, Nakladka } from '../src/types/hex';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
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
  ok(split.potential.length === 0 || !split.potential.includes('Glina'), 'Glina nie w potencjale gdy active');
  ok(M.buildingResourceGateMet({ id: 'garncarnia' }, split.active), 'garncarnia OK gdy Glina active');
  ok(!M.buildingResourceGateMet({ id: 'garncarnia' }, []), 'garncarnia zablokowana bez Glina');
}

// --- miedź + kopalnia_miedzi ---
{
  const hex = { coords: { q: 1, r: 0 }, terenBazowy: TB.Wzgorza, zloze: 'miedz', wlasciciel: '0' };
  const map = mapWith(hex);
  const noImp = M.getCityResourceAccessForCity(city, map, new Map(), 99);
  ok(noImp.potential.includes('Ruda miedzi'), 'miedz bez ulepszenia → potencjał');
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

// --- ZADANIE-2-WSTRZYMANE (Maciej 2026-07-25, tego samego wieczoru): polecenie zdjęcia
// bramki dostępu do surowca ze stolarni/warsztatu kamieniarskiego/kuźni/garncarni/cegielni
// zostało COFNIĘTE przez właściciela w trakcie tej samej sesji -- to zakłady przetwórcze:
// "bez kopalni rudy nie ma kuźni, bez glinianki nie ma cegielni". DEPOSIT_LINKED_BUILDING_LABELS
// w building-resource-gate.ts zostaje BEZ ZMIAN; testy niżej pilnują, żeby tych pięć budynków
// nadal wymagało aktywnego dostępu do etykiety surowca w imperium (regresja tej bramki).
{
  ok(!M.buildingResourceGateMet({ id: 'stolarnia' }, []), 'stolarnia zablokowana bez Drewna w imperium');
  ok(M.buildingResourceGateMet({ id: 'stolarnia' }, ['Drewno']), 'stolarnia OK gdy Drewno active');
  ok(!M.buildingResourceGateMet({ id: 'kamieniarski' }, []), 'warsztat kamieniarski zablokowany bez Kamienia w imperium');
  ok(M.buildingResourceGateMet({ id: 'kamieniarski' }, ['Kamień']), 'warsztat kamieniarski OK gdy Kamień active');
  ok(!M.buildingResourceGateMet({ id: 'kuznia' }, []), 'kuźnia (brązu) zablokowana bez Rudy w imperium');
  ok(M.buildingResourceGateMet({ id: 'kuznia' }, ['Ruda']), 'kuźnia (brązu) OK gdy Ruda active');
  ok(!M.buildingResourceGateMet({ id: 'garncarnia' }, []), 'garncarnia zablokowana bez Gliny w imperium (regresja)');
  ok(M.buildingResourceGateMet({ id: 'garncarnia' }, ['Glina']), 'garncarnia OK gdy Glina active (regresja)');
  ok(!M.buildingResourceGateMet({ id: 'cegielnia' }, []), 'cegielnia zablokowana bez Gliny w imperium');
  ok(M.buildingResourceGateMet({ id: 'cegielnia' }, ['Glina']), 'cegielnia OK gdy Glina active');
}

// --- SUROW-CIV-02 (Maciej 2026-07-26): magazyn państwa vs dostęp-only ---
{
  ok(
    M.buildingResourceGateMet({ id: 'stolarnia' }, [], undefined, { drewno: 5 }),
    'stolarnia OK gdy drewno w magazynie państwa (bez aktywnego źródła)',
  );
  ok(
    !M.buildingResourceGateMet({ id: 'spichlerz_ii' }, [], undefined, { sol: 99 }),
    'spichlerz II: zapas soli w magazynie NIE zastępuje bramki dostępu',
  );
  ok(
    M.buildingResourceGateMet({ id: 'spichlerz_ii' }, ['Sól'], undefined, {}),
    'spichlerz II OK gdy Sól aktywna w imperium (bez zapasu)',
  );
}

console.log('\ndeposit-building-gate: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
