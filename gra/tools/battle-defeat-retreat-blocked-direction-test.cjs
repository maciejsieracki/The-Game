'use strict';
/**
 * R-WEB-BATTLE-DEFEATED-UNIT-STAYS-ON-BATTLE-HEX-Q1
 * node gra/tools/battle-defeat-retreat-blocked-direction-test.cjs
 * Przegrana (wroga) grupa po bitwie w polu, gdy kierunek odwrotu wprost od zwyciezcy jest
 * zablokowany (gory / obca jednostka / zajety heks posredni), ma odskoczyc na INNE pole:
 * najpierw 2 heksy w 3 kierunkach "od zwyciezcy" (wprost + 2 sasiednie), potem 1 heks w tych
 * kierunkach; dopiero gdy zadnego wolnego heksu nie ma -- zostaje na heksie bitwy.
 * Prawdziwy applyPostBattleMap (manual, atakujacy wygrywa, obronca przegrywa).
 */
const path = require('path');
const vm = require('vm');
const fs = require('fs');
const esbuild = require(path.join(__dirname, '..', 'node_modules', 'esbuild'));
const ROOT = path.resolve(__dirname, '..');

let pass = 0, fail = 0;
function assert(c, m) { if (c) pass++; else { fail++; console.error('FAIL:', m); } }

async function bundle(contents, name) {
  const r = await esbuild.build({
    stdin: { contents, resolveDir: ROOT, sourcefile: name },
    bundle: true, platform: 'node', format: 'cjs', target: 'es2020',
    alias: { three: path.join(ROOT, 'node_modules/three/build/three.cjs') },
    plugins: [require('./lib/esbuild-raw-plugin.cjs')], write: false, logLevel: 'silent',
  });
  const module = { exports: {} };
  vm.runInNewContext(r.outputFiles[0].text, { module, exports: module.exports, require, console, process, globalThis, setTimeout, clearTimeout }, { filename: name });
  return module.exports;
}

const U = (id, owner, q, r, extra) => Object.assign({ id, ownerId: owner, typeId: 'Wojownik', q, r, ruchLeft: 2, hp: 100 }, extra || {});
const at = (units, id) => units.find(u => u.id === id);
const hx = (u) => (u ? u.q + ',' + u.r : 'brak');
const BQ = 11, BR = 22; // heks bitwy
const ATK = [11, 23];   // zwyciezca (poludnie od bitwy)

/** Odwrot obroncy d0 (wlasciciel 1) po wygranej atakujacego a0 (wlasciciel 0). */
function scenario(P, extraUnits, blocked) {
  const a0 = U('a0', 0, ATK[0], ATK[1]);
  const d0 = U('d0', 1, BQ, BR);
  const units = [a0, d0, ...extraUnits];
  const res = P.applyPostBattleMap({
    units, map: { hexes: {} }, cities: [],
    battleQ: BQ, battleR: BR,
    atkAnchor: a0, atkRoster: [a0], defRoster: [d0],
    atkStart: new Map([[a0.id, { q: ATK[0], r: ATK[1] }]]),
    winner: 'atakujacy', lossAtkPct: 0, lossDefPct: 0,
    manualSurvivors: [{ id: 'a0', hp: 90 }, { id: 'd0', hp: 40 }],
    getDef: () => ({ health: 100, 'Rola (linia)': 'Wręcz' }), maxHpOf: () => 100,
    isPassableHex: (q, r) => !blocked.some(b => b[0] === q && b[1] === r),
    isUnitAt: (q, r, ex) => units.some(u => u.id !== ex && u.q === q && u.r === r),
  });
  return { d: at(units, 'd0'), res, units };
}

