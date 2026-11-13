'use strict';
/* Pomiar R-WEB-DIPLO-RESPECT-VS-POWER-AFTER-WAR-AUDIT-Q1 (runda 3).
 * Uruchom: node dyspozycje/autobot/runs/R-WEB-DIPLO-RESPECT-VS-POWER-AFTER-WAR-AUDIT-Q1/evidence/sim-respekt-wojna.cjs
 * Bundluje silnik (gra/src/game/diplomacy.ts) esbuildem z gra/node_modules. */
const path = require('path');
const fs = require('fs');
const RUN = __dirname;
const WT = path.resolve(RUN, '..', '..', '..', '..', '..');
const esbuild = require(path.join(WT, 'gra', 'node_modules', 'esbuild'));
const BUNDLE = path.join(RUN, '.sim-bundle.cjs');
esbuild.buildSync({
  entryPoints: [path.join(RUN, 'entry.ts')], bundle: true, platform: 'node', format: 'cjs',
  outfile: BUNDLE, logLevel: 'silent',
});
const E = require(BUNDLE);
const out = [];
const log = (s = '') => { out.push(s); console.log(s); };

// --- A. Składowe Zaufania w wojnie (computeTickZaufanieDelta, atWar=true) ---
log('## A. Składowe ΔZaufania/turę w wojnie (computeTickZaufanieDelta)');
const base = { turn: 10, aktywnyHandel: false, dobraWolaAktywna: false, wspolnyWrog: false,
  wspolnaReligia: false, odmiennaReligia: false, karaWspolnaGranica: false,
  wiarygodnoscSelf: undefined };
const cases = [
  ['brak granicy, brak religii', {}],
  ['granica, epoka <Brąz (−2)', { karaWspolnaGranica: true, karaWspolnaGranicaDelta: -2 }],
  ['granica, epoka Brąz (−3)', { karaWspolnaGranica: true, karaWspolnaGranicaDelta: -3 }],
  ['granica −2 + wspólna religia +0,5', { karaWspolnaGranica: true, karaWspolnaGranicaDelta: -2, wspolnaReligia: true }],
  ['granica −3 + wspólny wróg +1 + wspólna religia +0,5', { karaWspolnaGranica: true, karaWspolnaGranicaDelta: -3, wspolnyWrog: true, wspolnaReligia: true }],
  ['granica −2 + odmienna religia −0,5', { karaWspolnaGranica: true, karaWspolnaGranicaDelta: -2, odmiennaReligia: true }],
  ['tylko wspólny wróg +1 (w wojnie dZ>0 → 0)', { wspolnyWrog: true }],
];
for (const [label, patch] of cases) {
  const dz = E.computeTickZaufanieDelta({ ...base, ...patch }, true);
  log(`- ${label}: ΔZ = ${dz}`);
}
log(`- sharedBorderPenaltyForEpochs(0,0)=${E.sharedBorderPenaltyForEpochs(0, 0)}, (2,0)=${E.sharedBorderPenaltyForEpochs(2, 0)}, (3,1)=${E.sharedBorderPenaltyForEpochs(3, 1)}`);
log('');

// --- B. Trajektoria 30 tur wojny: gracz 10x silniejszy ---
const liveR = E.computeRespekt(100, 10);
log('## B. Trajektoria 30 tur wojny (tickDiplomacy, status=wojna, granica −2, wspólna religia +0,5)');
log(`Respekt LIVE (computeRespekt(100,10)) = ${liveR}  (kierunek poprawny: silniejszy > 50)`);
log('');
log('| tura | Z | R (zapisany) | Relacja=Z+R | Respekt LIVE | ΔZ/turę |');
log('|---|---|---|---|---|---|');
let rel = { zaufanie: 40, respekt: 30, status: 'wojna' };
const ctxFor = t => ({ turn: t, karaWspolnaGranica: true, karaWspolnaGranicaDelta: -2, wspolnaReligia: true, wiarygodnoscSelf: undefined });
for (let t = 1; t <= 30; t++) {
  const dz = E.computeTickZaufanieDelta(ctxFor(t), true);
  rel = E.tickDiplomacy(rel, ctxFor(t));
  if (t <= 5 || t % 5 === 0) {
    log(`| ${t} | ${rel.zaufanie} | ${rel.respekt} | ${rel.zaufanie + rel.respekt} | ${liveR} | ${dz} |`);
  }
}
log('');

// --- C. Czy zdarzenia militarne (+5/+15) przebijają limit wojenny? ---
log('## C. Zdarzenia militarne w wojnie (applyDiplomaticEvent + tick)');
const r2 = { zaufanie: 0, respekt: 29, status: 'wojna' };
for (const [ev, lbl] of [['wygrana_bitwa', 'Respekt +5'], ['przewaga_militarna', 'Respekt +15']]) {
  const after = E.applyDiplomaticEvent(r2, ev, undefined, undefined);
  const ticked = E.tickDiplomacy(after, ctxFor(1));
  log(`- ${ev} (${lbl}): po zdarzeniu R=${after.respekt}, po ticku R=${ticked.respekt}, Z=${ticked.zaufanie} (limit wojenny: Z+R<=29)`);
}
let r3 = { zaufanie: 0, respekt: 29, status: 'wojna' };
for (let t = 1; t <= 30; t++) {
  r3 = E.applyDiplomaticEvent(r3, 'wygrana_bitwa', undefined, undefined);
  r3 = E.tickDiplomacy(r3, ctxFor(t));
}
log(`- 30 x wygrana_bitwa (+5) z tickiem wojny: R koncowe=${r3.respekt}, Z=${r3.zaufanie}, Z+R=${r3.zaufanie + r3.respekt}`);
log('');
fs.writeFileSync(path.join(RUN, 'wynik-pomiaru.txt'), out.join('\n') + '\n');
