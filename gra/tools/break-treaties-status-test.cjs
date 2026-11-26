'use strict';
/**
 * break-treaties-status-test.cjs — R-WEB-BREAK-TREATIES-STATUS-Q1 (tag BREAKTREATIES, #169).
 * Run from gra/:  ESBUILD_PATH=/abs/path/node_modules/esbuild node tools/break-treaties-status-test.cjs
 * (lub: npm install w gra/, wtedy ESBUILD_PATH nie jest potrzebne)
 *
 * Pytanie badawcze: czy po wypowiedzeniu wojny (breakTreatiesOnWar i jego wywołania w main.ts)
 * relacja pary może zostać w statusie „sojusz” / z żywą umową sojuszu lub handlu?
 *
 * Pokrywa:
 *  A) czysta logika (diplomacy-treaties.ts, bundle esbuild): po treatiesBrokenByWar + removeTreatiesById
 *     para nie ma żadnej umowy z BREAK_ON_WAR, niezależnie od kolejności stron (addTreaty sortuje);
 *     umowy innej pary przeżywają; sojusz i handel są w zbiorze zrywanych;
 *  B) mutacja kontrolna A: bez usunięcia umów (identity) inwariant A PADA (test nie jest pusty);
 *  C) main.ts (text-check, main.ts nie jest ładowalny w node): breakTreatiesOnWar ma dokładnie
 *     6 wywołań produkcyjnych (lista zatwierdzona w tym teście); KAŻDE jest zakończone ustawieniem
 *     statusu 'wojna' zdarzeniem 'wojna_wypowiedziana' PO wywołaniu i odczytem relacji PO wywołaniu;
 *  D) main.ts: w ciele breakTreatiesOnWar usunięcie umów (removeTreatiesById) jest PRZED wczesnym
 *     wyjściem `if (opts?.bezKary) return;` (ścieżka casus belli nie zostawia żywych umów);
 *  E) mutacje czerwone main.ts (in-memory): usunięcie removeTreatiesById, usunięcie ustawienia wojny
 *     po wywołaniu, przestawienie bezKary przed usunięciem — każda MUSI być wykryta przez C/D.
 */
const fs = require('fs');
const path = require('path');
let esbuild;
for (const p of [process.env.ESBUILD_PATH, path.resolve(__dirname, '..', 'node_modules', 'esbuild')]) {
  if (!p) continue;
  try { esbuild = require(p); break; } catch (e) { /* next */ }
}
if (!esbuild) { console.error('esbuild not found (npm install w gra/ lub ESBUILD_PATH)'); process.exit(1); }

