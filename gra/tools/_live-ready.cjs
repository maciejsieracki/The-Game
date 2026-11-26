'use strict';
// R-WEB-HARNESS-LIVE-WELCOME-TRUCE-Q1: wspolne zamkniecie ekranu powitalnego (#civ-welcome-screen-root,
// dialog modalny z a3141e943) dla testow live. Ekran przechwytuje kliki w panele gry, wiec test bez
// jego zamkniecia nie moze kliknac kart stosu. Helper NIE zmienia logiki gry ani asercji: klika wylacznie
// przycisk „Zamknij” ekranu (data-cww="close") i czeka, az root zniknie. Zamkniecie moze otworzyc
// kolejny ekran pierwszego kontaktu (kolejna cywilizacja), dlatego petla sprawdza root ponownie.
const WELCOME_ROOT = '#civ-welcome-screen-root';

async function closeCivWelcome(page, maxRounds = 6) {
  let closed = 0;
  for (let i = 0; i < maxRounds; i += 1) {
    const open = await page.evaluate((sel) => !!document.querySelector(sel), WELCOME_ROOT);
    if (!open) return closed;
    await page.evaluate((sel) => {
      const b = document.querySelector(sel + ' [data-cww="close"]');
      if (b) b.click();
    }, WELCOME_ROOT);
    closed += 1;
    await page.waitForTimeout(150);
  }
  const stillOpen = await page.evaluate((sel) => !!document.querySelector(sel), WELCOME_ROOT);
  if (stillOpen) throw new Error('civ-welcome-screen nie zamknal sie po ' + maxRounds + ' probach');
  return closed;
}

// R-WEB-HARNESS-NNS-GATE-ENDTURN-Q1 (NNSQ12, odp. 12A): bramka „Zakończ turę” (NNS: prognoza skarbca/spichlerza < 0)
// zostaje w grze; harness przygotowuje STAN przed każdą turą przez istniejący hak civTest (__nnsMeasureDebug, tylko
// ?civTest=1): gdy gra sama zgłasza canEnd=false, podnosi skarbiec i spichlerz do progów pomiarowych (surowe ustawienie
// stanu, bez zmiany reguły — prognozę i decyzję dalej liczy gra). Zero zmian gra/src.
const GATE_TREASURY_FLOOR = 5000;
const GATE_GRANARY_FLOOR = 999;

async function prepareEndTurnGate(page, opts = {}) {
  const treasuryFloor = opts.treasuryFloor ?? GATE_TREASURY_FLOOR;
  const granaryFloor = opts.granaryFloor ?? GATE_GRANARY_FLOOR;
  return page.evaluate(({ tf, gf }) => {
    const d = window.__nnsMeasureDebug;
    if (!d || typeof d.gateInfo !== 'function') throw new Error('brak haka __nnsMeasureDebug (wymagane ?civTest=1)');
    const before = d.gateInfo();
    if (before.canEnd) return { changed: false, canEnd: true, turn: before.turn };
    d.setPlayerTreasury(Math.max(before.treasury, tf));
    d.setPlayerGranary(Math.max(before.granary, gf));
    const after = d.gateInfo();
    return { changed: true, canEnd: !!after.canEnd, turn: after.turn, gateBefore: before.gate, gateAfter: after.gate };
  }, { tf: treasuryFloor, gf: granaryFloor });
}

module.exports = { closeCivWelcome, WELCOME_ROOT, prepareEndTurnGate, GATE_TREASURY_FLOOR, GATE_GRANARY_FLOOR };
