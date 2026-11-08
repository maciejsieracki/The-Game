'use strict';
/**
 * live-verify-autoimprove-fort-fill-probe.cjs — R-WEB-AUTO-FORT-LIVE-U2-Q1 (obrona, zarzut 2).
 * Pomiar wykonalnosci wariantu "zalozyc N miast przez T.foundCity po unlockAllTech" (limit epoki 3 = 11), tak by limit miast
 * gracza byl FAKTYCZNIE wyczerpany bez haka w gra/src. Po unlockAllTech + 1 turze (era 3) probuje zalozyc miasta z T.foundCandidates
 * (wlasne terytorium), po kazdej turze, i raportuje liczbe miast gracza oraz powody odmow.
 * Usage: ROBOCZA_HTML=... NODE_PATH=... EVID_DIR=... [SEED=18] node gra/tools/live-verify-autoimprove-fort-fill-probe.cjs [tury=6] [cel=11]
 */
const C = require('./live-verify-autoimprove-common.cjs');
const SEED = Number(process.env.SEED || 18);

const FILL = (goal) => {
  const T = window.__civTest;
  const mine = () => T.state().cities.filter((c) => c.ownerId === T.state().me);
  const toast = () => { const el = document.getElementById('civ-hint-toast'); return el && el.style.display !== 'none' ? el.textContent : null; };
  const res = { turn: T.state().turn, before: mine().length, tries: [] };
  const era = window.__eraTestDebug && window.__eraTestDebug.getPlayerState ? window.__eraTestDebug.getPlayerState() : null;
  res.playerEra = era && era.era;
  for (let i = 0; i < 40 && mine().length < goal; i++) {
    const cand = T.foundCandidates(40);
    let did = false;
    for (const c of cand) {
      const b = mine().length; const ok = T.foundCity(c.q, c.r);
      if (mine().length > b) { did = true; res.tries.push({ q: c.q, r: c.r, ok: true }); break; }
      if (res.tries.length < 12) res.tries.push({ q: c.q, r: c.r, ok, toast: toast() });
    }
    if (!did) { res.stop = cand.length ? 'wszystkie kandydaci odrzuceni' : 'brak kandydatow'; break; }
  }
  res.after = mine().length; res.pops = mine().map((c) => c.pop);
  return res;
};

(async () => {
  const turns = Number(process.argv[2] || 6);
  const goal = Number(process.argv[3] || 11);
  const browser = await C.launch();
  const s = await C.openMenu(browser, { newGamePrefs: { v: 4, advanced: { cityLimitBase: 1 } } });
  const out = { seed: SEED, goal, rounds: [] };
  try {
    await C.clickText(s.page, /Rozpocznij grę/); await C.wait(400);
    await C.gotoStep(s.page, 'Ustawienia');
    await C.setMapSize(s.page, 'Malenki');
    out.start = await C.startFromWizard(s, SEED);
    await C.waitAwaitingCity(s.page);
    await C.foundCapital(s.page);
    await s.page.evaluate(() => { const T = window.__civTest; T.unlockAllTech(); T.setPraca(100000); });
    for (let t = 0; t < turns; t++) {
      const r = await C.endTurnAndWait(s);
      if (!r.ok) break;
      out.rounds.push(await s.page.evaluate(FILL, goal));
      C.save(`fort-fill-probe-s${SEED}.json`, out);
    }
  } catch (e) { out.error = String(e.stack || e); }
  out.pageErrors = s.errors.slice(0, 10);
  C.save(`fort-fill-probe-s${SEED}.json`, out);
  console.log(JSON.stringify(out).slice(0, 6000));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(2); });
