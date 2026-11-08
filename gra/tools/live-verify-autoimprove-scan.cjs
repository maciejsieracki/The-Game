'use strict';
/**
 * Skan ziaren pod scenariusze A-C: szuka miejsca zalozenia miasta gracza (kandydaci foundCandidates + stolica) z
 * lasem POZA rzeka (naRzece=false) i heksami rzeki bez lasu. Usage: node live-verify-autoimprove-scan.cjs 11 12 13
 * Wynik: evidence/scan-<seed>.json (najlepsze miejsca).
 */
const C = require('./live-verify-autoimprove-common.cjs');
(async () => {
  const seeds = process.argv.slice(2).map(Number);
  const browser = await C.launch();
  for (const seed of seeds) {
    const s = await C.openMenu(browser);
    try {
      await C.clickText(s.page, /Rozpocznij grę/); await C.wait(400);
      await C.gotoStep(s.page, 'Ustawienia');
      await C.setMapSize(s.page, process.env.SIZE || 'Malenki');
      await C.startFromWizard(s, seed);
      await C.waitAwaitingCity(s.page);
      await C.foundCapital(s.page);
      const r = await s.page.evaluate(() => {
        const T = window.__civTest;
        const cand = T.foundCandidates(100000).concat(T.state().cities.filter(c => c.ownerId === 0).map(c => ({ q: c.q, r: c.r, capital: true })));
        const sites = [];
        for (const c of cand) {
          const ar = T.around(c.q, c.r, 3, false);
          let forestOff = 0, forestRiv = 0, riverOpen = 0, noRiverNoForest = 0, wz = 0;
          for (const h of ar) {
            const isF = h.nakladka === 'las';
            if (isF && !h.naRzece) forestOff++;
            if (isF && h.naRzece) forestRiv++;
            if (!isF && h.naRzece && /rownina|laka/.test(h.teren || '')) riverOpen++;
            if (!isF && !h.naRzece && /rownina|laka/.test(h.teren || '')) noRiverNoForest++;
          }
          sites.push({ cap: !!c.capital, q: c.q, r: c.r, forestOff, forestRiv, riverOpen, noRiverNoForest });
        }
        sites.sort((a, b) => (Math.min(b.forestOff, 3) * 10 + Math.min(b.riverOpen, 3)) - (Math.min(a.forestOff, 3) * 10 + Math.min(a.riverOpen, 3)));
        return { n: cand.length, best: sites.slice(0, 4) };
      });
      console.log('seed', seed, JSON.stringify(r));
      C.save(`scan-${seed}.json`, r);
    } catch (e) { console.log('seed', seed, 'ERR', String(e.message || e).slice(0, 200)); }
    await s.ctx.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
