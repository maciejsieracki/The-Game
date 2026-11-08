'use strict';
/**
 * R-WEB-AUTOIMPROVE-PASTURE-IRRIGATION-NOT-BUILT-Q2 (Operator R2) — pomiar w ZYWEJ grze (Chromium, ?civTest=1, REALNY endTurn).
 * Zero zmian logiki; tylko hooki `window.__civTest` + snapshot zapisu (roundTrip) do odczytu % per miasto.
 *
 * Scenariusz wlasciciela: wiele miast (do CITIES), duzy niewydany budzet (Praca doladowywana do POOL co ture), profil domyslny
 * (zrownowazone, 33%), automatyzacja budowy WLACZONA, tech: UNLOCK=all (wszystko) | UNLOCK=none (tylko startowe, bez hooka).
 * Metryki co ture: na polach obywateli (getCityWorkers) liczba z farma / trzoda (bydlo|owce|lama) / irygacja, osobno przy rzerze
 * (naRzece) i poza; rozklad % puli per miasto (snapshot); powody odrzucen pickera (onDecision) dla heksow obywateli bez trzody/irygacji.
 *
 * Uzycie: ROBOCZA_HTML=<kopia bundla> NODE_PATH=/opt/node-tools/node_modules EVID_DIR=<katalog> SEED=18 CITIES=26 TURNS=30 \
 *   POOL=3000 UNLOCK=all node tools/autoimprove-pasture-irrigation-q2-live-measure.cjs <tag>
 * Oczekiwanie PO naprawie (bundle zbudowany z tego brancha): w kilku turach `pastureOnFarmsRiver` == `farmsRiver` i `irrigRiver` == `farmsRiver`.
 */
const C = require('./live-verify-autoimprove-common.cjs');
const SEED = Number(process.env.SEED || 18);
const CITIES = Number(process.env.CITIES || 26);
const TURNS = Number(process.env.TURNS || 30);
const POOL = Number(process.env.POOL || 3000);
const UNLOCK = process.env.UNLOCK || 'all';
const MAP = process.env.MAP_SIZE || 'Malenki';
const PCT_ZERO_CITY = process.env.ZERO_PCT_CITY === '1'; // wymusza 1 miasto z override i 0% (kontrola sondy r1)

