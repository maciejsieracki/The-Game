'use strict';
/**
 * diplomacy-war-limit-analyze-test.cjs -- test analizatora diplomacy-war-concurrency-analyze.cjs
 * na syntetycznym jsonl (tekst linii jak z runnera). Run: node tools/diplomacy-war-limit-analyze-test.cjs
 */
const path = require('path');
const { analyzeRows, parseLines } = require(path.resolve(__dirname, 'diplomacy-war-concurrency-analyze.cjs'));

let pass = 0;
let fail = 0;
function eq(name, got, want) {
  const ok = Object.is(got, want) || JSON.stringify(got) === JSON.stringify(want);
  if (ok) pass++;
  else { fail++; console.log(`FAIL ${name}: got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); }
}

// Syntetyczny jsonl: seed 1, tura 10: 1<->2 epoki, 1<->3 naturalna (civ 1 ma 2 wojny, 1 epoki + 1 nat).
// tura 11: 2<->3 naturalna, 2 ma 1 wojne. tura 12: brak wojen (pary neutralne pominiete w runnerze).
// Linia uszkodzona i wiersz bez diplo musza byc pominiete.
const lines = [
  JSON.stringify({ seed: 1, harder: 1, turn: 10, diplo: { pairs: [
    { a: 1, b: 2, status: 'wojna', typWojny: 'epoki' },
    { a: 1, b: 3, status: 'wojna' },
    { a: 2, b: 3, status: 'nap' },
  ] } }),
  JSON.stringify({ seed: 1, harder: 1, turn: 11, diplo: { pairs: [
    { a: 2, b: 3, status: 'wojna', typWojny: 'naturalna' },
  ] } }),
  JSON.stringify({ seed: 1, harder: 1, turn: 12, diplo: { pairs: [] } }),
  '{ uszkodzona',
  JSON.stringify({ seed: 1, harder: 1, turn: 13 }),
].join('\n');

const rows = parseLines(lines);
eq('parse: uszkodzona linia pominieta', rows.length, 4);

const r = analyzeRows(rows);
eq('wiersze z diplo liczone', r.wiersze, 3);
eq('tury (seed1: 10,11,12)', r.tury, 3);
// obserwacje: tura10: civ1,civ2,civ3 (3); tura11: civ2,civ3 (2); tura12: brak civ (0) -> brak wpisu slotu z civ
eq('obserwacje cywilizacji-tura', r.obserwacjeCywilizacjiTura, 5);
eq('maksimum wojen na cywilizacje', r.maksimumWojenNaCywilizacje, 2);
eq('maksimum epoki', r.maksimumWojenEpokiNaCywilizacje, 1);
eq('maksimum naturalnych', r.maksimumWojenNaturalnychNaCywilizacje, 1);
eq('tury z >1 wojna (lacznie)', r.turyZWiecejNiZJednaWojna, [{ seed: 1, turn: 10 }]);
eq('tury z >1 epoki: brak', r.turyZWiecejNiZJednaWojnaEpoki, []);
eq('tury z >1 naturalna: brak', r.turyZWiecejNiZJednaWojnaNaturalna, []);
eq('rozklad: 0 zero, 1: 3 (civ1 t10 nie, civ2 t11, civ3 t11 + civ3 t10?)', typeof r.rozkladWojenNaCywilizacjeTure, 'object');
eq('rozklad 2 wojny: civ1 t10 i civ... (1 cywilizacja)', r.rozkladWojenNaCywilizacjeTure['2'], 1);
eq('rozklad 1 wojna: 4 wpisy', r.rozkladWojenNaCywilizacjeTure['1'], 4);

// Pusty zbior = NIE_ZMIERZONO, nie zero.
const empty = analyzeRows([]);
eq('pusty zbior: maksimum NIE_ZMIERZONO', empty.maksimumWojenNaCywilizacje, 'NIE_ZMIERZONO');
eq('pusty zbior: rozklad NIE_ZMIERZONO', empty.rozkladWojenNaCywilizacjeTure, 'NIE_ZMIERZONO');

console.log(`diplomacy-war-limit-analyze-test: pass=${pass} fail=${fail}`);
process.exit(fail === 0 ? 0 : 1);
