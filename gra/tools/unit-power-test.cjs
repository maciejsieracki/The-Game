/**
 * unit-power-test.cjs — testy mocy jednostki (TW v3 M).
 * Usage: node gra/tools/unit-power-test.cjs
 */
'use strict';

const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');

const GRA_DIR = path.resolve(__dirname, '..');
const UNIT_POWER_TS = path.join(GRA_DIR, 'src/game/unit-power.ts');
const UNITS_JSON = path.join(GRA_DIR, 'data/units.json');
const ESBUILD_BIN = path.join(GRA_DIR, 'node_modules/.bin/esbuild');
const BUNDLE_PATH = path.join(os.tmpdir(), 'unit-power-bundle.cjs');

console.log('Bundling unit-power.ts...');
execSync(
  '"' + ESBUILD_BIN + '" "' + UNIT_POWER_TS + '" --bundle --platform=node --format=cjs --outfile="' + BUNDLE_PATH + '"',
  { stdio: 'inherit' }
);

const {
  fieldPower,
  siegePower,
  armyFieldPower,
  isSiegeUnit,
  sumArmyFieldPower,
} = require(BUNDLE_PATH);

const units = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));
const byName = Object.fromEntries(units.map(u => [u.Jednostka, u]));

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) {
    pass++;
    console.log('  OK:', msg);
  } else {
    fail++;
    console.error('  FAIL:', msg);
  }
}

const hastati = byName['Hastati'];
const fp = fieldPower(hastati);
assert(fp.total === 50, 'Hastati M_pole=50 (got ' + fp.total + ')');

const kat = byName['Katapulta'];
assert(isSiegeUnit(kat), 'Katapulta is siege');
assert(armyFieldPower(kat) === 0, 'Katapulta armyFieldPower=0 (excluded from army sum)');
const sp = siegePower(kat);
assert(sp.total > 0, 'Katapulta M_siege>0 (got ' + sp.total + ')');

const wojsko = [hastati, hastati, byName['Falanga']];
const sum = sumArmyFieldPower(wojsko);
assert(sum === 50 + 50 + 45, 'sumArmyFieldPower 3 units (got ' + sum + ')');

const cached = byName['Triari'];
if (typeof cached.fieldPower === 'number') {
  assert(
    fieldPower(cached).total === cached.fieldPower,
    'JSON fieldPower matches runtime for Triari (' + cached.fieldPower + ')'
  );
} else {
  console.log('  SKIP: fieldPower not in JSON yet — run gen-panel-c.py');
}

console.log('\n=== unit-power-test: ' + pass + ' pass, ' + fail + ' fail ===');
process.exit(fail > 0 ? 1 : 0);
