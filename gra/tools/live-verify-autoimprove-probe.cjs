'use strict';
// Sonda: start gry na malej mapie (SIZE, SEED) + zbior wartosci nakladka/teren + wyszukanie miejsc pod scenariusze A-C.
const C = require('./live-verify-autoimprove-common.cjs');
(async () => {
  const browser = await C.launch();
  const s = await C.openMenu(browser);
  await C.clickText(s.page, /Rozpocznij grę/); await C.wait(400);
  await C.gotoStep(s.page, 'Ustawienia');
  console.log('rozmiar:', await C.setMapSize(s.page, process.env.SIZE || 'Malenki'));
  const start = await C.startFromWizard(s, Number(process.env.SEED || 1001));
  console.log('start', JSON.stringify(start));
  await C.waitAwaitingCity(s.page);
  await C.foundCapital(s.page);
  const r = await s.page.evaluate(() => {
    const T = window.__civTest;
    const cand = T.foundCandidates(100000).concat(T.state().cities.filter(c => c.ownerId === 0).map(c => ({ q: c.q, r: c.r, capital: true })));
    const vals = { nak: {}, ter: {} };
    const sites = [];
    for (const c of cand) {
      const ar = T.around(c.q, c.r, 3, false);
      let riverAny = 0, forestOff = 0, forestRiv = 0, riverOpen = 0, farmable = 0;
      for (const h of ar) {
        const isF = /las/i.test(h.nakladka || '');
        vals.nak[h.nakladka] = (vals.nak[h.nakladka] || 0) + 1; vals.ter[h.teren] = (vals.ter[h.teren] || 0) + 1;
        if (isF && !h.naRzece) forestOff++; if (h.naRzece) riverAny = (typeof riverAny === 'number' ? riverAny : 0) + 1;
        if (isF && h.naRzece) forestRiv++;
        if (!isF && h.naRzece && /rownina|laka/i.test(h.teren || '')) riverOpen++;
        if (!isF && /rownina|laka/i.test(h.teren || '')) farmable++;
      }
      sites.push({ cap: !!c.capital, q: c.q, r: c.r, forestOff, forestRiv, riverOpen, farmable, riverAny });
    }
    return { nCand: cand.length, vals, sitesN: sites.length, sites: sites.sort((a, b) => (Math.min(b.forestOff, 3) + Math.min(b.riverOpen, 3)) - (Math.min(a.forestOff, 3) + Math.min(a.riverOpen, 3))).slice(0, 8) };
  });
  console.log(JSON.stringify(r, null, 1).slice(0, 5000));
  console.log('errors', s.errors.slice(0, 5));
  await browser.close();
})().catch(e => { console.error(e); process.exit(2); });
