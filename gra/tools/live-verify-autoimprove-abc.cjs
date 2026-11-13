'use strict';
/**
 * live-verify-autoimprove-abc.cjs — R-WEB-AUTOIMPROVE-LIVE-SCENARIOS-Q1, scenariusze A/B/C na ZYWEJ grze (hooki ?civTest=1).
 * Mapa: Malenki (76x52), ziarno 18, miasto gracza w (24,30) (las poza rzeka + rzeka bez lasu w r=3; skan: scan-18.json).
 * Usage: ROBOCZA_HTML=<kopia bundla> NODE_PATH=/opt/node-tools/node_modules node gra/tools/live-verify-autoimprove-abc.cjs <wariant> [tury]
 *   wariant: off | on | explore. Zapis: evidence/abc-<wariant>.json + abc-<wariant>.log
 */
const fs = require('fs');
const C = require('./live-verify-autoimprove-common.cjs');
const SEED = Number(process.env.SEED || 18);
const FOCUS = process.env.FOCUS || 'zrownowazone';
const SITE = (process.env.SITE || '24,30').split(',').map(Number);

(async () => {
  const variant = process.argv[2] || 'explore';
  const turns = Number(process.argv[3] || 3);
  const wolno = variant === 'on';
  const browser = await C.launch();
  const s = await C.openMenu(browser);
  const out = { variant, focus: FOCUS, seed: SEED, site: SITE, wolnoWycinacLas: wolno, turns: [] };
  try {
    await C.clickText(s.page, /Rozpocznij grę/); await C.wait(400);
    await C.gotoStep(s.page, 'Ustawienia');
    await C.setMapSize(s.page, 'Malenki');
    out.start = await C.startFromWizard(s, SEED);
    await C.waitAwaitingCity(s.page);
    await C.foundCapital(s.page);
    const setup = await s.page.evaluate(({ site, wolno, FOCUS }) => {
      const T = window.__civTest;
      T.unlockAllTech(); T.setPraca(100000);
      const ok = T.foundCity(site[0], site[1]);
      T.setPolicy(0, { focus: FOCUS, tryb: 'auto', onlyWorked: false, pracaAutoPercent: 100, wolnoWycinacLas: wolno });
      T.debugOn(); T.drainDecisions();
      return { foundOk: ok, state: T.state(), hexes0: T.around(site[0], site[1], 3, false).map(h => [h.q, h.r, h.teren, h.nakladka, h.naRzece ? 1 : 0, h.layers.join('+'), h.clearing ? 1 : 0, h.owner]) };
    }, { site: SITE, wolno, FOCUS });
    out.setup = setup;
    for (let t = 0; t < turns; t++) {
      const r = await C.endTurnAndWait(s);
      const snap = await s.page.evaluate(({ site }) => {
        const T = window.__civTest;
        const st = T.state();
        const mine = new Set(st.cities.filter(c => c.ownerId === 0).map(c => c.id));
        const all = T.drainDecisions();
        const decisions = all.filter(d => mine.has(d.cityId));
        const hexes = T.around(site[0], site[1], 3, false).map(h => [h.q, h.r, h.teren, h.nakladka, h.naRzece ? 1 : 0, h.layers.join('+'), h.clearing ? 1 : 0, h.owner]);
        return { decisions, nDecisionsAll: all.length, hexes, state: st };
      }, { site: SITE });
      out.turns.push({ end: r, ...snap });
      C.save(`abc-${variant}${FOCUS === 'zrownowazone' ? '' : '-' + FOCUS}.json`, out);
      if (!r.ok) break;
    }
  } catch (e) { out.error = String(e.stack || e); }
  out.pageErrors = s.errors.slice(0, 10);
  C.save(`abc-${variant}${FOCUS === 'zrownowazone' ? '' : '-' + FOCUS}.json`, out);
  console.log(JSON.stringify(out).slice(0, Number(process.env.PRINT || 6000)));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
