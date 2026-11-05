'use strict';
/**
 * autoimprove-river-forest-live-verify-q1.cjs — R-WEB-AUTOIMPROVE-RIVER-FOREST-LIVE-VERIFY-Q1.
 * Pomiar w ZYWEJ grze (Chromium, ?civTest=1, REALNY endTurn z main.ts): kiedy znika las przy rzece na polu OBYWATELA
 * (farma mozliwa: Laka/Rownina; NIE Wzgorza) — profile gracza + AI. Zero zmian logiki; tylko odczyt przez `window.__civTest`.
 *
 * Usage: ROBOCZA_HTML=<bundle> NODE_PATH=/opt/node-tools/node_modules EVID_DIR=<katalog> \
 *   SEED=18 FOCUS=zywnosc|zrownowazone WORKERS=forest|auto  node autoimprove-river-forest-live-verify-q1.cjs <tag> <tury>
 *
 * Metryki na tura:
 *  - rfWorked: heksy gracza z lasem + rzeka + baza pod farme (Laka/Rownina) z obywatelem NA poczatku tury (przed endTurn),
 *  - rfMissed: z tych heksow te, ktore PO endTurn nadal sa lasem i NIE maja wycinki w toku (= nie wyciete w pierwszej mozliwej turze),
 *  - rfOwned/rfOwnedWorked: wszystkie takie heksy w terytorium (okno promienia 8) i ile z nich ma obywatela,
 *  - missReasons: ostatni powod odrzucenia (scope=las) z pickera dla chybionych heksow,
 *  - AI: to samo agregatem po wszystkich miastach AI (promien 7): aiRfOwned / aiRfWorked / aiRfMissedPersistent.
 */
const C = require('./live-verify-autoimprove-common.cjs');
const SEED = Number(process.env.SEED || 18);
const FOCUS = process.env.FOCUS || 'zywnosc';
const WORKERS = process.env.WORKERS || 'forest';

