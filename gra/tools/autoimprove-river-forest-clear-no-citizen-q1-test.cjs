'use strict';
/**
 * autoimprove-river-forest-clear-no-citizen-q1-test.cjs — R-WEB-AUTOIMPROVE-RIVER-FOREST-CLEAR-NO-CITIZEN-Q1.
 * Pomiar/test w ZYWEJ grze (Chromium, ?civTest=1, REALNY endTurn): las przy rzece (Laka/Rownina, naRzece) jest wycinany
 * takze BEZ obywatela; obywatele rozstawiani przez AUTO-rozdzial gry (zadnego setCityWorkers). Mierzy:
 *  - cut/cutNoCit: ile pol las+rzeka+baza-pod-farme wycieto (i ile z nich bez obywatela w chwili wycinki), tura pierwszej wycinki,
 *  - farma/irygacja/tartak po N turach (warstwy), czas endTurn,
 *  - ZAD. 6: po wycince — w ilu % wycietych pol auto-rozdzial przydzielil tam obywatela i po ilu turach (assignedPct, lagAvg),
 *  - AI: to samo agregatem (miasta AI, promien 7).
 * Usage: ROBOCZA_HTML=<bundle> NODE_PATH=/opt/node-tools/node_modules EVID_DIR=<dir> SEED=7 FOCUS=zywnosc|zrownowazone \
 *        [ASSERT=1] node autoimprove-river-forest-clear-no-citizen-q1-test.cjs <tag> <tury>
 */
const C = require('./live-verify-autoimprove-common.cjs');
const SEED = Number(process.env.SEED || 7);
const FOCUS = process.env.FOCUS || 'zywnosc';