async function main() {
  const P = await bundle("export * from './src/game/post-battle-map';", 'pb-blocked-entry.ts');
  const dist = (q, r) => (Math.abs(q - BQ) + Math.abs(r - BR) + Math.abs((q - BQ) + (r - BR))) / 2;

  // S1) Wprost od zwyciezcy (12,21) zajety przez obca jednostke zwyciezcy (rozlana armia), a 2. heks
  //     (13,20) gorski. Stare zachowanie: fan-out 1 heks wprost -> zajety, 2. krok gorski -> przerwanie
  //     -> wrog ZOSTAJE na heksie bitwy. Oczekiwane: odskok 2 heksy na 2. kierunek (11,21)->(11,20).
  {
    const spill = U('sp1', 0, 12, 21);
    const { d, res } = scenario(P, [spill], [[13, 20]]);
    console.log('S1 q,r przed=' + BQ + ',' + BR + ' po=' + hx(d) + ' dist=' + (d ? dist(d.q, d.r) : '-') + ' retreated=' + JSON.stringify(res.retreatedTwoHexIds));
    assert(d && (d.q !== BQ || d.r !== BR), 'S1: przegrany NIE zostaje na heksie bitwy');
    assert(d && d.q === 11 && d.r === 20, 'S1: odskok 2 heksy na (11,20), jest ' + hx(d));
    assert(d && !(d.q === 12 && d.r === 21), 'S1: nie wchodzi na heks zajety przez obca jednostke');
    assert(res.retreatedTwoHexIds.includes('d0'), 'S1: raport retreatedTwoHexIds');
  }

  // S2) Brak 2-heksowej trasy w zadnym z 3 kierunkow, ale 1 heks wolny -> odskok 1 heks.
  //     Kierunki: (11,21) [2. heks (11,20) gorski], (12,21) [1. heks gorski],
  //     (10,22) [2. heks (9,22) zajety obca jednostka].
  {
    const foe = U('foe2', 2, 9, 22);
    const { d, res } = scenario(P, [foe], [[11, 20], [12, 21]]);
    console.log('S2 q,r po=' + hx(d) + ' dist=' + (d ? dist(d.q, d.r) : '-') + ' noRoute=' + JSON.stringify(res.retreatNoTwoHexRouteIds));
    assert(d && dist(d.q, d.r) === 1, 'S2: odskok 1 heks, jest ' + hx(d) + ' dist=' + (d ? dist(d.q, d.r) : '-'));
    assert(d && !(d.q === 9 && d.r === 22), 'S2: nie wchodzi na zajety heks 2-go kroku');
    assert(res.retreatedTwoHexIds.includes('d0') && !res.retreatNoTwoHexRouteIds.includes('d0'), 'S2: odskok 1 heks zaliczony do retreated (sciezka mgly)');
  }

  // S3) Wszystkie sasiednie heksy nieprzechodnie -> nic wolnego -> zostaje (dotychczasowe zachowanie).
  {
    const nb = [[12, 22], [12, 21], [11, 21], [10, 22], [10, 23], [11, 24]];
    const { d, res } = scenario(P, [], nb);
    console.log('S3 q,r po=' + hx(d));
    assert(d && d.q === BQ && d.r === BR, 'S3: nic wolnego -> zostaje na heksie bitwy, jest ' + hx(d));
    assert(d && res.retreatedTwoHexIds.length === 0, 'S3: brak odwrotu');
  }

  // S4) Obca jednostka na heksie wprost (12,21), bez blokad terenu: nie wchodzi na obcego,
  //     odskok 2 heksy na kolejny kierunek od zwyciezcy (11,21)->(11,20).
  {
    const spill = U('sp4', 0, 12, 21);
    const { d } = scenario(P, [spill], []);
    console.log('S4 q,r po=' + hx(d) + ' dist=' + (d ? dist(d.q, d.r) : '-'));
    assert(d && !(d.q === 12 && d.r === 21), 'S4: nie wchodzi na heks obcej jednostki');
    assert(d && d.q === 11 && d.r === 20, 'S4: odskok 2 heksy na (11,20), jest ' + hx(d));
  }

  // S5) Kontrola: wolny kierunek wprost -> zachowanie dotychczasowe (odskok 2 heksy wprost).
  {
    const { d } = scenario(P, [], []);
    console.log('S5 q,r po=' + hx(d));
    assert(d && dist(d.q, d.r) === 2, 'S5: kontrola -- odskok 2 heksy, jest ' + hx(d));
  }

  console.log('battle-defeat-retreat-blocked-direction-test: ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}
main().catch(e => { console.error(e); process.exit(2); });