const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(__dirname, '.break-treaties-status-entry.ts');
const OUT = path.resolve(__dirname, '.break-treaties-status-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { treatiesBrokenByWar, removeTreatiesById, addTreaty, dealsForPair } from ${JSON.stringify(SRC + '/game/diplomacy-treaties')};
export { RodzajTraktatu } from ${JSON.stringify(SRC + '/types/diplomacy')};
`);
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: OUT, logLevel: 'silent' });
} catch (e) { console.error(e.message || e); process.exit(1); }
const B = require(OUT);
fs.unlinkSync(ENTRY); fs.unlinkSync(OUT);

let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; } else { fail++; console.error('FAIL: ' + m); } }

const R = B.RodzajTraktatu;
const BREAK_KINDS = new Set([
  R.PaktNieagresji, R.SojuszWojskowy, 'sojusz_defensywny', 'sojusz_pelny', R.OtwartGranice,
  R.PrawoWojskowePrzemarszu, R.WspolnaWalkaBarbarzyncy, R.UmowaHandlowa, R.UmowaSzlakow, R.UmowaWymiany,
]);
const deal = (id, rodzaj, a, b) => ({ id, rodzaj, strony: [a, b], wygasaTura: null, zawartaTura: 1 });

// Stan po wypowiedzeniu wojny = to, co zostaje po treatiesBrokenByWar + removeTreatiesById (jak w main.ts).
function afterWar(state, a, b) {
  const ids = B.treatiesBrokenByWar(state, a, b);
  return B.removeTreatiesById(state, ids);
}
function pairLiveBreakKinds(state, a, b) {
  return B.dealsForPair(state, a, b).filter(d => BREAK_KINDS.has(d.rodzaj));
}

// A) inwariant czystej logiki, obie kolejności stron (addTreaty normalizuje strony)
let st = [];
st = B.addTreaty(st, deal('sojusz-1-2', R.SojuszWojskowy, 2, 1));
st = B.addTreaty(st, deal('handel-1-2', R.UmowaHandlowa, 1, 2));
st = B.addTreaty(st, deal('nap-1-2', R.PaktNieagresji, 1, 2));
st = B.addTreaty(st, deal('sojusz-1-3', R.SojuszWojskowy, 1, 3));
st = B.addTreaty(st, deal('handel-4-5', R.UmowaHandlowa, 4, 5));
ok(B.dealsForPair(st, 2, 1).length === 3, 'A: addTreaty normalizuje strony (kolejność 2,1 widoczna dla dealsForPair)');
const broken12 = B.treatiesBrokenByWar(st, 2, 1);
ok(broken12.length === 3, 'A: treatiesBrokenByWar(2,1) zwraca 3 umowy pary (sojusz+handel+NAP), kolejność argumentów bez znaczenia');
ok(B.treatiesBrokenByWar(st, 1, 2).length === 3, 'A: treatiesBrokenByWar(1,2) == (2,1)');
const after = afterWar(st, 1, 2);
ok(pairLiveBreakKinds(after, 1, 2).length === 0, 'A: po wojnie brak żywych umów BREAK_ON_WAR pary 1–2');
ok(pairLiveBreakKinds(after, 2, 1).length === 0, 'A: po wojnie brak żywych umów pary 2–1 (kolejność)');
ok(after.some(d => d.id === 'sojusz-1-3'), 'A: sojusz innej pary (1–3) przeżywa wojnę 1–2');
ok(after.some(d => d.id === 'handel-4-5'), 'A: handel innej pary (4–5) przeżywa wojnę 1–2');
ok(B.treatiesBrokenByWar(st, 7, 8).length === 0, 'A: para bez umów = pusta lista zerwań');

// B) mutacja kontrolna: brak usunięcia umów MUSI łamać inwariant A (test nie jest pusty)
const mutantAfter = st; // identity: umowy zostają
ok(pairLiveBreakKinds(mutantAfter, 1, 2).length > 0, 'B: mutacja identity wykryta (żywe umowy pary zostają)');

// C) + D) + E) main.ts text-checks
const MAIN_PATH = path.resolve(SRC, 'main.ts');
const mainSrc = fs.readFileSync(MAIN_PATH, 'utf8');
const EXPECTED_PROD_CALLS = 6;

function isCommentLine(line) {
  const t = line.trim();
  return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*');
}

// Zwraca listę problemów; pusta lista = OK.
function checkMain(src) {
  const problems = [];
  const lines = src.split('\n');
  const callIdx = [];
  lines.forEach((l, i) => {
    if (l.includes('breakTreatiesOnWar(') && !isCommentLine(l) && !/function breakTreatiesOnWar\(/.test(l)) callIdx.push(i);
  });
  if (callIdx.length !== EXPECTED_PROD_CALLS) {
    problems.push(`liczba wywołań breakTreatiesOnWar = ${callIdx.length}, oczekiwano ${EXPECTED_PROD_CALLS} (nowe wywołanie wymaga przeglądu statusu)`);
  }
  for (const i of callIdx) {
    const window = lines.slice(i, i + 10).join('\n');
    const warIdx = window.indexOf("'wojna_wypowiedziana'");
    const relIdx = window.indexOf('getDiploRelation(');
    const setsWar = warIdx >= 0 && window.indexOf('applyDiploEventTracked(') >= 0;
    if (!setsWar) problems.push(`wywołanie w linii ${i + 1}: brak ustawienia statusu wojny (applyDiploEventTracked 'wojna_wypowiedziana') w 10 liniach po wywołaniu`);
    if (setsWar && relIdx < 0) problems.push(`wywołanie w linii ${i + 1}: brak odczytu relacji po wywołaniu`);
  }
  // D) kolejność w ciele breakTreatiesOnWar
  const start = src.indexOf('function breakTreatiesOnWar(');
  if (start < 0) { problems.push('brak definicji breakTreatiesOnWar'); return problems; }
  const endMarker = src.indexOf('\n    }\n', start);
  const body = src.slice(start, endMarker);
  const iRemove = body.indexOf('activeDeals = removeTreatiesById(activeDeals, brokenIds);');
  const iBezKary = body.indexOf('if (opts?.bezKary) return;');
  const iEvent = body.indexOf('applyDiploEventTracked(a, b, cur, ev)');
  if (iRemove < 0) problems.push('breakTreatiesOnWar: brak usunięcia umów (removeTreatiesById)');
  if (iBezKary < 0) problems.push('breakTreatiesOnWar: brak wczesnego wyjścia bezKary');
  if (iRemove >= 0 && iBezKary >= 0 && !(iRemove < iBezKary)) problems.push('breakTreatiesOnWar: bezKary wyjście PRZED usunięciem umów');
  if (iBezKary >= 0 && iEvent >= 0 && !(iBezKary < iEvent)) problems.push('breakTreatiesOnWar: zdarzenie kary przed wyjściem bezKary');
  return problems;
}

const realProblems = checkMain(mainSrc);
ok(realProblems.length === 0, 'C/D: main.ts spełnia inwarianty statusu wojny: ' + realProblems.join(' | '));

// E) mutacje czerwone (in memory)
function mustFail(label, mutated) {
  const p = checkMain(mutated);
  ok(p.length > 0, `E: mutacja „${label}” NIE została wykryta`);
}
// Mutacje ograniczone do ciała breakTreatiesOnWar (identyczne linie istnieją też w innych miejscach main.ts).
function mutateBreakFn(src, fn) {
  const start = src.indexOf('function breakTreatiesOnWar(');
  const end = src.indexOf('\n    }\n', start);
  if (start < 0 || end < 0) throw new Error('brak ciała breakTreatiesOnWar');
  return src.slice(0, start) + fn(src.slice(start, end)) + src.slice(end);
}
const M1 = mutateBreakFn(mainSrc, b => b.replace('activeDeals = removeTreatiesById(activeDeals, brokenIds);', ''));
ok(M1 !== mainSrc, 'E: mutacja M1 zastosowana (wzorzec istnieje)');
mustFail('usunięcie removeTreatiesById', M1);

const M2 = mainSrc.replace(
  "breakTreatiesOnWar(declarer, victim, isMe(declarer), { bezKary: true });",
  "breakTreatiesOnWar(declarer, victim, isMe(declarer), { bezKary: true }); /*M2*/",
).replace(
  "applyDiploEventTracked(declarer, victim, getDiploRelation(declarer, victim), 'wojna_wypowiedziana'),",
  "applyDiploEventTracked(declarer, victim, getDiploRelation(declarer, victim), 'pokoj'),",
);
ok(M2 !== mainSrc, 'E: mutacja M2 zastosowana');
mustFail('brak statusu wojny po casus belli', M2);

const M3 = mainSrc.replace(
  "breakTreatiesOnWar(ME(), ownerId, true);\n      applyAllianceObligationsOnWar(ME(), ownerId);\n      setDiploRelation(\n        ME(),\n        ownerId,\n        applyDiploEventTracked(ME(), ownerId, getDiploRelation(ME(), ownerId), 'wojna_wypowiedziana'),",
  "breakTreatiesOnWar(ME(), ownerId, true);\n      applyAllianceObligationsOnWar(ME(), ownerId);\n      setDiploRelation(\n        ME(),\n        ownerId,\n        applyDiploEventTracked(ME(), ownerId, getDiploRelation(ME(), ownerId), 'pokoj'),",
);
ok(M3 !== mainSrc, 'E: mutacja M3 zastosowana (gracz wypowiada wojnę)');
mustFail('brak statusu wojny przy wypowiedzeniu przez gracza', M3);

const M4 = mutateBreakFn(mainSrc, b => b
  .replace('if (opts?.bezKary) return;\n', '')
  .replace('activeDeals = removeTreatiesById(activeDeals, brokenIds);', 'if (opts?.bezKary) return;\n      activeDeals = removeTreatiesById(activeDeals, brokenIds);'));
ok(M4 !== mainSrc, 'E: mutacja M4 zastosowana (bezKary przed usunięciem)');
mustFail('bezKary przed usunięciem umów', M4);

console.log(`break-treaties-status-test: PASS=${pass} FAIL=${fail}`);
process.exit(fail === 0 ? 0 : 1);