(async () => {
  const tag = process.argv[2] || 'run';
  const turns = Number(process.argv[3] || 20);
  const browser = await C.launch();
  const s = await C.openMenu(browser, { query: '&playtest=1' });
  const out = { tag, focus: FOCUS, workers: WORKERS, seed: SEED, turns: [] };
  const fname = `rfv-${tag}.json`;
  try {
    await C.clickText(s.page, /Rozpocznij grę/); await C.wait(400);
    await C.gotoStep(s.page, 'Ustawienia');
    await C.setMapSize(s.page, 'Malenki');
    out.start = await C.startFromWizard(s, SEED);
    await C.waitAwaitingCity(s.page);
    await C.foundCapital(s.page);
    await s.page.evaluate(() => { if (window.__dealsLiveDebug) window.__dealsLiveDebug.setGate(false); });
    out.setup = await s.page.evaluate(({ FOCUS, WORKERS }) => {
      const T = window.__civTest;
      T.unlockAllTech();
      T.foundCity(24, 30);
      const mine0 = T.state().cities.filter((c) => c.ownerId === 0);
      const far = T.foundCandidates(100000).find((c) => mine0.every((m) => Math.max(Math.abs(m.q - c.q), Math.abs(m.r - c.r)) >= 6));
      if (far) T.foundCity(far.q, far.r);
      T.setPraca(100000);
      const me = T.state().cities.filter((c) => c.ownerId === 0)[0];
      T.setPolicy(0, { focus: FOCUS, tryb: 'auto', onlyWorked: true, pracaAutoPercent: 100 });
      if (WORKERS === 'forest') {
        const farmBase = (h) => /rownina|laka/i.test(h.teren || '');
        const around = T.around(me.q, me.r, 6, false).filter((h) => h.owner === 0 && h.nakladka === 'las' && !(h.q === me.q && h.r === me.r));
        around.sort((a, b) => (farmBase(b) - farmBase(a)) || (a.naRzece === b.naRzece ? 0 : a.naRzece ? -1 : 1));
        T.setCityWorkers(me.id, around.slice(0, Math.min(me.pop, around.length)).map((h) => h.q + ',' + h.r));
      }
      T.debugOn(); T.drainDecisions();
      return { city: me, policy: T.state().policyMe, workers: T.getCityWorkers(me.id) };
    }, { FOCUS, WORKERS });

    // Jedno przejscie: stan lasow rzecznych (farmbase) wokol miast gracza (me=true) albo AI (me=false).
    const scan = (mine) => s.page.evaluate(({ mine }) => {
      const T = window.__civTest;
      const st = T.state();
      const cs = st.cities.filter((c) => (mine ? c.ownerId === 0 : c.ownerId !== 0 && c.ownerId < 20));
      const worked = new Set();
      for (const c of cs) for (const k of T.getCityWorkers(c.id)) worked.add(k);
      const seen = new Set(); const rf = []; const layerCounts = {};
      for (const c of cs) {
        for (const h of T.around(c.q, c.r, mine ? 8 : 7, false)) {
          const k = h.q + ',' + h.r;
          if (seen.has(k)) continue; seen.add(k);
          if (mine ? h.owner !== 0 : (h.owner === 0 || h.owner == null)) continue;
          for (const l of h.layers) layerCounts[l] = (layerCounts[l] || 0) + 1;
          const farmBase = /rownina|laka/i.test(h.teren || '');
          if (h.nakladka === 'las' && h.naRzece && farmBase) rf.push({ k, worked: worked.has(k), clearing: h.clearing });
        }
      }
      return { turn: st.turn, cities: cs.length, rf, layerCounts };
    }, { mine });

    let prev = await scan(true);
    let prevAi = await scan(false);
    let firstCut = null;
    for (let t = 0; t < turns; t++) {
      const before = prev; const beforeAi = prevAi;
      const r = await C.endTurnAndWait(s);
      const after = await scan(true);
      const afterAi = await scan(false);
      const decisions = await s.page.evaluate(() => window.__civTest.drainDecisions());
      const aMap = new Map(after.rf.map((h) => [h.k, h]));
      const workedBefore = before.rf.filter((h) => h.worked && !h.clearing);
      // chybiony = nadal las (jest w `after.rf`) i bez wycinki w toku
      const missed = workedBefore.filter((h) => aMap.has(h.k) && !aMap.get(h.k).clearing);
      const cut = workedBefore.length - missed.length;
      const reasons = {};
      for (const m of missed) {
        const last = decisions.filter((d) => d.scope === 'las' && d.hex === m.k && !/poza priorytetami/.test(d.reason || '')).pop();
        const key = last ? last.reason + (last.verdict ? '|' + last.verdict : '') : 'brak decyzji pickera (poza etapem bez wyrab) dla heksu';
        reasons[key] = (reasons[key] || 0) + 1;
      }
      if (firstCut == null && cut > 0) firstCut = before.turn;
      // AI: trwale chybione = obywatel + rzeka + las + farmbase zarowno przed jak i po turze, bez wycinki w toku
      const aiAfterMap = new Map(afterAi.rf.map((h) => [h.k, h]));
      const aiPersistList = beforeAi.rf.filter((h) => h.worked && aiAfterMap.has(h.k) && aiAfterMap.get(h.k).worked && !aiAfterMap.get(h.k).clearing);
      const aiPersist = aiPersistList.length;
      const aiReasons = {};
      for (const m of aiPersistList) {
        const last = decisions.filter((d) => d.scope === 'las' && d.hex === m.k && !/poza priorytetami/.test(d.reason || '')).pop();
        const key = last ? last.reason + (last.verdict ? '|' + last.verdict : '') : 'brak decyzji pickera (poza etapem bez wyrab) dla heksu';
        aiReasons[key] = (aiReasons[key] || 0) + 1;
      }
      // Szczegol (max 6 wpisow na caly przebieg): dla pierwszych chybionych heksow AI — kazda decyzja pickera (miasto, powod)
      // oraz czy TO miasto ma obywatela na heksie wg haka `getCityWorkers` (REALNA funkcja gry).
      out.aiDetail = out.aiDetail || [];
      for (const m of aiPersistList.slice(0, 2)) {
        if (out.aiDetail.length >= 6) break;
        const ds = decisions.filter((d) => d.scope === 'las' && d.hex === m.k);
        const uniq = {};
        for (const d of ds) uniq[(d.cityId || '?') + '|' + d.reason + '|' + (d.verdict || '')] = 1;
        const cityIds = Array.from(new Set(ds.map((d) => d.cityId).filter(Boolean)));
        const workedBy = await s.page.evaluate(({ k, cityIds }) => cityIds.filter((id) => window.__civTest.getCityWorkers(id).includes(k)), { k: m.k, cityIds });
        out.aiDetail.push({ turn: before.turn, hex: m.k, workedBy, decisions: Object.keys(uniq).slice(0, 12) });
      }
      out.turns.push({
        ok: r.ok, turnBefore: before.turn, turnAfter: after.turn,
        rfOwned: after.rf.length, rfOwnedWorked: after.rf.filter((h) => h.worked).length,
        rfWorkedBefore: workedBefore.length, rfCut: cut, rfMissed: missed.length, layerCounts: after.layerCounts, missReasons: reasons,
        aiRfOwned: afterAi.rf.length, aiRfWorked: afterAi.rf.filter((h) => h.worked).length, aiRfPersistMissed: aiPersist, aiMissReasons: aiReasons, aiPersistHexes: aiPersistList.map((h) => h.k), aiCities: afterAi.cities,
      });
      prev = after; prevAi = afterAi;
      C.save(fname, out);
      if (!r.ok) break;
    }
    out.firstCutTurn = firstCut;
  } catch (e) { out.error = String(e.stack || e); }
  out.pageErrors = s.errors.slice(0, 5);
  C.save(fname, out);
  const tt = out.turns;
  console.log(JSON.stringify({
    tag, seed: SEED, focus: FOCUS, workers: WORKERS, error: out.error, turns: tt.length, firstCutTurn: out.firstCutTurn,
    sumWorkedBefore: tt.reduce((n, x) => n + x.rfWorkedBefore, 0), sumCut: tt.reduce((n, x) => n + x.rfCut, 0), sumMissed: tt.reduce((n, x) => n + x.rfMissed, 0),
    missedTurns: tt.filter((x) => x.rfMissed > 0).map((x) => x.turnBefore), rfOwned0: tt[0] && tt[0].rfOwned, rfOwnedWorked0: tt[0] && tt[0].rfOwnedWorked,
    aiRfOwnedFirstLast: [tt[0] && tt[0].aiRfOwned, tt.length && tt[tt.length - 1].aiRfOwned], aiRfWorkedMax: Math.max(0, ...tt.map((x) => x.aiRfWorked)), aiPersistMissedSum: tt.reduce((n, x) => n + x.aiRfPersistMissed, 0),
  }));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(2); });
