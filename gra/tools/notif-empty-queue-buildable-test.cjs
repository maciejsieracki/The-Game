'use strict';
/**
 * notif-empty-queue-buildable-test.cjs -- R-WEB-NOTIF-EMPTY-QUEUE-ONLY-BUILDABLE-Q1.
 * Reguła: powiadomienie „Produkcja: <miasto> — Kolejka pusta" tylko gdy gracz realnie może coś
 * wybudować. Bramka (cityHasActionableProduction) i odcisk (productionOptionsFingerprint) korzystają
 * z tych samych warunków; w oblężonym mieście werbunek jest zablokowany (jak w panelu rekrutacji).
 *  A. JEDNOSTKOWA: realne isCityUnderSiege (src/game/city-siege-state.ts, esbuild) -- miasto obleganie
 *     jest blokowane, zwykłe nie.
 *  B. STRUKTURALNA src/main.ts: bramka rekrutacji ORAZ odcisk mają guard isCityUnderSiege.
 *  C. MUTACJE kopii main.ts: usunięcie guardu z bramki albo z odcisku MUSI wywrócić B.
 * Run z gra/:  node tools/notif-empty-queue-buildable-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  [OK] ' + m); } else { fail++; console.log('  [FAIL] ' + m + (d ? ' -- ' + d : '')); } };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nebq1-'));

// Wycinek funkcji z main.ts od sygnatury do pierwszego "\n    }\n" (wcięcie 4 spacje, jak w boot()).
function fnBody(src, sig) {
  const start = src.indexOf(sig);
  if (start < 0) return null;
  const end = src.indexOf('\n    }\n', start);
  return end < 0 ? null : src.slice(start, end);
}
const GATE_SIG = 'function cityHasAffordableUnitRecruitment(';
const FP_SIG = 'function productionOptionsFingerprint(';
const GUARD = /isCityUnderSiege\(\[city\], city\)/;

function structural(src) {
  const gate = fnBody(src, GATE_SIG);
  const fp = fnBody(src, FP_SIG);
  return {
    gateGuard: !!gate && GUARD.test(gate),
    fpGuard: !!fp && GUARD.test(fp),
  };
}

console.log('A. JEDNOSTKOWA (realne isCityUnderSiege)');
{
  const entry = path.join(tmp, 'entry.ts'), out = path.join(tmp, 'bundle.cjs');
  fs.writeFileSync(entry, `export * from ${JSON.stringify(GRA + '/src/game/city-siege-state')};\n`);
  esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'error', absWorkingDir: GRA, nodePaths: [path.join(GRA, 'node_modules')] });
  const m = require(out);
  const besieged = { id: 'c1', ownerId: 0, q: 0, r: 0, oblegane: true };
  const free = { id: 'c2', ownerId: 0, q: 5, r: 5, oblegane: false };
  ok(m.isCityUnderSiege([besieged], besieged) === true, 'miasto oblegane: isCityUnderSiege = true');
  ok(m.isCityUnderSiege([free], free) === false, 'miasto nieoblegane: isCityUnderSiege = false');
}

console.log('B. STRUKTURALNA src/main.ts');
const mainSrc = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
const s = structural(mainSrc);
ok(s.gateGuard, 'bramka cityHasAffordableUnitRecruitment ma guard isCityUnderSiege([city], city)');
ok(s.fpGuard, 'productionOptionsFingerprint ma guard isCityUnderSiege([city], city) (spójność z bramką)');

console.log('C. MUTACJE kopii main.ts (każda musi wywrócić B)');
function mutate(tag, fromSig, toSig) {
  // Usuwa guard z wskazanej funkcji: zamienia w jej ciele wywołanie isCityUnderSiege na false.
  const body = fnBody(mainSrc, fromSig);
  if (!body) return null;
  const mutatedBody = body.replace(/isCityUnderSiege\(\[city\], city\)/, 'false');
  return mainSrc.replace(body, mutatedBody);
}
const mutGate = mutate('gate', GATE_SIG);
const mutFp = mutate('fp', FP_SIG);
ok(mutGate !== null && mutGate !== mainSrc, 'mutacja bramki: wzorzec guardu znaleziony w ciele funkcji');
ok(mutFp !== null && mutFp !== mainSrc, 'mutacja odcisku: wzorzec guardu znaleziony w ciele funkcji');
if (mutGate !== null) {
  const r = structural(mutGate);
  ok(!r.gateGuard && r.fpGuard, 'mutacja bramki wykryta przez test (gateGuard=false)');
}
if (mutFp !== null) {
  const r = structural(mutFp);
  ok(r.gateGuard && !r.fpGuard, 'mutacja odcisku wykryta przez test (fpGuard=false)');
}

fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\nRESULT: ${pass} pass / ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
