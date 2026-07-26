'use strict';
/** MAPA — złoża metali per epoka (E-P0-04/05). */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.map-deposits-entry.ts');
const BUNDLE = path.resolve(__dirname, '.map-deposits-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { DEPOSIT_RULES, placeDeposits } from '../src/map/gen-helpers';
export { isDepositVisible, countHiddenMetalDeposits, METAL_DEPOSIT_MIN_ERA } from '../src/map/deposit-era';
export { TerenBazowy, Nakladka } from '../src/types/hex';
export { generateMap, generujSwiat } from '../src/map/generator';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } }

ok(M.METAL_DEPOSIT_MIN_ERA.miedz === 2, 'miedz min era 2');
ok(M.METAL_DEPOSIT_MIN_ERA.zelazo === 3, 'zelazo min era 3');

const miedzRule = M.DEPOSIT_RULES.find(r => r.id === 'miedz');
const zelazoRule = M.DEPOSIT_RULES.find(r => r.id === 'zelazo');
const rudaRule = M.DEPOSIT_RULES.find(r => r.id === 'ruda');
ok(miedzRule && zelazoRule, 'miedz+zelazo rules exist');
ok(!rudaRule, 'legacy ruda rule removed');

// Regula obowiazujaca od 2026-07-25 (gen-helpers.ts:6730-6742): miedz -> Wzgorza, zelazo -> Gory.
const testHex = { terenBazowy: M.TerenBazowy.Wzgorza, nakladka: M.Nakladka.Brak, coords: { q: 0, r: 0 } };
ok(miedzRule.allowedOn(testHex), 'miedz allowed on Wzgorza');
ok(!miedzRule.allowedOn({ ...testHex, terenBazowy: M.TerenBazowy.Gory }), 'miedz NOT on Gory');
ok(zelazoRule.allowedOn({ ...testHex, terenBazowy: M.TerenBazowy.Gory }), 'zelazo allowed on Gory');
ok(!zelazoRule.allowedOn(testHex), 'zelazo NOT on Wzgorza');

const world = M.generujSwiat(424242, 'maly', 'kontynenty');
let miedzOnGory = 0;
let miedzOnWzgorza = 0;
let zelazoOnGory = 0;
let zelazoOnWzgorza = 0;
for (const hex of Object.values(world.hexes)) {
  const z = hex.zloze?.trim().toLowerCase();
  if (z === 'miedz') {
    if (hex.terenBazowy === M.TerenBazowy.Gory) miedzOnGory++;
    if (hex.terenBazowy === M.TerenBazowy.Wzgorza) miedzOnWzgorza++;
  }
  if (z === 'zelazo') {
    if (hex.terenBazowy === M.TerenBazowy.Gory) zelazoOnGory++;
    if (hex.terenBazowy === M.TerenBazowy.Wzgorza) zelazoOnWzgorza++;
  }
}
ok(miedzOnGory === 0, 'zero miedz deposits on Gory');
ok(zelazoOnWzgorza === 0, 'zero zelazo deposits on Wzgorza');
ok(miedzOnWzgorza + zelazoOnGory > 0, 'some metal deposits placed (miedz/Wzgorza + zelazo/Gory)');

const hiddenEra1 = M.countHiddenMetalDeposits(world.hexes, 1);
ok(hiddenEra1 >= miedzOnGory + zelazoOnGory, 'era1 hides all metal zloze');

const sampleMiedz = Object.values(world.hexes).find(h => h.zloze === 'miedz');
if (sampleMiedz) {
  ok(!M.isDepositVisible(sampleMiedz, 1), 'miedz hidden era1');
  ok(M.isDepositVisible(sampleMiedz, 2), 'miedz visible era2');
}
const sampleZelazo = Object.values(world.hexes).find(h => h.zloze === 'zelazo');
if (sampleZelazo) {
  ok(!M.isDepositVisible(sampleZelazo, 2), 'zelazo hidden era2');
  ok(M.isDepositVisible(sampleZelazo, 3), 'zelazo visible era3');
}

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) {}

console.log(`map-deposits-era-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
