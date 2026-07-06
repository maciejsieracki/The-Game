'use strict';
/** diplomacy-proposal-test.cjs — v1.1 evaluateProposal (15 scenariuszy) */
const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch { console.error('esbuild missing'); process.exit(1); }
})();

const BUNDLE = path.resolve(__dirname, '.dip-proposal-bundle.cjs');
const entryFile = path.resolve(__dirname, '.dip-proposal-entry.ts');
fs.writeFileSync(entryFile, `
export {
  evaluateProposal, applyAcceptedProposal, aiCommandToPendingProposal,
  makeDealId,
} from '../src/game/diplomacy-proposals.ts';
export { addTreaty, hasTreaty, treatiesBrokenByWar } from '../src/game/diplomacy-treaties.ts';
`);

esbuild.buildSync({
  entryPoints: [entryFile],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});

const {
  evaluateProposal, applyAcceptedProposal, aiCommandToPendingProposal,
  addTreaty, hasTreaty, treatiesBrokenByWar,
} = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  OK:', m); } else { fail++; console.error('  FAIL:', m); } }

function rel(z = 50, r = 50, status = 'pokoj') {
  return { zaufanie: z, respekt: r, status };
}
function ctx(over = {}) {
  return {
    relation: rel(60, 50),
    stanWojny: false,
    turn: 10,
    proposerRespekt: 40,
    responderRespekt: 60,
    militaryRatio: 1,
    ...over,
  };
}
function prop(actionId, a = 0, b = 1, payload = {}) {
  return { actionId, proposerOwnerId: a, responderOwnerId: b, payload };
}

console.log('diplomacy-proposal-test');

// 1 NAP accept — Relacja >= 110
let r = evaluateProposal(prop('nap', 0, 1, { turns: 15 }), ctx({ relation: rel(60, 50) }));
ok(r.accepted && r.deal?.rodzaj === 'pakt_nieagresji', 'NAP accept relacja 110');

// 2 NAP reject low relacja
r = evaluateProposal(prop('nap'), ctx({ relation: rel(50, 59) }));
ok(!r.accepted, 'NAP reject relacja 109');

// 3 NAP reject border expansion
r = evaluateProposal(prop('nap'), ctx({ ekspansjaPrzyGranicy: true }));
ok(!r.accepted, 'NAP reject ekspansja');

// 4 Sojusz pełny accept (równowaga — Zauf >90, Relacja >150)
r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(96, 56),
  militaryRatio: 1,
}));
ok(r.accepted && r.deal?.rodzaj === 'sojusz_pelny', 'sojusz pełny accept');

// 4a Sojusz reject — Relacja dokładnie 150 (≤150)
r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(95, 55),
  militaryRatio: 1,
}));
ok(!r.accepted, 'sojusz reject relacja 150');

// 4b Sojusz reject — równowaga Zauf 75 (<91)
r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(75, 50),
  militaryRatio: 1,
}));
ok(!r.accepted, 'sojusz reject równowaga zauf 75');

// 5 Sojusz reject low trust (słaby proponent, bez premii siły)
r = evaluateProposal(prop('sojusz_defensywny'), ctx({ relation: rel(50, 60), militaryRatio: 0.4 }));
ok(!r.accepted, 'sojusz reject zaufanie 50 słaby proponent');

// 5b Sojusz accept — silny proponent obniża progi Zauf., nie Rel. (<151)
r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(95, 58),
  militaryRatio: 2.5,
  proposerRespekt: 71,
  responderRespekt: 29,
}));
ok(r.accepted && r.deal?.rodzaj === 'sojusz_pelny', 'sojusz silny proponent premia siły');

// 5c Sojusz — gracz 3× silniejszy, Zauf od 83, Relacja ≥151
r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(90, 62),
  militaryRatio: 3,
  proposerRespekt: 75,
  responderRespekt: 25,
}));
ok(r.accepted, 'sojusz gracz 3× silniejszy zauf 90 rel 152');

r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(85, 66),
  militaryRatio: 3,
  proposerRespekt: 75,
  responderRespekt: 25,
}));
ok(r.accepted, 'sojusz gracz 3× silniejszy zauf 85 rel 151');

r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(90, 60),
  militaryRatio: 3,
  proposerRespekt: 75,
  responderRespekt: 25,
}));
ok(!r.accepted, 'sojusz reject gracz 3× rel 150');

// 5c2 — gracz 2×: sojusz od 85 Zauf., Rel ≥151
r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(91, 61),
  militaryRatio: 2,
  proposerRespekt: 67,
  responderRespekt: 33,
}));
ok(r.accepted, 'sojusz gracz 2× silniejszy zauf 91 rel 152');

r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(85, 66),
  militaryRatio: 2,
  proposerRespekt: 67,
  responderRespekt: 33,
}));
ok(r.accepted, 'sojusz gracz 2× silniejszy zauf 85 rel 151');

r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(85, 65),
  militaryRatio: 2,
  proposerRespekt: 67,
  responderRespekt: 33,
}));
ok(!r.accepted, 'sojusz reject gracz 2× rel 150');

