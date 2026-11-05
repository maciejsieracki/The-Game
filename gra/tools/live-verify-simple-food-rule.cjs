'use strict';
/**
 * live-verify-simple-food-rule.cjs — R-WEB-AUTOIMPROVE-SIMPLE-FOOD-RULE-NO-TOGGLES-Q1.
 * Pomiar na ZYWEJ grze (Chromium, ?civTest=1, REALNA sciezka main.ts: koniec tury gracza -> automat ulepszen -> hexClearingStates).
 * Scenariusz = stan z zrzutu wlasciciela: miasto gracza, profil FOCUS, obywatele STOJA na polach z lasem (reczne obsadzenie
 * przez hak `setCityWorkers`), 100% puli Pracy, kilka-kilkadziesiat tur.
 *
 * Usage: ROBOCZA_HTML=<bundle> NODE_PATH=/opt/node-tools/node_modules EVID_DIR=<katalog> \
 *   FOCUS=zywnosc|zrownowazone|surowce|infrastruktura  OW=0|1 (przelacznik "tylko pola z obywatelami", tylko stary kod)
 *   WOLNO=0|1 (przelacznik "wolno wycinac las", tylko stary kod)  WORKERS=forest|auto  SEED=18  node ... <tag> <tury>
 */
const C = require('./live-verify-autoimprove-common.cjs');
const SEED = Number(process.env.SEED || 18);
const FOCUS = process.env.FOCUS || 'zywnosc';
const OW = process.env.OW !== '0';
const WOLNO = process.env.WOLNO !== '0';
const WORKERS = process.env.WORKERS || 'forest';

