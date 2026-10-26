'use strict';

/**
 * R-WEB-WAR-EPOCH-PLAYER-FIRST-Q1 — testy czystych funkcji (Z1/Z3/Z4/Z5, K1).
 * Bundlowane esbuildem z src/game/forced-war-common.ts i src/game/war-rules-multiwar.ts.
 * Uruchamianie z gra/: node tools/war-epoch-player-first-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const scratch = path.resolve(__dirname, '.war-epoch-player-first-entry.ts');
const bundle = path.resolve(__dirname, '.war-epoch-player-first-bundle.cjs');
fs.writeFileSync(scratch, `
export { assignForcedWarPairings } from '../src/game/forced-war-common';
export { canDeclareEraForcedWar, isWarEpochPlayerFirstEnabled, setWarEpochPlayerFirstOverride, WAR_RULES_PARAMS } from '../src/game/war-rules-multiwar';
`);
esbuild.buildSync({ entryPoints: [scratch], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: bundle, logLevel: 'silent' });
const C = require(bundle);
fs.unlinkSync(scratch);
fs.unlinkSync(bundle);

let passed = 0;
let failed = 0;
function ok(value, message) {
  if (value) passed++;
  else { failed++; console.error('FAIL:', message); }
}

const dist = (aq, ar, bq, br) => Math.max(Math.abs(aq - bq), Math.abs(ar - br), Math.abs((aq + ar) - (bq + br)));
const subj = (ownerId, q, r, era) => ({ ownerId, q, r, era });
const PLAYER = subj(0, 0, 0, undefined);
const noBlock = () => false;
const gateOpen = () => true;
const freeWar = () => 0;
const findAssign = (res, ownerId) => res.assignments.filter(a => a.ownerId === ownerId);

function run(subjects, opts) {
  return C.assignForcedWarPairings(subjects, [], {
    isPairBlocked: noBlock,
    hexDistanceFn: dist,
    totalActiveForcedWarsByOwner: freeWar,
    ...opts,
  });
}
const pf = (gate = gateOpen) => ({ playerFirst: { playerOwnerId: 0, isPlayerPairGateOpen: gate } });
const pfc = (candidates, extra = {}) => ({ ...extra, playerFirst: { playerOwnerId: 0, isPlayerPairGateOpen: gateOpen, candidates } });

// Z1/Z3: gracz dostaje NAJBLIŻSZĄ cywilizację z puli.
{
  const subjects = [PLAYER, subj(1, 5, 0, 'stone'), subj(2, 2, 0, 'stone'), subj(3, 3, 3, 'stone')];
  const res = run(subjects, pf());
  const pa = findAssign(res, 2);
  ok(pa.length === 1 && pa[0].targetId === 0 && pa[0].era === 'stone', 'Z1: najbliższy AI (2) celuje w gracza');
  ok(findAssign(res, 0).length === 0, 'Z1: gracz nigdy nie jest stroną akcji (ownerId 0 bez wpisu)');
  ok(!findAssign(res, 1).some(a => a.targetId === 0) && !findAssign(res, 3).some(a => a.targetId === 0), 'Z1: pozostali AI nie celują w gracza');
  ok(findAssign(res, 1).length === 1 && findAssign(res, 1)[0].targetId === 3, 'Z1: reszta paruje się między sobą (1<->3)');
  ok(findAssign(res, 3).length === 1 && findAssign(res, 3)[0].targetId === 1, 'Z1: para 3->1 symetryczna');
  ok(res.unresolvedOwnerIds.length === 0, 'Z1: brak unresolved');
}

// Mutacja-najdalszy: wybór musi być najbliższym (dist 1), nie najdalszym (dist 9).
{
  const subjects = [PLAYER, subj(1, 9, 0, 'stone'), subj(2, 1, 0, 'stone')];
  const res = run(subjects, pf());
  ok(findAssign(res, 2).some(a => a.targetId === 0), 'mutacja-najbliższy: wybór 2 (dist 1), nie 1 (dist 9)');
  ok(!findAssign(res, 1).some(a => a.targetId === 0), 'mutacja-najdalszy: 1 nie celuje w gracza');
}

// Remis dystansu -> niższy ownerId.
{
  const subjects = [PLAYER, subj(7, 2, 0, 'bronze'), subj(4, 0, 2, 'bronze')];
  const res = run(subjects, pf());
  ok(findAssign(res, 4).some(a => a.targetId === 0), 'remis dystansu: niższy ownerId (4)');
}

// Z4: para z graczem zablokowana NAP/sojuszem -> następny najbliższy.
{
  const subjects = [PLAYER, subj(2, 1, 0, 'stone'), subj(1, 4, 0, 'stone')];
  const res = run(subjects, { ...pf(), isPairBlocked: (a, b) => (a === 0 && b === 2) || (a === 2 && b === 0) });
  ok(findAssign(res, 1).some(a => a.targetId === 0), 'Z4: zablokowany najbliższy (2) -> wybrany następny (1)');
}

// Z4 (R2 po stronie AI): bramka zamknięta -> pomijamy kandydata.
{
  const subjects = [PLAYER, subj(2, 1, 0, 'stone'), subj(1, 4, 0, 'stone')];
  const res = run(subjects, pf((id) => id !== 2));
  ok(findAssign(res, 1).some(a => a.targetId === 0), 'Z4: AI z zamkniętą bramką R2 odpada, wybór kolejnego');
}

// Z3: brak kandydata -> gracz bez pary, bez pending (brak unresolved).
{
  const subjects = [PLAYER, subj(2, 1, 0, 'stone')];
  const res = run(subjects, pf((id) => id !== 2));
  ok(res.assignments.length === 0, 'brak kandydata: brak przydziału gracza');
  ok(!res.unresolvedOwnerIds.includes(0), 'brak kandydata: gracz NIE trafia do unresolved (brak pending)');
}

// Brak gracza w puli (K2 OFF lub gracz nieaktywny) -> pary AI bez zmian.
{
  const subjects = [subj(1, 0, 0, 'stone'), subj(2, 2, 0, 'stone')];
  const res = run(subjects, pf());
  ok(findAssign(res, 1).length === 1 && findAssign(res, 1)[0].targetId === 2, 'bez gracza: AI 1<->2 jak dotąd');
  ok(findAssign(res, 2).length === 1 && findAssign(res, 2)[0].targetId === 1, 'bez gracza: AI 2 -> 1');
}

// AI już w wojnie wymuszonej nie jest w puli warless -> nie zostaje partnerem gracza.
{
  const subjects = [PLAYER, subj(2, 1, 0, 'stone'), subj(1, 4, 0, 'stone')];
  const res = run(subjects, { ...pf(), totalActiveForcedWarsByOwner: (id) => (id === 2 ? 1 : 0) });
  ok(findAssign(res, 1).some(a => a.targetId === 0), 'AI w wojnie wymuszonej odpada z puli gracza');
}

// K1: wynik deterministyczny, brak warunku odkrycia w wejściu funkcji.
{
  const subjects = [PLAYER, subj(2, 1, 0, 'stone')];
  const a = run(subjects, pf());
  const b = run(subjects, pf());
  ok(JSON.stringify(a) === JSON.stringify(b) && findAssign(a, 2).length === 1, 'K1: wynik deterministyczny, brak warunku odkrycia');
}

// Bez playerFirst (flaga OFF) gracz nie generuje wpisu z ownerId 0.
{
  const subjects = [PLAYER, subj(1, 9, 0, 'stone'), subj(2, 1, 0, 'stone')];
  const res = run(subjects, {});
  ok(res.assignments.every(a => a.ownerId !== 0), 'flaga OFF: brak wpisu z ownerId 0');
}

// Z5: limit funkcji bez zmian (baza); omijanie R3 w main.ts tylko dla aktora z przydziałem tej tury.
{
  const declared = new Map([['stone', 1]]);
  ok(C.canDeclareEraForcedWar('stone', declared, C.WAR_RULES_PARAMS) === false, 'Z5: po jednej wojnie -> blokada funkcji (baza)');
  ok(C.canDeclareEraForcedWar('bronze', declared, C.WAR_RULES_PARAMS) === true, 'Z5: inna epoka ma własny licznik');
  ok(C.canDeclareEraForcedWar('stone', new Map(), C.WAR_RULES_PARAMS) === true, 'Z5: pierwsza wojna epoki zawsze dozwolona');
}

// Flaga: domyślnie ON, override działa.
{
  ok(C.isWarEpochPlayerFirstEnabled() === true, 'flaga WAR_EPOCH_PLAYER_FIRST_ENABLED domyślnie ON');
  C.setWarEpochPlayerFirstOverride(false);
  ok(C.isWarEpochPlayerFirstEnabled() === false, 'override OFF');
  C.setWarEpochPlayerFirstOverride(null);
}

// D1 (r2): partner = NAJBLIŻSZA cywilizacja z listy kandydatów (wszystkie major AI), także spoza puli warless.
{
  const candidates = [subj(2, 1, 0, 'stone'), subj(1, 6, 0, 'stone')]; // 2 spoza puli, 1 w puli
  const subjects = [PLAYER, subj(1, 6, 0, 'stone')];
  const res = run(subjects, pfc(candidates));
  const pa = findAssign(res, 2);
  ok(pa.length === 1 && pa[0].targetId === 0 && pa[0].era === 'stone', 'D1: partner spoza puli (2, dist 1) dostaje parę z graczem');
  ok(res.playerFirstPartnerId === 2, 'D1: playerFirstPartnerId zwraca partnera 2');
  ok(!findAssign(res, 1).some(a => a.targetId === 0), 'D1: dalszy AI (1, w puli) nie celuje w gracza');
}

// D1 mutacja „ograniczenie partnera do puli”: bez kandydatów (pula) partner spoza puli NIE jest wybrany.
{
  const subjects = [PLAYER, subj(1, 6, 0, 'stone')];
  const res = run(subjects, pf());
  ok(res.playerFirstPartnerId === 1, 'D1 mutacja-pula: bez candidates wybór ograniczony do puli (1)');
  const resNone = run([PLAYER], pf());
  ok(resNone.playerFirstPartnerId === null, 'D1: brak kandydatów -> playerFirstPartnerId null');
}

// D1: kandydat już w wojnie wymuszonej (totalActive>0) odpada -> następny najbliższy.
{
  const candidates = [subj(2, 1, 0, 'stone'), subj(3, 4, 0, 'stone')];
  const res = run([PLAYER], pfc(candidates, { totalActiveForcedWarsByOwner: (id) => (id === 2 ? 1 : 0) }));
  ok(res.playerFirstPartnerId === 3, 'D1: kandydat z aktywną wojną wymuszoną (2) odpada, wybór 3');
}

// D1: kandydat bez ery (poza epokami 1-3) nie jest partnerem.
{
  const candidates = [subj(2, 1, 0, undefined), subj(3, 4, 0, 'bronze')];
  const res = run([PLAYER], pfc(candidates));
  ok(res.playerFirstPartnerId === 3 && findAssign(res, 3)[0]?.era === 'bronze', 'D1: kandydat bez ery odpada, partner 3 (bronze)');
}

// D1: remis dystansu między kandydatami spoza puli -> niższy ownerId.
{
  const candidates = [subj(9, 0, 2, 'iron'), subj(4, 2, 0, 'iron')];
  const res = run([PLAYER], pfc(candidates));
  ok(res.playerFirstPartnerId === 4, 'D1: remis dystansu spoza puli -> niższy ownerId (4)');
}

// D2 (r2): partner zapisany w wyniku = pierwszy do wypowiedzenia w pętli AI (lead); bez gracza -> null.
{
  const res = run([PLAYER, subj(5, 2, 0, 'stone'), subj(6, 3, 0, 'stone')], pfc([subj(5, 2, 0, 'stone'), subj(6, 3, 0, 'stone')]));
  ok(res.playerFirstPartnerId === 5, 'D2: lead pary gracza = najbliższy (5)');
  const resOff = run([subj(5, 2, 0, 'stone'), subj(6, 3, 0, 'stone')], {});
  ok(resOff.playerFirstPartnerId === null, 'D2: flaga OFF (bez playerFirst) -> lead null');
}

console.log(`war-epoch-player-first-test: ${passed} pass / ${failed} fail`);
if (failed > 0) process.exit(1);
