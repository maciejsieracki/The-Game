'use strict';
/**
 * truce-end-war-notice-test.cjs -- R-WEB-TRUCE-END-SILENT-WAR-Q1 (luka L4 z WOJNA-SCIEZKI-KONCA-2026-11-25).
 * Powrot do wojny po rozejmie bez oferty pokoju (odmowa AI, brak zgody wojskowej, brak inicjatora,
 * timeout oferty) byl dla gracza cichy. Port declareWarAfterTruce w main.ts (truceEndPorts) dopisuje
 * teraz JEDEN wpis „Wazne” (warEventLog, id truce-war-<tura>-<para>) TYLKO gdy gracz (ME()) jest stroną pary.
 * Wszystkie galezie bez oferty przechodza przez truceEndToWarCore -> declareWarAfterTruce, wiec wpis jest w jednym miejscu.
 *
 * Czesc 1 (RUNTIME): truceEndTickPair z diplomacy-peace-lock.ts (esbuild bundle) z portami; declareWarAfterTruce
 *   wola regule wpisu WYCIAGNIETA ZE ZRODLA main.ts (ta sama tresc co w produkcji).
 * Czesc 2 (ZRODLO): blok declareWarAfterTruce zawiera guard ME(), id truce-war-, unshift i trimWarEventLog.
 * Czesc 3 (MUTANTY): M1 guard „false” (brak wpisu) i M2 guard „true” (wpis dla AI↔AI) musza byc wykryte.
 *
 * Run: node tools/truce-end-war-notice-test.cjs   (exit 0 = zielone)
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const LOCK = path.resolve(GRA, 'src', 'game', 'diplomacy-peace-lock.ts');
const MAIN = path.resolve(GRA, 'src', 'main.ts');
const GUARD = 'if (a === ME() || b === ME()) {';

let failures = 0;
const ok = (cond, msg) => {
  if (cond) console.log(`  OK   ${msg}`);
  else { failures++; console.log(`  FAIL ${msg}`); }
};

/** Zwraca tekst funkcji portu `(a, b) => { ... }` z main.ts (bez klucza „declareWarAfterTruce:”). */
function extractPortBody(src) {
  const key = 'declareWarAfterTruce: (a, b) => {';
  const at = src.indexOf(key);
  if (at < 0) return null;
  const start = at + 'declareWarAfterTruce: '.length;
  const open = src.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  return null;
}

/**
 * Buduje funkcje portu z kodu main.ts. Atrapy: getDiploRelation/setDiploRelation (stan pary),
 * applyDiploEventTracked (zmiana na 'wojna'), ME, diploPairKey, ownerDiploLabel, warEventLog, trimWarEventLog, turn.
 */
function makePortFactory(portBody) {
  return function make(state, variant) {
    let body = portBody;
    if (variant === 'M1') body = body.replace(GUARD, 'if (false) {');
    if (variant === 'M2') body = body.replace(GUARD, 'if (true) {');
    const pairKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);
    const fn = new Function(
      'getDiploRelation', 'setDiploRelation', 'applyDiploEventTracked', 'ME', 'diploPairKey',
      'ownerDiploLabel', 'warEventLog', 'trimWarEventLog', 'turn',
      `return ${body};`,
    );
    return fn(
      (a, b) => state.rel[pairKey(a, b)],
      (a, b, r) => { state.rel[pairKey(a, b)] = r; },
      (a, b, cur) => ({ ...cur, status: 'wojna' }),
      () => state.me,
      pairKey,
      id => `Gracz${id}`,
      state.warEventLog,
      () => { state.trimmed += 1; },
      state.turn,
    );
  };
}

function bundleLock() {
  const out = esbuild.buildSync({
    entryPoints: [LOCK], bundle: true, write: false, format: 'cjs', platform: 'node', logLevel: 'silent',
  });
  const m = { exports: {} };
  new Function('module', 'exports', out.outputFiles[0].text)(m, m.exports);
  return m.exports;
}

const mainSrc = fs.readFileSync(MAIN, 'utf8');
const portBody = extractPortBody(mainSrc);
ok(portBody != null, 'blok declareWarAfterTruce odnaleziony w main.ts');
const lock = bundleLock();
const makePort = makePortFactory(portBody || '(a, b) => {}');

/**
 * Scenariusz przez czysta logike rozejmu: rozejm wygasa w turze 10 dla pary (a,b).
 * Status pary = 'pokoj'; declareWarAfterTruce ustawia 'wojna' i wola regule wpisu.
 */
