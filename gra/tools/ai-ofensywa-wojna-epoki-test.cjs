'use strict';

/* Contract + live simulation tests for forced-epoch offensive AI. */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const entry = path.resolve(__dirname, '.ai-ofensywa-wojna-epoki-entry.ts');
const bundle = path.resolve(__dirname, '.ai-ofensywa-wojna-epoki-bundle.cjs');
fs.writeFileSync(entry, `
export { decideAITurn } from '../src/game/ai';
export { clusterUnitsByProximity, ARMY_CONCENTRATION_RADIUS } from '../src/game/army-concentration';
export { shouldEndForcedWarByCityCount } from '../src/game/forced-war-common';
`);
esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: bundle,
  logLevel: 'silent',
});
const C = require(bundle);
let passed = 0;
let failed = 0;
function ok(value, message) {
  if (value) passed++;
  else { failed++; console.error('FAIL:', message); }
}
function unit(id, q, r, extra = {}) {
  return {
    id,
    ownerId: 1,
    typeId: 'Wojownik',
    category: 'miecznik',
    q,
    r,
    ruch: 2,
    ruchLeft: 2,
    ...extra,
  };
}
function map(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    hexes[`${q},${r}`] = {
      coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak',
      ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
      rzeka: { obecna: false, krawedzie: [] },
    };
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}
const data = { units: [], buildings: [], terrainYields: { terrain_types: [] }, aiParams: {} };
const fullMap = map(50, 50);

ok(C.shouldEndForcedWarByCityCount(1, 1, 2) === false,
  'forced-war threshold: one city on either side does not end the war');
ok(C.shouldEndForcedWarByCityCount(2, 0, 2) === true,
  'forced-war threshold: two attacker captures end the war');
ok(C.shouldEndForcedWarByCityCount(0, 2, 2) === true,
  'forced-war threshold: two defender captures end the war');

// AI attacker: distant groups are reduced to one field army, then the army
// marches toward the forced-war target rather than a nearer unrelated city.
{
  const own = [unit('a1', 2, 2), unit('a2', 10, 2), unit('a3', 2, 10)];
  const targetCities = [
    { id: 'enemy-city-1', ownerId: 2, q: 35, r: 35, population: 8 },
    { id: 'enemy-city-2', ownerId: 2, q: 42, r: 42, population: 8 },
    { id: 'unrelated-city', ownerId: 3, q: 3, r: 2, population: 1 },
  ];
  const startMaxCluster = Math.max(...C.clusterUnitsByProximity(own, C.ARMY_CONCENTRATION_RADIUS).map(g => g.length));
  let firstTargetDistance = Infinity;
  let lastTargetDistance = Infinity;
  const history = [];
  for (let turn = 0; turn < 18; turn++) {
    for (const u of own) u.ruchLeft = u.ruch;
    const commands = C.decideAITurn(
      1,
      own,
      targetCities,
      fullMap,
      data,
      {
        civType: 'grecy',
        currentTurn: turn,
        forcedWar: {
          targetOwnerId: 2,
          role: 'attacker',
          era: 'bronze',
          capturedByAttacker: 0,
          capturedByDefender: 0,
        },
        canEngageOwner: ownerId => ownerId === 2,
      },
    );
    const target = targetCities[0];
    const centroidDistance = Math.min(...own.map(u => Math.max(Math.abs(u.q - target.q), Math.abs(u.r - target.r))));
    if (turn === 0) firstTargetDistance = centroidDistance;
    lastTargetDistance = centroidDistance;
    history.push(Math.max(...C.clusterUnitsByProximity(own, C.ARMY_CONCENTRATION_RADIUS).map(g => g.length)));
    for (const command of commands) {
      if (command.type !== 'move') continue;
      const moving = own.find(u => u.id === command.unitId);
      if (moving === undefined) continue;
      moving.q = command.toQ;
      moving.r = command.toR;
    }
  }
  ok(history[history.length - 1] > startMaxCluster,
    `attacker consolidation: max cluster grows from ${startMaxCluster} to ${history[history.length - 1]} (${history.join(',')})`);
  ok(lastTargetDistance < firstTargetDistance,
    `attacker campaign: at least one unit moves toward forced target city (${firstTargetDistance} -> ${lastTargetDistance})`);
  ok(own.every(u => u.q > 3 || u.r > 3),
    'attacker campaign: units are not redirected to the unrelated nearby city');
}

// AI defender: a visible attacker in an active forced war causes the field
// army to rally toward that attacker instead of remaining on a patrol loop.
{
  const own = [unit('d1', 20, 20), unit('d2', 22, 20), unit('d3', 20, 22)];
  const enemy = unit('attacker', 27, 20, { ownerId: 2 });
  const commands = C.decideAITurn(
    1,
    [...own, enemy],
    [{ id: 'defender-city', ownerId: 1, q: 20, r: 20, population: 5 }],
    fullMap,
    data,
    {
      civType: 'grecy',
      currentTurn: 4,
      forcedWar: {
        targetOwnerId: 2,
        role: 'defender',
        era: 'stone',
        capturedByAttacker: 0,
        capturedByDefender: 0,
      },
      canEngageOwner: ownerId => ownerId === 2,
    },
  );
  const active = commands.filter(c => c.type === 'move' || c.type === 'attack');
  ok(active.some(c => c.unitId === 'd1' || c.unitId === 'd2' || c.unitId === 'd3'),
    'defender response: at least one field unit receives a reaction command');
}

console.log(`ai-ofensywa-wojna-epoki-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(entry); } catch {}
try { fs.unlinkSync(bundle); } catch {}
process.exit(failed === 0 ? 0 : 1);
