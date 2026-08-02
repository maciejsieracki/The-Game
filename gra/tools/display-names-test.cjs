'use strict';
/** node tools/display-names-test.cjs — dopisek miasto-państwo vs imperium */

const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.display-names-entry.ts');
const bundle = path.join(__dirname, '.display-names-bundle.cjs');

fs.writeFileSync(entry, `
export {
  formatEntityDisplayName,
  formatCityMapLabel,
  formatOwnerDiploLabel,
  isOwnerClusterCityState,
  isClusterCityStateSlot,
  isTechnicalOwnerLabel,
  resolveOwnerBaseName,
  sanitizeOwnerDisplayBase,
  CITY_STATE_LABEL,
} from '../src/game/display-names';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  loader: { '.ts': 'ts' },
  outfile: bundle,
  absWorkingDir: GRA,
  logLevel: 'silent',
});

const M = require(bundle);

let passed = 0;
let failed = 0;
function assert(c, msg) {
  if (c) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('display-names-test (miasto-państwo vs imperium)\n');

const suffix = ' · ' + M.CITY_STATE_LABEL;

// 1. Stolica gracza — bez dopisku
assert(
  M.formatCityMapLabel({ name: 'Ateny', ownerId: 0, startCityState: false }) === 'Ateny',
  'stolica gracza → Ateny',
);

// 2. Miasto-państwo klastra (Sparta)
assert(
  M.formatCityMapLabel({ name: 'Sparta', ownerId: 3, startCityState: true }) === 'Sparta' + suffix,
  'miasto-państwo → Sparta · miasto-państwo',
);

// 3. Stolica imperium obcego typu (pełna cywilizacja)
assert(
  M.formatOwnerDiploLabel('Rzym', 5, {
    simplifiedOwners: new Set([3]),
    typCopyOwners: new Set([4]),
    cities: [{ ownerId: 5, name: 'Rzym', startCityState: false }],
  }) === 'Rzym',
  'stolica imperium → Rzym (bez dopisku)',
);

assert(M.isOwnerClusterCityState(0, { cities: [{ ownerId: 0, startCityState: true }] }) === false,
  'gracz nigdy nie jest miastem-państwem');

assert(M.isClusterCityStateSlot({ isSameTypeRival: true }) === true,
  'slot rywala tego samego typu = miasto-państwo');

assert(M.isClusterCityStateSlot({ isClusterCapital: true, isSameTypeRival: false }) === false,
  'stolica klastra obcego typu = imperium');

assert(M.isTechnicalOwnerLabel('Rywal 10') === true, 'Rywal N = placeholder techniczny');
assert(M.isTechnicalOwnerLabel('Mykeny') === false, 'Mykeny = prawdziwa nazwa');

// R-MP-PORTRET (Maciej 2026-07-24): miasto-panstwo -> "[miasto] · [kultura]" (nie sama
// nazwa miasta) -- zeby 10-11 MP tej samej kultury bylo widac ktorej kultury sa, nie tylko
// ktorym miastem. formatOwnerDiploLabel dokleja jeszcze "· miasto-panstwo" (patrz test nizej).
assert(
  M.resolveOwnerBaseName({
    ownerId: 10,
    cached: 'Rywal 10',
    cityName: 'Mykeny',
    civDisplayName: 'Grecy',
    isCityState: true,
  }) === 'Mykeny · Grecy',
  'miasto-państwo: miasto z mapy + kultura (nie tylko cache Rywal N)',
);

// Brak nazwy miasta z mapy -> sama kultura (nie placeholder techniczny).
assert(
  M.resolveOwnerBaseName({
    ownerId: 11,
    cityName: 'Rywal 11',
    civDisplayName: 'Grecy',
    isCityState: true,
  }) === 'Grecy',
  'miasto-państwo bez nazwy miasta → sama kultura',
);

assert(
  M.resolveOwnerBaseName({
    ownerId: 3,
    cached: 'Hattusa',
    cityName: 'Hattusa',
    civDisplayName: 'Hetyci',
    isCityState: false,
    isClusterCapital: true,
  }) === 'Hetyci',
  'stolica obcego klastra → nazwa nacji',
);

assert(
  M.formatOwnerDiploLabel('Mykeny', 10, {
    simplifiedOwners: new Set([10]),
    cities: [{ ownerId: 10, name: 'Mykeny', startCityState: true }],
  }) === 'Mykeny' + suffix,
  'audiencja: Mykeny · miasto-państwo',
);

assert(
  M.resolveOwnerBaseName({
    ownerId: 32,
    cached: undefined,
    cityName: undefined,
    civDisplayName: undefined,
    isCityState: true,
  }) === '',
  'brak danych → pusty string (nie AI 32)',
);

assert(
  M.sanitizeOwnerDisplayBase('AI 32', 'Grecy') === 'Grecy',
  'sanitize: AI N → nazwa kultury',
);

assert(
  M.sanitizeOwnerDisplayBase('Sparta · Grecy', 'Grecy') === 'Sparta · Grecy',
  'sanitize: prawdziwa nazwa bez zmian',
);

assert(
  M.sanitizeOwnerDisplayBase('Rywal 5', 'Egipt') === 'Egipt',
  'sanitize: Rywal N → kultura (stolica obcego typu bez miasta)',
);

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
