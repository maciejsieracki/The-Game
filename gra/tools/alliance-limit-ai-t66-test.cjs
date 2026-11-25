'use strict';
/**
 * R-WEB-ALLIANCE-LIMIT-AI-T66-Q1 -- test analizatora limitu sojuszy AI<->AI (limits-measure.cjs).
 * Ślad runtime (seed 4242): w wierszach t66-67 para 1-13 ma status=sojusz (relacja zostaje po zniknięciu umowy),
 * a pokoj=pokoj (brak sojuszu w activeDeals). Limit (ai-ai-alliance-limit.ts) liczy activeDeals, więc analizator
 * NIE może liczyć pola `status`. Asercja negatywna: status bez umowy nie daje naruszenia. Asercja pozytywna:
 * trzy realne sojusze (pokoj=sojusz) dają naruszenie. Mutacja: powrót do liczenia po `status` -> test czerwony.
 */
const assert = require('assert');
const { analyzeRows, jestSojuszemDeal, LIMIT_ALLIANCE } = require('./limits-measure.cjs');

function para(a, b, status, pokoj) {
  const p = { a, b, aiAi: true, status, zaufanie: 100, respekt: 30, typWojny: 'naturalna', sasiad: false };
  if (pokoj !== undefined) p.pokoj = pokoj;
  return p;
}

// Przypadek 1 (ślad t66): AI 1 ma realnie 2 sojusze (1-10, 1-19); relacja 1-13 zostaje 'sojusz' bez umowy.
const slad = analyzeRows([
  { turn: 66, diplo: { pairs: [
    para(1, 10, 'sojusz', 'sojusz'),
    para(1, 19, 'sojusz', 'sojusz'),
    para(1, 13, 'sojusz'), // brak pola pokoj (undefined w JSON) = brak umowy
  ] } },
], 'slad');
assert.strictEqual(slad.naruszeniaSojuszyAI, 0, 'status bez umowy nie może dać naruszenia limitu');
assert.strictEqual(slad.maxSojuszyAI, 2, 'maks. sojuszy AI wg activeDeals = 2');
assert.strictEqual(slad.rozbieznosciStatusPokoj, 1, 'rozbieżność status/pokoj jest jawnie raportowana');

// Przypadek 2: trzy realne sojusze AI 1 (pokoj=sojusz) -> naruszenie musi być wykryte.
const realne = analyzeRows([
  { turn: 70, diplo: { pairs: [
    para(1, 10, 'sojusz', 'sojusz'),
    para(1, 19, 'sojusz', 'sojusz'),
    para(1, 13, 'sojusz', 'sojusz'),
  ] } },
], 'realne');
assert.strictEqual(realne.naruszeniaSojuszyAI, 1, 'trzeci realny sojusz AI musi dać naruszenie');
assert.strictEqual(realne.maxSojuszyAI, 3);
assert.strictEqual(LIMIT_ALLIANCE, 2, 'limit 2 pozostaje bez zmian');

// Przypadek 3: sojusz z graczem (owner 0) w pokoj=sojusz liczy się do limitu AI.
const zGraczem = analyzeRows([
  { turn: 71, diplo: { pairs: [
    para(0, 4, 'sojusz', 'sojusz'),
    para(4, 5, 'sojusz', 'sojusz'),
    para(4, 6, 'sojusz', 'sojusz'),
  ] } },
], 'gracz');
assert.strictEqual(zGraczem.naruszeniaSojuszyAI, 1, 'sojusz z graczem wchodzi do licznika AI');

assert.strictEqual(jestSojuszemDeal({ status: 'sojusz' }), false, 'brak pokoj -> nie sojusz');
assert.strictEqual(jestSojuszemDeal({ status: 'neutralni', pokoj: 'sojusz' }), true, 'pokoj=sojusz -> sojusz');
console.log('alliance-limit-ai-t66-test: 6/6 OK');
