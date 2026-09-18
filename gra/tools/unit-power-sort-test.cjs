'use strict';

/**
 * Deterministic regression test for stable field-power ordering at roster
 * consumers. Usage: node gra/tools/unit-power-sort-test.cjs
 */
const assert = require('assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const ESBUILD_BIN = process.env.ESBUILD_BIN || path.join(GRA_DIR, 'node_modules/.bin/esbuild');
const UNIT_POWER_TS = path.join(GRA_DIR, 'src/game/unit-power.ts');
const MAIN_TS = path.join(GRA_DIR, 'src/main.ts');
const CITY_PANEL_TS = path.join(GRA_DIR, 'src/ui/cityPanel.ts');
const BUNDLE_PATH = path.join(
  os.tmpdir(),
  `unit-power-sort-${process.pid}-${Math.random().toString(36).slice(2, 8)}.cjs`,
);

let pass = 0;
let fail = 0;

function check(condition, message) {
  if (condition) {
    pass++;
    console.log('  OK:', message);
  } else {
    fail++;
    console.error('  FAIL:', message);
  }
}

function checkDeep(actual, expected, message) {
  try {
    assert.deepEqual(actual, expected);
    check(true, message);
  } catch (error) {
    check(false, `${message} (${error.message})`);
  }
}

function ids(items) {
  return items.map(item => item.id);
}

try {
  execFileSync(
    ESBUILD_BIN,
    [UNIT_POWER_TS, '--bundle', '--platform=node', '--format=cjs', `--outfile=${BUNDLE_PATH}`],
    { stdio: 'inherit' },
  );

  const { fieldPower, sortByUnitPowerDescending } = require(BUNDLE_PATH);
  assert.equal(typeof sortByUnitPowerDescending, 'function', 'unit power sort helper is exported');

  const stats = (overrides = {}) => ({
    meleeAttack: 0,
    meleeDefence: 0,
    weaponDamage: 0,
    piercing: 0,
    armor: 0,
    chargeBonus: 0,
    health: 0,
    missileAttack: 0,
    ...overrides,
  });

  const source = [
    { id: 'zero-first', unit: stats() },
    { id: 'negative', unit: stats({ meleeAttack: -4 }) },
    { id: 'equal-first', unit: stats({ meleeAttack: 2 }) },
    { id: 'strong', unit: stats({ meleeAttack: 10 }) },
    { id: 'equal-second', unit: stats({ meleeAttack: 1, weaponDamage: 1 }) },
    { id: 'missing-definition', unit: null },
    { id: 'zero-second', unit: stats() },
  ];
  const expected = [
    'strong',
    'equal-first',
    'equal-second',
    'zero-first',
    'zero-second',
    'negative',
    'missing-definition',
  ];
  const sourceSnapshot = source.slice();
  const beforeRefresh = sortByUnitPowerDescending(source, entry => entry.unit);

  checkDeep(ids(beforeRefresh), expected, 'fixture order before refresh');
  check(
    beforeRefresh.indexOf(source[2]) < beforeRefresh.indexOf(source[4]),
    'equal powers preserve source order',
  );
  check(
    beforeRefresh.indexOf(source[0]) < beforeRefresh.indexOf(source[6]),
    'zero-power ties preserve source order',
  );
  check(beforeRefresh !== source, 'sort returns a new array');
  check(
    source.every((entry, index) => entry === sourceSnapshot[index]),
    'source roster array is not mutated',
  );

  const afterRefresh = source.map(entry => ({
    ...entry,
    unit: entry.unit ? { ...entry.unit } : null,
  }));
  checkDeep(
    ids(sortByUnitPowerDescending(afterRefresh, entry => entry.unit)),
    expected,
    'fixture order after a roster refresh',
  );

  const afterLoad = JSON.parse(JSON.stringify(source));
  checkDeep(
    ids(sortByUnitPowerDescending(afterLoad, entry => entry.unit)),
    expected,
    'fixture order after save/load round-trip',
  );

  const definitions = new Map(source.filter(entry => entry.unit).map(entry => [entry.id, entry.unit]));
  const productionItems = source.map(({ id }) => ({ id, koszt: 1 }));
  checkDeep(
    ids(sortByUnitPowerDescending(productionItems, item => definitions.get(item.id))),
    expected,
    'production-item roster resolves definitions before sorting',
  );

  const units = JSON.parse(fs.readFileSync(path.join(GRA_DIR, 'data/units.json'), 'utf8'));
  const realRoster = units.slice(0, 8);
  const realSnapshot = realRoster.slice();
  const realOrdered = sortByUnitPowerDescending(realRoster, unit => unit);
  const realPowers = realOrdered.map(unit => fieldPower(unit).total);
  check(
    realPowers.every((power, index) => index === 0 || realPowers[index - 1] >= power),
    'real units.json fixture is ordered by computed field power',
  );
  check(
    realRoster.every((unit, index) => unit === realSnapshot[index]),
    'real units.json source roster remains unchanged',
  );

  const mainSource = fs.readFileSync(MAIN_TS, 'utf8');
  const cityPanelSource = fs.readFileSync(CITY_PANEL_TS, 'utf8');
  check(
    mainSource.includes('const orderedReplacements = sortByUnitPowerDescending'),
    'replacement picker sorts its roster at the display boundary',
  );
  check(
    mainSource.includes('const availableRecruitment = sortByUnitPowerDescending'),
    'empire recruitment snapshot sorts its roster at the display boundary',
  );
  check(
    (cityPanelSource.match(/const units = sortByUnitPowerDescending/g) || []).length === 2,
    'city panel detail and recruitment lists both sort at the display boundary',
  );
} finally {
  try { fs.unlinkSync(BUNDLE_PATH); } catch { /* best effort */ }
}

console.log(`\n=== unit-power-sort-test: ${pass} pass, ${fail} fail ===`);
process.exit(fail > 0 ? 1 : 0);
