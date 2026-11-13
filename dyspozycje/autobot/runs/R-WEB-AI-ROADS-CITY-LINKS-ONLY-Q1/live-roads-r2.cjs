'use strict';
// Pomiar dróg w żywej grze (Chromium, realny endTurn) + zrzut canvasu. Gracz z włączoną automatyzacją budowy + AI.
// Usage: ROBOCZA_HTML=... NODE_PATH=... EVID_DIR=... node live-roads.cjs <tag> <tury>
const C = require('/home/user/The-Game/.claude/worktrees/wf_f0c87e41-20c-3/gra/tools/live-verify-autoimprove-common.cjs');
(async () => {
  const tag = process.argv[2] || 'run';
  const turns = Number(process.argv[3] || 40);
  const browser = await C.launch();
  const s = await C.openMenu(browser, { query: '&playtest=1' });
  const out = { tag, turns: [] };
  try {
    await C.clickText(s.page, /Rozpocznij grę/); await C.wait(400);
    await C.gotoStep(s.page, 'Ustawienia');
    await C.setMapSize(s.page, 'Malenki');
    out.start = await C.startFromWizard(s, 7);
    await C.waitAwaitingCity(s.page);
    await C.foundCapital(s.page);
    await s.page.evaluate(() => { if (window.__dealsLiveDebug) window.__dealsLiveDebug.setGate(false); });
    out.setup = await s.page.evaluate(() => {
      const T = window.__civTest;
      T.unlockAllTech();
      const cap = T.state().cities.filter((c) => c.ownerId === 0)[0];
      const placed = [cap];
      for (const c of T.foundCandidates(100000)) {
        if (placed.length >= 5) break;
        const d = (a, b) => Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r));
        if (placed.every((m) => d(m, c) >= 4) && d(cap, c) <= 9) { T.foundCity(c.q, c.r); placed.push(c); }
      }
      T.setAutoBuild(true);
      T.setPraca(100000);
      T.setPolicy(0, { focus: 'zrownowazone', tryb: 'auto', onlyWorked: false, pracaAutoPercent: 100 });
      return { cities: T.state().cities.filter((c) => c.ownerId === 0).length };
    });
    const scan = () => s.page.evaluate(() => {
      const T = window.__civTest;
      const st = T.state();
      const byOwner = {};
      const NB = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
      const seen = new Set();
      const roads = new Map();
      const cityOwner = new Map();
      for (const c of st.cities) cityOwner.set(c.q + ',' + c.r, c.ownerId);
      for (const c of st.cities) {
        for (const h of T.around(c.q, c.r, 10, false)) {
          const k = h.q + ',' + h.r; if (seen.has(k)) continue; seen.add(k);
          if (h.layers.some((l) => /^droga/.test(l))) roads.set(k, h.owner);
        }
      }
      for (const [k, o] of roads) { const key = String(o); byOwner[key] = (byOwner[key] || 0) + 1; }
      // trojkaty (3 wzajemnie sasiadujace heksy drog) + dead-endy
      const keys = new Set(roads.keys()); let tri = 0, dead = 0;
      for (const k of keys) {
        const [q, r] = k.split(',').map(Number);
        const nbs = NB.map(([a, b]) => (q + a) + ',' + (r + b));
        const rn = nbs.filter((n) => keys.has(n) || cityOwner.has(n));
        if (rn.length <= 1) dead++;
        const rr = nbs.filter((n) => keys.has(n));
        for (let i = 0; i < rr.length; i++) for (let j = i + 1; j < rr.length; j++) {
          const [q1, r1] = rr[i].split(',').map(Number); const [q2, r2] = rr[j].split(',').map(Number);
          if (NB.some(([a, b]) => q1 + a === q2 && r1 + b === r2)) tri++;
        }
      }
      return { turn: st.turn, roads: roads.size, byOwner, tri: tri / 3, dead, cities: st.cities.filter((c) => c.ownerId === 0).length };
    });
    for (let t = 0; t < turns; t++) {
      const r = await C.endTurnAndWait(s);
      const sc = await scan();
      out.turns.push({ ok: r.ok, ms: r.ms, ...sc });
      C.save(`roads-${tag}.json`, out);
      if (!r.ok) break;
    }
    // zrzut REALNEGO canvasu mapy
    await C.wait(800);
    const cv = await s.page.$('canvas');
    if (cv) await cv.screenshot({ path: `${process.env.EVID_DIR}/zrzut-canvas-${tag}.png` });
    else await s.page.screenshot({ path: `${process.env.EVID_DIR}/zrzut-canvas-${tag}.png` });
  } catch (e) { out.error = String(e.stack || e); }
  out.pageErrors = s.errors.slice(0, 5);
  C.save(`roads-${tag}.json`, out);
  const last = out.turns[out.turns.length - 1] || {};
  const msAvg = out.turns.length ? Math.round(out.turns.reduce((a, b) => a + b.ms, 0) / out.turns.length) : null;
  console.log(JSON.stringify({ tag, error: out.error || null, last, msAvg, nTurns: out.turns.length }));
  await browser.close();
})();
