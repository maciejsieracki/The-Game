'use strict';
/**
 * era-war-vs-natural-war-concurrency-measure.cjs -- R-WEB-DIPLO-ERA-WAR-VS-NATURAL-WAR-CONCURRENCY-AUDIT-Q1.
 * Odczyt-only: pure-logic probe bramek wojen (war-rules-multiwar.ts, bramka main.ts `wypowiedz_wojne`).
 * NIE symuluje tur: sprawdza werdykt bramek dla scenariusza z raportu (cel AI w wojnie z inna cywilizacja
 * wojna epoki; inna AI wypowiada naturalna wojne temu celowi). Run from gra/:
 *   node tools/era-war-vs-natural-war-concurrency-measure.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA = path.resolve(__dirname, '..');
const out = path.join(os.tmpdir(), 'era-war-natural-probe-' + process.pid + '.cjs');
esbuild.buildSync({
  entryPoints: [path.join(GRA, 'src/game/war-rules-multiwar.ts')],
  bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'silent',
});
const m = require(out);
const P = m.WAR_RULES_PARAMS;
const EPOCH = { kamien: 1, braz: 2, zelazo: 3 };
const rows = [];
// Scenariusz A: cel AI (Chiny) ma 1 aktywna wojne (np. wojna epoki z graczem); napastnik AI (Rzym) 0 wojen.
for (const [name, ep] of Object.entries(EPOCH)) {
  for (const turn of [39, 60]) {
    const v = m.evaluateInterCivWarGate({
      turn, attackerEra: ep, attackerWarCount: 0,
      targetIsPlayer: false, targetEra: ep, targetWarCount: 1, eraTag: null,
    }, P);
    rows.push({ scenariusz: 'A natural: cel AI ma 1 wojne', epoka: name, tura: turn, werdykt: v });
  }
}
// Scenariusz B: napastnik AI ma 1 wojne, wypowiada naturalna wojne innej AI (cel 0 wojen).
for (const [name, ep] of Object.entries(EPOCH)) {
  const v = m.evaluateInterCivWarGate({
    turn: 60, attackerEra: ep, attackerWarCount: 1,
    targetIsPlayer: false, targetEra: ep, targetWarCount: 0, eraTag: null,
  }, P);
  rows.push({ scenariusz: 'B natural: napastnik AI ma 1 wojne', epoka: name, tura: 60, werdykt: v });
}
// Scenariusz C: licznik wojny epoki (per cywilizacja, per epoka) -- cel w Kamieniu juz ma wojne epoki.
rows.push({
  scenariusz: 'C era-cap: cel 5 ma wojne epoki Kamienia, napastnik 3 wolny',
  epoka: 'stone', tura: 60,
  werdykt: m.evaluateEraForcedWarGate({
    multiwarEnabled: true, tag: 'stone', declaredByTag: new Map(),
    counts: new Map([['5:1', 1]]), attackerId: 3, attackerEpoch: 1, targetId: 5, targetEpoch: 1,
  }, P),
});
for (const r of rows) console.log(JSON.stringify(r));
fs.unlinkSync(out);
