'use strict';
/** Rzeka na heksie — płaski koszt ruchu, ignoruje teren/las/góry. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.river-terrain-move-entry.ts');
const BUNDLE = path.resolve(__dirname, '.river-terrain-move-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  terrainMoveCost,
  embarkMoveCost,
  computeReachable,
  computePath,
  pathCost,
  keyOf,
} from '../src/units/setup';
export { TerenBazowy, Nakladka, Ulepszenie } from '../src/types/hex';
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
const NK = M.Nakladka;
const UL = M.Ulepszenie;

function mkHex(q, r, teren, opts = {}) {
  const {
    nakladka = NK.Brak,
    ulepszenie = UL.Brak,
    river = false,
  } = opts;
  return {
    coords: { q, r },
    terenBazowy: teren,
    nakladka,
    ulepszenie,
    wioska: { istnieje: false, ludnosc: 0 },
    wlasciciel: null,
    rzeka: { obecna: river, krawedzie: river ? ['N', 'S'] : [] },
  };
}

// --- terrainMoveCost: rzeka niweluje kary terenu ---

const hillNoRiver = mkHex(0, 0, TB.Wzgorza);
const hillRiver = mkHex(0, 0, TB.Wzgorza, { river: true });
ok(M.terrainMoveCost(hillNoRiver) === 2, 'wzgorza bez rzeki = 2');
ok(M.terrainMoveCost(hillRiver) === 1, 'wzgorza + rzeka = 1');

const forestHill = mkHex(1, 0, TB.Wzgorza, { nakladka: NK.Las });
const forestHillRiver = mkHex(1, 0, TB.Wzgorza, { nakladka: NK.Las, river: true });
ok(M.terrainMoveCost(forestHill) === 3, 'wzgorza + las bez rzeki = 3');
ok(M.terrainMoveCost(forestHillRiver) === 1, 'wzgorza + las + rzeka = 1');

const mountain = mkHex(2, 0, TB.Gory);
const mountainRiver = mkHex(2, 0, TB.Gory, { river: true });
ok(M.terrainMoveCost(mountain) === Infinity, 'gory bez rzeki = Infinity');
ok(M.terrainMoveCost(mountainRiver) === 1, 'gory + rzeka = 1 (skonczony)');

const plainRiver = mkHex(3, 0, TB.Laka, { river: true });
ok(M.terrainMoveCost(plainRiver) === 1, 'laka + rzeka = 1');

// Droga na rzece — bonus drogi nadal dziala
const riverRoad = mkHex(4, 0, TB.Wzgorza, { river: true, ulepszenie: UL.Droga });
ok(M.terrainMoveCost(riverRoad) === 1 / 3, 'rzeka + droga na wzgorzu = 1/3');

// Woda z rzeka nadal nieprzejezdna (ląd)
const seaRiver = mkHex(5, 0, TB.Morze, { river: true });
ok(M.terrainMoveCost(seaRiver) === Infinity, 'morze + rzeka = Infinity');

// --- embarkMoveCost deleguje terrainMoveCost na lądzie ---
ok(M.embarkMoveCost(hillRiver) === 1, 'embarkMoveCost ląd z rzeką = 1');
ok(M.embarkMoveCost(mkHex(6, 0, TB.Morze)) === 1, 'embarkMoveCost morze = 1');

// --- computeReachable / pathCost: góry z rzeką osiągalne ---
const map = {
  hexes: {
    '0,0': mkHex(0, 0, TB.Laka),
    '1,0': mkHex(1, 0, TB.Gory, { river: true }),
    '2,0': mkHex(2, 0, TB.Gory, { river: true }),
    '3,0': mkHex(3, 0, TB.Laka),
  },
  riverPaths: [],
  startPositions: [{ q: 0, r: 0 }],
};

const unit = {
  id: 'u1', ownerId: 0, typeId: 'Wojownik', category: 'domyslny',
  q: 0, r: 0, ruch: 4, ruchLeft: 4,
};

const reachable = M.computeReachable(unit, map, new Set());
ok(reachable.has('1,0'), 'computeReachable: góry+rzeka osiągalne');
ok(reachable.has('2,0'), 'computeReachable: drugi heks rzeki w zasięgu (4 MP)');

const riverPath = M.computePath(unit, map, 2, 0, new Set());
ok(riverPath.length === 2 && riverPath[1].q === 2 && riverPath[1].r === 0,
  'computePath przez korytarz rzeki na górach');
ok(M.pathCost(riverPath, map) === 2, 'pathCost korytarz rzeki = 2 (2× koszt 1)');

// Brak bonusu startowego na rzece — budżet = ruchLeft (nie +4)
const riverStartUnit = { ...unit, q: 1, r: 0, ruchLeft: 2 };
const riverStartReach = M.computeReachable(riverStartUnit, map, new Set());
ok(riverStartReach.has('2,0'), 'start na rzece 2 MP: jeden skok po rzece (koszt 1)');
ok(riverStartReach.has('3,0'),
  'start na rzece 2 MP: dwa skoki po rzece (koszt 2)');

try { fs.unlinkSync(ENTRY); } catch (_) {}
try { fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(fail ? `\nRIVER-TERRAIN-MOVE FAIL ${pass}/${pass + fail}` : `\nRIVER-TERRAIN-MOVE OK (${pass})`);
process.exit(fail ? 1 : 0);
