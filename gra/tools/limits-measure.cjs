'use strict';
/**
 * limits-measure.cjs -- R-WEB-MEASURE-LIMITS-FLEE-FORTRING-Q1, funkcje (a) limit wojen z graczem / naturalnych
 * i (b) limit 2 sojuszy AI<->AI. Analizator wierszy JSONL zapisanych przez diplomacy-harder-measure-run.cjs
 * (tryb --all-flags 0|1). POMIAR, nie zmiana gry: plik nic nie zapisuje poza stdout.
 *
 * Uzycie (z gra/):
 *   node tools/limits-measure.cjs <plik1.jsonl> [<plik2.jsonl> ...]
 *
 * Dla kazdego pliku:
 *   - wojny: per cywilizacja (owner) liczba pozycji `wojna` typu 'epoki' i 'naturalna' w danej turze;
 *     maks. po turach. Reguła (diplomacy-war-limit.ts): maks. 1 epoki + 1 naturalna per cywilizacja.
 *     Gracz (owner 0) jest liczony osobno jako cel/ofiara; naruszenie limitu u AI = licznik `naruszeniaAI`.
 *   - sojusze: per AI (owner != 0) liczba pozycji `sojusz` z para AI<->AI oraz sojuszy z graczem;
 *     maks. po turach. Reguła (ai-ai-alliance-limit.ts): limit 2 per cywilizacja. Naruszenie = `naruszeniaSojuszy`.
 *   Uwaga: wiersze zawieraja tylko pary niebedace 'neutralni' albo sasiadami, wiec wojny i sojusze sa kompletne.
 */
const fs = require('fs');

const LIMIT_ALLIANCE = 2;
const LIMIT_EPOKI = 1;
const LIMIT_NATURALNA = 1;

/**
 * R-WEB-ALLIANCE-LIMIT-AI-T66-Q1: limit liczy sojusze z activeDeals (ai-ai-alliance-limit.ts), a nie pole `status`
 * (relacja diplomacyRelations, które po zniknięciu sojuszu bywa zostawione na 'sojusz'; ślad runtime:
 * dyspozycje/autobot/runs/R-WEB-ALLIANCE-LIMIT-AI-T66-Q1/dane/seed4242-alliance-log-t67.txt, ALLIANCE-SYNC
 * sojuszWDeals=false statusPrzed=sojusz). Źródłem prawdy w wierszu jest `pokoj` (resolvePokojTrustTier nad activeDeals).
 * Brak pola `pokoj` (undefined w JSON) = brak umowy/kontaktu/wojna, więc NIE jest sojuszem. Rozbieżności
 * status/pokoj są jawnie liczone w `rozbieznosciStatusPokoj`.
 */
function jestSojuszemDeal(p) {
  return p.pokoj === 'sojusz';
}

function analyze(file) {
  const rows = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
  return analyzeRows(rows, file);
}

function analyzeRows(rows, file) {
  const out = {
    plik: file,
    wiersze: rows.length,
    tury: rows.length ? [rows[0].turn, rows[rows.length - 1].turn] : null,
    flagaWszystkich: rows.length ? rows[0].allFlags : null,
    maxWojnEpokiAI: 0,
    maxWojnNaturalnychAI: 0,
    naruszeniaWojenAI: 0,
    maxWojnEpokiGracz: 0,
    maxWojnNaturalnychGracz: 0,
    maxSojuszyAI: 0,
    naruszeniaSojuszyAI: 0,
    sojuszyZGraczemMax: 0,
    turyNaruszenWojen: [],
    turyNaruszenSojuszy: [],
    rozbieznosciStatusPokoj: 0,
    wojnyNaTurze: [],
    sojuszeNaTurze: [],
  };
  for (const r of rows) {
    const pairs = (r.diplo && r.diplo.pairs) || [];
    const wojny = {}; // owner -> {epoki, naturalna}
    const sojusze = {}; // owner -> count (AI<->AI i z graczem)
    const sojuszeGracz = {};
    const addW = (c, typ) => {
      wojny[c] = wojny[c] || { epoki: 0, naturalna: 0 };
      if (typ === 'epoki') wojny[c].epoki++;
      else wojny[c].naturalna++;
    };
    let liczbaWojen = 0;
    let liczbaSojuszy = 0;
    for (const p of pairs) {
      if ((p.status === 'sojusz') !== (p.pokoj === 'sojusz')) out.rozbieznosciStatusPokoj++;
      if (p.status === 'wojna') {
        liczbaWojen++;
        addW(p.a, p.typWojny);
        addW(p.b, p.typWojny);
      } else if (jestSojuszemDeal(p)) {
        liczbaSojuszy++;
        sojusze[p.a] = (sojusze[p.a] || 0) + 1;
        sojusze[p.b] = (sojusze[p.b] || 0) + 1;
        if (p.a === 0 || p.b === 0) {
          const ai = p.a === 0 ? p.b : p.a;
          sojuszeGracz[ai] = (sojuszeGracz[ai] || 0) + 1;
        }
      }
    }
    let naruszW = false;
    for (const [owner, w] of Object.entries(wojny)) {
      const id = Number(owner);
      if (id === 0) {
        out.maxWojnEpokiGracz = Math.max(out.maxWojnEpokiGracz, w.epoki);
        out.maxWojnNaturalnychGracz = Math.max(out.maxWojnNaturalnychGracz, w.naturalna);
        continue;
      }
      out.maxWojnEpokiAI = Math.max(out.maxWojnEpokiAI, w.epoki);
      out.maxWojnNaturalnychAI = Math.max(out.maxWojnNaturalnychAI, w.naturalna);
      if (w.epoki > LIMIT_EPOKI || w.naturalna > LIMIT_NATURALNA) naruszW = true;
    }
    if (naruszW) {
      out.naruszeniaWojenAI++;
      out.turyNaruszenWojen.push(r.turn);
    }
    let naruszS = false;
    for (const [owner, n] of Object.entries(sojusze)) {
      if (Number(owner) === 0) continue;
      out.maxSojuszyAI = Math.max(out.maxSojuszyAI, n);
      if (n > LIMIT_ALLIANCE) naruszS = true;
    }
    for (const n of Object.values(sojuszeGracz)) out.sojuszyZGraczemMax = Math.max(out.sojuszyZGraczemMax, n);
    if (naruszS) {
      out.naruszeniaSojuszyAI++;
      out.turyNaruszenSojuszy.push(r.turn);
    }
    out.wojnyNaTurze.push([r.turn, liczbaWojen]);
    out.sojuszeNaTurze.push([r.turn, liczbaSojuszy]);
  }
  return out;
}

if (require.main === module) {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('Uzycie: node tools/limits-measure.cjs <plik.jsonl> [...]');
    process.exit(2);
  }
  const wyniki = files.map(analyze);
  console.log(JSON.stringify(wyniki, null, 1));
}

module.exports = { analyze, analyzeRows, jestSojuszemDeal, LIMIT_ALLIANCE, LIMIT_EPOKI, LIMIT_NATURALNA };
