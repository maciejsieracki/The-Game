'use strict';
/**
 * praca-routing-effective-unit-test.cjs -- R-WEB-WORK-POOL-ACCUMULATES-DESPITE-100-BUILDINGS-Q1 (obrona r1, zarzut 3).
 * Czysty test `effectivePracaRouting` vs `pracaImperialPoolGain` (zrodlo prawdy ticku), warianty:
 * kolejka pusta/niepusta x wstrzymana x podzial 100/90/50/0. Wstrzymana => tick nie ksieguje nic (0/0).
 * Usage (z gra/): node tools/praca-routing-effective-unit-test.cjs
 */
const path = require('path');
const os = require('os');
const fs = require('fs');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'civ-routing-')), 'p.cjs');
esbuild.buildSync({ entryPoints: [path.resolve(__dirname, '..', 'src', 'game', 'production.ts')], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'error' });
const P = require(out);
let pass = 0, fail = 0;
const ok = (l, c, d) => { if (c) { pass++; console.log('  OK  ' + l); } else { fail++; console.error(' FAIL ' + l + (d !== undefined ? ' -- ' + JSON.stringify(d) : '')); } };
for (const praca of [6, 8, 13]) for (const pct of [100, 90, 50, 0]) {
  const split = P.splitPraca(praca, pct / 100);
  for (const queueEmpty of [false, true]) for (const paused of [false, true]) {
    const tag = `praca=${praca} ${pct}% pusta=${queueEmpty} wstrz=${paused}`;
    const r = P.effectivePracaRouting(split, queueEmpty, paused);
    // Zrodlo prawdy ticku: wstrzymana => pracaImperialPoolGain nie jest wolane (0 do puli, 0 do budynkow).
    const tickPool = paused ? 0 : P.pracaImperialPoolGain(split, queueEmpty);
    const tickBud = (!paused && !queueEmpty) ? split.doBudynkow : 0;
    ok(`${tag}: doPuli == przyrost puli w ticku (${r.doPuli} vs ${tickPool})`, r.doPuli === tickPool, r);
    ok(`${tag}: doBudynkow == Praca do kolejki w ticku (${r.doBudynkow} vs ${tickBud})`, r.doBudynkow === tickBud, r);
    if (!paused) ok(`${tag}: suma == cala Praca`, r.doPuli + r.doBudynkow === split.total, r);
    if (!paused && !queueEmpty && pct === 100) ok(`${tag}: 100% budynki, kolejka niepusta => 0 do puli`, r.doPuli === 0, r);
  }
}
fs.rmSync(path.dirname(out), { recursive: true, force: true });
console.log(`\n[praca-routing-effective-unit] pass=${pass} fail=${fail}`);
process.exit(fail ? 1 : 0);
