'use strict';
/**
 * war-allin-capital-perf.cjs -- czas fazy decyzji AI+barbarzyncy (decideAITurn +
 * decideBarbarianMoves) na TEJ SAMEJ konfiguracji: flaga OFF vs ON (+ opcjonalnie baza).
 * Uruchom z gra/:  node tools/war-allin-capital-perf.cjs [tury=40] [powtorzenia=3]
 * Mierzy wylacznie faze decyzji (nie caly main.ts -- tego nie da sie uruchomic headless).
 */
const H = require('./war-allin-capital-harness.cjs');

function bigScenario() {
  const W = 80; const Hh = 50;
  const units = []; const cities = [];
  const owners = [1, 2, 3, 4];
  const home = { 1: [8, 10], 2: [70, 10], 3: [8, 40], 4: [70, 40] };
  for (const o of owners) {
    const [hq, hr] = home[o];
    for (let c = 0; c < 5; c++) cities.push(H.mkCity(`c${o}_${c}`, o, hq + (c % 3) * 3, hr + Math.floor(c / 3) * 3));
    for (let i = 0; i < 25; i++) units.push(H.mkUnit(`u${o}_${i}`, o, hq + 3 + (i % 9) * 2, hr + 3 + Math.floor(i / 9) * 2));
    units.push(H.mkUnit(`s${o}`, o, hq, hr + 1, 'osadnik'));
  }
  for (let i = 0; i < 15; i++) units.push(H.mkUnit(`z${i}`, -1, 30 + (i % 8) * 2, 5 + Math.floor(i / 8) * 40));
  return { map: H.makeMap(W, Hh), units, cities, wars: new Set(['1_2', '3_4', '1_3']), aiOwners: owners, barbs: true };
}

const turns = Number(process.argv[2] || 40);
const reps = Number(process.argv[3] || 3);
const E = H.loadEngine(null, 'perf');
function bench(flag) {
  const per = [];
  let moves = 0; let battles = 0;
  for (let k = 0; k < reps; k++) {
    const st = bigScenario();
    const s = H.simulate(st, { engine: E, flag, fog: true, turns });
    per.push(s.decisionMs / turns);
    moves = s.cmdMoves; battles = s.battles;
  }
  per.sort((a, b) => a - b);
  return { medianMsPerTurn: per[Math.floor(per.length / 2)], all: per.map(x => +x.toFixed(2)), moves, battles };
}
bench(false); // rozgrzewka JIT
const off = bench(false);
const on = bench(true);
console.log('OFF', JSON.stringify(off));
console.log('ON ', JSON.stringify(on));
console.log('ratio ON/OFF (decyzje AI+barb na ture) =', (on.medianMsPerTurn / off.medianMsPerTurn).toFixed(2));
H.cleanup(E);
