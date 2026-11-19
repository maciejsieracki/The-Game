'use strict';
/**
 * measure-forced-peace-test.cjs -- R-WEB-MEASURE-STALL-FORCED-PEACE-Q1: test czystego modułu measure-forced-peace.cjs.
 * Bez przeglądarki: atrapa `page` uruchamia funkcje page.evaluate na globalnym window/document z atrapą kolejki gry
 * i okna pokoju (przycisk `.cd-forced-peace-ok`, którego klik zdejmuje pokój z kolejki — jak acceptPendingForcedPeace).
 *
 * Asercje:
 *  1) 2 wiszące pokoje + okno otwarte: accepted=2, ctx.forcedPeaceAccepted=2, kolejka pusta;
 *  2) brak wiszących pokojów: accepted=0, zero kliknięć (parytet: zero zmian);
 *  3) pokój wiszący, okno zamknięte: próba endTurn otwiera okno, akceptacja=1;
 *  4) brak haka testowego (window.__truceTestDebug nie istnieje): accepted=0, nic nie klikane, brak wyjątku;
 *  5) klik bez skutku (przycisk nie zdejmuje z kolejki): accepted=0, pętla kończy się (bez nieskończoności);
 *  6) mutacja (czerwona): MEASURE_FORCED_PEACE_MODULE=<kopia z pominiętym kliknięciem> MUSI oblać asercje 1 i 3.
 * Uzycie: node tools/measure-forced-peace-test.cjs   (wyjscie 0 = zielone, 1 = blad)
 */
const path = require('path');

const DEFAULT_MODULE = path.resolve(__dirname, 'measure-forced-peace.cjs');
const MODULE = process.env.MEASURE_FORCED_PEACE_MODULE ? path.resolve(process.env.MEASURE_FORCED_PEACE_MODULE) : DEFAULT_MODULE;
const { acceptForcedPeace } = require(MODULE);

let fails = 0;
let passes = 0;
function check(name, cond, extra) {
  if (cond) passes++;
  else { fails++; console.log('FAIL: ' + name + (extra !== undefined ? ' ' + JSON.stringify(extra) : '')); }
}

/**
 * Świat gry: queue = pokoje wiszące; windowOpen = czy okno jest w DOM; hook = czy jest __truceTestDebug.
 * Klik w przycisk (gdy okno otwarte) zdejmuje pierwszy pokój i zamyka okno, jeśli kolejka pusta —
 * jak acceptPendingForcedPeace + showNextPendingForcedPeace. endTurn bez okna otwiera je (hintEndTurnBlocked).
 * stuck=true: klik nie zdejmuje pokoju (przycisk „martwy").
 */
function makeWorld(opts) {
  const o = opts || {};
  const world = { queue: o.queue ?? 0, windowOpen: !!o.windowOpen, clicks: 0, endTurns: 0 };
  const button = { click() { world.clicks++; if (!o.stuck && world.queue > 0) { world.queue--; } world.windowOpen = world.queue > 0; } };
  const fakeDocument = {
    querySelector(sel) { return sel === '.cd-forced-peace-ok' && world.windowOpen && world.queue > 0 ? button : null; },
  };
  const fakeWindow = {};
  if (!o.noHook) {
    fakeWindow.__truceTestDebug = { pendingForcedPeaceForTest: () => Array.from({ length: world.queue }, () => ({})) };
  }
  fakeWindow.__aiTradeWiringTestDebug = {
    endTurn() { world.endTurns++; if (world.queue > 0) world.windowOpen = true; },
  };
  return { world, fakeWindow, fakeDocument };
}

/** Atrapa page: evaluate(fn, arg) wykonuje fn z globalnymi window/document z atrapy świata. */
function makePage(world) {
  return {
    async evaluate(fn, arg) {
      const prevW = globalThis.window, prevD = globalThis.document;
      globalThis.window = world.fakeWindow;
      globalThis.document = world.fakeDocument;
      try { return fn(arg); } finally { globalThis.window = prevW; globalThis.document = prevD; }
    },
  };
}

const noWait = async () => {};

async function scenario(opts) {
  const w = makeWorld(opts);
  const ctx = { forcedPeaceAccepted: 0 };
  const accepted = await acceptForcedPeace(makePage(w), ctx, noWait);
  return { accepted, ctx, world: w.world };
}

(async () => {
  // 1) dwa wiszące pokoje, okno otwarte
  {
    const r = await scenario({ queue: 2, windowOpen: true });
    check('1 accepted=2', r.accepted === 2, r.accepted);
    check('1 ctx.forcedPeaceAccepted=2', r.ctx.forcedPeaceAccepted === 2, r.ctx);
    check('1 kolejka pusta', r.world.queue === 0, r.world.queue);
  }
  // 2) brak wiszących pokojów: zero kliknięć, zero endTurn
  {
    const r = await scenario({ queue: 0, windowOpen: false });
    check('2 accepted=0', r.accepted === 0, r.accepted);
    check('2 zero kliknięć', r.world.clicks === 0 && r.world.endTurns === 0, r.world);
    check('2 licznik 0', r.ctx.forcedPeaceAccepted === 0, r.ctx);
  }
  // 3) pokój wiszący, okno zamknięte: endTurn otwiera okno, potem akceptacja
  {
    const r = await scenario({ queue: 1, windowOpen: false });
    check('3 accepted=1 (okno otwarte przez endTurn)', r.accepted === 1, r.accepted);
    check('3 endTurn wywołany', r.world.endTurns >= 1, r.world);
    check('3 kolejka pusta', r.world.queue === 0, r.world.queue);
  }
  // 4) brak haka testowego: nic nie klikane, bez wyjątku
  {
    const r = await scenario({ queue: 3, windowOpen: true, noHook: true });
    check('4 accepted=0 bez haka', r.accepted === 0, r.accepted);
    check('4 zero kliknięć bez haka', r.world.clicks === 0, r.world);
  }
  // 5) martwy przycisk: klik bez skutku, pętla kończy się
  {
    const r = await scenario({ queue: 1, windowOpen: true, stuck: true });
    check('5 accepted=0 przy martwym przycisku', r.accepted === 0, r.accepted);
    // Dokładnie 1 klik: bez strażnika `if (done===0) break` pętla klika MAX_ROUNDS=5 razy (mutacja m2 -> FAIL).
    check('5 dokladnie 1 klik przy martwym przycisku (strażnik done===0)', r.world.clicks === 1, r.world.clicks);
  }

  if (fails > 0) {
    console.log(`measure-forced-peace-test: CZERWONE (${fails} FAIL, ${passes} PASS) modul=${MODULE}`);
    process.exit(1);
  }
  console.log(`measure-forced-peace-test: ZIELONE ${passes}/${passes} modul=${MODULE}`);
  process.exit(0);
})();
