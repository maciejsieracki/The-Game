'use strict';
/** power-objective-test.cjs — obiektywny POWER kanon P-A (Maciej 2026-06-26). */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ENTRY = path.join(__dirname, '.power-objective-entry.ts');
const BUNDLE = path.join(__dirname, '.power-objective-bundle.cjs');

fs.writeFileSync(ENTRY, `
import { computeObjectivePower, loadPowerCoefficients, epokaPowerMultiplier, loadBattlePowerModel, battlePowerPointsFromDefeatedEnemy } from '../src/game/power-objective';
module.exports = { computeObjectivePower, loadPowerCoefficients, epokaPowerMultiplier, loadBattlePowerModel, battlePowerPointsFromDefeatedEnemy };
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const P = require(BUNDLE);
let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; return; }
  fail++;
  console.error('FAIL:', msg);
}

const c = P.loadPowerCoefficients();
ok(c.jednostkaWojskowa === 25, 'coeff jednostka 25');
ok(c.ludek === 5, 'coeff ludek 5');
ok(c.heksTerytorium === 0.5, 'coeff heks 0.5');
ok(c.techZbadane === 20, 'coeff tech 20');
ok(P.epokaPowerMultiplier(3) === 1, 'mnoznik epoki zawsze 1 (P-B odrzucone)');

ok(P.loadBattlePowerModel() === 'enemy_m_sum', 'P-C2-DEF A model enemy_m');
ok(P.battlePowerPointsFromDefeatedEnemy(37.4) === 37, 'pkt bitwy = floor(M wroga)');
ok(P.battlePowerPointsFromDefeatedEnemy(-5) === 0, 'pkt bitwy min 0');

/** Scenariusz kalibracyjny — ep.1, 10 miast, ~100 ludków → Power = 3020 */
const kalibracja = {
  ownerId: 0,
  epoka: 1,
  jednostki: 10,
  wygraneBitwy: 0,
  bitwyPktSum: 250,
  sumaLudkow: 100,
  rekrutEkw: 80,
  miasta: 10,
  heksyTerytorium: 500,
  budynki: 60,
  techZbadane: 16,
  ulepszeniaTerenu: 50,
};
const r = P.computeObjectivePower(kalibracja);
ok(r.powerBase === 3020, 'kalibracja P-A powerBase 3020');
ok(r.power === 3020, 'kalibracja P-A power 3020');
ok(r.mnoznikEpoki === 1, 'bez mnoznika epoki');

const solo = P.computeObjectivePower({
  ownerId: 1,
  epoka: 1,
  jednostki: 0,
  wygraneBitwy: 0,
  sumaLudkow: 0,
  rekrutEkw: 0,
  miasta: 0,
  heksyTerytorium: 0,
  budynki: 0,
  techZbadane: 0,
  ulepszeniaTerenu: 0,
});
ok(solo.power === 0, 'empty empire power 0');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`[power-objective-test] ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
