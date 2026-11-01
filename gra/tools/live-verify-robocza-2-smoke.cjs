'use strict';
/**
 * live-verify-robocza-2-smoke.cjs — R-WEB-LIVE-VERIFY-ROBOCZA-2-Q1, T5 (smoke rozgrywki) + T4 (kontynenty: stan po 30 turach).
 * Kreator (Standardowy, Kontynenty, domyslne) -> Start -> stolica -> polityka auto-ulepszen (tryb auto) przez REALNY restoreGameFromSave
 * -> N tur obserwatora (gracz konczy ture) -> w turze SAVE_AT zapis->wczytanie (REALNA sekwencja buildSaveGameSnapshot -> JSON -> restoreGameFromSave,
 * hak roundTrip) -> dalsze tury. Zbiera: pageerror/console.error, czas tury, miasta AI per tura, warstwy ulepszen wokol stolicy (tury 0-10),
 * snapshot terenu w turze 30 (bieguny).
 * Usage: NODE_PATH=/opt/node-tools/node_modules node gra/tools/live-verify-robocza-2-smoke.cjs [seed=1001] [turns=40] [saveAt=20] [extraAfterLoad=10]
 */
const fs = require('fs');
const C = require('./live-verify-robocza-2-common.cjs');
const SEED = Number(process.argv[2] || 1001), TURNS = Number(process.argv[3] || 40), SAVE_AT = Number(process.argv[4] || 20);
const NAME = `smoke2-kontynenty${SEED}`;
const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : null; };

(async () => {
  const browser = await C.launch();
  const s = await C.openMenu(browser);
  const { page } = s;
  const out = { seed: SEED, turnsPlanned: TURNS, saveAt: SAVE_AT, ok: false, turnLog: [], layersLog: [] };
  try {
    await C.clickText(page, /Rozpocznij grę/); await C.wait(400);
    await C.gotoStep(page, 'Ustawienia');
    out.okType = await C.setWorldType(page, 'Kontynenty');
    const grid = await C.gridRows(page);
    out.uiSize = C.valueOf(grid, 'Rozmiar mapy'); out.uiLand = C.valueOf(grid, 'Udział lądu na mapie');
    const start = await C.startFromWizard(s, SEED); Object.assign(out, start);
    await C.waitAwaitingCity(page);
    let st = await C.foundCapital(page);
    out.menuCivId = st.menuCivId;
    out.start = C.analyse(st, await C.snapshotStats(page, []));
    console.log(`[smoke] start capMin=${out.start.capMin} caps=${out.start.capsCount} aiCities=${out.start.aiCitiesTotal} land=${out.start.landPct}%`);
    await page.screenshot({ path: `${C.EVID}/${NAME}-start.png` });
    // polityka auto-ulepszen gracza (tryb auto) + odblokowanie tech (fixture: farma dostepna od startu)
    const policy = { focus: 'zrownowazone', tryb: 'auto', onlyWorked: true, pracaAutoPercent: 33, wolnoWycinacLas: false };
    await page.evaluate((p) => { window.__buildRequestTestDebug.unlockAllTech(); window.__pracaPoolSaveLoadTestDebug.roundTripMeta({ ulepszeniaEmpireByOwner: [[0, p]] }); }, policy);
    await C.wait(500);
    const city = st.cities.find((c) => c.ownerId === 0);
    out.capital = { q: city.q, r: city.r };
    const R = 5;
    const scan = () => page.evaluate(({ cq, cr, R }) => {
      const o = {};
      for (let dq = -R; dq <= R; dq++) for (let dr = -R; dr <= R; dr++) {
        if (Math.abs(dq + dr) > R) continue;
        const q = cq + dq, r = cr + dr;
        const l = window.__buildRequestTestDebug.getPlacedLayers(q, r);
        if (l && l.length) o[q + ',' + r] = l.slice();
      }
      return o;
    }, { cq: city.q, cr: city.r, R });
    let prev = await scan();
    for (let t = 0; t < TURNS; t++) {
      const r = await C.endTurnAndWait(s, 480000);
      const cur = await page.evaluate(() => { const d = window.__cityStateStartUnitsTestDebug.dumpState(); return { turn: d.turn, ai: d.cities.filter((c) => c.ownerId !== 0).length, mine: d.cities.filter((c) => c.ownerId === 0).length, units: d.units.length }; });
      const lay = await scan(); const added = [];
      for (const [hk, v] of Object.entries(lay)) for (const k of v) if (!(prev[hk] || []).includes(k)) added.push(k + '@' + hk);
      prev = lay;
      out.turnLog.push({ ...r, ...cur, errorsSoFar: s.errors.length });
      if (added.length) out.layersLog.push({ turnTo: cur.turn, added });
      if (!r.ok) { out.stalledAt = t; await page.screenshot({ path: `${C.EVID}/${NAME}-stall.png` }); break; }
      if (cur.turn === 31 || (t + 1 === 30)) { // stan po 30 turach obserwatora (do T4)
        out.at30 = C.analyse(await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState()), await C.snapshotStats(page, []));
      }
      if (t + 1 === SAVE_AT) {
        const before = await page.evaluate(() => { const d = window.__cityStateStartUnitsTestDebug.dumpState(); return { turn: d.turn, cities: d.cities.length, units: d.units.length }; });
        let err = null;
        try { await page.evaluate(() => window.__pracaPoolSaveLoadTestDebug.roundTrip()); } catch (e) { err = String(e.message || e); }
        await C.wait(1500);
        const after = await page.evaluate(() => { const d = window.__cityStateStartUnitsTestDebug.dumpState(); return { turn: d.turn, cities: d.cities.length, units: d.units.length, awaiting: d.awaitingFirstPlayerCity }; });
        out.saveLoad = { atTurnsDone: t + 1, before, after, err, same: before.turn === after.turn && before.cities === after.cities && before.units === after.units };
        console.log('[smoke] zapis->wczytanie', JSON.stringify(out.saveLoad));
        await page.screenshot({ path: `${C.EVID}/${NAME}-po-wczytaniu.png` });
        prev = await scan();
      }
      C.save(`${NAME}.json`, out);
      console.log(`[smoke] tura ${cur.turn} ok=${r.ok} ms=${r.ms} aiCities=${cur.ai} bledy=${s.errors.length}`);
    }
    out.ok = true;
    out.end = await page.evaluate(() => { const d = window.__cityStateStartUnitsTestDebug.dumpState(); return { turn: d.turn, ai: d.cities.filter((c) => c.ownerId !== 0).length, mine: d.cities.filter((c) => c.ownerId === 0).length }; });
    out.turnMsMedian = median(out.turnLog.filter((x) => x.ok).map((x) => x.ms));
    await page.screenshot({ path: `${C.EVID}/${NAME}-end.png` });
  } catch (e) { out.error = String(e.message || e); console.error('[smoke] blad', out.error); }
  out.pageErrors = s.errors.slice(0, 20); out.pageErrorsN = s.errors.length;
  C.save(`${NAME}.json`, out);
  fs.writeFileSync(`${C.EVID}/${NAME}.DONE`, String(out.ok));
  await browser.close();
})().catch((e) => { console.error('[smoke] fatal:', e); process.exit(2); });
