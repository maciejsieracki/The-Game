'use strict';
/**
 * diplomacy-all-flags-measure-counters.cjs -- R-WEB-DIPLO-ALL-FLAGS-MEASURE-RUNNER-Q1: liczniki do analizy łącznej.
 *
 * CZYSTA funkcja (bez przeglądarki): z wyniku haka `__diploHarderMeasure.metrics()` (pełna lista par, PRZED filtrem
 * runnera) oraz z licznika zerwań `__diploAllFlagsMeasure.zerwaniaZeroZaufania()` wylicza:
 *   - sojuszeAiAi      : pary AI↔AI z sojuszem (pokoj='sojusz' albo status='sojusz');
 *   - napAiAi          : pary AI↔AI z aktywnym NAP (pokoj='nap', bez sojuszu);
 *   - wojnyRownolegleMax: maks. liczba równoległych wojen jednej cywilizacji (owners z metryk; państwa-miasta wykluczone);
 *   - paryGraczSojusz  : pary z graczem (gracz = m.gracz) w sojuszu; null gdy brak pola gracz (nie zgadujemy);
 *   - zerwaniaZeroZaufania: licznik sesji (przekazany z zewnątrz, odczyt).
 * Tylko odczyt: nie zmienia danych wejściowych.
 */

/** @param {{gracz?: number, owners?: number[], pairs?: Array<Record<string, unknown>>}} m
 *  @param {number} zerwania */
function licznikiZPar(m, zerwania) {
  const pairs = Array.isArray(m && m.pairs) ? m.pairs : [];
  const owners = Array.isArray(m && m.owners) ? m.owners : [];
  const gracz = m && typeof m.gracz === 'number' ? m.gracz : null;
  const sojusz = p => p.pokoj === 'sojusz' || p.status === 'sojusz';
  const sojuszeAiAi = pairs.filter(p => p.aiAi === true && sojusz(p)).length;
  const napAiAi = pairs.filter(p => p.aiAi === true && p.pokoj === 'nap' && !sojusz(p)).length;
  let wojnyRownolegleMax = 0;
  for (const o of owners) {
    const n = pairs.filter(p => p.status === 'wojna' && (p.a === o || p.b === o)).length;
    if (n > wojnyRownolegleMax) wojnyRownolegleMax = n;
  }
  const paryGraczSojusz = gracz === null ? null
    : pairs.filter(p => (p.a === gracz || p.b === gracz) && sojusz(p)).length;
  return {
    sojuszeAiAi,
    napAiAi,
    wojnyRownolegleMax,
    paryGraczSojusz,
    zerwaniaZeroZaufania: typeof zerwania === 'number' ? zerwania : null,
  };
}

module.exports = { licznikiZPar };

/** Samotest (bez przeglądarki): `node tools/diplomacy-all-flags-measure-counters.cjs --selftest`. */
if (require.main === module && process.argv.includes('--selftest')) {
  const wyniki = [];
  const ok = (nazwa, warunek) => { wyniki.push(!!warunek); console.log((warunek ? 'ZIELONE ' : 'CZERWONE ') + nazwa); };
  const m = {
    gracz: 0,
    owners: [0, 1, 2, 3],
    pairs: [
      { a: 1, b: 2, aiAi: true, status: 'sojusz', pokoj: 'sojusz' },
      { a: 1, b: 3, aiAi: true, status: 'wojna', pokoj: undefined },
      { a: 2, b: 3, aiAi: true, status: 'wojna', pokoj: undefined },
      { a: 0, b: 1, aiAi: false, status: 'neutralni', pokoj: 'nap' },
      { a: 0, b: 2, aiAi: false, status: 'wojna', pokoj: undefined },
      { a: 2, b: 3, aiAi: true, status: 'neutralni', pokoj: 'nap' },
    ],
  };
  const l = licznikiZPar(m, 4);
  ok('sojusze AI↔AI = 1', l.sojuszeAiAi === 1);
  ok('NAP AI↔AI = 1 (para bez sojuszu)', l.napAiAi === 1);
  ok('wojny równoległe max: cywilizacja 1 lub 2 ma 2, gracz 0 ma 1 (nie liczy AI↔AI)', l.wojnyRownolegleMax === 2);
  ok('para gracza w sojuszu = 0 (gracz nie ma sojuszu)', l.paryGraczSojusz === 0);
  ok('zerwania przekazane 1:1', l.zerwaniaZeroZaufania === 4);
  ok('brak gracza -> paryGraczSojusz null (nie zgadujemy)', licznikiZPar({ owners: [], pairs: [] }, 0).paryGraczSojusz === null);
  ok('brak zerwań -> null', licznikiZPar(m, undefined).zerwaniaZeroZaufania === null);
  const bad = wyniki.filter(x => !x).length;
  console.log('WYNIK SAMOTESTU: ' + (wyniki.length - bad) + ' zielonych, ' + bad + ' czerwonych');
  process.exit(bad ? 1 : 0);
}
