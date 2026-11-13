'use strict';
/**
 * diplo-negotiation-round-counter-test.cjs -- R-WEB-DIPLO-NEGOTIATION-ROUND-COUNTER-UNIFY-Q1
 * (#307/#320, ABC: tak).
 *
 * Licznik rund negocjacji pokazywany graczowi ma jeden wzorzec napisu
 * (negotiationRoundCounterText) i jedno źródło M (NEGOTIATION_MAX_ROUNDS).
 * Test sprawdza:
 *  1. oba miejsca wywołują helper z tym samym źródłem M (main.ts: NEGOTIATION_MAX_ROUNDS,
 *     diplomacyAudience.ts: r.maxRounds, a r.maxRounds jest wypełniane z NEGOTIATION_MAX_ROUNDS),
 *  2. helper daje ten sam napis dla tej samej rundy i tego samego M w obu miejscach,
 *  3. mutacja (inny M w jednym miejscu) czerwieni test.
 * Nie zmienia wartości limitu rund.
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const MAIN = path.join(GRA, 'src', 'main.ts');
const AUDIENCE = path.join(GRA, 'src', 'ui', 'diplomacyAudience.ts');
const PROPOSALS = path.join(GRA, 'src', 'game', 'diplomacy-proposals.ts');

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log('  ok   ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail !== undefined ? ' -> ' + JSON.stringify(detail) : '')); }
}

/** Sprawdza spójność obu miejsc; zwraca listę błędów (pusta = zgodne). */
function verify(mainSrc, audSrc, maxRoundsValue) {
  const errors = [];

  // Wyciągnij helper z modułu audience i uruchom go (bez całego modułu UI).
  const m = audSrc.match(/export function negotiationRoundCounterText\(([^)]*)\)[^{]*\{([\s\S]*?)\n\}/);
  if (!m) return ['brak exportu negotiationRoundCounterText w diplomacyAudience.ts'];
  const helper = new Function(m[1].split(',').map(s => s.split(':')[0].trim()).join(','), m[2]);

  // Miejsce 1: main.ts (zdarzenie tury, licznik z NEGOTIATION_MAX_ROUNDS).
  const mainCall = mainSrc.match(/negotiationRoundCounterText\(\s*n\.round\s*,\s*([^)]+?)\s*\)/);
  if (!mainCall) errors.push('main.ts: brak wywołania helpera dla n.round');
  else if (mainCall[1].trim() !== 'NEGOTIATION_MAX_ROUNDS') errors.push('main.ts: M nie jest NEGOTIATION_MAX_ROUNDS (' + mainCall[1].trim() + ')');

  // Miejsce 2: diplomacyAudience.ts (karta oczekującej negocjacji).
  const audCall = audSrc.match(/negotiationRoundCounterText\(\s*r\.round\s*,\s*([^)]+?)\s*\)/);
  if (!audCall) errors.push('diplomacyAudience.ts: brak wywołania helpera dla r.round');
  else if (audCall[1].trim() !== 'r.maxRounds') errors.push('diplomacyAudience.ts: M nie jest r.maxRounds (' + audCall[1].trim() + ')');

  // r.maxRounds w main.ts musi pochodzić z NEGOTIATION_MAX_ROUNDS.
  if (!/maxRounds:\s*NEGOTIATION_MAX_ROUNDS\b/.test(mainSrc)) errors.push('main.ts: maxRounds nie jest z NEGOTIATION_MAX_ROUNDS');

  // Zachowanie: ten sam napis dla tej samej rundy i tego samego M w obu miejscach.
  for (let round = 1; round <= 3; round++) {
    const a = helper(round, maxRoundsValue);            // main: (n.round, NEGOTIATION_MAX_ROUNDS)
    const b = helper(round, maxRoundsValue);            // audience: (r.round, r.maxRounds)
    if (a !== b) errors.push('rozjazd napisu dla rundy ' + round + ': ' + a + ' vs ' + b);
    if (a !== 'runda ' + round + '/' + maxRoundsValue) errors.push('zły napis dla rundy ' + round + ': ' + a);
  }
  return errors;
}

console.log('== diplo-negotiation-round-counter-test ==');
const mainSrc = fs.readFileSync(MAIN, 'utf8');
const audSrc = fs.readFileSync(AUDIENCE, 'utf8');
const propSrc = fs.readFileSync(PROPOSALS, 'utf8');
const mm = propSrc.match(/export const NEGOTIATION_MAX_ROUNDS = (\d+);/);
check('NEGOTIATION_MAX_ROUNDS odczytany z diplomacy-proposals.ts', !!mm, mm && mm[1]);
const M = mm ? Number(mm[1]) : NaN;

const realErrors = verify(mainSrc, audSrc, M);
check('zgodność obu miejsc (kod realny)', realErrors.length === 0, realErrors);

// Mutacja 1: inny M w main.ts -> test musi czerwienić.
const mut1 = mainSrc.replace(
  'negotiationRoundCounterText(n.round, NEGOTIATION_MAX_ROUNDS)',
  'negotiationRoundCounterText(n.round, NEGOTIATION_MAX_ROUNDS + 1)');
check('mutacja: inny M w main.ts jest wykryta', mut1 !== mainSrc && verify(mut1, audSrc, M).length > 0);

// Mutacja 2: stały M w audience -> test musi czerwienić.
const mut2 = audSrc.replace(
  'negotiationRoundCounterText(r.round, r.maxRounds)',
  'negotiationRoundCounterText(r.round, 99)');
check('mutacja: stały M w diplomacyAudience.ts jest wykryta', mut2 !== audSrc && verify(mainSrc, mut2, M).length > 0);

console.log('\nwynik: ' + pass + ' ok, ' + fail + ' fail');
process.exit(fail === 0 ? 0 : 1);
