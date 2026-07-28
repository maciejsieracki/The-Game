'use strict';
/** MAPA T-TECH-9 — droga brukowana: upgrade + bonus ruchu. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.map-road-movement-entry.ts');
const BUNDLE = path.resolve(__dirname, '.map-road-movement-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  buildImprovementQualifier,
  collectRoadKeys,
} from '../src/map/improvement-build';
export {
  applyRoadMovementModifier,
  cobblestoneMoveBonus,
  hexHasRoad,
} from '../src/map/road-movement';
export { terrainMoveCost } from '../src/units/setup';
export { TerenBazowy, Ulepszenie } from '../src/types/hex';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } }

const TB = M.TerenBazowy;
const UL = M.Ulepszenie;

function mkHex(q, r, teren, ulepszenie = UL.Brak) {
  return {
    coords: { q, r },
    terenBazowy: teren,
    nakladka: 'brak',
    ulepszenie,
    wioska: { istnieje: false, ludnosc: 0 },
    wlasciciel: null,
    rzeka: { obecna: false, krawedzie: [] },
  };
}

ok(M.cobblestoneMoveBonus() === 2, 'bonus_ruch from JSON = 2');

const plain = mkHex(0, 0, TB.Laka);
const road = mkHex(1, 0, TB.Laka, UL.Droga);
const cobble = mkHex(2, 0, TB.Laka, UL.DrogaBrukowana);
const hill = mkHex(3, 0, TB.Wzgorza, UL.DrogaBrukowana);

ok(M.applyRoadMovementModifier(1, plain) === 1, 'plain laka cost 1');
ok(M.applyRoadMovementModifier(1, road) === 1 / 3, 'droga cost /3');
ok(M.applyRoadMovementModifier(1, cobble) === 1 / 3, 'bruk laka: max(1/3, 1-2)');
ok(M.applyRoadMovementModifier(2, hill) === 1 / 3, 'bruk wzgorza: max(1/3, 2-2)');
ok(M.terrainMoveCost(cobble) === 1 / 3, 'terrainMoveCost bruk on laka');
ok(M.terrainMoveCost(road) === 1 / 3, 'terrainMoveCost droga on laka');
ok(M.terrainMoveCost(plain) === 1, 'terrainMoveCost plain');

ok(M.hexHasRoad(road), 'hexHasRoad droga');
ok(M.hexHasRoad(cobble), 'hexHasRoad bruk');
ok(!M.hexHasRoad(plain), 'hexHasRoad plain false');

const cityNodes = [{ q: 0, r: 0, pop: 10, level: 1 }];
const hexes = {
  '0,0': mkHex(0, 0, TB.Rownina, UL.Droga),
  '1,0': mkHex(1, 0, TB.Rownina),
  '2,0': mkHex(2, 0, TB.Rownina, UL.Droga),
};
const map = { hexes, riverPaths: [], startPositions: [{ q: 0, r: 0 }] };

const roadKeys = M.collectRoadKeys(map);
ok(roadKeys.has('0,0') && roadKeys.has('2,0'), 'collectRoadKeys includes droga hexes');

const qual = M.buildImprovementQualifier({
  map,
  cityNodes,
  territoryNodes: [{ q: 0, r: 0, pop: 10, level: 1, ownerId: 0 }],
  roadKeys,
  researchedTechs: new Set(['Drogi brukowane']),
});

ok(qual('droga_brukowana', 0, 0), 'upgrade bruk on hex with droga');
ok(!qual('droga_brukowana', 1, 0), 'no bruk without existing droga');
ok(qual('droga_brukowana', 2, 0), 'bruk upgrade on hex with droga ulepszenie');

hexes['0,0'].ulepszenie = UL.DrogaBrukowana;
ok(!M.buildImprovementQualifier({
  map, cityNodes,
  territoryNodes: [{ q: 0, r: 0, pop: 10, level: 1, ownerId: 0 }],
  roadKeys,
})('droga_brukowana', 0, 0),
  'no double bruk upgrade');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`map-road-movement-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
