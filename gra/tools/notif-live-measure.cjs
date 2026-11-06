'use strict';
/**
 * notif-live-measure.cjs — R-WEB-UI-NOTIFICATIONS-3-TABS-PRUNE-Q1 (pomiar PRZED/PO w ZYWEJ grze).
 * Chromium + realny endTurn z main.ts (?civTest=1). Po KAZDEJ turze czyta pelna, NIEfiltrowana liste
 * wpisow panelu WYDARZENIA (`__sidePanelLinkTestDebug.allEvents`, tylko odczyt) i dopisuje linie JSONL.
 * Zero zmian logiki gry. Klasyfikacja do zakladek i tabela: tools/notif-live-summarize.cjs.
 *
 * Usage (z gra/):
 *   ROBOCZA_HTML=<index.html z vite build> SEED=18 TURNS=30 OUT=<plik.jsonl> node tools/notif-live-measure.cjs
 */
const fs = require('fs');
const C = require('./live-verify-autoimprove-common.cjs');

const SEED = Number(process.env.SEED || 18);
const TURNS = Number(process.env.TURNS || 30);
const OUT = process.env.OUT || ('notif-measure-' + SEED + '.jsonl');
const log = (o) => fs.appendFileSync(OUT, JSON.stringify(o) + '\n');

(async () => {
  fs.writeFileSync(OUT, '');
  const browser = await C.launch();
  const s = await C.openMenu(browser, { query: '&playtest=1' });
  try {
    await C.clickText(s.page, /Rozpocznij grę/); await C.wait(400);
    await C.gotoStep(s.page, 'Ustawienia');
    await C.setMapSize(s.page, 'Malenki');
    const start = await C.startFromWizard(s, SEED);
    await C.waitAwaitingCity(s.page);
    await C.foundCapital(s.page);
    await s.page.evaluate(() => { if (window.__dealsLiveDebug) window.__dealsLiveDebug.setGate(false); });
    const setup = await s.page.evaluate(() => {
      const T = window.__civTest;
      T.unlockAllTech();
      const mine0 = T.state().cities.filter((c) => c.ownerId === 0);
      const far = T.foundCandidates(100000).find((c) => mine0.every((m) => Math.max(Math.abs(m.q - c.q), Math.abs(m.r - c.r)) >= 5));
      if (far) T.foundCity(far.q, far.r);
      T.setPraca(100000);
      T.setPolicy(0, { focus: 'zywnosc', tryb: 'auto', onlyWorked: true, pracaAutoPercent: 100 });
      return { cities: T.state().cities.filter((c) => c.ownerId === 0).length };
    });
    log({ kind: 'start', seed: SEED, seedSeen: start.seedSeen, setup });
    for (let i = 0; i < TURNS; i++) {
      const r = await C.endTurnAndWait(s);
      const events = await s.page.evaluate(() => (window.__sidePanelLinkTestDebug ? window.__sidePanelLinkTestDebug.allEvents() : null));
      log({ kind: 'turn', seed: SEED, turnBefore: r.before, turnAfter: r.after, ok: r.ok, ms: r.ms, events });
      if (!r.ok) break;
    }
  } catch (e) {
    log({ kind: 'error', error: String(e.stack || e) });
  }
  log({ kind: 'done', pageErrors: s.errors.slice(0, 5) });
  await browser.close();
})();
