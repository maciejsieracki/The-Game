'use strict';
/**
 * measure-reject-offers.cjs -- R-WEB-MEASURE-RUNNERS-REJECT-AI-OFFERS-Q1: wspolne odrzucanie wiszacych ofert handlowych
 * AI->gracz w runnerach pomiarowych (POMIAR, nie zmiana gry).
 *
 * Przyczyna (R-WEB-MEASURE-SEED1234-T18-STALL-Q1): wisząca oferta AI->gracz blokuje „Zakończ turę” (bramka
 * hasBlockingAiTradeOfferForPlayer, opcja „Wymagaj rozpatrzenia ofert handlowych”). Runner nie ma decyzji gracza,
 * wiec przy takiej ofercie zostaje w turze (canEnd=false). Zalozenie pasywnego gracza: oferte odrzucamy hakiem
 * __aiTradeWiringTestDebug.reject (= handleNegotiationReject). Wpisy z responder=0 (wlasciciel gracza) i proposer!=0
 * to oferty AI do gracza; propozycje gracza (proposer=0) NIE sa ruszane.
 *
 * Liczniki (rozdzielone, NIE mieszane):
 *   attempts  -- liczba PROB odrzucenia: kazdy id oferty liczony RAZ na zbior `seenIds` (np. jedna tura),
 *                nawet gdy funkcja jest wywolana ponownie w tej samej turze (druga proba w runnerach);
 *   confirmed -- liczba POTWIERDZONYCH odrzucen: wpis zniknal z listy wpisow stolu po akcji.
 * Proba bez potwierdzenia (wpis nadal istnieje) nie jest liczona jako odrzucenie.
 * Uwaga (zmiana semantyki, PRZYJETE z zarzutu N4): w diplomacy-harder-measure-run.cjs pole `aiOffersRejected`
 * w starych jsonl/summary liczylo PROBY; od R-WEB-MEASURE-RUNNERS-REJECT-AI-OFFERS-Q1 `aiOffersRejected` = POTWIERDZONE,
 * a PROBY sa w `aiOffersRejectAttempts`. Stare pliki nie sa bezposrednio porownywalne.
 */

/** Wpisy stolu negocjacji (tylko odczyt, w przegladarce). */
async function readEntries(page) {
  return page.evaluate(() => {
    const st = window.__aiTradeWiringTestDebug.state();
    return (st.entries || []).map(e => ({ id: e.id, responder: e.responder, proposer: e.proposer }));
  });
}

/**
 * Odrzuca wiszace oferty AI->gracz. Zwraca { attempts, confirmed }.
 * Zachowanie gry (co jest odrzucane i w jakiej kolejnosci) identyczne jak wczesniej w diplomacy-harder-measure-run.cjs.
 */
async function rejectAwaitingAiOffers(page, seenIds) {
  const seen = seenIds instanceof Set ? seenIds : new Set();
  const entries = await readEntries(page);
  const ids = entries.filter(e => e.responder === 0 && e.proposer !== 0).map(e => e.id);
  let confirmed = 0;
  let attempts = 0;
  for (const id of ids) {
    if (!seen.has(id)) { seen.add(id); attempts++; }
    await page.evaluate(i => window.__aiTradeWiringTestDebug.reject(i), id);
    const after = await readEntries(page);
    if (!after.some(e => e.id === id)) confirmed++;
  }
  return { attempts, confirmed };
}

module.exports = { rejectAwaitingAiOffers, readEntries };