(async () => {
  const tag = process.argv[2] || 'run';
  const browser = await C.launch();
  const s = await C.openMenu(browser, { query: '&playtest=1' });
  const out = { tag, seed: SEED, cities: CITIES, pool: POOL, unlock: UNLOCK, map: MAP, turns: [] };
  const fname = `q2-live-${tag}.json`;
  try {
    await C.clickText(s.page, /Rozpocznij grę/); await C.wait(400);
    await C.gotoStep(s.page, 'Ustawienia');
    await C.setMapSize(s.page, MAP);
    out.start = await C.startFromWizard(s, SEED);
    await C.waitAwaitingCity(s.page);
    await C.foundCapital(s.page);
    await s.page.evaluate(() => { if (window.__dealsLiveDebug) window.__dealsLiveDebug.setGate(false); });
    out.setup = await s.page.evaluate(({ CITIES, POOL, UNLOCK }) => {
      const T = window.__civTest;
      if (UNLOCK === 'all') T.unlockAllTech();
      T.setCityLimit(CITIES + 10);
      T.setAutoBuild(true);
      // Domyslny tryb imperium to 'reczny' — wlasciciel ma 'auto'; % puli NIE jest ruszany (domyslne 33).
      T.setPolicy(0, { tryb: 'auto' });
      let founded = 1;
      for (let guard = 0; guard < 400 && founded < CITIES; guard++) {
        const mine = T.state().cities.filter((c) => c.ownerId === 0);
        const cand = T.foundCandidates(100000).find((c) => mine.every((m) => Math.max(Math.abs(m.q - c.q), Math.abs(m.r - c.r), Math.abs((m.q + m.r) - (c.q + c.r))) >= 3));
        if (!cand) break;
        if (T.foundCity(cand.q, cand.r)) founded++; else break;
      }
      T.setPraca(POOL);
      T.debugOn(); T.drainDecisions();
      return { founded, policy: T.state().policyMe };
    }, { CITIES, POOL, UNLOCK });

    const scan = () => s.page.evaluate(() => {
      const T = window.__civTest;
      const st = T.state();
      const mine = st.cities.filter((c) => c.ownerId === 0);
      const seen = new Set();
      const m = { turn: st.turn, cities: mine.length, praca: st.praca, worked: 0, farm: 0, pasture: 0, irrig: 0, farmsRiver: 0, pastureOnFarmsRiver: 0, irrigRiver: 0, farmsOff: 0, pastureOnFarmsOff: 0, noneWorkedFlat: 0 };
      const missing = [];
      for (const c of mine) {
        for (const k of T.getCityWorkers(c.id)) {
          if (seen.has(k)) continue; seen.add(k);
          const [q, r] = k.split(',').map(Number);
          const h = T.hex(q, r);
          if (!h) continue;
          m.worked++;
          const L = h.layers;
          const farm = L.includes('farma');
          const past = L.includes('bydlo') || L.includes('owce') || L.includes('lama');
          const irr = L.includes('irygacja');
          if (farm) m.farm++; if (past) m.pasture++; if (irr) m.irrig++;
          if (farm && h.naRzece) { m.farmsRiver++; if (past) m.pastureOnFarmsRiver++; if (irr) m.irrigRiver++; }
          if (farm && !h.naRzece) { m.farmsOff++; if (past) m.pastureOnFarmsOff++; }
          if (farm && h.naRzece && !(past && irr)) missing.push({ k, city: c.id, layers: L, teren: h.teren, nakladka: h.nakladka });
        }
      }
      m.missingSample = missing.slice(0, 6);
      return m;
    });

    for (let t = 0; t < TURNS; t++) {
      await s.page.evaluate((POOL) => window.__civTest.setPraca(POOL), POOL);
      const r = await C.endTurnAndWait(s);
      const m = await scan();
      const dec = await s.page.evaluate(() => window.__civTest.drainDecisions());
      const reasons = {};
      const sample = [];
      for (const d of dec) {
        const js = JSON.stringify(d);
        if (!/irygacja|bydlo|owce|lama/.test(js)) continue;
        const k = String(d.scope || '') + '|' + String(d.key || '') + '|' + String(d.verdict || '') + '|' + String(d.reason || '');
        reasons[k] = (reasons[k] || 0) + 1;
        if (sample.length < 3 && /irygacja/.test(js)) sample.push(d);
      }
      m.sample = sample;
      m.reasons = Object.fromEntries(Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 12));
      m.decisions = dec.length;
      m.ok = r.ok; if (!r.ok) { m.endTurnFail = { logs: r.endTurnLogs, visible: r.visible }; }
      out.turns.push(m);
      C.save(fname, out);
      if (!r.ok) break;
    }
    // Rozklad % puli per miasto (snapshot zapisu — pola ulepszeniaOverride/ulepszeniaPracaPercent + polityka imperium).
    out.pctDistribution = await s.page.evaluate(() => {
      window.__capSnap = null;
      window.__pracaPoolSaveLoadTestDebug.roundTrip();
      const sn = window.__capSnap;
      if (!sn) return null;
      const mine = sn.cities.filter((c) => c.ownerId === 0);
      const dist = {};
      for (const c of mine) {
        const key = c.ulepszeniaOverride === true ? 'override:' + String(c.ulepszeniaPracaPercent) : 'empire';
        dist[key] = (dist[key] || 0) + 1;
      }
      const pol = (sn.ulepszeniaEmpireByOwner || sn.ulepszeniaEmpire || null);
      return { cities: mine.length, dist, empirePolicyKeys: pol ? Object.keys(pol).slice(0, 4) : null, empirePolicy0: pol ? (pol['0'] || pol[0] || pol) : null };
    });
  } catch (e) { out.error = String(e.stack || e); }
  out.pageErrors = s.errors.slice(0, 5);
  C.save(fname, out);
  const tt = out.turns;
  console.log(JSON.stringify({
    tag, error: out.error, turns: tt.length, founded: out.setup && out.setup.founded, pct: out.pctDistribution,
    perTurn: tt.map((x) => [x.turn, x.worked, x.farm, x.pasture, x.irrig, x.farmsRiver, x.pastureOnFarmsRiver, x.irrigRiver, x.farmsOff, x.pastureOnFarmsOff].join('/')),
    legend: 'turn/worked/farm/pasture/irrig/farmsRiver/pastureOnFarmsRiver/irrigRiver/farmsOff/pastureOnFarmsOff',
    lastMissing: tt.length ? tt[tt.length - 1].missingSample : null,
    lastReasons: tt.length ? tt[tt.length - 1].reasons : null,
  }, null, 1));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(2); });
