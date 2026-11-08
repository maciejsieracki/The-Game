'use strict';
// node tools/work-tax-conversion-test.cjs — explicit work-to-tax conversion contract.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const root = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.work-tax-entry.ts');
const bundle = path.join(__dirname, '.work-tax-bundle.cjs');
fs.writeFileSync(entry, `export { convertWorkPoolToTax, taxForWorkAmount } from '../src/game/work-tax';`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, absWorkingDir: root, logLevel: 'silent' });
const { convertWorkPoolToTax, taxForWorkAmount } = require(bundle);
const tick = fs.readFileSync(path.join(root, 'src/game/turn-economy.ts'), 'utf8');
const oldConfig = fs.readFileSync(path.join(root, 'data/econ-params.json'), 'utf8');
assert.equal((tick.match(/pieniadzZPracyPoSplit/g) || []).length, 0, 'end-turn city economy has no automatic conversion path');
assert.equal(oldConfig.includes('targowisko_praca_na_pieniadz_mnoznik'), false, 'old automatic 2:1 multiplier is removed');
assert.deepEqual(convertWorkPoolToTax(20, 0, 1, true), { workRemaining: 20, workSpent: 0, taxGained: 0 }, 'zero selection leaves pool untouched by default');
assert.deepEqual(convertWorkPoolToTax(20, 7, 1, true), { workRemaining: 13, workSpent: 7, taxGained: 7 }, 'manual 1:1 action decrements selected pool amount');
assert.deepEqual(convertWorkPoolToTax(3, 7, 1, true), { workRemaining: 0, workSpent: 3, taxGained: 3 }, 'conversion cannot spend more than remaining post-sink pool');
assert.deepEqual(convertWorkPoolToTax(20, 7, 1, false), { workRemaining: 20, workSpent: 0, taxGained: 0 }, 'missing market or non-human owner disables conversion');
assert.deepEqual(convertWorkPoolToTax(20, 7, 1.5, true), { workRemaining: 13, workSpent: 7, taxGained: 10 }, 'configured course floors fractional tax');
assert.deepEqual(convertWorkPoolToTax(20, 1, 0.5, true), { workRemaining: 20, workSpent: 0, taxGained: 0 }, 'fractional-rate selection yielding zero tax does not waste Work');
assert.equal(taxForWorkAmount(7, 1.5), 10, 'confirmation preview uses the exact floored tax credit');
const params = JSON.parse(fs.readFileSync(path.join(root, 'data/econ-params.json'), 'utf8'));
assert.deepEqual(params.budynki.targowisko_praca_na_podatek_kurs, { easy: 1, normal: 1, hard: 1,
  jednostka: 'Podatek / Praca', opis: 'Kurs ręcznej, jednorazowej zamiany Pracy z puli imperium na Podatek. Wymaga co najmniej jednego Targowiska w imperium; domyślnie 1:1. Nie uruchamia się automatycznie.' },
'config exposes the rate shown by UI and used by conversion');
console.log('work-tax-conversion-test: 10 assertions passed');
