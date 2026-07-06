'use strict';
/** power-options-test.cjs — opcje Moc + licznik armii. */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ENTRY = path.join(__dirname, '.power-options-entry.ts');
const BUNDLE = path.join(__dirname, '.power-options-bundle.cjs');

fs.writeFileSync(ENTRY, `
import { loadPowerOpcje, countUnitsForPowerArmy } from '../src/game/power-options';
module.exports = { loadPowerOpcje, countUnitsForPowerArmy };
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

const o = P.loadPowerOpcje();
ok(o.hudEtykietaPl === 'Moc', 'hud PL Moc');
ok(o.mnoznikEpokiAktywny === false, 'mnoznik epoki off');
ok(o.liczyOsadnikWArmii === true, 'osadnik default on');

const units = [
  { ownerId: 0, category: 'miecznik' },
  { ownerId: 0, category: 'osadnik' },
  { ownerId: 1, category: 'miecznik' },
];
ok(P.countUnitsForPowerArmy(units, 0, { ...o, liczyOsadnikWArmii: true }) === 2, 'armia z osadnikiem');
ok(P.countUnitsForPowerArmy(units, 0, { ...o, liczyOsadnikWArmii: false }) === 1, 'armia bez osadnika');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`[power-options-test] ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