function runExpiry({ a, b, initiator, armyAI = 0, variant }) {
  const state = { me: 0, turn: 10, rel: {}, warEventLog: [], trimmed: 0 };
  const pk = a < b ? `${a}-${b}` : `${b}-${a}`;
  state.rel[pk] = { status: 'pokoj', zaufanie: 0, respekt: 0 };
  const metas = { [pk]: { truceUntilTurn: 10, truceInitiatorId: initiator } };
  const k = (x, y) => (x < y ? `${x}-${y}` : `${y}-${x}`);
  const port = makePort(state, variant);
  lock.truceEndTickPair({
    getMeta: (x, y) => metas[k(x, y)] ?? {},
    setMeta: (x, y, m) => { metas[k(x, y)] = m; },
    getStatus: (x, y) => state.rel[k(x, y)].status,
    getArmyM: id => (id === 0 ? 100 : armyAI),
    isHuman: id => id === 0,
    declareWarAfterTruce: (x, y) => {
      state.rel[k(x, y)] = { ...state.rel[k(x, y)], status: 'wojna' };
      port(x, y);
    },
    enqueueOffer: () => 'inbox-1',
    removeOffer: () => {},
    finalizePeace: () => {},
  }, a, b, 10);
  return state;
}

console.log('== Czesc 1: runtime ==');
{
  // AI (1) odmawia: gracz 0 zainicjowal rozejm, armia AI 0 < prog -> wojna bez oferty.
  const s = runExpiry({ a: 0, b: 1, initiator: 0, armyAI: 0 });
  ok(s.rel['0-1'].status === 'wojna', 'odmowa AI: status wraca do wojny');
  ok(s.warEventLog.length === 1, 'odmowa AI: dokladnie 1 wpis dla gracza');
  ok(s.warEventLog[0] && s.warEventLog[0].id === 'truce-war-10-0-1', 'wpis ma id truce-war-<tura>-<para>');
  ok(s.warEventLog[0] && s.warEventLog[0].kind === 'enemy' && s.warEventLog[0].icon === '⚔', 'wpis typu enemy z ikona ⚔ (styl logPeaceVazne)');
}
{
  // Brak inicjatora (stare zapisy) -> wojna -> 1 wpis dla gracza jako strony pary.
  const s = runExpiry({ a: 0, b: 2, initiator: undefined });
  ok(s.warEventLog.length === 1, 'brak inicjatora: 1 wpis dla gracza');
}
{
  // Gracz jako adresat (AI 1 zainicjowal) i brak zgody gracza: oferta w skrzynce, nie wojna od razu -> 0 wpisow tu.
  const s = runExpiry({ a: 0, b: 1, initiator: 1 });
  ok(s.warEventLog.length === 0, 'oferta dla gracza (nie wojna) -> brak wpisu w tym kroku');
}
{
  // Para AI↔AI: zero wpisow.
  const s = runExpiry({ a: 1, b: 2, initiator: 1, armyAI: 0 });
  ok(s.rel['1-2'].status === 'wojna', 'AI↔AI: wojna wraca (logika bez zmian)');
  ok(s.warEventLog.length === 0, 'AI↔AI: 0 wpisow');
}
{
  // Dedup: wielokrotne wywolanie portu w tej samej turze dla tej pary -> 1 wpis.
  const state = { me: 0, turn: 10, rel: { '0-1': { status: 'pokoj' } }, warEventLog: [], trimmed: 0 };
  const port = makePort(state);
  port(0, 1);
  port(0, 1);
  ok(state.warEventLog.length === 1, 'dedup: powtorne wywolanie w tej samej turze -> nadal 1 wpis');
}

console.log('== Czesc 2: zrodlo main.ts ==');
ok(portBody != null && portBody.includes(GUARD), 'wpis wymaga, by gracz (ME()) byl stroną pary (guard)');
ok(portBody != null && portBody.includes('`truce-war-${turn}-${diploPairKey(a, b)}`'), 'id wpisu truce-war-<tura>-<para>');
ok(portBody != null && portBody.includes('warEventLog.unshift('), 'wpis dopisany przez warEventLog.unshift');
ok(portBody != null && portBody.includes('trimWarEventLog();'), 'wywolanie trimWarEventLog()');

console.log('== Czesc 3: mutanty (musza byc wykryte) ==');
{
  const s = { me: 0, turn: 10, rel: {}, warEventLog: [], trimmed: 0 };
  makePort(s, 'M1')(0, 1);
  ok(s.warEventLog.length === 0, 'M1 (bez wpisu gracza) -> wykryte: 0 wpisow, test czerwony');
}
{
  const s = { me: 0, turn: 10, rel: {}, warEventLog: [], trimmed: 0 };
  makePort(s, 'M2')(1, 2);
  ok(s.warEventLog.length === 1, 'M2 (guard zdjety) -> wykryte: AI↔AI dostaje wpis, test czerwony');
}

if (failures > 0) {
  console.log(`FAIL: ${failures}`);
  process.exit(1);
}
console.log('PASS truce-end-war-notice-test');