// 5d Sojusz — gracz 2× silniejszy, wysokie zaufanie, Rel >150
r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(100, 52),
  militaryRatio: 2,
  proposerRespekt: 67,
  responderRespekt: 33,
}));
ok(r.accepted, 'sojusz gracz 2× silniejszy zauf 100 rel 152');

// 5d Hegemon — AI 3× silniejsze, nawet max zaufanie
r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(100, 75),
  militaryRatio: 0.33,
  proposerRespekt: 25,
  responderRespekt: 75,
}));
ok(!r.accepted && r.reason.includes('Hegemon'), 'sojusz reject hegemon AI 3× zauf 100');

// 5e AI 2× silniejsze — wymaga bardzo wysokiego zaufania (minZ≈105)
r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(100, 67),
  militaryRatio: 0.5,
  proposerRespekt: 33,
  responderRespekt: 67,
}));
ok(!r.accepted, 'sojusz reject AI 2× zauf 100 (kara siły respondenta)');

r = evaluateProposal(prop('sojusz_pelny'), ctx({
  relation: rel(50, 67),
  militaryRatio: 0.5,
  proposerRespekt: 33,
  responderRespekt: 67,
}));
ok(!r.accepted, 'sojusz reject AI 2× zauf 50');

// 6 Trybut żądanie — Respekt > 70
r = evaluateProposal(prop('trybut_zadanie', 0, 1, { goldPerTurn: 15 }), ctx({
  proposerRespekt: 80,
  responderRespekt: 40,
}));
ok(r.accepted && r.deal?.ekonomia?.pieniadzePerTura === 15, 'trybut żądanie accept');

// 6b Trybut żądanie reject — Respekt dokładnie 70
r = evaluateProposal(prop('trybut_zadanie', 0, 1, { goldPerTurn: 15 }), ctx({
  proposerRespekt: 70,
  responderRespekt: 30,
}));
ok(!r.accepted, 'trybut żądanie reject Respekt 70');

// 7 Trybut żądanie reject — słabszy
r = evaluateProposal(prop('trybut_zadanie', 0, 1, { goldPerTurn: 15 }), ctx({
  proposerRespekt: 30,
  responderRespekt: 70,
}));
ok(!r.accepted, 'trybut żądanie reject słabszy');

// 8 Trybut oferta near war
r = evaluateProposal(prop('trybut_oferta', 0, 1, { goldOnce: 50 }), ctx({
  relation: rel(25, 30),
  militaryRatio: 1.5,
}));
ok(r.accepted && r.oneShotTrade, 'trybut oferta jednorazowy');

// 9 Handel fair (strict PN W4-A)
r = evaluateProposal(prop('handel', 0, 1, { givePn: 100, receivePn: 100 }), ctx({
  relation: rel(55, 50),
}));
ok(r.accepted && r.oneShotTrade, 'handel fair strict PN');

// 9a Handel reject Rel 99
r = evaluateProposal(prop('handel', 0, 1, { goldOnce: 100 }), ctx({
  relation: rel(50, 49),
  fairTradeValue: 100,
}));
ok(!r.accepted, 'handel reject relacja 99');

// 9b Handel accept Rel 100
r = evaluateProposal(prop('handel', 0, 1, { givePn: 100, receivePn: 100 }), ctx({
  relation: rel(50, 50),
}));
ok(r.accepted, 'handel accept relacja 100');

// 10 Handel unfair (strict PN W4-A)
r = evaluateProposal(prop('handel', 0, 1, { givePn: 50, receivePn: 100 }), ctx({ relation: rel(55, 50) }));
ok(!r.accepted, 'handel reject unfair PN');

// 11 Namów wojna
r = evaluateProposal(prop('namow_wojne', 0, 1, { targetOwnerId: 2, bribeGold: 60 }), ctx({
  relation: rel(55, 50),
  epoka: 1,
}));
ok(r.accepted, 'namów wojna + łapówka');

// 12 Tech sell
r = evaluateProposal(prop('tech', 0, 1, { techId: 'kolba', techPrice: 80 }), ctx({
  relation: rel(75, 50),
  techMinPrice: 50,
}));
ok(r.accepted, 'tech sprzedaż');

// 13 Granice wojskowe
r = evaluateProposal(prop('granice', 0, 1, { borderMilitary: true }), ctx({
  relation: rel(50, 60),
  responderRespekt: 60,
}));
ok(r.accepted && r.deal?.rodzaj === 'prawo_wojskowe_przemarszu', 'granice wojskowe');

// 14 applyAcceptedProposal + treatiesBrokenByWar
let deals = applyAcceptedProposal([], r);
deals = addTreaty(deals, {
  id: 'nap-x', rodzaj: 'pakt_nieagresji', strony: [0, 1], wygasaTura: 20,
});
const broken = treatiesBrokenByWar(deals, 0, 1);
ok(broken.length >= 1, 'wojna zerwie traktaty pary');

// 15 AI pending sojusz
const pending = aiCommandToPendingProposal(
  { type: 'zaproponuj_sojusz', targetId: 'p1', powod: 'test' },
  2, 0, 10,
);
ok(pending?.actionId === 'sojusz_pelny' && pending.fromOwnerId === 2, 'AI pending sojusz');

console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
