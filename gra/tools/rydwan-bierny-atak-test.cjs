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
    // Izolacja: nakladka applyArmySeeksEnemyArmy (ai-war-army-seeks-army) sama ciagnie rydwan do
    // wroga i maskowala by galaz rydwana (mutacje w ai.ts dawaly te same ruchy). Jej wlasne testy
    // sa osobno; tu wylaczona parametrem, zeby asercje mierzyly wylacznie flankingTarget.
    buildings: [], aiParams: { ai_wojna_armia_szuka_armii_wlaczone: { 'wartość': 0 } }, terrainYields: { terrain_types: [] },
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

// Dom (miasto) w (0,4): daleko od wroga, wiec ani obrona domu, ani nakladka nie przejmuje rydwana;
// bezczynny powrot do domu idzie W STRONE PRZECIWNA do wroga (mutacja galezi flankingTarget = ruch
// na (1,5), dystans do wroga rosnie zamiast maleć).
const HOME_AWAY = { id: 'home', ownerId: 1, q: 0, r: 4, population: 1, name: 'home' };
console.log('B. Reachable enemy (distance 4 = ruch) gets a closing move toward it');
{
  const enemy = { q: 6, r: 8 };
  const unit = chariot('c', 2, 8);
  const commands = commandsFor([unit, warrior('enemy', 0, enemy.q, enemy.r)], [HOME_AWAY]);
  const move = commands.find(c => c.type === 'move' && c.unitId === 'c');
  ok(move !== undefined, 'rydwan wykonuje ruch w stronę osiągalnego wroga');
  if (move !== undefined) {
    const after = { q: move.toQ, r: move.toR };
    ok(distance(after, enemy) < distance({ q: unit.q, r: unit.r }, enemy),
      'ruch rydwanu zmniejsza dystans do wroga w zasięgu ruchu');
    ok(distance({ q: unit.q, r: unit.r }, after) <= 4,
      'krok rydwanu mieści się w budżecie ruchu (ruch 4)');
  }
}

// Decyzja właściciela 2026-11-25 (R-WEB-TEST-DEBT-Q14-C, pkt 2): obowiązuje KOD (commit 64d5ac663):
// rydwan aktywnie zbliża się do najbliższej wrogiej jednostki W ZASIĘGU ruchu. Wróg poza zasięgiem
// NIE wymusza zbliżenia: brak ataku i ruch (bezczynny powrót do domu) nie zmniejsza dystansu do wroga.
// Mutacja "zasięg bez ograniczenia" (warunek hexDistance <= ruchLeft usunięty) daje zbliżenie -> czerwony.
console.log('C. Enemy outside movement range: no attack, no approach toward it');
{
  const enemy = { q: 10, r: 2 };
  const unit = chariot('c', 2, 2);
  const commands = commandsFor([unit, warrior('enemy', 0, enemy.q, enemy.r)], [HOME_AWAY]);
  const attack = commands.find(c => c.type === 'attack' && c.unitId === 'c');
  const move = commands.find(c => c.type === 'move' && c.unitId === 'c');
  ok(attack === undefined, 'brak ataku, gdy wróg jest poza zasięgiem');
  ok(move === undefined || distance({ q: move.toQ, r: move.toR }, enemy)
    >= distance({ q: unit.q, r: unit.r }, enemy),
  'rydwan nie zbliża się do wroga poza zasięgiem ruchu (dystans nie maleje)');
}

// D. Budżet: ruchLeft=2 (autorytatywne pozostałe punkty, nie maksimum ruch=4). Wróg w odległości 4
// jest w zasięgu ruch=4, ale POZA ruchLeft=2 -> brak zbliżenia. Mutacja Math.max(ruchLeft, ruch)
// w warunku zasięgu daje zbliżenie na (4,8) -> czerwony.
console.log('D. Partial movement: remaining points (ruchLeft) bound the approach, not the unit maximum');
{
  const enemy = { q: 6, r: 8 };
  const unit = chariot('c', 2, 8);
  unit.ruchLeft = 2;
  const commands = commandsFor([unit, warrior('enemy', 0, enemy.q, enemy.r)], [HOME_AWAY]);
  const attack = commands.find(c => c.type === 'attack' && c.unitId === 'c');
  const move = commands.find(c => c.type === 'move' && c.unitId === 'c');
  ok(attack === undefined, 'brak ataku przy ruchLeft=2 i wrogu w odległości 4');
  ok(move === undefined || distance({ q: move.toQ, r: move.toR }, enemy)
    >= distance({ q: unit.q, r: unit.r }, enemy),
  'rydwan z ruchLeft=2 nie zbliża się do wroga spoza pozostałego budżetu (ruch 4 nie jest używany)');
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
