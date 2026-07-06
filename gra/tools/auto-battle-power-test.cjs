'use strict';
/**
 * auto-battle-power-test.cjs — kanon v2b (p_atk/p_def, lustro przegranego).
 * Run: node gra/tools/auto-battle-power-test.cjs
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.auto-battle-entry.ts');
const BUNDLE = path.join(__dirname, '.auto-battle-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `
import { resolveAutoBattleByPower, sumRosterFieldM, lineWeightForDef, autoBattleWinPct } from '../src/game/auto-battle-power';
import { loadAutoBattleParams } from '../src/game/auto-battle-params';
export { resolveAutoBattleByPower, sumRosterFieldM, lineWeightForDef, autoBattleWinPct, loadAutoBattleParams };
`,
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const {
  resolveAutoBattleByPower,
  loadAutoBattleParams,
  autoBattleWinPct,
} = require(BUNDLE);

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.error('FAIL:', msg);
  }
}

const p = loadAutoBattleParams();
assert(p.L_MAX === 0.42, 'L_MAX from JSON');
assert(p.p_atk === 0.58, 'p_atk from JSON');

const r15 = resolveAutoBattleByPower({ mAtk: 150, mDef: 100, rng: () => 1 });
assert(r15.winner === 'attacker', '150 vs 100 attacker wins');
assert(Math.abs(r15.lossAtkPct - 0.332) < 0.02, 'ATK loss ~33% at R=1.5');
assert(Math.abs(r15.lossDefPct - 0.668) < 0.02, 'DEF loss ~67% at R=1.5');

const r5 = resolveAutoBattleByPower({ mAtk: 500, mDef: 100, rng: () => 1 });
assert(r5.winner === 'attacker', '500 vs 100 attacker wins');
assert(r5.lossDefPct > 0.8, 'DEF loss >80% at R=5');
assert(r5.lossAtkPct < 0.2, 'ATK loss <20% at R=5');

const tie = resolveAutoBattleByPower({ mAtk: 100, mDef: 100, rng: () => 0 });
assert(tie.winner === 'tie', '100 vs 100 remis');
assert(tie.lossAtkPct === 0.4, 'remis 40%');

assert(autoBattleWinPct(50, 45) === 53, 'Hastati vs Falanga ~53% ATK');
assert(autoBattleWinPct(100, 100) === 50, 'rownowaga 50%');
assert(autoBattleWinPct(0, 80) === 0, 'zero ATK');
assert(autoBattleWinPct(80, 0) === 100, 'zero DEF');

console.log(`auto-battle-power-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
