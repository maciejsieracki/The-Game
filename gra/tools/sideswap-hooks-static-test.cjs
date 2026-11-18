'use strict';
/**
 * R-WEB-TEST-HOOK-WARRIOR-SIDESWAP-MANUAL-MEASURE-Q1 (odpowiedz na zarzut 5 Evaluatora): test statyczny haków.
 *
 * Sprawdza bez przegladarki, ze hak `setSwapSides` i `setGeneral` sa podpiete w API `window.__civTest`
 * (gra/src/game/civ-test-hooks.ts) oraz w bloku civTest w gra/src/main.ts, a flaga zamiany stron jest
 * bramkowana przez `?civTest=1`.
 *
 * Uzycie:
 *   node tools/sideswap-hooks-static-test.cjs            -> PASS (exit 0) na biezacym kodzie
 *   node tools/sideswap-hooks-static-test.cjs --mutation -> MUTACJA: kopia pliku hooks bez linii setSwapSides
 *                                                           musi dac FAIL (exit 1), inaczej exit 2
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HOOKS = path.join(ROOT, 'src/game/civ-test-hooks.ts');
const MAIN = path.join(ROOT, 'src/main.ts');

function check(hooksSrc, mainSrc) {
  const fails = [];
  const need = (src, re, label) => { if (!re.test(src)) fails.push(label); };
  need(hooksSrc, /setSwapSides\s*:\s*v\s*=>\s*deps\.setSwapSides\(v\)/, 'civ-test-hooks: api.setSwapSides -> deps');
  need(hooksSrc, /setGeneral\s*:\s*\(ownerId,\s*q,\s*r\)\s*=>\s*deps\.setGeneral\(ownerId,\s*q,\s*r\)/, 'civ-test-hooks: api.setGeneral -> deps');
  need(hooksSrc, /setSwapSides:\s*\(v:\s*boolean\)\s*=>\s*void;/, 'civ-test-hooks: typ CivTestDeps.setSwapSides');
  need(mainSrc, /setSwapSides:\s*v\s*=>\s*\{\s*_civTestSwapSides\s*=\s*v\s*===\s*true;\s*\}/, 'main.ts: wiring deps.setSwapSides');
  need(mainSrc, /setGeneral:\s*\(ownerId,\s*q,\s*r\)\s*=>\s*\{/, 'main.ts: wiring deps.setGeneral');
  need(mainSrc, /const civTestSwapSidesFlag = \(\): boolean => _civTestSwapSides && .*civTest=1/, 'main.ts: flaga zamiany bramkowana ?civTest=1');
  need(mainSrc, /const swapSides = civTestSwapSidesFlag\(\);/, 'main.ts: flaga uzyta w scenie bitwy');
  return fails;
}

function main() {
  const hooksSrc = fs.readFileSync(HOOKS, 'utf8');
  const mainSrc = fs.readFileSync(MAIN, 'utf8');
  if (process.argv.includes('--mutation')) {
    const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'sideswap-mut-'));
    const copy = path.join(dir, 'civ-test-hooks.copy.ts');
    fs.copyFileSync(HOOKS, copy);
    const mutated = fs.readFileSync(copy, 'utf8').replace(/^\s*setSwapSides: v => deps\.setSwapSides\(v\),\s*\n/m, '');
    if (mutated === fs.readFileSync(copy, 'utf8')) { console.log('MUTATION-SETUP-ERROR: linia setSwapSides nie znaleziona'); return 2; }
    fs.writeFileSync(copy, mutated);
    const fails = check(fs.readFileSync(copy, 'utf8'), mainSrc);
    console.log(`MUTATION (kopia bez haka setSwapSides): ${fails.length} FAIL`);
    fails.forEach(f => console.log('  FAIL: ' + f));
    fs.rmSync(dir, { recursive: true, force: true });
    return fails.length > 0 ? 1 : 2;
  }
  const fails = check(hooksSrc, mainSrc);
  if (fails.length === 0) { console.log('PASS sideswap-hooks-static-test (7/7 asercji)'); return 0; }
  fails.forEach(f => console.log('FAIL: ' + f));
  return 1;
}

process.exitCode = main();