(async () => {
  const tag = process.argv[2] || 'run';
  const turns = Number(process.argv[3] || 30);
  const browser = await C.launch();
  const s = await C.openMenu(browser, { query: '&playtest=1' });
  const out = { tag, focus: FOCUS, seed: SEED, turns: [] };
  const fname = `rfnc-${tag}.json`;
  try {
    await C.clickText(s.page, /Rozpocznij grę/); await C.wait(400);
    await C.gotoStep(s.page, 'Ustawienia');
    await C.setMapSize(s.page, 'Malenki');
    out.start = await C.startFromWizard(s, SEED);
    await C.waitAwaitingCity(s.page);
    await C.foundCapital(s.page);
    await s.page.evaluate(() => { if (window.__dealsLiveDebug) window.__dealsLiveDebug.setGate(false); });
    out.setup = await s.page.evaluate(({ FOCUS }) => {
      const T = window.__civTest;
      T.unlockAllTech();
      T.foundCity(24, 30);
      const mine0 = T.state().cities.filter((c) => c.ownerId === 0);
      const far = T.foundCandidates(100000).find((c) => mine0.every((m) => Math.max(Math.abs(m.q - c.q), Math.abs(m.r - c.r)) >= 6));
      if (far) T.foundCity(far.q, far.r);
      T.setPraca(100000);
      T.setPolicy(0, { focus: FOCUS, tryb: 'auto', onlyWorked: true, pracaAutoPercent: 100 });
      T.debugOn(); T.drainDecisions();
      return { cities: T.state().cities.filter((c) => c.ownerId === 0).length, policy: T.state().policyMe };
    }, { FOCUS });

    // Skan: pola baza-pod-farme + przy rzece w terytorium (gracz albo AI): nakladka, czy ma obywatela (auto-rozdzial).
    const scan = (mine) => s.page.evaluate(({ mine }) => {
      const T = window.__civTest;
      const st = T.state();
      const cs = st.cities.filter((c) => (mine ? c.ownerId === 0 : c.ownerId !== 0 && c.ownerId < 20));
      const worked = new Set();
      for (const c of cs) for (const k of T.getCityWorkers(c.id)) worked.add(k);
      const seen = new Set(); const hexes = []; const lc = {};
      for (const c of cs) {
        for (const h of T.around(c.q, c.r, mine ? 8 : 7, false)) {
          const k = h.q + ',' + h.r;
          if (seen.has(k)) continue; seen.add(k);
          if (mine ? h.owner !== 0 : (h.owner === 0 || h.owner == null)) continue;
          for (const l of h.layers) lc[l] = (lc[l] || 0) + 1;
          if (h.naRzece && /rownina|laka/i.test(h.teren || '')) hexes.push({ k, las: h.nakladka === 'las', clearing: !!h.clearing, w: worked.has(k) });
        }
      }
      return { turn: st.turn, cities: cs.length, hexes, lc };
    }, { mine });

    const trk = { me: { cut: new Map() }, ai: { cut: new Map() } };
    const update = (tk, prev, now) => {
      const nowMap = new Map(now.hexes.map((h) => [h.k, h]));
      for (const p of prev.hexes) {
        const n = nowMap.get(p.k);
        if (p.las && n && !n.las && !tk.cut.has(p.k)) tk.cut.set(p.k, { turn: prev.turn, workedAtCut: p.w, assignTurn: n.w ? now.turn : null });
      }
      for (const [k, c] of tk.cut) { const n = nowMap.get(k); if (c.assignTurn == null && n && n.w) c.assignTurn = now.turn; }
    };
    let pMe = await scan(true), pAi = await scan(false);
    out.lasStart = { me: pMe.hexes.filter((h) => h.las).length, meWorked: pMe.hexes.filter((h) => h.las && h.w).length, ai: pAi.hexes.filter((h) => h.las).length };
    let firstCut = null, firstCutAi = null; const ms = [];
    const sum = (tk) => {
      const arr = Array.from(tk.cut.values());
      const as = arr.filter((c) => c.assignTurn != null);
      return {
        cut: arr.length, cutNoCit: arr.filter((c) => !c.workedAtCut).length, cutWithCit: arr.filter((c) => c.workedAtCut).length,
        assigned: as.length, assignedPct: arr.length ? +(100 * as.length / arr.length).toFixed(1) : null,
        assignedAfterNoCit: arr.filter((c) => !c.workedAtCut && c.assignTurn != null).length,
        lagAvg: as.length ? +(as.reduce((n, c) => n + (c.assignTurn - c.turn), 0) / as.length).toFixed(2) : null,
        lagMax: as.length ? Math.max(...as.map((c) => c.assignTurn - c.turn)) : null,
      };
    };
    const finalize = () => {
      out.me = sum(trk.me); out.ai = sum(trk.ai);
      out.firstCutTurn = firstCut; out.firstCutTurnAi = firstCutAi;
      const last = out.turns[out.turns.length - 1];
      out.final = { lc: last && last.lc, lcAi: last && last.lcAi, lasLeftMe: last && last.lasLeftMe, msAvg: ms.length ? Math.round(ms.reduce((a, b) => a + b, 0) / ms.length) : null };
    };
    
    for (let t = 0; t < turns; t++) {
      const r = await C.endTurnAndWait(s); ms.push(r.ms);
      const nMe = await scan(true), nAi = await scan(false);
      update(trk.me, pMe, nMe); update(trk.ai, pAi, nAi);
      if (firstCut == null && trk.me.cut.size > 0) firstCut = pMe.turn;
      if (firstCutAi == null && trk.ai.cut.size > 0) firstCutAi = pAi.turn;
      out.turns.push({ ok: r.ok, turn: pMe.turn, ms: r.ms, lasLeftMe: nMe.hexes.filter((h) => h.las).length, cutMe: trk.me.cut.size, cutAi: trk.ai.cut.size, lc: nMe.lc, lcAi: nAi.lc });
      pMe = nMe; pAi = nAi; finalize(); C.save(fname, out);
      if (!r.ok) break;
    }
    finalize();
  } catch (e) { out.error = String(e.stack || e); }
  out.pageErrors = s.errors.slice(0, 5);
  C.save(fname, out);
  const f = out.final || {};
  console.log(JSON.stringify({
    tag, seed: SEED, focus: FOCUS, error: out.error, turns: out.turns.length, lasStart: out.lasStart, firstCutTurn: out.firstCutTurn, me: out.me,
    firstCutTurnAi: out.firstCutTurnAi, ai: out.ai, farma: f.lc && f.lc.farma, irygacja: f.lc && f.lc.irygacja, tartak: f.lc && f.lc.tartak,
    wyrab: f.lc && f.lc.wyrab, lasLeftMe: f.lasLeftMe, msAvg: f.msAvg,
  }));
  await browser.close();
  if (process.env.ASSERT === '1') {
    let fails = 0; const chk = (c, m) => { console.log((c ? '  [OK] ' : '  [FAIL] ') + m); if (!c) fails++; };
    chk(!out.error, 'brak bledu przebiegu');
    chk(out.turns.length >= 20, 'przebieg >= 20 tur (jest ' + out.turns.length + ')');
    chk(out.lasStart && out.lasStart.me > 0, 'sa pola las+rzeka+baza pod farme w terytorium (' + (out.lasStart && out.lasStart.me) + ')');
    // Decyzja zapada w turze 1; pole znika (nakladka las -> brak) po turze wycinki, wiec skan widzi je w turze 2 (pomiar Q1 r1/r2).
    chk(out.firstCutTurn != null && out.firstCutTurn <= 2, 'pierwsza wycinka widoczna najpozniej w turze 2 (jest ' + out.firstCutTurn + ')');
    chk(out.me && out.me.cutNoCit > 0, 'wycieto pola BEZ obywatela (' + (out.me && out.me.cutNoCit) + ')');
    process.exitCode = fails ? 1 : 0;
  }
})().catch((e) => { console.error(e); process.exit(2); });
