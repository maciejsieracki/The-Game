'use strict';

/**
 * Independent regression for R-MANPOWER-UZUPELNIENIE-HP-NIEZAPISUJE-Q1.
 * It models the live-unit handoff used by main.ts, then verifies that the
 * healed HP survives the same JSON snapshot boundary used by save/load.
 * Run from gra/: node tools/r-manpower-uzupelnienie-hp-niezapisuje-q1-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const entryName = '.r-manpower-uzupelnienie-hp-entry.ts';
const bundleName = '.r-manpower-uzupelnienie-hp-bundle.cjs';
const entry = path.join(__dirname, entryName);
const bundle = path.join(__dirname, bundleName);
fs.writeFileSync(entry, `
import { tickManpowerUnitReplenishment } from '../src/game/manpower';
module.exports = { tickManpowerUnitReplenishment };
`, 'utf8');
esbuild.buildSync({ entryPoints: [`./${entryName}`], absWorkingDir: __dirname, bundle: true, platform: 'node', format: 'cjs', outfile: bundleName, logLevel: 'silent' });
const { tickManpowerUnitReplenishment } = require(bundle);

let pass = 0;
let fail = 0;
function ok(condition, message) {
  if (condition) { pass += 1; console.log(`OK ${message}`); }
  else { fail += 1; console.error(`FAIL ${message}`); }
}

const city = { id: 'c1', ownerId: 0, population: 10, manpower: 5000, q: 0, r: 0, oblegane: false };
const liveUnit = {
  id: 'u1', ownerId: 0, typeId: 'Wojownik', category: 'miecznik',
  q: 3, r: 3, ruch: 2, ruchLeft: 2, hp: 10,
};

// This is intentionally the live array, exactly as passed from main.ts.
const result = tickManpowerUnitReplenishment(
  [city], [liveUnit], 'normal', () => 1, () => [], () => 100,
);
ok(result.healedCount === 1, 'runtime tick heals one unit');
ok(liveUnit.hp === 40, 'live RuntimeUnit receives +30 HP');
ok(city.manpower === 4700, 'Manpower is debited by 300');

// Save boundary: the live unit is what buildSaveGameSnapshot() serializes.
const loaded = JSON.parse(JSON.stringify({ units: [liveUnit], cities: [city] }));
ok(loaded.units[0].hp === 40, 'healed HP survives save JSON snapshot');
ok(loaded.cities[0].manpower === 4700, 'Manpower survives save JSON snapshot');

console.log(`[r-manpower-uzupelnienie-hp-niezapisuje-q1-test] ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
