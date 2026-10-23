'use strict';
/** Szybki przeglad symulacji: node tools/war-allin-capital-quick.cjs [turns] */
const H = require('./war-allin-capital-harness.cjs');
const S = require('./war-allin-capital-scenarios.cjs');
const turns = Number(process.argv[2] || 30);
const E = H.loadEngine(null, 'quick');
for (const flag of [false, true]) {
  for (const name of ['aiVsAi', 'aiVsPlayer', 'barbarians', 'noLandPath']) {
    const st = S[name]();
    const t0 = Date.now();
    const s = H.simulate(st, { engine: E, flag, fog: true, turns });
    console.log(flag ? 'ON ' : 'OFF', name, 'battles', s.battles, 'captures', s.captures, 'moves', s.cmdMoves,
      'foreign', s.cmdsForForeignUnits, 'humanMoves', s.humanUnitMoves, 'ms', Date.now() - t0,
      'hash', H.stateHash(st), s.log.slice(0, 4).join(';'));
  }
}
H.cleanup(E);
