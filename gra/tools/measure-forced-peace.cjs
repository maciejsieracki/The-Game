'use strict';
/**
 * measure-forced-peace.cjs -- R-WEB-MEASURE-STALL-FORCED-PEACE-Q1: runner POMIAROWY rozstrzyga „oczekujący pokój wymuszony”
 * (POMIAR, nie zmiana gry; zero zmian zasad pokoju).
 *
 * Przyczyna: po wojnie wymuszonej (zmęczenie 100%) gra dopisuje pokój do kolejki pendingForcedPeaceTreaties (main.ts,
 * PENDING-FORCED-PEACE-Q1). Dopóki kolejka jest niepusta, canPlayerInitiateEndTurn() = false
 * (`[EndTurn] blocked: oczekujący pokój wymuszony`) i runner zatrzymuje się `cannot-end`. Decyzji o pokoju nie podejmuje
 * nikt poza graczem: okno (showForcedPeaceModal, src/ui/diplomacyAudience.ts) ma jeden przycisk
 * `.cd-forced-peace-ok` „Akceptuję warunki pokoju” i NIE ma odmowy (brak Esc, brak kliku w tło).
 *
 * Zachowanie: gracz-pomiarowy (pasywny/autopilot) AKCEPTUJE wymuszony pokój — jedyna dostępna decyzja, zgodna z regułą
 * epoki (pokój wymuszony nie ma opcji odmowy). ZAŁOŻENIE do ABC: pasywny gracz nie odrzuca pokoju wymuszonego.
 *
 * Ścieżka: DOM (klik w `.cd-forced-peace-ok`), NIE nowy hak w grze. Gdy okno nie jest otwarte, a kolejka niepusta, wywołanie
 * `__aiTradeWiringTestDebug.endTurn()` (jak klik „Zakończ turę” gracza) otwiera je przez hintEndTurnBlocked →
 * showNextPendingForcedPeace. Odczyt kolejki: `__truceTestDebug.pendingForcedPeaceForTest()` (tylko odczyt, ?civTest=1).
 *
 * Liczniki (jawne): ctx.forcedPeaceAccepted += liczba pokojów, które realnie zniknęły z kolejki po kliknięciu
 * (potwierdzona akceptacja; klik bez skutku NIE jest liczony). Brak haka (`null`) -> 0 i nic nie jest klikane.
 *
 * Uzycie: wywolywane z ai-economy-measure-run.cjs (jedna linia, przed sprawdzeniem canEnd).
 */

/** Stan kolejki i obecność przycisku okna (wykonywane w przeglądarce; zwraca null, gdy brak haka testowego). */
function forcedPeaceStateInPage() {
  const t = window.__truceTestDebug;
  if (!t || typeof t.pendingForcedPeaceForTest !== 'function') return null;
  const pending = t.pendingForcedPeaceForTest().length;
  const btn = pending > 0 ? document.querySelector('.cd-forced-peace-ok') : null;
  return { pending, hasButton: !!btn };
}

/** Klik „Akceptuję warunki pokoju” (jedyny przycisk okna). Zwraca true, gdy przycisk był. */
function clickForcedPeaceAcceptInPage() {
  const btn = document.querySelector('.cd-forced-peace-ok');
  if (!btn) return false;
  btn.click();
  return true;
}

/** Otwarcie okna przez próbę zakończenia tury (jak gracz). Gra sama pokazuje okno w hintEndTurnBlocked. */
function nudgeEndTurnInPage() {
  const h = window.__aiTradeWiringTestDebug;
  if (h && typeof h.endTurn === 'function') h.endTurn();
}

const MAX_ROUNDS = 5;

/**
 * Akceptuje wiszące pokoje wymuszone z graczem. Zwraca liczbę potwierdzonych akceptacji w tej wywołaniu.
 * `page` = Playwright page (lub atrapa z evaluate(fn, arg)); `ctx` = liczniki runnera (ctx.forcedPeaceAccepted).
 * `waitFn` = opóźnienie w ms (domyślnie setTimeout), podmienialne w teście.
 */
async function acceptForcedPeace(page, ctx, waitFn) {
  const wait = waitFn || (ms => new Promise(r => setTimeout(r, ms)));
  let accepted = 0;
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const st = await page.evaluate(forcedPeaceStateInPage);
    if (!st || st.pending === 0) break;
    if (!st.hasButton) {
      await page.evaluate(nudgeEndTurnInPage);
      await wait(200);
      const st2 = await page.evaluate(forcedPeaceStateInPage);
      if (!st2 || !st2.hasButton) break;
    }
    const before = st.pending;
    await page.evaluate(clickForcedPeaceAcceptInPage);
    await wait(200);
    const after = (await page.evaluate(forcedPeaceStateInPage))?.pending ?? before;
    const done = Math.max(0, before - after);
    accepted += done;
    if (ctx && typeof ctx.forcedPeaceAccepted === 'number') ctx.forcedPeaceAccepted += done;
    if (done === 0) break; // klik bez skutku: nie petla w nieskonczonosc
  }
  return accepted;
}

module.exports = { acceptForcedPeace, forcedPeaceStateInPage, clickForcedPeaceAcceptInPage, nudgeEndTurnInPage, MAX_ROUNDS };
