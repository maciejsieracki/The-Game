'use strict';
/**
 * R-WEB-AUTOIMPROVE-IRRIGATION-MAX-PCT-Q1 (AUTOIMPPCT, #186), odp. obrony Operatora na zarzut 3 Evaluatora:
 * jawne porownanie suwaka pracaAutoPercent 33% (PRZED) z 100% (maksimum) na tych samych ziarnach.
 *
 *   (a) domyslny poziom pomiaru = maksimum (100) — wynik bez PRACA_PCT rowna sie wynikowi z PRACA_PCT=100;
 *   (b) dla ziaren 1-4 (odkrycie w turze 10, 100 tur) zachodzi: starved = 0, orderViol = 0 przy 100%;
 *   (c) irygacja przy 100% nie opoznia sie wzgledem 33% o wiecej niz 2 tury (zmierzony zakres -2..+1 dla ziaren 1-14);
 *   (d) irygacja przy 100% powstaje w horyzoncie (afterDiscIrr != null).
 *
 * Uruchomienie: node gra/tools/autoimprove-max-pct-test.cjs   (wymaga gra/node_modules: esbuild)
 */
const path = require('path');
const { spawnSync } = require('child_process');

const BISECT = path.resolve(__dirname, 'autoimprove-pasture-irrigation-q2-bisect.cjs');
let passed = 0, failed = 0;
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.error('  [FAIL] ' + msg); }
}

function measure(seed, pct) {
  const env = { ...process.env, SEED: String(seed), DISC_PAST: '10', DISC_IRR: '10', TURNS: '100' };
  if (pct == null) delete env.PRACA_PCT; else env.PRACA_PCT = String(pct);
  const r = spawnSync(process.execPath, [BISECT], { env, encoding: 'utf8', maxBuffer: 1 << 26 });
  const line = (r.stdout || '').trim().split('\n').filter(Boolean).pop();
  if (r.status !== 0 || !line) throw new Error(`bisect seed=${seed} pct=${pct} padl (status ${r.status}): ${(r.stderr || '').slice(0, 300)}`);
  return JSON.parse(line);
}

console.log('AUTOIMPPCT: suwak 100% (maksimum) vs 33% (PRZED), ziarna 1-4');
const SEEDS = [1, 2, 3, 4];
const defaultRun = measure(1, null);
const max1 = measure(1, 100);
ok(defaultRun.afterDiscIrr === max1.afterDiscIrr && defaultRun.firstIrr === max1.firstIrr,
  `(a) domyslny poziom = 100 (ziarno 1: domyslnie ${defaultRun.afterDiscIrr} tur, PRACA_PCT=100 ${max1.afterDiscIrr} tur)`);

let worstDelta = -Infinity;
for (const s of SEEDS) {
  const hi = s === 1 ? max1 : measure(s, 100);
  const lo = measure(s, 33);
  console.log(`  ziarno ${s}: 100% = ${hi.afterDiscIrr} tur, 33% = ${lo.afterDiscIrr} tur, starved(100%)=${hi.starved}, orderViol(100%)=${hi.orderViol}`);
  ok(hi.starved === 0 && hi.orderViol === 0, `(b) ziarno ${s} przy 100%: starved=0, naruszen kolejnosci=0`);
  ok(hi.afterDiscIrr != null, `(d) ziarno ${s} przy 100%: irygacja powstaje w horyzoncie`);
  if (hi.afterDiscIrr != null && lo.afterDiscIrr != null) worstDelta = Math.max(worstDelta, hi.afterDiscIrr - lo.afterDiscIrr);
}
ok(worstDelta <= 2, `(c) irygacja przy 100% nie opoznia sie wzgledem 33% o wiecej niz 2 tury (najgorzej +${worstDelta})`);

console.log(`\nwynik: ${passed} OK / ${failed} FAIL`);
process.exit(failed ? 1 : 0);
