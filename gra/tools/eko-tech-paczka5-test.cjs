'use strict';
/** eko-tech-paczka5-test.cjs — ABC-19 (2026-07-05) potencjał vs dostęp aktywny */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.eko-tech-p5-entry.ts');
const BUNDLE = path.resolve(__dirname, '.eko-tech-p5-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  getCityResourceAccessForCity, getResourceAccessForCity,
} from '../src/game/resource-access';
export { TerenBazowy, Nakladka } from '../src/types/hex';
export { PIEC_HUTNICZY_BUILDING_ID } from '../src/game/braz-access';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
const TB = M.TerenBazowy;
const NK = M.Nakladka;
const PIEC = M.PIEC_HUTNICZY_BUILDING_ID;

let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  PASS:', m); } else { fail++; console.error('  FAIL:', m); } }

const city = { id: 'c1', q: 0, r: 0, population: 10, kulturaSkumulowana: 0 };

function mapWith(...hexes) {
  const hexesObj = {};
  for (const h of hexes) hexesObj[`${h.coords.q},${h.coords.r}`] = h;
  return { hexes: hexesObj };
}

// złoże bez ulepszenia → potencjał, nie active
{
  const map = mapWith({
    coords: { q: 1, r: 0 }, terenBazowy: TB.Laka, nakladka: NK.ZlozeBydla, wlasciciel: '0',
  });
  const split = M.getCityResourceAccessForCity(city, map, new Map(), 99, { ownerId: '0' });
  ok(split.potential.includes('Bydło (krowa/wół)'), 'ABC-19 bydło = potencjał bez pastwiska');
  ok(!split.active.includes('Bydło (krowa/wół)'), 'ABC-19 bydło NIE active bez pastwiska');
  ok(M.getResourceAccessForCity(city, map, new Map(), 99).length === 0, 'getResourceAccessForCity = tylko active');
}

// tartak w zasięgu → active Drewno
{
  const map = mapWith(
    { coords: { q: 0, r: 0 }, terenBazowy: TB.Rownina, nakladka: NK.Brak, wlasciciel: '0' },
    { coords: { q: 1, r: 0 }, terenBazowy: TB.Las, nakladka: NK.Las, wlasciciel: '0' },
  );
  const placed = new Map([['1,0', 'tartak']]);
  const split = M.getCityResourceAccessForCity(city, map, placed, 99);
  ok(split.active.includes('Drewno'), 'tartak → active Drewno');
  ok(!split.potential.includes('Drewno'), 'Drewno nie w potencjale gdy active');
}

// pastwisko na złożu → active bydło, brak duplikatu w potencjale
{
  const map = mapWith({
    coords: { q: 1, r: 0 }, terenBazowy: TB.Laka, nakladka: NK.ZlozeBydla, wlasciciel: '0',
  });
  const placed = new Map([['1,0', 'bydlo']]);
  const split = M.getCityResourceAccessForCity(city, map, placed, 99, { ownerId: '0' });
  ok(split.active.includes('Bydło (krowa/wół)'), 'pastwisko → active bydło');
  ok(!split.potential.includes('Bydło (krowa/wół)'), 'bydło nie w potencjale gdy active');
}

// brąz: popalnia + piec → active Brąz; ruda miedzi = potencjał bez popalni
{
  const map = mapWith(
    { coords: { q: 1, r: 0 }, terenBazowy: TB.Wzgorze, zloze: 'miedz', wlasciciel: '0' },
  );
  const noPop = M.getCityResourceAccessForCity(city, map, new Map(), 99, { builtIds: [PIEC] });
  ok(noPop.potential.includes('Ruda miedzi'), 'miedz = potencjał bez popalni');
  ok(!noPop.active.includes('Brąz'), 'brak Brązu bez popalni mimo Pieca');

  const placed = new Map([['1,0', 'popalnia_brazu']]);
  const withBraz = M.getCityResourceAccessForCity(city, map, placed, 99, { builtIds: [PIEC] });
  ok(withBraz.active.includes('Brąz'), 'Popalnia + Piec → active Brąz');
  ok(withBraz.active.includes('Ruda'), 'popalnia → active Ruda');
}

console.log(`\neko-tech-paczka5: ${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
