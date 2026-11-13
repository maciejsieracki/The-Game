'use strict';
/**
 * live-verify-autoimprove-nohooks.cjs — R-WEB-AUTOIMPROVE-LIVE-SCENARIOS-Q1, scenariusz E.
 * (1) bez ?civTest=1 `window.__civTest === undefined` (menu + po starcie gry; takze ?civTest=0 / ?civTest=true / ?xcivTest=1);
 * (2) gra startuje i przechodzi N tur (domyslnie 20; AI gra) bez bledow konsoli/pageerror.
 * Usage: ROBOCZA_HTML=... NODE_PATH=... node gra/tools/live-verify-autoimprove-nohooks.cjs [tury=20]
 * Zapis: evidence/nohooks.json
 */
const C = require('./live-verify-autoimprove-common.cjs');
(async () => {
  const turns = Number(process.argv[2] || 20);
  const browser = await C.launch();
  const out = { queries: {}, turns: [] };
  for (const q of ['&civTest=0', '&civTest=true', '&xcivTest=1', '&civTest=']) {
    const s = await C.openMenu(browser, { noHooks: true, query: q });
    out.queries[q] = await s.page.evaluate(() => ({ civTest: typeof window.__civTest, autoDebug: typeof window.__civAutoImproveDebug }));
    await s.ctx.close();
  }
  const s = await C.openMenu(browser, { noHooks: true });
  out.menu = await s.page.evaluate(() => ({ url: location.href.replace(/^.*\//, ''), civTest: typeof window.__civTest }));
  try {
    await C.clickText(s.page, /Rozpocznij grę/); await C.wait(400);
    await C.gotoStep(s.page, 'Ustawienia');
    await C.setMapSize(s.page, 'Malenki');
    out.start = await C.startFromWizard(s, 18);
    await C.waitAwaitingCity(s.page);
    await C.foundCapital(s.page);
    out.afterStart = await s.page.evaluate(() => ({ civTest: typeof window.__civTest, turn: window.__cityStateStartUnitsTestDebug.dumpState().turn }));
    for (let t = 0; t < turns; t++) {
      const r = await C.endTurnAndWait(s);
      out.turns.push(r);
      if (!r.ok) break;
    }
    out.end = await s.page.evaluate(() => { const st = window.__cityStateStartUnitsTestDebug.dumpState(); return { civTest: typeof window.__civTest, turn: st.turn, cities: st.cities.length, aiCities: st.cities.filter((c) => c.ownerId !== 0).length }; });
  } catch (e) { out.error = String(e.stack || e); }
  out.consoleErrors = s.errors.slice(0, 20);
  out.consoleErrorCount = s.errors.length;
  out.consoleWarnLikeCount = s.logs.filter((l) => /^(error|uncaught)/i.test(l)).length;
  C.save('nohooks.json', out);
  console.log(JSON.stringify({ ...out, turns: out.turns.map((t) => `${t.before}->${t.after}:${t.ok}`).join(' ') }, null, 1).slice(0, 4000));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(2); });
