'use strict';
/** Scenariusze wspolne dla testu i symulacji (R-WEB-WAR-ALLIN-CAPITAL-Q1). */
const { makeMap, mkUnit, mkCity } = require('./war-allin-capital-harness.cjs');

function aiVsAi() {
  const units = [];
  const pos1 = [[10, 8], [11, 9], [10, 12], [9, 11], [14, 4], [15, 16], [12, 10], [9, 9]];
  pos1.forEach(([q, r], i) => units.push(mkUnit(`a${i}`, 1, q, r)));
  const pos2 = [[30, 8], [29, 9], [30, 12], [31, 11], [26, 4], [25, 16], [28, 10], [31, 9]];
  pos2.forEach(([q, r], i) => units.push(mkUnit(`b${i}`, 2, q, r)));
  units.push(mkUnit('a_settler', 1, 6, 10, 'osadnik'), mkUnit('b_settler', 2, 34, 10, 'osadnik'));
  units.push(mkUnit('a_scout', 1, 6, 11, 'zwiadowca'), mkUnit('b_scout', 2, 34, 11, 'zwiadowca'));
  return {
    map: makeMap(40, 20), units,
    cities: [mkCity('c1a', 1, 5, 10), mkCity('c1b', 1, 7, 6), mkCity('c1c', 1, 7, 14),
      mkCity('c2a', 2, 34, 10), mkCity('c2b', 2, 32, 6), mkCity('c2c', 2, 32, 14)],
    wars: new Set(['1_2']), aiOwners: [1, 2], barbs: false,
  };
}

function aiVsPlayer() {
  const units = [];
  [[10, 8], [11, 9], [10, 12], [9, 11], [14, 4], [15, 16]].forEach(([q, r], i) => units.push(mkUnit(`a${i}`, 1, q, r)));
  [[30, 8], [29, 9], [31, 11]].forEach(([q, r], i) => units.push(mkUnit(`p${i}`, 0, q, r)));
  return {
    map: makeMap(40, 20), units,
    cities: [mkCity('c1a', 1, 5, 10), mkCity('c1b', 1, 7, 6),
      mkCity('c0a', 0, 34, 10), mkCity('c0b', 0, 37, 17)],
    wars: new Set(['0_1']), aiOwners: [1], barbs: false,
  };
}

function barbarians() {
  const units = [];
  [[20, 2], [21, 3], [19, 3], [22, 2], [20, 17]].forEach(([q, r], i) => units.push(mkUnit(`z${i}`, -1, q, r)));
  units.push(mkUnit('p0', 0, 33, 10));
  return {
    map: makeMap(40, 20), units,
    cities: [mkCity('c1a', 1, 5, 10), mkCity('c1b', 1, 7, 6), mkCity('c0a', 0, 34, 10), mkCity('c0b', 0, 30, 4)],
    wars: new Set(), aiOwners: [], barbs: true,
  };
}

/** Wyspy rozdzielone morzem: brak sciezki ladowej. */
function noLandPath() {
  const s = aiVsAi();
  s.map = makeMap(40, 20, { q0: 18, q1: 21, r0: 0, r1: 19 });
  return s;
}

module.exports = { aiVsAi, aiVsPlayer, barbarians, noLandPath };
