'use strict';
/**
 * Rydwan AI regression gate.
 * Run from gra/: node tools/rydwan-bierny-atak-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.rydwan-bierny-atak-entry.ts');
const BUNDLE = path.resolve(__dirname, '.rydwan-bierny-atak-bundle.cjs');

fs.writeFileSync(ENTRY, `export { decideAITurn } from ${JSON.stringify(GRA_ROOT + '/src/game/ai')};\n`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  loader: { '.ts': 'ts', '.json': 'json' },
  absWorkingDir: GRA_ROOT,
  logLevel: 'silent',
});
const { decideAITurn } = require(BUNDLE);

let passed = 0;
let failed = 0;
function ok(condition, message) {
  if (condition) {
    passed++;
    console.log('[OK] ' + message);
  } else {
    failed++;
    console.error('[FAIL] ' + message);
  }
}
function distance(a, b) {
  const dq = Math.abs(a.q - b.q);
  const dr = Math.abs(a.r - b.r);
  const ds = Math.abs((-a.q - a.r) - (-b.q - b.r));
  return Math.max(dq, dr, ds);
}
function makeMap(width = 16, height = 16) {
  const hexes = {};
  for (let q = 0; q < width; q++) for (let r = 0; r < height; r++) {
    hexes[`${q},${r}`] = {
      coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak',
      ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  return { szerokoscQ: width, wysokoscR: height, hexes, seed: 1, riverPaths: [] };
}
function makeData() {
  return {
    units: [
      { Jednostka: 'Rydwan (woły)', Ruch: 4, Health: 30, Typ: 'Mount', 'Rola (linia)': 'Flanka' },
      { Jednostka: 'Wojownik', Ruch: 2, Health: 30, Typ: 'Swordsman', 'Rola (linia)': 'Wręcz' },
    ],
    buildings: [], aiParams: {}, terrainYields: { terrain_types: [] },
  };
}
function opts(map) {
  return {
    canEngageOwner: () => true,
    civType: 'grecy',
    currentTurn: 40,
    civEra: 2,
    cityBuildings: { home: [] },
    visibleHexes: new Set(Object.keys(map.hexes)),
  };
}
function chariot(id, q, r) {
  return { id, ownerId: 1, typeId: 'Rydwan (woły)', category: 'rydwan', q, r, ruch: 4, ruchLeft: 4 };
}
function warrior(id, ownerId, q, r) {
  return { id, ownerId, typeId: 'Wojownik', category: 'miecznik', q, r, ruch: 2, ruchLeft: 2 };
}
function ownCity(population = 1) {
  return { id: 'home', ownerId: 1, q: 0, r: 0, population, name: 'home' };
}
function commandsFor(units, cities) {
  const map = makeMap();
  return decideAITurn(1, units, cities, map, makeData(), opts(map));
}

console.log('A. Adjacent enemy beats army concentration for a chariot anchor');
{
  const units = [
    chariot('c', 8, 8),
    warrior('w1', 1, 8, 9),
    warrior('w2', 1, 9, 8),
    warrior('enemy', 0, 7, 8),
  ];
  const commands = commandsFor(units, [ownCity(4)]);
  const attack = commands.find(c => c.type === 'attack' && c.unitId === 'c');
  ok(attack && attack.targetUnitId === 'enemy',
    'rydwan atakuje wroga zamiast zostać odroczony przez plan koncentracji');
}

console.log('B. Reachable enemy unit without an enemy city gets a closing move');
{
  const units = [chariot('c', 2, 2), warrior('enemy', 0, 6, 2)];
  const commands = commandsFor(units, [ownCity(1)]);
  const move = commands.find(c => c.type === 'move' && c.unitId === 'c');
  ok(move !== undefined, 'rydwan wykonuje ruch w stronę osiągalnego wroga');
  if (move !== undefined) {
    const before = { q: 2, r: 2 };
    const after = { q: move.toQ, r: move.toR };
    const target = { q: 6, r: 2 };
    ok(distance(after, target) < distance(before, target),
      'ruch rydwanu zmniejsza dystans do celu');
  }
}

console.log('C. Enemy outside movement range is not treated as an immediate chase target');
{
  const units = [chariot('c', 2, 2), warrior('enemy', 0, 10, 2)];
  const commands = commandsFor(units, [ownCity(1)]);
  const attack = commands.find(c => c.type === 'attack' && c.unitId === 'c');
  const move = commands.find(c => c.type === 'move' && c.unitId === 'c');
  ok(attack === undefined, 'brak ataku, gdy wróg jest poza zasięgiem');
  ok(move === undefined || distance({ q: move.toQ, r: move.toR }, { q: 10, r: 2 })
    >= distance({ q: 2, r: 2 }, { q: 10, r: 2 }),
  'wróg poza zasięgiem nie wymusza ofensywnego zbliżenia');
}

console.log('D. Partial movement uses remaining points, not the unit maximum');
{
  const unit = chariot('c', 2, 2);
  unit.ruchLeft = 1;
  const target = { q: 6, r: 2 };
  const units = [unit, warrior('enemy', 0, target.q, target.r)];
  // Keep the city outside the home-defense threat radius so this assertion
  // isolates the flanking chase guard from the separate defense assignment.
  const commands = commandsFor(units, [{ id: 'home', ownerId: 1, q: 0, r: 15, population: 1, name: 'home' }]);
  const move = commands.find(c => c.type === 'move' && c.unitId === 'c');
  const beforeDistance = distance({ q: unit.q, r: unit.r }, target);
  const offensiveChase = move !== undefined
    && distance({ q: move.toQ, r: move.toR }, target) < beforeDistance;
  ok(!offensiveChase,
    'rydwan z 1 pozostałym punktem ruchu nie goni celu odległego o 4 heksy');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