(async () => {
  const tag = process.argv[2] || 'run';
  const turns = Number(process.argv[3] || 6);
  const browser = await C.launch();
  const s = await C.openMenu(browser, { query: '&playtest=1' });
  const out = { tag, focus: FOCUS, ow: OW, wolno: WOLNO, workers: WORKERS, seed: SEED, turns: [] };
  const fname = `sfr-${tag}.json`;
  try {
    await C.clickText(s.page, /Rozpocznij grę/); await C.wait(400);
    await C.gotoStep(s.page, 'Ustawienia');
    await C.setMapSize(s.page, 'Malenki');
    out.start = await C.startFromWizard(s, SEED);
    await C.waitAwaitingCity(s.page);
    await C.foundCapital(s.page);
    // Oferty handlowe AI blokuja koniec tury (opcja "Wymagaj rozpatrzenia ofert") — hak testowy wylacza bramke (nie dotyczy automatu).
    await s.page.evaluate(() => { if (window.__dealsLiveDebug) window.__dealsLiveDebug.setGate(false); });
    out.setup = await s.page.evaluate(({ FOCUS, OW, WOLNO, WORKERS, CITYIDX, PRACA }) => {
      const T = window.__civTest;
      T.unlockAllTech();
      // `foundCity` podnosi populacje istniejacych miast gracza do >=10 (hak) — stolica ma wtedy 10 obywateli do ustawienia.
      T.foundCity(24, 30);
      // trzecie miasto (podnosi populacje Mediolanu do 10): pierwszy kandydat >= 6 heksow od obu poprzednich
      const mine0 = T.state().cities.filter((c) => c.ownerId === 0);
      const far = T.foundCandidates(100000).find((c) => mine0.every((m) => Math.max(Math.abs(m.q - c.q), Math.abs(m.r - c.r)) >= 6));
      if (far) T.foundCity(far.q, far.r);
      if (PRACA !== 'natural') T.setPraca(Number(PRACA)); // PO foundCity (hak podnosi pule do >=1e6)
      const me = T.state().cities.filter((c) => c.ownerId === 0)[Number(CITYIDX)];
      T.setPolicy(0, { focus: FOCUS, tryb: 'auto', onlyWorked: OW, pracaAutoPercent: 100, wolnoWycinacLas: WOLNO });
      let workers = [];
      if (WORKERS === 'forest' || WORKERS === 'offriver' || WORKERS === 'hills') {
        const around = T.around(me.q, me.r, 6, false).filter((h) => h.owner === 0 && h.nakladka === 'las' && !(h.q === me.q && h.r === me.r)
          && (WORKERS !== 'offriver' || !h.naRzece) && (WORKERS !== 'hills' || !/rownina|laka/i.test(h.teren || '')));
        // rzeka i nie-rzeka po rowno (najpierw rownina/laka = baza pod farme)
        const farmBase = (h) => /rownina|laka/i.test(h.teren || '');
        around.sort((a, b) => (farmBase(b) - farmBase(a)) || (a.naRzece === b.naRzece ? 0 : a.naRzece ? -1 : 1));
        const want = Math.min(me.pop, around.length);
        const keys = around.slice(0, want).map((h) => h.q + ',' + h.r);
        T.setCityWorkers(me.id, keys);
      }
      workers = T.getCityWorkers(me.id);
      T.debugOn(); T.drainDecisions();
      return { city: me, workers, policy: T.state().policyMe };
    }, { FOCUS, OW, WOLNO, WORKERS, CITYIDX: process.env.CITYIDX || 0, PRACA: process.env.PRACA || '100000' });
    const snapshot = () => s.page.evaluate(({ cityId }) => {
      const T = window.__civTest;
      const st = T.state();
      const me = st.cities.find((c) => c.id === cityId);
      const workers = T.getCityWorkers(cityId);
      const own = T.around(me.q, me.r, 8, false).filter((h) => h.owner === 0);
      const wk = new Set(workers);
      const forestWorked = own.filter((h) => wk.has(h.q + ',' + h.r));
      const mineAll = st.cities.filter((c) => c.ownerId === 0);
      const wAll = new Set();
      for (const c of mineAll) { wAll.add(c.q + ',' + c.r); for (const k of T.getCityWorkers(c.id)) wAll.add(k); }
      const foodRe = /^(farma|irygacja|tarasy|bydlo|owce|lama|lodzie_rybackie|warzelnia_soli)$/;
      const foodOffWorked = own.filter((h) => h.layers.some((l) => foodRe.test(l)) && !wAll.has(h.q + ',' + h.r)).length;
      const count = (re) => own.filter((h) => h.layers.some((l) => re.test(l))).length;
      return {
        turn: st.turn, pop: me.pop, praca: st.praca,
        ownedHexes: own.length, foodOffWorked,
        forestOwned: own.filter((h) => h.nakladka === 'las').length,
        clearingNow: own.filter((h) => h.clearing).length,
        farms: count(/^farma$/), irrigation: count(/^irygacja$/), herds: count(/^(bydlo|owce|lama)$/),
        workedHexes: forestWorked.map((h) => [h.q, h.r, h.teren, h.nakladka, h.naRzece ? 1 : 0, h.layers.join('+'), h.clearing ? 1 : 0]),
        decisions: T.drainDecisions().filter((d) => d.cityId === cityId),
      };
    }, { cityId: out.setup.city.id });
    // Pomiar AI (REALNA tura AI w main.ts): ulepszenia zywnosciowe poza polami z obywatelami + liczba lasow w terytorium AI.
    const aiSnapshot = () => s.page.evaluate(() => {
      const T = window.__civTest;
      const FOOD = /^(farma|irygacja|tarasy|bydlo|owce|lama|lodzie_rybackie|warzelnia_soli)$/;
      const ais = T.state().cities.filter((c) => c.ownerId !== 0 && c.ownerId < 20);
      const owners = new Map();
      for (const c of ais) { if (!owners.has(c.ownerId)) owners.set(c.ownerId, []); owners.get(c.ownerId).push(c); }
      let food = 0, foodOffWorked = 0, forest = 0, camps = 0, campsOffWorked = 0, cities = 0;
      const seen = new Set();
      for (const [oid, cs] of owners) {
        const worked = new Set();
        for (const c of cs) { cities++; worked.add(c.q + ',' + c.r); for (const k of T.getCityWorkers(c.id)) worked.add(k); }
        for (const c of cs) {
          for (const h of T.around(c.q, c.r, 7, false)) {
            const k = h.q + ',' + h.r;
            if (seen.has(k) || h.owner !== oid) continue;
            seen.add(k);
            if (h.nakladka === 'las') forest++;
            for (const l of h.layers) {
              if (FOOD.test(l)) { food++; if (!worked.has(k)) foodOffWorked++; }
              if (l === 'oboz_lowiecki') { camps++; if (!worked.has(k)) campsOffWorked++; }
            }
          }
        }
      }
      return { aiCities: cities, aiOwners: owners.size, food, foodOffWorked, forest, camps, campsOffWorked };
    });
    out.ai0 = await aiSnapshot();
    out.turn0 = await snapshot();
    for (let t = 0; t < turns; t++) {
      const r = await C.endTurnAndWait(s);
      const snap = await snapshot();
      const reasons = {};
      for (const d of snap.decisions) {
        if (d.scope !== 'las') continue;
        const k = d.reason + (d.verdict ? '|' + d.verdict : '');
        reasons[k] = (reasons[k] || 0) + 1;
      }
      const picked = snap.decisions.filter((d) => d.scope === 'las' && d.verdict === 'wybrany').map((d) => d.hex);
      delete snap.decisions;
      out.turns.push({ ok: r.ok, end: r.ok ? undefined : r, ms: r.ms, ...snap, reasons, picked });
      C.save(fname, out);
      if (!r.ok) break;
    }
    out.aiEnd = await aiSnapshot();
  } catch (e) { out.error = String(e.stack || e); }
  out.pageErrors = s.errors.slice(0, 10);
  C.save(fname, out);
  const last = out.turns[out.turns.length - 1] || {};
  console.log(JSON.stringify({ tag, error: out.error, turns: out.turns.length, last: { ...last, workedHexes: undefined, reasons: undefined } }));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(2); });
